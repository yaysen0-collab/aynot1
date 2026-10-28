import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ListPlus, 
  Check, 
  Trash2, 
  Edit3, 
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { UniversityCourse } from '../../types';
import { ModalShell } from '../common/ModalShell';

interface BatchCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTermId: string;
  activeTermName: string;
  onSaveCourses: (courses: Array<Omit<UniversityCourse, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
}

interface ParsedCourseDraft {
  tempId: string;
  name: string;
  code?: string;
  instructor?: string;
  color: string;
  selected: boolean;
}

const COLOR_PALETTE = ['indigo', 'teal', 'sky', 'emerald', 'amber', 'rose', 'purple'];

export const BatchCourseModal: React.FC<BatchCourseModalProps> = ({
  isOpen,
  onClose,
  activeTermId,
  activeTermName,
  onSaveCourses,
}) => {
  const [rawText, setRawText] = useState('');
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [drafts, setDrafts] = useState<ParsedCourseDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleParseText = () => {
    if (!rawText.trim()) return;

    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: ParsedCourseDraft[] = lines.map((line, idx) => {
      // Check if line contains a course code like "BİL102" or "BİL 102" or "BP101 - Algoritmalar"
      let code: string | undefined;
      let instructor: string | undefined;
      let name = line;

      // Extract instructor if formatted with / or - e.g. "Veri Tabanı - Dr. Ahmet Yılmaz"
      const dashParts = line.split(/\s*[-–]\s*/);
      if (dashParts.length >= 2) {
        // Check if first or second part looks like code
        const codeRegex = /^[A-ZÇĞİÖŞÜ]{2,5}\s*\d{2,4}$/i;
        if (codeRegex.test(dashParts[0].trim())) {
          code = dashParts[0].trim().toUpperCase();
          name = dashParts[1].trim();
          if (dashParts.length >= 3) {
            instructor = dashParts.slice(2).join(' - ').trim();
          }
        } else {
          name = dashParts[0].trim();
          // Check if second part has Dr. / Prof. / Öğr. Gör.
          if (/dr|prof|öğr|doç/i.test(dashParts[1])) {
            instructor = dashParts[1].trim();
          }
        }
      } else {
        // Check inline code at start e.g. "BİL102 Nesne Tabanlı Programlama"
        const inlineCodeMatch = line.match(/^([A-ZÇĞİÖŞÜ]{2,5}\s*\d{2,4})\s+(.+)$/i);
        if (inlineCodeMatch) {
          code = inlineCodeMatch[1].replace(/\s+/, '').toUpperCase();
          name = inlineCodeMatch[2].trim();
        }
      }

      return {
        tempId: `draft-c-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        code,
        instructor,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
        selected: true,
      };
    });

    setDrafts(parsed);
    setStep('preview');
  };

  const handleToggleSelect = (tempId: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.tempId === tempId ? { ...d, selected: !d.selected } : d))
    );
  };

  const handleUpdateDraft = (tempId: string, updates: Partial<ParsedCourseDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.tempId === tempId ? { ...d, ...updates } : d))
    );
  };

  const handleRemoveDraft = (tempId: string) => {
    setDrafts((prev) => prev.filter((d) => d.tempId !== tempId));
  };

  const handleSaveAll = async () => {
    const selectedDrafts = drafts.filter((d) => d.selected && d.name.trim());
    if (selectedDrafts.length === 0) return;

    setIsSaving(true);
    try {
      const coursesToSave = selectedDrafts.map((d) => ({
        termId: activeTermId,
        name: d.name.trim(),
        code: d.code?.trim() || undefined,
        instructor: d.instructor?.trim() || undefined,
        color: d.color,
      }));
      await onSaveCourses(coursesToSave);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = drafts.filter((d) => d.selected).length;

  return (
    <ModalShell onClose={onClose} maxWidthClass="max-w-xl">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Toplu Ders Ekleme
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dönem: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeTermName}</span>
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

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {step === 'input' ? (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Ders Listenizi Yapıştırın</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Her satıra bir ders gelecek şekilde kopyalayıp yapıştırabilirsiniz. Sistem ders kodlarını ve adlarını ayıklayacak, eklemeden önce tek tek kontrol edip düzeltebileceksiniz.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ders Listesi Metni
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={8}
                  placeholder={`Örnek:\nBİL101 - Programlamaya Giriş\nBİL102 Veri Tabanı Yönetimi\nWeb Tasarımı ve Kodlama - Öğr. Gör. Mehmet Bey\nAlgoritmalar\nİngilizce I`}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  İpucu: Atatürk Üniversitesi OBS veya e-Öğrenme sisteminden kopyaladığınız ders satırlarını doğrudan yapıştırabilirsiniz.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ayıklanan Dersler ({selectedCount}/{drafts.length} seçili)
                </div>
                <button
                  onClick={() => setStep('input')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  ← Metne Dön
                </button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {drafts.map((d, index) => (
                  <div
                    key={d.tempId}
                    className={`p-3 rounded-2xl border transition-all ${
                      d.selected
                        ? 'border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800/80'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={d.selected}
                        onChange={() => handleToggleSelect(d.tempId)}
                        className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 min-w-0">
                        {/* Course Name */}
                        <div className="sm:col-span-6">
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Ders Adı</label>
                          <input
                            type="text"
                            value={d.name}
                            onChange={(e) => handleUpdateDraft(d.tempId, { name: e.target.value })}
                            className="w-full p-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 font-medium"
                          />
                        </div>

                        {/* Code */}
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Ders Kodu</label>
                          <input
                            type="text"
                            value={d.code || ''}
                            placeholder="örn. BİL101"
                            onChange={(e) => handleUpdateDraft(d.tempId, { code: e.target.value })}
                            className="w-full p-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 uppercase"
                          />
                        </div>

                        {/* Instructor */}
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Hoca (İsteğe bağlı)</label>
                          <input
                            type="text"
                            value={d.instructor || ''}
                            placeholder="Hoca adı"
                            onChange={(e) => handleUpdateDraft(d.tempId, { instructor: e.target.value })}
                            className="w-full p-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDraft(d.tempId)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition"
                        title="Bu satırı kaldır"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          {step === 'input' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={!rawText.trim()}
                onClick={handleParseText}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Önizlemeyi Göster</span>
                <Check className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Geri
              </button>
              <button
                type="button"
                disabled={selectedCount === 0 || isSaving}
                onClick={handleSaveAll}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <span>{selectedCount} Dersi Ekle</span>
                <Check className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
    </ModalShell>
  );
};
