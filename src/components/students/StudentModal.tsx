import React, { useState, useEffect } from 'react';
import { X, User, Calendar, BookOpen, Phone, AlertTriangle, Heart } from 'lucide-react';
import { Student } from '../../types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Partial<Student>) => Promise<void>;
  studentToEdit?: Student | null;
  existingGroups?: string[];
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  studentToEdit,
  existingGroups = [],
}) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [group, setGroup] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [healthAlert, setHealthAlert] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentToEdit) {
      setName(studentToEdit.name || '');
      setBirthDate(studentToEdit.birthDate || '');
      setGroup(studentToEdit.group || '');
      setParentName(studentToEdit.parentName || '');
      setParentPhone(studentToEdit.parentPhone || '');
      setHealthAlert(studentToEdit.healthAlert || '');
    } else {
      setName('');
      setBirthDate('');
      setGroup(existingGroups[0] || '1-A');
      setParentName('');
      setParentPhone('');
      setHealthAlert('');
    }
    setError(null);
  }, [studentToEdit, isOpen, existingGroups]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Lütfen öğrenci adını giriniz.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        birthDate: birthDate.trim() || undefined,
        group: group.trim() || 'Genel',
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        healthAlert: healthAlert.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {studentToEdit ? 'Öğrenciyi Düzenle' : 'Yeni Öğrenci Ekle'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sadece ad zorunludur, diğer tüm bilgiler isteğe bağlıdır
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
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Ad Soyad (ZORUNLU) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Öğrenci Adı Soyadı <span className="text-teal-600 font-bold">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ali Yılmaz"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Veli Bilgileri */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Veli Bilgileri</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">İsteğe bağlı</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Veli Adı
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Örn: Fatma Yılmaz"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Veli Telefonu
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="Örn: 0532 555 10 20"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Alerji / Sağlık Uyarısı */}
          <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-2">
            <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-600" />
                <span>Alerji & Sağlık Uyarısı</span>
              </div>
              <span className="text-[10px] text-rose-500 font-normal">Kırmızı işaretle gösterilir</span>
            </div>
            <textarea
              rows={2}
              value={healthAlert}
              onChange={(e) => setHealthAlert(e.target.value)}
              placeholder="Örn: Fıstık alerjisi var, astım ilacı kullanıyor..."
              className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none placeholder:text-slate-400"
            />
          </div>

          {/* İKİNCİ PLANDA: Sınıf / Grup & Doğum Tarihi */}
          <details className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3 transition">
            <summary className="text-xs font-medium text-slate-500 dark:text-slate-400 cursor-pointer list-none flex items-center justify-between select-none">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Ek Bilgiler (Sınıf & Doğum Tarihi - İsteğe bağlı)</span>
              </span>
              <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Sınıf / Grup
                </label>
                <input
                  type="text"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="Örn: 4-A veya Anaokulu-Mavi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Doğum Tarihi
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                />
              </div>
            </div>
          </details>

          {/* Buttons */}
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
              {isSubmitting ? 'Kaydediliyor...' : studentToEdit ? 'Değişiklikleri Kaydet' : 'Öğrenciyi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
