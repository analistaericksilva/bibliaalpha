/**
 * BÍBLIA ALPHA — NOVOS COMPONENTES
 * Layout Microsoft Word + TheWord Bible Software
 */

// ============================================
// 1. DOCKABLE LAYOUT SYSTEM
// ============================================

import React, { useState, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';

interface DockableLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const DockableLayout: React.FC<DockableLayoutProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn("flex flex-col h-screen bg-background", className)}>
      {children}
    </div>
  );
};

interface DockPanelProps {
  children: React.ReactNode;
  position: 'left' | 'center' | 'right';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  className?: string;
}

export const DockPanel: React.FC<DockPanelProps> = ({
  children,
  position,
  defaultSize = 20,
  minSize = 15,
  maxSize = 50,
  collapsible = true,
  className
}) => {
  return (
    <Panel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      collapsible={collapsible}
      className={cn(
        "overflow-hidden bg-card border-r last:border-r-0",
        position === 'center' && "flex-1",
        className
      )}
    >
      {children}
    </Panel>
  );
};

export const DockResizeHandle = () => (
  <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
);

// ============================================
// 2. RIBBON MENU (Estilo Microsoft Word)
// ============================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Search, Type, Moon, Sun, 
  PanelLeft, PanelRight, MapPin, BookMarked,
  SplitSquareHorizontal, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface RibbonMenuProps {
  onNavigate?: (book: string, chapter: number) => void;
  onTogglePanel?: (panel: string) => void;
  currentBook?: string;
  currentChapter?: number;
}

