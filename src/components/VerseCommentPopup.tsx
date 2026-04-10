import { useEffect, useMemo, useState } from "react";
import { MessageSquare, X, BookOpenText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bibleBooks";
import { cn } from "@/lib/utils";
import TranslatableText from "@/components/TranslatableText";
import { sanitizeStudyNotes } from "@/lib/studyNotesFilter";

interface StudyNote {
  id: string;
  title: string | null;
  content: string;
  source: string | null;
  note_type: string;
  verse_start: number;
  verse_end: number | null;
}

interface VerseCommentPopupProps {
  open: boolean;
  bookId: string;
  chapter: number;
  verse: number | null;
  onClose: () => void;
  onOpenAllNotes?: () => void;
  onNavigate?: (bookId: string, chapter: number, verse?: number) => void;
}

const abbrevToId: Record<string, string> = {};
const nameToId: Record<string, string> = {};

bibleBooks.forEach((book) => {
  abbrevToId[book.abbrev.toLowerCase()] = book.id;
  nameToId[book.name.toLowerCase()] = book.id;
  abbrevToId[book.id] = book.id;
});

function parseReference(refStr: string) {
  const match = refStr
    .trim()
    .match(/^(\d?\s?[A-Za-zÀ-ú]+(?:\s+[A-Za-zÀ-ú]+)*)\s+(\d+)(?:[.:](\d+))?/);

  if (!match) return null;

  const rawBook = match[1].trim();
  const chapter = Number(match[2]);
  const verse = match[3] ? Number(match[3]) : undefined;

  const compact = rawBook.replace(/\s+/g, "").toLowerCase();
  const spaced = rawBook.toLowerCase();

  const parsedBookId = abbrevToId[compact] || nameToId[spaced] || nameToId[compact];
  if (!parsedBookId) return null;

  return { bookId: parsedBookId, chapter, verse };
}

function renderContentWithRefs(
  text: string,
  onNavigate?: (bookId: string, chapter: number, verse?: number) => void
) {
  if (!onNavigate) return <span className="whitespace-pre-line">{text}</span>;

  const refRegex = /((?:\d\s*)?[A-Za-zÀ-ú]{1,15}(?:\s+[A-Za-zÀ-ú]{1,15})*)\s+(\d+)[.:](\d+)(?:-(\d+))?/g;
  const parts: JSX.Element[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = refRegex.exec(text)) !== null) {
    const matchedText = match[0];
    const parsed = parseReference(matchedText);

    if (match.index > lastIndex) {
      parts.push(<span key={`txt-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (parsed) {
      parts.push(
        <button
          key={`ref-${match.index}`}
          type="button"
          onClick={() => onNavigate(parsed.bookId, parsed.chapter, parsed.verse)}
          className="verse-reference-link"
        >
          {matchedText}
        </button>
      );
    } else {
      parts.push(<span key={`raw-ref-${match.index}`}>{matchedText}</span>);
    }

    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`txt-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return parts.length ? <span className="whitespace-pre-line">{parts}</span> : <span className="whitespace-pre-line">{text}</span>;
}

function shortText(text: string, maxChars = 260) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > maxChars ? `${clean.slice(0, maxChars).trimEnd()}…` : clean;
}

const VerseCommentPopup = ({
  open,
  bookId,
  chapter,
  verse,
  onClose,
  onOpenAllNotes,
  onNavigate,
}: VerseCommentPopupProps) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const handleNavigate = (targetBookId: string, targetChapter: number, targetVerse?: number) => {
    if (!onNavigate) return;
    onNavigate(targetBookId, targetChapter, targetVerse);
    onClose();
  };

  useEffect(() => {
    const fetchNotes = async () => {
      if (!open || !verse) {
        setNotes([]);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from("study_notes")
        .select("id, title, content, source, note_type, verse_start, verse_end")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .order("verse_start", { ascending: true });

      const relevant = (data || []).filter((n) => {
        const startsBeforeOrOnVerse = n.verse_start <= verse;
        const endsAfterOrOnVerse = n.verse_end ? n.verse_end >= verse : n.verse_start === verse;
        return startsBeforeOrOnVerse && endsAfterOrOnVerse;
      });

      setNotes(sanitizeStudyNotes(relevant as StudyNote[]));
      setExpandedNotes({});
      setLoading(false);
    };

    fetchNotes();
  }, [open, verse, bookId, chapter]);

  const groupedBySource = useMemo(() => {
    return notes.reduce<Record<string, StudyNote[]>>((acc, note) => {
      const source = note.source || note.note_type || "Comentário";
      if (!acc[source]) acc[source] = [];
      acc[source].push(note);
      return acc;
    }, {});
  }, [notes]);

  if (!open || !verse) return null;

  return (
    <div className="fixed right-4 bottom-10 z-50 w-[min(520px,calc(100vw-2rem))] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl animate-fade-in-up">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/70">
        <MessageSquare className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Comentário • v.{verse}</p>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto reader-icon-button"
          aria-label="Fechar comentário"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-[80vh] overflow-y-auto px-3 py-3 space-y-3">
        {loading ? (
          <div className="py-8 flex items-center justify-center text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando comentário...
          </div>
        ) : notes.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground space-y-2">
            <p>Nenhum comentário específico para este versículo.</p>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-primary hover:underline"
              onClick={onOpenAllNotes}
            >
              <BookOpenText className="w-4 h-4" /> Abrir notas do capítulo
            </button>
          </div>
        ) : (
          Object.entries(groupedBySource).map(([source, sourceNotes]) => (
            <div key={source} className="rounded-xl border border-border/70 bg-background/70 p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">{source}</p>
              <div className="space-y-2">
                {sourceNotes.map((note) => {
                  const isExpanded = Boolean(expandedNotes[note.id]);
                  const canCollapse = note.content.length > 300;

                  return (
                    <div key={note.id} className="text-sm leading-relaxed text-comment-black">
                      {note.title && <p className="font-semibold mb-1">{note.title}</p>}

                      {isExpanded || !canCollapse ? (
                        <TranslatableText
                          text={note.content}
                          className="text-sm leading-relaxed text-comment-black"
                          renderText={(content) => renderContentWithRefs(content, onNavigate ? handleNavigate : undefined)}
                          forceTranslate
                        />
                      ) : (
                        <TranslatableText
                          text={shortText(note.content)}
                          className={cn("whitespace-pre-line text-comment-black")}
                          showOriginalToggle={false}
                          forceTranslate
                        />
                      )}

                      {canCollapse && (
                        <button
                          type="button"
                          onClick={() => setExpandedNotes((prev) => ({ ...prev, [note.id]: !isExpanded }))}
                          className="mt-1 text-[11px] text-primary hover:underline"
                        >
                          {isExpanded ? "Recolher" : "Abrir completo"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VerseCommentPopup;
