import { useState, useEffect } from "react";
import { X, BookOpen, StickyNote, ChevronDown, ChevronRight, MessageCircle, Sparkles, PanelRightOpen } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"comments" | "notepad">("comments");
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [sermons, setSermons] = useState<SermonNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingSermons, setLoadingSermons] = useState(false);
  const [expandedAuthors, setExpandedAuthors] = useState<Set<string>>(new Set());
  
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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Panel - Slide from right */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 animate-in slide-in-from-right duration-300">
        <div className="h-full bg-gradient-to-b from-card to-background border-l border-border/30 shadow-2xl flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/90 to-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Insights & Notas
                </h2>
                <p className="text-[10px] text-muted-foreground">Comentários e anotações</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-3 grid grid-cols-2 bg-muted/30 p-1 rounded-xl">
                <TabsTrigger 
                  value="comments" 
                  className="text-xs rounded-lg gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Comentários
                </TabsTrigger>
                <TabsTrigger 
                  value="notepad" 
                  className="text-xs rounded-lg gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  Notepad
                </TabsTrigger>
              </TabsList>

              {/* Comments Tab */}
              <TabsContent value="comments" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {loadingNotes ? (
                      <div className="flex justify-center py-10">
                        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : notes.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted to-muted/50 mx-auto mb-4 flex items-center justify-center">
                          <BookOpen className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">Nenhum comentário</p>
                        <p className="text-xs text-muted-foreground">Selecione um versículo para ver comentários</p>
                      </div>
                    ) : (
                      Object.entries(notesByAuthor).map(([author, authorNotes]) => (
                        <div key={author} className="space-y-2">
                          {/* Author Header - Always visible */}
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/40 to-muted/20 border border-border/20">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary-foreground">{author.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground truncate">{author}</span>
                                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                                  {authorNotes.length} {authorNotes.length === 1 ? "nota" : "notas"}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {authorNotes[0].title || `Versículos ${authorNotes.map(n => n.verse_start).join(", ")}`}
                              </p>
                            </div>
                            <button
                              onClick={() => toggleAuthor(author)}
                              className={`p-1.5 rounded-lg transition-all duration-200 ${
                                expandedAuthors.has(author) 
                                  ? "bg-primary/20 text-primary" 
                                  : "hover:bg-muted text-muted-foreground"
                              }`}
                            >
                              {expandedAuthors.has(author) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          {/* Notes - Collapsible */}
                          {expandedAuthors.has(author) && (
                            <div className="ml-2 pl-3 border-l-2 border-primary/20 space-y-2">
                              {authorNotes.map(note => (
                                <div
                                  key={note.id}
                                  className="p-3 rounded-xl bg-card/50 border border-border/15 hover:border-border/30 transition-all duration-200"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-semibold text-foreground block">
                                        {note.title || `Versículo ${note.verse_start}${note.verse_end ? `-${note.verse_end}` : ""}`}
                                      </span>
                                      <p className="text-sm font-serif text-foreground/80 mt-2 leading-relaxed whitespace-pre-wrap">
                                        {note.content}
                                      </p>
                                    </div>
                                  </div>
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
                  <div className="p-4 space-y-3">
                    <Button
                      onClick={() => setShowNewSermon(!showNewSermon)}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl text-xs font-medium py-2.5"
                    >
                      <StickyNote className="w-4 h-4 mr-2" />
                      Novo Sermão
                    </Button>

                    {showNewSermon && (
                      <div className="p-4 rounded-xl border border-border/20 bg-muted/20 space-y-3">
                        <input
                          type="text"
                          placeholder="Título do sermão..."
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm bg-background border border-border/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <textarea
                          placeholder="Escreva seu sermão..."
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm bg-background border border-border/20 rounded-xl min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={createSermon} 
                            className="flex-1 text-xs rounded-lg bg-primary hover:bg-primary/90"
                          >
                            Salvar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setShowNewSermon(false)} 
                            className="text-xs rounded-lg"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {loadingSermons ? (
                      <div className="flex justify-center py-10">
                        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : sermons.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted to-muted/50 mx-auto mb-4 flex items-center justify-center">
                          <StickyNote className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">Nenhum sermão ainda</p>
                        <p className="text-xs text-muted-foreground">Crie seu primeiro sermão</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sermons.map(sermon => (
                          <div
                            key={sermon.id}
                            className="p-4 rounded-xl bg-card/50 border border-border/15 hover:border-border/30 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-foreground truncate">{sermon.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{sermon.content.slice(0, 100)}...</p>
                                <p className="text-[10px] text-muted-foreground/60 mt-2">
                                  {new Date(sermon.updated_at).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1 shrink-0">
                                <button
                                  onClick={() => shareSermon(sermon)}
                                  className="p-1.5 rounded-lg hover:bg-muted"
                                  title="Compartilhar"
                                >
                                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() => deleteSermon(sermon.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10"
                                  title="Excluir"
                                >
                                  <X className="w-4 h-4 text-red-400" />
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

          {/* Footer */}
          <div className="p-3 border-t border-border/10 bg-muted/10">
            <p className="text-[10px] text-muted-foreground/60 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Bíblia Alpha • IA bíblica
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RightPanel;