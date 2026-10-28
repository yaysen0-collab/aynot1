import React, { useState } from 'react';
import { X, Calendar, Clock, BookOpen, AlertCircle, Check } from 'lucide-react';
import { UniversityCourse, UniversityExam, ExamType } from '../../types';

import { toLocalISODate } from '../../utils/calendar';
import { ModalShell } from '../common/ModalShell';
interface ExamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTermId: string;
  courses: UniversityCourse[];
  examToEdit?: UniversityExam | null;
  onSaveExam: (exam: Partial<UniversityExam>) => Promise<void>;
}

export const ExamEditModal: React.FC<ExamEditModalProps> = ({
  isOpen,
  onClose,
  activeTermId,
  courses,
  examToEdit,
  onSaveExam,
}) => {
  const [courseId, setCourseId] = useState(examToEdit?.courseId || courses[0]?.id || '');
  const [examType, setExamType] = useState<ExamType>(examToEdit?.examType || 'ara_sinav');
  const [title, setTitle] = useState(examToEdit?.title || '');
  const [date, setDate] = useState(examToEdit?.date || toLocalISODate());
  const [time, setTime] = useState(examToEdit?.time || '09:30');
  const [reminderDaysBefore, setReminderDaysBefore] = useState(examToEdit?.reminderDaysBefore ?? 3);
  const [expectedResultDate, setExpectedResultDate] = useState(examToEdit?.expectedResultDate || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !date) return;

    setIsSaving(true);
    try {
      await onSaveExam({
        id: examToEdit?.id,
        termId: examToEdit?.termId || activeTermId,
        courseId,
        examType,
        title: title.trim() || undefined,
        date,
        time: time.trim() || undefined,
        reminderDaysBefore,
        expectedResultDate: expectedResultDate || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {examToEdit ? 'Sınavı Düzenle' : 'Yeni Sınav Ekle'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tarih, saat ve hatırlatma tercihlerini belirleyin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Course select */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ders <span className="text-rose-500">*</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Ders Seçiniz --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `${c.code} - ` : ''}{c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type & Custom Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sınav Türü <span className="text-rose-500">*</span>
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamType)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ara_sinav">Ara Sınav (Vize)</option>
                <option value="donem_sonu">Dönem Sonu (Final)</option>
                <option value="butunleme">Bütünleme</option>
                <option value="diger">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Özel Başlık (İsteğe bağlı)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="örn. 1. Oturum Sınavı"
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sınav Tarihi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sınav Saati
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Reminder settings & Expected Result date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hatırlatma Bildirimi
              </label>
              <select
                value={reminderDaysBefore}
                onChange={(e) => setReminderDaysBefore(parseInt(e.target.value, 10))}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1 gün önce</option>
                <option value={2}>2 gün önce</option>
                <option value={3}>3 gün önce (Varsayılan)</option>
                <option value={5}>5 gün önce</option>
                <option value={7}>1 hafta önce</option>
                <option value={0}>Sadece sınav günü</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Beklenen Sonuç Tarihi (İsteğe bağlı)
              </label>
              <input
                type="date"
                value={expectedResultDate}
                onChange={(e) => setExpectedResultDate(e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Girilirse "Sonuç açıklandı mı?" sorusu bu tarihte sorulur.
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSaving || !courseId || !date}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <span>{examToEdit ? 'Güncelle' : 'Kaydet'}</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
    </ModalShell>
  );
};
