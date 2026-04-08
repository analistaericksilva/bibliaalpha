import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Languages, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TranslatableTextProps {
  text: string;
  className?: string;
  renderText?: (text: string) => ReactNode;
  showOriginalToggle?: boolean;
}

const ENGLISH_PATTERN = /\b(the|and|with|from|that|this|your|shall|lord|god|jesus|christ|faith|grace|holy|spirit|love|sin|salvation|gospel|heaven|earth|righteousness|repent|mercy|forgiveness)\b/gi;
const PORTUGUESE_PATTERN = /\b(que|com|para|não|senhor|deus|jesus|cristo|fé|graça|espírito|amor|pecado|salvação|evangelho|céu|terra|justiça|arrependimento|misericórdia|perdão)\b/gi;

const translationCache = new Map<string, string>();

const countMatches = (text: string, pattern: RegExp) => {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
};

const shouldTranslateToPt = (text: string) => {
  const cleaned = text.replace(/\d+[:.]\d+/g, " ").trim();
  if (cleaned.length < 40) return false;

  const englishScore = countMatches(cleaned, ENGLISH_PATTERN);
  const portugueseScore = countMatches(cleaned, PORTUGUESE_PATTERN);

  return englishScore >= 3 && englishScore > portugueseScore;
};

const TranslatableText = ({
  text,
  className,
  renderText,
  showOriginalToggle = true,
}: TranslatableTextProps) => {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const needsTranslation = useMemo(() => shouldTranslateToPt(text), [text]);

  useEffect(() => {
    let active = true;

    const runTranslation = async () => {
      if (!needsTranslation) {
        setTranslatedText(null);
        return;
      }

      if (translationCache.has(text)) {
        setTranslatedText(translationCache.get(text) || null);
        return;
      }

      setIsTranslating(true);

      try {
        const { data, error } = await supabase.functions.invoke("translate-interlinear", {
          body: {
            words: [{ english: text, original_word: text }],
          },
        });

        if (error) throw error;

        const translated = data?.translations?.[0];
        if (active && translated && translated !== text) {
          translationCache.set(text, translated);
          setTranslatedText(translated);
        }
      } catch (err) {
        console.error("Falha ao traduzir texto automaticamente:", err);
      } finally {
        if (active) setIsTranslating(false);
      }
    };

    runTranslation();

    return () => {
      active = false;
    };
  }, [text, needsTranslation]);

  const render = (value: string) =>
    renderText ? renderText(value) : <span className="whitespace-pre-line">{value}</span>;

  if (!translatedText) {
    return (
      <div className={className}>
        {render(text)}
        {isTranslating && (
          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-sans text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> Traduzindo do inglês…
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn(showOriginalToggle ? "space-y-2" : "", className)}>
      {showOriginalToggle && (
        <div className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-sans uppercase tracking-wide text-primary">
          <Languages className="w-3 h-3" /> Tradução automática
        </div>
      )}

      <div>{render(translatedText)}</div>

      {showOriginalToggle && (
        <details className="rounded-md border border-border/50 bg-muted/25 px-2.5 py-1.5">
          <summary className="cursor-pointer text-[11px] font-sans text-muted-foreground">
            Ver original em inglês
          </summary>
          <div className="mt-1.5 text-foreground/85">{render(text)}</div>
        </details>
      )}
    </div>
  );
};

export default TranslatableText;
