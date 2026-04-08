# 🚀 Bíblia Alpha — Ultra Pro Edition

## Visão de Produto

Transformar o Bíblia Alpha no **"Chrome DevTools + VS Code + Logos Bible"** para estudo bíblico. Interface multi-janela, integrações profundas e ferramentas de pesquisa de nível acadêmico.

---

## 🪟 Sistema de Janelas Multi-View (Browser-Style)

### Conceito: "BibleOS Desktop"

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  🏠 BibleAlpha Ultra         [🗂️] [📑 Nova Aba]  [🔍]  [⚙️]  [👤 Erick Silva]       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ 📖 NVI           │  │ 📖 KJV           │  │ 📖 Interlinear   │  [+] Nova Janela  │
│  │ Gênesis 1:1      │  │ Genesis 1:1      │  │ בְּרֵאשִׁית        │                   │
│  │                  │  │ In the beginning │  │ berêshith        │                   │
│  │ No princípio...  │  │ God created...   │  │ ─────────────────│                   │
│  │                  │  │                  │  │ H7225: início    │  ☐ Sincronizar    │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     navegação    │
│  ┌──────────────────┐  ┌──────────────────┐                                         │
│  │ 📝 Notas Estudo  │  │ 🔍 Concordância  │                                         │
│  │ ──────────────── │  │ ──────────────── │                                         │
│  │ Tema: Criação    │  │ "Berêshith"      │                                         │
│  │                  │  │ Aparece 15x:     │                                         │
│  │ • Gênesis 1:1    │  │ • Gen 1:1        │                                         │
│  │ • João 1:1       │  │ • Gen 2:4        │                                         │
│  │ • Salmos 90:2    │  │ • Prov 8:23      │                                         │
│  └──────────────────┘  └──────────────────┘                                         │
│                                                                                      │
│  [Pavimentação] [Mosaico] [Cascata] [Abrir Popout] ───────────────────────────────  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Componente: WindowManager

```typescript
// src/features/window-system/WindowManager.tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useWindowStore } from '@/stores/windowStore';

interface BibleWindow {
  id: string;
  type: 'bible' | 'notes' | 'dictionary' | 'map' | 'concordance' | 'commentary';
  title: string;
  content: React.ReactNode;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isFloating: boolean;
  isMinimized: boolean;
  syncNav: boolean; // Sincronizar navegação com outras janelas
}

export const WindowManager: React.FC = () => {
  const { windows, activeWindowId, addWindow, closeWindow, focusWindow } = useWindowStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    updateWindowPosition(active.id as string, {
      x: delta.x,
      y: delta.y
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="relative w-full h-full bg-background overflow-hidden">
        {windows.map((window) => (
          <BibleWindow
            key={window.id}
            window={window}
            isActive={window.id === activeWindowId}
            onFocus={() => focusWindow(window.id)}
            onClose={() => closeWindow(window.id)}
          />
        ))}
        
        <WindowToolbar />
      </div>
    </DndContext>
  );
};

// Sincronização entre janelas
export const useSyncNavigation = () => {
  const { currentRef } = useBibleStore();
  const { windows, updateWindowContent } = useWindowStore();

  useEffect(() => {
    // Atualizar todas as janelas que têm syncNav ativado
    windows.forEach((window) => {
      if (window.syncNav && window.type === 'bible') {
        updateWindowContent(window.id, {
          book: currentRef.book,
          chapter: currentRef.chapter
        });
      }
    });
  }, [currentRef, windows]);
};
```

### Layouts de Janela

```typescript
// src/features/window-system/layouts.ts
export type WindowLayout = 
  | 'tabbed'      // Tabs como browser
  | 'split-v'     // Divisão vertical
  | 'split-h'     // Divisão horizontal
  | 'grid'        // Grid 2x2, 3x3
  | 'mosaic'      // Layout dinâmico
  | 'floating'    // Janelas flutuantes
  | 'presentation'; // Modo apresentação

export const layoutConfigs: Record<WindowLayout, LayoutConfig> = {
  'split-v': {
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gridTemplateRows: '1fr',
  },
  'split-h': {
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'repeat(auto-fit, minmax(300px, 1fr))',
  },
  'grid': {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
  },
  'mosaic': {
    // Golden ratio layout
    gridTemplateAreas: `
      "main main side1"
      "main main side2"
    `,
  },
};
```

