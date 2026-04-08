-- Tabela de Números Strong (Hebreu/Grego)
CREATE TABLE IF NOT EXISTS strong_numbers (
  id TEXT PRIMARY KEY,
  word_hebrew TEXT,
  word_greek TEXT,
  transliteration TEXT,
  pronunciation TEXT,
  definition TEXT,
  part_of_speech TEXT,
  language TEXT CHECK (language IN ('hebrew', 'greek')),
  etymology TEXT,
  pronunciation_guide TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Códigos Morfológicos
CREATE TABLE IF NOT EXISTS morphology_codes (
  code TEXT PRIMARY KEY,
  description TEXT,
  language TEXT CHECK (language IN ('hebrew', 'greek')),
  category TEXT,
  subcategory TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Códigos Morfológicos por Versículo
CREATE TABLE IF NOT EXISTS verse_morphology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  word_position INTEGER NOT NULL,
  original_word TEXT,
  morphology_code TEXT REFERENCES morphology_codes(code),
  strong_number TEXT REFERENCES strong_numbers(id),
  lemma TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Notas de Rodapé
CREATE TABLE IF NOT EXISTS bible_footnotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  footnote_text TEXT NOT NULL,
  footnote_type TEXT CHECK (footnote_type IN ('translation', 'study', 'cross_ref', 'variant')),
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Cabeçalhos de Capítulo
CREATE TABLE IF NOT EXISTS chapter_headings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  heading_text TEXT NOT NULL,
  heading_type TEXT CHECK (heading_type IN ('major', 'minor', 'parallel')),
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Divisões de Parágrafo
CREATE TABLE IF NOT EXISTS paragraph_divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER NOT NULL,
  paragraph_type TEXT CHECK (paragraph_type IN ('translator', ' thematic', 'poetic', 'speech')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Definições de Palavras (para lookup)
CREATE TABLE IF NOT EXISTS dictionary_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  part_of_speech TEXT,
  language TEXT CHECK (language IN ('hebrew', 'greek', 'english')),
  strong_number TEXT REFERENCES strong_numbers(id),
  see_also TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Personagens Bíblicos
CREATE TABLE IF NOT EXISTS biblical_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  other_names TEXT[],
  description TEXT,
  first_mention TEXT,
  role TEXT,
  book_id TEXT,
  chapter INTEGER,
  verse INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Mapa de Locais Bíblicos
CREATE TABLE IF NOT EXISTS biblical_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  other_names TEXT[],
  location_type TEXT CHECK (location_type IN ('city', 'region', 'river', 'mountain', 'sea', 'country')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  biblical_significance TEXT,
  old_testament BOOLEAN DEFAULT TRUE,
  new_testament BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Textos de Jesus (palavras de Jesus destacadas)
CREATE TABLE IF NOT EXISTS jesus_speech (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER NOT NULL,
  speech_type TEXT CHECK (speech_type IN ('teaching', 'parable', 'prophecy', 'prayer', 'miracle')),
  reference_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Citações do Antigo Testamento no Novo
CREATE TABLE IF NOT EXISTS old_testament_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  new_testament_book TEXT NOT NULL,
  new_testament_chapter INTEGER NOT NULL,
  new_testament_verse INTEGER NOT NULL,
  old_testament_book TEXT NOT NULL,
  old_testament_chapter INTEGER NOT NULL,
  old_testament_verse INTEGER NOT NULL,
  quote_text TEXT,
  fulfillment_text TEXT,
  quote_type TEXT CHECK (quote_type IN ('direct', 'allusion', 'reference', 'theme')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Configurações de Módulos (similar ao theWord modules)
CREATE TABLE IF NOT EXISTS bible_modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  description TEXT,
  language TEXT,
  version TEXT,
  publisher TEXT,
  has_strong_numbers BOOLEAN DEFAULT FALSE,
  has_morphology BOOLEAN DEFAULT FALSE,
  has_paragraphs BOOLEAN DEFAULT FALSE,
  has_headings BOOLEAN DEFAULT FALSE,
  has_footnotes BOOLEAN DEFAULT FALSE,
  has_cross_references BOOLEAN DEFAULT FALSE,
  font_family TEXT,
  font_size INTEGER DEFAULT 14,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_strong_numbers_language ON strong_numbers(language);
CREATE INDEX IF NOT EXISTS idx_verse_morphology_book_chapter ON verse_morphology(book_id, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_bible_footnotes_book_chapter ON bible_footnotes(book_id, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_chapter_headings_book_chapter ON chapter_headings(book_id, chapter);
CREATE INDEX IF NOT EXISTS idx_dictionary_definitions_term ON dictionary_definitions(term);
CREATE INDEX IF NOT EXISTS idx_jesus_speech_book_chapter ON jesus_speech(book_id, chapter);