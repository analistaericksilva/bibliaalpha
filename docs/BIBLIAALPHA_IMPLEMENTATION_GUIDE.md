# 🚀 Guia de Implementação — Bíblia Alpha Modernização

## Sumário Executivo

Transformar o Bíblia Alpha de uma plataforma web simples para um **estúdio de estudo bíblico profissional**, inspirado na interface do Microsoft Word (usabilidade) + TheWord (funcionalidades específicas para Bíblia).

---

## 🎯 Fase 1: Setup e Fundação (Semanas 1-2)

### 1.1 Instalação de Dependências

```bash
# Navegar até o projeto
cd bibliaalpha

# Instalar dependências de layout
npm install react-resizable-panels@^2.0.0

# Virtualização para performance
npm install @tanstack/react-virtual@^3.0.0

# Animações
npm install framer-motion@^11.0.0

# Eslint + Prettier config
npm install -D eslint-plugin-import@latest
```

### 1.2 Reestruturação de Pastas

```bash
# Backup do projeto atual
git checkout -b v2-modern-layout
git add .
git commit -m "backup: antes da modernização"

# Criar nova estrutura
mkdir -p src/layouts
mkdir -p src/features/bible-navigation
mkdir -p src/features/bible-study
mkdir -p src/features/user-annotations
mkdir -p src/features/module-system

# Mover componentes existentes
mv src/components src/components-old
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/bible
mkdir -p src/components/study
mkdir -p src/components/reader
```

### 1.3 Configuração do Tailwind

Atualizar `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['EB Garamond', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        highlight: {
          yellow: '#fef08a',
          green: '#bbf7d0',
          blue: '#bfdbfe',
          pink: '#fbcfe8',
          purple: '#e9d5ff',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
```

---

## 🎨 Fase 2: Layout Principal (Semanas 2-3)

### 2.1 Criar Store de Layout (Zustand)

**`src/stores/layoutStore.ts`**:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PanelConfig {
  isOpen: boolean;
  size: number;
  position: 'left' | 'right';
}

interface LayoutState {
  // Panels
  leftPanel: PanelConfig;
  rightPanel: PanelConfig;
  
  // Ribbon
  activeRibbonTab: string;
  
  // View settings
  fontSize: number;
  theme: 'light' | 'dark' | 'sepia';
  layoutMode: 'single' | 'parallel';
  
  // Actions
  togglePanel: (side: 'left' | 'right') => void;
  setPanelSize: (side: 'left' | 'right', size: number) => void;
  setActiveRibbonTab: (tab: string) => void;
  setFontSize: (size: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'sepia') => void;
  resetLayout: () => void;
}

