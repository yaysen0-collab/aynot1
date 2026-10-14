import { StudyTask, StudyTaskType, DayCheckin } from '../types';

import { toLocalISODate } from './calendar';
export interface StudyTypeMeta {
  key: StudyTaskType;
  label: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}

export const STUDY_TYPES: Record<StudyTaskType, StudyTypeMeta> = {
  universite: {
    key: 'universite',
    label: 'Üniversite',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
  },
  ingilizce: {
    key: 'ingilizce',
    label: 'İngilizce',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
    dotColor: 'bg-sky-500',
  },
  diger: {
    key: 'diger',
    label: 'Diğer',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60',
    badgeText: 'text-teal-700 dark:text-teal-300',
    dotColor: 'bg-teal-500',
  },
};

export function getStudyTypeMeta(type: StudyTaskType): StudyTypeMeta {
  return STUDY_TYPES[type] || STUDY_TYPES.diger;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} sa ${m} dk` : `${h} saat`;
}

// Calculate study streak (consecutive days with at least 1 completed task)
export function calculateStudyStreak(allTasks: StudyTask[]): {
  currentStreak: number;
  bestStreak: number;
} {
  // Collect all unique dates with at least 1 completed task
  const completedDates = new Set<string>();
  for (const t of allTasks) {
    if (t.completed) {
      completedDates.add(t.date);
    }
  }

  if (completedDates.size === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const today = new Date();
  const formatIso = (d: Date) => toLocalISODate(d);

  let streak = 0;
  let checkDate = new Date(today);

  // If today is completed, streak starts today. If not yet completed today, check if yesterday was completed.
  const todayStr = formatIso(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatIso(yesterday);

  if (completedDates.has(todayStr)) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (completedDates.has(yesterdayStr)) {
    // Yesterday completed, today is still in progress
    streak = 0; // Or keep counting from yesterday
    checkDate = new Date(yesterday);
  } else {
    return { currentStreak: 0, bestStreak: calculateMaxStreak(completedDates) };
  }

  // Count backwards
  while (true) {
    const dStr = formatIso(checkDate);
    if (completedDates.has(dStr)) {
      if (!completedDates.has(todayStr) && streak === 0) {
        streak = 1;
      } else if (completedDates.has(todayStr) || streak > 0) {
        streak++;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const bestStreak = Math.max(streak, calculateMaxStreak(completedDates));
  return { currentStreak: streak, bestStreak };
}

function calculateMaxStreak(dateSet: Set<string>): number {
  if (dateSet.size === 0) return 0;
  const sortedDates = Array.from(dateSet).sort();
  let maxStreak = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      current++;
      if (current > maxStreak) maxStreak = current;
    } else {
      current = 1;
    }
  }

  return maxStreak;
}
