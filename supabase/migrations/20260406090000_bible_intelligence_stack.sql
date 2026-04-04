-- Bíblia Alpha: camada avançada de inteligência para os 66 livros
-- Integra datasets de referência (awesome-bible-developer-resources, macula-hebrew,
-- macula-greek e awesome-bible-data) em uma estrutura unificada.

-- 1) Catálogo de datasets e proveniência
CREATE TABLE IF NOT EXISTS public.bible_dataset_sources (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  repository_url text NOT NULL,
  license text,
  priority integer NOT NULL DEFAULT 100,
  enabled boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.bible_dataset_sources (id, name, category, repository_url, license, priority, enabled, notes)
VALUES
  ('awesome-bible-developer-resources', 'Awesome Bible Developer Resources', 'hub', 'https://github.com/biblenerd/awesome-bible-developer-resources', 'CC0-1.0', 10, true, 'Hub principal para descoberta de recursos bíblicos abertos'),
  ('awesome-bible-data', 'Awesome Bible Data', 'hub', 'https://github.com/jcuenod/awesome-bible-data', 'MIT', 20, true, 'Índice de datasets com ênfase em referências cruzadas e corpora'),
  ('macula-hebrew', 'Macula Hebrew', 'linguistica', 'https://github.com/Clear-Bible/macula-hebrew', 'CC BY 4.0', 30, true, 'Morfologia, sintaxe e semântica do hebraico bíblico'),
  ('macula-greek', 'Macula Greek', 'linguistica', 'https://github.com/Clear-Bible/macula-greek', 'CC BY 4.0', 40, true, 'Morfologia, sintaxe e semântica do grego do NT'),
  ('bible-cross-reference-json', 'Bible Cross Reference JSON', 'cross-reference', 'https://github.com/josephilipraja/bible-cross-reference-json', 'Apache-2.0', 50, true, 'Base extensa de referências cruzadas por versículo')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  repository_url = EXCLUDED.repository_url,
  license = EXCLUDED.license,
  priority = EXCLUDED.priority,
  enabled = EXCLUDED.enabled,
  notes = EXCLUDED.notes;

ALTER TABLE public.bible_dataset_sources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bible_dataset_sources' AND policyname = 'Authenticated users can read dataset sources'
  ) THEN
    CREATE POLICY "Authenticated users can read dataset sources"
      ON public.bible_dataset_sources FOR SELECT
      TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bible_dataset_sources' AND policyname = 'Admins can manage dataset sources'
  ) THEN
    CREATE POLICY "Admins can manage dataset sources"
      ON public.bible_dataset_sources FOR ALL
      TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END
$$;

-- 2) Referências cruzadas em formato relacional (escalável)
CREATE TABLE IF NOT EXISTS public.verse_cross_reference_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_book_id text NOT NULL,
  source_chapter integer NOT NULL,
  source_verse integer NOT NULL,
  target_book_id text NOT NULL,
  target_chapter integer NOT NULL,
  target_verse integer NOT NULL,
  source_dataset text NOT NULL DEFAULT 'bible-cross-reference-json',
  weight integer NOT NULL DEFAULT 1,
  confidence numeric(5,4),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (
    source_book_id,
    source_chapter,
    source_verse,
    target_book_id,
    target_chapter,
    target_verse,
    source_dataset
  )
);

CREATE INDEX IF NOT EXISTS idx_cross_edges_source
  ON public.verse_cross_reference_edges (source_book_id, source_chapter, source_verse);

CREATE INDEX IF NOT EXISTS idx_cross_edges_target
  ON public.verse_cross_reference_edges (target_book_id, target_chapter, target_verse);

CREATE INDEX IF NOT EXISTS idx_cross_edges_dataset
  ON public.verse_cross_reference_edges (source_dataset, weight DESC);

ALTER TABLE public.verse_cross_reference_edges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'verse_cross_reference_edges' AND policyname = 'Authenticated users can read cross reference edges'
  ) THEN
    CREATE POLICY "Authenticated users can read cross reference edges"
      ON public.verse_cross_reference_edges FOR SELECT
      TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'verse_cross_reference_edges' AND policyname = 'Admins can manage cross reference edges'
  ) THEN
    CREATE POLICY "Admins can manage cross reference edges"
      ON public.verse_cross_reference_edges FOR ALL
      TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END
$$;

-- 3) Camada linguística MACULA (palavra por palavra)
CREATE TABLE IF NOT EXISTS public.macula_word_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  token_index integer NOT NULL,
  language text NOT NULL CHECK (language IN ('hebrew', 'greek')),
  xml_id text,
  surface text NOT NULL,
  lemma text,
  transliteration text,
  strongs text,
  morphology text,
  pos text,
  semantic_role text,
  semantic_domain text,
  semantic_frame text,
  gloss text,
  contextual_gloss text,
  source_dataset text NOT NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, chapter, verse, token_index, language, source_dataset)
);

