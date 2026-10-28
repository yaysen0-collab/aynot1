import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Calendar,
  Clock,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { UniversityCourse, UniversityExam, ExamResultStatus } from '../../types';
import { getExamTypeTitle } from '../../utils/universityUtils';
import { ModalShell } from '../common/ModalShell';

interface ExamResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: UniversityExam;
  courseName: string;
  onSaveResult: (
    examId: string, 
    status: ExamResultStatus, 
    score?: string, 
    feedback?: string
  ) => Promise<void>;
  onPostponePrompt: (examId: string) => Promise<void>; // "Daha değil" -> ertesi güne erteler
  onSuggestResitExam?: (exam: UniversityExam) => void; // Supportively suggest adding resit exam
  onSuggestStudyTask?: (courseName: string) => void; // Supportively suggest adding study task
}

export const ExamResultModal: React.FC<ExamResultModalProps> = ({
  isOpen,
  onClose,
  exam,
  courseName,
  onSaveResult,
  onPostponePrompt,
  onSuggestResitExam,
  onSuggestStudyTask,
}) => {
  const [step, setStep] = useState<'initial_question' | 'input_details' | 'feedback_warm'>('initial_question');
  const [status, setStatus] = useState<ExamResultStatus>('passed');
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const examTitle = exam.title || getExamTypeTitle(exam.examType);

  const handleSelectNotYet = async () => {
    setIsSubmitting(true);
    try {
      await onPostponePrompt(exam.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAnnounced = () => {
    setStep('input_details');
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveResult(exam.id, status, score.trim() || undefined, feedback.trim() || undefined);
      setStep('feedback_warm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} maxWidthClass="max-w-md">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Sınav Sonucu Takibi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {courseName} • {examTitle}
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

        {/* Body based on step */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {step === 'initial_question' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 text-center space-y-1.5">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  "{courseName}" sınav sonucu açıklandı mı?
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {exam.date} tarihli sınav üzerinden süre geçti. Sonucu kaydetmek ister misiniz?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSelectNotYet}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-center transition active:scale-95"
                >
                  Daha değil
                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                    (Yarın tekrar hatırlat)
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSelectAnnounced}
                  className="p-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-center shadow-sm transition active:scale-95"
                >
                  Açıklandı ✓
                  <span className="block text-[10px] text-teal-100 font-normal mt-0.5">
                    (Sonucu gir)
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 'input_details' && (
            <form onSubmit={handleSubmitResult} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Sonuç Durumu
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('passed')}
                    className={`p-3 rounded-2xl border text-center font-semibold transition active:scale-95 ${
                      status === 'passed'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="block text-base mb-0.5">🎉</span>
                    Geçtim
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('needs_resit')}
                    className={`p-3 rounded-2xl border text-center font-semibold transition active:scale-95 ${
                      status === 'needs_resit'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-2 ring-amber-500/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="block text-base mb-0.5">📚</span>
                    Bütünleme
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('failed')}
                    className={`p-3 rounded-2xl border text-center font-semibold transition active:scale-95 ${
                      status === 'failed'
                        ? 'border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 ring-2 ring-rose-500/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="block text-base mb-0.5">🌱</span>
                    Kaldım
                  </button>
                </div>
              </div>

              {/* Optional Score / Grade */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Puan veya Harf Notu (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="örn. 85, AA, BB, 60..."
                  className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Feedback Note */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kişisel Not (İsteğe bağlı)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={2}
                  placeholder="örn. 2. ünite sorularında zorlandım, genel olarak iyi geçti..."
                  className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('initial_question')}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm active:scale-95 transition"
                >
                  Kaydet
                </button>
              </div>
            </form>
          )}

          {step === 'feedback_warm' && (
            <div className="py-3 text-center space-y-4 animate-in zoom-in-95 duration-200">
              {status === 'passed' ? (
                <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                  <div className="text-3xl">🎉 👏</div>
                  <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                    Tebrikler, harika bir başarı!
                  </h4>
                  <p className="text-xs text-emerald-800/90 dark:text-emerald-300 leading-relaxed">
                    Emeklerinin karşılığını almak çok değerli. Bir dersi daha başarıyla geride bıraktın!
                  </p>
                  {score && (
                    <div className="inline-block mt-2 px-3 py-1 rounded-full bg-white dark:bg-emerald-900 font-bold text-emerald-700 dark:text-emerald-200 text-sm">
                      Not: {score}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Hiç sorun değil, öğrenme bir yolculuktur
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Bazen sınavlar istediğimiz gibi geçmeyebilir; bu durum çok doğaldır ve asla seni tanımlamaz. Kendine nazik davranarak adım adım toparlayabiliriz.
                  </p>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      Destekleyici Öneriler:
                    </div>

                    {status === 'needs_resit' && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onSuggestResitExam) onSuggestResitExam(exam);
                        }}
                        className="w-full p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold flex items-center justify-between text-left transition"
                      >
                        <span>+ Bütünleme Sınavı Ekle</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onSuggestStudyTask) onSuggestStudyTask(courseName);
                      }}
                      className="w-full p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 font-semibold flex items-center justify-between text-left transition"
                    >
                      <span>+ Çalışma Planına Tekrar Görevi Ekle</span>
                      <BookOpen className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white font-semibold transition"
              >
                Tamam
              </button>
            </div>
          )}
        </div>
    </ModalShell>
  );
};
