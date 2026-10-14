import { StudentNote, SchoolNoteTag } from '../types';

export interface SchoolNoteTagMeta {
  key: SchoolNoteTag;
  label: string;
  badgeClass: string;
  dotColor: string;
}

export const SCHOOL_NOTE_TAGS: Record<SchoolNoteTag, SchoolNoteTagMeta> = {
  ogrenci: {
    key: 'ogrenci',
    label: 'Öğrenci',
    badgeClass: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60',
    dotColor: 'bg-teal-500',
  },
  veli: {
    key: 'veli',
    label: 'Veli',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
    dotColor: 'bg-amber-500',
  },
  etkinlik: {
    key: 'etkinlik',
    label: 'Etkinlik',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
    dotColor: 'bg-purple-500',
  },
  malzeme: {
    key: 'malzeme',
    label: 'Malzeme',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
    dotColor: 'bg-emerald-500',
  },
  diger: {
    key: 'diger',
    label: 'Diğer',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700',
    dotColor: 'bg-slate-500',
  },
};

export const ALL_SCHOOL_NOTE_TAGS: SchoolNoteTag[] = [
  'ogrenci',
  'veli',
  'etkinlik',
  'malzeme',
  'diger',
];

export function getSchoolNoteTag(note: StudentNote): SchoolNoteTag {
  if (note.tag) return note.tag;
  if (note.category === 'veli_gorusmesi') return 'veli';
  if (note.category === 'gelisim' || note.category === 'davranis' || note.category === 'saglik') return 'ogrenci';
  return 'diger';
}

export function getSchoolNoteTagMeta(tag: SchoolNoteTag): SchoolNoteTagMeta {
  return SCHOOL_NOTE_TAGS[tag] || SCHOOL_NOTE_TAGS.diger;
}

export function getSchoolNoteTitle(note: StudentNote): string {
  if (note.title && note.title.trim()) {
    return note.title.trim();
  }
  const lines = (note.content || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const firstLine = lines[0];
    return firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;
  }
  return 'Başlıksız Not';
}
