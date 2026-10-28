import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  PhoneCall, 
  CheckSquare, 
  AlertTriangle, 
  Users, 
  FileText, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
  Play,
  Check,
  HelpCircle,
  MoveRight,
  Trash2,
  Calendar,
  Smile,
  Meh,
  Frown,
  ChevronDown,
  ChevronUp,
  Languages,
  GraduationCap,
  Download
} from 'lucide-react';
import { 
  Student, 
  StudentNote, 
  WeeklyCallSession, 
  ParentCallSettings,
  StudyTask,
  StudyDayConfig,
  StudySettings,
  DayCheckin,
  DayEnergyRating,
  EnglishCard,
  EnglishDailyGoalSettings,
  UniversityCourse,
  UniversityExam,
  ExamResultStatus
} from '../../types';
import { getCategoryMeta } from '../../utils/categories';
import { isCardDueToday } from '../../utils/englishUtils';
import { DAY_NAMES_TR, toLocalISODate } from '../../utils/calendar';
import { MissedCallInfo } from '../../services/parentCallService';
import { getStudyTypeMeta, formatDuration } from '../../utils/studyUtils';
import { getExamCountdown, getExamTypeTitle, generateExamIcsFile } from '../../utils/universityUtils';
import { ExamResultModal } from '../university/ExamResultModal';
import { getDailyQuote } from '../../utils/quotes';

// "Bugün nasıl?" kartındaki üç seçenek; seçilince düğme kendi rengini alır
const ENERGY_OPTIONS: { rating: DayEnergyRating; emoji: string; label: string; selectedClass: string }[] = [
  {
    rating: 'rahat',
    emoji: '🌿',
    label: 'Rahat',
    selectedClass: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700',
  },
  {
    rating: 'normal',
    emoji: '⚖️',
    label: 'Normal',
    selectedClass: 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-700',
  },
  {
    rating: 'yorucu',
    emoji: '🛋️',
    label: 'Yorucu',
    selectedClass: 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20',
  },
];

export interface ModuleSettings {
  showSchool: boolean;
  showStudy: boolean;
  showEnglish: boolean;
  showNotes: boolean;
}

interface TodayViewProps {
  students: Student[];
  studentNotes: StudentNote[];
  parentCallSession: WeeklyCallSession | null;
  parentCallSettings: ParentCallSettings;
  missedCalls: MissedCallInfo[];
  studyTasks: StudyTask[];
  studyDayConfigs: StudyDayConfig[];
  studySettings: StudySettings;
  todayCheckin: DayCheckin | null;
  englishCards?: EnglishCard[];
  englishSettings?: EnglishDailyGoalSettings;
  universityCourses?: UniversityCourse[];
  universityExams?: UniversityExam[];
  moduleSettings?: ModuleSettings;
  onNavigateToStudents: () => void;
  onSelectStudent: (studentId: string) => void;
  onAddStudent: () => void;
  onOpenParentCalls: () => void;
  onNavigateToStudy: (subTab?: 'plan' | 'dersler' | 'sinavlar' | 'notlar') => void;
  onNavigateToEnglish?: () => void;
  onNavigateToUniversity?: () => void;
  userName?: string;
  onOpenAddStudyTask: (defaultTitle?: string) => void;
  onToggleTaskComplete: (taskId: string, completed: boolean) => Promise<void>;
  onStartPomodoro: (task: StudyTask) => void;
  onSaveDayCheckin: (rating: DayEnergyRating) => Promise<void>;
  onApplyFatigueRelief: (action: 'halve_duration' | 'keep_priority_postpone_rest' | 'postpone_all') => Promise<void>;
  onPostponeIncompleteTasks: (action: 'tomorrow' | 'target_day' | 'delete', targetDayIndex?: number) => Promise<void>;
  onSaveExamResult?: (examId: string, status: ExamResultStatus, score?: string, feedback?: string) => Promise<void>;
  onPostponeExamResultPrompt?: (examId: string) => Promise<void>;
  onAddExamStudyTasks?: (exam: UniversityExam, courseName: string) => Promise<void>;
}