### Suspender/Hibernar Janelas

```typescript
// Otimização: pausar renderização de janelas não visíveis
const BibleWindow: React.FC<{ window: WindowState }> = ({ window }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="window-container">
      {isVisible ? (
        <WindowContent>{window.content}</WindowContent>
      ) : (
        <WindowPlaceholder />
      )}
    </div>
  );
};
```

---

## 📝 Notepad Avançado — "Estúdio de Estudos"

### Editor Markdown Rico

```typescript
// src/features/notepad/StudyNotepad.tsx
import MDEditor from '@uiw/react-md-editor';
import { useNoteStore } from '@/stores/noteStore';

interface StudySession {
  id: string;
  title: string;
  content: string;
  verses: BibleReference[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  exportFormat?: 'md' | 'docx' | 'pdf' | 'html';
}

export const StudyNotepad: React.FC = () => {
  const [activeSession, setActiveSession] = useState<StudySession>();
  const { sessions, createSession, saveSession } = useNoteStore();

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Barra de ferramentas do notepad */}
      <NotepadToolbar>
        <Button onClick={() => insertVerseReference()}>
          <BookOpen className="w-4 h-4 mr-2" />
          Inserir Referência
        </Button>
        <Button onClick={() => insertStrongNumber()}>
          <Type className="w-4 h-4 mr-2" />
          Inserir Strong
        </Button>
        <Button onClick={() => insertCommentary()}>
          <Quote className="w-4 h-4 mr-2" />
          Citar Comentário
        </Button>
        <Separator orientation="vertical" />
        <ExportDropdown />
      </NotepadToolbar>

      {/* Editor */}
      <MDEditor
        value={activeSession?.content}
        onChange={(value) => saveSession({ ...activeSession, content: value })}
        preview="edit"
        height="100%"
        toolbarCommands={[
          'bold', 'italic', 'header', 'quote', 'link',
          'unordered-list', 'ordered-list', 'code', 'table',
          // Custom commands
          'insert-verse', 'insert-strong', 'insert-map'
        ]}
      />

      {/* Painel de versículos relacionados */}
      <VersesPanel 
        verses={activeSession?.verses}
        onVerseClick={(ref) => navigateTo(ref)}
      />
    </div>
  );
};

// Templates de estudo
const studyTemplates = {
  sermon: `# Sermão: {{tema}}

## Texto Base
{{versículo_base}}

## Introdução

## Pontos Principais
1. 
2. 
3. 

## Aplicação

## Conclusão

---
Preparado por: {{autor}}
Data: {{data}}
`,
  exegesis: `# Exegese de {{referência}}

## Contexto Histórico

## Análise Gramatical
{{análise_strong}}

## Uso no AT/NT
{{cross_references}}

## Comentários
{{comentários_teorogos}}

## Aplicação Teológica

## Conclusão Exegética
`,
  devotional: `# Meditação Diária

## Versículo do Dia
{{versículo}}

## Reflexão

## Oração

## Aplicação Prática
- [ ] 
- [ ] 
- [ ] 
`
};
```

### Autocomplete Inteligente

```typescript
// Sugestões enquanto digita
const useBibleAutocomplete = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleInput = (text: string, cursorPosition: number) => {
    const beforeCursor = text.slice(0, cursorPosition);
    
    // Detectar padrões
    if (beforeCursor.match(/\b(Gên|Êxo|Lev|Núm|Deu)\w*$/)) {
      // Sugerir livros
      setSuggestions(searchBooks(beforeCursor));
    }
    
    if (beforeCursor.match(/\b(H\d{1,4})?$/)) {
      // Sugerir números Strong
      setSuggestions(searchStrong(beforeCursor));
    }
    
    if (beforeCursor.match(/#$/) || beforeCursor.match(/\s#(\w*)$/)) {
      // Sugerir tags
      setSuggestions(getTags());
    }
  };

  return { suggestions, handleInput };
};
```

