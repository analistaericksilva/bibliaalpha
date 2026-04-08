# 🐛 Correções Imediatas — Bíblia Alpha

## Problemas Encontrados na Análise

### ⚠️ CRÍTICO — Site Não Funciona

**Problema**: O site `bibliaalpha.com` mostra apenas uma landing page de "Alpha Studio" com doação PIX, não a plataforma de estudo.

**Causa Provável**:
1. App não está roteando corretamente para o leitor bíblico
2. Problema de autenticação redirecionando para tela errada
3. Build de produção desatualizado

**Solução**:

```typescript
// src/App.tsx — Correção do roteamento
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

function App() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingScreen />;
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page apenas para não-autenticados */}
        <Route 
          path="/" 
          element={
            user ? <Navigate to="/bible" replace /> : <LandingPage />
          } 
        />
        
        {/* App principal */}
        <Route 
          path="/bible/*" 
          element={
            user ? <BibleAlphaShell /> : <Navigate to="/login" replace />
          } 
        />
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🔧 Correções de Bugs

### 1. Loop de Redirecionamento

**Arquivo**: `src/hooks/useAuth.ts`

```typescript
// ANTES (problemático):
useEffect(() => {
  if (!user) navigate('/');
}, [user]);

// DEPOIS (corrigido):
useEffect(() => {
  if (!user && location.pathname !== '/login') {
    navigate('/login', { replace: true });
  }
}, [user, location.pathname]);
```

### 2. Estado de Loading Infinito

**Arquivo**: `src/components/LoadingScreen.tsx`

```typescript
// Adicionar timeout para evitar loading eterno
const LoadingScreen = () => {
  const [showRetry, setShowRetry] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 10000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      <p className="mt-4 text-muted-foreground">Carregando...</p>
      
      {showRetry && (
        <div className="mt-4 text-center">
          <p className="text-sm text-destructive mb-2">Carregamento demorado</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
};
```

### 3. Lógica de Aprovação de Usuários

**Arquivo**: `supabase/policies.sql`

```sql
-- Permitir login mesmo com status pending
CREATE POLICY "Users can login if pending or approved"
  ON auth.users
  FOR SELECT
  USING (
    raw_user_meta_data->>'role' IN ('subscriber', 'pending', 'admin')
  );

-- Redirecionar pending para página de espera
CREATE OR REPLACE FUNCTION handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'pending' THEN
    -- Não bloqueia login, apenas marca para redirecionamento
    NEW.raw_user_meta_data = jsonb_set(
      NEW.raw_user_meta_data, 
      '{needs_approval}', 
      'true'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎨 Correções de UI/UX

### 1. Fonte Bíblica Inconsistente

**CSS Atual inconsistente**:

```css
/* src/index.css — Correção */
@layer base {
  html {
    @apply antialiased;
  }
  
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  /* Forçar fonte serif no texto bíblico */
  .bible-content {
    font-family: 'EB Garamond', 'Cormorant Garamond', Georgia, 'Times New Roman', serif !important;
  }
}

/* Garantir que fontes carreguem antes de renderizar */
.font-loading {
  opacity: 0;
}

.font-loaded {
  opacity: 1;
  transition: opacity 0.3s ease;
}
```

**Precarregar fontes no index.html**:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="https://fonts.gstatic.com/s/ebgaramond/v27/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuLG-IXfpSdsWnSXemerGL0q6.woff2" as="font" type="font/woff2" crossorigin>
```

### 2. Scroll Jump (Pulo do Scroll)

**Problema**: Ao trocar de capítulo, o scroll não volta ao topo.

```typescript
// src/hooks/useScrollToTop.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
};

// Usar no ChapterReader
const ChapterReader = () => {
  const { book, chapter } = useParams();
  useScrollToTop();
  // ...
};
```

### 3. Seleção de Versículos Não Persiste

```typescript
// src/stores/annotationStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AnnotationState {
  highlights: Record<string, { color: string; timestamp: number }>;
  notes: Record<string, { content: string; timestamp: number }>;
  
  addHighlight: (verseId: string, color: string) => void;
  removeHighlight: (verseId: string) => void;
  addNote: (verseId: string, content: string) => void;
  getVerseAnnotations: (verseId: string) => {
    highlight?: { color: string };
    note?: { content: string };
  };
}

export const useAnnotationStore = create<AnnotationState>()(
  persist(
    (set, get) => ({
      highlights: {},
      notes: {},
      
      addHighlight: (verseId, color) => set((state) => ({
        highlights: {
          ...state.highlights,
          [verseId]: { color, timestamp: Date.now() }
        }
      })),
      
      removeHighlight: (verseId) => set((state) => {
        const { [verseId]: _, ...rest } = state.highlights;
        return { highlights: rest };
      }),
      
      addNote: (verseId, content) => set((state) => ({
        notes: {
          ...state.notes,
          [verseId]: { content, timestamp: Date.now() }
        }
      })),
      
      getVerseAnnotations: (verseId) => ({
        highlight: get().highlights[verseId],
        note: get().notes[verseId],
      }),
    }),
    {
      name: 'biblealpha-annotations',
    }
  )
);
```

---

## 🗄️ Correções de Banco de Dados

### 1. Índices Faltando

```sql
-- Performance: Índices críticos faltando
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verses_book_chapter 
  ON verses(book_id, chapter_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verses_number 
  ON verses(chapter_number, verse_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crossrefs_source 
  ON verse_cross_reference_edges(source_verse_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crossrefs_target 
  ON verse_cross_reference_edges(target_verse_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commentaries_verse 
  ON theologian_commentaries(book_id, chapter_number, verse_number);

-- Busca full-text
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verses_text_search 
  ON verses USING gin(to_tsvector('portuguese', text));
```

### 2. Cache de Capítulos

```sql
-- Tabela para cache de capítulos renderizados
CREATE TABLE IF NOT EXISTS chapter_cache (
  book_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  html_content TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (book_id, chapter_number, version)
);

-- Limpar cache antigo periodicamente
CREATE OR REPLACE FUNCTION cleanup_old_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM chapter_cache 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Agendar com pg_cron
SELECT cron.schedule('cleanup-cache', '0 0 * * *', 'SELECT cleanup_old_cache()');
```

---

## ⚡ Correções de Performance

### 1. Virtualização da Lista de Versículos

**Problema**: Capítulos grandes (Salmos 119) travam o browser.

```typescript
// src/components/bible/VirtualizedChapter.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export const VirtualizedChapter = ({ verses }: { verses: Verse[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: verses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // altura estimada de cada versículo
    overscan: 3, // renderizar 3 itens além da viewport
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const verse = verses[virtualItem.index];
          return (
            <div
              key={verse.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <VerseDisplay verse={verse} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

### 2. Debounce na Busca

```typescript
// src/hooks/useDebouncedSearch.ts
import { useState, useEffect } from 'react';

export const useDebouncedSearch = (delay = 300) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [query, delay]);
  
  return { query, setQuery, debouncedQuery };
};

// Uso
const SearchBox = () => {
  const { query, setQuery, debouncedQuery } = useDebouncedSearch(500);
  
  const { data: results } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchVerses(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });
  
  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Buscar na Bíblia..."
    />
  );
};
```

### 3. Preload do Próximo Capítulo

```typescript
// src/hooks/usePrefetchChapter.ts
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const usePrefetchChapter = (currentBook: string, currentChapter: number) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const nextChapter = currentChapter + 1;
    const nextKey = ['chapter', currentBook, nextChapter];
    
    // Prefetch apenas se não estiver em cache
    if (!queryClient.getQueryData(nextKey)) {
      queryClient.prefetchQuery({
        queryKey: nextKey,
        queryFn: () => fetchChapter(currentBook, nextChapter),
        staleTime: 1000 * 60 * 5, // 5 minutos
      });
    }
  }, [currentBook, currentChapter, queryClient]);
};
```

---

## 🛡️ Correções de Segurança

### 1. Sanitização de Conteúdo

```typescript
// src/lib/sanitize.ts
import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'sup', 'sub'],
    ALLOWED_ATTR: [],
  });
};

// Usar sempre antes de renderizar notas/comentários
const CommentaryDisplay = ({ html }: { html: string }) => {
  const sanitized = sanitizeHtml(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
```

### 2. Rate Limiting na API

```sql
-- Supabase: Rate limiting por usuário
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION check_rate_limit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM auth.audit_log_entries
  WHERE created_at > NOW() - INTERVAL '1 minute'
    AND actor_id = user_id;
    
  RETURN request_count < 100; -- 100 requests por minuto
END;
$$ LANGUAGE plpgsql;
```

---

## 📱 Correções de Mobile

### 1. Touch Events para Painéis

```typescript
// src/hooks/useSwipe.ts
import { useRef, useCallback } from 'react';

export const useSwipe = (onSwipeLeft: () => void, onSwipeRight: () => void) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);
  
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    
    const diffX = touchStart.current.x - endX;
    const diffY = touchStart.current.y - endY;
    
    // Só considerar swipe horizontal
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
    
    touchStart.current = null;
  }, [onSwipeLeft, onSwipeRight]);
  
  return { onTouchStart, onTouchEnd };
};

// Uso no leitor
const ChapterReader = () => {
  const { nextChapter, previousChapter } = useBibleStore();
  const swipeHandlers = useSwipe(nextChapter, previousChapter);
  
  return (
    <div className="touch-pan-y" {...swipeHandlers}>
      {/* ... */}
    </div>
  );
};
```

### 2. Bottom Sheet para Painéis Mobile

```typescript
// src/components/layout/MobilePanels.tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const MobilePanels = () => {
  return (
    <>
      {/* Bottom bar fixa no mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-2 flex justify-around">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <BookOpen className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw]">
            <BookTree />
          </SheetContent>
        </Sheet>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <PanelRight className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw]">
            <CommentaryPanel />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
```

---

## ✅ Checklist de Correções

### Prioridade 1 (Imediato)
- [ ] Corrigir redirecionamento do site principal
- [ ] Adicionar timeout em loading states
- [ ] Criar índices no banco de dados
- [ ] Implementar virtualização

### Prioridade 2 (Esta semana)
- [ ] Corrigir persistência de destaques
- [ ] Adicionar error boundaries
- [ ] Implementar debounce na busca
- [ ] Corrigir scroll jump

### Prioridade 3 (Próxima semana)
- [ ] Optimizar queries do Supabase
- [ ] Adicionar cache de capítulos
- [ ] Melhorar experiência mobile
- [ ] Implementar sanitização

---

**Notas**: Estas correções devem ser aplicadas ANTES de iniciar a modernização do layout, para garantir uma base estável.
