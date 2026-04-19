import { cn } from '../App';
import * as React from 'react';
import { motion } from 'motion/react';
import { Palette, Share2, MoreHorizontal, Book as BookIcon, Bookmark, Globe, ChevronDown, MessageSquareText, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import InlineComments from './InlineComments';
import ConnectionsDropdown from './ConnectionsDropdown';
import { AVAILABLE_TRANSLATIONS } from '../services/apiBible';
import { getChapterCommentMap } from '../services/bibleApi';

interface ReadingAreaProps {
  bookId: string;
  bookName: string;
  chapter: number;
  totalChapters?: number;
  content: any[];
  activeTranslation: string;
  onTranslationChange: (id: string) => void;
  onOpenBookList?: () => void;
  onNotepadOpen?: () => void;
  onPlansOpen?: () => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  onSelectChapter?: (c: number) => void;
  onToggleSidebar?: () => void;
}

export default function ReadingArea({ bookId, bookName, chapter, totalChapters = 1, content, activeTranslation, onTranslationChange, onOpenBookList, onNotepadOpen, onPlansOpen, onPrevChapter, onNextChapter, onSelectChapter, onToggleSidebar }: ReadingAreaProps) {
  
  // Highlight system per chapter
  const highlightKey = `hl_${bookId}_${chapter}`;
  const [highlights, setHighlights] = useState<Record<number, string>>({});
  const [isTranslationMenuOpen, setIsTranslationMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [expandedVerses, setExpandedVerses] = useState<Set<number>>(new Set());
  const [versesWithComments, setVersesWithComments] = useState<Set<number>>(new Set());

  useEffect(() => {
    setHighlights(JSON.parse(localStorage.getItem(highlightKey) || '{}'));
    // Reset expanded comments when chapter changes
    setExpandedVerses(new Set());
    
    // Fetch map of verses that have comments
    let isMounted = true;
    if (bookId && chapter) {
      getChapterCommentMap(bookId, chapter).then((map) => {
        if (isMounted) setVersesWithComments(map);
      });
    }
    return () => { isMounted = false; };
  }, [highlightKey, bookId, chapter]);

  const toggleHighlight = (verseNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHl = { ...highlights };
    if (newHl[verseNumber]) {
      delete newHl[verseNumber];
    } else {
      newHl[verseNumber] = 'bg-yellow-100/80';
    }
    setHighlights(newHl);
    localStorage.setItem(highlightKey, JSON.stringify(newHl));
  };
  
  const toggleComments = (verseNumber: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSet = new Set(expandedVerses);
    if (newSet.has(verseNumber)) {
      newSet.delete(verseNumber);
    } else {
      newSet.add(verseNumber);
    }
    setExpandedVerses(newSet);
  };

  const renderItem = (item: any, idx: number) => {
    if (item.type === 'line_break') {
      return <br key={idx} className="my-2" />;
    }
    
    if (item.type === 'verse') {
      const isExpanded = expandedVerses.has(item.number);
      const isHighlighted = highlights[item.number];
      const hasComments = versesWithComments.has(item.number);
      
      return (
        <React.Fragment key={item.number || idx}>
          <span 
            onClick={() => {
              if (hasComments) {
                toggleComments(item.number);
              }
            }}
            className={cn(
              "relative inline transition-colors duration-200 group px-1 rounded-sm",
              isExpanded ? "bg-[#f9f9f9]" : "hover:bg-[#f6f6f6]",
              isHighlighted && !isExpanded && "bg-yellow-100/60",
              hasComments ? "cursor-pointer" : ""
            )}
          >
            <span className="absolute -left-7 top-1 opacity-0 hidden sm:group-hover:flex transition-opacity items-center gap-1">
              <button 
                onClick={(e) => toggleHighlight(item.number, e)}
                className="p-0.5 text-sleek-text-muted hover:text-sleek-text-main hover:bg-sleek-avatar-bg rounded"
                title="Destacar"
              >
                <Palette size={12} />
              </button>
            </span>

            <sup className="font-sans text-[12px] align-super mr-1.5 text-sleek-text-muted font-normal select-none">
              {item.number}
            </sup>
            
            <span className={cn(isHighlighted && "bg-yellow-100/60 decoration-clone")}>
              {item.content.map((segment: any, sIdx: number) => {
                if (typeof segment === 'string') return <span key={sIdx}>{segment}</span>;
                if (segment && typeof segment === 'object') {
                   if (segment.type === 'jesus_words' || segment.jesusWords) {
                     return <span key={sIdx} className="text-sleek-accent">{segment.text || segment.content}</span>;
                   }
                }
                return null;
              })}
            </span>
            <span className="mr-1 inline-block" />
            
            {hasComments && (
              <button
                 onClick={(e) => toggleComments(item.number, e)}
                 className={cn(
                   "inline-flex items-center gap-1 font-sans text-[11px] font-medium px-1.5 py-0.5 rounded-full transition-all align-middle ml-1 mr-2 opacity-50 hover:opacity-100 cursor-pointer",
                   isExpanded ? "bg-sleek-text-main text-white opacity-100 bg-opacity-90" : "bg-sleek-avatar-bg text-sleek-text-main"
                 )}
                 title={isExpanded ? "Ocultar comentários" : "Ver comentários teológicos"}
              >
                <MessageSquareText size={11} className={isExpanded ? "text-white" : "opacity-70"} />
                {!isExpanded && "Estudo"}
              </button>
            )}
          </span>
          {isExpanded && (
            <div className="block w-full">
              <InlineComments 
                bookId={bookId} 
                chapter={chapter} 
                verseNumber={item.number} 
                onClose={(e) => toggleComments(item.number, e)}
              />
            </div>
          )}
        </React.Fragment>
      );
    }
    
    if (item.type === 'paragraph_break' || item.type === 'stanza_break') {
      return <p key={idx} className="h-3 sm:h-4 block" />;
    }

    if (item.type === 'heading') {
      return (
        <h3 key={idx} className="font-sans text-[16px] sm:text-[18px] font-semibold text-sleek-text-main mt-5 mb-3">
          {item.content.map((c:any) => typeof c === 'string' ? c : (c.text||'')).join('')}
        </h3>
      );
    }

    return null; // fallback
  };

  return (
    <div className="w-full flex-1 flex flex-col min-min-h-full relative font-serif">
      <header className="hidden lg:flex px-10 py-5 justify-between items-center bg-sleek-bg sticky top-0 z-20 border-b border-transparent">
        <div className="text-[14px] text-sleek-text-muted flex items-center gap-4">
          <button 
            onClick={onToggleSidebar}
            className="p-1 px-1.5 hover:bg-sleek-hover rounded-md text-sleek-text-muted hover:text-sleek-text-main transition-colors"
            title="Alternar Menu Lateral"
          >
            <Menu size={18} />
          </button>
          <span>{chapter > 39 ? "Novo Testamento" : "Antigo Testamento"} / {bookName} / Capítulo {chapter}</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onPlansOpen}
            className="text-[13px] px-3 py-1 flex items-center gap-1.5 text-blue-600 bg-blue-50/50 hover:bg-blue-100/50 rounded-md transition-colors font-medium border border-blue-100 hover:border-blue-200"
          >
            <BookIcon size={13} /> Planos
          </button>
          <button 
            onClick={onNotepadOpen}
            className="text-[13px] px-3 py-1 flex items-center gap-1.5 text-sleek-text-muted hover:text-sleek-text-main hover:bg-sleek-hover rounded-md transition-colors font-medium border border-transparent hover:border-sleek-border bg-white shadow-sm"
          >
            <MessageSquareText size={13} /> Bloco de Notas
          </button>
          <div className="w-[1px] h-4 bg-sleek-border mx-1"></div>
          <button className="text-[13px] px-3 py-1 flex items-center gap-1.5 text-sleek-text-muted hover:bg-sleek-hover rounded-md transition-colors">
            <Share2 size={13} /> Compartilhar
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="p-1 px-2 text-sleek-text-muted hover:bg-sleek-hover rounded-md transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            {isMoreMenuOpen && (
              <ConnectionsDropdown 
                onClose={() => setIsMoreMenuOpen(false)} 
                className="right-0 top-10" 
              />
            )}
          </div>
        </div>
      </header>

      <motion.div
        className="px-6 sm:px-16 lg:px-24 py-8 sm:py-12 max-w-4xl mx-auto w-full text-justify text-[18px] sm:text-[20px] leading-[1.6] text-sleek-reading-text relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={`${bookName}-${chapter}`}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="pb-8 border-b border-sleek-border mb-8">
          <h1 
            onClick={onOpenBookList}
            className="font-sans text-[36px] sm:text-[52px] font-bold text-sleek-text-main tracking-[-0.02em] leading-tight mb-6 cursor-pointer hover:opacity-80 transition-opacity"
            title="Selecionar outro livro"
          >
            {bookName} {chapter}
          </h1>

          {/* Chapter Carousel */}
          {totalChapters > 1 && (
            <div className="flex items-center gap-2 mb-8 overflow-x-auto custom-scrollbar pb-2">
              {Array.from({ length: totalChapters }, (_, i) => i + 1).map(chapNum => (
                <button
                  key={chapNum}
                  onClick={() => onSelectChapter?.(chapNum)}
                  className={cn(
                    "flex-shrink-0 w-9 h-9 rounded-full font-sans text-[13px] flex items-center justify-center transition-colors cursor-pointer border",
                    chapNum === chapter 
                      ? "bg-sleek-text-main border-sleek-text-main text-white font-bold" 
                      : "bg-white border-sleek-border hover:bg-sleek-hover text-sleek-text-main"
                  )}
                >
                  {chapNum}
                </button>
              ))}
            </div>
          )}
          
          {/* Notion Page Properties */}
          <div className="flex flex-col gap-3 font-sans w-full max-w-sm">
             <div className="flex items-center text-[13px]">
               <div className="w-28 text-sleek-text-muted flex items-center gap-2">
                  <BookIcon size={14} className="opacity-70" /> Livro
               </div>
               <div 
                 className="text-sleek-text-main bg-sleek-avatar-bg px-2 py-0.5 rounded cursor-pointer hover:bg-sleek-border transition-colors"
                 onClick={onOpenBookList}
                 title="Selecionar outro livro"
               >
                 {bookName}
               </div>
             </div>
             
             <div className="flex items-center text-[13px]">
               <div className="w-28 text-sleek-text-muted flex items-center gap-2">
                  <Bookmark size={14} className="opacity-70" /> Capítulo
               </div>
               <div className="text-sleek-text-main">
                 {chapter}
               </div>
             </div>

             <div className="flex items-center text-[13px] relative">
               <div className="w-28 text-sleek-text-muted flex items-center gap-2 shrink-0">
                  <Globe size={14} className="opacity-70" /> Versão
               </div>
               <div 
                 className="text-sleek-text-main bg-sleek-avatar-bg px-2 py-0.5 rounded cursor-pointer hover:bg-sleek-border flex items-center gap-1 min-w-0"
                 onClick={() => setIsTranslationMenuOpen(!isTranslationMenuOpen)}
               >
                 <span className="truncate">{AVAILABLE_TRANSLATIONS.find(t => t.id === activeTranslation)?.name || 'Padrão'}</span>
                 <ChevronDown size={14} className="opacity-50 shrink-0" />
               </div>
               
               {isTranslationMenuOpen && (
                 <>
                   <div className="fixed inset-0 z-30" onClick={() => setIsTranslationMenuOpen(false)} />
                   <div className="absolute top-8 left-28 z-40 bg-white border border-sleek-border rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.08)] py-1 min-w-[200px] font-sans">
                     {AVAILABLE_TRANSLATIONS.map(t => (
                       <button
                         key={t.id}
                         onClick={() => {
                           onTranslationChange(t.id);
                           setIsTranslationMenuOpen(false);
                         }}
                         className={cn(
                           "w-full text-left px-3 py-1.5 text-[13px] hover:bg-sleek-hover transition-colors",
                           activeTranslation === t.id ? "font-semibold text-sleek-accent" : "text-sleek-text-main"
                         )}
                       >
                         {t.name}
                       </button>
                     ))}
                   </div>
                 </>
               )}
             </div>
          </div>
        </div>
        
        <div className="pb-32">
          {content.map(renderItem)}
          
          {/* Bottom Navigation */}
          <div className="mt-16 flex items-center justify-between border-t border-sleek-border pt-8 font-sans">
            <div>
               {chapter > 1 && (
                 <button 
                   onClick={onPrevChapter}
                   className="flex items-center gap-2 px-4 py-2 hover:bg-sleek-hover rounded-md text-sleek-text-main transition-colors font-medium border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                 >
                   <ChevronLeft size={18} />
                   Anterior
                 </button>
               )}
            </div>
            <div>
               {chapter < totalChapters && (
                 <button 
                   onClick={onNextChapter}
                   className="flex items-center gap-2 px-4 py-2 hover:bg-sleek-hover rounded-md text-sleek-text-main transition-colors font-medium border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                 >
                   Próximo
                   <ChevronRight size={18} />
                 </button>
               )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
