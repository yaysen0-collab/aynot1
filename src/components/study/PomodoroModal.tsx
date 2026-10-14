import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Coffee, 
  BookOpen, 
  Plus, 
  Volume2, 
  Sparkles 
} from 'lucide-react';
import { StudyTask, StudySettings } from '../../types';
import { getStudyTypeMeta, formatDuration } from '../../utils/studyUtils';
import { playChimeSound } from '../../utils/audioAlert';

interface PomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: StudyTask | null;
  settings: StudySettings;
  onSaveTaskDuration: (taskId: string, additionalMinutes: number, markCompleted: boolean) => Promise<void>;
}

export const PomodoroModal: React.FC<PomodoroModalProps> = ({
  isOpen,
  onClose,
  task,
  settings,
  onSaveTaskDuration,
}) => {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [workMinutes, setWorkMinutes] = useState(settings.pomodoroWorkMinutes || 25);
  const [breakMinutes, setBreakMinutes] = useState(settings.pomodoroBreakMinutes || 5);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [totalWorkedSeconds, setTotalWorkedSeconds] = useState(0);
  const [isCompletedAlert, setIsCompletedAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && task) {
      const initialWork = task.targetDurationMinutes || settings.pomodoroWorkMinutes || 25;
      setWorkMinutes(initialWork);
      setBreakMinutes(settings.pomodoroBreakMinutes || 5);
      setTimeLeftSeconds(initialWork * 60);
      setMode('work');
      setIsRunning(false);
      setTotalWorkedSeconds(0);
      setIsCompletedAlert(false);
    }
  }, [isOpen, task, settings]);

  // Tick timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playChimeSound();
            setIsCompletedAlert(true);
            return 0;
          }
          return prev - 1;
        });

        if (mode === 'work') {
          setTotalWorkedSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  if (!isOpen || !task) return null;

  const typeMeta = getStudyTypeMeta(task.type);

  const currentDurationTotal = (mode === 'work' ? workMinutes : breakMinutes) * 60;
  const progressPercent = currentDurationTotal > 0
    ? Math.max(0, Math.min(100, Math.round(((currentDurationTotal - timeLeftSeconds) / currentDurationTotal) * 100)))
    : 0;

  const minutesDisplay = Math.floor(timeLeftSeconds / 60);
  const secondsDisplay = timeLeftSeconds % 60;
  const formattedTime = `${String(minutesDisplay).padStart(2, '0')}:${String(secondsDisplay).padStart(2, '0')}`;

  const handleToggleMode = (newMode: 'work' | 'break') => {
    setIsRunning(false);
    setMode(newMode);
    setIsCompletedAlert(false);
    setTimeLeftSeconds((newMode === 'work' ? workMinutes : breakMinutes) * 60);
  };

  const handleAddFiveMinutes = () => {
    setTimeLeftSeconds((prev) => prev + 5 * 60);
    if (mode === 'work') {
      setWorkMinutes((prev) => prev + 5);
    } else {
      setBreakMinutes((prev) => prev + 5);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompletedAlert(false);
    setTimeLeftSeconds((mode === 'work' ? workMinutes : breakMinutes) * 60);
  };

  const handleFinishAndSave = async (markAsDone: boolean) => {
    setIsSubmitting(true);
    try {
      const minutesSpent = Math.max(1, Math.round(totalWorkedSeconds / 60));
      await onSaveTaskDuration(task.id, minutesSpent, markAsDone);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeMeta.badgeBg} ${typeMeta.badgeText}`}>
                {typeMeta.label}
              </span>
              <span className="text-xs text-slate-400">Pomodoro Sayacı</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate mt-1">
              {task.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex flex-col items-center justify-center text-center space-y-5">
          {/* Work / Break Mode Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleToggleMode('work')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                mode === 'work'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Çalışma ({workMinutes} dk)</span>
            </button>
            <button
              onClick={() => handleToggleMode('break')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                mode === 'break'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Mola ({breakMinutes} dk)</span>
            </button>
          </div>

          {/* Large Countdown Display */}
          <div className="relative w-56 h-56 rounded-full flex flex-col items-center justify-center border-8 border-slate-100 dark:border-slate-800 shadow-inner bg-slate-50/50 dark:bg-slate-850/50">
            {/* SVG circle progress outline */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="100"
                className="stroke-transparent"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="112"
                cy="112"
                r="100"
                className={`transition-all duration-500 ${
                  mode === 'work' ? 'stroke-teal-600' : 'stroke-amber-500'
                }`}
                strokeWidth="8"
                strokeDasharray="628"
                strokeDashoffset={628 - (628 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="relative z-10 flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {formattedTime}
              </span>
              <span className="text-xs font-medium text-slate-400 mt-1">
                {mode === 'work' ? 'Odaklanma Zamanı' : 'Dinlenme Zamanı'}
              </span>
            </div>
          </div>

          {/* Sound & Completion Alert Banner */}
          {isCompletedAlert && (
            <div className="w-full p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Süre tamamlandı! Harika bir odaklanma çıkardınız.</span>
            </div>
          )}

          {/* Timer Controls: Play/Pause, +5m, Reset */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 active:scale-95 transition"
              title="Sıfırla"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-md transition active:scale-95 flex items-center gap-2 ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Duraklat</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>{timeLeftSeconds === 0 ? 'Yeniden Başlat' : 'Başlat'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleAddFiveMinutes}
              className="px-3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 active:scale-95 transition text-xs font-bold"
              title="+5 Dakika Ekle"
            >
              +5 dk
            </button>
          </div>

          {/* Current Session Tracker info */}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Bu oturumda harcanan süre:{' '}
            <strong className="text-teal-600 dark:text-teal-400 font-semibold">
              {formatDuration(Math.round(totalWorkedSeconds / 60))}
            </strong>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleFinishAndSave(false)}
            disabled={isSubmitting}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 transition"
          >
            Süreyi Kaydet ve Çık
          </button>

          <button
            type="button"
            onClick={() => handleFinishAndSave(true)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Görevi Tamamlandı İşaretle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
