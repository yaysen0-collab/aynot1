import { toLocalISODate } from './calendar';

/**
 * Ortak sınav tarihi: tüm derslerin sınavı aynı güne denk geliyorsa tek tarih girilir.
 * Giriş ekranı oturum açılmadan veriye ulaşamadığı için tarih bu cihazın localStorage'ına da yazılır.
 */
export const COMMON_EXAM_GROUP = 'main';
export const COMMON_EXAM_STORAGE_KEY = 'oa_common_exam';

export interface StoredCommonExam {
  date: string; // YYYY-MM-DD
  time?: string;
  label?: string;
}

export function readStoredCommonExam(): StoredCommonExam | null {
  try {
    const raw = localStorage.getItem(COMMON_EXAM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCommonExam;
    return parsed && typeof parsed.date === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function storeCommonExam(info: StoredCommonExam): void {
  try {
    localStorage.setItem(COMMON_EXAM_STORAGE_KEY, JSON.stringify(info));
  } catch {
    /* özel mod vb. */
  }
}

export function clearStoredCommonExam(): void {
  try {
    localStorage.removeItem(COMMON_EXAM_STORAGE_KEY);
  } catch {
    /* yoksay */
  }
}

/** Bugünden verilen tarihe kalan gün sayısı (geçmişse negatif). */
export function daysUntilDate(dateStr: string, todayStr: string = toLocalISODate()): number {
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date(todayStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDaysLabel(days: number): string {
  if (days < 0) return 'Sınavlar tamamlandı';
  if (days === 0) return 'Sınav bugün!';
  if (days === 1) return 'Sınava 1 gün kaldı';
  return `Sınava ${days} gün kaldı`;
}
