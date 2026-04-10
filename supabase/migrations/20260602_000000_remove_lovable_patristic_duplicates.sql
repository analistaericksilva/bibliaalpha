-- ============================================================================
-- REMOÇÃO DE COMENTÁRIOS DUPLICADOS (LOVABLE) - PAIS DA IGREJA
-- Objetivo: remover comentários genéricos/duplicados gerados automaticamente
-- sem alterar estrutura do projeto.
-- ============================================================================

BEGIN;

-- 1) Remove placeholders genéricos que vieram em lotes antigos (formato Lovable)
DELETE FROM public.study_notes
WHERE COALESCE(source, '') IN (
  'Agostinho de Hipona',
  'João Crisóstomo',
  'Jerônimo',
  'Orígenes',
  'Atanásio',
  'Atanásio de Alexandria',
  'Gregório de Nissa',
  'Basílio de Cesareia',
  'Tertuliano'
)
AND (
     title ILIKE 'Commentary on %'
  OR content ILIKE '%offers profound insight on this passage%'
  OR content ILIKE '%theological depth reveals God''s purposes for His people%'
  OR content ILIKE '%Scripture speaks with authority and grace%'
);

-- 2) Remove duplicidades reais para Pais da Igreja (mantém a mais antiga)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        book_id,
        chapter,
        verse_start,
        COALESCE(verse_end, verse_start),
        COALESCE(source, ''),
        COALESCE(note_type, ''),
        regexp_replace(lower(trim(COALESCE(content, ''))), '\s+', ' ', 'g')
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.study_notes
  WHERE COALESCE(source, '') IN (
    'Agostinho de Hipona',
    'João Crisóstomo',
    'Jerônimo',
    'Orígenes',
    'Atanásio',
    'Atanásio de Alexandria',
    'Gregório de Nissa',
    'Basílio de Cesareia',
    'Tertuliano'
  )
)
DELETE FROM public.study_notes sn
USING ranked r
WHERE sn.id = r.id
  AND r.rn > 1;

COMMIT;
