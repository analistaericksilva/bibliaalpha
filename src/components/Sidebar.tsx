import { Book } from '../services/bibleApi';
import { ChevronDown, ChevronRight, Book as BookIcon, Search, Shield } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '../App';
import { useAuth } from './AuthProvider';

interface SidebarProps {
  isOpen: boolean;
  books: Book[];
  activeBook: Book | null;
  activeChapter: number;
  onSelectBook: (book: Book) => void;
  onSelectChapter: (chapter: number) => void;
  onSearchClick?: () => void;
}

export default function Sidebar({ isOpen, books, activeBook, activeChapter, onSelectBook, onSelectChapter, onSearchClick }: SidebarProps) {
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [expandedTestament, setExpandedTestament] = useState<'old' | 'new' | null>('old');
  const { profile, user } = useAuth();
  
  const isSuperAdmin = user?.email === 'analista.ericksilva@gmail.com';
  const showAdminButton = profile?.isAdmin || isSuperAdmin;

  // Group books by Old/New Testament simply by index (first 39 are OT)
  const oldTestament = useMemo(() => books.slice(0, 39), [books]);
  const newTestament = useMemo(() => books.slice(39), [books]);

  const toggleBook = (book: Book) => {
    if (expandedBookId === book.id) {
      setExpandedBookId(null);
    } else {
      setExpandedBookId(book.id);
      onSelectBook(book); // Optionally select the book when expanded
    }
  };

  const renderBookList = (list: Book[], title: string, id: 'old' | 'new') => {
    const isTestamentExpanded = expandedTestament === id;
    
    return (
      <div className="mb-3 px-2">
        <button 
          onClick={() => setExpandedTestament(isTestamentExpanded ? null : id)}
          className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.05em] text-sleek-text-main px-3 py-2.5 rounded-lg bg-sleek-hover/50 hover:bg-sleek-hover border border-sleek-border/50 shadow-sm transition-all"
        >
          <span>{title}</span>
          {isTestamentExpanded ? <ChevronDown size={15} className="text-sleek-text-muted" /> : <ChevronRight size={15} className="text-sleek-text-muted" />}
        </button>
        
        {isTestamentExpanded && (
          <div className="space-y-0.5 px-1 mt-2 mb-4">
            {list.map(book => {
              const isExpanded = expandedBookId === book.id;
              const isActive = activeBook?.id === book.id;
              
              return (
                <div key={book.id}>
                  <button
                    onClick={() => toggleBook(book)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 text-[14px] rounded-md transition-colors cursor-pointer",
                      isActive ? "bg-sleek-hover font-semibold text-sleek-text-main" : "text-sleek-text-main hover:bg-sleek-hover"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{book.name}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={14} className="text-sleek-text-muted shrink-0" /> : <ChevronRight size={14} className="text-sleek-text-muted shrink-0" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="pl-6 py-2 grid grid-cols-4 gap-1">
                      {Array.from({ length: book.numberOfChapters }).map((_, i) => {
                        const chapterNum = i + 1;
                        const isChapterActive = isActive && activeChapter === chapterNum;
                        return (
                          <button
                            key={chapterNum}
                            onClick={() => {
                              onSelectBook(book);
                              onSelectChapter(chapterNum);
                            }}
                            className={cn(
                              "aspect-square flex items-center justify-center text-[13px] rounded-md transition-colors",
                              isChapterActive 
                                ? "font-semibold bg-sleek-hover text-sleek-text-main" 
                                : "hover:bg-sleek-hover text-sleek-text-muted"
                            )}
                          >
                            {chapterNum}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    );
  };

  const handleAction = (type: string) => {
    // Quick Intents for Productivity Apps
    if (type === 'notion') {
      window.open('https://www.notion.so/', '_blank', 'noopener,noreferrer');
    } else if (type === 'gmail') {
      const subject = encodeURIComponent("Meus Estudos da Bíblia Alpha");
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}`, '_blank', 'popup=yes,width=800,height=600');
    } else if (type === 'drive') {
      window.open('https://drive.google.com/', '_blank', 'noopener,noreferrer');
    } else if (type === 'calendar') {
      const title = encodeURIComponent("Tempo de Estudo: Bíblia Alpha");
      const details = encodeURIComponent("Momento diário de meditação e estudo na Bíblia Alpha.");
      window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`, '_blank', 'popup=yes,width=800,height=600');
    }
  };

  return (
    <div 
      className={cn(
        "flex-shrink-0 bg-sleek-sidebar-bg border-r border-sleek-border h-full flex flex-col flex-nowrap overflow-hidden transition-all duration-300 z-20 absolute lg:static left-0 inset-y-0",
        isOpen ? "w-[85vw] sm:w-[240px]" : "w-0 border-none"
      )}
    >
      <div className={cn("flex-1 overflow-y-auto py-4 custom-scrollbar w-[85vw] sm:w-[240px]", !isOpen && "hidden")}>
        {/* Logo discreta no topo do sidebar */}
        <div className="flex items-center justify-center px-4 pt-1 pb-4">
          <img
            src="/icon.svg"
            alt="Bíblia de Estudo Alpha"
            className="h-9 w-auto object-contain opacity-90"
            draggable={false}
          />
        </div>
        <button 
          onClick={onSearchClick}
          className="mx-3 mb-4 px-2.5 py-1.5 w-[calc(100%-24px)] bg-white border border-sleek-border hover:bg-sleek-hover rounded-md text-[12px] text-sleek-text-muted flex items-center justify-between transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
        >
          <span className="flex items-center gap-1.5"><Search size={14} className="opacity-70" /> Buscar livro...</span>
          <span className="font-mono text-[9px] bg-sleek-avatar-bg px-1 rounded text-sleek-text-muted">⌘K</span>
        </button>
        {renderBookList(oldTestament, "Antigo Testamento", 'old')}
        {renderBookList(newTestament, "Novo Testamento", 'new')}
        
        {/* Conexões */}
        <div className="mt-8 mb-6">
          <div className="text-[11px] uppercase tracking-[0.05em] text-sleek-text-muted px-5 mb-2 font-semibold">
            Extensões e Conexões
          </div>
          <div className="pl-4 pr-3 space-y-1">
            <button onClick={() => handleAction('notion')} className="w-full flex items-center justify-between px-2 py-1.5 text-[13px] rounded-md transition-colors text-sleek-text-main hover:bg-sleek-hover">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-[#F1F1F1] text-black">N</div>
                Abrir no Notion
              </div>
            </button>
            <button onClick={() => handleAction('gmail')} className="w-full flex items-center justify-between px-2 py-1.5 text-[13px] rounded-md transition-colors text-sleek-text-main hover:bg-sleek-hover">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-[#EA4335] text-white font-bold text-[10px]">M</div>
                Escrever no Gmail
              </div>
            </button>
            <button onClick={() => handleAction('drive')} className="w-full flex items-center justify-between px-2 py-1.5 text-[13px] rounded-md transition-colors text-sleek-text-main hover:bg-sleek-hover">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-[#4285F4] text-white text-[10px] font-bold">D</div>
                Abrir Google Drive
              </div>
            </button>
            <button onClick={() => handleAction('calendar')} className="w-full flex items-center justify-between px-2 py-1.5 text-[13px] rounded-md transition-colors text-sleek-text-main hover:bg-sleek-hover">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-[#1B73E8] text-white text-[10px]">C</div>
                Agendar Estudo
              </div>
            </button>
          </div>
        </div>

        {showAdminButton && (
          <div className="px-3 pb-4">
            <a
              href="/admin"
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] rounded-md transition-colors text-sleek-text-muted hover:bg-sleek-hover"
            >
              <Shield size={13} className="text-sleek-text-muted" />
              Painel Admin
            </a>
          </div>
        )}
      </div>
    </div>
  );
}