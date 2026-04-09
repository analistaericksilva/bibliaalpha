import { useState, useEffect, useCallback, useMemo, useRef, KeyboardEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  X, Plus, Trash2, Copy, Share2, Download, BookOpen, Save, Calendar, Tag,
  Search, FileText, Bold, Italic, Underline, List, ListOrdered, Quote, Code,
  Heading1, Heading2, Heading3, CheckSquare, Link2, Image, Minus, MoreVertical,
  ChevronRight, GripVertical, Sparkles, ExternalLink, Type, AlignLeft,
  Hash, Star, Clock, Layers, Eye, EyeOff, Undo, Redo, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NotepadProps {
  open: boolean;
  onClose: () => void;
}

interface SermonNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  verses_refs: string[];
  created_at: string;
  updated_at: string;
}

// Block types for the Notion-like editor
type BlockType = "paragraph" | "heading1" | "heading2" | "heading3" | "bullet" | "numbered" | "todo" | "quote" | "code" | "divider" | "callout";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  color?: string;
}

const BLOCK_TYPES: { type: BlockType; icon: typeof Type; label: string; shortcut?: string }[] = [
  { type: "paragraph", icon: Type, label: "Texto", shortcut: "/" },
  { type: "heading1", icon: Heading1, label: "Título 1", shortcut: "/h1" },
  { type: "heading2", icon: Heading2, label: "Título 2", shortcut: "/h2" },
  { type: "heading3", icon: Heading3, label: "Título 3", shortcut: "/h3" },
  { type: "bullet", icon: List, label: "Lista", shortcut: "/lista" },
  { type: "numbered", icon: ListOrdered, label: "Lista numerada", shortcut: "/num" },
  { type: "todo", icon: CheckSquare, label: "Checklist", shortcut: "/todo" },
  { type: "quote", icon: Quote, label: "Citação", shortcut: "/citação" },
  { type: "code", icon: Code, label: "Código", shortcut: "/código" },
  { type: "divider", icon: Minus, label: "Divisor", shortcut: "/divisor" },
  { type: "callout", icon: Sparkles, label: "Destaque", shortcut: "/destaque" },
];

const COVER_COLORS = [
  "from-primary/20 to-primary/5",
  "from-blue-500/20 to-cyan-500/5",
  "from-purple-500/20 to-pink-500/5",
  "from-amber-500/20 to-orange-500/5",
  "from-emerald-500/20 to-teal-500/5",
  "from-rose-500/20 to-red-500/5",
];

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function contentToBlocks(content: string): Block[] {
  if (!content.trim()) return [{ id: generateId(), type: "paragraph", content: "" }];
  
  const lines = content.split("\n");
  const blocks: Block[] = [];
  
  for (const line of lines) {
    if (line.startsWith("### ")) {
      blocks.push({ id: generateId(), type: "heading3", content: line.slice(4) });
    } else if (line.startsWith("## ")) {
      blocks.push({ id: generateId(), type: "heading2", content: line.slice(3) });
    } else if (line.startsWith("# ")) {
      blocks.push({ id: generateId(), type: "heading1", content: line.slice(2) });
    } else if (line.startsWith("- [x] ")) {
      blocks.push({ id: generateId(), type: "todo", content: line.slice(6), checked: true });
    } else if (line.startsWith("- [ ] ")) {
      blocks.push({ id: generateId(), type: "todo", content: line.slice(6), checked: false });
    } else if (line.startsWith("- ")) {
      blocks.push({ id: generateId(), type: "bullet", content: line.slice(2) });
    } else if (/^\d+\.\s/.test(line)) {
      blocks.push({ id: generateId(), type: "numbered", content: line.replace(/^\d+\.\s/, "") });
    } else if (line.startsWith("> ")) {
      blocks.push({ id: generateId(), type: "quote", content: line.slice(2) });
    } else if (line.startsWith("```")) {
      blocks.push({ id: generateId(), type: "code", content: line.replace(/^```\w*\s?/, "").replace(/```$/, "") });
    } else if (line === "---") {
      blocks.push({ id: generateId(), type: "divider", content: "" });
    } else if (line.startsWith("💡 ") || line.startsWith("⚡ ")) {
      blocks.push({ id: generateId(), type: "callout", content: line.slice(2) });
    } else {
      blocks.push({ id: generateId(), type: "paragraph", content: line });
    }
  }
  
  return blocks.length ? blocks : [{ id: generateId(), type: "paragraph", content: "" }];
}

