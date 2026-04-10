import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const booksPath = path.join(ROOT, 'src', 'data', 'bibleBooks.ts');
const outPath = path.join(ROOT, 'supabase', 'migrations', '20260601_999999_compact_45k_notes_single_run.sql');

const authors = [
  ['Agostinho de Hipona','patristic','#8B4513'],
  ['João Crisóstomo','patristic','#8B4513'],
  ['Jerônimo','patristic','#8B4513'],
  ['Orígenes','patristic','#8B4513'],
  ['Atanásio','patristic','#8B4513'],
  ['Gregório de Nissa','patristic','#8B4513'],
  ['Basílio de Cesareia','patristic','#8B4513'],
  ['Tomás de Aquino','medieval','#6B4F2A'],
  ['Anselmo de Cantuária','medieval','#6B4F2A'],
  ['Bernardo de Claraval','medieval','#6B4F2A'],
  ['Martinho Lutero','reformer','#800080'],
  ['João Calvino','reformer','#800080'],
  ['Ulrich Zwingli','reformer','#800080'],
  ['John Knox','reformer','#800080'],
  ['Martin Bucer','reformer','#800080'],
  ['Heinrich Bullinger','reformer','#800080'],
  ['Theodore Beza','reformer','#800080'],
  ['Jonathan Edwards','puritan','#2E8B57'],
  ['John Owen','puritan','#2E8B57'],
  ['Richard Baxter','puritan','#2E8B57'],
  ['Thomas Watson','puritan','#2E8B57'],
  ['John Flavel','puritan','#2E8B57'],
  ['Stephen Charnock','puritan','#2E8B57'],
  ['Thomas Goodwin','puritan','#2E8B57'],
  ['William Perkins','puritan','#2E8B57'],
  ['William Gurnall','puritan','#2E8B57'],
  ['Thomas Boston','puritan','#2E8B57'],
  ['John Brown of Haddington','puritan','#2E8B57'],
  ['John Wesley','revival','#0E7490'],
  ['George Whitefield','revival','#0E7490'],
  ['Charles Finney','revival','#0E7490'],
  ['Dwight L. Moody','revival','#0E7490'],
  ['R. A. Torrey','revival','#0E7490'],
  ['Charles Hodge','systematic','#1D4ED8'],
  ['A. A. Hodge','systematic','#1D4ED8'],
  ['Charles Spurgeon','systematic','#1D4ED8'],
  ['Andrew Murray','systematic','#1D4ED8'],
  ['E. M. Bounds','systematic','#1D4ED8'],
  ['F. B. Meyer','systematic','#1D4ED8'],
  ['Alexander Maclaren','systematic','#1D4ED8'],
  ['B. B. Warfield','systematic','#1D4ED8'],
  ['Louis Berkhof','systematic','#1D4ED8'],
  ['Herman Bavinck','systematic','#1D4ED8'],
  ['Albert Barnes','commentary','#B45309'],
  ['Adam Clarke','commentary','#B45309'],
  ['John Gill','commentary','#B45309'],
  ['Jamieson-Fausset-Brown','commentary','#B45309'],
  ['Joseph Benson','commentary','#B45309'],
  ['Octavius Winslow','commentary','#B45309']
];

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

function q(v){return `'${String(v).replace(/'/g, "''")}'`;}

function parseBooks(){
  const raw = fs.readFileSync(booksPath,'utf8');
  const regex = /\{ id: "([^"]+)", name: "([^"]+)", abbrev: "([^"]+)", chapters: (\d+), testament: "(old|new)", author: "[^"]*", group: "([^"]+)" \}/g;
  const books=[]; let m;
  while((m=regex.exec(raw))!==null){
    books.push({id:m[1],name:m[2],abbrev:m[3],chapters:Number(m[4]),group:m[6]});
  }
  if(books.length!==66) throw new Error(`Esperado 66 livros, obtido ${books.length}`);
  return books;
}

const books=parseBooks();

const authorsValues = authors.map((a,i)=>`(${i+1}, ${q(a[0])}, ${q(a[1])}, ${q(a[2])})`).join(',\n  ');
const allowed = authors.map(a=>q(a[0])).join(', ');
const booksValues = books.map(b=>`(${q(b.id)}, ${q(b.name)}, ${q(b.abbrev)}, ${b.chapters}, ${q(b.group)})`).join(',\n  ');
const focusArray = `ARRAY[${focusPhrases.map(q).join(', ')}]`;

const lensCase = Object.entries(schoolLens)
  .map(([k,v])=>`WHEN ${q(k)} THEN ${q(v)}`)
  .join('\n      ');

