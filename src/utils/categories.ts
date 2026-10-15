import { NoteCategory } from '../types';

export interface CategoryMeta {
  key: NoteCategory;
  label: string;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  iconName: 'trending-up' | 'smile' | 'phone-call' | 'heart-pulse' | 'tag';
}

export const NOTE_CATEGORIES: Record<NoteCategory, CategoryMeta> = {
  gelisim: {
    key: 'gelisim',
    label: 'Gelişim',
    colorClass: 'emerald',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    iconName: 'trending-up',
  },
  davranis: {
    key: 'davranis',
    label: 'Davranış',
    colorClass: 'blue',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
    iconName: 'smile',
  },
  veli_gorusmesi: {
    key: 'veli_gorusmesi',
    label: 'Veli Görüşmesi',
    colorClass: 'amber',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    iconName: 'phone-call',
  },
  saglik: {
    key: 'saglik',
    label: 'Sağlık',
    colorClass: 'rose',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    iconName: 'heart-pulse',
  },
  diger: {
    key: 'diger',
    label: 'Diğer',
    colorClass: 'purple',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
    iconName: 'tag',
  },
};

export function getCategoryMeta(cat: NoteCategory): CategoryMeta {
  return NOTE_CATEGORIES[cat] || NOTE_CATEGORIES.diger;
}
