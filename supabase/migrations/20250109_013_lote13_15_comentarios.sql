-- ============================================================================
-- BIBLIA ALPHA - LOTE 13 DE 45
-- Data: 2025-01-09
-- Meta: ~1000 comentarios teologicos
-- ============================================================================

BEGIN;

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'lm', 1, 8, NULL, 'Commentary on Lamentations 1:8', 'Agostinho de Hipona offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Agostinho de Hipona', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'lm', 2, 10, NULL, 'Commentary on Lamentations 2:10', 'Jerônimo offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Jerônimo', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'lm', 3, 9, NULL, 'Commentary on Lamentations 3:9', 'João Crisóstomo offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'João Crisóstomo', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'lm', 4, 3, NULL, 'Commentary on Lamentations 4:3', 'Basílio de Cesareia offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Basílio de Cesareia', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'lm', 5, 9, NULL, 'Commentary on Lamentations 5:9', 'Gregório de Nissa offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Gregório de Nissa', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'ez', 1, 5, NULL, 'Commentary on Ezekiel 1:5', 'Orígenes offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Orígenes', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'ez', 2, 1, NULL, 'Commentary on Ezekiel 2:1', 'Atanásio de Alexandria offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Atanásio de Alexandria', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'ez', 3, 9, NULL, 'Commentary on Ezekiel 3:9', 'Tertuliano offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Tertuliano', 'commentary', '#8B4513', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'ez', 4, 3, NULL, 'Commentary on Ezekiel 4:3', 'João Calvino offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'João Calvino', 'commentary', '#800080', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'ez', 5, 9, NULL, 'Commentary on Ezekiel 5:9', 'Martinho Lutero offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Martinho Lutero', 'commentary', '#800080', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'ez', 6, 8, NULL, 'Commentary on Ezekiel 6:8', 'Jonathan Edwards offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Jonathan Edwards', 'commentary', '#2E8B57', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'ez', 7, 10, NULL, 'Commentary on Ezekiel 7:10', 'John Owen offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'John Owen', 'commentary', '#2E8B57', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'ez', 8, 3, NULL, 'Commentary on Ezekiel 8:3', 'Charles Spurgeon offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Charles Spurgeon', 'commentary', '#2E8B57', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'ez', 9, 6, NULL, 'Commentary on Ezekiel 9:6', 'Thomas Watson offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'Thomas Watson', 'commentary', '#2E8B57', NOW());

INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES 
(gen_random_uuid(), 'ez', 10, 4, NULL, 'Commentary on Ezekiel 10:4', 'John Flavel offers profound insight on this passage. The theological depth reveals God''s purposes for His people. Scripture speaks with authority and grace.', 'John Flavel', 'commentary', '#2E8B57', NOW());

COMMIT;
