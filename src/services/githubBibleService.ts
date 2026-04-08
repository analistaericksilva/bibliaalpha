type LanguageNode = {
  language: string;
  id: string;
  versions: Array<{ name: string; id: string }>;
};

export interface ExternalBibleVersion {
  key: string; // ex: "pt-br/arc"
  languageId: string;
  languageName: string;
  versionId: string;
  versionName: string;
  label: string;
}

interface ExternalBookPayload {
  id: string;
  name: string;
  chapters: string[][];
}

const RAW_BASE = "https://raw.githubusercontent.com/maatheusgois/bible/main";
const INDEX_URL = `${RAW_BASE}/sumary/index.json`;
const INDEX_CACHE_KEY = "biblia-alpha:external-bible-index";
const INDEX_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

const SOURCE_BOOK_ID_BY_INTERNAL_ID: Record<string, string> = {
  gn: "gn",
  ex: "ex",
  lv: "lv",
  nm: "nm",
  dt: "dt",
  js: "js",
  jz: "jud",
  rt: "rt",
  "1sm": "1sm",
  "2sm": "2sm",
  "1rs": "1kgs",
  "2rs": "2kgs",
  "1cr": "1ch",
  "2cr": "2ch",
  ed: "ezr",
  ne: "ne",
  et: "et",
  jo: "job", // Jó
  sl: "ps",
  pv: "prv",
  ec: "ec",
  ct: "so",
  is: "is",
  jr: "jr",
  lm: "lm",
  ez: "ez",
  dn: "dn",
  os: "ho",
  jl: "jl",
  am: "am",
  ob: "ob",
  jn: "jn",
  mq: "mi",
  na: "na",
  hc: "hk",
  sf: "zp",
  ag: "hg",
  zc: "zc",
  ml: "ml",
  mt: "mt",
  mc: "mk",
  lc: "lk",
  joo: "jo", // João
  at: "act",
  rm: "rm",
  "1co": "1co",
  "2co": "2co",
  gl: "gl",
  ef: "eph",
  fp: "ph",
  cl: "cl",
  "1ts": "1ts",
  "2ts": "2ts",
  "1tm": "1tm",
  "2tm": "2tm",
  tt: "tt",
  fm: "phm",
  hb: "hb",
  tg: "jm",
  "1pe": "1pe",
  "2pe": "2pe",
  "1jo": "1jo",
  "2jo": "2jo",
  "3jo": "3jo",
  jd: "jd",
  ap: "re",
};

const versionCache = new Map<string, ExternalBibleVersion[]>();
const bookCache = new Map<string, ExternalBookPayload>();

function toVersionLabel(languageId: string, versionId: string, versionName: string) {
  return `${languageId.toUpperCase()} • ${versionId.toUpperCase()} — ${versionName}`;
}

async function loadIndexFromNetwork(): Promise<LanguageNode[]> {
  const response = await fetch(INDEX_URL);
  if (!response.ok) throw new Error(`Falha ao carregar índice de traduções (${response.status})`);
  const payload = (await response.json()) as LanguageNode[];
  localStorage.setItem(
    INDEX_CACHE_KEY,
    JSON.stringify({ timestamp: Date.now(), data: payload })
  );
  return payload;
}

async function loadIndex(): Promise<LanguageNode[]> {
  if (versionCache.size > 0) {
    // já carregado ao menos uma vez na sessão
    const cached = Array.from(versionCache.values())[0];
    if (cached.length > 0) {
      // não precisamos do conteúdo exato aqui, apenas evitamos request desnecessária
    }
  }

  const raw = localStorage.getItem(INDEX_CACHE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { timestamp: number; data: LanguageNode[] };
      if (Array.isArray(parsed.data) && Date.now() - parsed.timestamp < INDEX_CACHE_TTL_MS) {
        return parsed.data;
      }
    } catch {
      // segue para rede
    }
  }

  return loadIndexFromNetwork();
}

export const githubBibleService = {
  getSupportedVersions: async (): Promise<ExternalBibleVersion[]> => {
    if (versionCache.has("all")) return versionCache.get("all")!;

    const index = await loadIndex();
    const versions = index
      .flatMap((lang) =>
        lang.versions.map((version) => ({
          key: `${lang.id}/${version.id}`,
          languageId: lang.id,
          languageName: lang.language,
          versionId: version.id,
          versionName: version.name,
          label: toVersionLabel(lang.id, version.id, version.name),
        }))
      )
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

    versionCache.set("all", versions);
    return versions;
  },

  getChapter: async (
    translationKey: string,
    internalBookId: string,
    chapter: number
  ): Promise<Array<{ verse: number; text: string }>> => {
    const [languageId, versionId] = translationKey.split("/");
    if (!languageId || !versionId) throw new Error("Tradução inválida.");

    const sourceBookId = SOURCE_BOOK_ID_BY_INTERNAL_ID[internalBookId];
    if (!sourceBookId) throw new Error(`Livro não mapeado para fonte externa: ${internalBookId}`);

    const cacheKey = `${translationKey}:${sourceBookId}`;
    let payload = bookCache.get(cacheKey);

    if (!payload) {
      const url = `${RAW_BASE}/versions/${languageId}/${versionId}/${sourceBookId}/${sourceBookId}.json`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Falha ao carregar livro ${sourceBookId} (${response.status})`);
      }
      payload = (await response.json()) as ExternalBookPayload;
      bookCache.set(cacheKey, payload);
    }

    const chapterIndex = chapter - 1;
    const chapterVerses = payload.chapters?.[chapterIndex];

    if (!Array.isArray(chapterVerses)) {
      throw new Error(`Capítulo ${chapter} indisponível em ${translationKey}.`);
    }

    return chapterVerses.map((text, index) => ({
      verse: index + 1,
      text,
    }));
  },
};
