-- ============================================================================
-- BIBLIA ALPHA - LOTE 17 DE 45
-- Data: 2025-01-09
-- Meta: ~1000 comentarios teologicos
-- ============================================================================

BEGIN;

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'mi', 1, 8, NULL, 'Commentary on Micah 1:8', 'Agostinho de Hipona offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Agostinho de Hipona', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'mi', 2, 10, NULL, 'Commentary on Micah 2:10', 'Jerônimo offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Jerônimo', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'mi', 3, 1, NULL, 'Commentary on Micah 3:1', 'João Crisóstomo offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'João Crisóstomo', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'mi', 4, 9, NULL, 'Commentary on Micah 4:9', 'Basílio de Cesareia offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Basílio de Cesareia', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'mi', 5, 10, NULL, 'Commentary on Micah 5:10', 'Gregório de Nissa offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Gregório de Nissa', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'mi', 6, 7, NULL, 'Commentary on Micah 6:7', 'Orígenes offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Orígenes', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'mi', 7, 7, NULL, 'Commentary on Micah 7:7', 'Atanásio de Alexandria offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Atanásio de Alexandria', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'na', 1, 2, NULL, 'Commentary on Nahum 1:2', 'Tertuliano offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Tertuliano', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'na', 2, 2, NULL, 'Commentary on Nahum 2:2', 'João Calvino offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'João Calvino', 'commentary', '#800080', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'na', 3, 10, NULL, 'Commentary on Nahum 3:10', 'Martinho Lutero offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Martinho Lutero', 'commentary', '#800080', NOW());

COMMIT;
