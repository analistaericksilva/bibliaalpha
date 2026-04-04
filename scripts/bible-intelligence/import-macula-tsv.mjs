import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { parseReferenceToProject } from "./book-id-map.mjs";

const args = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const idx = args.indexOf(flag);
  return idx >= 0 && args[idx + 1] ? path.resolve(args[idx + 1]) : fallback;
};

const inputs = [
  {
    dataset: "macula-hebrew",
    language: "hebrew",
    file: argValue("--hebrew", path.resolve(process.cwd(), "datasets", "macula-hebrew", "WLC", "tsv", "macula-hebrew.tsv")),
  },
  {
    dataset: "macula-greek",
    language: "greek",
    file: argValue("--greek-nestle", path.resolve(process.cwd(), "datasets", "macula-greek", "Nestle1904", "tsv", "macula-greek-Nestle1904.tsv")),
  },
  {
    dataset: "macula-greek",
    language: "greek",
    file: argValue("--greek-sbl", path.resolve(process.cwd(), "datasets", "macula-greek", "SBLGNT", "tsv", "macula-greek-SBLGNT.tsv")),
  },
];

const outDir = path.join(process.cwd(), "data", "bible-intelligence", "macula");
const outWordsCsv = path.join(outDir, "macula-word-features.csv");
const outRelationsCsv = path.join(outDir, "macula-syntactic-relations.csv");
const outSql = path.join(outDir, "macula-import.sql");

const wordHeader = [
  "book_id",
  "chapter",
  "verse",
  "token_index",
  "language",
  "xml_id",
  "surface",
  "lemma",
  "transliteration",
  "strongs",
  "morphology",
  "pos",
  "semantic_role",
  "semantic_domain",
  "semantic_frame",
  "gloss",
  "contextual_gloss",
  "source_dataset",
  "raw",
];

const relationHeader = [
  "book_id",
  "chapter",
  "verse",
  "language",
  "token_xml_id",
  "relation_type",
  "frame",
  "subject_ref",
  "participant_ref",
  "target_ref",
  "source_dataset",
  "raw",
];

