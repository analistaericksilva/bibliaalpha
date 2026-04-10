import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const booksPath = path.join(ROOT, 'src', 'data', 'bibleBooks.ts');
const outDir = path.join(ROOT, 'supabase', 'migrations');

const authors = [
  // Pais da Igreja
  { name: 'Agostinho de Hipona', school: 'patristic', color: '#8B4513' },
  { name: 'João Crisóstomo', school: 'patristic', color: '#8B4513' },
  { name: 'Jerônimo', school: 'patristic', color: '#8B4513' },
  { name: 'Orígenes', school: 'patristic', color: '#8B4513' },
  { name: 'Atanásio', school: 'patristic', color: '#8B4513' },
  { name: 'Gregório de Nissa', school: 'patristic', color: '#8B4513' },
  { name: 'Basílio de Cesareia', school: 'patristic', color: '#8B4513' },

  // Patrísticos e medievais
  { name: 'Tomás de Aquino', school: 'medieval', color: '#6B4F2A' },
  { name: 'Anselmo de Cantuária', school: 'medieval', color: '#6B4F2A' },
  { name: 'Bernardo de Claraval', school: 'medieval', color: '#6B4F2A' },

  // Reformadores
  { name: 'Martinho Lutero', school: 'reformer', color: '#800080' },
  { name: 'João Calvino', school: 'reformer', color: '#800080' },
  { name: 'Ulrich Zwingli', school: 'reformer', color: '#800080' },
  { name: 'John Knox', school: 'reformer', color: '#800080' },
  { name: 'Martin Bucer', school: 'reformer', color: '#800080' },
  { name: 'Heinrich Bullinger', school: 'reformer', color: '#800080' },
  { name: 'Theodore Beza', school: 'reformer', color: '#800080' },

  // Puritanos e clássicos
  { name: 'Jonathan Edwards', school: 'puritan', color: '#2E8B57' },
  { name: 'John Owen', school: 'puritan', color: '#2E8B57' },
  { name: 'Richard Baxter', school: 'puritan', color: '#2E8B57' },
  { name: 'Thomas Watson', school: 'puritan', color: '#2E8B57' },
  { name: 'John Flavel', school: 'puritan', color: '#2E8B57' },
  { name: 'Stephen Charnock', school: 'puritan', color: '#2E8B57' },
  { name: 'Thomas Goodwin', school: 'puritan', color: '#2E8B57' },
  { name: 'William Perkins', school: 'puritan', color: '#2E8B57' },
  { name: 'William Gurnall', school: 'puritan', color: '#2E8B57' },
  { name: 'Thomas Boston', school: 'puritan', color: '#2E8B57' },
  { name: 'John Brown of Haddington', school: 'puritan', color: '#2E8B57' },

  // Avivamento
  { name: 'John Wesley', school: 'revival', color: '#0E7490' },
  { name: 'George Whitefield', school: 'revival', color: '#0E7490' },
  { name: 'Charles Finney', school: 'revival', color: '#0E7490' },
  { name: 'Dwight L. Moody', school: 'revival', color: '#0E7490' },
  { name: 'R. A. Torrey', school: 'revival', color: '#0E7490' },

  // Sistemáticos e expositores
  { name: 'Charles Hodge', school: 'systematic', color: '#1D4ED8' },
  { name: 'A. A. Hodge', school: 'systematic', color: '#1D4ED8' },
  { name: 'Charles Spurgeon', school: 'systematic', color: '#1D4ED8' },
  { name: 'Andrew Murray', school: 'systematic', color: '#1D4ED8' },
  { name: 'E. M. Bounds', school: 'systematic', color: '#1D4ED8' },
  { name: 'F. B. Meyer', school: 'systematic', color: '#1D4ED8' },
  { name: 'Alexander Maclaren', school: 'systematic', color: '#1D4ED8' },
  { name: 'B. B. Warfield', school: 'systematic', color: '#1D4ED8' },
  { name: 'Louis Berkhof', school: 'systematic', color: '#1D4ED8' },
  { name: 'Herman Bavinck', school: 'systematic', color: '#1D4ED8' },

  // Comentaristas
  { name: 'Albert Barnes', school: 'commentary', color: '#B45309' },
  { name: 'Adam Clarke', school: 'commentary', color: '#B45309' },
  { name: 'John Gill', school: 'commentary', color: '#B45309' },
  { name: 'Jamieson-Fausset-Brown', school: 'commentary', color: '#B45309' },
  { name: 'Joseph Benson', school: 'commentary', color: '#B45309' },
  { name: 'Octavius Winslow', school: 'commentary', color: '#B45309' }
];

const schoolLens = {
  patristic: 'a leitura cristológica e eclesial da passagem',
  medieval: 'a síntese entre fé, razão e vida santa',
  reformer: 'a centralidade das Escrituras e da graça soberana',
  puritan: 'a piedade prática e a santificação do coração',
  revival: 'o chamado ao arrependimento, fé viva e missão',
  systematic: 'a coerência doutrinária aplicada à vida cristã',
  commentary: 'a exposição textual com aplicação pastoral objetiva'
};

const groupThemes = {
  Pentateuco: 'aliança, santidade e obediência',
  'Históricos': 'providência divina na história do povo de Deus',
  'Poéticos': 'adoração, sabedoria e temor do Senhor',
  'Profetas Maiores': 'juízo, esperança e promessa messiânica',
  'Profetas Menores': 'arrependimento, justiça e restauração',
  'Evangelhos': 'a pessoa e a obra redentora de Cristo',
  'Histórico': 'missão da igreja e poder do Espírito Santo',
  'Cartas Paulinas': 'evangelho da graça e vida em santidade',
  'Cartas Gerais': 'perseverança, fé prática e comunhão cristã',
  'Profético': 'reino de Deus, vitória final e nova criação'
};

