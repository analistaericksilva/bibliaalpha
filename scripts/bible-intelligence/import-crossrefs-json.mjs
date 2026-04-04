import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseReferenceToProject } from "./book-id-map.mjs";

const datasetDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(process.cwd(), "datasets", "bible-cross-reference-json");

const outDir = path.join(process.cwd(), "data", "bible-intelligence", "crossrefs");
const outCsv = path.join(outDir, "verse-cross-reference-edges.csv");
const outSql = path.join(outDir, "verse-cross-reference-edges.sql");

const csvHeader = [
  "source_book_id",
  "source_chapter",
  "source_verse",
  "target_book_id",
  "target_chapter",
  "target_verse",
  "source_dataset",
  "weight",
  "confidence",
];

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

async function main() {
  const files = (await readdir(datasetDir))
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => Number(a.replace(".json", "")) - Number(b.replace(".json", "")));

  if (!files.length) {
    throw new Error(`Nenhum arquivo JSON encontrado em ${datasetDir}`);
  }

  const edgeWeight = new Map();
  let sourceVerses = 0;
  let skipped = 0;

  for (const fileName of files) {
    const filePath = path.join(datasetDir, fileName);
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);

    for (const entry of Object.values(parsed)) {
      const sourceRef = parseReferenceToProject(entry?.v);
      if (!sourceRef) {
        skipped += 1;
        continue;
      }

      sourceVerses += 1;
      const refs = entry?.r || {};

      for (const targetText of Object.values(refs)) {
        const targetRef = parseReferenceToProject(targetText);
        if (!targetRef) {
          skipped += 1;
          continue;
        }

        const key = [
          sourceRef.bookId,
          sourceRef.chapter,
          sourceRef.verse,
          targetRef.bookId,
          targetRef.chapter,
          targetRef.verse,
        ].join(":");

        edgeWeight.set(key, (edgeWeight.get(key) || 0) + 1);
      }
    }
  }

  await mkdir(outDir, { recursive: true });

  const rows = [csvHeader.join(",")];
  for (const [key, weight] of edgeWeight.entries()) {
    const [sourceBookId, sourceChapter, sourceVerse, targetBookId, targetChapter, targetVerse] = key.split(":");

    rows.push([
      csvEscape(sourceBookId),
      csvEscape(sourceChapter),
      csvEscape(sourceVerse),
      csvEscape(targetBookId),
      csvEscape(targetChapter),
      csvEscape(targetVerse),
      csvEscape("bible-cross-reference-json"),
      csvEscape(weight),
      csvEscape(1),
    ].join(","));
  }

  await writeFile(outCsv, `${rows.join("\n")}\n`, "utf-8");

  const sql = `-- Importação de referências cruzadas (gerado automaticamente)
-- Dataset base: https://github.com/josephilipraja/bible-cross-reference-json
-- Execute em ambiente psql/supabase SQL editor.

CREATE TEMP TABLE tmp_cross_edges (
  source_book_id text,
  source_chapter integer,
  source_verse integer,
  target_book_id text,
  target_chapter integer,
  target_verse integer,
  source_dataset text,
  weight integer,
  confidence numeric(5,4)
);

-- Em psql local, use:\n-- \\copy tmp_cross_edges FROM '${outCsv.replace(/\\/g, "\\\\")}' WITH (FORMAT csv, HEADER true);

INSERT INTO public.verse_cross_reference_edges (
  source_book_id,
  source_chapter,
  source_verse,
  target_book_id,
  target_chapter,
  target_verse,
  source_dataset,
  weight,
  confidence
)
SELECT
  source_book_id,
  source_chapter,
  source_verse,
  target_book_id,
  target_chapter,
  target_verse,
  source_dataset,
  weight,
  confidence
FROM tmp_cross_edges
ON CONFLICT (
  source_book_id,
  source_chapter,
  source_verse,
  target_book_id,
  target_chapter,
  target_verse,
  source_dataset
)
DO UPDATE SET
  weight = EXCLUDED.weight,
  confidence = EXCLUDED.confidence;
`;

  await writeFile(outSql, sql, "utf-8");

  console.log(`Arquivos gerados:`);
  console.log(`- ${outCsv}`);
  console.log(`- ${outSql}`);
  console.log(`Versículos processados: ${sourceVerses}`);
  console.log(`Arestas únicas: ${edgeWeight.size}`);
  console.log(`Entradas ignoradas: ${skipped}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
