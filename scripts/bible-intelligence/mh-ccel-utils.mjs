import crypto from "node:crypto";

export const DEFAULT_INDEX_URL = "https://www.ccel.org/ccel/henry/mhc.i.html";
export const DATASET_ID = "ccel-matthew-henry";
export const AUTHOR = "Matthew Henry";
export const TRADITION = "Reformed";
export const DEFAULT_TAGS = ["commentary", "ccel", "matthew-henry"];

const bibleBookMap = {
  Gen: "gn", Exod: "ex", Lev: "lv", Num: "nm", Deut: "dt", Josh: "js", Judg: "jz", Ruth: "rt",
  "1Sam": "1sm", "2Sam": "2sm", "1Kgs": "1rs", "2Kgs": "2rs", "1Chr": "1cr", "2Chr": "2cr",
  Ezra: "ed", Neh: "ne", Esth: "et", Job: "jo", Ps: "sl", Prov: "pv", Eccl: "ec", Song: "ct",
  Isa: "is", Jer: "jr", Lam: "lm", Ezek: "ez", Dan: "dn", Hos: "os", Joel: "jl", Amos: "am",
  Obad: "ob", Jonah: "jn", Mic: "mq", Nah: "na", Hab: "hc", Zeph: "sf", Hag: "ag", Zech: "zc", Mal: "ml",
  Matt: "mt", Mark: "mc", Luke: "lc", John: "joo", Acts: "at", Rom: "rm", "1Cor": "1co", "2Cor": "2co",
  Gal: "gl", Eph: "ef", Phil: "fp", Col: "cl", "1Thess": "1ts", "2Thess": "2ts", "1Tim": "1tm", "2Tim": "2tm",
  Titus: "tt", Phlm: "fm", Heb: "hb", Jas: "tg", "1Pet": "1pe", "2Pet": "2pe", "1John": "1jo", "2John": "2jo", "3John": "3jo", Jude: "jd", Rev: "ap",
};

export function parseArgs(argv, defaultOutDir) {
  const opts = {
    indexUrl: DEFAULT_INDEX_URL,
    outDir: defaultOutDir,
    bookLimit: null,
    pageLimitPerBook: null,
    onlyBookId: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--index-url") opts.indexUrl = argv[++i];
    else if (a === "--out-dir") opts.outDir = argv[++i];
    else if (a === "--book-limit") opts.bookLimit = Number(argv[++i]);
    else if (a === "--page-limit-per-book") opts.pageLimitPerBook = Number(argv[++i]);
    else if (a === "--book-id") opts.onlyBookId = String(argv[++i]).trim().toLowerCase();
  }
  return opts;
}

export function decodeHtmlEntities(input) {
  return String(input || "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "-")
    .replace(/&hellip;/gi, "…");
}

export function stripHtml(html) {
  return decodeHtmlEntities(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/?p[^>]*>/gi, "\n")
      .replace(/<\/?(li|ul|ol|h[1-6]|div)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}

export function normalizeText(text) {
  return String(text || "").replace(/[\u00A0\s]+/g, " ").trim();
}

export function sha256(text) {
  return crypto.createHash("sha256").update(String(text || "")).digest("hex");
}

export async function fetchHtml(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

export function toAbsoluteUrl(href, currentUrl) {
  try { return new URL(href, currentUrl).href; } catch { return null; }
}

export function getFilename(url) {
  try { return new URL(url).pathname.split("/").pop() || ""; } catch { return ""; }
}

export function getBookPrefixFromUrl(url) {
  const file = getFilename(url);
  const m = file.match(/^(mhc\d+\.[^.]+)\.[^.]+\.html$/i);
  return m ? m[1] : null;
}

export function getNextNavUrl(html, currentUrl) {
  const byName = html.match(/<a[^>]+name="nextNav"[^>]+href="([^"]+)"/i)
    || html.match(/<a[^>]+href="([^"]+)"[^>]+name="nextNav"/i);
  return byName ? toAbsoluteUrl(byName[1], currentUrl) : null;
}

export function extractBookLandingUrls(indexHtml, indexUrl) {
  const links = [];
  for (const m of indexHtml.matchAll(/href=["']([^"']*mhc\d+\.[^.]+\.i\.html)["']/gi)) {
    const abs = toAbsoluteUrl(m[1], indexUrl);
    if (abs) links.push(abs);
  }
  return [...new Set(links)];
}

function romanToInt(roman) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const s = String(roman || "").toUpperCase().trim();
  let total = 0;
  for (let i = 0; i < s.length; i += 1) {
    const curr = map[s[i]] || 0;
    const next = map[s[i + 1]] || 0;
    total += curr < next ? -curr : curr;
  }
  return total || null;
}

export function extractChapterFromPage(html) {
  const m = html.match(/<h3[^>]*>\s*CHAP\.\s*([IVXLCDM]+)\.?\s*<\/h3>/i)
    || html.match(/<h3[^>]*>\s*PSALM\s*([IVXLCDM]+)\.?\s*<\/h3>/i)
    || html.match(/<h3[^>]*>\s*PSALM\s*(\d+)\.?\s*<\/h3>/i);
  if (!m) return null;
  return /^\d+$/.test(m[1]) ? Number(m[1]) : romanToInt(m[1]);
}

