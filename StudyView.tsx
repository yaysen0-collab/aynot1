import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Play, 
  Check, 
  Trash2, 
  Edit3, 
  Copy, 
  Calendar as CalendarIcon, 
  Clock, 
  Flame, 
  Trophy, 
  BarChart3, 
  Sparkles, 
  School, 
  Coffee,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { StudyTask, StudyDayConfig, DayType, StudySettings } from '../../types';
import { DAY_NAMES_TR, getTargetDateOfWeek } from '../../utils/calendar';
import { getStudyTypeMeta, formatDuration, calculateStudyStreak } from '../../utils/studyUtils';
import { CopyDayModal } from './CopyDayModal';

interface StudyViewProps {
  studyTasks: StudyTask[];
  dayConfigs: StudyDayConfig[];
  studySettings: StudySettings;
  onSaveTask: (task: Partial<StudyTask>, replicateDays?: number[]) => Promise<void>;
  onToggleTaskComplete: (taskId: string, completed: boolean) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onEditTask: (task: StudyTask) => void;
  onOpenAddTask: (defaultDate?: string, defaultDayOfWeek?: number) => void;
  onStartPomodoro: (task: StudyTask) => void;
  onSaveDayConfig: (config: StudyDayConfig) => Promise<void>;
  onCopyDayTasks: (sourceDayOfWeek: number, targetDays: number[]) => Promise<void>;
}

