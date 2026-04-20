#!/usr/bin/env bash
# ============================================================
# deploy.sh — Deploy manual completo: Build + Firestore Rules + Hosting
# Uso: bash scripts/deploy.sh
# Requisitos: node, npm, firebase-tools (npm i -g firebase-tools), python3
# ============================================================
set -e

PROJECT_ID="sentinela-ai-489015"
SA_FILE="${FIREBASE_SA_FILE:-/tmp/sa.json}"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     DEPLOY MANUAL — Biblia Alpha          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Build ───────────────────────────────────────────────
echo "▶ [1/3] Build da aplicação..."
npm ci --silent
npm run build
echo "   ✔ Build concluído — dist/ gerado."

# ── 2. Firestore Rules ─────────────────────────────────────
echo ""
echo "▶ [2/3] Deploy das Firestore Security Rules..."

if [ ! -f "$SA_FILE" ]; then
  echo "   ⚠  Service Account não encontrado em: $SA_FILE"
  echo "   Defina FIREBASE_SA_FILE=caminho/sa.json e rode novamente."
  echo "   Pulando Firestore Rules..."
else
  pip install requests google-auth --quiet 2>/dev/null
  python3 scripts/deploy_firestore_rules.py
  echo "   ✔ Firestore Rules deployadas."
fi

# ── 3. Firebase Hosting ────────────────────────────────────
echo ""
echo "▶ [3/3] Deploy para Firebase Hosting..."

if [ -f "$SA_FILE" ]; then
  export GOOGLE_APPLICATION_CREDENTIALS="$SA_FILE"
fi

firebase deploy --only hosting --project "$PROJECT_ID"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✔ Deploy concluído!                      ║"
echo "║  Site: https://bibliaalpha.org            ║"
echo "╚══════════════════════════════════════════╝"
echo ""
