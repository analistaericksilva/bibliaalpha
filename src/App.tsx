import { useState, useEffect } from 'react';
import { Book, getBooks } from './services/bibleApi';
import { getChapterFromApiBible, AVAILABLE_TRANSLATIONS } from './services/apiBible';
import Sidebar from './components/Sidebar';
import ReadingArea from './components/ReadingArea';
import CommandPalette from './components/CommandPalette';
import NotepadPanel from './components/NotepadPanel';
import ReadingPlansPanel from './components/ReadingPlansPanel';
import ResearchPanel from './components/ResearchPanel';
import ConnectionsDropdown from './components/ConnectionsDropdown';
import { Menu, Edit3, MoreHorizontal, BookOpen, Globe } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [activeChapter, setActiveChapter] = useState<number>(1);
  const [activeTranslation, setActiveTranslation] = useState<string>('almeida');
  const [chapterContent, setChapterContent] = useState<any[]>([]);
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 1024;
    return true;
  });
  const [isCommandModeOpen, setIsCommandModeOpen] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isResearchOpen, setIsResearchOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const fetchedBooks = await getBooks();
        setBooks(fetchedBooks);
        if (fetchedBooks.length > 0) setActiveBook(fetchedBooks[1]);
      } catch (error) { console.error("Failed to load books", error); }
    }
    init();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsCommandModeOpen(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (books.length > 0 && !activeBook) setActiveBook(books[0]);
  }, [books]);

  useEffect(() => {
    if (!activeBook) return;
    let isMounted = true;
    async function loadChapter() {
      setIsLoadingChapter(true);
      try {
        let ptContent;
        try {
          ptContent = await getChapterFromApiBible(activeTranslation, activeBook!.id, activeChapter);
        } catch(e: any) {
          console.error("API err", e);
          alert("Erro na API (" + activeTranslation + "): " + e.message + ".");
          if (isMounted && activeTranslation !== 'almeida') setActiveTranslation('almeida');
          return;
        }
        if (isMounted) setChapterContent(ptContent);
      } catch (error) {
        console.error("Failed to load chapter", error);
        if (isMounted) setChapterContent([]);
      } finally { if (isMounted) setIsLoadingChapter(false); }
    }
    loadChapter();
    return () => { isMounted = false; };
  }, [activeBook, activeChapter, activeTranslation]);

  return (
    <div className="flex h-screen w-full bg-sleek-bg font-sans overflow-hidden text-sleek-text-main">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/10 z-10 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <Sidebar isOpen={isSidebarOpen} books={books} activeBook={activeBook} activeChapter={activeChapter}
        onSelectBook={setActiveBook}
        onSelectChapter={(chapter) => { setActiveChapter(chapter); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
        onSearchClick={() => setIsCommandModeOpen(true)}
      />
      <div className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">
        <header className="h-14 flex items-center justify-between px-6 sm:px-10 border-b border-sleek-border bg-white shrink-0 z-10 lg:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-sleek-hover rounded-md text-sleek-text-muted transition-colors">
              <Menu size={20} />
            </button>
            <h1 className="text-[14px] font-semibold text-sleek-text-main">{activeBook?.name} {activeChapter}</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsPlansOpen(true)} className="p-2 hover:bg-sleek-hover rounded-md text-blue-600 transition-colors"><BookOpen size={18} /></button>
            <button onClick={() => setIsNotepadOpen(true)} className="p-2 hover:bg-sleek-hover rounded-md text-sleek-text-muted transition-colors"><Edit3 size={18} /></button>
            <button onClick={() => setIsResearchOpen(true)} className="p-2 hover:bg-sleek-hover rounded-md text-purple-600 transition-colors" title="Pesquisa Biblica"><Globe size={18} /></button>
            <div className="relative">
              <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className="p-2 hover:bg-sleek-hover rounded-md text-sleek-text-muted transition-colors"><MoreHorizontal size={18} /></button>
              {isMoreMenuOpen && <ConnectionsDropdown onClose={() => setIsMoreMenuOpen(false)} className="right-0 top-12" />}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoadingChapter ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
            </div>
          ) : (
            <ReadingArea
              bookId={activeBook?.id || ''} bookName={activeBook?.name || ''}
              chapter={activeChapter} totalChapters={activeBook?.numberOfChapters || 1}
              content={chapterContent} activeTranslation={activeTranslation}
              onTranslationChange={setActiveTranslation}
              onOpenBookList={() => { if (window.innerWidth < 1024) setIsSidebarOpen(true); else setIsCommandModeOpen(true); }}
              onNotepadOpen={() => setIsNotepadOpen(true)}
              onPlansOpen={() => setIsPlansOpen(true)}
              onPrevChapter={() => setActiveChapter(Math.max(1, activeChapter - 1))}
              onNextChapter={() => setActiveChapter(Math.min(activeBook?.numberOfChapters || 1, activeChapter + 1))}
              onSelectChapter={setActiveChapter}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          )}
        </div>
      </div>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-10 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <NotepadPanel isOpen={isNotepadOpen} onClose={() => setIsNotepadOpen(false)} chapterContext={activeBook?.name + ' ' + activeChapter} />
      <ReadingPlansPanel isOpen={isPlansOpen} onClose={() => setIsPlansOpen(false)}
        onSelectChapter={(bookId, chapter) => { const book = books.find(b => b.id === bookId); if (book) { setActiveBook(book); setActiveChapter(chapter); } }}
      />
      <ResearchPanel isOpen={isResearchOpen} onClose={() => setIsResearchOpen(false)} initialQuery={activeBook?.name || ''} />
      <CommandPalette isOpen={isCommandModeOpen} onClose={() => setIsCommandModeOpen(false)} books={books}
        onSelectChapter={(book, chapter) => { setActiveBook(book); setActiveChapter(chapter); }}
      />
    </div>
  );
}
