import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, ExternalLink, Loader2, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bibleBooks";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VerseIntelligencePanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  verse: number | null;
  onNavigate?: (bookId: string, chapter: number, verse?: number) => void;
}

interface StructuredCrossRef {
  book_id: string;
  chapter: number;
  verse: number;
  dataset?: string;
  weight?: number;
}

interface MaculaWord {
  token_index: number;
  language: "hebrew" | "greek" | string;
  surface: string;
  transliteration?: string | null;
  strongs?: string | null;
  morphology?: string | null;
  semantic_role?: string | null;
  gloss?: string | null;
  contextual_gloss?: string | null;
}

interface PanelPayload {
  reference: { book_id: string; chapter: number; verse: number };
  cross_references: StructuredCrossRef[];
  legacy_cross_references: string[];
  study_notes: Array<{ id: string; title: string | null; content: string; source: string | null }>;
  external_commentary: Array<{ id: string; title: string | null; content: string; author: string | null; source_dataset: string }>;
  macula_words: MaculaWord[];
  macula_relations: Array<{ relation_type: string | null; frame: string | null; subject_ref: string | null; participant_ref: string | null }>;
  datasets: Array<{ id: string; name: string; category: string; repository_url: string; license: string | null }>;
}

const abbrevToId: Record<string, string> = {};
const nameToId: Record<string, string> = {};

bibleBooks.forEach((book) => {
  abbrevToId[book.abbrev.toLowerCase()] = book.id;
  abbrevToId[book.id.toLowerCase()] = book.id;
  nameToId[book.name.toLowerCase()] = book.id;
});

const parseReference = (ref: string) => {
  const match = ref.trim().match(/^(\d?\s?[A-Za-zÀ-ú]+(?:\s+[A-Za-zÀ-ú]+)*)\s+(\d+)(?:[.:](\d+))?/);
  if (!match) return null;

  const rawBook = match[1].trim();
  const chapter = Number(match[2]);
  const verse = match[3] ? Number(match[3]) : undefined;
  const compact = rawBook.replace(/\s+/g, "").toLowerCase();
  const spaced = rawBook.toLowerCase();

  const bookId = abbrevToId[compact] || nameToId[spaced] || nameToId[compact];
  if (!bookId) return null;

  return { bookId, chapter, verse, label: ref };
};

const compact = (value?: string | null, max = 180) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
};

