import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Calendar, 
  ListPlus, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Archive, 
  ChevronRight, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Sparkles,
  Download,
  FileText
} from 'lucide-react';
import { 
  UniversityTerm, 
  UniversityCourse, 
  UniversityExam, 
  UniversityNote, 
  UniversityAssignment,
  ExamResultStatus 
} from '../../types';
import { calculateTermStats, getExamCountdown, generateExamIcsFile, getExamTypeTitle } from '../../utils/universityUtils';
import { CourseDetailView } from './CourseDetailView';
import { BatchCourseModal } from './BatchCourseModal';
import { ExamImportModal } from './ExamImportModal';
import { ExamEditModal } from './ExamEditModal';
import { ExamResultModal } from './ExamResultModal';

interface UniversityViewProps {
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
  voiceNotesEnabled?: boolean;
}

export const UniversityView: React.FC<UniversityViewProps> = ({
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
  voiceNotesEnabled = true,
}) => {
  // Active term identification
  const activeTerm = terms.find((t) => t.isActive && !t.isArchived) || terms[0] || null;
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Term management modals
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [newTermName, setNewTermName] = useState('');
  const [showArchiveList, setShowArchiveList] = useState(false);

  // Single course modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<UniversityCourse | null>(null);
  const [singleCourseName, setSingleCourseName] = useState('');
  const [singleCourseCode, setSingleCourseCode] = useState('');
  const [singleCourseInstructor, setSingleCourseInstructor] = useState('');
  const [singleCourseColor, setSingleCourseColor] = useState('indigo');

  // Batch modals
  const [isBatchCourseModalOpen, setIsBatchCourseModalOpen] = useState(false);
  const [isExamImportModalOpen, setIsExamImportModalOpen] = useState(false);
  const [isExamEditModalOpen, setIsExamEditModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<UniversityExam | null>(null);

  // Filter courses by current active term
  const termCourses = activeTerm ? courses.filter((c) => c.termId === activeTerm.id) : [];
  const termExams = activeTerm ? exams.filter((e) => e.termId === activeTerm.id) : [];
  const termNotes = activeTerm ? notes.filter((n) => n.termId === activeTerm.id) : [];
  const termAssignments = activeTerm ? assignments.filter((a) => a.termId === activeTerm.id) : [];

  // Summary stats
  const stats = calculateTermStats(termCourses, termExams);

  // If viewing a specific course detail
  const selectedCourse = selectedCourseId ? termCourses.find((c) => c.id === selectedCourseId) : null;

  if (selectedCourse) {
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

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Top Banner / Student Context Header */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-2 w-24 h-24 rounded-full bg-teal-400/10 blur-xl pointer-events-none" />

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
              Derslerinizi, sınav tarihlerinizi ve notlarınızı kolayca yönetin.
            </p>
          </div>

          {/* Dönem Özeti Kartları (4) */}
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

      {/* Quick Action Buttons: Toplu Ders, Sınav Takvimi İçe Aktar, Sınav Ekle */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button
          onClick={() => setIsBatchCourseModalOpen(true)}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 text-left transition active:scale-95 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Toplu Ders Ekle
              </div>
              <div className="text-[10px] text-slate-400">Listeyi yapıştırarak ekle</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition" />
        </button>

        <button
          onClick={() => setIsExamImportModalOpen(true)}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-800 shadow-sm hover:border-amber-300 dark:hover:border-amber-700 text-left transition active:scale-95 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Sınav Takvimi Aktar
              </div>
              <div className="text-[10px] text-slate-400">Resmi duyuruyu yapıştır</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition" />
        </button>

        <button
          onClick={() => {
            setExamToEdit(null);
            setIsExamEditModalOpen(true);
          }}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 text-left transition active:scale-95 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Elle Sınav Ekle
              </div>
              <div className="text-[10px] text-slate-400">Tarih ve saat belirle</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition" />
        </button>
      </div>

      {/* Ders Listesi Bölümü */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Dönem Dersleri ({termCourses.length})
            </h3>
            <span className="text-xs text-slate-400">
              {activeTerm?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCourseToEdit(null);
                setSingleCourseName('');
                setSingleCourseCode('');
                setSingleCourseInstructor('');
                setIsCourseModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tek Ders Ekle</span>
            </button>
          </div>
        </div>

        {termCourses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white/50 dark:bg-slate-900/50 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Bu döneme ait ders bulunmuyor
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                OBS veya ders listesinden kopyaladığınız satırları tek tuşla topluca ekleyebilir veya tek tek ders tanımlayabilirsiniz.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setIsBatchCourseModalOpen(true)}
                className="px-4 py-2 rounded-2xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 transition active:scale-95 flex items-center gap-1.5"
              >
                <ListPlus className="w-4 h-4" />
                <span>Toplu Ders Yapıştır</span>
              </button>
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

      {/* Single Course Modal */}
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

      {/* New Term Modal */}
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

      {/* Batch Course Modal */}
      {activeTerm && (
        <BatchCourseModal
          isOpen={isBatchCourseModalOpen}
          onClose={() => setIsBatchCourseModalOpen(false)}
          activeTermId={activeTerm.id}
          activeTermName={activeTerm.name}
          onSaveCourses={onSaveMultipleCourses}
        />
      )}

      {/* Exam Import Modal */}
      {activeTerm && (
        <ExamImportModal
          isOpen={isExamImportModalOpen}
          onClose={() => setIsExamImportModalOpen(false)}
          activeTermId={activeTerm.id}
          courses={termCourses}
          onSaveImportedExams={onSaveMultipleExams}
        />
      )}

      {/* Exam Edit Modal */}
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
    </div>
  );
};