const initialState = {
  leftPanel: { isOpen: true, size: 20, position: 'left' as const },
  rightPanel: { isOpen: true, size: 30, position: 'right' as const },
  activeRibbonTab: 'home',
  fontSize: 18,
  theme: 'light' as const,
  layoutMode: 'single' as const,
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      togglePanel: (side) => {
        const key = side === 'left' ? 'leftPanel' : 'rightPanel';
        set((state) => ({
          [key]: { ...state[key], isOpen: !state[key].isOpen }
        }));
      },
      
      setPanelSize: (side, size) => {
        const key = side === 'left' ? 'leftPanel' : 'rightPanel';
        set((state) => ({
          [key]: { ...state[key], size }
        }));
      },
      
      setActiveRibbonTab: (tab) => set({ activeRibbonTab: tab }),
      setFontSize: (size) => set({ fontSize: size }),
      setTheme: (theme) => set({ theme }),
      resetLayout: () => set(initialState),
    }),
    {
      name: 'biblealpha-layout',
    }
  )
);
```

### 2.2 Criar Store de Bíblia

**`src/stores/bibleStore.ts`**:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BibleReference {
  book: string;
  chapter: number;
  verse?: number;
}

interface BibleState {
  currentRef: BibleReference;
  selectedVerses: string[];
  searchQuery: string;
  searchFilters: {
    testament?: 'old' | 'new' | 'all';
    book?: string;
  };
  
  navigateTo: (ref: BibleReference) => void;
  nextChapter: () => void;
  previousChapter: () => void;
  selectVerse: (verseId: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useBibleStore = create<BibleState>()(
  persist(
    (set, get) => ({
      currentRef: { book: 'Gênesis', chapter: 1 },
      selectedVerses: [],
      searchQuery: '',
      searchFilters: { testament: 'all' },
      
      navigateTo: (ref) => set({ currentRef: ref, selectedVerses: [] }),
      
      nextChapter: () => {
        const { currentRef } = get();
        // Logic to handle book/chapter bounds
        set({ 
          currentRef: { 
            ...currentRef, 
            chapter: currentRef.chapter + 1 
          },
          selectedVerses: []
        });
      },
      
      previousChapter: () => {
        const { currentRef } = get();
        if (currentRef.chapter > 1) {
          set({ 
            currentRef: { 
              ...currentRef, 
              chapter: currentRef.chapter - 1 
            },
            selectedVerses: []
          });
        }
      },
      
      selectVerse: (verseId) => {
        const { selectedVerses } = get();
        if (selectedVerses.includes(verseId)) {
          set({ 
            selectedVerses: selectedVerses.filter(id => id !== verseId) 
          });
        } else {
          set({ selectedVerses: [...selectedVerses, verseId] });
        }
      },
      
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'biblealpha-bible',
    }
  )
);
```

---

## 📖 Fase 3: Componentes Core (Semanas 3-5)

### 3.1 Atalhos de Teclado

**`src/lib/keyboardShortcuts.ts`**:

```typescript
import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        
        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Predefined shortcuts
export const createBibleShortcuts = (
  navigateNext: () => void,
  navigatePrev: () => void,
  toggleLeftPanel: () => void,
  toggleRightPanel: () => void,
  focusSearch: () => void
): KeyboardShortcut[] => [
  { key: 'ArrowRight', action: navigateNext },
  { key: 'ArrowLeft', action: navigatePrev },
  { key: 'f', ctrl: true, action: focusSearch },
  { key: 'l', ctrl: true, action: toggleLeftPanel },
  { key: 'r', ctrl: true, action: toggleRightPanel },
  { key: '1', alt: true, action: () => setActivePanel('comentarios') },
  { key: '2', alt: true, action: () => setActivePanel('dicionario') },
  { key: '3', alt: true, action: () => setActivePanel('mapa') },
];
```

### 3.2 Tema Sépia

Adicionar ao `index.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }

  .sepia {
    --background: 40 30% 96%;
    --foreground: 30 30% 15%;
    --card: 40 25% 94%;
    --card-foreground: 30 30% 15%;
    --popover: 40 25% 94%;
    --popover-foreground: 30 30% 15%;
    --primary: 25 60% 35%;
    --primary-foreground: 40 30% 96%;
    --secondary: 35 20% 88%;
    --secondary-foreground: 30 30% 15%;
    --muted: 35 15% 85%;
    --muted-foreground: 30 20% 40%;
    --accent: 35 20% 88%;
    --accent-foreground: 30 30% 15%;
    --destructive: 0 50% 40%;
    --destructive-foreground: 40 30% 96%;
    --border: 35 15% 80%;
    --input: 35 15% 80%;
    --ring: 25 60% 35%;
  }
}

/* Bible text specific styles */
.bible-text {
  font-family: 'EB Garamond', Georgia, serif;
  line-height: 1.8;
  text-align: justify;
  hyphens: auto;
}

.verse-number {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.7em;
  vertical-align: super;
  color: hsl(var(--primary));
  margin-right: 0.3em;
  user-select: none;
}

.chapter-title {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
  color: hsl(var(--foreground));
}

.verse-highlight {
  background-color: hsl(var(--highlight-yellow));
  padding: 0.1em 0.2em;
  border-radius: 2px;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: hsl(var(--muted));
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}

/* Panel resize handle */
[data-panel-resize-handle-id] {
  width: 4px;
  background: hsl(var(--border));
  transition: background 0.2s;
}

[data-panel-resize-handle-id]:hover {
  background: hsl(var(--primary));
}
```

