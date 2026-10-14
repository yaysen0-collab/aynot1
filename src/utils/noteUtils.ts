import { PersonalNote, PersonalNoteTag, NoteTagColor } from '../types';

export interface TagColorConfig {
  name: string;
  bg: string;
  text: string;
  border: string;
  badge: string;
  dot: string;
  ring: string;
}

export const NOTE_TAG_COLORS: Record<NoteTagColor, TagColorConfig> = {
  purple: {
    name: 'Mor (Prompt)',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800/80',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
    ring: 'focus:ring-purple-400',
  },
  amber: {
    name: 'Sarı (Fikir)',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/80',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    ring: 'focus:ring-amber-400',
  },
  blue: {
    name: 'Mavi (Not)',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800/80',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
    ring: 'focus:ring-blue-400',
  },
  orange: {
    name: 'Turuncu (Yapılacak)',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800/80',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
    ring: 'focus:ring-orange-400',
  },
  green: {
    name: 'Yeşil (Kod)',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/80',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    ring: 'focus:ring-emerald-400',
  },
  teal: {
    name: 'Turkuaz (Link)',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800/80',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    dot: 'bg-teal-500',
    ring: 'focus:ring-teal-400',
  },
  rose: {
    name: 'Kırmızı (Önemli)',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/80',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
    ring: 'focus:ring-rose-400',
  },
  pink: {
    name: 'Pembe',
    bg: 'bg-pink-50 dark:bg-pink-950/40',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800/80',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    dot: 'bg-pink-500',
    ring: 'focus:ring-pink-400',
  },
  indigo: {
    name: 'İndigo',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800/80',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
    ring: 'focus:ring-indigo-400',
  },
  slate: {
    name: 'Gri',
    bg: 'bg-slate-50 dark:bg-slate-800/40',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-500',
    ring: 'focus:ring-slate-400',
  },
};

export const COLOR_OPTIONS: NoteTagColor[] = [
  'purple',
  'amber',
  'blue',
  'orange',
  'green',
  'teal',
  'rose',
  'pink',
  'indigo',
  'slate',
];

/**
 * Returns display title for a personal note.
 * If title is not specified, returns the first non-empty line of content.
 */
export function getNoteDisplayTitle(note: PersonalNote): string {
  if (note.title && note.title.trim().length > 0) {
    return note.title.trim();
  }

  if (note.content) {
    const lines = note.content.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const firstLine = lines[0].replace(/^[#*->\s]+/, '').trim();
      return firstLine.slice(0, 80) || 'İsimsiz Not';
    }
  }

  return 'İsimsiz Not';
}

/**
 * Returns content preview lines for cards.
 * If title is empty, omits the first line used as the title so there's no duplication.
 */
export function getNoteContentPreview(note: PersonalNote): string {
  if (!note.content) return '';

  if (note.title && note.title.trim().length > 0) {
    return note.content;
  }

  // Title was inferred from first line
  const lines = note.content.split('\n');
  const nonEmptyIndices: number[] = [];
  lines.forEach((l, idx) => {
    if (l.trim().length > 0) nonEmptyIndices.push(idx);
  });

  if (nonEmptyIndices.length > 1) {
    const remainingLines = lines.slice(nonEmptyIndices[1]);
    return remainingLines.join('\n').trim();
  }

  return '';
}

/**
 * Checks if note has Prompt tag (purple or name 'prompt')
 */
export function hasPromptTag(note: PersonalNote, tagsMap: Map<string, PersonalNoteTag>): boolean {
  if (!note.tagIds || note.tagIds.length === 0) return false;
  return note.tagIds.some((tId) => {
    const tag = tagsMap.get(tId);
    if (!tag) return false;
    return tag.color === 'purple' || tag.name.toLowerCase().includes('prompt');
  });
}

/**
 * Checks if note has Code tag (green or name 'kod' / 'code')
 */
export function hasCodeTag(note: PersonalNote, tagsMap: Map<string, PersonalNoteTag>): boolean {
  if (!note.tagIds || note.tagIds.length === 0) return false;
  return note.tagIds.some((tId) => {
    const tag = tagsMap.get(tId);
    if (!tag) return false;
    return tag.color === 'green' || tag.name.toLowerCase().includes('kod') || tag.name.toLowerCase().includes('code');
  });
}

/**
 * Formats timestamp to readable Turkish date string
 */
export function formatNoteDate(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Bugün ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Dün ${timeStr}`;
  }

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }) + ` ${timeStr}`;
}
