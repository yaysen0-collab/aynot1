import React, { useState } from 'react';
import { X, Copy, Check, Calendar, ArrowRight } from 'lucide-react';
import { DAY_NAMES_TR } from '../../utils/calendar';
import { ModalShell } from '../common/ModalShell';

interface CopyDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDayIndex: number;
  taskCount: number;
  onConfirmCopy: (targetDayIndexes: number[]) => Promise<void>;
}

export const CopyDayModal: React.FC<CopyDayModalProps> = ({
  isOpen,
  onClose,
  sourceDayIndex,
  taskCount,
  onConfirmCopy,
}) => {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const sourceDayName = DAY_NAMES_TR[sourceDayIndex] || 'Gün';
  // All days except the source day
  const availableDays = [1, 2, 3, 4, 5, 6, 0].filter((d) => d !== sourceDayIndex);

  const toggleDay = (dayIdx: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx]
    );
  };

  const handleSelectAllWorkdays = () => {
    const workdays = [1, 2, 3, 4, 5].filter((d) => d !== sourceDayIndex);
    setSelectedDays(workdays);
  };

  const handleSelectAllDays = () => {
    setSelectedDays(availableDays);
  };

  const handleCopy = async () => {
    if (selectedDays.length === 0) return;
    setIsSubmitting(true);
    try {
      await onConfirmCopy(selectedDays);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} maxWidthClass="max-w-md">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Programı Başka Günlere Kopyala
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {sourceDayName} günündeki {taskCount} görevi çoğaltın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
            <span>Kaynak Gün: <strong>{sourceDayName}</strong></span>
            <span className="font-semibold">{taskCount} Çalışma Görevi</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Hedef Günleri Seçin:
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllWorkdays}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Hafta İçi
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleSelectAllDays}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Tüm Günler
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {availableDays.map((dayIdx) => {
                const dayName = DAY_NAMES_TR[dayIdx];
                const isSelected = selectedDays.includes(dayIdx);
                const isWorkday = dayIdx >= 1 && dayIdx <= 5;

                return (
                  <button
                    key={dayIdx}
                    type="button"
                    onClick={() => toggleDay(dayIdx)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition touch-manipulation active:scale-[0.99] ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100 font-semibold'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-xs sm:text-sm">{dayName}</span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400">
                      {isWorkday ? 'Hafta içi' : 'Hafta sonu'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={selectedDays.length === 0 || isSubmitting}
            className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-sm transition flex items-center gap-1.5"
          >
            <Copy className="w-4 h-4" />
            <span>{selectedDays.length} Güne Kopyala</span>
          </button>
        </div>
    </ModalShell>
  );
};