---

## 📤 Exportação Profissional — Word-style

### Exportar para DOCX

```typescript
// src/lib/export/docxExporter.ts
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface ExportOptions {
  includeFootnotes: boolean;
  includeVerses: boolean;
  fontSize: number;
  fontFamily: string;
  headerText?: string;
  footerText?: string;
}

export const exportToDocx = async (
  content: string,
  verses: BibleReference[],
  options: ExportOptions
): Promise<Blob> => {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              text: options.headerText || 'Bíblia Alpha - Estudo Bíblico',
              alignment: AlignmentType.CENTER,
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES]
                })
              ]
            })
          ]
        })
      },
      children: [
        // Título
        new Paragraph({
          text: 'Estudo Bíblico',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        
        // Data
        new Paragraph({
          text: new Date().toLocaleDateString('pt-BR'),
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 }
        }),
        
        // Conteúdo convertido de Markdown
        ...markdownToDocx(content),
        
        // Versículos referenciados
        ...(options.includeVerses ? [
          new Paragraph({ text: '', spacing: { before: 600 } }),
          new Paragraph({
            text: 'Versículos Referenciados',
            heading: HeadingLevel.HEADING_2
          }),
          ...verses.map(v => new Paragraph({
            text: `${v.book} ${v.chapter}:${v.verse}`,
            bullet: { level: 0 }
          }))
        ] : []),
        
        // Notas de rodapé com Strong
        ...(options.includeFootnotes ? generateFootnotes(content) : [])
      ]
    }]
  });

  return await Packer.toBlob(doc);
};

// Uso no componente
const ExportButton = ({ session }: { session: StudySession }) => {
  const handleExport = async (format: 'docx' | 'pdf' | 'html') => {
    const blob = await exportToDocx(session.content, session.verses, {
      includeFootnotes: true,
      includeVerses: true,
      fontSize: 12,
      fontFamily: 'Times New Roman',
      headerText: session.title
    });
    
    saveAs(blob, `${session.title}.docx`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('docx')}>
          <FileText className="w-4 h-4 mr-2" />
          Microsoft Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <File className="w-4 h-4 mr-2" />
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('html')}>
          <Code className="w-4 h-4 mr-2" />
          HTML (.html)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

### Exportar citação formatada

```typescript
// Copiar versículo formatado para clipboard
const copyFormattedVerse = (verse: Verse, format: 'simple' | 'academic' | 'social') => {
  const formats = {
    simple: `${verse.text} — ${verse.reference}`,
    academic: `"${verse.text}" (${verse.reference}, NVI).`,
    social: `📖 "${verse.text.slice(0, 200)}${verse.text.length > 200 ? '...' : ''}" \n\n— ${verse.reference} #BíbliaAlpha`
  };
  
  navigator.clipboard.writeText(formats[format]);
  toast.success('Versículo copiado!');
};
```

---

## 🔗 Integrações com Apps (via MCP)

O BrowserOS tem integrações nativas! Vou usar as que estão conectadas.

### Integração Gmail

```typescript
// src/features/integrations/GmailIntegration.tsx
import { useState } from 'react';
import { execute_action } from '@/tools/strata';

interface EmailBibleStudy {
  verse: BibleReference;
  note: string;
  recipients: string[];
}