export const RibbonMenu: React.FC<RibbonMenuProps> = ({
  onNavigate,
  onTogglePanel,
  currentBook = 'Gênesis',
  currentChapter = 1
}) => {
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className="bg-card border-b shadow-sm">
      {/* Quick Access Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-primary">📖 BibleAlpha</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-sm text-muted-foreground">Estudo Profundo</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Search className="w-4 h-4" />
            Buscar
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Ribbon Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-10 px-4 bg-transparent border-none">
          <TabsTrigger value="home" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5">
            Início
          </TabsTrigger>
          <TabsTrigger value="insert" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5">
            Inserir
          </TabsTrigger>
          <TabsTrigger value="view" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5">
            Exibir
          </TabsTrigger>
          <TabsTrigger value="study" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5">
            Estudo
          </TabsTrigger>
          <TabsTrigger value="modules" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5">
            Módulos
          </TabsTrigger>
        </TabsList>

        <div className="px-4 py-3 bg-card min-h-[80px]">
          <TabsContent value="home" className="mt-0">
            <RibbonGroup title="Formato">
              <ToggleGroup type="single" defaultValue="16">
                <ToggleGroupItem value="14" className="text-xs">A</ToggleGroupItem>
                <ToggleGroupItem value="16" className="text-sm">A</ToggleGroupItem>
                <ToggleGroupItem value="18" className="text-base">A</ToggleGroupItem>
                <ToggleGroupItem value="20" className="text-lg">A</ToggleGroupItem>
              </ToggleGroup>
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup title="Navegação">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {currentBook}
                </Button>
                <Button size="sm" variant="outline">
                  Cap. {currentChapter}
                </Button>
                <Button size="sm" variant="default">Ir</Button>
              </div>
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup title="Ações">
              <Button size="sm" variant="outline">
                <BookMarked className="w-4 h-4 mr-1" />
                Salvar
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
            </RibbonGroup>
          </TabsContent>

          <TabsContent value="view" className="mt-0">
            <RibbonGroup title="Painéis">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onTogglePanel?.('left')}>
                  <PanelLeft className="w-4 h-4 mr-1" />
                  Livros
                </Button>
                <Button size="sm" variant="outline" onClick={() => onTogglePanel?.('right')}>
                  <PanelRight className="w-4 h-4 mr-1" />
                  Estudo
                </Button>
                <Button size="sm" variant="outline">
                  <SplitSquareHorizontal className="w-4 h-4 mr-1" />
                  Comparar
                </Button>
              </div>
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup title="Tema">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">Claro</Button>
                <Button size="sm" variant="outline">Escuro</Button>
                <Button size="sm" variant="outline">Sépia</Button>
              </div>
            </RibbonGroup>
          </TabsContent>

          <TabsContent value="study" className="mt-0">
            <RibbonGroup title="Ferramentas">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Type className="w-4 h-4 mr-1" />
                  Strong
                </Button>
                <Button size="sm" variant="outline">
                  <MapPin className="w-4 h-4 mr-1" />
                  Mapa
                </Button>
                <Button size="sm" variant="outline">
                  <BookMarked className="w-4 h-4 mr-1" />
                  Comentários
                </Button>
              </div>
            </RibbonGroup>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

// Ribbon Helper Components
const RibbonGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col gap-1 px-3 border-r last:border-r-0">
    <div className="flex items-center gap-2">
      {children}
    </div>
    <span className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">{title}</span>
  </div>
);

const RibbonDivider = () => <div className="w-px h-10 bg-border mx-1" />;

// ============================================
// 3. BOOK TREE NAVIGATOR (Estilo TheWord)
// ============================================

import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface BookTreeProps {
  onSelectBook: (book: string, chapter: number) => void;
  currentBook?: string;
  currentChapter?: number;
}

const BIBLE_BOOKS = {
  'Antigo Testamento': [
    'Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio',
    'Josué', 'Juízes', 'Rute', '1 Samuel', '2 Samuel',
    '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas', 'Esdras',
    'Neemias', 'Ester', 'Jó', 'Salmos', 'Provérbios',
    'Eclesiastes', 'Cantares', 'Isaías', 'Jeremias', 'Lamentações',
    'Ezequiel', 'Daniel', 'Oséias', 'Joel', 'Amós',
    'Obadias', 'Jonas', 'Miqueias', 'Naum', 'Habacuque',
    'Sofonias', 'Ageu', 'Zacarias', 'Malaquias'
  ],
  'Novo Testamento': [
    'Mateus', 'Marcos', 'Lucas', 'João', 'Atos',
    'Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios',
    'Filipenses', 'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses', '1 Timóteo',
    '2 Timóteo', 'Tito', 'Filemom', 'Hebreus', 'Tiago',
    '1 Pedro', '2 Pedro', '1 João', '2 João', '3 João',
    'Judas', 'Apocalipse'
  ]
};

const CHAPTER_COUNTS: Record<string, number> = {
  'Gênesis': 50, 'Êxodo': 40, 'Levítico': 27, 'Números': 36, 'Deuteronômio': 34,
  'Josué': 24, 'Juízes': 21, 'Rute': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Reis': 22, '2 Reis': 25, '1 Crônicas': 29, '2 Crônicas': 36, 'Esdras': 10,
  'Neemias': 13, 'Ester': 10, 'Jó': 42, 'Salmos': 150, 'Provérbios': 31,
  'Eclesiastes': 12, 'Cantares': 8, 'Isaías': 66, 'Jeremias': 52, 'Lamentações': 5,
  'Ezequiel': 48, 'Daniel': 12, 'Oséias': 14, 'Joel': 3, 'Amós': 9,
  'Obadias': 1, 'Jonas': 4, 'Miqueias': 7, 'Naum': 3, 'Habacuque': 3,
  'Sofonias': 3, 'Ageu': 2, 'Zacarias': 14, 'Malaquias': 4,
  'Mateus': 28, 'Marcos': 16, 'Lucas': 24, 'João': 21, 'Atos': 28,
  'Romanos': 16, '1 Coríntios': 16, '2 Coríntios': 13, 'Gálatas': 6, 'Efésios': 6,
  'Filipenses': 4, 'Colossenses': 4, '1 Tessalonicenses': 5, '2 Tessalonicenses': 3, '1 Timóteo': 6,
  '2 Timóteo': 4, 'Tito': 3, 'Filemom': 1, 'Hebreus': 13, 'Tiago': 5,
  '1 Pedro': 5, '2 Pedro': 3, '1 João': 5, '2 João': 1, '3 João': 1,
  'Judas': 1, 'Apocalipse': 22
};

export const BookTree: React.FC<BookTreeProps> = ({
  onSelectBook,
  currentBook = 'Gênesis',
  currentChapter = 1
}) => {
  const [expandedTestament, setExpandedTestament] = useState<string>('Antigo Testamento');
  const [selectedBook, setSelectedBook] = useState(currentBook);

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 border-b bg-muted/50">
        <h3 className="font-semibold text-sm">📚 Livros da Bíblia</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(BIBLE_BOOKS).map(([testament, books]) => (
            <Collapsible
              key={testament}
              open={expandedTestament === testament}
              onOpenChange={(open) => setExpandedTestament(open ? testament : '')}
            >
              <CollapsibleTrigger className="flex items-center w-full p-2 text-sm font-medium hover:bg-accent rounded-md transition-colors">
                {expandedTestament === testament ? (
                  <ChevronDown className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-1" />
                )}
                {testament}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-4 space-y-1">
                  {books.map((book) => (
                    <BookItem
                      key={book}
                      book={book}
                      isSelected={selectedBook === book}
                      currentChapter={selectedBook === book ? currentChapter : 1}
                      onSelect={(chapter) => {
                        setSelectedBook(book);
                        onSelectBook(book, chapter);
                      }}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

interface BookItemProps {
  book: string;
  isSelected: boolean;
  currentChapter: number;
  onSelect: (chapter: number) => void;
}

const BookItem: React.FC<BookItemProps> = ({ book, isSelected, currentChapter, onSelect }) => {
  const [isOpen, setIsOpen] = useState(isSelected);
  const chapters = CHAPTER_COUNTS[book] || 1;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center">
        <CollapsibleTrigger className={cn(
          "flex items-center flex-1 p-1.5 text-sm rounded-md transition-colors",
          isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
        )}>
          {isOpen ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
          {book}
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="ml-6 mt-1 grid grid-cols-5 gap-1">
          {Array.from({ length: chapters }, (_, i) => i + 1).map((chapter) => (
            <button
              key={chapter}
              onClick={() => onSelect(chapter)}
              className={cn(
                "text-xs p-1 rounded text-center transition-colors",
                currentChapter === chapter && isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent bg-muted/50"
              )}
            >
              {chapter}
            </button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ============================================
// 4. BIBLE READER WITH INLINE NOTES
// ============================================

import { useVirtualizer } from '@tanstack/react-virtual';

interface Verse {
  id: string;
  number: number;
  text: string;
  notes?: {
    author: string;
    text: string;
    source: string;
  }[];
  hasCrossReferences?: boolean;
  strongNumbers?: string[];
}

interface ChapterReaderProps {
  book: string;
  chapter: number;
  verses: Verse[];
  highlights: string[];
  onHighlight: (verseId: string) => void;
  onAddNote: (verseId: string) => void;
  selectedVerse?: string;
}

export const ChapterReader: React.FC<ChapterReaderProps> = ({
  book,
  chapter,
  verses,
  highlights,
  onHighlight,
  onAddNote,
  selectedVerse
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: verses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chapter Header */}
      <div className="sticky top-0 z-10 p-4 bg-card border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold font-serif">{book}</h1>
            <span className="text-2xl text-primary font-bold">{chapter}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Anterior
            </Button>
            <Button variant="outline" size="sm">
              Próximo
            </Button>
          </div>
        </div>
      </div>

      {/* Verses List */}
      <ScrollArea className="flex-1" ref={parentRef}>
        <div 
          className="relative p-6 max-w-4xl mx-auto"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const verse = verses[virtualItem.index];
            return (
              <div
                key={verse.id}
                className="absolute left-0 right-0 px-6"
                style={{
                  top: 0,
                  transform: `translateY(${virtualItem.start}px)`
                }}
              >
                <VerseDisplay
                  verse={verse}
                  isHighlighted={highlights.includes(verse.id)}
                  isSelected={selectedVerse === verse.id}
                  onHighlight={() => onHighlight(verse.id)}
                  onAddNote={() => onAddNote(verse.id)}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Status Bar */}
      <div className="p-2 bg-muted border-t text-xs text-muted-foreground flex justify-between">
        <span>{book} {chapter}:{verses.length} versículos</span>
        <span>Bíblia Alpha • NVI</span>
      </div>
    </div>
  );
};