function blocksToContent(blocks: Block[]): string {
  return blocks.map(b => {
    switch (b.type) {
      case "heading1": return `# ${b.content}`;
      case "heading2": return `## ${b.content}`;
      case "heading3": return `### ${b.content}`;
      case "bullet": return `- ${b.content}`;
      case "numbered": return `1. ${b.content}`;
      case "todo": return `- [${b.checked ? "x" : " "}] ${b.content}`;
      case "quote": return `> ${b.content}`;
      case "code": return `\`\`\`\n${b.content}\n\`\`\``;
      case "divider": return "---";
      case "callout": return `💡 ${b.content}`;
      default: return b.content;
    }
  }).join("\n");
}

// --- Block Editor Component ---
const BlockEditor = ({ block, onChange, onKeyDown, onFocus, isFocused, autoFocusRef }: {
  block: Block;
  onChange: (updates: Partial<Block>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onFocus: () => void;
  isFocused: boolean;
  autoFocusRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
}) => {
  const baseClass = "w-full bg-transparent border-none outline-none resize-none p-0 focus:ring-0 placeholder:text-muted-foreground/40";

  if (block.type === "divider") {
    return <div className="py-2"><div className="w-full h-px bg-border" /></div>;
  }

  if (block.type === "todo") {
    return (
      <div className="flex items-start gap-2 group">
        <button
          onClick={() => onChange({ checked: !block.checked })}
          className={cn(
            "mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
            block.checked
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary"
          )}
        >
          {block.checked && <span className="text-[10px]">✓</span>}
        </button>
        <textarea
          ref={isFocused ? autoFocusRef as React.RefObject<HTMLTextAreaElement> : undefined}
          value={block.content}
          onChange={e => onChange({ content: e.target.value })}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          placeholder="Tarefa..."
          rows={1}
          className={cn(baseClass, "text-sm leading-relaxed flex-1", block.checked && "line-through text-muted-foreground")}
          style={{ minHeight: "1.5rem" }}
        />
      </div>
    );
  }

  const typeStyles: Record<BlockType, string> = {
    paragraph: "text-sm leading-relaxed",
    heading1: "text-2xl font-bold leading-tight",
    heading2: "text-xl font-semibold leading-tight",
    heading3: "text-lg font-medium leading-tight",
    bullet: "text-sm leading-relaxed pl-4",
    numbered: "text-sm leading-relaxed pl-4",
    quote: "text-sm leading-relaxed italic border-l-2 border-primary/40 pl-3 text-muted-foreground",
    code: "text-xs font-mono bg-muted/50 rounded-md p-3 leading-relaxed",
    callout: "text-sm leading-relaxed bg-primary/5 border border-primary/15 rounded-lg p-3",
    divider: "",
    todo: "",
  };

  const placeholder: Record<BlockType, string> = {
    paragraph: "Escreva algo, ou digite '/' para comandos...",
    heading1: "Título 1",
    heading2: "Título 2",
    heading3: "Título 3",
    bullet: "Item da lista",
    numbered: "Item numerado",
    quote: "Citação bíblica ou reflexão...",
    code: "Referência ou anotação técnica...",
    callout: "Destaque importante...",
    divider: "",
    todo: "",
  };

  return (
    <div className={cn("relative group", block.type === "bullet" && "flex items-start gap-2", block.type === "numbered" && "flex items-start gap-2")}>
      {block.type === "bullet" && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground/50 shrink-0" />}
      {block.type === "numbered" && <span className="mt-0.5 text-sm text-muted-foreground font-mono shrink-0">•</span>}
      <textarea
        ref={isFocused ? autoFocusRef as React.RefObject<HTMLTextAreaElement> : undefined}
        value={block.content}
        onChange={e => onChange({ content: e.target.value })}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder={placeholder[block.type]}
        rows={1}
        className={cn(baseClass, typeStyles[block.type], "flex-1")}
        style={{ minHeight: block.type.startsWith("heading") ? "2rem" : "1.5rem" }}
      />
    </div>
  );
};

// --- Main Notepad Component ---
const Notepad = ({ open, onClose }: NotepadProps) => {
  const { user } = useAuth();
  const [sermons, setSermons] = useState<SermonNote[]>([]);
  const [selectedSermon, setSelectedSermon] = useState<SermonNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number>(0);
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [coverColor, setCoverColor] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoFocusRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  const fetchSermons = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("sermon_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) setSermons(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (open && user) fetchSermons();
  }, [open, user, fetchSermons]);

  // Auto-resize textareas
  useEffect(() => {
    if (autoFocusRef.current) {
      const el = autoFocusRef.current;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
      el.focus();
    }
  }, [focusedBlockIndex, blocks]);

  const filteredSermons = useMemo(() => {
    if (!searchQuery.trim()) return sermons;
    const term = searchQuery.toLowerCase();
    return sermons.filter(s =>
      s.title.toLowerCase().includes(term) ||
      s.content.toLowerCase().includes(term) ||
      s.tags.join(" ").toLowerCase().includes(term)
    );
  }, [sermons, searchQuery]);

  const totalWords = useMemo(() => sermons.reduce((acc, s) => acc + countWords(s.content), 0), [sermons]);

  const selectSermon = (sermon: SermonNote) => {
    setSelectedSermon(sermon);
    setEditTitle(sermon.title);
    setEditTags(sermon.tags.join(", "));
    setBlocks(contentToBlocks(sermon.content));
    setShowNewForm(false);
    setShowPreview(false);
    setCoverColor(Math.abs(sermon.title.charCodeAt(0) || 0) % COVER_COLORS.length);
  };

  const createSermon = async () => {
    if (!user || !newTitle.trim()) return;
    const { data, error } = await supabase
      .from("sermon_notes")
      .insert({ user_id: user.id, title: newTitle.trim(), content: "", tags: [], verses_refs: [] })
      .select()
      .single();
    if (!error && data) {
      setSermons([data, ...sermons]);
      selectSermon(data);
      setNewTitle("");
      setShowNewForm(false);
      toast({ title: "Página criada" });
    }
  };

  const saveSermon = async () => {
    if (!selectedSermon) return;
    setIsSaving(true);
    const content = blocksToContent(blocks);
    const tagsArray = editTags.split(",").map(t => t.trim()).filter(Boolean);
    const { data, error } = await supabase
      .from("sermon_notes")
      .update({ title: editTitle.trim(), content, tags: tagsArray, updated_at: new Date().toISOString() })
      .eq("id", selectedSermon.id)
      .select()
      .single();
    if (!error && data) {
      setSermons(sermons.map(s => (s.id === data.id ? data : s)));
      setSelectedSermon(data);
      toast({ title: "Salvo", description: "Suas alterações foram salvas." });
    }
    setIsSaving(false);
  };

  const deleteSermon = async (id: string) => {
    await supabase.from("sermon_notes").delete().eq("id", id);
    setSermons(sermons.filter(s => s.id !== id));
    if (selectedSermon?.id === id) { setSelectedSermon(null); setBlocks([]); }
    toast({ title: "Página excluída" });
  };

  const copySermon = async () => {
    if (!selectedSermon) return;
    await navigator.clipboard.writeText(`# ${editTitle}\n\n${blocksToContent(blocks)}`);
    toast({ title: "Copiado para área de transferência" });
  };

  const exportSermon = () => {
    if (!selectedSermon) return;
    const md = `# ${editTitle}\n\n${blocksToContent(blocks)}\n\nTags: ${editTags}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${editTitle.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareSermon = async () => {
    if (!selectedSermon) return;
    const text = `📝 *${editTitle}*\n\n${blocksToContent(blocks).slice(0, 500)}...\n\n— Bíblia Alpha`;
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch {}
    }
    await navigator.clipboard.writeText(text);
    toast({ title: "Texto copiado para compartilhar" });
  };

  // Block operations
  const updateBlock = (index: number, updates: Partial<Block>) => {
    setBlocks(prev => prev.map((b, i) => i === index ? { ...b, ...updates } : b));
  };

  const addBlockAfter = (index: number, type: BlockType = "paragraph") => {
    const newBlock: Block = { id: generateId(), type, content: "", checked: type === "todo" ? false : undefined };
    setBlocks(prev => [...prev.slice(0, index + 1), newBlock, ...prev.slice(index + 1)]);
    setFocusedBlockIndex(index + 1);
  };

  const removeBlock = (index: number) => {
    if (blocks.length <= 1) return;
    setBlocks(prev => prev.filter((_, i) => i !== index));
    setFocusedBlockIndex(Math.max(0, index - 1));
  };

  const changeBlockType = (index: number, type: BlockType) => {
    updateBlock(index, { type, checked: type === "todo" ? false : undefined });
    setShowSlashMenu(false);
    setSlashFilter("");
  };

  const handleBlockKeyDown = (index: number) => (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const block = blocks[index];

    // Slash command
    if (e.key === "/" && block.content === "") {
      e.preventDefault();
      setShowSlashMenu(true);
      setSlashFilter("");
      return;
    }

    // Enter: new block
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showSlashMenu) {
        const filtered = BLOCK_TYPES.filter(bt => bt.label.toLowerCase().includes(slashFilter.toLowerCase()));
        if (filtered.length) changeBlockType(index, filtered[0].type);
        return;
      }
      addBlockAfter(index, block.type === "bullet" || block.type === "numbered" || block.type === "todo" ? block.type : "paragraph");
    }

    // Backspace on empty: remove block
    if (e.key === "Backspace" && block.content === "" && blocks.length > 1) {
      e.preventDefault();
      removeBlock(index);
    }

    // Arrow up/down navigation
    if (e.key === "ArrowUp" && index > 0) {
      setFocusedBlockIndex(index - 1);
    }
    if (e.key === "ArrowDown" && index < blocks.length - 1) {
      setFocusedBlockIndex(index + 1);
    }

    // Tab to indent (convert to bullet)
    if (e.key === "Tab") {
      e.preventDefault();
      if (block.type === "paragraph") changeBlockType(index, "bullet");
      else if (block.type === "bullet") changeBlockType(index, "numbered");
      else if (block.type === "numbered") changeBlockType(index, "paragraph");
    }

    // Escape slash menu
    if (e.key === "Escape" && showSlashMenu) {
      setShowSlashMenu(false);
    }
  };

  const filteredBlockTypes = BLOCK_TYPES.filter(bt => bt.label.toLowerCase().includes(slashFilter.toLowerCase()));

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-2 sm:inset-4 md:inset-6 z-50 flex items-center justify-center">
        <div className="w-full h-full max-w-7xl bg-background rounded-2xl border border-border shadow-2xl flex overflow-hidden">

          {/* Sidebar */}
          <aside className="w-[280px] border-r border-border flex flex-col bg-muted/20">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Minhas Páginas</span>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{sermons.length}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => { setShowNewForm(true); setSelectedSermon(null); }}
                  size="sm"
                  className="flex-1 h-8 text-xs rounded-lg"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Nova Página
                </Button>
              </div>

              <div className="relative mt-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-8 h-8 text-xs rounded-lg bg-background/50"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="px-4 py-2 border-b border-border/30 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{sermons.length} páginas</span>
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{totalWords.toLocaleString("pt-BR")} palavras</span>
            </div>

            {/* Pages List */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : filteredSermons.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Nenhuma página</p>
                  </div>
                ) : (
                  filteredSermons.map(sermon => (
                    <button
                      key={sermon.id}
                      onClick={() => selectSermon(sermon)}
                      className={cn(
                        "w-full p-2.5 rounded-lg text-left transition-all group",
                        selectedSermon?.id === sermon.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/60 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📄</span>
                        <h3 className="text-xs font-medium text-foreground truncate flex-1">{sermon.title}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted" onClick={e => e.stopPropagation()}>
                              <MoreVertical className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => deleteSermon(sermon.id)} className="text-destructive">
                              <Trash2 className="w-3 h-3 mr-2" />Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{sermon.content.slice(0, 80) || "Página vazia"}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Clock className="w-2.5 h-2.5 text-muted-foreground/50" />
                        <span className="text-[9px] text-muted-foreground/50">{new Date(sermon.updated_at).toLocaleDateString("pt-BR")}</span>
                        {sermon.tags.length > 0 && (
                          <span className="text-[9px] text-primary/60 ml-auto">
                            {sermon.tags.length} tags
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Notion Link */}
            <div className="p-3 border-t border-border/50">
              <a
                href="https://www.notion.so"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-lg bg-background/50 border border-border/50 hover:bg-muted/60 transition-colors group"
              >
                <div className="w-6 h-6 rounded-md bg-foreground/5 flex items-center justify-center">
                  <span className="text-sm">📝</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium text-foreground block">Abrir Notion</span>
                  <span className="text-[9px] text-muted-foreground">Conecte e organize tudo</span>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            </div>
          </aside>

          {/* Main Content */}
          <section className="flex-1 flex flex-col min-w-0">
            {showNewForm ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-md space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">Nova Página</h2>
                    <p className="text-xs text-muted-foreground mt-1">Crie sermões, estudos, reflexões e muito mais</p>
                  </div>
                  <Input
                    placeholder="Título da página..."
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="text-center text-lg font-medium h-12 rounded-xl"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && createSermon()}
                  />
                  <div className="flex gap-2 justify-center">
                    <Button onClick={createSermon} disabled={!newTitle.trim()} className="rounded-xl">
                      Criar Página
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewForm(false)} className="rounded-xl">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ) : selectedSermon ? (
              <>
                {/* Editor Toolbar */}
                <div className="h-11 flex items-center justify-between px-4 border-b border-border/50 bg-muted/10 shrink-0">
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      {[
                        { icon: Bold, label: "Negrito", action: () => {} },
                        { icon: Italic, label: "Itálico", action: () => {} },
                        { icon: Underline, label: "Sublinhado", action: () => {} },
                        { icon: Code, label: "Código", action: () => changeBlockType(focusedBlockIndex, "code") },
                        { icon: Quote, label: "Citação", action: () => changeBlockType(focusedBlockIndex, "quote") },
                        { icon: List, label: "Lista", action: () => changeBlockType(focusedBlockIndex, "bullet") },
                        { icon: ListOrdered, label: "Numerada", action: () => changeBlockType(focusedBlockIndex, "numbered") },
                        { icon: CheckSquare, label: "Checklist", action: () => changeBlockType(focusedBlockIndex, "todo") },
                      ].map(({ icon: Icon, label, action }) => (
                        <Tooltip key={label}>
                          <TooltipTrigger asChild>
                            <button onClick={action} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-[10px]">{label}</TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>

                    <div className="w-px h-5 bg-border mx-1" />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted text-xs text-muted-foreground">
                          <Heading1 className="w-3.5 h-3.5" />
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => changeBlockType(focusedBlockIndex, "heading1")}>
                          <Heading1 className="w-4 h-4 mr-2" />Título 1
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeBlockType(focusedBlockIndex, "heading2")}>
                          <Heading2 className="w-4 h-4 mr-2" />Título 2
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeBlockType(focusedBlockIndex, "heading3")}>
                          <Heading3 className="w-4 h-4 mr-2" />Título 3
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => changeBlockType(focusedBlockIndex, "paragraph")}>
                          <Type className="w-4 h-4 mr-2" />Texto normal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => setShowPreview(!showPreview)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[10px]">
                          {showPreview ? "Editar" : "Visualizar"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <button onClick={copySermon} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Copiar">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={shareSermon} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Compartilhar">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={exportSermon} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Exportar">
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-5 bg-border mx-1" />

                    <Button onClick={saveSermon} size="sm" disabled={isSaving} className="h-7 text-xs rounded-lg px-3">
                      <Save className="w-3 h-3 mr-1" />
                      {isSaving ? "Salvando..." : "Salvar"}
                    </Button>

                    <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground ml-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Editor Area */}
                <ScrollArea className="flex-1">
                  <div className="max-w-3xl mx-auto py-8 px-6">
                    {/* Cover */}
                    <div className={cn("h-24 rounded-xl bg-gradient-to-r mb-6", COVER_COLORS[coverColor])} />

                    {/* Title */}
                    <input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder="Sem título"
                      className="w-full text-3xl font-bold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/30 mb-1"
                    />

                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-6">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      <input
                        value={editTags}
                        onChange={e => setEditTags(e.target.value)}
                        placeholder="Adicionar tags separadas por vírgula..."
                        className="text-xs text-muted-foreground bg-transparent border-none outline-none flex-1 placeholder:text-muted-foreground/30"
                      />
                      {editTags && editTags.split(",").filter(t => t.trim()).map(tag => (
                        <Badge key={tag.trim()} variant="secondary" className="text-[10px] h-5 px-1.5">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>

                    {/* Block Editor */}
                    {showPreview ? (
                      <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {blocksToContent(blocks)}
                      </div>
                    ) : (
                      <div className="space-y-1 relative">
                        {blocks.map((block, index) => (
                          <div
                            key={block.id}
                            className={cn(
                              "group flex items-start gap-1 rounded-md px-1 -mx-1 transition-colors",
                              focusedBlockIndex === index && "bg-muted/30"
                            )}
                          >
                            {/* Block handle */}
                            <div className="flex items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-0.5 rounded hover:bg-muted text-muted-foreground">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                  {BLOCK_TYPES.map(bt => (
                                    <DropdownMenuItem key={bt.type} onClick={() => { addBlockAfter(index, bt.type); }}>
                                      <bt.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                                      <span>{bt.label}</span>
                                      {bt.shortcut && <span className="ml-auto text-[10px] text-muted-foreground">{bt.shortcut}</span>}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <button className="p-0.5 rounded hover:bg-muted text-muted-foreground cursor-grab">
                                <GripVertical className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Block content */}
                            <div className="flex-1 min-w-0 py-0.5">
                              <BlockEditor
                                block={block}
                                onChange={updates => updateBlock(index, updates)}
                                onKeyDown={handleBlockKeyDown(index)}
                                onFocus={() => { setFocusedBlockIndex(index); setShowSlashMenu(false); }}
                                isFocused={focusedBlockIndex === index}
                                autoFocusRef={autoFocusRef}
                              />
                            </div>
                          </div>
                        ))}

                        {/* Slash Command Menu */}
                        {showSlashMenu && (
                          <div className="absolute left-8 bg-card border border-border rounded-xl shadow-xl p-1.5 w-56 z-50 animate-in fade-in slide-in-from-top-2">
                            <p className="text-[10px] text-muted-foreground px-2 py-1 font-medium">BLOCOS BÁSICOS</p>
                            {filteredBlockTypes.map(bt => (
                              <button
                                key={bt.type}
                                onClick={() => changeBlockType(focusedBlockIndex, bt.type)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-muted transition-colors text-left"
                              >
                                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                                  <bt.icon className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <div>
                                  <span className="text-foreground font-medium">{bt.label}</span>
                                  {bt.shortcut && <span className="text-muted-foreground ml-1">{bt.shortcut}</span>}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Add block button at end */}
                        <button
                          onClick={() => addBlockAfter(blocks.length - 1)}
                          className="w-full py-3 text-xs text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Adicionar bloco
                        </button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Bloco de Notas</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  Crie páginas para seus sermões, estudos bíblicos e reflexões. Use blocos para organizar como no Notion.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => { setShowNewForm(true); }} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Página
                  </Button>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3 max-w-sm">
                  {[
                    { icon: "📝", label: "Sermões" },
                    { icon: "📖", label: "Estudos" },
                    { icon: "💭", label: "Reflexões" },
                    { icon: "✅", label: "Checklists" },
                    { icon: "📋", label: "Anotações" },
                    { icon: "🔗", label: "Referências" },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-lg bg-muted/30 text-center">
                      <span className="text-lg">{item.icon}</span>
                      <p className="text-[10px] text-muted-foreground mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default Notepad;