const csvEscape = (value) => {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const parseTokenIndex = (refValue, xmlId, fallbackCounter) => {
  const fromRef = String(refValue || "").match(/!(\d+)$/);
  if (fromRef) return Number(fromRef[1]);
  const fromXml = String(xmlId || "").match(/(\d{2,})$/);
  if (fromXml) return Number(fromXml[1]);
  return fallbackCounter;
};

async function processFile(config, onWord, onRelation) {
  const stream = createReadStream(config.file, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let headers = [];
  let firstLine = true;
  let lineNumber = 0;
  let wordCount = 0;
  let relationCount = 0;
  let skipped = 0;
  const verseCounters = new Map();

  for await (const line of rl) {
    lineNumber += 1;
    if (!line.trim()) continue;

    if (firstLine) {
      headers = line.split("\t");
      firstLine = false;
      continue;
    }

    try {
      const cols = line.split("\t");
      const row = {};
      for (let i = 0; i < headers.length; i += 1) {
        row[headers[i]] = cols[i] || "";
      }

      const parsedRef = parseReferenceToProject(row.ref);
      if (!parsedRef) {
        skipped += 1;
        continue;
      }

      const verseKey = `${parsedRef.bookId}:${parsedRef.chapter}:${parsedRef.verse}`;
      const nextCounter = (verseCounters.get(verseKey) || 0) + 1;
      verseCounters.set(verseKey, nextCounter);

      const tokenIndex = parseTokenIndex(row.ref, row["xml:id"], nextCounter);
      const pos = row.pos || row.class || row.type || "";
      const gloss = row.gloss || "";
      const contextualGloss = row.english || row.contextual || "";
      const semanticRole = row.role || "";
      const semanticDomain = row.domain || row.lexdomain || "";
      const semanticFrame = row.frame || "";

      const raw = JSON.stringify({
        ref: row.ref,
        text: row.text,
        after: row.after,
        mandarin: row.mandarin,
        degree: row.degree,
        person: row.person,
        gender: row.gender,
        number: row.number,
        case: row.case,
        tense: row.tense,
        mood: row.mood,
        voice: row.voice,
        ln: row.ln,
        type: row.type,
        class: row.class,
        extends: row.extends,
      });

      const wordRow = [
        parsedRef.bookId,
        parsedRef.chapter,
        parsedRef.verse,
        tokenIndex,
        config.language,
        row["xml:id"],
        row.text || row.normalized || row.lemma || "",
        row.lemma || row.stronglemma || "",
        row.transliteration || "",
        row.strong || row.strongnumberx || row.greekstrong || "",
        row.morph || "",
        pos,
        semanticRole,
        semanticDomain,
        semanticFrame,
        gloss,
        contextualGloss,
        config.dataset,
        raw,
      ];

      onWord(wordRow.map(csvEscape).join(","));
      wordCount += 1;

      if (semanticFrame || row.subjref || row.referent || row.participantref) {
        const relationRow = [
          parsedRef.bookId,
          parsedRef.chapter,
          parsedRef.verse,
          config.language,
          row["xml:id"],
          semanticRole,
          semanticFrame,
          row.subjref || "",
          row.participantref || row.referent || "",
          row.extends || "",
          config.dataset,
          raw,
        ];

        onRelation(relationRow.map(csvEscape).join(","));
        relationCount += 1;
      }
    } catch (error) {
      skipped += 1;
      if (skipped < 5) {
        console.warn(`Linha ignorada em ${config.file}:${lineNumber} -> ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  return { wordCount, relationCount, skipped };
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const wordWriter = createWriteStream(outWordsCsv, { encoding: "utf-8" });
  const relationWriter = createWriteStream(outRelationsCsv, { encoding: "utf-8" });

  wordWriter.write(`${wordHeader.join(",")}\n`);
  relationWriter.write(`${relationHeader.join(",")}\n`);

  let totalWords = 0;
  let totalRelations = 0;
  let totalSkipped = 0;

  for (const input of inputs) {
    try {
      const { wordCount, relationCount, skipped } = await processFile(
        input,
        (line) => wordWriter.write(`${line}\n`),
        (line) => relationWriter.write(`${line}\n`),
      );

      totalWords += wordCount;
      totalRelations += relationCount;
      totalSkipped += skipped;

      console.log(`Processado ${input.dataset} (${input.language}): ${wordCount} palavras, ${relationCount} relações`);
    } catch (error) {
      console.warn(`Ignorando ${input.file}: ${error instanceof Error ? error.message : error}`);
    }
  }

  await new Promise((resolve) => wordWriter.end(resolve));
  await new Promise((resolve) => relationWriter.end(resolve));

  const sql = `-- Importação MACULA (gerado automaticamente)

CREATE TEMP TABLE tmp_macula_words (
  book_id text,
  chapter integer,
  verse integer,
  token_index integer,
  language text,
  xml_id text,
  surface text,
  lemma text,
  transliteration text,
  strongs text,
  morphology text,
  pos text,
  semantic_role text,
  semantic_domain text,
  semantic_frame text,
  gloss text,
  contextual_gloss text,
  source_dataset text,
  raw jsonb
);

CREATE TEMP TABLE tmp_macula_relations (
  book_id text,
  chapter integer,
  verse integer,
  language text,
  token_xml_id text,
  relation_type text,
  frame text,
  subject_ref text,
  participant_ref text,
  target_ref text,
  source_dataset text,
  raw jsonb
);

-- Em psql local:
-- \\copy tmp_macula_words FROM '${outWordsCsv.replace(/\\/g, "\\\\")}' WITH (FORMAT csv, HEADER true);
-- \\copy tmp_macula_relations FROM '${outRelationsCsv.replace(/\\/g, "\\\\")}' WITH (FORMAT csv, HEADER true);

INSERT INTO public.macula_word_features (
  book_id, chapter, verse, token_index, language, xml_id, surface, lemma,
  transliteration, strongs, morphology, pos, semantic_role, semantic_domain,
  semantic_frame, gloss, contextual_gloss, source_dataset, raw
)
SELECT
  book_id, chapter, verse, token_index, language, xml_id, surface, lemma,
  transliteration, strongs, morphology, pos, semantic_role, semantic_domain,
  semantic_frame, gloss, contextual_gloss, source_dataset, raw
FROM tmp_macula_words
ON CONFLICT (book_id, chapter, verse, token_index, language, source_dataset)
DO UPDATE SET
  surface = EXCLUDED.surface,
  lemma = EXCLUDED.lemma,
  transliteration = EXCLUDED.transliteration,
  strongs = EXCLUDED.strongs,
  morphology = EXCLUDED.morphology,
  pos = EXCLUDED.pos,
  semantic_role = EXCLUDED.semantic_role,
  semantic_domain = EXCLUDED.semantic_domain,
  semantic_frame = EXCLUDED.semantic_frame,
  gloss = EXCLUDED.gloss,
  contextual_gloss = EXCLUDED.contextual_gloss,
  raw = EXCLUDED.raw;

INSERT INTO public.macula_syntactic_relations (
  book_id, chapter, verse, language, token_xml_id, relation_type, frame,
  subject_ref, participant_ref, target_ref, source_dataset, raw
)
SELECT
  book_id, chapter, verse, language, token_xml_id, relation_type, frame,
  subject_ref, participant_ref, target_ref, source_dataset, raw
FROM tmp_macula_relations;
`;

  await writeFile(outSql, sql, "utf-8");

  console.log("Arquivos gerados:");
  console.log(`- ${outWordsCsv}`);
  console.log(`- ${outRelationsCsv}`);
  console.log(`- ${outSql}`);
  console.log(`Total de palavras: ${totalWords}`);
  console.log(`Total de relações: ${totalRelations}`);
  console.log(`Total de linhas ignoradas: ${totalSkipped}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