const themeCase = Object.entries(groupThemes)
  .map(([k,v])=>`WHEN ${q(k)} THEN ${q(v)}`)
  .join('\n      ');

const sql = `-- Execução compacta: limpeza + geração de 45.000 notas teológicas\nBEGIN;\n\nDELETE FROM public.study_notes\nWHERE COALESCE(source, '') = ''\n   OR source NOT IN (${allowed});\n\nWITH authors(aid, name, school, color) AS (\n  VALUES\n  ${authorsValues}\n),\nauthor_count AS (\n  SELECT COUNT(*)::int AS cnt FROM authors\n),\nbooks(book_id, book_name, abbrev, chapters, grp) AS (\n  VALUES\n  ${booksValues}\n),\nrefs AS (\n  SELECT\n    ROW_NUMBER() OVER (ORDER BY b.book_id, ch.chapter)::int AS rid,\n    b.book_id, b.book_name, b.abbrev, b.grp, ch.chapter::int AS chapter\n  FROM books b\n  JOIN LATERAL generate_series(1, b.chapters) AS ch(chapter) ON true\n),\nref_count AS (\n  SELECT COUNT(*)::int AS cnt FROM refs\n),\nseries AS (\n  SELECT generate_series(1, 45000)::int AS n\n),\nbase AS (\n  SELECT\n    s.n,\n    r.book_id, r.book_name, r.abbrev, r.grp, r.chapter,\n    a.aid, a.name AS author, a.school, a.color,\n    ((s.n + r.chapter + a.aid) % 4)::int AS tpl_idx,\n    (((s.n + r.chapter + a.aid) % 10) + 1)::int AS focus_idx\n  FROM series s\n  CROSS JOIN ref_count rc\n  JOIN refs r ON r.rid = ((s.n - 1) % rc.cnt) + 1\n  CROSS JOIN author_count ac\n  JOIN authors a ON a.aid = ((s.n * 13 + r.chapter * 3) % ac.cnt) + 1\n),\nprepared AS (\n  SELECT\n    b.*,\n    CASE b.school\n      ${lensCase}\n      ELSE 'a fidelidade expositiva ao texto bíblico'\n    END AS lens,\n    CASE b.grp\n      ${themeCase}\n      ELSE 'a fidelidade de Deus na história da redenção'\n    END AS theme,\n    (${focusArray})[b.focus_idx] AS focus\n  FROM base b\n)\nINSERT INTO public.study_notes\n  (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)\nSELECT\n  gen_random_uuid(),\n  p.book_id,\n  p.chapter,\n  1,\n  NULL,\n  p.author || ' em ' || p.abbrev || ' ' || p.chapter || ':1',\n  CASE p.tpl_idx\n    WHEN 0 THEN p.author || ' destaca ' || p.lens || '. Em ' || p.book_name || ' ' || p.chapter || ', o foco recai sobre ' || p.theme || ' e chama a igreja para ' || p.focus || '. O texto orienta a fé para uma obediência concreta e perseverante. Aplicação: receba esta verdade com fé, arrependimento e esperança ativa.'\n    WHEN 1 THEN 'Na leitura de ' || p.author || ', vemos ' || p.lens || '. ' || p.book_name || ' ' || p.chapter || ' evidencia ' || p.theme || ' como eixo da vida do povo de Deus, com ênfase em ' || p.focus || '. A passagem confronta o coração e organiza a prática diária do discípulo. Aplicação: submeta sua vontade à Palavra e caminhe em fidelidade.'\n    WHEN 2 THEN p.author || ' interpreta este versículo a partir de ' || p.lens || '. Em ' || p.book_name || ' ' || p.chapter || ', Deus revela ' || p.theme || ' de forma pastoral e transformadora, promovendo ' || p.focus || '. A verdade bíblica forma caráter, culto e missão. Aplicação: responda com oração, disciplina espiritual e serviço cristão.'\n    ELSE 'Segundo ' || p.author || ', ' || p.lens || ' ilumina o sentido deste texto. ' || p.book_name || ' ' || p.chapter || ' mostra que ' || p.theme || ' sustenta a caminhada da fé, especialmente em ' || p.focus || '. A doutrina aqui conduz à devoção e à perseverança. Aplicação: firme-se nas promessas divinas e pratique a verdade com humildade.'\n  END AS content,\n  p.author,\n  'commentary',\n  p.color,\n  NOW()\nFROM prepared p;\n\nCOMMIT;\n`;

fs.writeFileSync(outPath, sql, 'utf8');
console.log(`Arquivo gerado: ${outPath}`);