export const GmailIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);

  const sendVerseEmail = async (study: EmailBibleStudy) => {
    const verseText = await fetchVerse(study.verse);
    
    const emailBody = `
📖 ${study.verse.book} ${study.verse.chapter}:${study.verse.verse}

"${verseText}"

💭 Reflexão:
${study.note}

---
Enviado via Bíblia Alpha
    `.trim();

    try {
      await execute_action('gmail', 'send_email', {
        to: study.recipients,
        subject: `📖 Versículo para reflexão: ${study.verse.book} ${study.verse.chapter}:${study.verse.verse}`,
        body: emailBody
      });
      
      toast.success('E-mail enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar e-mail');
    }
  };

  return (
    <IntegrationCard
      name="Gmail"
      icon={<Mail className="w-6 h-6" />}
      connected={isConnected}
      actions={[
        { label: 'Enviar versículo', action: sendVerseEmail },
        { label: 'Compartilhar estudo', action: sendStudyEmail },
      ]}
    />
  );
};
```

### Integração Google Calendar

```typescript
// src/features/integrations/CalendarIntegration.tsx

export const CalendarIntegration = () => {
  const createDevotionalEvent = async (plan: ReadingPlan) => {
    const event = {
      summary: `📖 Devocional: ${plan.todayReading}`,
      description: `
Plano de leitura: ${plan.name}
Hoje: ${plan.todayReading}

Versículos:
${plan.verses.map(v => `• ${v}`).join('\n')}

Abrir no Bíblia Alpha: ${generateDeepLink(plan)}
      `,
      start: {
        dateTime: new Date().setHours(6, 0, 0, 0),
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: new Date().setHours(6, 30, 0, 0),
        timeZone: 'America/Sao_Paulo'
      },
      recurrence: ['RRULE:FREQ=DAILY'],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 }
        ]
      }
    };

    try {
      await execute_action('google-calendar', 'create_event', event);
      toast.success('Lembrete diário criado!');
    } catch (error) {
      toast.error('Erro ao criar evento');
    }
  };

  return (
    <IntegrationCard
      name="Google Calendar"
      icon={<Calendar className="w-6 h-6" />}
      actions={[
        { label: 'Agendar devocional', action: createDevotionalEvent },
        { label: 'Plano de leitura', action: createReadingPlanEvents },
      ]}
    />
  );
};
```

### Integração Notion

```typescript
// src/features/integrations/NotionIntegration.tsx

export const NotionIntegration = () => {
  const exportToNotion = async (session: StudySession) => {
    const blocks = [
      {
        object: 'block',
        type: 'heading_1',
        heading_1: { text: [{ text: { content: session.title } }] }
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { text: [{ text: { content: session.content } }] }
      },
      {
        object: 'block',
        type: 'divider',
        divider: {}
      },
      {
        object: 'block',
        type: 'callout',
        callout: {
          text: [{ 
            text: { 
              content: 'Versículos: ' + session.verses.map(v => 
                `${v.book} ${v.chapter}:${v.verse}`
              ).join(', ')
            } 
          }],
          icon: { emoji: '📖' }
        }
      }
    ];

    try {
      await execute_action('notion', 'create_page', {
        parent: { database_id: process.env.NOTION_DATABASE_ID },
        properties: {
          title: { title: [{ text: { content: session.title } }] },
          tags: { multi_select: session.tags.map(t => ({ name: t })) },
          date: { date: { start: new Date().toISOString() } }
        },
        children: blocks
      });
      
      toast.success('Estudo enviado para o Notion!');
    } catch (error) {
      toast.error('Erro ao exportar para Notion');
    }
  };

  return (
    <IntegrationCard
      name="Notion"
      icon={<FileText className="w-6 h-6" />}
      actions={[
        { label: 'Exportar estudo', action: exportToNotion },
      ]}
    />
  );
};
```

---

## 📤 Compartilhamento Social

### Gerar Imagens de Versículos

```typescript
// src/features/social/VerseImageGenerator.tsx
import html2canvas from 'html2canvas';

interface VerseImageTemplate {
  id: string;
  name: string;
  background: string; // URL ou gradient
  font: string;
  textColor: string;
  overlay: 'dark' | 'light' | 'none';
}

