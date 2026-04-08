import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Search, Loader2, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import TranslatableText from "@/components/TranslatableText";

interface DictEntry {
  id: string;
  term: string;
  definition: string;
  hebrew_greek: string | null;
  references_list: string[];
}

interface DictionaryPanelProps {
  open: boolean;
  onClose: () => void;
  initialTerm?: string;
}

const DictionaryPanel = ({ open, onClose, initialTerm }: DictionaryPanelProps) => {
  const [query, setQuery] = useState(initialTerm || "");
  const [entries, setEntries] = useState<DictEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "hebrew" | "greek">("all");

  const searchEntries = useCallback(async (searchQuery: string, langFilter: string) => {
    if (!open) return;
    setLoading(true);

    let q = supabase
      .from("bible_dictionary")
      .select("*")
      .order("term")
      .limit(50);

    if (searchQuery.length > 0) {
      q = q.or(`term.ilike.%${searchQuery}%,definition.ilike.%${searchQuery}%`);
    }

    if (langFilter === "hebrew") {
      q = q.or("hebrew_greek.ilike.hebraico%,hebrew_greek.ilike.heb:%");
    } else if (langFilter === "greek") {
      q = q.or("hebrew_greek.ilike.grego%,hebrew_greek.ilike.gr:%");
    }

    const { data } = await q;
    if (data) {
      setEntries(
        data.map((d: any) => ({
          ...d,
          references_list: Array.isArray(d.references_list) ? d.references_list : [],
        }))
      );
    }
    setLoading(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => searchEntries(query, filter), 300);
    return () => clearTimeout(timer);
  }, [open, query, filter, searchEntries]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="reader-floating-panel fixed top-0 right-0 h-full w-full max-w-lg bg-background border-l border-border z-50 animate-fade-in flex flex-col">
        <div className="reader-panel-header flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookText className="w-4 h-4 text-primary" />
            <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground">
              DICIONÁRIO BÍBLICO & STRONG
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="reader-icon-button">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar termo, Strong's (H1234, G5678)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 font-sans text-sm"
              autoFocus
            />
          </div>
          <div className="flex gap-1.5">
            {(["all", "hebrew", "greek"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] tracking-[0.15em] font-sans px-3 py-1.5 rounded-full transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f === "all" ? "TODOS" : f === "hebrew" ? "HEBRAICO" : "GREGO"}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && entries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8 font-sans">
                {query ? "Nenhum termo encontrado." : "Digite para buscar no léxico."}
              </p>
            )}
            {!loading &&
              entries.map((entry) => {
                const isStrongs = /^[GH]\d+/.test(entry.term);
                const langBadge = entry.hebrew_greek?.match(/hebraico|heb:/i)
                  ? "HEB"
                  : entry.hebrew_greek?.match(/grego|gr:/i)
                  ? "GRK"
                  : null;

                return (
                  <div key={entry.id} className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-serif font-semibold text-primary leading-tight">
                          {entry.term}
                        </h3>
                        {langBadge && (
                          <span className={`shrink-0 text-[9px] tracking-[0.15em] font-sans font-bold px-2 py-0.5 rounded ${
                            langBadge === "HEB"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}>
                            {langBadge}
                          </span>
                        )}
                      </div>
                      {entry.hebrew_greek && (
                        <p className="text-[11px] font-sans text-muted-foreground mt-0.5 italic">
                          {entry.hebrew_greek}
                        </p>
                      )}
                      <TranslatableText
                        text={entry.definition}
                        className="text-sm font-serif leading-relaxed text-foreground/90 mt-2 whitespace-pre-line"
                        showOriginalToggle={false}
                        forceTranslate
                      />
                      {entry.references_list.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] tracking-[0.2em] font-sans text-muted-foreground mb-1">
                            REFERÊNCIAS
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {entry.references_list.map((ref, i) => (
                              <span
                                key={i}
                                className="text-xs font-sans text-primary bg-primary/10 px-2 py-0.5 rounded"
                              >
                                {ref}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default DictionaryPanel;
