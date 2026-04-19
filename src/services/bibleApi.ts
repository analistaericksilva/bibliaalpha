const BIBLE_API_BASE = 'https://bible.helloao.org/api';
const TRANSLATION_ID = 'por_blj';
const COMMENTARIES_IDS = ['adam-clarke', 'jamieson-fausset-brown', 'matthew-henry', 'john-gill', 'tyndale'];

export interface Book {
  id: string;
  name: string;
  commonName: string;
  numberOfChapters: number;
}

export async function getBooks(): Promise<Book[]> {
  const res = await fetch(`${BIBLE_API_BASE}/${TRANSLATION_ID}/books.json`);
  if (!res.ok) throw new Error('Failed to fetch books');
  const data = await res.json();
  return data.books;
}

export async function getChapter(bookId: string, chapter: number): Promise<any[]> {
  const res = await fetch(`${BIBLE_API_BASE}/${TRANSLATION_ID}/${bookId}/${chapter}.json`);
  if (!res.ok) throw new Error('Failed to fetch chapter');
  const data = await res.json();
  return data.chapter.content;
}

/**
 * Safely fetches and parses JSON from the commentary API.
 * The API returns HTML (text/html) for books/chapters that don't exist
 * instead of a proper 404 JSON — calling .json() on HTML crashes the app.
 * This wrapper checks Content-Type before parsing.
 */
async function safeCommentaryFetch(url: string): Promise<any | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null; // silently skip HTML responses
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Splits a long commentary string into clean, readable paragraphs.
 */
function splitCommentaryText(rawText: string): string[] {
  const lines = rawText
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const paragraphs: string[] = [];
  let current = '';

  for (const line of lines) {
    if (current.length + line.length > 600 && current.length > 0) {
      paragraphs.push(current.trim());
      current = line;
    } else {
      current += (current ? ' ' : '') + line;
    }
    if (paragraphs.length >= 2) break;
  }

  if (current.trim() && paragraphs.length < 2) {
    paragraphs.push(current.trim());
  }

  return paragraphs.slice(0, 2);
}

/**
 * Fetches verse commentaries from multiple sources.
 * Uses Promise.allSettled + safeCommentaryFetch so any failure is silent.
 */
export async function getVerseCommentaries(bookId: string, chapter: number, verseNumber: number): Promise<any[]> {
  const promises = COMMENTARIES_IDS.map(async (commentaryId) => {
    try {
      const data = await safeCommentaryFetch(
        `${BIBLE_API_BASE}/c/${commentaryId}/${bookId}/${chapter}.json`
      );
      if (!data) return null;

      const verseContent = data?.chapter?.content?.find(
        (v: any) => v.type === 'verse' && v.number === verseNumber
      );
      if (!verseContent?.content?.length) return null;

      const rawTexts = verseContent.content.filter(
        (c: any) => typeof c === 'string' && c.trim().length > 0
      );
      if (rawTexts.length === 0) return null;

      const texts = splitCommentaryText(rawTexts.join(' '));
      if (texts.length === 0) return null;

      let commentaryName = commentaryId;
      switch (commentaryId) {
        case 'adam-clarke': commentaryName = 'Adam Clarke'; break;
        case 'jamieson-fausset-brown': commentaryName = 'Jamieson-Fausset-Brown'; break;
        case 'matthew-henry': commentaryName = 'Matthew Henry'; break;
        case 'john-gill': commentaryName = 'John Gill'; break;
        case 'tyndale': commentaryName = 'Tyndale Open Study Notes'; break;
        case 'keil-delitzsch': commentaryName = 'Keil & Delitzsch'; break;
      }

      return { author: commentaryName, texts, id: commentaryId };
    } catch {
      return null;
    }
  });

  const settled = await Promise.allSettled(promises);
  return settled
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value);
}

/**
 * Returns verse numbers that have at least one commentary available.
 * Used to show/hide the "Estudo" button per verse.
 */
export async function getChapterCommentMap(bookId: string, chapter: number): Promise<Set<number>> {
  const availableSet = new Set<number>();

  const promises = COMMENTARIES_IDS.map(async (commentaryId) => {
    try {
      const data = await safeCommentaryFetch(
        `${BIBLE_API_BASE}/c/${commentaryId}/${bookId}/${chapter}.json`
      );
      if (!data?.chapter?.content) return;

      data.chapter.content.forEach((v: any) => {
        if (v.type === 'verse' && v.number && v.content?.length > 0) {
          const hasText = v.content.some(
            (c: any) => typeof c === 'string' && c.trim().length > 0
          );
          if (hasText) availableSet.add(v.number);
        }
      });
    } catch {
      // silently ignore per-commentary failures
    }
  });

  await Promise.allSettled(promises);
  return availableSet;
}
