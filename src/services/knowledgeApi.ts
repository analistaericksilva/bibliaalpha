/**
 * knowledgeApi.ts
 * Integracao com APIs externas de conhecimento:
 * - Wikipedia REST API (PT + EN fallback) — gratuita, sem chave
 * - Google Books API — gratuita, sem chave para consultas basicas
 * - Google Knowledge Graph Search API — opcional, requer VITE_GOOGLE_KG_KEY
 */

const WIKI_PT_API = 'https://pt.wikipedia.org/api/rest_v1';
const WIKI_EN_API = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_PT_SEARCH = 'https://pt.wikipedia.org/w/api.php';
const WIKI_EN_SEARCH = 'https://en.wikipedia.org/w/api.php';
const GBOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const GKG_API = 'https://kgsearch.googleapis.com/v1/entities:search';

export interface WikiSummary {
  title: string;
  displayTitle: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number };
  pageUrl: string;
  lang: 'pt' | 'en';
}

export interface WikiSearchResult {
  title: string;
  description: string;
  url: string;
}

export interface GoogleBook {
  id: string;
  title: string;
  authors: string[];
  description: string;
  thumbnail?: string;
  previewLink: string;
  publishedDate?: string;
}

export interface KnowledgeGraphEntity {
  name: string;
  description: string;
  detailedDescription?: string;
  imageUrl?: string;
  url?: string;
  types: string[];
}

export async function searchWikipedia(query: string): Promise<WikiSearchResult[]> {
  const p = new URLSearchParams({ action: 'opensearch', search: query, limit: '6', format: 'json', origin: '*' });
  try {
    const res = await fetch(WIKI_PT_SEARCH + '?' + p);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const titles: string[] = data[1] || [];
    const descriptions: string[] = data[2] || [];
    const urls: string[] = data[3] || [];
    if (titles.length === 0) return _searchWikiEN(query);
    return titles.map((title, i) => ({ title, description: descriptions[i] || '', url: urls[i] || '' }));
  } catch { return _searchWikiEN(query); }
}

async function _searchWikiEN(query: string): Promise<WikiSearchResult[]> {
  const p = new URLSearchParams({ action: 'opensearch', search: query, limit: '6', format: 'json', origin: '*' });
  try {
    const res = await fetch(WIKI_EN_SEARCH + '?' + p);
    if (!res.ok) return [];
    const data = await res.json();
    const t: string[] = data[1] || [];
    const d: string[] = data[2] || [];
    const u: string[] = data[3] || [];
    return t.map((title, i) => ({ title, description: d[i] || '', url: u[i] || '' }));
  } catch { return []; }
}

export async function getWikipediaSummary(title: string): Promise<WikiSummary | null> {
  const enc = encodeURIComponent(title.replace(/ /g, '_'));
  try {
    const res = await fetch(WIKI_PT_API + '/page/summary/' + enc);
    if (res.ok) {
      const d = await res.json();
      if (d.type !== 'disambiguation' && d.extract) {
        return { title: d.title, displayTitle: d.displaytitle, extract: d.extract, thumbnail: d.thumbnail,
          pageUrl: d.content_urls?.desktop?.page || 'https://pt.wikipedia.org/wiki/' + enc, lang: 'pt' };
      }
    }
  } catch {}
  try {
    const res = await fetch(WIKI_EN_API + '/page/summary/' + enc);
    if (res.ok) {
      const d = await res.json();
      if (d.extract) {
        return { title: d.title, displayTitle: d.displaytitle, extract: d.extract, thumbnail: d.thumbnail,
          pageUrl: d.content_urls?.desktop?.page || 'https://en.wikipedia.org/wiki/' + enc, lang: 'en' };
      }
    }
  } catch {}
  return null;
}

export async function searchGoogleBooks(query: string): Promise<GoogleBook[]> {
  try {
    const p = new URLSearchParams({ q: query + ' biblia teologia', langRestrict: 'pt', maxResults: '5', orderBy: 'relevance', printType: 'books' });
    const res = await fetch(GBOOKS_API + '?' + p);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const items = data.items || [];
    if (items.length >= 2) return _parseBooks(items);
    const p2 = new URLSearchParams({ q: query + ' bible commentary', maxResults: '5', orderBy: 'relevance', printType: 'books' });
    const res2 = await fetch(GBOOKS_API + '?' + p2);
    if (res2.ok) { const d2 = await res2.json(); return _parseBooks(d2.items || []); }
    return _parseBooks(items);
  } catch { return []; }
}

function _parseBooks(items: any[]): GoogleBook[] {
  return items.map((item: any) => {
    const info = item.volumeInfo || {};
    return {
      id: item.id, title: info.title || 'Sem titulo', authors: info.authors || [],
      description: info.description ? info.description.slice(0, 220) : '',
      thumbnail: info.imageLinks?.thumbnail?.replace('http://', 'https://'),
      previewLink: info.previewLink || '', publishedDate: info.publishedDate,
    };
  });
}

export async function searchKnowledgeGraph(query: string): Promise<KnowledgeGraphEntity[]> {
  const key = (import.meta as any).env?.VITE_GOOGLE_KG_KEY;
  if (!key) return [];
  const params = new URLSearchParams({ query, key, limit: '3', languages: 'pt,en' });
  try {
    const res = await fetch(GKG_API + '?' + params);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.itemListElement || []).map((item: any) => {
      const e = item.result || {};
      return {
        name: e.name || '', description: e.description || '',
        detailedDescription: e.detailedDescription?.articleBody || '',
        imageUrl: e.image?.contentUrl, url: e.url || e.detailedDescription?.url,
        types: (e['@type'] || []) as string[],
      };
    });
  } catch { return []; }
      }
