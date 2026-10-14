import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, FileText, ChevronRight, AlertTriangle, PhoneCall, Languages, StickyNote } from 'lucide-react';
import { 
  Student, 
  StudentNote, 
  WeeklyCallSession, 
  StudyTask, 
  EnglishNote, 
  EnglishCard, 
  UniversityCourse,
  UniversityExam,
  UniversityNote,
  ProjectIdea,
  PersonalNote,
  PersonalNoteTag,
  SearchResultItem 
} from '../types';
import { globalSearchEngine } from '../services/searchService';
import { BookOpen, GraduationCap, Lightbulb, Terminal } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  studentNotes: StudentNote[];
  weeklyCallSessions?: WeeklyCallSession[];
  studyTasks?: StudyTask[];
  englishNotes?: EnglishNote[];
  englishCards?: EnglishCard[];
  universityCourses?: UniversityCourse[];
  universityExams?: UniversityExam[];
  universityNotes?: UniversityNote[];
  projectIdeas?: ProjectIdea[];
  personalNotes?: PersonalNote[];
  personalTags?: PersonalNoteTag[];
  onSelectStudent: (studentId: string) => void;
  onSelectNote: (studentId: string, noteId: string) => void;
  onSelectCallRecord?: (studentId: string) => void;
  onSelectStudyTask?: (taskId: string) => void;
  onSelectEnglishNote?: (noteId: string) => void;
  onSelectEnglishCard?: (cardId: string) => void;
  onSelectUniversityCourse?: (courseId: string) => void;
  onSelectUniversityExam?: (examId: string) => void;
  onSelectUniversityNote?: (noteId: string) => void;
  onSelectIdea?: (ideaId: string) => void;
  onSelectPersonalNote?: (noteId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  students,
  studentNotes,
  weeklyCallSessions = [],
  studyTasks = [],
  englishNotes = [],
  englishCards = [],
  universityCourses = [],
  universityExams = [],
  universityNotes = [],
  projectIdeas = [],
  personalNotes = [],
  personalTags = [],
  onSelectStudent,
  onSelectNote,
  onSelectCallRecord,
  onSelectStudyTask,
  onSelectEnglishNote,
  onSelectEnglishCard,
  onSelectUniversityCourse,
  onSelectUniversityExam,
  onSelectUniversityNote,
  onSelectIdea,
  onSelectPersonalNote,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const results: SearchResultItem[] = query.trim()
    ? globalSearchEngine.search(query, { 
        students, 
        studentNotes, 
        weeklyCallSessions, 
        studyTasks,
        englishNotes,
        englishCards,
        universityCourses,
        universityExams,
        universityNotes,
        projectIdeas,
        personalNotes,
        personalTags,
      })
    : [];

  const studentResults = results.filter((r) => r.type === 'student');
  const noteResults = results.filter((r) => r.type === 'student_note');
  const callResults = results.filter((r) => r.type === 'parent_call');
  const studyResults = results.filter((r) => r.type === 'study_task');
  const englishNoteResults = results.filter((r) => r.type === 'english_note');
  const englishCardResults = results.filter((r) => r.type === 'english_card');
  const universityCourseResults = results.filter((r) => r.type === 'university_course');
  const universityExamResults = results.filter((r) => r.type === 'university_exam');
  const universityNoteResults = results.filter((r) => r.type === 'university_note');
  const ideaResults = results.filter((r) => r.type === 'idea');
  const ideaNoteResults = results.filter((r) => r.type === 'idea_note');
  const ideaPromptResults = results.filter((r) => r.type === 'idea_prompt');
  const personalNoteResults = results.filter((r) => r.type === 'personal_note');

  const handleResultClick = (result: SearchResultItem) => {
    onClose();
    if (result.type === 'student') {
      onSelectStudent(result.targetId);
    } else if (result.type === 'student_note' || result.type === 'school_note') {
      onSelectNote(result.studentId || '', result.targetId);
    } else if (result.type === 'parent_call' && result.studentId) {
      if (onSelectCallRecord) {
        onSelectCallRecord(result.studentId);
      } else {
        onSelectStudent(result.studentId);
      }
    } else if (result.type === 'study_task') {
      if (onSelectStudyTask) {
        onSelectStudyTask(result.targetId);
      }
    } else if (result.type === 'english_note') {
      if (onSelectEnglishNote) {
        onSelectEnglishNote(result.targetId);
      }
    } else if (result.type === 'english_card') {
      if (onSelectEnglishCard) {
        onSelectEnglishCard(result.targetId);
      }
    } else if (result.type === 'university_course') {
      if (onSelectUniversityCourse) {
        onSelectUniversityCourse(result.targetId);
      }
    } else if (result.type === 'university_exam') {
      if (onSelectUniversityExam) {
        onSelectUniversityExam(result.targetId);
      } else if (onSelectUniversityCourse) {
        onSelectUniversityCourse(result.targetId);
      }
    } else if (result.type === 'university_note') {
      if (onSelectUniversityNote) {
        onSelectUniversityNote(result.targetId);
      } else if (onSelectUniversityCourse) {
        onSelectUniversityCourse(result.targetId);
      }
    } else if (result.type === 'idea' || result.type === 'idea_note' || result.type === 'idea_prompt') {
      if (onSelectIdea) {
        onSelectIdea(result.ideaId || result.targetId);
      }
    } else if (result.type === 'personal_note') {
      if (onSelectPersonalNote) {
        onSelectPersonalNote(result.noteId || result.targetId);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden mt-8 sm:mt-12 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/60 dark:bg-slate-900/60">
          <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Öğrenci adı, grup, alerji, notlar veya veli aramalarında ara..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Kapat
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-teal-600" />
              <p className="text-sm font-medium">Aramak için bir kelime yazın</p>
              <p className="text-xs mt-1">Öğrenci adları, sınıflar, genel notlar ve Cuma veli görüşmeleri taranır.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              <p className="text-sm font-medium">"{query}" ile eşleşen sonuç bulunamadı.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Farklı bir isim veya not içeriği deneyebilirsiniz.</p>
            </div>
          ) : (
            <>
              {/* Student Results Section */}
              {studentResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Öğrenciler ({studentResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {studentResults.map((item) => {
                      const studentObj = students.find((s) => s.id === item.targetId);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleResultClick(item)}
                          className="w-full text-left p-3 rounded-2xl hover:bg-teal-50/70 dark:hover:bg-slate-800/80 active:bg-teal-100 dark:active:bg-slate-800 transition flex items-center justify-between gap-3 group border border-transparent hover:border-teal-200 dark:hover:border-slate-700"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-sm flex-shrink-0">
                              {item.title.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                  {item.title}
                                </span>
                                {studentObj?.healthAlert && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                    <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Sağlık
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Veli Görüşmeleri (Parent Calls) Results Section */}
              {callResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Cuma Veli Görüşmeleri ({callResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {callResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-2xl hover:bg-amber-50/70 dark:hover:bg-slate-800/80 active:bg-amber-100 dark:active:bg-slate-800 transition flex items-start justify-between gap-3 group border border-amber-100 dark:border-amber-900/40"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold flex-shrink-0">
                              Veli Araması
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed italic">
                            "{item.snippet}"
                          </p>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            {item.subtitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Note Results Section */}
              {noteResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Notlar ({noteResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {noteResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-750 transition flex items-start justify-between gap-3 group border border-slate-100 dark:border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium flex-shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            {item.subtitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Task Results Section */}
              {studyResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Çalışma Görevleri ({studyResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {studyResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-750 transition flex items-start justify-between gap-3 group border border-slate-100 dark:border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold flex-shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            {item.subtitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* English Notes Results Section */}
              {englishNoteResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>İngilizce Notlar ({englishNoteResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {englishNoteResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-750 transition flex items-start justify-between gap-3 group border border-slate-100 dark:border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold flex-shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            {item.subtitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* English Cards Results Section */}
              {englishCardResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Kelime Kartları ({englishCardResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {englishCardResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-750 transition flex items-start justify-between gap-3 group border border-slate-100 dark:border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold flex-shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            {item.subtitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* University Courses Results Section */}
              {universityCourseResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Üniversite Dersleri ({universityCourseResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {universityCourseResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-750 transition flex items-start justify-between gap-3 group border border-slate-100 dark:border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold flex-shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.subtitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* University Exams Results Section */}
              {universityExamResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Üniversite Sınavları ({universityExamResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {universityExamResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-750 transition flex items-start justify-between gap-3 group border border-slate-100 dark:border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold flex-shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.subtitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* University Notes Results Section */}
              {universityNoteResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Ders Notları ({universityNoteResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {universityNoteResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-750 transition flex items-start justify-between gap-3 group border border-slate-100 dark:border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold flex-shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            {item.subtitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fikirler & Projeler Sonuçları */}
              {ideaResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Fikirler & Projeler ({ideaResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {ideaResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-750 transition flex items-start justify-between gap-3 group border border-slate-100 dark:border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold flex-shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            {item.subtitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fikir Notları Sonuçları */}
              {ideaNoteResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Fikir Notları ({ideaNoteResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {ideaNoteResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-750 transition flex items-start justify-between gap-3 group border border-slate-100 dark:border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold flex-shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            {item.subtitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Promptları Sonuçları */}
              {ideaPromptResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-teal-600" />
                    <span>AI Promptları ({ideaPromptResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {ideaPromptResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-750 transition flex items-start justify-between gap-3 group border border-slate-100 dark:border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold flex-shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-mono line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            {item.subtitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kişisel Notlar Sonuçları */}
              {personalNoteResults.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5 text-purple-600" />
                    <span>Kişisel Notlar ({personalNoteResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {personalNoteResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-750 transition flex items-start justify-between gap-3 group border border-slate-100 dark:border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold flex-shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            {item.subtitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
