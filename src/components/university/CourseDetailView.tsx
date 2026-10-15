import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock, 
  FileText, 
  CheckSquare, 
  Tag, 
  Edit3, 
  Trash2, 
  Download, 
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { 
  UniversityCourse, 
  UniversityExam, 
  UniversityNote, 
  UniversityAssignment,
  ExamResultStatus 
} from '../../types';
import { 
  getExamTypeTitle, 
  getExamCountdown, 
  getExamResultBadge, 
  generateExamIcsFile 
} from '../../utils/universityUtils';
import { UniversityNoteModal } from './UniversityNoteModal';
import { UniversityAssignmentModal } from './UniversityAssignmentModal';
import { ExamEditModal } from './ExamEditModal';
import { ExamResultModal } from './ExamResultModal';

import { toLocalISODate } from '../../utils/calendar';
interface CourseDetailViewProps {
  course: UniversityCourse;
  exams: UniversityExam[];
  notes: UniversityNote[];
  assignments: UniversityAssignment[];
  onBack: () => void;
  onEditCourse: (course: UniversityCourse) => void;
  onDeleteCourse: (courseId: string) => Promise<void>;
  onSaveExam: (exam: Partial<UniversityExam>) => Promise<void>;
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

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  course,
  exams,
  notes,
  assignments,
  onBack,
  onEditCourse,
  onDeleteCourse,
  onSaveExam,
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
  const [activeTab, setActiveTab] = useState<'notes' | 'exams' | 'assignments'>('notes');

  // Modals state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<UniversityNote | null>(null);

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<UniversityExam | null>(null);

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<UniversityAssignment | null>(null);

  const [resultExamTarget, setResultExamTarget] = useState<UniversityExam | null>(null);

