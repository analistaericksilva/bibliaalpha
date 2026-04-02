import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Languages, ChevronDown, ChevronUp, X } from "lucide-react";

interface InterlinearWord {
  word_num: number;
  original_word: string;
  transliteration: string | null;
  english: string | null;
  strongs_number: string | null;
  grammar: string | null;
  language: string;
}

interface InterlinearViewProps {
  bookId: string;
  chapter: number;
  verse: number;
  onClose: () => void;
}

const InterlinearView = ({ bookId, chapter, verse, onClose }: InterlinearViewProps) => {
  const [words, setWords] = useState<InterlinearWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<InterlinearWord | null>(null);
  const [lexiconDef, setLexiconDef] = useState<string | null>(null);
  const [lexiconLoading, setLexiconLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("interlinear_words")
        .select("word_num, original_word, transliteration, english, strongs_number, grammar, language")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .eq("verse", verse)
        .order("word_num");
      setWords((data as InterlinearWord[]) || []);
      setLoading(false);
    };
    fetch();
  }, [bookId, chapter, verse]);

  const handleWordClick = async (word: InterlinearWord) => {
    if (selectedWord?.word_num === word.word_num) {
      setSelectedWord(null);
      setLexiconDef(null);
      return;
    }
    setSelectedWord(word);
    setLexiconDef(null);

    if (word.strongs_number) {
      setLexiconLoading(true);
      // Clean strongs number for lookup
      const cleanStrongs = word.strongs_number.replace(/[A-Za-z]$/, '');
      const { data } = await supabase
        .from("strongs_lexicon")
        .select("definition, gloss, original_word, transliteration")
        .or(`strongs_number.eq.${word.strongs_number},strongs_number.eq.${cleanStrongs}`)
        .limit(1);
      if (data && data.length > 0) {
        setLexiconDef(data[0].definition || data[0].gloss || null);
      }
      setLexiconLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-3 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="text-xs font-sans">Carregando interlinear…</span>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="py-2 px-4">
        <p className="text-xs text-muted-foreground font-sans italic">
          Texto interlinear não disponível para este versículo.
        </p>
      </div>
    );
  }

  const isHebrew = words[0]?.language === "hebrew";

  return (
    <div className="my-2 mx-1 rounded-lg border border-primary/20 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-1.5">
          <Languages className="w-3 h-3 text-primary" />
          <span className="text-[10px] tracking-[0.2em] font-sans font-bold text-foreground uppercase">
            Interlinear — v. {verse}
          </span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans ${
            isHebrew 
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          }`}>
            {isHebrew ? "HEB" : "GRE"}
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs px-1">✕</button>
      </div>

      {/* Word grid */}
      <div className={`flex flex-wrap gap-1 p-3 ${isHebrew ? "flex-row-reverse" : ""}`}>
        {words.map((w) => (
          <button
            key={w.word_num}
            onClick={() => handleWordClick(w)}
            className={`flex flex-col items-center px-2 py-1.5 rounded-lg transition-colors min-w-[50px] ${
              selectedWord?.word_num === w.word_num
                ? "bg-primary/10 ring-1 ring-primary/30"
                : "hover:bg-muted/50"
            }`}
          >
            <span className={`${isHebrew ? "text-base" : "text-sm"} font-serif text-foreground leading-tight`}>
              {w.original_word}
            </span>
            {w.transliteration && (
              <span className="text-[9px] text-muted-foreground italic font-sans mt-0.5">
                {w.transliteration}
              </span>
            )}
            <span className="text-[10px] font-sans text-foreground/70 mt-0.5 leading-tight text-center">
              {w.english}
            </span>
            {w.strongs_number && (
              <span className="text-[8px] font-mono text-primary/60 mt-0.5">
                {w.strongs_number}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Selected word detail */}
      {selectedWord && (
        <div className="px-4 pb-3 border-t border-border/50 pt-2">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`${isHebrew ? "text-xl" : "text-lg"} font-serif text-foreground`}>
                  {selectedWord.original_word}
                </span>
                {selectedWord.strongs_number && (
                  <span className="text-[10px] font-mono text-primary font-bold">
                    {selectedWord.strongs_number}
                  </span>
                )}
              </div>
              {selectedWord.transliteration && (
                <p className="text-xs text-muted-foreground italic font-sans">
                  {selectedWord.transliteration}
                </p>
              )}
              <p className="text-sm font-sans font-medium text-foreground mt-0.5">
                {selectedWord.english}
              </p>
              {selectedWord.grammar && (
                <p className="text-[10px] font-mono text-muted-foreground mt-1">
                  Morfologia: {selectedWord.grammar}
                </p>
              )}
              {lexiconLoading && (
                <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-[10px]">Buscando definição…</span>
                </div>
              )}
              {lexiconDef && (
                <div className="mt-2 p-2 bg-muted/30 rounded text-[11px] font-serif leading-relaxed text-foreground/85">
                  {lexiconDef}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pb-2">
        <p className="text-[8px] text-muted-foreground/50 font-sans text-right">
          STEPBible TAGNT/TAHOT (CC BY 4.0) — Tyndale House
        </p>
      </div>
    </div>
  );
};

export default InterlinearView;