export const TodayView: React.FC<TodayViewProps> = ({
  students,
  studentNotes,
  parentCallSession,
  parentCallSettings,
  missedCalls,
  studyTasks,
  studyDayConfigs,
  studySettings,
  todayCheckin,
  englishCards = [],
  englishSettings,
  universityCourses = [],
  universityExams = [],
  moduleSettings = {
    showSchool: true,
    showStudy: true,
    showEnglish: true,
    showNotes: true,
  },
  userName = 'Zipidola',
  onNavigateToStudents,
  onSelectStudent,
  onAddStudent,
  onOpenParentCalls,
  onNavigateToStudy,
  onNavigateToEnglish,
  onNavigateToUniversity,
  onOpenAddStudyTask,
  onToggleTaskComplete,
  onStartPomodoro,
  onSaveDayCheckin,
  onApplyFatigueRelief,
  onPostponeIncompleteTasks,
  onSaveExamResult,
  onPostponeExamResultPrompt,
  onAddExamStudyTasks,
}) => {
  const [showIncompleteActions, setShowIncompleteActions] = useState(false);
  const [selectedTargetDay, setSelectedTargetDay] = useState<number>(6); // Default Saturday
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
  const [showFatigueModal, setShowFatigueModal] = useState(false);
  const [isSubmittingFatigue, setIsSubmittingFatigue] = useState(false);
  const [activeResultModalExam, setActiveResultModalExam] = useState<UniversityExam | null>(null);

  // Live timer so greeting dynamically updates when hour slot transitions
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // 10 saniyede bir saati kontrol eder
    return () => clearInterval(timer);
  }, []);

  // Format Turkish date
  const currentDayIndex = currentTime.getDay();
  const todayStr = toLocalISODate(currentTime);
  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dateString = `${currentTime.getDate()} ${monthNames[currentTime.getMonth()]} ${currentTime.getFullYear()}, ${dayNames[currentDayIndex]}`;

  // Time-based Turkish greeting according to user specifications:
  // 05:00-11:59 "Günaydın", 12:00-17:59 "İyi günler", 18:00-22:59 "İyi akşamlar", 23:00-04:59 "İyi geceler"
  const hour = currentTime.getHours();
  let greeting = 'İyi günler';
  if (hour >= 5 && hour < 12) {
    greeting = 'Günaydın';
  } else if (hour >= 12 && hour < 18) {
    greeting = 'İyi günler';
  } else if (hour >= 18 && hour < 23) {
    greeting = 'İyi akşamlar';
  } else {
    greeting = 'İyi geceler';
  }


  const dailyQuote = getDailyQuote(currentTime);

  const healthAlertCount = students.filter((s) => s.healthAlert && s.healthAlert.trim() !== '').length;
  const recentNotes = studentNotes.slice(0, 3);

  const studentMap = new Map<string, Student>();
  for (const s of students) {
    studentMap.set(s.id, s);
  }

  // Parent calls calculation
  const isCallDayToday = currentDayIndex === parentCallSettings.callDay;
  const targetDayName = DAY_NAMES_TR[parentCallSettings.callDay] || 'Cuma';

  const activeCallItems = parentCallSession ? parentCallSession.items.filter((i) => !i.excluded) : [];
  const calledCount = activeCallItems.filter((i) => i.called).length;
  const totalToCall = activeCallItems.length;
  const progressPct = totalToCall > 0 ? Math.round((calledCount / totalToCall) * 100) : 0;
  // Kart sadece arama gününde (aranacak veli varsa) ya da geçen haftadan kalan varsa görünür
  const showCallCard = (isCallDayToday && totalToCall > 0) || missedCalls.length > 0;

  // Study tasks calculation for today
  const todayTasks = studyTasks.filter(
    (t) => t.date === todayStr || t.dayOfWeek === currentDayIndex
  );
  const completedStudyCount = todayTasks.filter((t) => t.completed).length;
  const incompleteTasks = todayTasks.filter((t) => !t.completed);
  const studyProgressPct = todayTasks.length > 0 
    ? Math.round((completedStudyCount / todayTasks.length) * 100) 
    : 0;

  // Day type config for today
  const currentDayConfig = studyDayConfigs.find((c) => c.dayOfWeek === currentDayIndex);
  const isSchoolDay = currentDayConfig 
    ? currentDayConfig.dayType === 'okul_gunu' 
    : currentDayIndex >= 1 && currentDayIndex <= 5;

  // Evening check-in trigger
  const isEveningTime = hour >= (studySettings.eveningCheckinHour || 18);
  const isTiring = todayCheckin?.rating === 'yorucu';

  const handleSelectEnergy = async (rating: DayEnergyRating) => {
    setIsSubmittingCheckin(true);
    try {
      await onSaveDayCheckin(rating);
      if (rating === 'yorucu') {
        setShowFatigueModal(true);
      }
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  const handleApplyFatigueAction = async (action: 'halve_duration' | 'keep_priority_postpone_rest' | 'postpone_all') => {
    setIsSubmittingFatigue(true);
    try {
      await onApplyFatigueRelief(action);
      setShowFatigueModal(false);
    } finally {
      setIsSubmittingFatigue(false);
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Greeting Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-800 text-white p-5 sm:p-6 shadow-xl shadow-teal-950/10 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-2 w-20 h-20 rounded-full bg-amber-400/15 blur-xl pointer-events-none" />

        <div className="relative z-10">
          {/* Saate göre selam + ismim */}
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {greeting}, {userName || 'Zipidola'}
          </h2>

          {/* Selamın altında küçük bir şekilde bugünün tarihi */}
          <p className="text-xs text-teal-100/90 font-medium mt-1 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-teal-300" />
            <span>{dateString}</span>
          </p>

          {/* Günün motivasyon sözü, kısa ve sade kart */}
          <div className="mt-3.5 p-3 sm:p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-white/95 shadow-sm">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 text-xs">
                <p className="italic font-medium leading-relaxed text-teal-50">
                  "{dailyQuote.quote}"
                </p>
                {dailyQuote.author && (
                  <span className="block text-[11px] text-teal-200/80 mt-1 font-semibold">
                    — {dailyQuote.author}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid for Cards on Wide Screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* YORGUNLUK DOSTU MOD: "BUGÜN NASILDI?" KARTI */}
        {(moduleSettings.showStudy || moduleSettings.showEnglish) && (
          <div className="md:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-3 shadow-sm space-y-3">
            {/* Tek satır: başlık solda, üç küçük emoji düğmesi sağda */}
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {isEveningTime ? 'Bugün nasıldı?' : 'Bugün nasıl?'}
              </h3>

              <div className="flex gap-1.5">
                {ENERGY_OPTIONS.map((option) => {
                  const isSelected = todayCheckin?.rating === option.rating;
                  return (
                    <button
                      key={option.rating}
                      type="button"
                      disabled={isSubmittingCheckin}
                      onClick={() => handleSelectEnergy(option.rating)}
                      aria-label={option.label}
                      aria-pressed={isSelected}
                      title={option.label}
                      className={`w-11 h-11 rounded-2xl border text-xl flex items-center justify-center transition active:scale-95 ${
                        isSelected
                          ? option.selectedClass
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {option.emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If user marked 'yorucu' and has incomplete tasks, show quick prompt */}
            {todayCheckin?.rating === 'yorucu' && incompleteTasks.length > 0 && moduleSettings.showStudy && (
              <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
                <span className="leading-snug">
                  Yorucu bir gün oldu. Kalan {incompleteTasks.length} görevi hafifletmek ister misiniz?
                </span>
                <button
                  onClick={() => setShowFatigueModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold flex-shrink-0 transition active:scale-95"
                >
                  Önerileri Gör
                </button>
              </div>
            )}
          </div>
        )}

        {/* CARD 1: CUMA / HAFTALIK VELİ ARAMALARI KARTI */}
        {moduleSettings.showSchool && showCallCard && (
          <div 
            onClick={onOpenParentCalls}
            className={`rounded-3xl border p-5 shadow-sm transition cursor-pointer select-none group touch-manipulation active:scale-[0.99] ${
              isCallDayToday
                ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border-amber-300 dark:border-amber-800/80 shadow-amber-900/5'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isCallDayToday
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-600/20'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                }`}>
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {targetDayName} Veli Aramaları
                    </h3>
                    {isCallDayToday && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                        Bugün Arama Günü
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Planlanan saat: {parentCallSettings.callTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                <span>Listeyi Aç</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Geçen haftadan kalan uyarısı */}
            {missedCalls.length > 0 && (
              <div className="mb-3 p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Geçen haftadan aranamayan {missedCalls.length} veli bulunuyor (Öncelikli)</span>
              </div>
            )}

            {/* Progress & Stat */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {totalToCall === 0
                    ? 'Kayıtlı öğrenci bulunmuyor'
                    : `${totalToCall} veliden ${calledCount} tanesi arandı`}
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">%{progressPct}</span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  {isCallDayToday
                    ? `Kalan: ${totalToCall - calledCount} veli`
                    : `Sonraki arama: ${targetDayName} ${parentCallSettings.callTime}`}
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-medium">
                  Dokunarak aramaları yönetin →
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CARD 2: BUGÜNÜN ÇALIŞMA & DERS GÖREVLERİ KARTI (sadece bugün görev varsa) */}
        {moduleSettings.showStudy && todayTasks.length > 0 && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Bugünün Çalışma Görevleri
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {isSchoolDay ? '🏫 Okul Günü' : '🏖️ Boş Gün'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {todayTasks.length} görevden {completedStudyCount} tanesi tamamlandı
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToStudy('plan')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Tüm Program</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                <span>{completedStudyCount} tamamlandı / {incompleteTasks.length} bekliyor</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">%{studyProgressPct}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${studyProgressPct}%` }}
                />
              </div>
            </div>

            {/* Task List items */}
              <div className="space-y-2">
                {todayTasks.map((task) => {
                  const meta = getStudyTypeMeta(task.type);

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        task.completed
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onToggleTaskComplete(task.id, !task.completed)}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all active:scale-90 flex-shrink-0 ${
                            task.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                          aria-label="Görevi tamamla"
                        >
                          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md border ${meta.badgeBg} ${meta.badgeText}`}
                            >
                              {meta.label}
                            </span>
                            {task.time && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {task.time}
                              </span>
                            )}
                            {task.isReduced && (
                              <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">
                                (Hafifletildi)
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5 ${
                              task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                            }`}
                          >
                            {task.title}
                          </div>
                        </div>
                      </div>

                      {/* Pomodoro Start Button */}
                      <button
                        type="button"
                        onClick={() => onStartPomodoro(task)}
                        className="p-1.5 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium flex items-center gap-1 active:scale-95 transition flex-shrink-0"
                        title="Sayacı Başlat"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{task.targetDurationMinutes} dk</span>
                      </button>
                    </div>
                  );
                })}
              </div>

            {/* Gün sonunda yapılmayan görevler için aksiyon paneli (Otomatik kaydırmaz, onay ister) */}
            {incompleteTasks.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowIncompleteActions(!showIncompleteActions)}
                  className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 py-1"
                >
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    ⚠️ Yapılmayan {incompleteTasks.length} görev var. Ne yapmak istersiniz?
                  </span>
                  {showIncompleteActions ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showIncompleteActions && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Otomatik erteleme yapılmaz, tercih size aittir:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => onPostponeIncompleteTasks('tomorrow')}
                        className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-650 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-center transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <MoveRight className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Yarına Kaydır</span>
                      </button>

                      <div className="flex items-center gap-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-1">
                        <select
                          value={selectedTargetDay}
                          onChange={(e) => setSelectedTargetDay(parseInt(e.target.value, 10))}
                          className="bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex-1 px-1 focus:outline-none"
                        >
                          <option value={6}>Cumartesi</option>
                          <option value={0}>Pazar</option>
                          <option value={1}>Pazartesi</option>
                          <option value={2}>Salı</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => onPostponeIncompleteTasks('target_day', selectedTargetDay)}
                          className="px-2 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-[10px] active:scale-95"
                        >
                          Koy
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onPostponeIncompleteTasks('delete')}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-semibold text-center transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Görevleri Sil</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Card 2.5: İNGİLİZCE KELİME KARTLARI & GÜNLÜK HEDEF KARTI (sadece tekrar bekleyen kart varsa) */}
        {moduleSettings.showEnglish && (() => {
          const dueEnglishCards = englishCards.filter((c) => isCardDueToday(c, todayStr));
          if (dueEnglishCards.length === 0) {
            return null;
          }
          const todayLearned = englishCards.filter((c) => c.learnedDate === todayStr).length;
          const targetGoal = (isTiring && englishSettings?.reduceGoalOnFatigue)
            ? Math.max(1, Math.round((englishSettings?.dailyNewWordGoal || 5) / 2))
            : (englishSettings?.dailyNewWordGoal || 5);
          const goalPct = Math.min(100, Math.round((todayLearned / Math.max(1, targetGoal)) * 100));

          return (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4.5 sm:p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Languages className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        İngilizce Kelime Hedefi
                      </h3>
                      {isTiring && englishSettings?.reduceGoalOnFatigue && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          🌱 Yorgunluk Dostu Hedef
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Bugün {todayLearned}/{targetGoal} yeni kelime • {dueEnglishCards.length} kart tekrar bekliyor
                    </p>
                  </div>
                </div>

                {onNavigateToEnglish && (
                  <button
                    onClick={onNavigateToEnglish}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <span>Çalış</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mini Progress Bar */}
              <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span>Bugün {todayLearned}/{targetGoal} yeni kelime</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">%{goalPct}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${goalPct}%` }}
                  />
                </div>
              </div>

              {/* Quick Actions / Status */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  🔔 Bugün tekrar edilecek {dueEnglishCards.length} kelime kartı var.
                </div>

                {onNavigateToEnglish && (
                  <button
                    onClick={onNavigateToEnglish}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition"
                  >
                    Tekrarı Başlat
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Card 2.7: ÜNİVERSİTE SINAV GERİ SAYIMI & SONUÇ SORUSU KARTLARI */}
        {moduleSettings.showStudy && (() => {
          const courseMap = new Map(universityCourses.map((c) => [c.id, c]));

          // 1. Upcoming exams countdown (closest up to 3)
          const upcomingExamsAll = universityExams
            .filter((e) => {
              const cd = getExamCountdown(e, todayStr);
              return !cd.isPast;
            })
            .sort((a, b) => a.date.localeCompare(b.date));

          // Ortak sınav tarihiyle oluşturulan sınavlar (tüm dersler aynı gün) tek satırda gösterilir
          const seenCommonKeys = new Set<string>();
          const upcomingExams = upcomingExamsAll
            .filter((e) => {
              if (!e.commonGroup) return true;
              const key = `${e.commonGroup}-${e.date}`;
              if (seenCommonKeys.has(key)) return false;
              seenCommonKeys.add(key);
              return true;
            })
            .slice(0, 3);
          const commonCourseCount = (e: UniversityExam) =>
            e.commonGroup
              ? upcomingExamsAll.filter((x) => x.commonGroup === e.commonGroup && x.date === e.date).length
              : 0;

          // 2. Exams eligible for result inquiry question ("Sonuç açıklandı mı?")
          const resultInquiryExams = universityExams.filter((e) => {
            const cd = getExamCountdown(e, todayStr);
            return cd.isResultPromptEligible;
          });

          // 3. Exams with 3 days or fewer asking "Çalışma görevi eklemek ister misin?"
          const studyPromptExams = upcomingExams.filter((e) => {
            const cd = getExamCountdown(e, todayStr);
            return cd.isStudyPromptEligible;
          });

          if (upcomingExams.length === 0 && resultInquiryExams.length === 0) {
            return null;
          }

          return (
            <div className="space-y-3">
              {/* Sınav Sonucu Soru Kartları (Sonuç açıklandı mı?) */}
              {resultInquiryExams.map((exam) => {
                const course = courseMap.get(exam.courseId);
                const courseName = course?.name || 'Üniversite Dersi';
                const examTitle = exam.title || getExamTypeTitle(exam.examType);

                return (
                  <div
                    key={`result-prompt-${exam.id}`}
                    className="rounded-3xl bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center flex-shrink-0">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wide">
                            Sınav Sonucu Takibi
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            "{courseName}" {examTitle} sonucu açıklandı mı?
                          </h4>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Sınav Tarihi: {exam.date}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveResultModalExam(exam)}
                        className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs active:scale-95 transition text-center"
                      >
                        Açıklandı (Sonucu Gir) ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onPostponeExamResultPrompt) {
                            onPostponeExamResultPrompt(exam.id);
                          }
                        }}
                        className="py-2 px-3 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-200 font-semibold text-xs hover:bg-teal-50 dark:hover:bg-teal-950/60 transition active:scale-95"
                      >
                        Daha değil (Yarın tekrar sor)
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Yaklaşan Sınavlar Geri Sayım Kartı */}
              {upcomingExams.length > 0 && (() => {
                const primaryExam = upcomingExams[0];
                const primaryCourse = courseMap.get(primaryExam.courseId);
                const primaryIsCommon = !!primaryExam.commonGroup;
                const primaryCourseName = primaryIsCommon
                  ? `Tüm dersler (${commonCourseCount(primaryExam)} ders)`
                  : primaryCourse?.name || 'Üniversite Dersi';
                const primaryCountdown = getExamCountdown(primaryExam, todayStr);
                const isUrgent = primaryCountdown.isImminent; // 7 days or fewer

                return (
                  <div
                    className={`rounded-3xl border p-4.5 sm:p-5 shadow-sm space-y-3.5 transition ${
                      isUrgent
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                        : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                            isUrgent
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          }`}
                        >
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {primaryIsCommon ? 'Üniversite Sınavlarına Kalan Süre' : 'En Yakın Üniversite Sınavı'}
                            </h3>
                            {isUrgent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                                Yaklaşıyor
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {primaryCourseName} • {primaryExam.title || getExamTypeTitle(primaryExam.examType)}
                          </p>
                        </div>
                      </div>

                      {/* .ics export button */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => generateExamIcsFile(primaryExam, primaryCourseName)}
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white/80 dark:hover:bg-slate-800 transition"
                          title="Takvime Ekle (.ics)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToStudy) {
                              onNavigateToStudy('sinavlar');
                            } else if (onNavigateToUniversity) {
                              onNavigateToUniversity();
                            }
                          }}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>Tümü</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Primary Countdown Banner */}
                    <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                          {!primaryIsCommon && primaryCourse?.code ? `${primaryCourse.code} - ` : ''}{primaryCourseName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono">{primaryExam.date}</span>
                          {primaryExam.time && <span>• Saat: {primaryExam.time}</span>}
                        </div>
                      </div>

                      <div
                        className={`rounded-xl font-bold flex-shrink-0 ${
                          primaryIsCommon ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'
                        } ${
                          isUrgent
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {primaryCountdown.label}
                      </div>
                    </div>

                    {/* 3 gün kala çalışma görevi ekleme sorusu */}
                    {primaryCountdown.isStudyPromptEligible && (
                      <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-indigo-950 dark:text-indigo-200">
                          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Bu sınav için çalışma görevi eklemek ister misin?</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          {primaryCountdown.label}. İstersen Çalışma sekmesindeki programa otomatik ekleme yapmadan, senin onayına göre görev ekleyelim.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (onAddExamStudyTasks) {
                                onAddExamStudyTasks(primaryExam, primaryCourseName);
                              } else {
                                onOpenAddStudyTask(`${primaryCourseName} Sınav Tekrarı`);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition active:scale-95"
                          >
                            Evet, Görev Ekle
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Up to 3 exams list if multiple */}
                    {upcomingExams.length > 1 && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Diğer Yaklaşan Sınavlar
                        </div>
                        {upcomingExams.slice(1).map((exam) => {
                          const course = courseMap.get(exam.courseId);
                          const cName = exam.commonGroup
                            ? `Tüm dersler (${commonCourseCount(exam)} ders)`
                            : course?.name || 'Üniversite Dersi';
                          const cd = getExamCountdown(exam, todayStr);

                          return (
                            <div
                              key={exam.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs"
                            >
                              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                                {cName}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span className="font-mono">{exam.date}</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{cd.label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })()}
      </div>

      {/* YORGUNLUK MODU ÖNERİLER MODALİ (Nazik ve suçlayıcı olmayan öneriler) */}
      {showFatigueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-200 dark:border-amber-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-amber-100 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🛋️</span>
                <div>
                  <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                    Yorucu bir gün geçirdin, bugünü hafifletelim mi?
                  </h3>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300">
                    Kendine dinlenme alanı açmak çok doğal ve değerlidir
                  </p>
                </div>
              </div>
            </div>

            {/* Content & Options */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
              <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                Sınıfta ya da okulda yoğun bir günün ardından zihnini dinlendirmek en doğal hakkın. Kalan {incompleteTasks.length} görev için hangisini tercih edersin?
              </p>

              {/* Option 1: Halve duration */}
              <div className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    Süreleri yarıya indir
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Hedef süreleri %50 küçült (örn. 30 dk → 15 dk). Hızlı bir tekrar yapıp bitir.
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSubmittingFatigue}
                  onClick={() => handleApplyFatigueAction('halve_duration')}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition active:scale-95 flex-shrink-0"
                >
                  Uygula
                </button>
              </div>

              {/* Option 2: Keep only priority 1 task */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    Sadece 1 görevi bırak, kalanları yarına taşı
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    İlk sıradaki önemli görevi yap, diğerlerini yarına erteleyip hafifle.
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSubmittingFatigue}
                  onClick={() => handleApplyFatigueAction('keep_priority_postpone_rest')}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold transition active:scale-95 flex-shrink-0"
                >
                  Uygula
                </button>
              </div>

              {/* Option 3: Postpone all */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    Tüm kalanları yarına ertele
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Bu akşamı tamamen dinlenmeye ayır. Yarın daha taze bir zihinle devam et.
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSubmittingFatigue}
                  onClick={() => handleApplyFatigueAction('postpone_all')}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition active:scale-95 flex-shrink-0"
                >
                  Ertele
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Karar her zaman sizindir
              </span>
              <button
                type="button"
                onClick={() => setShowFatigueModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Planı Olduğu Gibi Bırak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sınav Sonucu Soru Modalı */}
      {activeResultModalExam && (() => {
        const c = universityCourses.find((x) => x.id === activeResultModalExam.courseId);
        const cName = c?.name || 'Üniversite Dersi';

        return (
          <ExamResultModal
            isOpen={true}
            onClose={() => setActiveResultModalExam(null)}
            exam={activeResultModalExam}
            courseName={cName}
            onSaveResult={async (examId, status, score, feedback) => {
              if (onSaveExamResult) {
                await onSaveExamResult(examId, status, score, feedback);
              }
            }}
            onPostponePrompt={async (examId) => {
              if (onPostponeExamResultPrompt) {
                await onPostponeExamResultPrompt(examId);
              }
            }}
            onSuggestStudyTask={(cTitle) => {
              onOpenAddStudyTask(`${cTitle} Tekrar Çalışması`);
            }}
          />
        );
      })()}
    </div>
  );
};