function findMatchingDivEnd(html, startIndex) {
  let depth = 0;
  const re = /<div\b|<\/div>/gi;
  re.lastIndex = startIndex;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0].toLowerCase() === "<div" ? 1 : -1;
    if (depth === 0) return re.lastIndex;
  }
  return null;
}

export function extractCommentaryBlocks(html) {
  const blocks = [];
  const startRe = /<div class="Commentary"[^>]*>/gi;
  let match;
  while ((match = startRe.exec(html))) {
    const end = findMatchingDivEnd(html, match.index);
    if (!end) continue;
    const raw = html.slice(match.index, end);
    const id = match[0].match(/id="([^"]+)"/i)?.[1] || null;
    blocks.push({ id, raw });
    startRe.lastIndex = end;
  }
  return blocks;
}

export function parseBibleRangeFromId(blockId) {
  if (!blockId) return null;
  const clean = blockId.replace(/^Bible:/i, "");
  const m = clean.match(/^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)(?:-([1-3]?[A-Za-z]+)\.(\d+)\.(\d+))?$/);
  if (!m) return null;
  return {
    startBook: m[1],
    endBook: m[4] || m[1],
    startChapter: Number(m[2]),
    endChapter: m[5] ? Number(m[5]) : Number(m[2]),
    startVerse: Number(m[3]),
    endVerse: m[6] ? Number(m[6]) : Number(m[3]),
  };
}

export function extractBookCodeFromBlock(blockRaw, fallbackFromUrl) {
  return blockRaw.match(/id="Bible:([^"\.]+)\./i)?.[1]
    || blockRaw.match(/asv\.([1-3]?[A-Za-z]+)\.\d+\.html/i)?.[1]
    || fallbackFromUrl;
}

export function parseVerseRangeFromPassage(blockRaw) {
  const passages = [...blockRaw.matchAll(/<p class="passage"[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1]);
  if (passages.length === 0) return null;
  const plain = stripHtml(passages.join(" "));
  const nums = [...plain.matchAll(/(?:^|\s)(\d{1,3})(?=\s)/g)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 176);
  if (nums.length === 0) return null;
  return { verseStart: nums[0], verseEnd: nums[nums.length - 1] };
}

export function extractTitle(blockRaw) {
  const m = blockRaw.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
  return m ? normalizeText(stripHtml(m[1])) : null;
}

export function extractCommentaryText(blockRaw) {
  const withoutPassages = blockRaw
    .replace(/<p class="passage"[\s\S]*?<\/p>/gi, " ")
    .replace(/<h4[\s\S]*?<\/h4>/gi, " ");
  let text = stripHtml(withoutPassages);
  if (!text || text.length < 50) text = stripHtml(blockRaw);
  return normalizeText(text);
}

export function mapBookCodeToProjectId(code) {
  if (!code) return null;
  return bibleBookMap[String(code).replace(/\s+/g, "")] || null;
}

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function buildUpsertSql(records) {
  const chunks = [
    "-- Generated by scripts/bible-intelligence/import-matthew-henry-ccel.mjs",
    "-- Dataset: ccel-matthew-henry\n",
  ];
  const BATCH = 200;
  for (let i = 0; i < records.length; i += BATCH) {
    const slice = records.slice(i, i + BATCH);
    const valuesSql = slice.map((r) => `(${[
      sqlString(r.book_id), r.chapter, r.verse_start, r.verse_end, sqlString(r.title), sqlString(r.content),
      sqlString(r.author), sqlString(r.tradition), `ARRAY[${r.tags.map((t) => sqlString(t)).join(", ")}]::text[]`,
      sqlString(r.source_dataset), sqlString(r.source_url), sqlString(r.source_item_id), sqlString(r.content_hash),
    ].join(", ")})`).join(",\n");

    chunks.push(`INSERT INTO public.verse_commentary_sources (
  book_id, chapter, verse_start, verse_end, title, content, author, tradition, tags,
  source_dataset, source_url, source_item_id, content_hash
) VALUES
${valuesSql}
ON CONFLICT (source_dataset, source_item_id)
DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  author = EXCLUDED.author,
  tradition = EXCLUDED.tradition,
  tags = EXCLUDED.tags,
  source_url = EXCLUDED.source_url,
  content_hash = EXCLUDED.content_hash,
  verse_start = EXCLUDED.verse_start,
  verse_end = EXCLUDED.verse_end,
  chapter = EXCLUDED.chapter,
  book_id = EXCLUDED.book_id;\n`);
  }
  return chunks.join("\n");
}

export async function crawlBookPages(landingUrl, pageLimitPerBook) {
  const pages = [];
  const visited = new Set();
  const prefix = getBookPrefixFromUrl(landingUrl);
  let url = landingUrl;

  while (url && !visited.has(url)) {
    visited.add(url);
    const file = getFilename(url);
    if (prefix && !file.startsWith(`${prefix}.`)) break;

    const html = await fetchHtml(url);
    pages.push({ url, html });
    if (pageLimitPerBook && pages.length >= pageLimitPerBook) break;

    const next = getNextNavUrl(html, url);
    if (!next) break;
    if (prefix && !getFilename(next).startsWith(`${prefix}.`)) break;
    url = next;
  }

  return pages;
}

export function buildSourceUrl(pageUrl, blockId, index) {
  return blockId ? `${pageUrl}#${encodeURIComponent(blockId)}` : `${pageUrl}#block-${index + 1}`;
}