export const StudyView: React.FC<StudyViewProps> = ({
  studyTasks,
  dayConfigs,
  studySettings,
  onSaveTask,
  onToggleTaskComplete,
  onDeleteTask,
  onEditTask,
  onOpenAddTask,
  onStartPomodoro,
  onSaveDayConfig,
  onCopyDayTasks,
}) => {
  // Current real day of week: 0 is Sunday, 1 is Monday ... 6 is Saturday
  const todayDayOfWeek = new Date().getDay();
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(todayDayOfWeek);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  // Day order starting from Monday (1) to Sunday (0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];

  // Config map for day type
  const dayConfigMap = useMemo(() => {
    const map = new Map<number, StudyDayConfig>();
    for (const c of dayConfigs) {
      map.set(c.dayOfWeek, c);
    }
    return map;
  }, [dayConfigs]);

  const currentDayConfig = dayConfigMap.get(selectedDayOfWeek) || {
    dayOfWeek: selectedDayOfWeek,
    dayType: selectedDayOfWeek >= 1 && selectedDayOfWeek <= 5 ? 'okul_gunu' : 'bos_gun',
  };

  // Selected date ISO string for this week
  const selectedDateStr = getTargetDateOfWeek(selectedDayOfWeek);

  // Filter tasks for selected day
  const tasksForSelectedDay = useMemo(() => {
    return studyTasks
      .filter((t) => t.dayOfWeek === selectedDayOfWeek || t.date === selectedDateStr)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.time || '99:99').localeCompare(b.time || '99:99');
      });
  }, [studyTasks, selectedDayOfWeek, selectedDateStr]);

  const completedCount = tasksForSelectedDay.filter((t) => t.completed).length;
  const totalCount = tasksForSelectedDay.length;
  const dayProgressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Streak & Weekly Statistics calculation
  const streakInfo = useMemo(() => {
    return calculateStudyStreak(studyTasks);
  }, [studyTasks]);

  const weeklyStats = useMemo(() => {
    // Current week dates
    const currentWeekDateSet = new Set<string>();
    for (const dIdx of orderedDays) {
      currentWeekDateSet.add(getTargetDateOfWeek(dIdx));
    }

    const thisWeekTasks = studyTasks.filter((t) => currentWeekDateSet.has(t.date));
    const totalPlanned = thisWeekTasks.length;
    const totalCompleted = thisWeekTasks.filter((t) => t.completed).length;
    const totalActualMinutes = thisWeekTasks.reduce((acc, t) => acc + (t.actualDurationMinutes || 0), 0);
    const totalTargetMinutes = thisWeekTasks.reduce((acc, t) => acc + (t.targetDurationMinutes || 0), 0);

    // Distribution by subject
    const subjectDistribution: Record<string, { targetMin: number; actualMin: number; count: number }> = {
      universite: { targetMin: 0, actualMin: 0, count: 0 },
      ingilizce: { targetMin: 0, actualMin: 0, count: 0 },
      diger: { targetMin: 0, actualMin: 0, count: 0 },
    };

    for (const t of thisWeekTasks) {
      const typeKey = t.type || 'diger';
      if (!subjectDistribution[typeKey]) {
        subjectDistribution[typeKey] = { targetMin: 0, actualMin: 0, count: 0 };
      }
      subjectDistribution[typeKey].targetMin += t.targetDurationMinutes || 0;
      subjectDistribution[typeKey].actualMin += t.actualDurationMinutes || 0;
      subjectDistribution[typeKey].count += 1;
    }

    return {
      totalPlanned,
      totalCompleted,
      completionRate: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0,
      totalActualMinutes,
      totalTargetMinutes,
      subjectDistribution,
    };
  }, [studyTasks]);

  // Toggle Day Type (Okul Günü vs Boş Gün)
  const handleToggleDayType = async () => {
    const nextType: DayType = currentDayConfig.dayType === 'okul_gunu' ? 'bos_gun' : 'okul_gunu';
    const updated: StudyDayConfig = {
      ...currentDayConfig,
      dayType: nextType,
      notes: nextType === 'okul_gunu' ? 'Anaokulu Çalışma Günü' : 'Boş / Serbest Gün',
    };
    await onSaveDayConfig(updated);
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top Banner & Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Haftalık Çalışma Programı</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ders hedefleri, Pomodoro sayacı ve yorgunluk dostu planlama
          </p>
        </div>

        <button
          onClick={() => onOpenAddTask(selectedDateStr, selectedDayOfWeek)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-xs shadow-sm shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Görev Ekle</span>
        </button>
      </div>

      {/* Weekday Selector Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-1.5 sm:p-2 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-between gap-1 min-w-[340px]">
          {orderedDays.map((dayIdx) => {
            const isSelected = selectedDayOfWeek === dayIdx;
            const isToday = todayDayOfWeek === dayIdx;
            const dayName = DAY_NAMES_TR[dayIdx];
            const cfg = dayConfigMap.get(dayIdx);
            const isSchoolDay = cfg ? cfg.dayType === 'okul_gunu' : dayIdx >= 1 && dayIdx <= 5;

            // Tasks on this day
            const dayDate = getTargetDateOfWeek(dayIdx);
            const dayTasks = studyTasks.filter((t) => t.dayOfWeek === dayIdx || t.date === dayDate);
            const dayTaskCount = dayTasks.length;
            const dayDoneCount = dayTasks.filter((t) => t.completed).length;

            return (
              <button
                key={dayIdx}
                onClick={() => setSelectedDayOfWeek(dayIdx)}
                className={`flex-1 py-2 px-1.5 rounded-2xl text-center transition-all select-none touch-manipulation active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[11px] uppercase tracking-wider">
                    {dayName.slice(0, 3)}
                  </span>
                  {isToday && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-indigo-500'}`} />
                  )}
                </div>

                <div className="mt-1 flex items-center justify-center gap-1">
                  {/* Indicator for School Day vs Free Day */}
                  <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {isSchoolDay ? '🏫' : '🏖️'}
                  </span>
                  {dayTaskCount > 0 && (
                    <span
                      className={`text-[9px] px-1 rounded-full font-semibold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : dayDoneCount === dayTaskCount
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {dayDoneCount}/{dayTaskCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Header Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {DAY_NAMES_TR[selectedDayOfWeek]} Programı
              </h3>
              {selectedDayOfWeek === todayDayOfWeek && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                  Bugün
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedDateStr}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Day Type Button */}
            <button
              onClick={handleToggleDayType}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold border flex items-center gap-1.5 transition active:scale-95 ${
                currentDayConfig.dayType === 'okul_gunu'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-200'
                  : 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/80 text-teal-800 dark:text-teal-200'
              }`}
              title="Günün türünü değiştirmek için dokunun"
            >
              <span>{currentDayConfig.dayType === 'okul_gunu' ? '🏫 Okul Günü' : '🏖️ Boş Gün'}</span>
              <RefreshCw className="w-3 h-3 opacity-60" />
            </button>

            {/* Copy day button */}
            {totalCount > 0 && (
              <button
                onClick={() => setIsCopyModalOpen(true)}
                className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 active:scale-95"
                title="Bu günün programını başka günlere kopyala"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Kopyala</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress mini bar */}
        {totalCount > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
              <span>{totalCount} hedeften {completedCount} tanesi tamamlandı</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">%{dayProgressPct}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${dayProgressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task List for Selected Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tasksForSelectedDay.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white/50 dark:bg-slate-900/40">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Bu gün için henüz çalışma görevi yok
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-4">
              Üniversite dersi, İngilizce tekrarı veya kişisel çalışma hedefinizi ekleyerek başlayabilirsiniz.
            </p>
            <button
              onClick={() => onOpenAddTask(selectedDateStr, selectedDayOfWeek)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Görevi Ekle</span>
            </button>
          </div>
        ) : (
          tasksForSelectedDay.map((task) => {
            const typeMeta = getStudyTypeMeta(task.type);

            return (
              <div
                key={task.id}
                className={`rounded-3xl border p-4 sm:p-4.5 transition bg-white dark:bg-slate-900 shadow-sm ${
                  task.completed
                    ? 'border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Checkbox & Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleTaskComplete(task.id, !task.completed)}
                      className={`mt-0.5 w-6 h-6 rounded-xl flex items-center justify-center border transition-all active:scale-90 flex-shrink-0 ${
                        task.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-500'
                      }`}
                      aria-label="Görevi tamamla"
                    >
                      {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeMeta.badgeBg} ${typeMeta.badgeText}`}
                        >
                          {typeMeta.label}
                        </span>

                        {task.time && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{task.time}</span>
                          </span>
                        )}

                        {task.isReduced && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                            🌱 Hafifletildi ({task.targetDurationMinutes} dk)
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug break-words ${
                          task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Duration Info */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Hedef: <strong>{formatDuration(task.targetDurationMinutes)}</strong></span>
                        {task.actualDurationMinutes > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            • Harcanan: {formatDuration(task.actualDurationMinutes)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Pomodoro & Edit */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onStartPomodoro(task)}
                      className="px-3 py-1.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-sm"
                      title="Pomodoro Sayacını Başlat"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline">Başlat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Düzenle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Progress & Weekly Insights Section */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Haftalık İlerleme ve Seri
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Streak */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-800/60 p-4.5 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Çalışma Serisi
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Üst üste çalışma yapılan günler</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-end">
                  <span>{streakInfo.currentStreak}</span>
                  <span className="text-xs font-semibold text-slate-500">gün</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-amber-100 dark:border-amber-900/50 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>En İyi Seri: <strong>{streakInfo.bestStreak} gün</strong></span>
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                {streakInfo.currentStreak > 0 ? 'Harika gidiyorsun! 👏' : 'Bugün 1 görevle başla! 🎯'}
              </span>
            </div>
          </div>

          {/* Card 2: Weekly Summary */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4.5 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Haftalık Hedef Özeti
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Bu haftaki genel çalışma başarısı</p>
              </div>

              <div className="text-right">
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  %{weeklyStats.completionRate}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Tamamlanan Görev: <strong>{weeklyStats.totalCompleted} / {weeklyStats.totalPlanned}</strong></span>
                <span>Toplam Süre: <strong>{formatDuration(weeklyStats.totalActualMinutes)}</strong></span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${weeklyStats.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subject Breakdown Card */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4.5 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Ders Bazında Dağılım
            </h4>
            <span className="text-[11px] text-slate-400">Bu Hafta</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {Object.entries(weeklyStats.subjectDistribution).map(([typeKey, data]) => {
              const meta = getStudyTypeMeta(typeKey as any);
              return (
                <div
                  key={typeKey}
                  className={`p-3 rounded-2xl border ${meta.badgeBg} flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold ${meta.badgeText}`}>{meta.label}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300">
                      {data.count} görev
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {formatDuration(data.actualMin || data.targetMin)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Copy Day Modal */}
      <CopyDayModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        sourceDayIndex={selectedDayOfWeek}
        taskCount={tasksForSelectedDay.length}
        onConfirmCopy={async (targetDays) => {
          await onCopyDayTasks(selectedDayOfWeek, targetDays);
        }}
      />
    </div>
  );
};
