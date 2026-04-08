# Integração de Traduções — fonte `MaatheusGois/bible`

## Objetivo
Adicionar o maior número de traduções ao projeto sem importação massiva no banco.

## Método adotado (eficiente)
A integração foi feita por **endpoint direto** (sem baixar o repositório inteiro) com carregamento sob demanda e cache local.

### Endpoints usados
- Índice de idiomas/versões:
  - `sumary/index.json`
- Livro completo por tradução:
  - `versions/{language}/{version}/{book}/{book}.json`

### Espelhos configurados (failover automático)
1. `https://cdn.jsdelivr.net/gh/maatheusgois/bible@main`
2. `https://raw.githubusercontent.com/maatheusgois/bible/main`

Se um endpoint falhar, o serviço tenta o próximo automaticamente.

## Estratégia de performance
1. Carrega somente o índice (`sumary/index.json`).
2. Usuário escolhe a tradução no Reader.
3. Carrega apenas o livro atual da tradução selecionada.
4. Extrai o capítulo em memória.
5. Cache por sessão (`translation+book`) + cache do índice em `localStorage` (24h).

Resultado: suporte a várias traduções sem ingestão pesada no Supabase.

## Cobertura de traduções
- Idiomas detectados no índice: **14**
- Versões disponíveis: **21**
- Inclui múltiplas versões em português (`aa`, `acf`, `nvi`, `arc`, `kjv`) e versões internacionais.

## Arquivos implementados/ajustados
- `src/services/githubBibleService.ts`
  - Carregamento de versões
  - Mapeamento completo de livros internos ↔ IDs da fonte externa
  - Leitura de capítulo por tradução
  - Fallback automático entre espelhos
  - Rótulos de idiomas em português

- `src/pages/Reader.tsx`
  - Seletor de tradução no topo do Reader
  - Exibição da tradução ativa
  - Fallback para `bible_verses` local quando a fonte externa falhar

## Comentários da Bíblia Alpha em português
A tradução automática foi aplicada para priorizar conteúdo em português quando o texto de comentários estiver em inglês.

Componentes com cobertura de tradução:
- `CommentsSidebar.tsx`
- `RightPanel.tsx`
- `StudyNotesPanel.tsx`
- `VerseCommentPopup.tsx`
- `InlineStudyNotes.tsx`
- `MedievalTheologiansPanel.tsx`
- `VerseIntelligencePanel.tsx`
- `DictionaryPanel.tsx`
- `TranslatableText.tsx` (heurística de detecção + opção `forceTranslate`)

## Observação de consistência
A fonte externa usa IDs diferentes em alguns livros (ex.: `jud`, `1kgs`, `act`, `eph`, etc.).
O mapeamento completo foi mantido para compatibilidade com os IDs internos da Bíblia Alpha.
