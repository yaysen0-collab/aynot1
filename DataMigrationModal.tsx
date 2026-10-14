import React, { useState } from 'react';
import { CloudUpload, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Database } from 'lucide-react';
import { LocalDataSummary, migrateLocalDataToCloud } from '../../services/migrationService';

interface DataMigrationModalProps {
  uid: string;
  summary: LocalDataSummary;
  isOpen: boolean;
  onClose: () => void;
  onMigrated: () => void;
}

export const DataMigrationModal: React.FC<DataMigrationModalProps> = ({
  uid,
  summary,
  isOpen,
  onClose,
  onMigrated
}) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLabel, setCurrentLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  if (!isOpen) return null;

  const handleStartMigration = async () => {
    setIsMigrating(true);
    setErrorMessage(null);
    setProgress(0);

    const result = await migrateLocalDataToCloud(uid, (pct, label) => {
      setProgress(pct);
      setCurrentLabel(label);
    });

    if (result.success) {
      setIsComplete(true);
      setTimeout(() => {
        onMigrated();
        onClose();
      }, 1400);
    } else {
      setIsMigrating(false);
      setErrorMessage(result.error || 'Aktarım sırasında bir hata oluştu. Yerel verileriniz korundu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/40 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-400">
            <CloudUpload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Bu Cihazdaki Verilerini Hesabına Aktar
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Bu cihazda kayıtlı yerel veriler tespit edildi. Bu kayıtları bulut hesabınıza aktararak tüm cihazlarınızdan erişebilirsiniz.
            </p>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-sky-500" />
              Aktarılacak Yerel Kayıtlar
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold">
              {summary.totalCount} Adet
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {summary.breakdown.students > 0 && (
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex flex-col">
                <span className="text-slate-400">Öğrenciler</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{summary.breakdown.students}</span>
              </div>
            )}
            {summary.breakdown.notes > 0 && (
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex flex-col">
                <span className="text-slate-400">Okul Notları</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{summary.breakdown.notes}</span>
              </div>
            )}
            {summary.breakdown.callSessions > 0 && (
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex flex-col">
                <span className="text-slate-400">Veli Aramaları</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{summary.breakdown.callSessions}</span>
              </div>
            )}
            {summary.breakdown.studyTasks > 0 && (
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex flex-col">
                <span className="text-slate-400">Çalışma Planı</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{summary.breakdown.studyTasks}</span>
              </div>
            )}
            {summary.breakdown.englishItems > 0 && (
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex flex-col">
                <span className="text-slate-400">İngilizce</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{summary.breakdown.englishItems}</span>
              </div>
            )}
            {summary.breakdown.universityItems > 0 && (
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex flex-col">
                <span className="text-slate-400">Üniversite</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{summary.breakdown.universityItems}</span>
              </div>
            )}
            {summary.breakdown.ideas > 0 && (
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex flex-col">
                <span className="text-slate-400">Fikirler</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{summary.breakdown.ideas}</span>
              </div>
            )}
            {summary.breakdown.personalNotes > 0 && (
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex flex-col">
                <span className="text-slate-400">Notlar & Etiket</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {summary.breakdown.personalNotes + summary.breakdown.tags}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Safety Note */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            Kayıt kimlikleri birebir korunur (çift kayıt oluşmaz). Aktarım sonrasında cihazınızdaki yerel veriler otomatik silinmez, koruma altında kalır.
          </span>
        </div>

        {/* Progress Bar (during migration) */}
        {isMigrating && (
          <div className="space-y-2 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-800 dark:text-sky-300">
              <span className="truncate max-w-[240px]">{currentLabel || 'Aktarılıyor...'}</span>
              <span>%{progress}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-200 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success message */}
        {isComplete && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Aktarım tamamlandı! Hesabınız güncellendi.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {!isMigrating && !isComplete && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Şimdilik Atla
            </button>
          )}

          <button
            type="button"
            disabled={isMigrating || isComplete}
            onClick={handleStartMigration}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
          >
            {isMigrating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Aktarılıyor...</span>
              </>
            ) : isComplete ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Tamamlandı</span>
              </>
            ) : (
              <>
                <span>Hesabıma Aktar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