const templates: VerseImageTemplate[] = [
  {
    id: 'sunrise',
    name: 'Amanhecer',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    font: 'Playfair Display',
    textColor: '#ffffff',
    overlay: 'dark'
  },
  {
    id: 'sepia',
    name: 'Clássico',
    background: '#f5f1e6',
    font: 'EB Garamond',
    textColor: '#3d3d3d',
    overlay: 'none'
  },
  {
    id: 'nature',
    name: 'Natureza',
    background: 'url(/backgrounds/nature.jpg)',
    font: 'Cormorant Garamond',
    textColor: '#ffffff',
    overlay: 'dark'
  }
];

export const VerseImageGenerator: React.FC<{ verse: Verse }> = ({ verse }) => {
  const [selectedTemplate, setTemplate] = useState(templates[0]);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateImage = async () => {
    if (!cardRef.current) return;
    
    const canvas = await html2canvas(cardRef.current, {
      scale: 2, // Alta resolução
      backgroundColor: null
    });
    
    const blob = await new Promise<Blob>((resolve) => 
      canvas.toBlob(resolve, 'image/png')
    );
    
    return blob;
  };

  const shareToSocial = async (platform: 'twitter' | 'facebook' | 'whatsapp' | 'instagram') => {
    const imageBlob = await generateImage();
    const imageUrl = URL.createObjectURL(imageBlob);
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `"${verse.text.slice(0, 100)}..." — ${verse.reference}`
      )}&url=${encodeURIComponent('https://bibliaalpha.com')}`,
      
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        `https://bibliaalpha.com/share/${verse.id}`
      )}`,
      
      whatsapp: `https://wa.me/?text=${encodeURIComponent(
        `📖 ${verse.reference}\n\n"${verse.text}"\n\nVia Bíblia Alpha`
      )}`,
      
      instagram: 'download' // Instagram não tem share URL, precisa baixar
    };
    
    if (platform === 'instagram') {
      downloadImage(imageBlob, `bibliaalpha-${verse.id}.png`);
      toast.info('Imagem baixada! Compartilhe no Instagram.');
    } else {
      window.open(shareUrls[platform], '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div
        ref={cardRef}
        className="p-8 rounded-lg text-center"
        style={{
          background: selectedTemplate.background,
          fontFamily: selectedTemplate.font,
          color: selectedTemplate.textColor
        }}
      >
        {selectedTemplate.overlay !== 'none' && (
          <div className={`absolute inset-0 bg-black/30 rounded-lg`} />
        )}
        <p className="text-2xl font-serif leading-relaxed italic">
          "{verse.text}"
        </p>
        <p className="mt-4 text-lg font-semibold">
          — {verse.reference}
        </p>
        <p className="mt-2 text-sm opacity-75">
          Bíblia Alpha
        </p>
      </div>

      {/* Template Selector */}
      <div className="flex gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setTemplate(t)}
            className={`px-4 py-2 rounded ${
              selectedTemplate.id === t.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Share Buttons */}
      <div className="flex gap-2">
        <Button onClick={() => shareToSocial('twitter')}>
          <Twitter className="w-4 h-4 mr-2" />
          Twitter
        </Button>
        <Button onClick={() => shareToSocial('facebook')}>
          <Facebook className="w-4 h-4 mr-2" />
          Facebook
        </Button>
        <Button onClick={() => shareToSocial('whatsapp')}>
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>
        <Button onClick={() => shareToSocial('instagram')}>
          <Instagram className="w-4 h-4 mr-2" />
          Instagram
        </Button>
      </div>
    </div>
  );
};
```

---

## 🔍 Concordância Ultra Avançada

### Motor de Busca com Fuzzy Matching

```typescript
// src/features/search/AdvancedConcordance.tsx
import Fuse from 'fuse.js';
import { createSearchIndex } from '@/lib/searchIndex';