  // Sorted data
  const sortedNotes = [...notes].sort((a, b) => b.createdAt - a.createdAt);
  const sortedExams = [...exams].sort((a, b) => a.date.localeCompare(b.date));
  const sortedAssignments = [...assignments].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Bar with Back and Actions */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition active:scale-95 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ders Listesi</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditCourse(course)}
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition"
            title="Dersi Düzenle"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`"${course.name}" dersini ve bağlı tüm not, sınav ve ödevlerini silmek istediğinize emin misiniz?`)) {
                onDeleteCourse(course.id);
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
            title="Dersi Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Course Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            {course.code && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wide">
                {course.code}
              </span>
            )}
            {course.instructor && (
              <span className="text-xs text-indigo-200">
                • {course.instructor}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {course.name}
          </h2>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm">
              <div className="text-[11px] text-indigo-200 font-medium">Notlar</div>
              <div className="text-base sm:text-lg font-bold">{notes.length}</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm">
              <div className="text-[11px] text-indigo-200 font-medium">Sınavlar</div>
              <div className="text-base sm:text-lg font-bold">{exams.length}</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm">
              <div className="text-[11px] text-indigo-200 font-medium">Ödevler</div>
              <div className="text-base sm:text-lg font-bold">{assignments.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Subtabs */}
      <div className="flex rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 p-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'notes'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Notlar ({notes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'exams'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Sınavlar & Sonuçlar ({exams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'assignments'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Ödevler ({assignments.length})</span>
        </button>
      </div>

      {/* Subtab 1: NOTLAR */}
      {activeTab === 'notes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Ders Defteri Notları
            </h3>
            <button
              onClick={() => {
                setNoteToEdit(null);
                setIsNoteModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Not Ekle</span>
            </button>
          </div>

          {sortedNotes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white/50 dark:bg-slate-900/50 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bu ders için henüz not eklenmedi.
              </p>
              <button
                onClick={() => {
                  setNoteToEdit(null);
                  setIsNoteModalOpen(true);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                + İlk ders notunu ekle (Fotoğraf ve sesle yazma destekli)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4.5 shadow-sm space-y-2.5 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          #{note.tag}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(note.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {note.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setNoteToEdit(note);
                          setIsNoteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Bu ders notunu silmek istediğinize emin misiniz?')) {
                            onDeleteNote(note.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>

                  {note.imageUrl && (
                    <div className="pt-2">
                      <img
                        src={note.imageUrl}
                        alt="Ders notu görseli"
                        className="max-h-56 rounded-2xl border border-slate-200 dark:border-slate-700 object-contain bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: SINAVLAR & SONUÇLAR */}
      {activeTab === 'exams' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Sınav Takvimi & Notlar
            </h3>
            <button
              onClick={() => {
                setExamToEdit(null);
                setIsExamModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sınav Ekle</span>
            </button>
          </div>

          {sortedExams.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white/50 dark:bg-slate-900/50 space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bu ders için kayıtlı sınav bulunmuyor.
              </p>
              <button
                onClick={() => {
                  setExamToEdit(null);
                  setIsExamModalOpen(true);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                + Elle sınav ekle veya sınav takviminden aktar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedExams.map((exam) => {
                const countdown = getExamCountdown(exam);
                const resultBadge = getExamResultBadge(exam.resultStatus);
                const examTitle = exam.title || getExamTypeTitle(exam.examType);

                return (
                  <div
                    key={exam.id}
                    className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4.5 shadow-sm space-y-3 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {examTitle}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${resultBadge.colorClass}`}>
                            {resultBadge.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono">{exam.date}</span>
                          {exam.time && <span>• {exam.time}</span>}
                          <span>• {countdown.label}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* .ics export button */}
                        <button
                          onClick={() => generateExamIcsFile(exam, course.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Takvime Ekle (.ics indir)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setExamToEdit(exam);
                            setIsExamModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Bu sınav kaydını silmek istediğinize emin misiniz?')) {
                              onDeleteExam(exam.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Result details if already saved */}
                    {exam.resultStatus && exam.resultStatus !== 'pending' ? (
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Sonuç: {resultBadge.text}
                          </span>
                          {exam.resultScore && (
                            <span className="ml-2 font-bold text-indigo-600 dark:text-indigo-400">
                              (Puan / Not: {exam.resultScore})
                            </span>
                          )}
                          {exam.resultDate && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Kayıt tarihi: {exam.resultDate}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setResultExamTarget(exam)}
                          className="text-[11px] font-semibold text-indigo-600 hover:underline"
                        >
                          Sonucu Değiştir
                        </button>
                      </div>
                    ) : (
                      countdown.isPast && (
                        <button
                          onClick={() => setResultExamTarget(exam)}
                          className="w-full p-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-300 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-teal-200 dark:border-teal-800"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Sınav Sonucu Açıklandı mı? Sonuç Gir</span>
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: ÖDEVLER */}
      {activeTab === 'assignments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Ödev & Proje Takibi
            </h3>
            <button
              onClick={() => {
                setAssignmentToEdit(null);
                setIsAssignmentModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ödev Ekle</span>
            </button>
          </div>

          {sortedAssignments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white/50 dark:bg-slate-900/50 space-y-2">
              <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bu derse ait ödev veya proje kaydı yok.
              </p>
              <button
                onClick={() => {
                  setAssignmentToEdit(null);
                  setIsAssignmentModalOpen(true);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                + Yeni ödev veya proje ekle
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedAssignments.map((a) => (
                <div
                  key={a.id}
                  className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                    a.completed
                      ? 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-70'
                      : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={a.completed}
                      onChange={(e) => onToggleAssignment(a.id, e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 uppercase">
                          {a.type}
                        </span>
                        <h4
                          className={`text-xs font-bold truncate ${
                            a.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {a.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="font-mono">Teslim: {a.dueDate}</span>
                        {a.notes && <span>• {a.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        setAssignmentToEdit(a);
                        setIsAssignmentModalOpen(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Bu ödevi silmek istediğinize emin misiniz?')) {
                          onDeleteAssignment(a.id);
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Note Modal */}
      <UniversityNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        termId={course.termId}
        courseId={course.id}
        courseName={course.name}
        noteToEdit={noteToEdit}
        onSaveNote={onSaveNote}
        voiceNotesEnabled={voiceNotesEnabled}
      />

      {/* Exam Modal */}
      <ExamEditModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        activeTermId={course.termId}
        courses={[course]}
        examToEdit={examToEdit}
        onSaveExam={onSaveExam}
      />

      {/* Assignment Modal */}
      <UniversityAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        termId={course.termId}
        courseId={course.id}
        courseName={course.name}
        assignmentToEdit={assignmentToEdit}
        onSaveAssignment={onSaveAssignment}
      />

      {/* Result Prompt Modal */}
      {resultExamTarget && (
        <ExamResultModal
          isOpen={true}
          onClose={() => setResultExamTarget(null)}
          exam={resultExamTarget}
          courseName={course.name}
          onSaveResult={onSaveExamResult}
          onPostponePrompt={onPostponeResultPrompt}
          onSuggestResitExam={(e) => {
            setExamToEdit({
              id: '',
              termId: e.termId,
              courseId: e.courseId,
              examType: 'butunleme',
              date: toLocalISODate(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            setIsExamModalOpen(true);
          }}
          onSuggestStudyTask={onSuggestStudyTask}
        />
      )}
    </div>
  );
};
