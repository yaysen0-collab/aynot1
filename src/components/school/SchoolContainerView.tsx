import React from 'react';
import { StickyNote, Phone, Users } from 'lucide-react';
import { 
  Student, 
  StudentNote, 
  WeeklyCallSession, 
  ParentCallSettings 
} from '../../types';
import { MissedCallInfo } from '../../services/parentCallService';
import { SchoolNotesView } from './SchoolNotesView';
import { SchoolParentCallsView } from './SchoolParentCallsView';
import { StudentsView } from '../students/StudentsView';
import { StudentDetailView } from '../students/StudentDetailView';

export type SchoolSubTab = 'notlar' | 'veli_aramalari' | 'ogrenciler';

interface SchoolContainerViewProps {
  activeSubTab: SchoolSubTab;
  onSubTabChange: (subTab: SchoolSubTab) => void;
  students: Student[];
  notes: StudentNote[];
  selectedStudent: Student | null;
  onSelectStudent: (studentId: string | null) => void;
  onAddNewStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onAddNewNote: (targetStudentId?: string) => void;
  onEditNote: (note: StudentNote) => void;
  onDeleteNote: (noteId: string) => void;
  // Parent Calls
  callSession: WeeklyCallSession | null;
  missedCalls: MissedCallInfo[];
  allCallSessions: WeeklyCallSession[];
  parentCallSettings: ParentCallSettings;
  onUpdateCallSession: (session: WeeklyCallSession) => void;
  onOpenCallHistory: () => void;
  // Search jump highlight
  initialSelectedNoteId?: string | null;
  onClearInitialSelectedNoteId?: () => void;
}

export const SchoolContainerView: React.FC<SchoolContainerViewProps> = ({
  activeSubTab,
  onSubTabChange,
  students,
  notes,
  selectedStudent,
  onSelectStudent,
  onAddNewStudent,
  onEditStudent,
  onDeleteStudent,
  onAddNewNote,
  onEditNote,
  onDeleteNote,
  callSession,
  missedCalls,
  allCallSessions,
  parentCallSettings,
  onUpdateCallSession,
  onOpenCallHistory,
  initialSelectedNoteId,
  onClearInitialSelectedNoteId,
}) => {
  // Pending calls count for badge
  const pendingCallsCount = callSession
    ? callSession.items.filter((i) => !i.called && !i.excluded).length
    : 0;

  // Selected student notes
  const studentNoteFlow = selectedStudent
    ? notes.filter((n) => n.studentId === selectedStudent.id)
    : [];

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Üst Segmented Sub-Tab Çubuğu: Notlar | Veli aramaları | Öğrenciler */}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-1 shadow-xs">
        {/* 1. Notlar */}
        <button
          type="button"
          onClick={() => {
            onSelectStudent(null);
            onSubTabChange('notlar');
          }}
          className={`flex-1 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 ${
            activeSubTab === 'notlar'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <StickyNote className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Notlar</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {notes.length}
          </span>
        </button>

        {/* 2. Veli aramaları */}
        <button
          type="button"
          onClick={() => {
            onSelectStudent(null);
            onSubTabChange('veli_aramalari');
          }}
          className={`flex-1 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 ${
            activeSubTab === 'veli_aramalari'
              ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Veli aramaları</span>
          {pendingCallsCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold">
              {pendingCallsCount}
            </span>
          )}
        </button>

        {/* 3. Öğrenciler */}
        <button
          type="button"
          onClick={() => {
            onSubTabChange('ogrenciler');
          }}
          className={`flex-1 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 ${
            activeSubTab === 'ogrenciler'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Öğrenciler</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {students.length}
          </span>
        </button>
      </div>

      {/* Sub-Tab 1: Okul Notları */}
      {activeSubTab === 'notlar' && (
        <SchoolNotesView
          notes={notes}
          students={students}
          onAddNewNote={() => onAddNewNote()}
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
          onSelectStudent={(stId) => {
            onSelectStudent(stId);
            onSubTabChange('ogrenciler');
          }}
          initialSelectedNoteId={initialSelectedNoteId}
          onClearInitialSelectedNoteId={onClearInitialSelectedNoteId}
        />
      )}

      {/* Sub-Tab 2: Veli Aramaları */}
      {activeSubTab === 'veli_aramalari' && (
        <SchoolParentCallsView
          session={callSession}
          missedCalls={missedCalls}
          allSessions={allCallSessions}
          settings={parentCallSettings}
          onUpdateSession={onUpdateCallSession}
          onOpenHistory={onOpenCallHistory}
          onNavigateToStudent={(stId) => {
            onSelectStudent(stId);
            onSubTabChange('ogrenciler');
          }}
        />
      )}

      {/* Sub-Tab 3: Öğrenciler (veya seçili öğrenci not akışı) */}
      {activeSubTab === 'ogrenciler' && (
        <>
          {selectedStudent ? (
            <StudentDetailView
              student={selectedStudent}
              notes={studentNoteFlow}
              callSessions={allCallSessions}
              onBack={() => onSelectStudent(null)}
              onEditStudent={onEditStudent}
              onDeleteStudent={onDeleteStudent}
              onAddNote={(stId) => onAddNewNote(stId)}
              onEditNote={onEditNote}
              onDeleteNote={onDeleteNote}
            />
          ) : (
            <StudentsView
              students={students}
              studentNotes={notes}
              onSelectStudent={(stId) => onSelectStudent(stId)}
              onAddNewStudent={onAddNewStudent}
            />
          )}
        </>
      )}
    </div>
  );
};
