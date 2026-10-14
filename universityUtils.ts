import { 
  UniversityCourse, 
  UniversityExam, 
  ExamType, 
  ExamResultStatus 
} from '../types';

import { toLocalISODate } from './calendar';
export interface ParsedExamDraft {
  tempId: string;
  originalText: string;
  rawCourseName: string;
  matchedCourseId?: string;
  matchedCourseName?: string;
  examType: ExamType;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  status: 'matched' | 'unmatched' | 'uncertain';
  uncertaintyReason?: string;
}

/**
 * Normalizes Turkish text for accurate comparison
 */
export function normalizeTurkish(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .trim()
    .replace(/[\s\-_.,;:]+/g, ' ');
}

const TURKISH_MONTHS: Record<string, string> = {
  ocak: '01',
  subat: '02',
  şubat: '02',
  mart: '03',
  nisan: '04',
  mayis: '05',
  mayıs: '05',
  haziran: '06',
  temmuz: '07',
  agustos: '08',
  ağustos: '08',
  eylul: '09',
  eylül: '09',
  ekim: '10',
  kasim: '11',
  kasım: '11',
  aralik: '12',
  aralık: '12',
};

/**
 * Extracts date in YYYY-MM-DD format from a line of text.
 * Strictly avoids guessing: if ambiguous, returns null.
 */
