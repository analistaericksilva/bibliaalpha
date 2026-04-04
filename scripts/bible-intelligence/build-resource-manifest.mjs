import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const sources = [
  {
    id: "awesome-bible-developer-resources",
    title: "Awesome Bible Developer Resources",
    url: "https://raw.githubusercontent.com/biblenerd/awesome-bible-developer-resources/main/README.md",
    focusTags: ["hub", "commentary", "dictionary", "cross-reference", "corpus"],
  },
  {
    id: "awesome-bible-data",
    title: "Awesome Bible Data",
    url: "https://raw.githubusercontent.com/jcuenod/awesome-bible-data/main/README.md",
    focusTags: ["cross-reference", "patristics", "parallel", "alignment", "dictionary"],
  },
  {
    id: "macula-hebrew",
    title: "Macula Hebrew",
    url: "https://raw.githubusercontent.com/Clear-Bible/macula-hebrew/main/README.md",
    focusTags: ["hebrew", "morphology", "syntax", "semantic-role"],
  },
  {
    id: "macula-greek",
    title: "Macula Greek",
    url: "https://raw.githubusercontent.com/Clear-Bible/macula-greek/main/README.md",
    focusTags: ["greek", "morphology", "syntax", "semantic-role"],
  },
];

const outDir = path.join(process.cwd(), "data", "bible-intelligence");
const outFile = path.join(outDir, "resource-manifest.json");

const linkRegex = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g;

function deriveTags(line) {
  const tags = [];
  const lower = line.toLowerCase();
  if (lower.includes("cross")) tags.push("cross-reference");
  if (lower.includes("dictionary") || lower.includes("lexicon")) tags.push("dictionary");
  if (lower.includes("comment")) tags.push("commentary");
  if (lower.includes("patrist")) tags.push("patristics");
  if (lower.includes("parallel")) tags.push("parallel-corpus");
  if (lower.includes("align")) tags.push("alignment");
  if (lower.includes("morph")) tags.push("morphology");
  if (lower.includes("syntax")) tags.push("syntax");
  if (lower.includes("semantic")) tags.push("semantics");
  return tags;
}

function parseMarkdownLinks(markdown, sourceId) {
  const lines = markdown.split(/\r?\n/);
  const links = [];
  let section = "root";

  for (const line of lines) {
    const heading = line.match(/^#{2,4}\s+(.+)$/);
    if (heading) {
      section = heading[1].trim();
      continue;
    }

    const matches = [...line.matchAll(linkRegex)];
    if (!matches.length) continue;

    for (const match of matches) {
      const url = match[1];
      const titleMatch = line.match(/\[([^\]]+)\]\(https?:\/\/[^)\s]+\)/);
      const title = titleMatch?.[1] || url;
      links.push({
        sourceId,
        section,
        title,
        url,
        tags: deriveTags(line),
      });
    }
  }

  const dedup = new Map();
  for (const item of links) {
    const key = `${item.url}::${item.section}`;
    if (!dedup.has(key)) dedup.set(key, item);
  }

  return [...dedup.values()];
}

async function main() {
  const manifest = {
    generatedAt: new Date().toISOString(),
    strategy: "Build a 66-book intelligence stack from curated hubs + MACULA linguistics",
    sources: [],
    totals: {
      links: 0,
      sections: 0,
    },
  };

  for (const source of sources) {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "BibliaAlpha-Upgrader" },
    });

    if (!response.ok) {
      throw new Error(`Falha ao baixar ${source.id}: ${response.status}`);
    }

    const markdown = await response.text();
    const links = parseMarkdownLinks(markdown, source.id);
    const sections = [...new Set(links.map((item) => item.section))];

    manifest.sources.push({
      id: source.id,
      title: source.title,
      url: source.url,
      focusTags: source.focusTags,
      linkCount: links.length,
      sections,
      links,
    });

    manifest.totals.links += links.length;
    manifest.totals.sections += sections.length;
  }

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`Manifesto criado em: ${outFile}`);
  console.log(`Total de links catalogados: ${manifest.totals.links}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