---

## 🧪 Fase 4: Testes e Performance (Semanas 5-6)

### 4.1 Testes Críticos

```typescript
// tests/reader.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Bible Reader', () => {
  test('should navigate between chapters with arrow keys', async ({ page }) => {
    await page.goto('/');
    const currentChapter = await page.textContent('[data-testid="chapter-number"]');
    
    await page.keyboard.press('ArrowRight');
    const nextChapter = await page.textContent('[data-testid="chapter-number"]');
    
    expect(Number(nextChapter)).toBe(Number(currentChapter) + 1);
  });

  test('should toggle panels with keyboard shortcuts', async ({ page }) => {
    await page.goto('/');
    
    // Close left panel
    await page.keyboard.down('Control');
    await page.keyboard.press('l');
    await page.keyboard.up('Control');
    
    await expect(page.locator('[data-panel="left"]')).not.toBeVisible();
  });

  test('should highlight verses', async ({ page }) => {
    await page.goto('/genesis/1');
    
    const verse = page.locator('[data-verse-id="gen-1-1"]');
    await verse.hover();
    await verse.locator('[data-action="highlight"]').click();
    
    await expect(verse).toHaveClass(/highlighted/);
  });
});
```

### 4.2 Otimizações de Performance

```typescript
// src/hooks/useVirtualVerses.ts
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useCallback } from 'react';

export const useVirtualVerses = (verseCount: number) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: verseCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 80, []),
    overscan: 5,
  });

  return { parentRef, virtualizer };
};

// lazy load do mapa
const BibleMap = lazy(() => import('@/components/study/BibleMap'));

// Prefetch do próximo capítulo
useEffect(() => {
  const nextChapter = getNextChapter(currentRef);
  queryClient.prefetchQuery({
    queryKey: ['bible', nextChapter],
    queryFn: () => fetchChapter(nextChapter),
  });
}, [currentRef]);
```

---

## 📋 Checklist de Lançamento

### ✅ Pré-lançamento
- [ ] Todos os testes passando
- [ ] Lighthouse score > 90
- [ ] Testado em Chrome, Firefox, Safari, Edge
- [ ] Mobile responsive funcionando
- [ ] Acessibilidade (ARIA labels, navegação por teclado)

### ✅ Conteúdo
- [ ] Todos os 66 livros carregando corretamente
- [ ] Comentários dos teólogos integrados
- [ ] Dicionário Strong funcional
- [ ] Mapa com todos os locais bíblicos
- [ ] Cross-references populadas

### ✅ UX
- [ ] Loading states em todos os fetch
- [ ] Error boundaries implementados
- [ ] Toast notifications para ações
- [ ] Onboarding para novos usuários
- [ ] Tooltips em todos os botões

---

## 🚀 Deploy

```bash
# 1. Build de produção
npm run build

# 2. Verificar bundle size
npm run analyze

# 3. Deploy para Vercel/Netlify
vercel --prod

# 4. Monitorar
# - Sentry para erros
# - Vercel Analytics para performance
```

---

## 📚 Referências

- **TheWord**: [theword.net](https://theword.net) - Interface de painéis dockáveis
- **Word Ribbon**: [Microsoft Office UI](https://docs.microsoft.com/office) - Padrão ribbon
- **Logos Bible**: [logos.com](https://logos.com) - Integração de ferramentas
- **Bible.com**: [bible.com](https://bible.com) - Experiência mobile

---

**Status**: Planejamento  
**Próxima revisão**: Após implementação da Fase 1  
**Responsável**: Equipe BibleAlpha
