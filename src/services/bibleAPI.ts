import { supabase } from "@/integrations/supabase/client";

export interface StrongNumber {
  id: string;
  word_hebrew?: string;
  word_greek?: string;
  transliteration: string;
  pronunciation?: string;
  definition: string;
  part_of_speech?: string;
  language: "hebrew" | "greek";
}

export interface MorphologyCode {
  code: string;
  description: string;
  language: "hebrew" | "greek";
  category: string;
  subcategory?: string;
}

export interface VerseMorphology {
  book_id: string;
  chapter: number;
  verse: number;
  word_position: number;
  original_word: string;
  morphology_code?: string;
  strong_number?: string;
  lemma?: string;
}

export interface DictionaryDefinition {
  id: string;
  term: string;
  definition: string;
  part_of_speech?: string;
  language: "hebrew" | "greek" | "english";
  strong_number?: string;
  see_also?: string[];
}

export interface CrossReference {
  book_id: string;
  chapter: number;
  verse: number;
  refs: string;
}

export interface Footnote {
  book_id: string;
  chapter: number;
  verse: number;
  footnote_text: string;
  footnote_type: "translation" | "study" | "cross_ref" | "variant";
  source?: string;
}

// Helper to query tables not yet in the generated types
const fromUntyped = (table: string) => (supabase as any).from(table);

class BibleAPIService {
  async getStrongNumber(id: string): Promise<StrongNumber | null> {
    try {
      const { data, error } = await fromUntyped("strong_numbers")
        .select("*").eq("id", id).single();
      if (error) throw error;
      return data as StrongNumber | null;
    } catch (err) { console.error("Error fetching Strong number:", err); return null; }
  }

  async searchStrongNumbers(query: string, language?: "hebrew" | "greek"): Promise<StrongNumber[]> {
    try {
      let q = fromUntyped("strong_numbers").select("*")
        .or(`word_hebrew.ilike.%${query}%,word_greek.ilike.%${query}%,transliteration.ilike.%${query}%`);
      if (language) q = q.eq("language", language);
      const { data, error } = await q.limit(20);
      if (error) throw error;
      return (data as StrongNumber[]) || [];
    } catch (err) { console.error("Error searching Strong numbers:", err); return []; }
  }

  async getMorphologyCode(code: string): Promise<MorphologyCode | null> {
    try {
      const { data, error } = await fromUntyped("morphology_codes")
        .select("*").eq("code", code).single();
      if (error) throw error;
      return data as MorphologyCode | null;
    } catch (err) { console.error("Error fetching morphology code:", err); return null; }
  }

  async getVerseMorphology(bookId: string, chapter: number, verse: number): Promise<VerseMorphology[]> {
    try {
      const { data, error } = await fromUntyped("verse_morphology")
        .select("*").eq("book_id", bookId).eq("chapter", chapter).eq("verse", verse).order("word_position");
      if (error) throw error;
      return (data as VerseMorphology[]) || [];
    } catch (err) { console.error("Error fetching verse morphology:", err); return []; }
  }

  async lookupWord(term: string): Promise<DictionaryDefinition[]> {
    try {
      const { data, error } = await fromUntyped("dictionary_definitions")
        .select("*").ilike("term", `%${term}%`).limit(10);
      if (error) throw error;
      return (data as DictionaryDefinition[]) || [];
    } catch (err) { console.error("Error looking up word:", err); return []; }
  }

  async getCrossReferences(bookId: string, chapter: number, verse: number): Promise<CrossReference[]> {
    try {
      const { data, error } = await supabase.from("bible_cross_references")
        .select("*").eq("book_id", bookId).eq("chapter", chapter).eq("verse", verse);
      if (error) throw error;
      return (data as unknown as CrossReference[]) || [];
    } catch (err) { console.error("Error fetching cross references:", err); return []; }
  }

  async getFootnotes(bookId: string, chapter: number, verse: number): Promise<Footnote[]> {
    try {
      const { data, error } = await fromUntyped("bible_footnotes")
        .select("*").eq("book_id", bookId).eq("chapter", chapter).eq("verse", verse);
      if (error) throw error;
      return (data as Footnote[]) || [];
    } catch (err) { console.error("Error fetching footnotes:", err); return []; }
  }

  async isJesusSpeech(bookId: string, chapter: number, verse: number): Promise<boolean> {
    try {
      const { data, error } = await fromUntyped("jesus_speech")
        .select("id").eq("book_id", bookId).eq("chapter", chapter)
        .lte("verse_start", verse).gte("verse_end", verse).limit(1);
      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch (err) { console.error("Error checking Jesus speech:", err); return false; }
  }

  async getOldTestamentQuotes(newTestamentBook: string, chapter: number, verse: number) {
    try {
      const { data, error } = await fromUntyped("old_testament_quotes")
        .select("*").eq("new_testament_book", newTestamentBook)
        .eq("new_testament_chapter", chapter).eq("new_testament_verse", verse);
      if (error) throw error;
      return data || [];
    } catch (err) { console.error("Error fetching OT quotes:", err); return []; }
  }

  async getInstalledModules() {
    try {
      const { data, error } = await fromUntyped("bible_modules")
        .select("*").eq("is_default", true);
      if (error) throw error;
      return data || [];
    } catch (err) { console.error("Error fetching modules:", err); return []; }
  }

  async installModule(moduleId: string): Promise<boolean> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const { error } = await fromUntyped("bible_modules").update({ is_default: true }).eq("id", moduleId);
      if (error) throw error;
      return true;
    } catch (err) { console.error("Error installing module:", err); return false; }
  }

  async uninstallModule(moduleId: string): Promise<boolean> {
    try {
      const { error } = await fromUntyped("bible_modules").update({ is_default: false }).eq("id", moduleId);
      if (error) throw error;
      return true;
    } catch (err) { console.error("Error uninstalling module:", err); return false; }
  }
}

export const bibleAPI = new BibleAPIService();
export default bibleAPI;
