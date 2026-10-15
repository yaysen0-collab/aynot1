import React, { useState, useEffect } from 'react';
import { CalendarDays, Check, Trash2 } from 'lucide-react';
import { UniversityExam, ExamType } from '../../types';
import { COMMON_EXAM_GROUP, daysUntilDate, formatDaysLabel } from '../../utils/commonExam';
import { toLocalISODate } from '../../utils/calendar';

interface CommonExamDateCardProps {
  /** Aktif dönemdeki ders sayısı */
  courseCount: number;
  exams: UniversityExam[];
  onApply: (date: string, time: string | undefined, examType: ExamType) => Promise<void>;
  onClear: () => Promise<void>;
}

const EXAM_TYPE_OPTIONS: Array<{ id: ExamType; label: string }> = [
  { id: 'donem_sonu', label: 'Dönem Sonu (Final)' },
  { id: 'ara_sinav', label: 'Ara Sınav (Vize)' },
  { id: 'butunleme', label: 'Bütünleme' },
  { id: 'diger', label: 'Diğer' },
];

export const CommonExamDateCard: React.FC<CommonExamDateCardProps> = ({
  courseCount,
  exams,
  onApply,
  onClear,
}) => {
  const commonExams = exams
    .filter((e) => e.commonGroup === COMMON_EXAM_GROUP)
    .sort((a, b) => a.date.localeCompare(b.date));
  const current = commonExams[0];

  const [date, setDate] = useState(current?.date || '');
  const [time, setTime] = useState(current?.time || '');
  const [examType, setExamType] = useState<ExamType>(current?.examType || 'donem_sonu');
  const [isBusy, setIsBusy] = useState(false);

  // Başka cihazdan / buluttan gelen değişikliği forma yansıt
  useEffect(() => {
    if (current) {
      setDate(current.date);
      setTime(current.time || '');
      setExamType(current.examType);
    }
  }, [current?.date, current?.time, current?.examType]);

  const days = current ? daysUntilDate(current.date, toLocalISODate()) : null;
  const canApply = !!date && courseCount > 0 && !isBusy;

  const handleApply = async () => {
    if (!canApply) return;
    setIsBusy(true);
    try {
      await onApply(date, time || undefined, examType);
    } finally {
      setIsBusy(false);
    }
  };

  const handleClear = async () => {
    setIsBusy(true);
    try {
      await onClear();
      setDate('');
      setTime('');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-teal-200/80 dark:border-teal-900/60 shadow-xs space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Ortak Sınav Tarihi</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tüm sınavların aynı gün olduğunda tek tarih gir; aktif dönemdeki bütün derslere uygulanır ve hepsi için aynı geri sayım çalışır.
          </p>
        </div>
        {days !== null && (
          <div className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 text-xs font-bold flex-shrink-0">
            {formatDaysLabel(days)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <label className="block">
          <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sınav tarihi</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500"
          />
        </label>
        <label className="block">
          <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Saat (isteğe bağlı)</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500"
          />
        </label>
        <label className="block">
          <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sınav türü</span>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value as ExamType)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500"
          >
            {EXAM_TYPE_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleApply}
          disabled={!canApply}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition active:scale-95"
        >
          <Check className="w-4 h-4" />
          <span>{current ? 'Tüm derslerde güncelle' : 'Tüm derslere uygula'}</span>
        </button>
        {current && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isBusy}
            className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Ortak tarihi kaldır</span>
          </button>
        )}
        <span className="text-[11px] text-slate-400">
          {courseCount > 0 ? `${courseCount} ders` : 'Önce ders ekleyin'}
          {current && commonExams.length !== courseCount ? ` • ${commonExams.length} derste kayıtlı` : ''}
        </span>
      </div>
    </div>
  );
};
