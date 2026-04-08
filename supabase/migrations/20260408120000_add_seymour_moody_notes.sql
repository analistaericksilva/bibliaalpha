BEGIN;

-- Comentários de William J. Seymour (ênfase pentecostal)
INSERT INTO public.study_notes (book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)
SELECT 'at', 1, 8, NULL,
  'Poder para testemunhar',
  'William J. Seymour ensinava que o revestimento do Espírito Santo capacita a Igreja para missão viva e santa. A promessa de At 1:8 se cumpre com ousadia prática (cf. At 4:31 e Lc 24:49).',
  'William J. Seymour',
  'sermon',
  '#7C3AED',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.study_notes
  WHERE book_id = 'at' AND chapter = 1 AND verse_start = 8 AND source = 'William J. Seymour'
);

INSERT INTO public.study_notes (book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)
SELECT 'at', 2, 4, NULL,
  'Plenitude e testemunho',
  'Para Seymour, o derramamento em At 2:4 não é fim em si mesmo: é começo de uma vida cheia do Espírito, oração e serviço. Compare com Ef 5:18 e Jo 7:38-39.',
  'William J. Seymour',
  'sermon',
  '#7C3AED',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.study_notes
  WHERE book_id = 'at' AND chapter = 2 AND verse_start = 4 AND source = 'William J. Seymour'
);

INSERT INTO public.study_notes (book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)
SELECT 'at', 2, 17, NULL,
  'Promessa para toda geração',
  'Seymour aplicava At 2:17 como promessa contínua para a Igreja: filhos e filhas cheios do Espírito para proclamar Cristo com santidade e compaixão.',
  'William J. Seymour',
  'sermon',
  '#7C3AED',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.study_notes
  WHERE book_id = 'at' AND chapter = 2 AND verse_start = 17 AND source = 'William J. Seymour'
);

INSERT INTO public.study_notes (book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)
SELECT 'lc', 24, 49, NULL,
  'Esperar até ser revestido',
  'Seymour insistia que a obra cristã sem poder espiritual se torna seca. Em Lc 24:49, Jesus manda esperar o revestimento para depois ir e servir.',
  'William J. Seymour',
  'sermon',
  '#7C3AED',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.study_notes
  WHERE book_id = 'lc' AND chapter = 24 AND verse_start = 49 AND source = 'William J. Seymour'
);

INSERT INTO public.study_notes (book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)
SELECT 'ef', 5, 18, NULL,
  'Vida continuamente cheia',
  'Seymour via Ef 5:18 como chamado diário: não apenas uma experiência passada, mas uma vida continuamente rendida ao Espírito Santo.',
  'William J. Seymour',
  'sermon',
  '#7C3AED',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.study_notes
  WHERE book_id = 'ef' AND chapter = 5 AND verse_start = 18 AND source = 'William J. Seymour'
);

-- Comentários de D. L. Moody (evangelismo e graça)
INSERT INTO public.study_notes (book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)
SELECT 'jo', 3, 16, NULL,
  'Amor que alcança o mundo',
  'D. L. Moody pregava Jo 3:16 como o centro do evangelho: Deus ama, Deus dá, Deus salva. O chamado é crer hoje (cf. Rm 10:9).',
  'D. L. Moody',
  'sermon',
  '#0F766E',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.study_notes
  WHERE book_id = 'jo' AND chapter = 3 AND verse_start = 16 AND source = 'D. L. Moody'
);

INSERT INTO public.study_notes (book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)
SELECT 'rm', 10, 9, NULL,
  'Confessar e crer',
  'Moody enfatizava simplicidade da fé salvadora: confessar Jesus como Senhor e crer de coração. A graça não é complexa; é recebida com fé (Ef 2:8).',
  'D. L. Moody',
  'sermon',
  '#0F766E',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.study_notes
  WHERE book_id = 'rm' AND chapter = 10 AND verse_start = 9 AND source = 'D. L. Moody'
);

INSERT INTO public.study_notes (book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)
SELECT 'ef', 2, 8, NULL,
  'Salvos pela graça',
  'Para Moody, Ef 2:8 destrói todo mérito humano: a salvação é dom de Deus, recebida pela fé. Isso gera humildade, gratidão e santidade prática.',
  'D. L. Moody',
  'sermon',
  '#0F766E',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.study_notes
  WHERE book_id = 'ef' AND chapter = 2 AND verse_start = 8 AND source = 'D. L. Moody'
);

INSERT INTO public.study_notes (book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)
SELECT '1jo', 1, 9, NULL,
  'Arrependimento e perdão',
  'Moody chamava pecadores ao arrependimento com esperança: 1Jo 1:9 mostra que Deus perdoa e purifica quando há confissão sincera.',
  'D. L. Moody',
  'sermon',
  '#0F766E',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.study_notes
  WHERE book_id = '1jo' AND chapter = 1 AND verse_start = 9 AND source = 'D. L. Moody'
);

INSERT INTO public.study_notes (book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)
SELECT 'mt', 11, 28, NULL,
  'Convite aos cansados',
  'D. L. Moody frequentemente citava Mt 11:28 para convidar os cansados à pessoa de Cristo. Descanso verdadeiro nasce de vir a Jesus.',
  'D. L. Moody',
  'sermon',
  '#0F766E',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.study_notes
  WHERE book_id = 'mt' AND chapter = 11 AND verse_start = 28 AND source = 'D. L. Moody'
);

INSERT INTO public.study_notes (book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)
SELECT 'hb', 11, 6, NULL,
  'Fé que se aproxima de Deus',
  'Moody ensinava que Hb 11:6 une fé e busca: quem se aproxima de Deus confia em Seu caráter e em Sua recompensa para os que O buscam.',
  'D. L. Moody',
  'sermon',
  '#0F766E',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.study_notes
  WHERE book_id = 'hb' AND chapter = 11 AND verse_start = 6 AND source = 'D. L. Moody'
);

COMMIT;
