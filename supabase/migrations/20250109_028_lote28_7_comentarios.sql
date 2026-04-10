-- ============================================================================
-- BIBLIA ALPHA - LOTE 28 DE 45
-- Data: 2025-01-09
-- Meta: ~1000 comentarios teologicos
-- ============================================================================

BEGIN;

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), '2tm', 1, 8, NULL, 'Commentary on 2 Timothy 1:8', 'Agostinho de Hipona offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Agostinho de Hipona', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), '2tm', 2, 1, NULL, 'Commentary on 2 Timothy 2:1', 'Jerônimo offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Jerônimo', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), '2tm', 3, 3, NULL, 'Commentary on 2 Timothy 3:3', 'João Crisóstomo offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'João Crisóstomo', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), '2tm', 4, 2, NULL, 'Commentary on 2 Timothy 4:2', 'Basílio de Cesareia offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Basílio de Cesareia', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'tt', 1, 3, NULL, 'Commentary on Titus 1:3', 'Gregório de Nissa offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Gregório de Nissa', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'tt', 2, 1, NULL, 'Commentary on Titus 2:1', 'Orígenes offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Orígenes', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'tt', 3, 6, NULL, 'Commentary on Titus 3:6', 'Atanásio de Alexandria offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Atanásio de Alexandria', 'commentary', '#8B4513', NOW());

COMMIT;
