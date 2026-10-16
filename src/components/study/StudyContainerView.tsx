import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Clock, 
  FileText, 
  Plus, 
  Calendar, 
  ListPlus, 
  ChevronRight, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Download, 
  Sparkles, 
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Copy,
  Tag as TagIcon
} from 'lucide-react';
import { 
  StudyTask, 
  StudyDayConfig, 
  StudySettings, 
  UniversityTerm, 
  UniversityCourse, 
  UniversityExam, 
  UniversityNote, 
  UniversityAssignment,
  ExamResultStatus,
  ExamType,
  UniversityNoteTag
} from '../../types';
import { StudyView } from './StudyView';
import { CourseDetailView } from '../university/CourseDetailView';
import { BatchCourseModal } from '../university/BatchCourseModal';
import { ExamImportModal } from '../university/ExamImportModal';
import { ExamEditModal } from '../university/ExamEditModal';
import { ExamResultModal } from '../university/ExamResultModal';
import { UniversityNoteModal } from '../university/UniversityNoteModal';
import { CommonExamDateCard } from '../university/CommonExamDateCard';
import { 
  calculateTermStats, 
  getExamCountdown, 
  getExamTypeTitle, 
  generateExamIcsFile,
  getExamResultBadge 
} from '../../utils/universityUtils';

import { toLocalISODate } from '../../utils/calendar';
export type StudySubTab = 'plan' | 'dersler' | 'sinavlar' | 'notlar';

interface StudyContainerViewProps {
  // Plan (StudyView) props
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

