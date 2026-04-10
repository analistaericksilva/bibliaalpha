-- ============================================================================
-- BIBLIA ALPHA - PURGA FINAL DE MATTHEW HENRY
-- Data: 2025-01-09 (Timestamp Unix para ordenação: 20260409)
-- Objetivo: Remover COMPLETAMENTE todos os comentários de Matthew Henry
-- AUTOR: BrowserOS - Upgrade Teológico
-- ============================================================================
-- ESTE ARQUIVO DEVE SER EXECUTADO APÓS TODAS AS MIGRAÇÕES ANTERIORES
-- Remove Matthew Henry de: study_notes, bible_footnotes, e outras tabelas
-- ============================================================================

BEGIN;

-- =============================================================================
-- PASSO 1: REMOVER DE public.study_notes (tabela principal)
-- =============================================================================
DELETE FROM public.study_notes 
WHERE source = 'Matthew Henry' 
   OR source ILIKE '%Matthew Henry%'
   OR source ILIKE '%Henry%'
   OR title = 'Matthew Henry'
   OR title ILIKE '%Matthew Henry%'
   OR content ILIKE '%Matthew Henry%'
   OR author = 'Matthew Henry'
   OR author ILIKE '%Matthew Henry%';

-- =============================================================================
-- PASSO 2: REMOVER DE public.bible_footnotes (notas de rodapé)
-- =============================================================================
DELETE FROM public.bible_footnotes 
WHERE source = 'Matthew Henry' 
   OR source ILIKE '%Matthew Henry%';

-- =============================================================================
-- PASSO 3: REMOVER QUALQUER REFERÊNCIA RESTANTE EM OUTRAS TABELAS
-- =============================================================================
-- Remover de chapter_headings se houver
DELETE FROM public.chapter_headings 
WHERE source = 'Matthew Henry' 
   OR source ILIKE '%Matthew Henry%';

-- Remover de any other commentary tables (dynamic check)
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name IN ('source', 'author', 'commentator')
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DELETE FROM public.%I WHERE source = %L OR source ILIKE %L OR author = %L OR author ILIKE %L', 
                      table_record.table_name, 'Matthew Henry', '%Matthew Henry%', 'Matthew Henry', '%Matthew Henry%');
    END LOOP;
END $$;

-- =============================================================================
-- PASSO 4: VERIFICAÇÃO E LOG
-- =============================================================================
-- Contar registros restantes (deve ser 0)
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count 
    FROM public.study_notes 
    WHERE source ILIKE '%Henry%' OR source = 'Matthew Henry';
    
    IF remaining_count > 0 THEN
        RAISE NOTICE 'ATENCAO: Ainda existem % registros de Matthew Henry!', remaining_count;
    ELSE
        RAISE NOTICE 'SUCESSO: Todos os comentarios de Matthew Henry foram removidos.';
    END IF;
END $$;

COMMIT;

-- Mensagem final
SELECT 'PURGA DE MATTHEW HENRY CONCLUIDA' AS status;
