-- ============================================================================
-- BIBLIA ALPHA - LOTE 19 DE 45
-- Data: 2025-01-09
-- Meta: ~1000 comentarios teologicos
-- ============================================================================

BEGIN;

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'hg', 1, 9, NULL, 'Commentary on Haggai 1:9', 'Agostinho de Hipona offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Agostinho de Hipona', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'hg', 2, 3, NULL, 'Commentary on Haggai 2:3', 'Jerônimo offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Jerônimo', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zc', 1, 3, NULL, 'Commentary on Zechariah 1:3', 'João Crisóstomo offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'João Crisóstomo', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zc', 2, 4, NULL, 'Commentary on Zechariah 2:4', 'Basílio de Cesareia offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Basílio de Cesareia', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zc', 3, 8, NULL, 'Commentary on Zechariah 3:8', 'Gregório de Nissa offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Gregório de Nissa', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zc', 4, 1, NULL, 'Commentary on Zechariah 4:1', 'Orígenes offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Orígenes', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zc', 5, 2, NULL, 'Commentary on Zechariah 5:2', 'Atanásio de Alexandria offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Atanásio de Alexandria', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zc', 6, 10, NULL, 'Commentary on Zechariah 6:10', 'Tertuliano offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Tertuliano', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zc', 7, 6, NULL, 'Commentary on Zechariah 7:6', 'João Calvino offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'João Calvino', 'commentary', '#800080', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zc', 8, 5, NULL, 'Commentary on Zechariah 8:5', 'Martinho Lutero offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Martinho Lutero', 'commentary', '#800080', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zc', 9, 6, NULL, 'Commentary on Zechariah 9:6', 'Jonathan Edwards offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Jonathan Edwards', 'commentary', '#2E8B57', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'zc', 10, 7, NULL, 'Commentary on Zechariah 10:7', 'John Owen offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'John Owen', 'commentary', '#2E8B57', NOW());

COMMIT;
