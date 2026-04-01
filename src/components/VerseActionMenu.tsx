import { useState } from "react";
import { Heart, Highlighter, MessageSquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface VerseActionMenuProps {
  verse: number;
  x: number;
  y: number;
  isFavorite: boolean;
  highlightColor: string | null;
  existingNote: string;
  onClose: () => void;
  onToggleFavorite: () => void;
  onHighlight: (color: string) => void;
  onSaveNote: (content: string) => void;
}

const HIGHLIGHT_COLORS = [
  { name: "Amarelo", value: "yellow", class: "bg-yellow-300" },
  { name: "Verde", value: "green", class: "bg-green-300" },
  { name: "Azul", value: "blue", class: "bg-blue-300" },
  { name: "Rosa", value: "pink", class: "bg-pink-300" },
  { name: "Laranja", value: "orange", class: "bg-orange-300" },
];

const VerseActionMenu = ({
  verse,
  x,
  y,
  isFavorite,
  highlightColor,
  existingNote,
  onClose,
  onToggleFavorite,
  onHighlight,
  onSaveNote,
}: VerseActionMenuProps) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(existingNote);

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px] animate-fade-in"
        style={{
          left: Math.min(x, window.innerWidth - 220),
          top: Math.min(y, window.innerHeight - 250),
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-sans font-semibold text-primary tracking-wider">
            VERSÍCULO {verse}
          </span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Favorite */}
        <button
          onClick={() => { onToggleFavorite(); onClose(); }}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm font-sans transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-destructive text-destructive" : ""}`} />
          {isFavorite ? "Remover favorito" : "Favoritar"}
        </button>

        {/* Highlight colors */}
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Highlighter className="w-4 h-4 text-muted-foreground mr-1" />
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => { onHighlight(c.value); onClose(); }}
              className={`w-5 h-5 rounded-full border-2 ${c.class} ${
                highlightColor === c.value ? "border-foreground ring-1 ring-foreground" : "border-transparent"
              } transition-all`}
              title={c.name}
            />
          ))}
        </div>

        {/* Note */}
        {!showNoteInput ? (
          <button
            onClick={() => setShowNoteInput(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm font-sans transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
            {existingNote ? "Editar nota" : "Adicionar nota"}
          </button>
        ) : (
          <div className="mt-2 space-y-2">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escreva sua nota..."
              className="text-sm min-h-[60px] font-sans"
              autoFocus
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                className="text-xs flex-1"
                onClick={() => { onSaveNote(noteText); onClose(); }}
              >
                Salvar
              </Button>
              {existingNote && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs"
                  onClick={() => { onSaveNote(""); onClose(); }}
                >
                  Apagar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VerseActionMenu;
