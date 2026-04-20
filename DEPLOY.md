# Deploy Manual — Biblia Alpha

Este projeto usa **deploy manual via CLI** (sem GitHub Actions).

## Pré-requisitos

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Autenticar (uma vez)
firebase login
```

## Deploy completo (build + Firestore Rules + Hosting)

```bash
bash scripts/deploy.sh
```

## Com Service Account (não interativo)

```bash
# Coloque o JSON da Service Account em /tmp/sa.json
# ou defina a variável:
export FIREBASE_SA_FILE=/caminho/para/sa.json

bash scripts/deploy.sh
```

## Só Hosting (sem Firestore Rules)

```bash
npm run build
firebase deploy --only hosting --project sentinela-ai-489015
```

## Só Firestore Rules

```bash
export FIREBASE_SA_FILE=/caminho/para/sa.json
python3 scripts/deploy_firestore_rules.py
```

## Fluxo de trabalho recomendado

1. Faça suas alterações no código
2. Commit e push para `main` (somente versionamento — sem deploy automático)
3. Quando pronto para publicar: `bash scripts/deploy.sh`
