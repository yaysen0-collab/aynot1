import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Clock, 
  Check, 
  AlertTriangle, 
  HelpCircle, 
  Trash2, 
  CheckCircle2, 
  Edit3,
  FileText
} from 'lucide-react';
import { UniversityCourse, UniversityExam, ExamType } from '../../types';
import {
  parseOfficialExamAnnouncement,
  ParsedExamDraft,
  getExamTypeTitle
} from '../../utils/universityUtils';
import { ModalShell } from '../common/ModalShell';

interface ExamImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTermId: string;
  courses: UniversityCourse[];
  onSaveImportedExams: (exams: Array<Omit<UniversityExam, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
}

export const ExamImportModal: React.FC<ExamImportModalProps> = ({
  isOpen,
  onClose,
  activeTermId,
  courses,
  onSaveImportedExams,
}) => {
  const [rawText, setRawText] = useState('');
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [drafts, setDrafts] = useState<ParsedExamDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleParse = () => {
    if (!rawText.trim()) return;
    const parsed = parseOfficialExamAnnouncement(rawText, courses);
    setDrafts(parsed);
    setStep('preview');
  };

  const handleUpdateDraft = (tempId: string, updates: Partial<ParsedExamDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.tempId !== tempId) return d;
        const updated = { ...d, ...updates };

        // Re-evaluate status based on edits
        if (!updated.date) {
          updated.status = 'uncertain';
          updated.uncertaintyReason = 'Tarih bilgisi eksik. Lütfen tarihi belirleyin.';
        } else if (!updated.matchedCourseId) {
          updated.status = 'unmatched';
          updated.uncertaintyReason = 'Ders seçilmedi. Lütfen listeden bir dersle eşleştirin.';
        } else {
          updated.status = 'matched';
          updated.uncertaintyReason = undefined;
        }

        return updated;
      })
    );
  };

  const handleRemoveDraft = (tempId: string) => {
    setDrafts((prev) => prev.filter((d) => d.tempId !== tempId));
  };

  const handleSaveConfirmed = async () => {
    // Only save matched items that have valid date and course
    const validDrafts = drafts.filter((d) => d.status === 'matched' && d.matchedCourseId && d.date);
    if (validDrafts.length === 0) return;

    setIsSaving(true);
    try {
      const examsToSave = validDrafts.map((d) => ({
        termId: activeTermId,
        courseId: d.matchedCourseId!,
        examType: d.examType,
        date: d.date,
        time: d.time || undefined,
        reminderDaysBefore: 3,
      }));

      await onSaveImportedExams(examsToSave);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const matchedCount = drafts.filter((d) => d.status === 'matched').length;
  const unmatchedCount = drafts.filter((d) => d.status === 'unmatched').length;
  const uncertainCount = drafts.filter((d) => d.status === 'uncertain').length;

  return (
    <ModalShell onClose={onClose} maxWidthClass="max-w-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Sınav Takvimi Metninden İçe Aktar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Resmi sınav duyurusu metnini yapıştırarak pratik sınav kaydı
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

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {step === 'input' ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Otomatik Ayıklama Kuralları</span>
                </div>
                <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li>Okul şifresi veya e-Devlet istemez; sadece kopyaladığınız duyuru metninden çalışır.</li>
                  <li>Metindeki ders adı, tarih (örn: 23 Kasım 2026 veya 23.11.2026) ve saat ayıklanır.</li>
                  <li>Emin olunamayan tarihler kesinlikle tahmin edilip kaydedilmez, düzeltmeniz için işaretlenir.</li>
                  <li>Siz önizlemede onaylayana kadar hiçbir şey veritabanına kaydedilmez.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Resmi Sınav Duyurusu Metni
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={9}
                  placeholder={`Örnek Metin:\nATA AÖF 2026-2027 Güz Yarıyılı Ara Sınav Programı\n1. Oturum - 21.11.2026 Saat: 09:30\nBİL101 Programlamaya Giriş - 21 Kasım 2026 09:30 Ara Sınav\nVeri Tabanı Yönetim Sistemleri - 21.11.2026 14:00 Vize\nWeb Tasarımı ve Kodlama - 22 Kasım 2026 11:00\nAlgoritmalar ve Veri Yapıları - 28.11.2026`}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Summary Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 text-[11px]">
                    ✓ {matchedCount} Eşleşen
                  </span>
                  {unmatchedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 text-[11px]">
                      ⚠️ {unmatchedCount} Eşleşmeyen Ders
                    </span>
                  )}
                  {uncertainCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 text-[11px]">
                      ❓ {uncertainCount} Tarih Belirsiz
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setStep('input')}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                >
                  ← Metne Dön
                </button>
              </div>

              {/* Draft List */}
              <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
                {drafts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Metinden sınav satırı ayıklanamadı. Lütfen metni kontrol edip tekrar deneyin.
                  </div>
                ) : (
                  drafts.map((d) => {
                    const isMatched = d.status === 'matched';
                    const isUnmatched = d.status === 'unmatched';
                    const isUncertain = d.status === 'uncertain';

                    return (
                      <div
                        key={d.tempId}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isMatched
                            ? 'border-emerald-200 dark:border-emerald-800/70 bg-white dark:bg-slate-800/80'
                            : isUnmatched
                            ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20'
                            : 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20'
                        }`}
                      >
                        {/* Top row: original line snippet & status tag */}
                        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-sm">
                            "{d.originalText}"
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                              isMatched
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : isUnmatched
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {isMatched ? 'Hazır' : isUnmatched ? 'Ders Seçin' : 'Tarih Girin'}
                          </span>
                        </div>

                        {/* Editable Form Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                          {/* Course select */}
                          <div className="sm:col-span-5">
                            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Ders</label>
                            <select
                              value={d.matchedCourseId || ''}
                              onChange={(e) => {
                                const cId = e.target.value;
                                const c = courses.find((x) => x.id === cId);
                                handleUpdateDraft(d.tempId, {
                                  matchedCourseId: cId || undefined,
                                  matchedCourseName: c?.name,
                                });
                              }}
                              className="w-full p-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 font-medium"
                            >
                              <option value="">-- Ders Seçiniz --</option>
                              {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.code ? `${c.code} - ` : ''}{c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Exam Type */}
                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Sınav Türü</label>
                            <select
                              value={d.examType}
                              onChange={(e) => handleUpdateDraft(d.tempId, { examType: e.target.value as ExamType })}
                              className="w-full p-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                            >
                              <option value="ara_sinav">Ara Sınav (Vize)</option>
                              <option value="donem_sonu">Dönem Sonu (Final)</option>
                              <option value="butunleme">Bütünleme</option>
                              <option value="diger">Diğer</option>
                            </select>
                          </div>

                          {/* Date */}
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Tarih</label>
                            <input
                              type="date"
                              value={d.date}
                              onChange={(e) => handleUpdateDraft(d.tempId, { date: e.target.value })}
                              className="w-full p-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 font-mono"
                            />
                          </div>

                          {/* Time */}
                          <div className="sm:col-span-2 flex items-end gap-1">
                            <div className="flex-1">
                              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Saat</label>
                              <input
                                type="time"
                                value={d.time || ''}
                                onChange={(e) => handleUpdateDraft(d.tempId, { time: e.target.value })}
                                className="w-full p-1.5 px-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 font-mono"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDraft(d.tempId)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                              title="Bu satırı sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {d.uncertaintyReason && (
                          <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{d.uncertaintyReason}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
                onClick={handleParse}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
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
                disabled={matchedCount === 0 || isSaving}
                onClick={handleSaveConfirmed}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <span>{matchedCount} Sınavı Onayla ve Kaydet</span>
                <Check className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
    </ModalShell>
  );
};