CREATE INDEX IF NOT EXISTS idx_macula_word_lookup
  ON public.macula_word_features (book_id, chapter, verse, token_index);

CREATE INDEX IF NOT EXISTS idx_macula_word_strongs
  ON public.macula_word_features (strongs);

CREATE INDEX IF NOT EXISTS idx_macula_word_language
  ON public.macula_word_features (language, book_id, chapter, verse);

ALTER TABLE public.macula_word_features ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'macula_word_features' AND policyname = 'Authenticated users can read macula word features'
  ) THEN
    CREATE POLICY "Authenticated users can read macula word features"
      ON public.macula_word_features FOR SELECT
      TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'macula_word_features' AND policyname = 'Admins can manage macula word features'
  ) THEN
    CREATE POLICY "Admins can manage macula word features"
      ON public.macula_word_features FOR ALL
      TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END
$$;

-- 4) Relações sintáticas/semânticas MACULA
CREATE TABLE IF NOT EXISTS public.macula_syntactic_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  language text NOT NULL CHECK (language IN ('hebrew', 'greek')),
  token_xml_id text,
  relation_type text,
  frame text,
  subject_ref text,
  participant_ref text,
  target_ref text,
  source_dataset text NOT NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_macula_rel_lookup
  ON public.macula_syntactic_relations (book_id, chapter, verse, language);

ALTER TABLE public.macula_syntactic_relations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'macula_syntactic_relations' AND policyname = 'Authenticated users can read macula syntactic relations'
  ) THEN
    CREATE POLICY "Authenticated users can read macula syntactic relations"
      ON public.macula_syntactic_relations FOR SELECT
      TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'macula_syntactic_relations' AND policyname = 'Admins can manage macula syntactic relations'
  ) THEN
    CREATE POLICY "Admins can manage macula syntactic relations"
      ON public.macula_syntactic_relations FOR ALL
      TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END
$$;

-- 5) Comentários/dicionários externos por versículo (normalizado)
CREATE TABLE IF NOT EXISTS public.verse_commentary_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL,
  chapter integer NOT NULL,
  verse_start integer NOT NULL,
  verse_end integer,
  title text,
  content text NOT NULL,
  author text,
  tradition text,
  tags text[] NOT NULL DEFAULT '{}',
  source_dataset text NOT NULL,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verse_commentary_lookup
  ON public.verse_commentary_sources (book_id, chapter, verse_start);

ALTER TABLE public.verse_commentary_sources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'verse_commentary_sources' AND policyname = 'Authenticated users can read verse commentary sources'
  ) THEN
    CREATE POLICY "Authenticated users can read verse commentary sources"
      ON public.verse_commentary_sources FOR SELECT
      TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'verse_commentary_sources' AND policyname = 'Admins can manage verse commentary sources'
  ) THEN
    CREATE POLICY "Admins can manage verse commentary sources"
      ON public.verse_commentary_sources FOR ALL
      TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END
$$;

-- 6) Cobertura por livro: visão para monitorar os 66 livros
CREATE OR REPLACE VIEW public.book_resource_coverage AS
SELECT
  v.book_id,
  max(v.book_name) AS book_name,
  count(DISTINCT (v.chapter, v.verse_number)) AS verses_total,
  count(DISTINCT CASE WHEN sn.id IS NOT NULL THEN (v.chapter, v.verse_number) END) AS verses_with_study_notes,
  count(DISTINCT CASE WHEN cr.id IS NOT NULL THEN (v.chapter, v.verse_number) END) AS verses_with_legacy_cross_refs,
  count(DISTINCT CASE WHEN cre.id IS NOT NULL THEN (v.chapter, v.verse_number) END) AS verses_with_graph_cross_refs,
  count(DISTINCT CASE WHEN mw.id IS NOT NULL THEN (v.chapter, v.verse_number) END) AS verses_with_macula,
  count(DISTINCT CASE WHEN vcs.id IS NOT NULL THEN (v.chapter, v.verse_number) END) AS verses_with_external_commentary,
  round(
    100.0 * count(DISTINCT CASE WHEN mw.id IS NOT NULL OR cre.id IS NOT NULL OR sn.id IS NOT NULL THEN (v.chapter, v.verse_number) END)
    / nullif(count(DISTINCT (v.chapter, v.verse_number)), 0),
    2
  ) AS enriched_coverage_percent
FROM public.bible_verses v
LEFT JOIN public.study_notes sn
  ON sn.book_id = v.book_id AND sn.chapter = v.chapter AND sn.verse_start = v.verse_number
LEFT JOIN public.bible_cross_references cr
  ON cr.book_id = v.book_id AND cr.chapter = v.chapter AND cr.verse = v.verse_number
