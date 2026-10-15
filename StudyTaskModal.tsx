import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Clock, 
  Calendar, 
  Bell, 
  Copy, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { StudyTask, StudyTaskType } from '../../types';
import { STUDY_TYPES } from '../../utils/studyUtils';
import { DAY_NAMES_TR, getTargetDateOfWeek, toLocalISODate } from '../../utils/calendar';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface StudyTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (taskData: Partial<StudyTask>, replicateDayIndexes?: number[]) => Promise<void>;
  taskToEdit?: StudyTask | null;
  defaultDate?: string;
  defaultDayOfWeek?: number;
  voiceNotesEnabled?: boolean;
}

export const StudyTaskModal: React.FC<StudyTaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  taskToEdit,
  defaultDate,
  defaultDayOfWeek = 1,
  voiceNotesEnabled = true,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<StudyTaskType>('universite');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [time, setTime] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(defaultDayOfWeek);
  const [replicateDays, setReplicateDays] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setType(taskToEdit.type);
        setDurationMinutes(taskToEdit.targetDurationMinutes);
        setTime(taskToEdit.time || '');
        setReminderTime(taskToEdit.reminderTime || '');
        setSelectedDate(taskToEdit.date);
        setSelectedDayOfWeek(taskToEdit.dayOfWeek);
        setReplicateDays([]);
      } else {
        const todayStr = defaultDate || toLocalISODate();
        const dayIdx = defaultDayOfWeek !== undefined ? defaultDayOfWeek : new Date().getDay();
        setTitle('');
        setType('universite');
        setDurationMinutes(30);
        setTime('');
        setReminderTime('');
        setSelectedDate(todayStr);
        setSelectedDayOfWeek(dayIdx);
        setReplicateDays([]);
      }
      setError(null);
    }
  }, [isOpen, taskToEdit, defaultDate, defaultDayOfWeek]);

  if (!isOpen) return null;

  const handleToggleReplicateDay = (dayIdx: number) => {
    setReplicateDays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx]
    );
  };

  const handleInsertVoiceTitle = (text: string) => {
    setTitle((prev) => {
      const needSpace = prev.length > 0 && !prev.endsWith(' ');
      return prev + (needSpace ? ' ' : '') + text;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Lütfen bir ders veya konu adı girin.');
      return;
    }
    if (durationMinutes <= 0) {
      setError('Lütfen geçerli bir çalışma süresi belirtin.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSaveTask(
        {
          title: title.trim(),
          type,
          targetDurationMinutes: durationMinutes,
          time: time.trim() || undefined,
          reminderTime: reminderTime.trim() || undefined,
          date: selectedDate,
          dayOfWeek: selectedDayOfWeek,
        },
        replicateDays.length > 0 ? replicateDays : undefined
      );
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt sırasında hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {taskToEdit ? 'Çalışma Görevini Düzenle' : 'Yeni Çalışma Görevi Ekle'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ders, konu ve hedef çalışma süresi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Voice Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ders / Konu Adı *
              </label>
              {voiceNotesEnabled && (
                <VoiceInputButton onInsertText={handleInsertVoiceTitle} />
              )}
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: İngilizce Kelime Tekrarı, Eğitim Bilimleri, Tez Çalışması..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
            />
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Çalışma Türü *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(STUDY_TYPES) as StudyTaskType[]).map((tKey) => {
                const meta = STUDY_TYPES[tKey];
                const isSelected = type === tKey;

                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setType(tKey)}
                    className={`p-2.5 rounded-2xl border text-xs font-semibold transition flex flex-col items-center justify-center gap-1 active:scale-95 ${
                      isSelected
                        ? `${meta.badgeBg} ${meta.badgeText} border-teal-500 ring-2 ring-teal-500/20`
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${meta.dotColor}`} />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Duration Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Hedef Süre (Dakika) *
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[15, 25, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                    durationMinutes === mins
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {mins} dk
                </button>
              ))}
            </div>
            <input
              type="number"
              min="5"
              max="360"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-32 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Time & Reminder Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Planlanan Saat (Opsiyonel)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>Bildirim Saati (Opsiyonel)</span>
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          {/* Day / Date Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tarih</span>
              </label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  const d = new Date(e.target.value);
                  if (!isNaN(d.getTime())) {
                    setSelectedDayOfWeek(d.getDay());
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Haftanın Günü
              </label>
              <select
                value={selectedDayOfWeek}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSelectedDayOfWeek(val);
                  // Update date to corresponding day of current week
                  const newDate = getTargetDateOfWeek(new Date(), val);
                  setSelectedDate(newDate);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                {DAY_NAMES_TR.map((dayName, idx) => (
                  <option key={dayName} value={idx}>
                    {dayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Replicate to Other Days (Birden fazla güne kopyalama) */}
          {!taskToEdit && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Copy className="w-3.5 h-3.5 text-teal-600" />
                <span>Bu Görevi Başka Günlere de Kopyala:</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Haftalık düzenli tekrar eden bir dersse seçtiğiniz günlere otomatik eklenecektir.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {DAY_NAMES_TR.map((dName, dIdx) => {
                  if (dIdx === selectedDayOfWeek) return null;
                  const isChecked = replicateDays.includes(dIdx);
                  return (
                    <button
                      key={dName}
                      type="button"
                      onClick={() => handleToggleReplicateDay(dIdx)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition active:scale-95 ${
                        isChecked
                          ? 'bg-teal-600 text-white'
                          : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {dName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-sm font-semibold shadow-md shadow-teal-700/20 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Kaydediliyor...' : taskToEdit ? 'Görevi Güncelle' : 'Görevi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