interface VerseDisplayProps {
  verse: Verse;
  isHighlighted: boolean;
  isSelected: boolean;
  onHighlight: () => void;
  onAddNote: () => void;
}

const VerseDisplay: React.FC<VerseDisplayProps> = ({
  verse,
  isHighlighted,
  isSelected,
  onHighlight,
  onAddNote
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={cn(
        "py-3 px-4 rounded-lg transition-colors group",
        isHighlighted && "bg-yellow-100 dark:bg-yellow-900/30",
        isSelected && "ring-2 ring-primary",
        "hover:bg-accent/50"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-4">
        {/* Verse Number */}
        <span className="text-sm font-bold text-primary mt-1 select-none">
          {verse.number}
        </span>

        {/* Verse Content */}
        <div className="flex-1">
          <p className="text-lg leading-relaxed font-serif">
            {verse.text}
          </p>

          {/* Inline Notes */}
          {verse.notes && verse.notes.length > 0 && (
            <div className="mt-2 space-y-1">
              {verse.notes.map((note, idx) => (
                <InlineNote key={idx} {...note} />
              ))}
            </div>
          )}

          {/* Strong Numbers */}
          {verse.strongNumbers && verse.strongNumbers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {verse.strongNumbers.map((strong) => (
                <span 
                  key={strong}
                  className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {strong}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {showActions && (
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onHighlight}>
              <span className="text-yellow-500">🖍️</span>
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onAddNote}>
              <span>📝</span>
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <span>📋</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const InlineNote: React.FC<{ author: string; text: string; source: string }> = ({
  author,
  text,
  source
}) => (
  <div className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/30 italic">
    <span className="font-semibold text-primary">{author}:</span>{' '}
    {text}
    <span className="text-xs text-muted-foreground ml-2">({source})</span>
  </div>
);

// ============================================
// 5. COMMENTARY PANEL (Tabs por Teólogo)
// ============================================

interface Commentary {
  theologian: string;
  content: string;
  verseRef: string;
}

interface CommentaryPanelProps {
  book: string;
  chapter: number;
  verse?: number;
  commentaries: Commentary[];
}

export const CommentaryPanel: React.FC<CommentaryPanelProps> = ({
  book,
  chapter,
  verse,
  commentaries
}) => {
  const theologians = [...new Set(commentaries.map(c => c.theologian))];
  const [selectedTheologian, setSelectedTheologian] = useState(theologians[0] || 'Mateus Henrique');

  const filteredCommentaries = commentaries.filter(c => c.theologian === selectedTheologian);

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 border-b bg-muted/50">
        <h3 className="font-semibold text-sm">📖 Comentários</h3>
        <p className="text-xs text-muted-foreground">{book} {chapter}{verse ? `:${verse}` : ''}</p>
      </div>

      {/* Theologian Tabs */}
      <Tabs value={selectedTheologian} onValueChange={setSelectedTheologian}>
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-10">
          {theologians.map((theologian) => (
            <TabsTrigger 
              key={theologian} 
              value={theologian}
              className="text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              {theologian}
            </TabsTrigger>
          ))}
        </TabsList>

        {theologians.map((theologian) => (
          <TabsContent key={theologian} value={theologian} className="mt-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="p-4 space-y-4">
                {filteredCommentaries.map((commentary, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-primary">{commentary.verseRef}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{commentary.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// ============================================
// 6. APP SHELL — Layout Principal
// ============================================

export const BibleAlphaShell: React.FC = () => {
  const [currentBook, setCurrentBook] = useState('Gênesis');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState<string>();
  const [highlights, setHighlights] = useState<string[]>([]);

  const handleNavigate = useCallback((book: string, chapter: number) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
  }, []);

  const handleHighlight = useCallback((verseId: string) => {
    setHighlights(prev => 
      prev.includes(verseId) 
        ? prev.filter(id => id !== verseId)
        : [...prev, verseId]
    );
  }, []);

  // Dados mockados para exemplo
  const mockVerses: Verse[] = Array.from({ length: 31 }, (_, i) => ({
    id: `gen-1-${i + 1}`,
    number: i + 1,
    text: i === 0 
      ? 'No princípio criou Deus os céus e a terra.'
      : i === 1
      ? 'Era a terra sem forma e vazia; havia trevas sobre a face do abismo, e o Espírito de Deus se movia sobre a face das águas.'
      : `Versículo ${i + 1} do capítulo ${currentChapter} do livro de ${currentBook}.`,
    notes: i === 0 ? [{
      author: 'Mateus Henrique',
      text: 'Criou: O termo hebraico bara indica criação ex nihilo, algo só Deus pode fazer.',
      source: 'Comentário Completo'
    }] : undefined
  }));

  return (
    <DockableLayout>
      {/* Ribbon Menu */}
      <RibbonMenu
        currentBook={currentBook}
        currentChapter={currentChapter}
        onNavigate={handleNavigate}
        onTogglePanel={(panel) => {
          if (panel === 'left') setShowLeftPanel(!showLeftPanel);
          if (panel === 'right') setShowRightPanel(!showRightPanel);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {showLeftPanel && (
            <>
              <DockPanel position="left" defaultSize={20} minSize={15} maxSize={30}>
                <BookTree
                  onSelectBook={handleNavigate}
                  currentBook={currentBook}
                  currentChapter={currentChapter}
                />
              </DockPanel>
              <DockResizeHandle />
            </>
          )}

          <DockPanel position="center" defaultSize={showRightPanel ? 50 : 80}>
            <ChapterReader
              book={currentBook}
              chapter={currentChapter}
              verses={mockVerses}
              highlights={highlights}
              onHighlight={handleHighlight}
              onAddNote={(id) => console.log('Add note to', id)}
              selectedVerse={selectedVerse}
            />
          </DockPanel>

          {showRightPanel && (
            <>
              <DockResizeHandle />
              <DockPanel position="right" defaultSize={30} minSize={20} maxSize={40}>
                <CommentaryPanel
                  book={currentBook}
                  chapter={currentChapter}
                  commentaries={[
                    {
                      theologian: 'Mateus Henrique',
                      content: 'A criação ex nihilo demonstra o poder absoluto de Deus. O verbo "bara" é exclusivo de Deus.',
                      verseRef: '1:1'
                    },
                    {
                      theologian: 'João Calvino',
                      content: 'A ordem na criação reflete a ordem e sabedoria divina.',
                      verseRef: '1:1'
                    }
                  ]}
                />
              </DockPanel>
            </>
          )}
        </PanelGroup>
      </div>
    </DockableLayout>
  );
};

export default BibleAlphaShell;
