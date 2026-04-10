export interface StudyNoteLike {
  id?: string;
  book_id?: string;
  chapter?: number;
  verse_start?: number;
  verse_end?: number | null;
  source?: string | null;
  note_type?: string | null;
  title?: string | null;
  content?: string | null;
}

const LOVABLE_PLACEHOLDER_SNIPPETS = [
  "offers profound insight on this passage",
  "theological depth reveals god's purposes for his people",
  "scripture speaks with authority and grace",
];

function normalize(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function isLovablePlaceholderNote(note: Pick<StudyNoteLike, "title" | "content">): boolean {
  const title = normalize(note.title || "");
  const content = normalize(note.content || "");

  if (title.startsWith("commentary on ")) return true;

  return LOVABLE_PLACEHOLDER_SNIPPETS.some((snippet) => content.includes(snippet));
}

export function sanitizeStudyNotes<T extends StudyNoteLike>(notes: T[]): T[] {
  const filtered = notes.filter((n) => !isLovablePlaceholderNote(n));
  const seen = new Set<string>();
  const result: T[] = [];

  for (const note of filtered) {
    const key = [
      note.book_id || "",
      note.chapter ?? "",
      note.verse_start ?? "",
      note.verse_end ?? note.verse_start ?? "",
      normalize(note.source || ""),
      normalize(note.note_type || ""),
      normalize(note.content || ""),
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    result.push(note);
  }

  return result;
}

export function sanitizeNoteContents(contents: string[]): string[] {
  return contents.filter((c) => !isLovablePlaceholderNote({ title: "", content: c }));
}
