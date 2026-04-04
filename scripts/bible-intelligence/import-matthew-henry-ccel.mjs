import fs from "node:fs/promises";
import path from "node:path";
import {
  AUTHOR,
  TRADITION,
  DATASET_ID,
  DEFAULT_TAGS,
  parseArgs,
  normalizeText,
  sha256,
  fetchHtml,
  getBookPrefixFromUrl,
  extractBookLandingUrls,
  extractChapterFromPage,
  extractCommentaryBlocks,
  parseBibleRangeFromId,
  parseVerseRangeFromPassage,
  extractBookCodeFromBlock,
  mapBookCodeToProjectId,
  extractTitle,
  extractCommentaryText,
  buildUpsertSql,
  crawlBookPages,
  buildSourceUrl,
} from "./mh-ccel-utils.mjs";

const DEFAULT_OUT_DIR = path.join("data", "bible-intelligence", "matthew-henry");

async function main() {
  const opts = parseArgs(process.argv.slice(2), DEFAULT_OUT_DIR);
  const startedAt = Date.now();

  await fs.mkdir(opts.outDir, { recursive: true });

  console.log(`Index: ${opts.indexUrl}`);
  const indexHtml = await fetchHtml(opts.indexUrl);

  let bookLandingUrls = extractBookLandingUrls(indexHtml, opts.indexUrl);
  if (opts.bookLimit && Number.isInteger(opts.bookLimit)) {
    bookLandingUrls = bookLandingUrls.slice(0, opts.bookLimit);
  }

  const recordsBySourceItem = new Map();
  const warnings = [];
  let pagesFetched = 0;

  for (const landingUrl of bookLandingUrls) {
    const prefix = getBookPrefixFromUrl(landingUrl) || "";
    const urlBookToken = (prefix.split(".")[1] || "").trim();

    console.log(`\n[BOOK] ${landingUrl}`);
    const pages = await crawlBookPages(landingUrl, opts.pageLimitPerBook);
    pagesFetched += pages.length;

    for (const page of pages) {
      const pageChapter = extractChapterFromPage(page.html);
      const blocks = extractCommentaryBlocks(page.html);
      if (blocks.length === 0) continue;

      for (let i = 0; i < blocks.length; i += 1) {
        const block = blocks[i];
        const sourceItemId = block.id || `${sha256(page.url)}-${i + 1}`;
        const sourceUrl = buildSourceUrl(page.url, block.id, i);

        const rangeById = parseBibleRangeFromId(block.id);
        const fallbackRange = parseVerseRangeFromPassage(block.raw);

        const rawBookCode = rangeById?.startBook || extractBookCodeFromBlock(block.raw, urlBookToken);
        const bookId = mapBookCodeToProjectId(rawBookCode);

        if (!bookId) {
          warnings.push(`book-id-unmapped :: ${rawBookCode} :: ${sourceUrl}`);
          continue;
        }

        let chapter = rangeById?.startChapter ?? pageChapter;
        let verseStart = rangeById?.startVerse ?? fallbackRange?.verseStart;
        let verseEnd = rangeById?.endVerse ?? fallbackRange?.verseEnd;

        if (rangeById && rangeById.startChapter !== rangeById.endChapter) {
          warnings.push(`cross-chapter-skipped :: ${block.id} :: ${sourceUrl}`);
          continue;
        }

        if (!Number.isInteger(chapter) || !Number.isInteger(verseStart)) {
          warnings.push(`missing-range :: ${sourceUrl}`);
          continue;
        }

        if (!Number.isInteger(verseEnd)) verseEnd = verseStart;
        if (verseEnd < verseStart) [verseStart, verseEnd] = [verseEnd, verseStart];

        const title = extractTitle(block.raw);
        const content = extractCommentaryText(block.raw);
        if (!content || content.length < 30) {
          warnings.push(`empty-content :: ${sourceUrl}`);
          continue;
        }

        const contentHash = sha256(normalizeText(content).toLowerCase());

        const record = {
          book_id: bookId,
          chapter,
          verse_start: verseStart,
          verse_end: verseEnd,
          title,
          content,
          author: AUTHOR,
          tradition: TRADITION,
          tags: DEFAULT_TAGS,
          source_dataset: DATASET_ID,
          source_url: sourceUrl,
          source_item_id: sourceItemId,
          content_hash: contentHash,
        };

        const existing = recordsBySourceItem.get(sourceItemId);
        if (!existing || record.content.length > existing.content.length) {
          recordsBySourceItem.set(sourceItemId, record);
        }
      }
    }
  }

  let records = [...recordsBySourceItem.values()];

  if (opts.onlyBookId) {
    records = records.filter((r) => r.book_id === opts.onlyBookId);
  }

  records.sort((a, b) =>
    a.book_id.localeCompare(b.book_id)
    || a.chapter - b.chapter
    || a.verse_start - b.verse_start
    || a.verse_end - b.verse_end
    || a.source_item_id.localeCompare(b.source_item_id)
  );

  const byVerseKey = new Set();
  const deduped = [];
  for (const r of records) {
    const key = [r.source_dataset, r.book_id, r.chapter, r.verse_start, r.verse_end, r.content_hash].join("|");
    if (byVerseKey.has(key)) continue;
    byVerseKey.add(key);
    deduped.push(r);
  }

  const jsonPath = path.join(opts.outDir, "matthew-henry-normalized.json");
  const sqlPath = path.join(opts.outDir, "matthew-henry-upsert.sql");
  const warningsPath = path.join(opts.outDir, "matthew-henry-warnings.log");

  await fs.writeFile(jsonPath, `${JSON.stringify(deduped, null, 2)}\n`, "utf8");
  await fs.writeFile(sqlPath, `${buildUpsertSql(deduped)}\n`, "utf8");
  await fs.writeFile(warningsPath, warnings.join("\n"), "utf8");

  const durationSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log("\n✅ Matthew Henry import bundle generated");
  console.log(`- Books scanned: ${bookLandingUrls.length}`);
  console.log(`- Pages fetched: ${pagesFetched}`);
  console.log(`- Records normalized: ${deduped.length}`);
  console.log(`- Warnings: ${warnings.length}`);
  console.log(`- JSON: ${jsonPath}`);
  console.log(`- SQL: ${sqlPath}`);
  console.log(`- Warnings log: ${warningsPath}`);
  console.log(`- Duration: ${durationSec}s`);
}

main().catch((error) => {
  console.error("❌ Failed to build Matthew Henry bundle:", error);
  process.exit(1);
});
