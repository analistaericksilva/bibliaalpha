/**
 * aiTranslation.ts
 * Traduz comentários bíblicos do inglês para o português usando Gemini.
 * A chave da API é injetada em build time pelo vite.config.ts via process.env.GEMINI_API_KEY.
 */

const GEMINI_API_KEY: string = (process.env.GEMINI_API_KEY as string) || '';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Cache simples em memória para evitar chamadas repetidas
const translationCache = new Map<string, string>();

async function translateTextToPortuguese(text: string): Promise<string> {
  if (!GEMINI_API_KEY) return text;
  if (!text || text.trim().length === 0) return text;

  const cacheKey = text.substring(0, 80);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const prompt = `Traduza o seguinte comentário bíblico do inglês para o português brasileiro de forma fluida e natural. Mantenha termos teológicos conhecidos (como "Elohim", "Torah", etc.). Retorne APENAS a tradução, sem explicações adicionais.\n\n${text}`;

    const res = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.3 },
      }),
    });

    if (!res.ok) return text; // fallback: retorna original se API falhar

    const data = await res.json();
    const translated: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

    translationCache.set(cacheKey, translated);
    return translated;
  } catch {
    return text; // fallback silencioso — nunca quebra o app
  }
}

export async function translateChapterText(
  _bookId: string,
  _chapter: number,
  verses: any[]
): Promise<any[]> {
  return verses;
}

export async function translateCommentaries(
  _bookId: string,
  _chapter: number,
  _verseNumber: number,
  commentaries: any[]
): Promise<any[]> {
  if (!GEMINI_API_KEY || commentaries.length === 0) return commentaries;

  // Traduz cada comentário em paralelo, com fallback individual
  const translated = await Promise.allSettled(
    commentaries.map(async (comment) => {
      try {
        const translatedTexts = await Promise.allSettled(
          comment.texts.map((t: string) => translateTextToPortuguese(t))
        );
        const texts = translatedTexts.map((r, i) =>
          r.status === 'fulfilled' ? r.value : comment.texts[i]
        );
        return { ...comment, texts };
      } catch {
        return comment; // retorna original se falhar
      }
    })
  );

  return translated.map((r, i) =>
    r.status === 'fulfilled' ? r.value : commentaries[i]
  );
}