const VerseIntelligencePanel = ({ open, onClose, bookId, chapter, verse, onNavigate }: VerseIntelligencePanelProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<PanelPayload | null>(null);

  useEffect(() => {
    if (!open || !verse) return;

    const fetchInsights = async () => {
      setLoading(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke("verse-intelligence", {
        body: {
          bookId,
          chapter,
          verse,
          crossLimit: 60,
        },
      });

      if (invokeError || !data?.success) {
        setPayload(null);
        setError(invokeError?.message || data?.error || "Não foi possível carregar os insights deste versículo.");
      } else {
        setPayload(data.data as PanelPayload);
      }

      setLoading(false);
    };

    fetchInsights();
  }, [open, bookId, chapter, verse]);

  const legacyRefs = useMemo(() => {
    if (!payload?.legacy_cross_references) return [] as Array<{ bookId: string; chapter: number; verse?: number; label: string }>;

    return payload.legacy_cross_references
      .map(parseReference)
      .filter(Boolean) as Array<{ bookId: string; chapter: number; verse?: number; label: string }>;
  }, [payload]);

  if (!open) return null;

  const currentBook = bibleBooks.find((b) => b.id === bookId);

  return (
    <>
      <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-background border-l border-border z-50 animate-fade-in flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary" />
            <h2 className="text-xs tracking-[0.3em] title-strong">
              INTELIGÊNCIA BÍBLICA 66X
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-4 py-3 border-b border-border">
          <p className="text-[11px] tracking-[0.2em] uppercase font-sans text-foreground">
            {currentBook?.name || bookId} {chapter}:{verse || "-"}
          </p>
          <p className="text-xs comment-strong mt-1">
            Dados consolidados de MACULA + hubs open source + referências cruzadas.
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-foreground" />
              </div>
            )}

            {!loading && error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
                <p className="text-sm text-destructive font-sans">{error}</p>
              </div>
            )}

            {!loading && !error && payload && (
              <>
                <section className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-[11px] menu-strong uppercase tracking-[0.2em]">Resumo do Verso</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm font-sans">
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-foreground">Cross refs (grafo)</p>
                      <p className="font-semibold">{payload.cross_references?.length || 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-foreground">Palavras MACULA</p>
                      <p className="font-semibold">{payload.macula_words?.length || 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-foreground">Notas</p>
                      <p className="font-semibold">{payload.study_notes?.length || 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-foreground">Coment. externos</p>
                      <p className="font-semibold">{payload.external_commentary?.length || 0}</p>
                    </div>
                  </div>
                </section>

                {(payload.cross_references?.length || legacyRefs.length > 0) && (
                  <section className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-[11px] menu-strong uppercase tracking-[0.2em] mb-2">Referências Cruzadas</h3>

                    {payload.cross_references?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {payload.cross_references.slice(0, 30).map((item, idx) => (
                          <button
                            key={`${item.book_id}-${item.chapter}-${item.verse}-${idx}`}
                            type="button"
                            onClick={() => onNavigate?.(item.book_id, item.chapter, item.verse)}
                            className="text-xs rounded-full border border-border px-2.5 py-1 hover:border-primary/50 hover:text-primary transition-colors"
                          >
                            {item.book_id.toUpperCase()} {item.chapter}:{item.verse}
                            {item.weight ? ` · ${item.weight}` : ""}
                          </button>
                        ))}
                      </div>
                    )}

                    {legacyRefs.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {legacyRefs.slice(0, 25).map((item, idx) => (
                          <button
                            key={`${item.label}-${idx}`}
                            type="button"
                            onClick={() => onNavigate?.(item.bookId, item.chapter, item.verse)}
                            className="text-xs rounded-full border border-border/70 px-2.5 py-1 text-foreground hover:text-primary hover:border-primary/40 transition-colors"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {payload.macula_words?.length > 0 && (
                  <section className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-[11px] menu-strong uppercase tracking-[0.2em] mb-2">Camada Linguística MACULA</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {payload.macula_words.slice(0, 80).map((word, idx) => (
                        <div key={`${word.token_index}-${idx}`} className="rounded-lg border border-border/70 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-serif text-base">{word.surface}</p>
                            <span className="text-[10px] font-sans uppercase tracking-wider text-foreground">#{word.token_index}</span>
                          </div>
                          <p className="text-xs text-foreground font-sans">
                            {compact(word.transliteration, 70)}
                            {word.strongs ? ` • ${word.strongs}` : ""}
                            {word.morphology ? ` • ${word.morphology}` : ""}
                            {word.semantic_role ? ` • ${word.semantic_role}` : ""}
                          </p>
                          {(word.contextual_gloss || word.gloss) && (
                            <p className="text-sm mt-1">{compact(word.contextual_gloss || word.gloss, 120)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {(payload.study_notes?.length > 0 || payload.external_commentary?.length > 0) && (
                  <section className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-[11px] menu-strong uppercase tracking-[0.2em] mb-2">Comentário e Notas</h3>
                    <div className="space-y-3">
                      {payload.study_notes.slice(0, 4).map((note) => (
                        <article key={note.id} className="rounded-lg border border-border/70 p-3">
                          <p className="text-[10px] menu-strong uppercase tracking-wider mb-1">
                            {note.title || note.source || "Nota de estudo"}
                          </p>
                          <p className="text-sm leading-6">{compact(note.content, 320)}</p>
                        </article>
                      ))}

                      {payload.external_commentary.slice(0, 4).map((note) => (
                        <article key={note.id} className="rounded-lg border border-border/70 p-3 bg-muted/30">
                          <p className="text-[10px] menu-strong uppercase tracking-wider mb-1">
                            {note.title || note.author || note.source_dataset}
                          </p>
                          <p className="text-sm leading-6">{compact(note.content, 320)}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {payload.datasets?.length > 0 && (
                  <section className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-[11px] menu-strong uppercase tracking-[0.2em] mb-2">Proveniência dos Dados</h3>
                    <div className="space-y-2">
                      {payload.datasets.slice(0, 8).map((dataset) => (
                        <a
                          key={dataset.id}
                          href={dataset.repository_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 hover:border-primary/40 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium">{dataset.name}</p>
                            <p className="text-[11px] text-foreground uppercase tracking-wider">
                              {dataset.category} {dataset.license ? `• ${dataset.license}` : ""}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-foreground" />
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default VerseIntelligencePanel;