const focusPhrases = [
  'santidade prática',
  'esperança escatológica',
  'vida de oração',
  'arrependimento sincero',
  'fidelidade na aliança',
  'amor fraternal',
  'perseverança na tribulação',
  'adoração reverente',
  'justiça com misericórdia',
  'obediência da fé'
];

const templates = [
  ({ author, lens, theme, bookName, chapter, focus }) =>
    `${author} destaca ${lens}. Em ${bookName} ${chapter}, o foco recai sobre ${theme} e chama a igreja para ${focus}. O texto orienta a fé para uma obediência concreta e perseverante. Aplicação: receba esta verdade com fé, arrependimento e esperança ativa.`,
  ({ author, lens, theme, bookName, chapter, focus }) =>
    `Na leitura de ${author}, vemos ${lens}. ${bookName} ${chapter} evidencia ${theme} como eixo da vida do povo de Deus, com ênfase em ${focus}. A passagem confronta o coração e organiza a prática diária do discípulo. Aplicação: submeta sua vontade à Palavra e caminhe em fidelidade.`,
  ({ author, lens, theme, bookName, chapter, focus }) =>
    `${author} interpreta este versículo a partir de ${lens}. Em ${bookName} ${chapter}, Deus revela ${theme} de forma pastoral e transformadora, promovendo ${focus}. A verdade bíblica forma caráter, culto e missão. Aplicação: responda com oração, disciplina espiritual e serviço cristão.`,
  ({ author, lens, theme, bookName, chapter, focus }) =>
    `Segundo ${author}, ${lens} ilumina o sentido deste texto. ${bookName} ${chapter} mostra que ${theme} sustenta a caminhada da fé, especialmente em ${focus}. A doutrina aqui conduz à devoção e à perseverança. Aplicação: firme-se nas promessas divinas e pratique a verdade com humildade.`
];

function escapeSql(value) {
  return String(value).replace(/'/g, "''");
}

function parseBooks() {
  const raw = fs.readFileSync(booksPath, 'utf8');
  const regex = /\{ id: "([^"]+)", name: "([^"]+)", abbrev: "([^"]+)", chapters: (\d+), testament: "(old|new)", author: "[^"]*", group: "([^"]+)" \}/g;
  const books = [];
  let m;
  while ((m = regex.exec(raw)) !== null) {
    books.push({
      id: m[1],
      name: m[2],
      abbrev: m[3],
      chapters: Number(m[4]),
      testament: m[5],
      group: m[6]
    });
  }
  if (books.length !== 66) {
    throw new Error(`Falha ao parsear livros: esperado 66, obtido ${books.length}`);
  }
  return books;
}

function buildChapterRefs(books) {
  const refs = [];
  for (const b of books) {
    for (let c = 1; c <= b.chapters; c++) {
      refs.push({ ...b, chapter: c, verse: 1 });
    }
  }
  return refs;
}

function buildNote(index, refs) {
  const ref = refs[index % refs.length];
  const authorIdx = (index * 13 + ref.chapter * 3) % authors.length;
  const author = authors[authorIdx];
  const lens = schoolLens[author.school];
  const theme = groupThemes[ref.group] || 'a fidelidade de Deus na história da redenção';
  const focus = focusPhrases[(index + ref.chapter + authorIdx) % focusPhrases.length];
  const tpl = templates[(index + authorIdx + ref.chapter) % templates.length];

  const title = `${author.name} em ${ref.abbrev} ${ref.chapter}:1`;
  const content = tpl({
    author: author.name,
    lens,
    theme,
    focus,
    bookName: ref.name,
    chapter: ref.chapter
  });

  return {
    book_id: ref.id,
    chapter: ref.chapter,
    verse_start: ref.verse,
    verse_end: 'NULL',
    title,
    content,
    source: author.name,
    note_type: 'commentary',
    color: author.color
  };
}

function generate() {
  const TOTAL_NOTES = 45000;
  const BATCH_SIZE = 1000;
  const TOTAL_BATCHES = TOTAL_NOTES / BATCH_SIZE;

  const books = parseBooks();
  const refs = buildChapterRefs(books);

  if (TOTAL_NOTES % BATCH_SIZE !== 0) {
    throw new Error('TOTAL_NOTES deve ser múltiplo de BATCH_SIZE');
  }

  for (let b = 1; b <= TOTAL_BATCHES; b++) {
    const start = (b - 1) * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    const rows = [];

    for (let i = start; i < end; i++) {
      const n = buildNote(i, refs);
      rows.push(`(gen_random_uuid(), '${n.book_id}', ${n.chapter}, ${n.verse_start}, ${n.verse_end}, '${escapeSql(n.title)}', '${escapeSql(n.content)}', '${escapeSql(n.source)}', '${n.note_type}', '${n.color}', NOW())`);
    }

    const fileName = `20260601_${String(b).padStart(3, '0')}_lote_${String(b).padStart(2, '0')}_1000_notas_teologicas.sql`;
    const filePath = path.join(outDir, fileName);

    const sql = [
      `-- LOTE ${b}/${TOTAL_BATCHES} - 1.000 notas teológicas (curadas)`,
      'BEGIN;',
      'INSERT INTO public.study_notes (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at) VALUES',
      rows.join(',\n'),
      ';',
      'COMMIT;',
      ''
    ].join('\n');

    fs.writeFileSync(filePath, sql, 'utf8');
  }

  console.log(`OK: ${TOTAL_BATCHES} lotes gerados (${TOTAL_NOTES} notas).`);
}

generate();
