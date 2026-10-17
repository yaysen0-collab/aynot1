import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Coffee, 
  BookOpen, 
  Sparkles,
  Minimize2,
  Maximize2
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [workMinutes, setWorkMinutes] = useState(settings.pomodoroWorkMinutes || 25);
  const [breakMinutes, setBreakMinutes] = useState(settings.pomodoroBreakMinutes || 5);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [totalWorkedSeconds, setTotalWorkedSeconds] = useState(0);
  const [isCompletedAlert, setIsCompletedAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const timerRef = useRef<any>(null);

  // Modal kapandığında veya görev değiştiğinde başlatma durumunu sıfırla
  useEffect(() => {
    if (!isOpen || !task) {
      setIsInitialized(false);
    }
  }, [isOpen, task]);

  // Sayaç başlatma ve LocalStorage'dan (hafızadan) verileri geri yükleme
  useEffect(() => {
    if (isOpen && task && !isInitialized) {
      const storageKey = `aynot_pomodoro_${task.id}`;
      const savedState = localStorage.getItem(storageKey);
      
      let restored = false;

      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          let newTimeLeft = parsed.timeLeftSeconds;
          let newIsRunning = parsed.isRunning;
          let newTotalWorked = parsed.totalWorkedSeconds;

          // Eğer sayaç çalışırken sayfa yenilendiyse veya kapatıldıysa geçen süreyi hesapla
          if (parsed.isRunning && parsed.lastTickTime) {
            const elapsedSeconds = Math.floor((Date.now() - parsed.lastTickTime) / 1000);
            newTimeLeft -= elapsedSeconds;
            
            if (newTimeLeft <= 0) {
              if (parsed.mode === 'work') {
                newTotalWorked += parsed.timeLeftSeconds; // Sadece kalan süreyi ekle
              }
              newTimeLeft = 0;
              newIsRunning = false;
            } else {
              if (parsed.mode === 'work') {
                newTotalWorked += elapsedSeconds;
              }
            }
          }

          setMode(parsed.mode);
          setWorkMinutes(parsed.workMinutes);
          setBreakMinutes(parsed.breakMinutes);
          setTimeLeftSeconds(Math.max(0, newTimeLeft));
          setIsRunning(newIsRunning);
          setTotalWorkedSeconds(newTotalWorked);
          setIsCompletedAlert(newTimeLeft <= 0);
          setIsExpanded(true);
          restored = true;
        } catch (e) {
          console.error("Pomodoro hafızadan yüklenirken hata oluştu:", e);
        }
      }

      // Eğer hafızada kayıt yoksa sıfırdan başlat
      if (!restored) {
        const initialWork = task.targetDurationMinutes || settings.pomodoroWorkMinutes || 25;
        setWorkMinutes(initialWork);
        setBreakMinutes(settings.pomodoroBreakMinutes || 5);
        setTimeLeftSeconds(initialWork * 60);
        setMode('work');
        setIsRunning(false);
        setTotalWorkedSeconds(0);
        setIsCompletedAlert(false);
        setIsExpanded(true);
      }
      
      setIsInitialized(true);
    }
  }, [isOpen, task, settings, isInitialized]);

  // Geri sayım (Tick) işlemi
  useEffect(() => {
    if (isRunning && isInitialized) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playChimeSound();
            setIsCompletedAlert(true);
            setIsExpanded(true); 
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
  }, [isRunning, mode, isInitialized]);

  // Herhangi bir değişiklik olduğunda (saniye dahil) durumu LocalStorage'a kaydet
  useEffect(() => {
    if (isOpen && task && isInitialized) {
      const storageKey = `aynot_pomodoro_${task.id}`;
      const stateToSave = {
        mode,
        workMinutes,
        breakMinutes,
        timeLeftSeconds,
        isRunning,
        totalWorkedSeconds,
        lastTickTime: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [isOpen, task, mode, workMinutes, breakMinutes, timeLeftSeconds, isRunning, totalWorkedSeconds, isInitialized]);

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
      
      // Kaydedip çıkınca hafızadaki sayacı temizliyoruz (yeni başlatıldığında sıfır gelsin diye)
      if (task) {
        localStorage.removeItem(`aynot_pomodoro_${task.id}`);
      }
      
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-28 md:bottom-8 left-4 md:left-[272px] lg:left-[312px] z-[100] bg-white dark:bg-slate-900 rounded-full shadow-2xl shadow-teal-900/10 border border-slate-200/90 dark:border-slate-800 flex items-center p-1.5 pr-2 gap-2 animate-in slide-in-from-bottom-5 duration-300">
        <button 
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition group"
          title="Büyüt"
        >
          <div className={`w-2 h-2 rounded-full ${isRunning ? (mode === 'work' ? 'bg-teal-500 animate-pulse' : 'bg-amber-500 animate-pulse') : 'bg-slate-300 dark:bg-slate-600'}`} />
          <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-teal-600 transition">
            {formattedTime}
          </span>
          <Maximize2 className="w-3 h-3 text-slate-400 group-hover:text-teal-600" />
        </button>
        
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`p-2 rounded-full text-white shadow-sm transition active:scale-95 ${
            isRunning 
              ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
              : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-28 md:bottom-8 left-4 md:left-[272px] lg:left-[312px] z-[100] w-[280px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-teal-900/10 border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
        <div 
          className={`h-full transition-all duration-500 ${mode === 'work' ? 'bg-teal-500' : 'bg-amber-500'}`} 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>

      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border ${typeMeta.badgeBg} ${typeMeta.badgeText}`}>
            {typeMeta.label}
          </span>
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Küçült"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col items-center justify-center text-center">
        
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 mb-5">
          <button
            onClick={() => handleToggleMode('work')}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 ${
              mode === 'work'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Odak</span>
          </button>
          <button
            onClick={() => handleToggleMode('break')}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 ${
              mode === 'break'
                ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Coffee className="w-3 h-3" />
            <span>Mola</span>
          </button>
        </div>

        <div className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-1">
          {formattedTime}
        </div>
        
        <div className="text-[11px] font-medium text-slate-400 mb-5">
          Bu oturumda harcanan süre: <strong className="text-teal-600 dark:text-teal-400">{formatDuration(Math.round(totalWorkedSeconds / 60))}</strong>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition"
            title="Sıfırla"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-6 py-2.5 rounded-2xl text-white font-bold text-sm shadow-md transition active:scale-95 flex items-center gap-2 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Duraklat</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Başlat</span>
              </>
            )}
          </button>

          <button
            onClick={handleAddFiveMinutes}
            className="px-2.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition text-[11px] font-bold"
            title="+5 Dakika Ekle"
          >
            +5 dk
          </button>
        </div>
      </div>

      {isCompletedAlert && (
        <div className="mx-4 mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1.5 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Süre tamamlandı! Harika iş.</span>
        </div>
      )}

      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => handleFinishAndSave(true)}
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Görevi Tamamlandı İşaretle</span>
        </button>
        <button
          type="button"
          onClick={() => handleFinishAndSave(false)}
          disabled={isSubmitting}
          className="w-full py-2 rounded-xl text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
        >
          Sadece Süreyi Kaydet ve Çık
        </button>
      </div>
    </div>
  );
};
