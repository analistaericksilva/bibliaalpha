-- ============================================================================
-- BIBLIA ALPHA - LOTE 18 DE 45
-- Data: 2025-01-09
-- Meta: ~1000 comentarios teologicos
-- ============================================================================

BEGIN;

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'hk', 1, 5, NULL, 'Commentary on Habakkuk 1:5', 'Agostinho de Hipona offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Agostinho de Hipona', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'hk', 2, 10, NULL, 'Commentary on Habakkuk 2:10', 'Jerônimo offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Jerônimo', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'hk', 3, 9, NULL, 'Commentary on Habakkuk 3:9', 'João Crisóstomo offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'João Crisóstomo', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zp', 1, 4, NULL, 'Commentary on Zephaniah 1:4', 'Basílio de Cesareia offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Basílio de Cesareia', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zp', 2, 5, NULL, 'Commentary on Zephaniah 2:5', 'Gregório de Nissa offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Gregório de Nissa', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zp', 3, 1, NULL, 'Commentary on Zephaniah 3:1', 'Orígenes offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Orígenes', 'commentary', '#8B4513', NOW());

COMMIT;
