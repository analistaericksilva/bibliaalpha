param(
  [ValidateSet('full','test')]
  [string]$Mode = 'full'
)

$ErrorActionPreference = 'Stop'

$args = '--out-dir data/bible-intelligence/matthew-henry'
if ($Mode -eq 'test') {
  $args = "$args --book-limit 3 --page-limit-per-book 3"
}

Write-Host '[1/2] Gerando bundle Matthew Henry (CCEL)...'
node scripts/bible-intelligence/import-matthew-henry-ccel.mjs $args

if (-not $env:SUPABASE_DB_URL) {
  Write-Host '[2/2] SUPABASE_DB_URL não definido.'
  Write-Host '      Bundle gerado em data/bible-intelligence/matthew-henry/'
  Write-Host '      Para ativar no banco, defina SUPABASE_DB_URL e execute novamente.'
  exit 0
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  Write-Error 'psql não encontrado. Instale PostgreSQL client e execute novamente.'
}

Write-Host '[2/2] Aplicando migrations + import no Supabase...'
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260406090000_bible_intelligence_stack.sql
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260406103000_matthew_henry_ccel_pipeline.sql
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f data/bible-intelligence/matthew-henry/matthew-henry-upsert.sql

Write-Host '✅ Ativação concluída.'
