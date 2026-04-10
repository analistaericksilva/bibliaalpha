# Bíblia Alpha — Stack de Inteligência (66 Livros)

Este diretório contém o pipeline de dados para:

- catálogo de recursos bíblicos
- referências cruzadas
- camada linguística MACULA (hebraico/greco)

## Scripts disponíveis

### 1) Catálogo de recursos
```bash
node scripts/bible-intelligence/build-resource-manifest.mjs
```
Saída: `data/bible-intelligence/resource-manifest.json`

### 2) Referências cruzadas (JSON -> CSV/SQL)
```bash
node scripts/bible-intelligence/import-crossrefs-json.mjs <caminho-do-repo-bible-cross-reference-json>
```
Saídas:
- `data/bible-intelligence/crossrefs/verse-cross-reference-edges.csv`
- `data/bible-intelligence/crossrefs/verse-cross-reference-edges.sql`

### 3) Camada linguística MACULA
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

## Ordem recomendada
1. Aplicar migration `20260406090000_bible_intelligence_stack.sql`
2. Rodar `build-resource-manifest.mjs`
3. Rodar `import-crossrefs-json.mjs`
4. Rodar `import-macula-tsv.mjs`
5. Importar os CSVs/SQL no Supabase
