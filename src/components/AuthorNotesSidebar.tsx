import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, BookOpen, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudyNote {
  id: string;
  verse_start: number;
  verse_end: number | null;
  title: string | null;
  content: string;
  source: string | null;
  note_type: string;
  color?: string | null;
}

interface AuthorNotesSidebarProps {
  bookId: string;
  chapter: number;
  isOpen: boolean;
  onToggle: () => void;
}

const AuthorNotesSidebar = ({ bookId, chapter, isOpen, onToggle }: AuthorNotesSidebarProps) => {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId || !chapter) return;
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("study_notes")
          .select("*")
          .eq("book_id", bookId)
          .eq("chapter", chapter)
          .order("verse_start", { ascending: true });
        if (!error && data) setNotes(data);
      } catch (err) {
        console.error("Error fetching notes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [bookId, chapter]);

  const getNoteTypeColor = (type: string) => {
    const map: Record<string, string> = {
      commentary: "bg-blue-100 text-blue-800",
      patristic: "bg-amber-100 text-amber-800",
      explanation: "bg-green-100 text-green-800",
      concordance: "bg-teal-100 text-teal-800",
      study: "bg-indigo-100 text-indigo-800",
    };
    return map[type] || "bg-gray-100 text-gray-800";
  };

  const getNoteTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      commentary: "Comentário",
      patristic: "Patrística",
      explanation: "Explicação",
      concordance: "Concordância",
      study: "Estudo",
    };
    return map[type] || type;
  };

  return (
    <div
      className={`flex-shrink-0 flex h-full transition-all duration-300 border-l border-border bg-background ${
        isOpen ? "w-[300px]" : "w-8"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-8 h-full flex items-center justify-center hover:bg-muted/50 transition-colors"
        title={isOpen ? "Recolher notas" : "Notas dos Autores"}
      >
        {isOpen ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="flex-1 flex flex-col overflow-hidden border-l border-border">
          <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-2 flex-shrink-0">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold tracking-wide uppercase">
              Notas dos Autores
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && notes.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Sem notas para este capítulo.</p>
                </div>
              )}
              {!loading &&
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-border bg-card shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedNote(
                          expandedNote === note.id ? null : note.id
                        )
                      }
                      className="w-full text-left p-2 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start gap-1">
                        <div className="flex-1 min-w-0">
                          {note.title && (
                            <p className="text-xs font-medium truncate">
                              {note.title}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {note.source && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {note.source}
                              </span>
                            )}
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getNoteTypeColor(
                                note.note_type
                              )}`}
                            >
                              {getNoteTypeLabel(note.note_type)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              v.{note.verse_start}
                              {note.verse_end &&
                              note.verse_end !== note.verse_start
                                ? `-${note.verse_end}`
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="px-2 pb-2">
                      <p
                        className={`text-xs text-muted-foreground leading-relaxed ${
                          expandedNote === note.id ? "" : "line-clamp-3"
                        }`}
                      >
                        {note.content}
                      </p>
                      {note.content.length > 120 && (
                        <button
                          onClick={() =>
                            setExpandedNote(
                              expandedNote === note.id ? null : note.id
                            )
                          }
                          className="text-[10px] text-primary hover:underline mt-1"
                        >
                          {expandedNote === note.id ? "Ver menos" : "Ver mais"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default AuthorNotesSidebar;
