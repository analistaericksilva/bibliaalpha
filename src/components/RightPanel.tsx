import { useState, useEffect } from "react";
import { X, BookOpen, StickyNote, ChevronDown, ChevronRight, MessageCircle, Sparkles, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface RightPanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  selectedVerse: number | null;
  onNavigate: (bookId: string, chapter: number, verse?: number) => void;
}

interface StudyNote {
  id: string;
  title: string | null;
  content: string;
  source: string | null;
  note_type: string;
  verse_start: number;
  verse_end: number | null;
}

interface SermonNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updated_at: string;
}

const RightPanel = ({ open, onClose, bookId, chapter, selectedVerse, onNavigate }: RightPanelProps) => {
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "notepad">("comments");
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [sermons, setSermons] = useState<SermonNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingSermons, setLoadingSermons] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [expandedAuthors, setExpandedAuthors] = useState<Set<string>>(new Set());
  
  // New sermon form
  const [showNewSermon, setShowNewSermon] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    if (open && selectedVerse) {
      fetchNotes();
    }
  }, [open, bookId, chapter, selectedVerse]);

  useEffect(() => {
    if (open && activeTab === "notepad" && user) {
      fetchSermons();
    }
  }, [open, activeTab, user]);

  const fetchNotes = async () => {
    setLoadingNotes(true);
    const { data } = await supabase
      .from("study_notes")
      .select("*")
      .eq("book_id", bookId)
      .eq("chapter", chapter)
      .order("verse_start", { ascending: true });
    if (data) setNotes(data);
    setLoadingNotes(false);
  };

  const fetchSermons = async () => {
    if (!user) return;
    setLoadingSermons(true);
    const { data } = await supabase
      .from("sermon_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setSermons(data);
    setLoadingSermons(false);
  };

  const createSermon = async () => {
    if (!user || !newTitle.trim()) return;
    const { data, error } = await supabase
      .from("sermon_notes")
      .insert({
        user_id: user.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: [],
        verses_refs: [],
      })
      .select()
      .single();
    if (!error && data) {
      setSermons([data, ...sermons]);
      setNewTitle("");
      setNewContent("");
      setShowNewSermon(false);
      toast({ title: "Sermão criado", description: "Seu sermão foi adicionado." });
    }
  };

  const deleteSermon = async (id: string) => {
    await supabase.from("sermon_notes").delete().eq("id", id);
    setSermons(sermons.filter(s => s.id !== id));
  };

  const shareSermon = async (sermon: SermonNote) => {
    const shareText = `📝 *${sermon.title}*\n\n${sermon.content.slice(0, 500)}...\n\n— Criado na Bíblia Alpha`;
    try {
      await navigator.share({ text: shareText });
    } catch {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Copiado!", description: "Sermão copiado." });
    }
  };

  // Group notes by author
  const notesByAuthor = notes.reduce((acc, note) => {
    const author = note.source || note.note_type || "Comentário";
    if (!acc[author]) acc[author] = [];
    acc[author].push(note);
    return acc;
  }, {} as Record<string, StudyNote[]>);

  const toggleAuthor = (author: string) => {
    setExpandedAuthors(prev => {
      const next = new Set(prev);
      if (next.has(author)) next.delete(author);
      else next.add(author);
      return next;
    });
  };

  const toggleNote = (noteId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  };

  if (!open) return null;

  return (
    <>
      <div className={`fixed right-0 top-14 bottom-0 z-30 transition-all duration-300 ${
        isMinimized ? "w-12" : "w-96"
      }`}>
        <div className="h-full bg-background/95 backdrop-blur-xl border-l border-border/30 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent">
            {isMinimized ? (
              <button
                onClick={() => setIsMinimized(false)}
                className="w-full h-full flex items-center justify-center hover:bg-muted/50 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-semibold tracking-wide">INSIGHTS</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                    title="Minimizar"
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                    title="Fechar"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                <TabsList className="mx-3 mt-2 grid grid-cols-2 bg-muted/50">
                  <TabsTrigger value="comments" className="text-xs gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Comentários
                  </TabsTrigger>
                  <TabsTrigger value="notepad" className="text-xs gap-1.5">
                    <StickyNote className="w-3.5 h-3.5" />
                    Notepad
                  </TabsTrigger>
                </TabsList>

                {/* Comments Tab */}
                <TabsContent value="comments" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-3">
                      {loadingNotes ? (
                        <div className="flex justify-center py-8">
                          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                      ) : notes.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">Nenhum comentário disponível</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Selecione um versículo para ver comentários</p>
                        </div>
                      ) : (
                        Object.entries(notesByAuthor).map(([author, authorNotes]) => (
                          <div key={author} className="space-y-2">
                            {/* Author Header */}
                            <button
                              onClick={() => toggleAuthor(author)}
                              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 transition-all"
                            >
                              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-primary">{author.charAt(0)}</span>
                                </div>
                                {author}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {authorNotes.length}
                                </span>
                                {expandedAuthors.has(author) ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                              </div>
                            </button>

                            {/* Notes */}
                            {expandedAuthors.has(author) && (
                              <div className="space-y-2 pl-2">
                                {authorNotes.map(note => (
                                  <div
                                    key={note.id}
                                    className="rounded-xl border border-border/20 bg-card/50 overflow-hidden transition-all duration-200"
                                  >
                                    <button
                                      onClick={() => toggleNote(note.id)}
                                      className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                                    >
                                      <div className="text-left">
                                        <span className="text-xs font-medium text-foreground">
                                          {note.title || `Versículos ${note.verse_start}${note.verse_end ? `-${note.verse_end}` : ""}`}
                                        </span>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                          {note.content.slice(0, 60)}...
                                        </p>
                                      </div>
                                      {expandedNotes.has(note.id) ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                      )}
                                    </button>
                                    {expandedNotes.has(note.id) && (
                                      <div className="px-3 pb-3 pt-0">
                                        <div className="p-3 rounded-lg bg-muted/30 text-sm font-serif text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                          {note.content}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Notepad Tab */}
                <TabsContent value="notepad" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-3">
                      {/* New Sermon Button */}
                      <Button
                        onClick={() => setShowNewSermon(!showNewSermon)}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl text-xs font-medium"
                      >
                        <StickyNote className="w-3.5 h-3.5 mr-1.5" />
                        Novo Sermão
                      </Button>

                      {/* New Sermon Form */}
                      {showNewSermon && (
                        <div className="p-3 rounded-xl border border-border/20 bg-muted/30 space-y-2">
                          <input
                            type="text"
                            placeholder="Título do sermão..."
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-background border border-border/20 rounded-lg"
                          />
                          <textarea
                            placeholder="Escreva seu sermão..."
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-background border border-border/20 rounded-lg min-h-[100px] resize-none"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={createSermon} className="flex-1 text-xs rounded-lg">
                              Salvar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowNewSermon(false)} className="text-xs rounded-lg">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}

                      {loadingSermons ? (
                        <div className="flex justify-center py-8">
                          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                      ) : sermons.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
                            <StickyNote className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">Nenhum sermão ainda</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sermons.map(sermon => (
                            <div
                              key={sermon.id}
                              className="p-3 rounded-xl border border-border/20 bg-card/50 hover:bg-muted/30 transition-colors"
                            >
                              <h4 className="text-sm font-semibold text-foreground truncate">{sermon.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sermon.content.slice(0, 80)}...</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(sermon.updated_at).toLocaleDateString("pt-BR")}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => shareSermon(sermon)}
                                    className="p-1 rounded hover:bg-muted"
                                    title="Compartilhar"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={() => deleteSermon(sermon.id)}
                                    className="p-1 rounded hover:bg-red-500/10"
                                    title="Excluir"
                                  >
                                    <X className="w-3.5 h-3.5 text-red-400" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
      
      {/* Backdrop */}
      {!isMinimized && (
        <div className="fixed inset-0 z-25" onClick={onClose} />
      )}
    </>
  );
};

export default RightPanel;