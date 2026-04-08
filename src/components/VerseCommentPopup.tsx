import { useEffect, useMemo, useState } from "react";
import { MessageSquare, X, BookOpenText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
}

const VerseCommentPopup = ({
  open,
  bookId,
  chapter,
  verse,
  onClose,
  onOpenAllNotes,
}: VerseCommentPopupProps) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<StudyNote[]>([]);

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

      setNotes(relevant);
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
    <div className="fixed right-4 bottom-10 z-50 w-[min(480px,calc(100vw-2rem))] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl animate-fade-in-up">
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

      <div className="max-h-[55vh] overflow-y-auto px-3 py-3 space-y-3">
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
                {sourceNotes.map((note) => (
                  <div key={note.id} className="text-sm leading-relaxed text-foreground/90">
                    {note.title && <p className="font-semibold mb-1">{note.title}</p>}
                    <p className={cn("whitespace-pre-line", note.content.length > 900 && "line-clamp-6")}>{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VerseCommentPopup;
