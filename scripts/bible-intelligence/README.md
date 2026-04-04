# Bíblia Alpha — Stack de Inteligência (66 Livros)

Este diretório implementa o upgrade pedido para integrar:

- `awesome-bible-developer-resources` (hub principal)
- `awesome-bible-data` (cross refs, corpora, patrística, dicionários)
- `macula-hebrew` (morfologia + sintaxe + semântica OT)
- `macula-greek` (morfologia + sintaxe + semântica NT)

## Scripts

### 1) Catalogar recursos dos hubs

```bash
node scripts/bible-intelligence/build-resource-manifest.mjs
```

Saída: `data/bible-intelligence/resource-manifest.json`

---

### 2) Preparar referências cruzadas em formato relacional

```bash
node scripts/bible-intelligence/import-crossrefs-json.mjs <caminho-do-repo-bible-cross-reference-json>
```

Exemplo:

```bash
node scripts/bible-intelligence/import-crossrefs-json.mjs ../crossrefs-json
```

Saídas:

- `data/bible-intelligence/crossrefs/verse-cross-reference-edges.csv`
- `data/bible-intelligence/crossrefs/verse-cross-reference-edges.sql`

---

### 3) Preparar camada linguística MACULA

Por padrão, o script busca os TSVs em:

- `datasets/macula-hebrew/WLC/tsv/macula-hebrew.tsv`
- `datasets/macula-greek/Nestle1904/tsv/macula-greek-Nestle1904.tsv`
- `datasets/macula-greek/SBLGNT/tsv/macula-greek-SBLGNT.tsv`

```bash
node scripts/bible-intelligence/import-macula-tsv.mjs \
  --hebrew ../macula-hebrew/WLC/tsv/macula-hebrew.tsv \
  --greek-nestle ../macula-greek/Nestle1904/tsv/macula-greek-Nestle1904.tsv \
  --greek-sbl ../macula-greek/SBLGNT/tsv/macula-greek-SBLGNT.tsv
```

Saídas:

- `data/bible-intelligence/macula/macula-word-features.csv`
- `data/bible-intelligence/macula/macula-syntactic-relations.csv`
- `data/bible-intelligence/macula/macula-import.sql`

---

### 4) Ingerir comentário completo de Matthew Henry (CCEL)

```bash
node scripts/bible-intelligence/import-matthew-henry-ccel.mjs
```

Opções úteis:

```bash
# Limitar para teste rápido
node scripts/bible-intelligence/import-matthew-henry-ccel.mjs --book-limit 2 --page-limit-per-book 3

# Gerar somente para um livro interno (ex: mt)
node scripts/bible-intelligence/import-matthew-henry-ccel.mjs --book-id mt
```

Saídas:

- `data/bible-intelligence/matthew-henry/matthew-henry-normalized.json`
- `data/bible-intelligence/matthew-henry/matthew-henry-upsert.sql`
- `data/bible-intelligence/matthew-henry/matthew-henry-warnings.log`

Pipeline aplicado:

- **CCEL HTML** → crawler
- **Parser/normalizador** → mapeamento por livro/capítulo/versículo
- **Sem duplicações** → dedupe por `source_item_id` e hash de conteúdo
- **Banco de dados** → UPSERT em `public.verse_commentary_sources`
- **API interna** → consumo automático pela `verse-intelligence` via `get_verse_super_insights`

---

## Ordem recomendada de execução

1. Aplicar migration `20260406090000_bible_intelligence_stack.sql`
2. Aplicar migration `20260406103000_matthew_henry_ccel_pipeline.sql`
3. Rodar `build-resource-manifest.mjs`
4. Rodar `import-crossrefs-json.mjs`
5. Rodar `import-macula-tsv.mjs`
6. Rodar `import-matthew-henry-ccel.mjs`
7. Importar os CSVs/SQL no Supabase

Com isso, o painel **Inteligência Bíblica 66X** passa a ter dados ricos para todos os livros (conforme cobertura do dataset importado), incluindo o acervo completo de Matthew Henry direcionado por versículo.
