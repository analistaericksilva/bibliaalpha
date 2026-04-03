
ALTER TABLE public.study_notes ADD COLUMN color text DEFAULT NULL;

UPDATE public.study_notes
SET color = '#6B21A8'
WHERE source IN (
  'Clemente de Roma',
  'Justino Mártir',
  'Irineu de Lyon',
  'Inácio de Antioquia',
  'Orígenes',
  'Tertuliano',
  'Policarpo de Esmirna'
);
