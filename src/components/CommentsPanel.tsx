import { useState, useEffect } from 'react';
import * as React from 'react';
import { Quote } from 'lucide-react';
import { getVerseCommentaries } from '../services/bibleApi';
import { translateCommentaries } from '../services/aiTranslation';
import { cn } from '../App';

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookId?: string;
  chapter?: number;
  verseNumber?: number | null;
}

export default function CommentsPanel({ isOpen, onClose, bookId, chapter, verseNumber }: CommentsPanelProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!bookId || !chapter || !verseNumber) {
      setNote('');
      return;
    }
    const noteKey = `note_${bookId}_${chapter}_${verseNumber}`;
    setNote(localStorage.getItem(noteKey) || '');
  }, [bookId, chapter, verseNumber]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNote(val);
    if (!bookId || !chapter || !verseNumber) return;
    const noteKey = `note_${bookId}_${chapter}_${verseNumber}`;
    localStorage.setItem(noteKey, val);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      if (!bookId || !chapter || !verseNumber || !isOpen) {
        setComments([]);
        return;
      }

      setIsLoading(true);
      setComments([]);

      try {
        const rawComments = await getVerseCommentaries(bookId, chapter, verseNumber);
        if (!isMounted) return;

        const ptComments = await translateCommentaries(bookId, chapter, verseNumber, rawComments);
        if (isMounted) setComments(ptComments);
      } catch (e) {
        console.error('CommentsPanel error:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadComments();
    return () => { isMounted = false; };
  }, [bookId, chapter, verseNumber, isOpen]);

  return (
    <div
      className={cn(
        'bg-white border-l border-sleek-border flex flex-col shrink-0 transition-all duration-300 ease-in-out absolute lg:static right-0 inset-y-0 z-30',
        isOpen ? 'w-[85vw] sm:w-[320px] translate-x-0' : 'w-0 translate-x-full lg:translate-x-0 overflow-hidden border-none'
      )}
    >
      <div className={cn('px-4 py-5 mb-4 font-semibold text-[14px] flex items-center justify-between w-[85vw] sm:w-[320px]', !isOpen && 'hidden')}>
        <div className="text-sleek-text-main">Comentários</div>
        <button onClick={onClose} className="p-1 px-2 font-normal text-sleek-text-muted hover:text-sleek-text-main transition-colors cursor-pointer text-[14px]">
          ✕
        </button>
      </div>

      <div className={cn('flex-1 overflow-y-auto px-4 custom-scrollbar w-[85vw] sm:w-[320px]', !isOpen && 'hidden')}>
        {!verseNumber ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-sleek-text-muted p-6">
            <Quote size={24} className="mb-3 opacity-50" />
            <p className="text-[13px]">Selecione um versículo para ler as notas e comentários dos autores.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white p-3 rounded-lg border border-sleek-border">
                <div className="h-4 bg-sleek-avatar-bg rounded w-1/3 mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-sleek-avatar-bg rounded w-full" />
                  <div className="h-3 bg-sleek-avatar-bg rounded w-full" />
                  <div className="h-3 bg-sleek-avatar-bg rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-0 pb-20">
            <span className="block text-[10px] text-sleek-text-muted uppercase tracking-widest mb-1.5 font-sans mt-2">
              Versículo {verseNumber}
            </span>
            {comments.map((comment, idx) => (
              <div
                key={comment.id || idx}
                className="bg-white p-3 rounded-lg border border-sleek-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] mb-4 font-sans"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-sleek-avatar-bg text-[10px] flex items-center justify-center font-bold text-sleek-text-main shrink-0 uppercase">
                    {comment.author.substring(0, 2)}
                  </div>
                  <span className="text-[12px] font-bold text-sleek-text-main truncate">{comment.author}</span>
                </div>
                <div className="text-[13px] text-sleek-comment-text leading-[1.4] space-y-2">
                  {comment.texts.map((text: string, tIdx: number) => (
                    <p key={tIdx}>{text}</p>
                  ))}
                </div>
              </div>
            ))}
            <div className="mt-8 border-t border-sleek-border pt-6 pb-6">
              <div className="text-[11px] font-bold tracking-widest text-sleek-text-muted uppercase mb-4 font-sans flex items-center gap-2">
                Minhas Notas <span className="bg-sleek-avatar-bg px-1.5 py-0.5 rounded text-[9px]">Privado</span>
              </div>
              <textarea
                value={note}
                onChange={handleNoteChange}
                placeholder="Escreva seus pensamentos ou insights sobre este versículo..."
                className="w-full bg-transparent border border-sleek-border hover:border-[#D1D1D1] rounded-[6px] p-3.5 text-[13px] text-sleek-text-main focus:outline-none focus:border-sleek-text-muted focus:ring-1 focus:ring-sleek-text-muted resize-none min-h-[120px] transition-colors leading-relaxed font-sans placeholder:text-[#BDBDBA]"
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-sleek-text-muted p-6 mt-10 text-[13px]">
            Nenhum comentário disponível para este versículo.
          </div>
        )}
      </div>
    </div>
  );
}
