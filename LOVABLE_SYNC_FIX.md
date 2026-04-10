# Correção de Sincronização Lovable + Supabase

## Problema
Notas geradas pela IA do Lovable não podiam ser excluídas pelos usuários devido às políticas RLS (Row Level Security) do Supabase que bloqueavam a exclusão para não-admins.

## Solução Implementada

### 1. Nova Migration: `supabase/migrations/20260410_030000_fix_study_notes_rls_and_cleanup.sql`

Esta migration:
- Adiciona coluna `created_by` para rastrear notas criadas por usuários
- **Corrige as políticas RLS** para permitir que usuários autenticados excluam notas da IA
- **Protege notas de teólogos históricos** (Martinho Lutero, João Calvino, etc.)
- Remove imediatamente notas genéricas da IA que ainda existem no banco
- Remove duplicatas de notas da IA

### 2. Nova Edge Function: `supabase/functions/delete-ai-note/`

Função serverless para exclusão segura de notas via API.

---

## Como Aplicar

### Passo 1: Executar a Migration no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione o projeto `qjvhkdmxplvbcymrrybf`
3. Vá em **SQL Editor**
4. Copie o conteúdo de `supabase/migrations/20260410_030000_fix_study_notes_rls_and_cleanup.sql`
5. Execute o SQL

### Passo 2: Deploy da Edge Function (Opcional)

Se quiser usar a API para exclusão:

```bash
cd supabase
supabase functions deploy delete-ai-note
```

### Passo 3: Commit no GitHub

```bash
git add .
git commit -m "fix: corrige RLS para permitir exclusão de notas da IA do Lovable"
git push origin main
```

---

## Políticas de Segurança结果

| Tipo de Nota | Pode Ler | Pode Editar | Pode Excluir |
|--------------|----------|-------------|---------------|
| Notas de teólogos históricos | ✓ | ✗ | ✗ |
| Notas geradas pela IA | ✓ | ✓ | ✓ |
| Notas criadas pelo usuário | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ |

---

## Notas Excluídas Automaticamente

A migration remove notas com estes padrões:
- `title ILIKE 'Commentary on %'`
- `content ILIKE '%offers profound insight%'`
- `content ILIKE '%theological depth reveals%'`
- `content ILIKE '%Scripture speaks with authority%'`
- Conteúdo genérico sem fonte definida

## Prevenção Futura

O problema **não vai se repetir** porque:
1. Notas da IA agora são identificáveis (sem source definido)
2. Políticas RLS permitem exclusão de notas não-curadas
3. Sistema protege automaticamente notas de teólogos históricos