function extractDate(text: string): string | null {
  const norm = normalizeTurkish(text);

  // Pattern 1: DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
  const numMatch = text.match(/\b([0-3]?\d)[\.\/\-]([0-1]?\d)[\.\/\-](\d{4})\b/);
  if (numMatch) {
    const day = numMatch[1].padStart(2, '0');
    const month = numMatch[2].padStart(2, '0');
    const year = numMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern 2: DD MonthName YYYY (e.g. 23 Kasım 2026 or 23 Kasım)
  for (const [mName, mNum] of Object.entries(TURKISH_MONTHS)) {
    const regex = new RegExp(`\\b([0-3]?\\d)\\s+${mName}(?:\\s+(\\d{4}))?\\b`, 'i');
    const match = norm.match(regex);
    if (match) {
      const day = match[1].padStart(2, '0');
      const year = match[2] || new Date().getFullYear().toString();
      return `${year}-${mNum}-${day}`;
    }
  }

  // Pattern 3: YYYY-MM-DD
  const isoMatch = text.match(/\b(\d{4})-[0-1]\d-[0-3]\d\b/);
  if (isoMatch) {
    return isoMatch[0];
  }

  return null;
}

/**
 * Extracts time in HH:mm format
 */
function extractTime(text: string): string | undefined {
  const timeMatch = text.match(/\b([0-1]?\d|2[0-3])[:.]([0-5]\d)\b/);
  if (timeMatch) {
    const h = timeMatch[1].padStart(2, '0');
    const m = timeMatch[2];
    return `${h}:${m}`;
  }
  return undefined;
}

/**
 * Detects exam type from keywords
 */
function detectExamType(text: string): ExamType {
  const norm = normalizeTurkish(text);
  if (norm.includes('bütünleme') || norm.includes('büt') || norm.includes('butunleme')) {
    return 'butunleme';
  }
  if (norm.includes('final') || norm.includes('dönem sonu') || norm.includes('donem sonu') || norm.includes('yıl sonu')) {
    return 'donem_sonu';
  }
  if (norm.includes('ara sınav') || norm.includes('ara sinav') || norm.includes('vize')) {
    return 'ara_sinav';
  }
  return 'ara_sinav'; // default to mid-term if not specified
}

/**
 * Matches a course name string against user's registered courses in the term
 */
function findBestCourseMatch(
  line: string, 
  courses: UniversityCourse[]
): { course?: UniversityCourse; confidence: number; detectedName: string } {
  const normLine = normalizeTurkish(line);
  let bestMatch: UniversityCourse | undefined;
  let highestScore = 0;
  let detectedName = '';

  for (const c of courses) {
    const cNorm = normalizeTurkish(c.name);
    const codeNorm = c.code ? normalizeTurkish(c.code) : '';

    // Direct code match (e.g. BİL102)
    if (codeNorm && normLine.includes(codeNorm)) {
      return { course: c, confidence: 1.0, detectedName: c.name };
    }

    // Direct exact substring match
    if (normLine.includes(cNorm)) {
      if (cNorm.length > highestScore) {
        highestScore = cNorm.length;
        bestMatch = c;
        detectedName = c.name;
      }
    } else {
      // Word overlap check
      const words = cNorm.split(' ').filter(w => w.length > 2);
      const matchedWords = words.filter(w => normLine.includes(w));
      const score = matchedWords.length / Math.max(1, words.length);
      if (score >= 0.6 && score > highestScore) {
        highestScore = score;
        bestMatch = c;
        detectedName = c.name;
      }
    }
  }

  return {
    course: bestMatch,
    confidence: bestMatch ? 0.9 : 0,
    detectedName: detectedName || line.substring(0, 40).trim(),
  };
}

/**
 * Parses official exam announcements pasted by the user.
 * Marks matching state clearly for user preview & correction.
 */
export function parseOfficialExamAnnouncement(
  rawText: string,
  courses: UniversityCourse[]
): ParsedExamDraft[] {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 3);

  const drafts: ParsedExamDraft[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if line looks like a header, skip pure headers
    const norm = normalizeTurkish(line);
    if (
      (norm.includes('sınav takvimi') || norm.includes('ata aöf') || norm.includes('oturum listesi')) &&
      !norm.includes('saat') && !extractDate(line)
    ) {
      continue;
    }

    const date = extractDate(line);
    const time = extractTime(line);
    const examType = detectExamType(line);
    const { course, detectedName } = findBestCourseMatch(line, courses);

    let status: 'matched' | 'unmatched' | 'uncertain' = 'matched';
    let uncertaintyReason: string | undefined;

    if (!date) {
      status = 'uncertain';
      uncertaintyReason = 'Tarih bilgisi net olarak tespit edilemedi (tahmin edilmedi). Lütfen tarihi girin.';
    } else if (!course) {
      status = 'unmatched';
      uncertaintyReason = 'Ders listedeki kayıtlı derslerle eşleşmedi. Lütfen derse bağlayın.';
    }

    drafts.push({
      tempId: `draft-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      originalText: line,
      rawCourseName: detectedName || line,
      matchedCourseId: course?.id,
      matchedCourseName: course?.name,
      examType,
      date: date || '',
      time,
      status,
      uncertaintyReason,
    });
  }

  return drafts;
}

/**
 * Calculates countdown and status relative to today
 */
export interface ExamCountdownInfo {
  daysLeft: number;
  label: string;
  isPast: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  isImminent: boolean; // 7 days or fewer (calm warm styling)
  isStudyPromptEligible: boolean; // 3 days or fewer
  isResultPromptEligible: boolean; // Exam passed by >= 2 days, or expected result date reached
}

export function getExamCountdown(
  exam: UniversityExam,
  todayStr: string = toLocalISODate()
): ExamCountdownInfo {
  const examDate = new Date(exam.date + 'T00:00:00');
  const today = new Date(todayStr + 'T00:00:00');
  const diffTime = examDate.getTime() - today.getTime();
  const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const isPast = daysLeft < 0;
  const isToday = daysLeft === 0;
  const isTomorrow = daysLeft === 1;
  const isImminent = daysLeft >= 0 && daysLeft <= 7;
  const isStudyPromptEligible = daysLeft >= 0 && daysLeft <= 3 && !exam.hasPromptedStudyTask;

  // Result prompt eligibility:
  // Either 2+ days past exam date, OR expected result date has arrived
  let isResultPromptEligible = false;
  if (!exam.resultStatus || exam.resultStatus === 'pending') {
    if (exam.expectedResultDate && exam.expectedResultDate <= todayStr) {
      isResultPromptEligible = true;
    } else if (daysLeft <= -2) {
      isResultPromptEligible = true;
    }

    // If user said "Daha değil" and postponed until tomorrow or specific date
    if (exam.resultPromptDismissedUntil && exam.resultPromptDismissedUntil > todayStr) {
      isResultPromptEligible = false;
    }
  }

  let label: string;
  if (isPast) {
    const daysAgo = Math.abs(daysLeft);
    label = daysAgo === 1 ? 'Dün yapıldı' : `${daysAgo} gün önce yapıldı`;
  } else if (isToday) {
    label = exam.time ? `Bugün ${exam.time}` : 'Bugün!';
  } else if (isTomorrow) {
    label = exam.time ? `Yarın ${exam.time}` : 'Yarın!';
  } else {
    label = `${daysLeft} gün kaldı`;
  }

  return {
    daysLeft,
    label,
    isPast,
    isToday,
    isTomorrow,
    isImminent,
    isStudyPromptEligible,
    isResultPromptEligible,
  };
}

/**
 * Generates an .ics calendar export file for an exam
 */
export function generateExamIcsFile(exam: UniversityExam, courseName: string): void {
  const dateFormatted = exam.date.replace(/-/g, '');
  const timeFormatted = exam.time ? exam.time.replace(':', '') + '00' : '093000';
  const startDateTime = `${dateFormatted}T${timeFormatted}`;
  
  // 90 minutes standard duration
  const endHour = exam.time 
    ? (parseInt(exam.time.split(':')[0], 10) + 1).toString().padStart(2, '0') + exam.time.split(':')[1] + '00'
    : '110000';
  const endDateTime = `${dateFormatted}T${endHour}`;

  const examTypeTitle = getExamTypeTitle(exam.examType);
  const summary = `${courseName} - ${examTypeTitle}`;
  const description = `ATA AÖF Bilgisayar Programcılığı\\n${courseName}\\nSınav Türü: ${examTypeTitle}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ogretmen Asistani//Universite Sinav Takvimi//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:exam-${exam.id}@ogretmenasistani.local`,
    `DTSTAMP:${dateFormatted}T000000Z`,
    `DTSTART:${startDateTime}`,
    `DTEND:${endDateTime}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${courseName}_${examTypeTitle.replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Compresses an image file before saving as Data URL in IndexedDB
 * Keeps maximum dimension 1200px and JPEG quality 0.75
 */
export function compressImageFile(file: File, maxDimension = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Görsel okunamadı'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsDataURL(file);
  });
}

export function getExamTypeTitle(type: ExamType): string {
  switch (type) {
    case 'ara_sinav':
      return 'Ara Sınav (Vize)';
    case 'donem_sonu':
      return 'Dönem Sonu (Final)';
    case 'butunleme':
      return 'Bütünleme Sınavı';
    case 'diger':
    default:
      return 'Sınav';
  }
}

export function getExamResultBadge(status?: ExamResultStatus): { text: string; colorClass: string } {
  switch (status) {
    case 'passed':
      return { 
        text: 'Geçti', 
        colorClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
      };
    case 'failed':
      return { 
        text: 'Kaldı', 
        colorClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' 
      };
    case 'needs_resit':
      return { 
        text: 'Bütünleme', 
        colorClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
      };
    case 'pending':
    default:
      return { 
        text: 'Sonuç Bekleniyor', 
        colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' 
      };
  }
}

export interface TermSummaryStats {
  totalCourses: number;
  passedCount: number;
  failedCount: number;
  needsResitCount: number;
  waitingResultCount: number;
  upcomingExamsCount: number;
}

export function calculateTermStats(
  courses: UniversityCourse[], 
  exams: UniversityExam[]
): TermSummaryStats {
  const courseIds = new Set(courses.map(c => c.id));
  const termExams = exams.filter(e => courseIds.has(e.courseId));

  const todayStr = toLocalISODate();
  let passedCount = 0;
  let failedCount = 0;
  let needsResitCount = 0;
  let waitingResultCount = 0;
  let upcomingExamsCount = 0;

  // Group exams by course to inspect latest status
  for (const c of courses) {
    const cExams = termExams.filter(e => e.courseId === c.id);
    const hasPassed = cExams.some(e => e.resultStatus === 'passed');
    const hasResit = cExams.some(e => e.resultStatus === 'needs_resit');
    const hasFailed = !hasPassed && cExams.some(e => e.resultStatus === 'failed');
    const hasWaiting = cExams.some(e => {
      const isPast = e.date < todayStr;
      return isPast && (!e.resultStatus || e.resultStatus === 'pending');
    });

    if (hasPassed) {
      passedCount++;
    } else if (hasResit) {
      needsResitCount++;
    } else if (hasFailed) {
      failedCount++;
    }

    if (hasWaiting) {
      waitingResultCount++;
    }
  }

  upcomingExamsCount = termExams.filter(e => e.date >= todayStr).length;

  return {
    totalCourses: courses.length,
    passedCount,
    failedCount,
    needsResitCount,
    waitingResultCount,
    upcomingExamsCount,
  };
}