  // University (Courses, Exams, Notes, Assignments) props
  terms: UniversityTerm[];
  courses: UniversityCourse[];
  exams: UniversityExam[];
  notes: UniversityNote[];
  assignments: UniversityAssignment[];
  onSaveTerm: (term: UniversityTerm) => Promise<void>;
  onSetActiveTerm: (termId: string) => Promise<void>;
  onDeleteTerm: (termId: string) => Promise<void>;
  onSaveCourse: (course: UniversityCourse) => Promise<void>;
  onSaveMultipleCourses: (courses: Array<Omit<UniversityCourse, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
  onSaveExam: (exam: Partial<UniversityExam>) => Promise<void>;
  onSaveMultipleExams: (exams: Array<Omit<UniversityExam, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  onDeleteExam: (examId: string) => Promise<void>;
  onSaveNote: (note: Partial<UniversityNote>) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onSaveAssignment: (assignment: Partial<UniversityAssignment>) => Promise<void>;
  onToggleAssignment: (assignmentId: string, completed: boolean) => Promise<void>;
  onDeleteAssignment: (assignmentId: string) => Promise<void>;
  onSaveExamResult: (examId: string, status: ExamResultStatus, score?: string, feedback?: string) => Promise<void>;
  onPostponeResultPrompt: (examId: string) => Promise<void>;
  onSuggestStudyTask?: (courseName: string) => void;
  /** Ortak sınav tarihi: tek tarihi aktif dönemdeki tüm derslere uygular / kaldırır */
  onApplyCommonExamDate?: (date: string, time: string | undefined, examType: ExamType) => Promise<void>;
  onClearCommonExamDate?: () => Promise<void>;

  // Common
  voiceNotesEnabled?: boolean;
  initialSubTab?: StudySubTab;
  initialSelectedCourseId?: string | null;
  onClearInitialSelectedCourseId?: () => void;
}

export const StudyContainerView: React.FC<StudyContainerViewProps> = ({
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
  terms,
  courses,
  exams,
  notes,
  assignments,
  onSaveTerm,
  onSetActiveTerm,
  onDeleteTerm,
  onSaveCourse,
  onSaveMultipleCourses,
  onDeleteCourse,
  onSaveExam,
  onSaveMultipleExams,
  onDeleteExam,
  onSaveNote,
  onDeleteNote,
  onSaveAssignment,
  onToggleAssignment,
  onDeleteAssignment,
  onSaveExamResult,
  onPostponeResultPrompt,
  onSuggestStudyTask,
  onApplyCommonExamDate,
  onClearCommonExamDate,
  voiceNotesEnabled = true,
  initialSubTab = 'plan',
  initialSelectedCourseId,
  onClearInitialSelectedCourseId,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<StudySubTab>(initialSubTab);

  // Active term
  const activeTerm = terms.find((t) => t.isActive && !t.isArchived) || terms[0] || null;
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Term management modals
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [newTermName, setNewTermName] = useState('');

  // Course modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<UniversityCourse | null>(null);
  const [singleCourseName, setSingleCourseName] = useState('');
  const [singleCourseCode, setSingleCourseCode] = useState('');
  const [singleCourseInstructor, setSingleCourseInstructor] = useState('');
  const [singleCourseColor, setSingleCourseColor] = useState('indigo');

  // Batch modals & Exam modals
  const [isBatchCourseModalOpen, setIsBatchCourseModalOpen] = useState(false);
  const [isExamImportModalOpen, setIsExamImportModalOpen] = useState(false);
  const [isExamEditModalOpen, setIsExamEditModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<UniversityExam | null>(null);
  const [activeResultModalExam, setActiveResultModalExam] = useState<UniversityExam | null>(null);

  // Course Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<UniversityNote | null>(null);
  const [targetCourseForNote, setTargetCourseForNote] = useState<UniversityCourse | null>(null);

  // Filters for "Ders Notları" subtab
  const [notesSearchQuery, setNotesSearchQuery] = useState('');
  const [notesSelectedCourseId, setNotesSelectedCourseId] = useState<string>('all');
  const [notesSelectedTag, setNotesSelectedTag] = useState<string>('all');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Filter items by active term
  const termCourses = activeTerm ? courses.filter((c) => c.termId === activeTerm.id) : [];
  const termExams = activeTerm ? exams.filter((e) => e.termId === activeTerm.id) : [];
  const termNotes = activeTerm ? notes.filter((n) => n.termId === activeTerm.id) : [];
  const termAssignments = activeTerm ? assignments.filter((a) => a.termId === activeTerm.id) : [];

  const stats = calculateTermStats(termCourses, termExams);
  const todayStr = toLocalISODate();

  const courseMap = useMemo(() => {
    return new Map<string, UniversityCourse>(courses.map((c) => [c.id, c]));
  }, [courses]);

  // Sync initialSubTab
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Sync initialSelectedCourseId
  useEffect(() => {
    if (initialSelectedCourseId) {
      setSelectedCourseId(initialSelectedCourseId);
      setActiveSubTab('dersler');
      onClearInitialSelectedCourseId?.();
    }
  }, [initialSelectedCourseId, onClearInitialSelectedCourseId]);

  // Upcoming exams with countdowns
  const upcomingExams = useMemo(() => {
    return termExams
      .filter((e) => {
        const cd = getExamCountdown(e, todayStr);
        return !cd.isPast;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [termExams, todayStr]);

  // Exams needing result check
  const resultInquiryExams = useMemo(() => {
    return termExams.filter((e) => {
      const cd = getExamCountdown(e, todayStr);
      return cd.isResultPromptEligible;
    });
  }, [termExams, todayStr]);

  // Handle term creation
  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermName.trim()) return;

    const termId = `term-${Date.now()}`;
    const newTerm: UniversityTerm = {
      id: termId,
      name: newTermName.trim(),
      isActive: true,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await onSaveTerm(newTerm);
    await onSetActiveTerm(termId);
    setNewTermName('');
    setIsTermModalOpen(false);
  };

  // Handle single course save
  const handleSaveSingleCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTerm || !singleCourseName.trim()) return;

    const course: UniversityCourse = {
      id: courseToEdit?.id || `course-${Date.now()}`,
      termId: activeTerm.id,
      name: singleCourseName.trim(),
      code: singleCourseCode.trim() || undefined,
      instructor: singleCourseInstructor.trim() || undefined,
      color: singleCourseColor,
      createdAt: courseToEdit?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await onSaveCourse(course);
    setIsCourseModalOpen(false);
    setCourseToEdit(null);
  };

  // If viewing CourseDetailView
  const selectedCourse = selectedCourseId ? termCourses.find((c) => c.id === selectedCourseId) : null;
  if (selectedCourse && activeSubTab === 'dersler') {
    const cExams = termExams.filter((e) => e.courseId === selectedCourse.id);
    const cNotes = termNotes.filter((n) => n.courseId === selectedCourse.id);
    const cAssignments = termAssignments.filter((a) => a.courseId === selectedCourse.id);

    return (
      <CourseDetailView
        course={selectedCourse}
        exams={cExams}
        notes={cNotes}
        assignments={cAssignments}
        onBack={() => setSelectedCourseId(null)}
        onEditCourse={(c) => {
          setCourseToEdit(c);
          setSingleCourseName(c.name);
          setSingleCourseCode(c.code || '');
          setSingleCourseInstructor(c.instructor || '');
          setSingleCourseColor(c.color || 'indigo');
          setIsCourseModalOpen(true);
        }}
        onDeleteCourse={async (cId) => {
          await onDeleteCourse(cId);
          setSelectedCourseId(null);
        }}
        onSaveExam={onSaveExam}
        onDeleteExam={onDeleteExam}
        onSaveNote={onSaveNote}
        onDeleteNote={onDeleteNote}
        onSaveAssignment={onSaveAssignment}
        onToggleAssignment={onToggleAssignment}
        onDeleteAssignment={onDeleteAssignment}
        onSaveExamResult={onSaveExamResult}
        onPostponeResultPrompt={onPostponeResultPrompt}
        onSuggestStudyTask={onSuggestStudyTask}
        voiceNotesEnabled={voiceNotesEnabled}
      />
    );
  }

  // Filtered University Notes for 'notlar' subtab
  const filteredNotes = termNotes.filter((note) => {
    if (notesSelectedCourseId !== 'all' && note.courseId !== notesSelectedCourseId) return false;
    if (notesSelectedTag !== 'all' && note.tag !== notesSelectedTag) return false;
    if (notesSearchQuery.trim()) {
      const q = notesSearchQuery.toLowerCase();
      const matchTitle = (note.title || '').toLowerCase().includes(q);
      const matchContent = (note.content || '').toLowerCase().includes(q);
      return matchTitle || matchContent;
    }
    return true;
  }).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top 4 Sub-Tabs Bar: Plan | Dersler | Sınavlar | Ders Notları */}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-1 shadow-xs overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => {
            setSelectedCourseId(null);
            setActiveSubTab('plan');
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 whitespace-nowrap ${
            activeSubTab === 'plan'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Plan</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCourseId(null);
            setActiveSubTab('dersler');
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 whitespace-nowrap ${
            activeSubTab === 'dersler'
              ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Dersler ({termCourses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCourseId(null);
            setActiveSubTab('sinavlar');
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 whitespace-nowrap relative ${
            activeSubTab === 'sinavlar'
              ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Sınavlar</span>
          {upcomingExams.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold">
              {upcomingExams.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCourseId(null);
            setActiveSubTab('notlar');
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 whitespace-nowrap ${
            activeSubTab === 'notlar'
              ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Ders Notları ({termNotes.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: PLAN (Mevcut Haftalık Çalışma Programı & Pomodoro) */}
      {activeSubTab === 'plan' && (
        <StudyView
          studyTasks={studyTasks}
          dayConfigs={dayConfigs}
          studySettings={studySettings}
          onSaveTask={onSaveTask}
          onToggleTaskComplete={onToggleTaskComplete}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onOpenAddTask={onOpenAddTask}
          onStartPomodoro={onStartPomodoro}
          onSaveDayConfig={onSaveDayConfig}
          onCopyDayTasks={onCopyDayTasks}
        />
      )}

      {/* SUB-TAB 2: DERSLER (Üniversite Ders Listesi & Detayları) */}
      {activeSubTab === 'dersler' && (
        <div className="space-y-4">
          {/* Active Term Header Card */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-indigo-100 text-xs font-semibold backdrop-blur-sm">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Atatürk Üniversitesi Açıköğretim • Bilgisayar Programcılığı</span>
                </div>

                {/* Term selector & New term trigger */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={activeTerm?.id || ''}
                    onChange={(e) => onSetActiveTerm(e.target.value)}
                    className="bg-white/15 hover:bg-white/20 text-white text-xs font-bold rounded-xl px-2.5 py-1.5 border border-white/20 focus:outline-none cursor-pointer"
                  >
                    {terms.map((t) => (
                      <option key={t.id} value={t.id} className="text-slate-900">
                        {t.name} {t.isArchived ? '(Arşiv)' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsTermModalOpen(true)}
                    className="p-1.5 rounded-xl bg-white/15 hover:bg-white/20 text-white transition active:scale-95"
                    title="Yeni Dönem Ekle"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {activeTerm?.name || 'Üniversite Dönemi'}
                </h2>
                <p className="text-xs text-indigo-200/90 mt-1 max-w-md">
                  Derslerinizi, sınav ve ödevlerinizi takip edin; ders kartına tıklayarak not defterine ulaşın.
                </p>
              </div>

              {/* Stats (4) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="text-[11px] text-indigo-200 font-medium">Toplam Ders</div>
                  <div className="text-lg font-bold">{stats.totalCourses}</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30">
                  <div className="text-[11px] text-emerald-200 font-medium">Geçilen Dersler</div>
                  <div className="text-lg font-bold text-emerald-100">{stats.passedCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/20 backdrop-blur-sm border border-amber-400/30">
                  <div className="text-[11px] text-amber-200 font-medium">Bütünleme / Kalan</div>
                  <div className="text-lg font-bold text-amber-100">
                    {stats.needsResitCount + stats.failedCount}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-sky-500/20 backdrop-blur-sm border border-sky-400/30">
                  <div className="text-[11px] text-sky-200 font-medium">Sonuç Bekleyen</div>
                  <div className="text-lg font-bold text-sky-100">{stats.waitingResultCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions for Courses */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Dönem Dersleri ({termCourses.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBatchCourseModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>Toplu Ders Ekle</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCourseToEdit(null);
                  setSingleCourseName('');
                  setSingleCourseCode('');
                  setSingleCourseInstructor('');
                  setIsCourseModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition active:scale-95 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tek Ders Ekle</span>
              </button>
            </div>
          </div>

          {/* Course List */}
          {termCourses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white/50 dark:bg-slate-900/50 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Bu döneme ait ders bulunmuyor
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  OBS veya ders listesinden kopyaladığınız satırları tek tuşla ekleyebilir veya tek tek ders tanımlayabilirsiniz.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {termCourses.map((course) => {
                const cExams = termExams.filter((e) => e.courseId === course.id);
                const cNotes = termNotes.filter((n) => n.courseId === course.id);
                const cAssigns = termAssignments.filter((a) => a.courseId === course.id);
                const hasPassed = cExams.some((e) => e.resultStatus === 'passed');
                const hasResit = cExams.some((e) => e.resultStatus === 'needs_resit');

                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {course.code && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase font-mono">
                              {course.code}
                            </span>
                          )}
                          {hasPassed && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Geçildi ✓
                            </span>
                          )}
                          {hasResit && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Bütünleme
                            </span>
                          )}
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition" />
                      </div>

                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition leading-snug">
                        {course.name}
                      </h4>

                      {course.instructor && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {course.instructor}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cNotes.length} not</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cExams.length} sınav</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cAssigns.length} ödev</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: SINAVLAR (Geri Sayım, Sınav Sonuç Sorusu & Liste) */}
      {activeSubTab === 'sinavlar' && (
        <div className="space-y-4">
          {/* Ortak sınav tarihi (tüm dersler aynı gün) */}
          {onApplyCommonExamDate && onClearCommonExamDate && (
            <CommonExamDateCard
              courseCount={termCourses.length}
              exams={activeTerm ? exams.filter((e) => e.termId === activeTerm.id) : []}
              onApply={onApplyCommonExamDate}
              onClear={onClearCommonExamDate}
            />
          )}

          {/* Quick Exam Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Sınav Takibi & Geri Sayım
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vize, final ve bütünleme tarihleri
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExamImportModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Takvim İçe Aktar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExamToEdit(null);
                  setIsExamEditModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1 transition active:scale-95 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sınav Ekle</span>
              </button>
            </div>
          </div>

          {/* Sınav Sonucu Soru Kartları (Sonuç açıklandı mı?) */}
          {resultInquiryExams.map((exam) => {
            const course = courseMap.get(exam.courseId);
            const courseName = course?.name || 'Üniversite Dersi';
            const examTitle = exam.title || getExamTypeTitle(exam.examType);

            return (
              <div
                key={`result-prompt-${exam.id}`}
                className="rounded-3xl bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 p-4 sm:p-5 shadow-sm space-y-3"
              >
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
                    onClick={() => onPostponeResultPrompt(exam.id)}
                    className="py-2 px-3 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-200 font-semibold text-xs hover:bg-teal-50 transition active:scale-95"
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
            const primaryCourseName = primaryCourse?.name || 'Üniversite Dersi';
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
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        isUrgent
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Sıradaki En Yakın Sınav
                        </h3>
                        {isUrgent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                            Yaklaşıyor
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {primaryCourseName} • {getExamTypeTitle(primaryExam.examType)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => generateExamIcsFile(primaryExam, primaryCourseName)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Takvime (.ics) İndir"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary countdown badge */}
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                      {primaryCourse?.code ? `${primaryCourse.code} - ` : ''}{primaryCourseName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="font-mono">{primaryExam.date}</span>
                      {primaryExam.time && <span>• Saat: {primaryExam.time}</span>}
                    </div>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex-shrink-0 ${
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
                      {primaryCountdown.label}. İstersen Plan sekmesindeki programa o derse ait çalışma görevi ekleyelim.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSuggestStudyTask) {
                          onSuggestStudyTask(primaryCourseName);
                        } else {
                          onOpenAddTask(`${primaryCourseName} Sınav Çalışması`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition active:scale-95 shadow-xs"
                    >
                      Evet, Görev Ekle
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Sınav Listesi */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Tüm Sınavlar ({termExams.length})
            </h4>

            {termExams.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Henüz kayıtlı sınav bulunmuyor. "Sınav Ekle" veya "Takvim İçe Aktar" ile ekleyebilirsiniz.
              </p>
            ) : (
              <div className="space-y-2">
                {termExams
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((exam) => {
                    const c = courseMap.get(exam.courseId);
                    const cName = c?.name || 'Üniversite Dersi';
                    const cd = getExamCountdown(exam, todayStr);
                    const badge = getExamResultBadge(exam.resultStatus);

                    return (
                      <div
                        key={exam.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                              {cName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                              {getExamTypeTitle(exam.examType)}
                            </span>
                            {badge && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge.colorClass}`}>
                                {badge.text}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span className="font-mono">{exam.date}</span>
                            {exam.time && <span>• {exam.time}</span>}
                            {!cd.isPast && (
                              <span className="font-semibold text-amber-600 dark:text-amber-400">
                                ({cd.label})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => generateExamIcsFile(exam, cName)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                            title="Takvim (.ics) İndir"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setExamToEdit(exam);
                              setIsExamEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                            title="Düzenle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteExam(exam.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DERS NOTLARI (Üniversite Ders Notları Defteri) */}
      {activeSubTab === 'notlar' && (
        <div className="space-y-4">
          {/* Header & Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Ders Notları Defteri
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Derslere ait fotoğraflı, biçimlendirilmiş ve etiketli notlar
                </p>
              </div>

              {termCourses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setNoteToEdit(null);
                    // Üstteki ders filtresi seçiliyse o ders, değilse ilk ders önerilir; modalda değiştirilebilir
                    setTargetCourseForNote(
                      termCourses.find((c) => c.id === notesSelectedCourseId) || termCourses[0]
                    );
                    setIsNoteModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Ders Notu</span>
                </button>
              )}
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={notesSearchQuery}
                onChange={(e) => setNotesSearchQuery(e.target.value)}
                placeholder="Ders notlarında ve içeriklerde ara..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Course Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Ders:
              </span>
              <button
                type="button"
                onClick={() => setNotesSelectedCourseId('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  notesSelectedCourseId === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Tümü
              </button>
              {termCourses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setNotesSelectedCourseId(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    notesSelectedCourseId === c.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {c.code || c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {termCourses.length === 0 ? 'Not eklemek için önce ders ekleyin' : 'Ders notu bulunamadı'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {termCourses.length === 0
                  ? 'Ders notları derslere bağlıdır. Dersler sekmesinden bu dönemin derslerini ekledikten sonra not yazabilirsiniz.'
                  : 'Ders çalışırken tahta fotoğrafı ekleyebilir, sesle yazabilir veya sınav özetleri çıkartabilirsiniz.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (termCourses.length === 0) {
                    setActiveSubTab('dersler');
                    return;
                  }
                  setNoteToEdit(null);
                  setTargetCourseForNote(
                    termCourses.find((c) => c.id === notesSelectedCourseId) || termCourses[0]
                  );
                  setIsNoteModalOpen(true);
                }}
                className="mt-4 px-4 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{termCourses.length === 0 ? 'Ders Ekle' : 'İlk Notu Yaz'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredNotes.map((note) => {
                const course = courseMap.get(note.courseId);
                const cName = course?.name || 'Üniversite Dersi';
                const isCopied = copiedNoteId === note.id;

                return (
                  <div
                    key={note.id}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 truncate block max-w-[200px]">
                            {cName}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                            {note.title || 'Başlıksız Not'}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (!note.content) return;
                              navigator.clipboard.writeText(note.content);
                              setCopiedNoteId(note.id);
                              setTimeout(() => setCopiedNoteId(null), 2000);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Kopyala"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const targetC = courseMap.get(note.courseId) || termCourses[0];
                              setTargetCourseForNote(targetC);
                              setNoteToEdit(note);
                              setIsNoteModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-purple-600"
                            title="Düzenle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteNote(note.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {note.content}
                      </p>

                      {note.imageUrl && (
                        <div className="mt-2.5">
                          <img
                            src={note.imageUrl}
                            alt="Not eki"
                            className="max-h-32 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="capitalize">{note.tag} notu</span>
                      <span>{new Date(note.updatedAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {/* 1. Single Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {courseToEdit ? 'Dersi Düzenle' : 'Yeni Ders Ekle'}
              </h3>
              <button
                onClick={() => setIsCourseModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleCourse} className="p-4 sm:p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ders Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={singleCourseName}
                  onChange={(e) => setSingleCourseName(e.target.value)}
                  placeholder="örn. Veri Tabanı Yönetim Sistemleri"
                  required
                  className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ders Kodu (İsteğe bağlı)
                  </label>
                  <input
                    type="text"
                    value={singleCourseCode}
                    onChange={(e) => setSingleCourseCode(e.target.value)}
                    placeholder="örn. BİL102"
                    className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hoca (İsteğe bağlı)
                  </label>
                  <input
                    type="text"
                    value={singleCourseInstructor}
                    onChange={(e) => setSingleCourseInstructor(e.target.value)}
                    placeholder="Öğretim görevlisi"
                    className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!singleCourseName.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm active:scale-95 transition"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. New Term Modal */}
      {isTermModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Yeni Dönem Ekle
              </h3>
              <button
                onClick={() => setIsTermModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTerm} className="p-4 sm:p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dönem Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTermName}
                  onChange={(e) => setNewTermName(e.target.value)}
                  placeholder="örn. 2026-2027 Güz veya 2026-2027 Bahar"
                  required
                  className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsTermModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!newTermName.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm active:scale-95 transition"
                >
                  Dönem Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Batch Course Modal */}
      {activeTerm && (
        <BatchCourseModal
          isOpen={isBatchCourseModalOpen}
          onClose={() => setIsBatchCourseModalOpen(false)}
          activeTermId={activeTerm.id}
          activeTermName={activeTerm.name}
          onSaveCourses={onSaveMultipleCourses}
        />
      )}

      {/* 4. Exam Import Modal */}
      {activeTerm && (
        <ExamImportModal
          isOpen={isExamImportModalOpen}
          onClose={() => setIsExamImportModalOpen(false)}
          activeTermId={activeTerm.id}
          courses={termCourses}
          onSaveImportedExams={onSaveMultipleExams}
        />
      )}

      {/* 5. Exam Edit Modal */}
      {activeTerm && (
        <ExamEditModal
          isOpen={isExamEditModalOpen}
          onClose={() => setIsExamEditModalOpen(false)}
          activeTermId={activeTerm.id}
          courses={termCourses}
          examToEdit={examToEdit}
          onSaveExam={onSaveExam}
        />
      )}

      {/* 6. Exam Result Modal */}
      {activeResultModalExam && (() => {
        const c = courseMap.get(activeResultModalExam.courseId);
        const cName = c?.name || 'Üniversite Dersi';
        return (
          <ExamResultModal
            isOpen={true}
            onClose={() => setActiveResultModalExam(null)}
            exam={activeResultModalExam}
            courseName={cName}
            onSaveResult={async (examId, status, score, feedback) => {
              await onSaveExamResult(examId, status, score, feedback);
            }}
            onPostponePrompt={async (examId) => {
              await onPostponeResultPrompt(examId);
            }}
            onSuggestStudyTask={(cTitle) => {
              if (onSuggestStudyTask) {
                onSuggestStudyTask(cTitle);
              }
            }}
          />
        );
      })()}

      {/* 7. Course Note Modal */}
      {isNoteModalOpen && targetCourseForNote && activeTerm && (
        <UniversityNoteModal
          isOpen={isNoteModalOpen}
          onClose={() => {
            setIsNoteModalOpen(false);
            setNoteToEdit(null);
          }}
          termId={activeTerm.id}
          courseId={targetCourseForNote.id}
          courseName={targetCourseForNote.name}
          courses={termCourses}
          noteToEdit={noteToEdit}
          onSaveNote={onSaveNote}
          voiceNotesEnabled={voiceNotesEnabled}
        />
      )}
    </div>
  );
};
