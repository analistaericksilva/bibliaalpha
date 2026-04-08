# Integração de Traduções — fonte `MaatheusGois/bible`

## Objetivo
Adicionar o maior número de traduções ao projeto sem importar datasets gigantes no banco.

## Método adotado (eficiente)
Em vez de baixar todas as versões para o Supabase, a leitura foi integrada por **endpoint direto no GitHub Raw** com carregamento sob demanda:

- Índice de versões:
  - `https://raw.githubusercontent.com/maatheusgois/bible/main/sumary/index.json`
- Livro completo (por tradução):
  - `https://raw.githubusercontent.com/maatheusgois/bible/main/versions/{language}/{version}/{book}/{book}.json`

### Estratégia de performance
1. Carrega apenas o **índice** de versões (`sumary/index.json`).
2. Usuário escolhe a tradução no Reader.
3. Carrega apenas o **livro atual** (não a Bíblia inteira).
4. Extrai o capítulo do livro em memória.
5. Cache em memória por sessão (`translation+book`) + cache do índice em `localStorage` (24h).

Com isso, evitamos baixar todos os dados de uma vez e ainda liberamos múltiplas traduções imediatamente.

## Arquivos implementados
- `src/services/githubBibleService.ts`
  - Busca versões
  - Mapeia IDs de livros internos ↔ IDs da fonte externa
  - Busca capítulo por tradução/livro
- `src/pages/Reader.tsx`
  - Seletor de tradução no topo do Reader
  - Exibição da tradução ativa
  - Fallback automático para base local (`bible_verses`) se a fonte externa falhar

## Comentários em português (tradução automática)
A camada `TranslatableText` foi aplicada nos painéis de comentários para traduzir conteúdo em inglês no momento da leitura (sem migração pesada de banco):

- `CommentsSidebar.tsx`
- `RightPanel.tsx`
- `MedievalTheologiansPanel.tsx`
- `VerseIntelligencePanel.tsx`
- `DictionaryPanel.tsx`
- ajustes em `TranslatableText.tsx` para modo silencioso em listas

## Observação de consistência
A fonte externa usa IDs bíblicos diferentes em alguns livros (ex.: `jud`, `1kgs`, `act`, `eph`, etc.).
Foi implementado mapeamento completo para compatibilidade com os IDs internos da Bíblia Alpha.
