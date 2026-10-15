import { Student, StudentNote, WeeklyCallSession, WeeklyCallItem, ParentCallSettings } from '../types';
import { getTargetDateOfWeek } from '../utils/calendar';
import { saveCallSession, saveNote, deleteNote } from '../db/repository';

// Oturum açıkken Firestore'a, değilken IndexedDB'ye yazma kararını repository verir.
const persistSession = (session: WeeklyCallSession): Promise<void> => saveCallSession(session);
const persistNote = (note: StudentNote): Promise<void> => saveNote(note);
const removeNote = (noteId: string): Promise<void> => deleteNote(noteId);

export interface MissedCallInfo {
  sessionDate: string;
  item: WeeklyCallItem;
}

// Find previous week's uncalled students
export function getPreviousMissedCalls(
  currentWeekDate: string,
  allSessions: WeeklyCallSession[]
): MissedCallInfo[] {
  const pastSessions = allSessions
    .filter((s) => s.weekDate < currentWeekDate)
    .sort((a, b) => b.weekDate.localeCompare(a.weekDate));

  if (pastSessions.length === 0) return [];

  const lastSession = pastSessions[0];
  const missed: MissedCallInfo[] = [];

  for (const item of lastSession.items) {
    if (!item.excluded && !item.called) {
      missed.push({
        sessionDate: lastSession.weekDate,
        item,
      });
    }
  }

  return missed;
}

// Ensure the current week has an active session and is synced with current students
export async function getOrCreateCurrentSession(
  students: Student[],
  settings: ParentCallSettings,
  allSessions: WeeklyCallSession[]
): Promise<{ currentSession: WeeklyCallSession; missedCalls: MissedCallInfo[] }> {
  const currentWeekDate = getTargetDateOfWeek(new Date(), settings.callDay);
  const sessionId = `call-${currentWeekDate}`;

  let session = allSessions.find((s) => s.weekDate === currentWeekDate);

  if (!session) {
    const now = Date.now();
    const items: WeeklyCallItem[] = students.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      excluded: false,
      called: false,
      notes: '',
    }));

    session = {
      id: sessionId,
      weekDate: currentWeekDate,
      dayOfWeek: settings.callDay,
      callTime: settings.callTime,
      status: 'active',
      items,
      createdAt: now,
      updatedAt: now,
    };

    await persistSession(session);
  } else {
    let updated = false;
    const existingStudentIds = new Set(session.items.map((i) => i.studentId));

    for (const student of students) {
      if (!existingStudentIds.has(student.id)) {
        session.items.push({
          studentId: student.id,
          studentName: student.name,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          excluded: false,
          called: false,
          notes: '',
        });
        updated = true;
      } else {
        const item = session.items.find((i) => i.studentId === student.id);
        if (item) {
          if (item.studentName !== student.name || item.parentPhone !== student.parentPhone || item.parentName !== student.parentName) {
            item.studentName = student.name;
            item.parentPhone = student.parentPhone;
            item.parentName = student.parentName;
            updated = true;
          }
        }
      }
    }

    if (updated) {
      session.updatedAt = Date.now();
      await persistSession(session);
    }
  }

  const missedCalls = getPreviousMissedCalls(currentWeekDate, allSessions);
  return { currentSession: session, missedCalls };
}

// Mark student as called / uncalled and sync with StudentNote stream
export async function toggleStudentCall(
  session: WeeklyCallSession,
  studentId: string,
  newCalledState: boolean,
  notesContent?: string
): Promise<WeeklyCallSession> {
  const itemIndex = session.items.findIndex((i) => i.studentId === studentId);
  if (itemIndex === -1) return session;

  const item = { ...session.items[itemIndex] };
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  item.called = newCalledState;

  if (newCalledState) {
    item.calledAt = timeStr;
    const effectiveNotes = notesContent !== undefined ? notesContent : (item.notes || '');

    if (effectiveNotes.trim()) {
      const noteId = item.linkedNoteId || `nt-call-${session.weekDate}-${studentId}`;
      const noteToSave: StudentNote = {
        id: noteId,
        studentId: studentId,
        date: session.weekDate,
        time: item.calledAt,
        category: 'veli_gorusmesi',
        content: `[Haftalık Veli Araması]: ${effectiveNotes.trim()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await persistNote(noteToSave);
      item.linkedNoteId = noteId;
    }
  } else {
    item.calledAt = undefined;
    if (item.linkedNoteId) {
      await removeNote(item.linkedNoteId);
      item.linkedNoteId = undefined;
    }
  }

  const updatedItems = [...session.items];
  updatedItems[itemIndex] = item;

  const updatedSession: WeeklyCallSession = {
    ...session,
    items: updatedItems,
    updatedAt: Date.now(),
  };

  await persistSession(updatedSession);
  return updatedSession;
}

// Update call notes for a student
export async function updateStudentCallNotes(
  session: WeeklyCallSession,
  studentId: string,
  notes: string
): Promise<WeeklyCallSession> {
  const itemIndex = session.items.findIndex((i) => i.studentId === studentId);
  if (itemIndex === -1) return session;

  const item = { ...session.items[itemIndex], notes };

  if (item.called && notes.trim()) {
    const noteId = item.linkedNoteId || `nt-call-${session.weekDate}-${studentId}`;
    const noteToSave: StudentNote = {
      id: noteId,
      studentId: studentId,
      date: session.weekDate,
      time: item.calledAt,
      category: 'veli_gorusmesi',
      content: `[Haftalık Veli Araması]: ${notes.trim()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await persistNote(noteToSave);
    item.linkedNoteId = noteId;
  } else if (item.called && !notes.trim() && item.linkedNoteId) {
    await removeNote(item.linkedNoteId);
    item.linkedNoteId = undefined;
  }

  const updatedItems = [...session.items];
  updatedItems[itemIndex] = item;

  const updatedSession: WeeklyCallSession = {
    ...session,
    items: updatedItems,
    updatedAt: Date.now(),
  };

  await persistSession(updatedSession);
  return updatedSession;
}

// Exclude / Include student for this week's call list
export async function toggleExcludeStudentFromSession(
  session: WeeklyCallSession,
  studentId: string
): Promise<WeeklyCallSession> {
  const itemIndex = session.items.findIndex((i) => i.studentId === studentId);
  if (itemIndex === -1) return session;

  const item = { ...session.items[itemIndex] };
  item.excluded = !item.excluded;

  const updatedItems = [...session.items];
  updatedItems[itemIndex] = item;

  const updatedSession: WeeklyCallSession = {
    ...session,
    items: updatedItems,
    updatedAt: Date.now(),
  };

  await persistSession(updatedSession);
  return updatedSession;
}
