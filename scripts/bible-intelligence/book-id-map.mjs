export const osisToProjectBookId = {
  GEN: "gn",
  EXO: "ex",
  LEV: "lv",
  NUM: "nm",
  DEU: "dt",
  JOS: "js",
  JDG: "jz",
  RUT: "rt",
  '1SA': "1sm",
  '2SA': "2sm",
  '1KI': "1rs",
  '2KI': "2rs",
  '1CH': "1cr",
  '2CH': "2cr",
  EZR: "ed",
  NEH: "ne",
  EST: "et",
  JOB: "jo",
  PSA: "sl",
  PRO: "pv",
  ECC: "ec",
  SNG: "ct",
  ISA: "is",
  JER: "jr",
  LAM: "lm",
  EZK: "ez",
  DAN: "dn",
  HOS: "os",
  JOL: "jl",
  AMO: "am",
  OBA: "ob",
  JON: "jn",
  MIC: "mq",
  NAM: "na",
  HAB: "hc",
  ZEP: "sf",
  HAG: "ag",
  ZEC: "zc",
  MAL: "ml",
  MAT: "mt",
  MRK: "mc",
  MAR: "mc",
  LUK: "lc",
  JHN: "joo",
  JOH: "joo",
  ACT: "at",
  ROM: "rm",
  '1CO': "1co",
  '2CO': "2co",
  GAL: "gl",
  EPH: "ef",
  PHP: "fp",
  PHI: "fp",
  COL: "cl",
  '1TH': "1ts",
  '2TH': "2ts",
  '1TI': "1tm",
  '2TI': "2tm",
  TIT: "tt",
  PHM: "fm",
  HEB: "hb",
  JAS: "tg",
  '1PE': "1pe",
  '2PE': "2pe",
  '1JN': "1jo",
  '2JN': "2jo",
  '3JN': "3jo",
  JUD: "jd",
  REV: "ap",
};

const normalizeCode = (code) =>
  String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "");

export function mapBookCode(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  if (osisToProjectBookId[normalized]) {
    return osisToProjectBookId[normalized];
  }

  if (/^\d[A-Z]{2,3}$/.test(normalized)) {
    const withLeading = `${normalized[0]}${normalized.slice(1)}`;
    return osisToProjectBookId[withLeading] || null;
  }

  return null;
}

export function parseReferenceToProject(ref) {
  const text = String(ref || "").trim();
  if (!text) return null;

  // Formatos suportados:
  // - GEN 1 1
  // - GEN 1:1
  // - MAT 1:1!1 (MACULA)
  const maculaMatch = text.match(/^([1-3]?[A-Z]{2,3})\s+(\d+):(\d+)(?:!\d+)?$/i);
  if (maculaMatch) {
    const bookId = mapBookCode(maculaMatch[1]);
    if (!bookId) return null;
    return {
      bookId,
      chapter: Number(maculaMatch[2]),
      verse: Number(maculaMatch[3]),
    };
  }

  const classicMatch = text.match(/^([1-3]?[A-Z]{2,3})\s+(\d+)\s+(\d+)$/i);
  if (classicMatch) {
    const bookId = mapBookCode(classicMatch[1]);
    if (!bookId) return null;
    return {
      bookId,
      chapter: Number(classicMatch[2]),
      verse: Number(classicMatch[3]),
    };
  }

  const dottedMatch = text.match(/^([1-3]?[A-Z]{2,3})\s+(\d+)[\.:](\d+)$/i);
  if (dottedMatch) {
    const bookId = mapBookCode(dottedMatch[1]);
    if (!bookId) return null;
    return {
      bookId,
      chapter: Number(dottedMatch[2]),
      verse: Number(dottedMatch[3]),
    };
  }

  return null;
}
