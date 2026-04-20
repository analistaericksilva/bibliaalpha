import { cn } from '../App';
import * as React from 'react';
import { X, FileText, UploadCloud, RefreshCw, PeNLine, Bold, Italic, List } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NotepadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chapterContext: string;
}

export default function NotepadPanel({ isOpen, onClose, chapterContext }: NotepadPanelProps) {
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    setNoteContent('');
  }, [chapterContext]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setLastSaved(new Date());
      setIsSaving(false);
      const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(`Estudos: ${chapterContext}\n\n${noteContent}`);
      const a = document.createElement('a');
      a.setAttribute("href", dataStr);
      a.setAttribute("download", `Estudo_${chapterContext.replace(' ', '_')}.txt`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    }, 600);
  };

  const handleFormat = (marker: string) => {
    setNoteContent(prev => prev + ` ${marker} `);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/10 z-40 lg:hidden" onClick={onClose} />
      )}
      <div className={cn(
        "fixed inset-y-0 right-0 w[90vw] sm:w-[450px] bg-white shadow-2xl border-l border-sleek-border z-50 transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <header className="h-14 shrink-0 border-b border-sleek-border flex items-center justify-between px-4 bg-sleek-bg">
          <div className="flex items-center gap-2 font-semibold text-[13px] text-sleek-text-main">
            <PenLine size={16} /> Meu Bloco de Notas ({chapterContext})
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-sleek-hover rounded-md text-sleek-text-muted transition-colors">
            <X size={18} />
          </button>
        </header>

        <div className="flex items-center gap-1 px-4 py-2 border-b border-sleek-border bg-[#F9F9F9]">
          <button onClick={() => handleFormat('**Negrito**')} className="p-1.5 hover:bg-sleek-hover rounded text-sleek-text-main"><Bold size={14} /></button>
          <button onClick={() => handleFormat('*Itálico*')} className="p-1.5 hover:bg-sleek-hover rounded text-sleek-text-main"><Italic size={14} /></button>
          <button onClick={() => handleFormat('- ')} className="p-1.5 hover:bg-sleek-hover rounded text-sleek-text-main"><List size={14} /></button>
          <div className="w-[1px] h-4 bg-sleek-border mx-2"></div>
          <button className="text-[11px] font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors" onClick={() => window.open('https://michaelis.uol.com.br/', '_blank')}>
            Dicionário Externo
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col bg-[#FDFDFD]">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Escreva seus insights, liste versículos e monte rascunhos de pregação..."
            className="w-full flex-1 outline-none resize-none text-[15px] leading-relaxed text-sleek-text-main placeholder:text-sleek-text-muted/50 bg-transparent custom-scrollbar"
          />
        </div>

        <footer className="shrink-0 p-4 border-t border-sleek-border bg-sleek-bg flex items-center justify-between">
          <div className="text-[11px] text-sleek-text-muted flex items-center gap-1.5">
            {isSaving ? (
              <>><RefreshCw size={12} className="animate-spin" /> Preparando download...</>
            ) : lastSaved ? (
              <>><FileText size={12} /> Baixado às {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</><
            ) : (
              "Escreva e baixe como .txt"
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#0F9D58] text-white px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-[#0b8248] transition-colors disabled:opacity-50 shadow-sm"
          >
            <UploadCloud size={14} /> Baixar .txt
          </button>
        </footer>
      </div>
    </>
  );
}
