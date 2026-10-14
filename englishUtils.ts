import { EnglishCard, SpacedRepetitionRating } from '../types';

import { toLocalISODate } from './calendar';
/**
 * Calculates next review date and SM-2 parameters based on rating
 * Ratings:
 * - 'bildim' (good / correct) -> quality 5
 * - 'zorlandim' (hard / recall with effort) -> quality 3
 * - 'bilmedim' (again / forgot) -> quality 1
 */
export function calculateNextReview(
  card: EnglishCard,
  rating: SpacedRepetitionRating
): {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string;
} {
  let quality: number;
  if (rating === 'bildim') quality = 5;
  else if (rating === 'zorlandim') quality = 3;
  else quality = 1;

  let repetitions = card.repetitions || 0;
  let easeFactor = card.easeFactor || 2.5;
  let intervalDays = card.intervalDays || 1;

  if (quality >= 3) {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect: restart repetitions, set interval back to 1 day
    repetitions = 0;
    intervalDays = 1;
  }

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Calculate next date (today + intervalDays)
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);
  const nextReviewDate = toLocalISODate(nextDate);

  return {
    intervalDays,
    easeFactor: Number(easeFactor.toFixed(2)),
    repetitions,
    nextReviewDate,
  };
}

/**
 * Check if card is due for review today or overdue
 */
export function isCardDueToday(card: EnglishCard, todayStr: string = toLocalISODate()): boolean {
  if (!card.nextReviewDate) return true;
  return card.nextReviewDate <= todayStr;
}

/**
 * Synthesize English speech using Web Speech API (window.speechSynthesis)
 */
export function speakEnglish(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel(); // Stop any pending speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9; // Slightly slower for crisp clarity

  // Prefer natural English voices if available
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
  if (enVoice) {
    utterance.voice = enVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * CSV Import / Export Helpers for English Flashcards
 */
export function exportCardsToCSV(cards: EnglishCard[]): string {
  const header = ['English', 'Turkish', 'ExampleSentence', 'PersonalNote'].join(',');
  const rows = cards.map(c => {
    const cleanWord = `"${(c.word || '').replace(/"/g, '""')}"`;
    const cleanMeaning = `"${(c.meaning || '').replace(/"/g, '""')}"`;
    const cleanExample = `"${(c.exampleSentence || '').replace(/"/g, '""')}"`;
    const cleanNote = `"${(c.personalNote || '').replace(/"/g, '""')}"`;
    return [cleanWord, cleanMeaning, cleanExample, cleanNote].join(',');
  });
  return [header, ...rows].join('\n');
}

export function parseCardsCSV(csvText: string): Array<{
  word: string;
  meaning: string;
  exampleSentence?: string;
  personalNote?: string;
}> {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const parsed: Array<{
    word: string;
    meaning: string;
    exampleSentence?: string;
    personalNote?: string;
  }> = [];

  // Helper for simple CSV tokenizing
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const startIndex = lines[0].toLowerCase().includes('english') || lines[0].toLowerCase().includes('kelime') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length >= 2 && cols[0] && cols[1]) {
      parsed.push({
        word: cols[0],
        meaning: cols[1],
        exampleSentence: cols[2] || undefined,
        personalNote: cols[3] || undefined,
      });
    }
  }

  return parsed;
}

/**
 * Downloads text as a file in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType }); // Add BOM for Excel Turkish character encoding
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
