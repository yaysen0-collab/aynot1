import React, { useState } from 'react';
import { X, Check, Calendar, CheckSquare } from 'lucide-react';
import { UniversityCourse, UniversityAssignment, UniversityAssignmentType } from '../../types';

import { toLocalISODate } from '../../utils/calendar';
interface UniversityAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  termId: string;
  courseId: string;
  courseName: string;
  assignmentToEdit?: UniversityAssignment | null;
  onSaveAssignment: (assignment: Partial<UniversityAssignment>) => Promise<void>;
}

export const UniversityAssignmentModal: React.FC<UniversityAssignmentModalProps> = ({
  isOpen,
  onClose,
  termId,
  courseId,
  courseName,
  assignmentToEdit,
  onSaveAssignment,
}) => {
  const [title, setTitle] = useState(assignmentToEdit?.title || '');
  const [type, setType] = useState<UniversityAssignmentType>(assignmentToEdit?.type || 'odev');
  const [dueDate, setDueDate] = useState(assignmentToEdit?.dueDate || toLocalISODate());
  const [notes, setNotes] = useState(assignmentToEdit?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setIsSaving(true);
    try {
      await onSaveAssignment({
        id: assignmentToEdit?.id,
        termId,
        courseId,
        title: title.trim(),
        type,
        dueDate,
        notes: notes.trim() || undefined,
        completed: assignmentToEdit?.completed ?? false,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              {courseName}
            </span>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {assignmentToEdit ? 'Ödevi Düzenle' : 'Yeni Ödev / Proje Ekle'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ödev / Proje Başlığı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="örn. 1. Vize Ödevi: Python Fonksiyonlar"
              required
              className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tür
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as UniversityAssignmentType)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="odev">Ödev</option>
                <option value="proje">Proje</option>
                <option value="rapor">Rapor / Sunum</option>
                <option value="diger">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teslim Tarihi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notlar / Açıklama (İsteğe bağlı)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Teslim şartları, kaynaklar veya hocanın notları..."
              className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
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
              disabled={isSaving || !title.trim() || !dueDate}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <span>{assignmentToEdit ? 'Güncelle' : 'Kaydet'}</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