interface SearchFilters {
  books?: string[];
  testament?: 'old' | 'new' | 'both';
  language?: 'hebrew' | 'greek' | 'portuguese';
  strongNumber?: string;
  theologian?: string;
  dateRange?: { start: Date; end: Date };
}

interface SearchResult {
  verse: Verse;
  confidence: number;
  matches: Array<{
    text: string;
    indices: Array<[number, number]>;
  }>;
  context: {
    before: string;
    after: string;
  };
}

export const AdvancedConcordance: React.FC = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const { versesIndex, strongIndex, commentaryIndex } = useSearchIndices();

  const performSearch = useCallback(() => {
    if (!query.trim()) return;

    // Busca em múltiplos índices
    const verseResults = versesIndex.search(query, {
      fuzzy: 0.3, // Allow 30% typo tolerance
      limit: 50
    });

    const strongResults = filters.strongNumber 
      ? strongIndex.search(filters.strongNumber)
      : [];

    const commentaryResults = filters.theologian
      ? commentaryIndex.search(query, { 
          filter: (item) => item.theologian === filters.theologian 
        })
      : [];

    // Combinar e ranquear
    const combined = rankResults([
      ...verseResults.map(r => ({ ...r, source: 'bible' })),
      ...strongResults.map(r => ({ ...r, source: 'strong' })),
      ...commentaryResults.map(r => ({ ...r, source: 'commentary' }))
    ]);

    setResults(combined);
  }, [query, filters, versesIndex, strongIndex, commentaryIndex]);

  return (
    <div className="flex flex-col h-full">
      {/* Barra de busca avançada */}
      <div className="p-4 border-b space-y-4">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar na Bíblia, Strong ou comentários..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && performSearch()}
          />
          <Button onClick={performSearch}>
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        </div>

        {/* Filtros avançados */}
        <div className="flex flex-wrap gap-4">
          <BookFilter 
            selected={filters.books} 
            onChange={(books) => setFilters(f => ({ ...f, books }))}
          />
          
          <TestamentFilter
            selected={filters.testament}
            onChange={(testament) => setFilters(f => ({ ...f, testament }))}
          />
          
          <TheologianFilter
            selected={filters.theologian}
            onChange={(theologian) => setFilters(f => ({ ...f, theologian }))}
          />
          
          <StrongFilter
            value={filters.strongNumber}
            onChange={(strongNumber) => setFilters(f => ({ ...f, strongNumber }))}
          />
        </div>
      </div>

      {/* Resultados */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {results.map((result, idx) => (
            <SearchResultCard 
              key={idx}
              result={result}
              onClick={() => navigateTo(result.verse.reference)}
              highlight={query}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Estatísticas */}
      <div className="p-3 bg-muted text-sm text-muted-foreground border-t">
        {results.length} resultados encontrados • 
        Tempo: {searchTime}ms •
        {results.filter(r => r.source === 'bible').length} versículos •
        {results.filter(r => r.source === 'commentary').length} comentários
      </div>
    </div>
  );
};

// Busca semântica com sinônimos
const semanticSearch = (query: string, verses: Verse[]): SearchResult[] => {
  const synonyms = getSynonyms(query);
  
  return verses
    .map(verse => {
      let score = 0;
      
      // Match exato
      if (verse.text.includes(query)) score += 10;
      
      // Match de sinônimo
      synonyms.forEach(syn => {
        if (verse.text.includes(syn)) score += 5;
      });
      
      // Stemming (raiz da palavra)
      if (stemMatch(query, verse.text)) score += 3;
      
      return { verse, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
};
```

---

## 📊 Painel de Zoom e Acessibilidade

```typescript
// src/features/accessibility/ZoomControls.tsx

export const ZoomPanel: React.FC = () => {
  const { fontSize, setFontSize, lineHeight, setLineHeight } = useAccessibilityStore();

  const presets = [
    { name: 'Compacto', size: 14, lineHeight: 1.5 },
    { name: 'Normal', size: 18, lineHeight: 1.8 },
    { name: 'Confortável', size: 22, lineHeight: 2.0 },
    { name: 'Grande', size: 26, lineHeight: 2.2 },
    { name: 'Acessível', size: 30, lineHeight: 2.5 },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <ZoomIn className="w-4 h-4 mr-2" />
          {Math.round((fontSize / 16) * 100)}%
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-72">
        <div className="space-y-4">
          <h4 className="font-semibold">Tamanho do Texto</h4>
          
          {/* Slider de zoom */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>A</span>
              <span>A</span>
            </div>
            <Slider
              value={[fontSize]}
              onValueChange={([v]) => setFontSize(v)}
              min={12}
              max={40}
              step={1}
            />
            <div className="text-center text-sm">{fontSize}px</div>
          </div>

          {/* Altura da linha */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Espaçamento</label>
            <Slider
              value={[lineHeight]}
              onValueChange={([v]) => setLineHeight(v)}
              min={1.2}
              max={3.0}
              step={0.1}
            />
          </div>

          {/* Presets */}
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => {
                  setFontSize(preset.size);
                  setLineHeight(preset.lineHeight);
                }}
                className={
                  fontSize === preset.size 
                    ? 'border-primary bg-primary/10' 
                    : ''
                }
              >
                {preset.name}
              </Button>
            ))}
          </div>

          {/* Preview */}
          <div 
            className="p-3 bg-muted rounded text-center"
            style={{ fontSize: `${fontSize}px`, lineHeight }}
          >
            "No princípio criou Deus os céus e a terra."
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
```

---

## 🎯 Integração Completa Strong + Dicionários + Enciclopédias

### Painel de Informações (InfoCard)

```typescript
// src/features/study/InfoCard.tsx

interface InfoCardData {
  word: string;
  reference: BibleReference;
  strong?: {
    number: string;
    transliteration: string;
    pronunciation: string;
    definition: string;
    usage: string[];
    occurrences: number;
  };
  dictionary?: {
    entry: string;
    etymology: string;
    theologicalSignificance: string;
  };
  encyclopedia?: {
    article: string;
    summary: string;
    relatedTopics: string[];
  };
  crossReferences: BibleReference[];
}

export const InfoCard: React.FC<{ word: string; ref: BibleReference }> = ({ word, ref }) => {
  const [activeTab, setActiveTab] = useState<'strong' | 'dictionary' | 'encyclopedia'>('strong');
  const [data, setData] = useState<InfoCardData>();

  useEffect(() => {
    fetchWordData(word, ref).then(setData);
  }, [word, ref]);

  if (!data) return <Skeleton className="h-64" />;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-serif">{data.word}</CardTitle>
            <p className="text-sm text-muted-foreground">{ref.book} {ref.chapter}:{ref.verse}</p>
          </div>
          {data.strong && (
            <Badge variant="secondary" className="text-lg font-mono">
              H{data.strong.number}
            </Badge>
          )}
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="w-full">
          <TabsTrigger value="strong" className="flex-1">
            Strong
          </TabsTrigger>
          <TabsTrigger value="dictionary" className="flex-1">
            Dicionário
          </TabsTrigger>
          <TabsTrigger value="encyclopedia" className="flex-1">
            Enciclopédia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strong" className="p-4 space-y-3">
          {data.strong && (
            <>
              <div className="space-y-1">
                <p className="text-lg font-semibold">{data.strong.transliteration}</p>
                <p className="text-sm text-muted-foreground">/{data.strong.pronunciation}/</p>
              </div>
              
              <p className="text-sm">{data.strong.definition}</p>
              
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Aparece {data.strong.occurrences}x
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.strong.usage.slice(0, 5).map((u, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {u}
                    </Badge>
                  ))}
                  {data.strong.usage.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{data.strong.usage.length - 5}
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="dictionary" className="p-4 space-y-3">
          {data.dictionary && (
            <>
              <p className="text-sm leading-relaxed">{data.dictionary.entry}</p>
              
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-1">Etimologia</p>
                <p className="text-sm">{data.dictionary.etymology}</p>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-1">Significado Teológico</p>
                <p className="text-sm">{data.dictionary.theologicalSignificance}</p>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="encyclopedia" className="p-4 space-y-3">
          {data.encyclopedia && (
            <>
              <p className="text-sm leading-relaxed">{data.encyclopedia.summary}</p>
              
              <div className="flex flex-wrap gap-1 pt-2">
                {data.encyclopedia.relatedTopics.map((topic) => (
                  <Badge 
                    key={topic} 
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => searchTopic(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <CardFooter className="border-t pt-3">
        <div className="w-full">
          <p className="text-xs text-muted-foreground mb-2">Referências Relacionadas</p>
          <div className="flex flex-wrap gap-1">
            {data.crossReferences.slice(0, 5).map((ref, i) => (
              <Button
                key={i}
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => navigateTo(ref)}
              >
                {ref.book} {ref.chapter}:{ref.verse}
              </Button>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
```

---

## 📋 Checklist de Funcionalidades Ultra Pro

### Janelas Multi-View
- [ ] Sistema de janelas flutuantes/dockáveis
- [ ] Sincronização de navegação entre janelas
- [ ] Layouts: tabbed, split, grid, mosaic
- [ ] Popout para janela externa
- [ ] Suspend/Hibernate janelas inativas

### Comparação de Traduções
- [ ] Abrir versículo em múltiplas versões
- [ ] Destacar diferenças entre traduções
- [ ] Sincronização de scroll

### Notepad Avançado
- [ ] Editor Markdown com syntax highlighting
- [ ] Templates de estudo (sermão, exegese, devocional)
- [ ] Autocomplete de referências
- [ ] Inserção de versículos/strong/comentários
- [ ] Vinculação bidirecional nota ↔ versículo

### Integrações
- [ ] Gmail: enviar versículos/estudos
- [ ] Google Calendar: lembretes de devocional
- [ ] Notion: exportar estudos formatados
- [ ] GitHub: versionamento de estudos

### Social Sharing
- [ ] Gerar imagens de versículos
- [ ] Templates visuais
- [ ] Compartilhar direto para redes
- [ ] Link curto para versículos

### Exportação
- [ ] Exportar para DOCX (formato Word)
- [ ] Exportar para PDF
- [ ] Exportar para HTML
- [ ] Preservar formatação e notas

### Busca Avançada
- [ ] Fuzzy matching com tolerância a erros
- [ ] Busca semântica com sinônimos
- [ ] Filtros por livro/testamento/teólogo
- [ ] Busca em Strong simultânea
- [ ] Busca em comentários
- [ ] Estatísticas de resultados

### Acessibilidade
- [ ] Zoom contínuo 12px-40px
- [ ] Altura de linha ajustável
- [ ] Presets de acessibilidade
- [ ] Modo leitura focada
- [ ] Navegação por voz

### Painel Integrado Strong/Dicionário
- [ ] InfoCard com todas as informações
- [ ] Abas: Strong / Dicionário / Enciclopédia
- [ ] Ocorrências e uso
- [ ] Termos relacionados
- [ ] Cross-references automáticas

---

## 🚀 Implementação por Ordem de Prioridade

### Sprint 1 (Semanas 1-2): Fundação
1. Sistema de janelas básico
2. Zoom controls
3. Exportação simples (copy)

### Sprint 2 (Semanas 3-4): Produtividade
1. Notepad com templates
2. Busca avançada básica
3. InfoCard Strong

### Sprint 3 (Semanas 5-6): Integrações
1. Gmail integration
2. Social sharing
3. Export DOCX

### Sprint 4 (Semanas 7-8): Polish
1. Calendário + Notion
2. Busca semântica
3. Performance optimization

---

*Funcionalidades Ultra Pro para transformar o Bíblia Alpha na ferramenta de estudo bíblico mais poderosa da web.*
