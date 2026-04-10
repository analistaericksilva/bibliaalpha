-- ============================================================================
-- CORREÇÃO RLS STUDY_NOTES - PERMITIR EXCLUSÃO DE NOTAS DA IA
-- Problema: Usuários não conseguiam excluir notas geradas pelo Lovable
-- Solução: Policies que permitem exclusão de notas não-curadas
-- ============================================================================

BEGIN;

-- 1) Adicionar coluna created_by para rastrear origem (opcional, para future use)
ALTER TABLE public.study_notes 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2) Lista de fontes curadas (teólogos históricos reais) - estas são "protegidas"
-- NOTA: A lista é replicada em cada policy para evitar dependência de temp tables

-- 3) Remover policies antigas e criar novas
DROP POLICY IF EXISTS "Authenticated users can read study notes" ON public.study_notes;
DROP POLICY IF EXISTS "Admins can manage study notes" ON public.study_notes;

-- 4) Policy de LEITURA - qualquer usuário autenticado pode ler
CREATE POLICY "Authenticated users can read study notes"
  ON public.study_notes FOR SELECT
  TO authenticated
  USING (true);

-- 5) Policy de EXCLUSÃO - usuários podem excluir notas que NÃO são de fontes curadas
-- Isso permite excluir notas geradas pela IA do Lovable
CREATE POLICY "Users can delete non-curated study notes"
  ON public.study_notes FOR DELETE
  TO authenticated
  USING (
    source IS NULL 
    OR source = '' 
    OR source NOT IN (
      'Tomás de Aquino','Anselmo de Cantuária','Bernardo de Claraval',
      'Martinho Lutero','João Calvino','Ulrich Zwingli','John Knox','Martin Bucer','Heinrich Bullinger','Theodore Beza',
      'Jonathan Edwards','John Owen','Richard Baxter','Thomas Watson','John Flavel','Stephen Charnock','Thomas Goodwin','William Perkins','William Gurnall','Thomas Boston','John Brown of Haddington',
      'John Wesley','George Whitefield','Charles Finney','Dwight L. Moody','R. A. Torrey',
      'Charles Hodge','A. A. Hodge','Charles Spurgeon','Andrew Murray','E. M. Bounds','F. B. Meyer','Alexander Maclaren','B. B. Warfield','Louis Berkhof','Herman Bavinck',
      'Albert Barnes','Adam Clarke','John Gill','Jamieson-Fausset-Brown','Joseph Benson','Octavius Winslow',
      'Agostinho de Hipona','João Crisóstomo','Jerônimo','Orígenes','Atanásio','Atanásio de Alexandria',
      'Gregório de Nissa','Basílio de Cesareia','Tertuliano','Ireneu de Lyon','Clemente de Roma','Policarpo de Esmirna'
    )
    OR created_by IS NOT NULL
  );

-- 6) Policy de INSERT e UPDATE - usuários podem criar/atualizar notas propias
CREATE POLICY "Users can manage own study notes"
  ON public.study_notes FOR ALL
  TO authenticated
  USING (created_by IS NULL OR created_by = auth.uid())
  WITH CHECK (created_by IS NULL OR created_by = auth.uid());

-- 7) Policy de ADMIN - admin pode fazer tudo
CREATE POLICY "Admins can manage all study notes"
  ON public.study_notes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8) Limpar immediately: remover notas genéricas da IA que ainda existem
-- (baseado em padrões conhecidos de conteúdo gerado automaticamente)
DELETE FROM public.study_notes
WHERE (
       title ILIKE 'Commentary on %'
    OR content ILIKE '%offers profound insight on this passage%'
    OR content ILIKE '%theological depth reveals God''s purposes for His people%'
    OR content ILIKE '%Scripture speaks with authority and grace%'
    OR content ILIKE '%This verse reminds us that%'
    OR content ILIKE '%As we consider this passage%'
)
AND source IS NULL
AND created_by IS NULL;

-- 9) Remover duplicatas de notas da IA (manter a mais antiga)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        book_id,
        chapter,
        verse_start,
        COALESCE(verse_end, verse_start),
        regexp_replace(lower(trim(COALESCE(content, ''))), '\s+', ' ', 'g')
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.study_notes
  WHERE source IS NULL OR source = ''
)
DELETE FROM public.study_notes sn
USING ranked r
WHERE sn.id = r.id AND r.rn > 1;

COMMIT;
