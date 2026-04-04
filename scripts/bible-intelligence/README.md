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

## Ordem recomendada de execução

1. Aplicar migration `20260406090000_bible_intelligence_stack.sql`
2. Rodar `build-resource-manifest.mjs`
3. Rodar `import-crossrefs-json.mjs`
4. Rodar `import-macula-tsv.mjs`
5. Importar os CSVs/SQL no Supabase

Com isso, o painel **Inteligência Bíblica 66X** passa a ter dados ricos para todos os livros (conforme cobertura do dataset importado).