LEFT JOIN public.verse_cross_reference_edges cre
  ON cre.source_book_id = v.book_id AND cre.source_chapter = v.chapter AND cre.source_verse = v.verse_number
LEFT JOIN public.macula_word_features mw
  ON mw.book_id = v.book_id AND mw.chapter = v.chapter AND mw.verse = v.verse_number
LEFT JOIN public.verse_commentary_sources vcs
  ON vcs.book_id = v.book_id AND vcs.chapter = v.chapter
  AND vcs.verse_start <= v.verse_number
  AND coalesce(vcs.verse_end, vcs.verse_start) >= v.verse_number
GROUP BY v.book_id;

-- 7) Função para entregar um pacote completo de insights por versículo
CREATE OR REPLACE FUNCTION public.get_verse_super_insights(
  p_book_id text,
  p_chapter integer,
  p_verse integer,
  p_cross_limit integer DEFAULT 40
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  v_result := jsonb_build_object(
    'reference', jsonb_build_object('book_id', p_book_id, 'chapter', p_chapter, 'verse', p_verse),
    'cross_references', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'book_id', x.target_book_id,
          'chapter', x.target_chapter,
          'verse', x.target_verse,
          'dataset', x.source_dataset,
          'weight', x.weight,
          'confidence', x.confidence
        )
      )
      FROM (
        SELECT *
        FROM public.verse_cross_reference_edges
        WHERE source_book_id = p_book_id
          AND source_chapter = p_chapter
          AND source_verse = p_verse
        ORDER BY weight DESC, target_book_id, target_chapter, target_verse
        LIMIT greatest(p_cross_limit, 1)
      ) x
    ), '[]'::jsonb),
    'legacy_cross_references', coalesce((
      SELECT to_jsonb(
        array_remove(
          array(
            SELECT trim(value)
            FROM unnest(string_to_array(refs, ';')) AS value
            WHERE trim(value) <> ''
          ),
          NULL
        )
      )
      FROM public.bible_cross_references
      WHERE book_id = p_book_id AND chapter = p_chapter AND verse = p_verse
      LIMIT 1
    ), '[]'::jsonb),
    'study_notes', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'title', s.title,
          'content', s.content,
          'source', s.source,
          'note_type', s.note_type,
          'verse_start', s.verse_start,
          'verse_end', s.verse_end
        )
        ORDER BY s.verse_start
      )
      FROM public.study_notes s
      WHERE s.book_id = p_book_id
        AND s.chapter = p_chapter
        AND s.verse_start <= p_verse
        AND coalesce(s.verse_end, s.verse_start) >= p_verse
    ), '[]'::jsonb),
    'external_commentary', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'content', c.content,
          'author', c.author,
          'tradition', c.tradition,
          'tags', c.tags,
          'source_dataset', c.source_dataset,
          'source_url', c.source_url,
          'verse_start', c.verse_start,
          'verse_end', c.verse_end
        )
        ORDER BY c.verse_start
      )
      FROM public.verse_commentary_sources c
      WHERE c.book_id = p_book_id
        AND c.chapter = p_chapter
        AND c.verse_start <= p_verse
        AND coalesce(c.verse_end, c.verse_start) >= p_verse
    ), '[]'::jsonb),
    'macula_words', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'token_index', w.token_index,
          'language', w.language,
          'surface', w.surface,
          'lemma', w.lemma,
          'transliteration', w.transliteration,
          'strongs', w.strongs,
          'morphology', w.morphology,
          'pos', w.pos,
          'semantic_role', w.semantic_role,
          'semantic_domain', w.semantic_domain,
          'semantic_frame', w.semantic_frame,
          'gloss', w.gloss,
          'contextual_gloss', w.contextual_gloss,
          'dataset', w.source_dataset
        )
        ORDER BY w.token_index
      )
      FROM public.macula_word_features w
      WHERE w.book_id = p_book_id
        AND w.chapter = p_chapter
        AND w.verse = p_verse
    ), '[]'::jsonb),
    'macula_relations', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'language', r.language,
          'relation_type', r.relation_type,
          'frame', r.frame,
          'subject_ref', r.subject_ref,
          'participant_ref', r.participant_ref,
          'target_ref', r.target_ref,
          'token_xml_id', r.token_xml_id,
          'dataset', r.source_dataset
        )
      )
      FROM public.macula_syntactic_relations r
      WHERE r.book_id = p_book_id
        AND r.chapter = p_chapter
        AND r.verse = p_verse
    ), '[]'::jsonb),
    'datasets', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'name', d.name,
          'category', d.category,
          'repository_url', d.repository_url,
          'license', d.license,
          'priority', d.priority
        )
        ORDER BY d.priority ASC
      )
      FROM public.bible_dataset_sources d
      WHERE d.enabled = true
    ), '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_verse_super_insights(text, integer, integer, integer)
TO authenticated;
