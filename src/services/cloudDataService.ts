import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../db/firebase';
import {
  Student,
  StudentNote,
  WeeklyCallSession,
  ParentCallSettings,
  StudyTask,
  StudyDayConfig,
  DayCheckin,
  StudySettings,
  EnglishNote,
  EnglishDeck,
  EnglishCard,
  EnglishDailyGoalSettings,
  EnglishStudyReviewLog,
  UniversityTerm,
  UniversityCourse,
  UniversityExam,
  UniversityNote,
  UniversityAssignment,
  ProjectIdea,
  PersonalNote,
  PersonalNoteTag
} from '../types';
import { compressImageToDataUrl } from './photoService';

/**
 * Remove undefined properties from an object so Firestore doesn't reject it
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// ---------------- Realtime Collection Subscriptions ----------------

export interface CloudSubscriptions {
  onStudents?: (items: Student[]) => void;
  onStudentNotes?: (items: StudentNote[]) => void;
  onCallSessions?: (items: WeeklyCallSession[]) => void;
  onStudyTasks?: (items: StudyTask[]) => void;
  onDayConfigs?: (items: StudyDayConfig[]) => void;
  onDayCheckins?: (items: DayCheckin[]) => void;
  onEnglishNotes?: (items: EnglishNote[]) => void;
  onEnglishDecks?: (items: EnglishDeck[]) => void;
  onEnglishCards?: (items: EnglishCard[]) => void;
  onUniversityTerms?: (items: UniversityTerm[], meta?: { fromCache: boolean }) => void;
  onUniversityCourses?: (items: UniversityCourse[]) => void;
  onUniversityExams?: (items: UniversityExam[]) => void;
  onUniversityNotes?: (items: UniversityNote[]) => void;
  onUniversityAssignments?: (items: UniversityAssignment[]) => void;
  onProjectIdeas?: (items: ProjectIdea[]) => void;
  onPersonalNotes?: (items: PersonalNote[]) => void;
  onPersonalTags?: (items: PersonalNoteTag[], meta?: { fromCache: boolean }) => void;
  onSettings?: (settings: Record<string, any>) => void;
}

export function subscribeToUserData(uid: string, listeners: CloudSubscriptions): () => void {
  const unsubs: Unsubscribe[] = [];

  const sub = <T>(collectionName: string, callback?: (data: T[], meta?: { fromCache: boolean }) => void) => {
    if (!callback) return;
    const colRef = collection(db, 'users', uid, collectionName);
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => docSnap.data() as T);
        callback(items, { fromCache: snapshot.metadata.fromCache });
      },
      (error) => {
        console.warn(`Firestore subscription error for ${collectionName}:`, error);
      }
    );
    unsubs.push(unsub);
  };

  sub<Student>('students', listeners.onStudents);
  sub<StudentNote>('student_notes', listeners.onStudentNotes);
  sub<WeeklyCallSession>('parent_call_sessions', listeners.onCallSessions);
  sub<StudyTask>('study_tasks', listeners.onStudyTasks);
  sub<StudyDayConfig>('study_day_configs', listeners.onDayConfigs);
  sub<DayCheckin>('day_checkins', listeners.onDayCheckins);
  sub<EnglishNote>('english_notes', listeners.onEnglishNotes);
  sub<EnglishDeck>('english_decks', listeners.onEnglishDecks);
  sub<EnglishCard>('english_cards', listeners.onEnglishCards);
  sub<UniversityTerm>('university_terms', listeners.onUniversityTerms);
  sub<UniversityCourse>('university_courses', listeners.onUniversityCourses);
  sub<UniversityExam>('university_exams', listeners.onUniversityExams);
  sub<UniversityNote>('university_notes', listeners.onUniversityNotes);
  sub<UniversityAssignment>('university_assignments', listeners.onUniversityAssignments);
  sub<ProjectIdea>('project_ideas', listeners.onProjectIdeas);
  sub<PersonalNote>('personal_notes', listeners.onPersonalNotes);
  sub<PersonalNoteTag>('personal_tags', listeners.onPersonalTags);

  if (listeners.onSettings) {
    const colRef = collection(db, 'users', uid, 'settings');
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const map: Record<string, any> = {};
        snapshot.docs.forEach((docSnap) => {
          map[docSnap.id] = docSnap.data().value;
        });
        listeners.onSettings!(map);
      },
      (error) => {
        console.warn('Firestore settings subscription error:', error);
      }
    );
    unsubs.push(unsub);
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}

// ---------------- CRUD Operations for Cloud Data ----------------

export async function saveStudentCloud(uid: string, student: Student): Promise<void> {
  const ref = doc(db, 'users', uid, 'students', student.id);
  await setDoc(ref, sanitizeForFirestore(student));
}

export async function deleteStudentCloud(uid: string, studentId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'students', studentId);
  await deleteDoc(ref);
}

export async function saveStudentNoteCloud(uid: string, note: StudentNote): Promise<void> {
  const noteToSave = { ...note };

  // Fotoğraf Firestore'un 1 MB belge sınırını aşmasın diye ~200 KB'a sıkıştırılıp nota gömülür.
  if (noteToSave.photoUrl && noteToSave.photoUrl.startsWith('data:image/')) {
    try {
      noteToSave.photoUrl = await compressImageToDataUrl(noteToSave.photoUrl);
    } catch (e) {
      console.warn('Photo compression warning:', e);
    }
  }

  const ref = doc(db, 'users', uid, 'student_notes', note.id);
  await setDoc(ref, sanitizeForFirestore(noteToSave));
}

export async function deleteStudentNoteCloud(uid: string, noteId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'student_notes', noteId);
  await deleteDoc(ref);
}

export async function saveCallSessionCloud(uid: string, session: WeeklyCallSession): Promise<void> {
  const ref = doc(db, 'users', uid, 'parent_call_sessions', session.id);
  await setDoc(ref, sanitizeForFirestore(session));
}

export async function saveStudyTaskCloud(uid: string, task: StudyTask): Promise<void> {
  const ref = doc(db, 'users', uid, 'study_tasks', task.id);
  await setDoc(ref, sanitizeForFirestore(task));
}

export async function saveMultipleStudyTasksCloud(uid: string, tasks: StudyTask[]): Promise<void> {
  const batch = writeBatch(db);
  tasks.forEach((task) => {
    const ref = doc(db, 'users', uid, 'study_tasks', task.id);
    batch.set(ref, sanitizeForFirestore(task));
  });
  await batch.commit();
}

export async function deleteStudyTaskCloud(uid: string, taskId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'study_tasks', taskId);
  await deleteDoc(ref);
}

export async function saveDayConfigCloud(uid: string, config: StudyDayConfig): Promise<void> {
  const ref = doc(db, 'users', uid, 'study_day_configs', String(config.dayOfWeek));
  await setDoc(ref, sanitizeForFirestore(config));
}

export async function saveDayCheckinCloud(uid: string, checkin: DayCheckin): Promise<void> {
  const ref = doc(db, 'users', uid, 'day_checkins', checkin.date);
  await setDoc(ref, sanitizeForFirestore(checkin));
}

export async function saveEnglishNoteCloud(uid: string, note: EnglishNote): Promise<void> {
  const ref = doc(db, 'users', uid, 'english_notes', note.id);
  await setDoc(ref, sanitizeForFirestore(note));
}

export async function deleteEnglishNoteCloud(uid: string, noteId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'english_notes', noteId);
  await deleteDoc(ref);
}

export async function saveEnglishDeckCloud(uid: string, deck: EnglishDeck): Promise<void> {
  const ref = doc(db, 'users', uid, 'english_decks', deck.id);
  await setDoc(ref, sanitizeForFirestore(deck));
}

export async function deleteEnglishDeckCloud(uid: string, deckId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'english_decks', deckId);
  await deleteDoc(ref);
}

export async function saveEnglishCardCloud(uid: string, card: EnglishCard): Promise<void> {
  const ref = doc(db, 'users', uid, 'english_cards', card.id);
  await setDoc(ref, sanitizeForFirestore(card));
}

export async function saveMultipleEnglishCardsCloud(uid: string, cards: EnglishCard[]): Promise<void> {
  const batch = writeBatch(db);
  cards.forEach((card) => {
    const ref = doc(db, 'users', uid, 'english_cards', card.id);
    batch.set(ref, sanitizeForFirestore(card));
  });
  await batch.commit();
}

export async function deleteEnglishCardCloud(uid: string, cardId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'english_cards', cardId);
  await deleteDoc(ref);
}

export async function saveEnglishReviewLogCloud(uid: string, log: EnglishStudyReviewLog): Promise<void> {
  const ref = doc(db, 'users', uid, 'english_review_logs', log.id);
  await setDoc(ref, sanitizeForFirestore(log));
}

export async function saveUniversityTermCloud(uid: string, term: UniversityTerm): Promise<void> {
  const ref = doc(db, 'users', uid, 'university_terms', term.id);
  await setDoc(ref, sanitizeForFirestore(term));
}

export async function deleteUniversityTermCloud(uid: string, termId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'university_terms', termId);
  await deleteDoc(ref);
}

export async function saveUniversityCourseCloud(uid: string, course: UniversityCourse): Promise<void> {
  const ref = doc(db, 'users', uid, 'university_courses', course.id);
  await setDoc(ref, sanitizeForFirestore(course));
}

export async function saveMultipleUniversityCoursesCloud(uid: string, courses: UniversityCourse[]): Promise<void> {
  const batch = writeBatch(db);
  courses.forEach((c) => {
    const ref = doc(db, 'users', uid, 'university_courses', c.id);
    batch.set(ref, sanitizeForFirestore(c));
  });
  await batch.commit();
}

export async function deleteUniversityCourseCloud(uid: string, courseId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'university_courses', courseId);
  await deleteDoc(ref);
}

export async function saveUniversityExamCloud(uid: string, exam: UniversityExam): Promise<void> {
  const ref = doc(db, 'users', uid, 'university_exams', exam.id);
  await setDoc(ref, sanitizeForFirestore(exam));
}

export async function saveMultipleUniversityExamsCloud(uid: string, exams: UniversityExam[]): Promise<void> {
  const batch = writeBatch(db);
  exams.forEach((ex) => {
    const ref = doc(db, 'users', uid, 'university_exams', ex.id);
    batch.set(ref, sanitizeForFirestore(ex));
  });
  await batch.commit();
}

export async function deleteUniversityExamCloud(uid: string, examId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'university_exams', examId);
  await deleteDoc(ref);
}

export async function saveUniversityNoteCloud(uid: string, note: UniversityNote): Promise<void> {
  const ref = doc(db, 'users', uid, 'university_notes', note.id);
  await setDoc(ref, sanitizeForFirestore(note));
}

export async function deleteUniversityNoteCloud(uid: string, noteId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'university_notes', noteId);
  await deleteDoc(ref);
}

export async function saveUniversityAssignmentCloud(uid: string, assignment: UniversityAssignment): Promise<void> {
  const ref = doc(db, 'users', uid, 'university_assignments', assignment.id);
  await setDoc(ref, sanitizeForFirestore(assignment));
}

export async function deleteUniversityAssignmentCloud(uid: string, assignmentId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'university_assignments', assignmentId);
  await deleteDoc(ref);
}

export async function saveProjectIdeaCloud(uid: string, idea: ProjectIdea): Promise<void> {
  const ref = doc(db, 'users', uid, 'project_ideas', idea.id);
  await setDoc(ref, sanitizeForFirestore(idea));
}

export async function deleteProjectIdeaCloud(uid: string, ideaId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'project_ideas', ideaId);
  await deleteDoc(ref);
}

export async function savePersonalNoteCloud(uid: string, note: PersonalNote): Promise<void> {
  const ref = doc(db, 'users', uid, 'personal_notes', note.id);
  await setDoc(ref, sanitizeForFirestore(note));
}

export async function deletePersonalNoteCloud(uid: string, noteId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'personal_notes', noteId);
  await deleteDoc(ref);
}

export async function savePersonalTagCloud(uid: string, tag: PersonalNoteTag): Promise<void> {
  const ref = doc(db, 'users', uid, 'personal_tags', tag.id);
  await setDoc(ref, sanitizeForFirestore(tag));
}

export async function deletePersonalTagCloud(uid: string, tagId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'personal_tags', tagId);
  await deleteDoc(ref);
}

export async function saveSettingCloud(uid: string, key: string, value: any): Promise<void> {
  const ref = doc(db, 'users', uid, 'settings', key);
  await setDoc(ref, { key, value: sanitizeForFirestore(value), updatedAt: Date.now() });
}

export async function getSettingCloud<T>(uid: string, key: string): Promise<T | null> {
  const ref = doc(db, 'users', uid, 'settings', key);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().value as T;
  }
  return null;
}


// ---------------- Cascade deletes (IndexedDB davranışıyla aynı) ----------------

async function deleteWhere(uid: string, collectionName: string, field: string, value: string): Promise<void> {
  const q = query(collection(db, 'users', uid, collectionName), where(field, '==', value));
  const snap = await getDocs(q);
  if (snap.empty) return;
  // writeBatch en fazla 500 işlem alır
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function deleteStudentCascadeCloud(uid: string, studentId: string): Promise<void> {
  await deleteWhere(uid, 'student_notes', 'studentId', studentId);
  await deleteStudentCloud(uid, studentId);
}

export async function deleteEnglishDeckCascadeCloud(uid: string, deckId: string): Promise<void> {
  await deleteWhere(uid, 'english_cards', 'deckId', deckId);
  await deleteEnglishDeckCloud(uid, deckId);
}

export async function deleteUniversityCourseCascadeCloud(uid: string, courseId: string): Promise<void> {
  await deleteWhere(uid, 'university_exams', 'courseId', courseId);
  await deleteWhere(uid, 'university_notes', 'courseId', courseId);
  await deleteWhere(uid, 'university_assignments', 'courseId', courseId);
  await deleteUniversityCourseCloud(uid, courseId);
}

export async function deleteUniversityTermCascadeCloud(uid: string, termId: string): Promise<void> {
  const courseSnap = await getDocs(
    query(collection(db, 'users', uid, 'university_courses'), where('termId', '==', termId))
  );
  for (const c of courseSnap.docs) {
    await deleteUniversityCourseCascadeCloud(uid, c.id);
  }
  await deleteWhere(uid, 'university_exams', 'termId', termId);
  await deleteWhere(uid, 'university_notes', 'termId', termId);
  await deleteWhere(uid, 'university_assignments', 'termId', termId);
  await deleteUniversityTermCloud(uid, termId);
}

export async function deletePersonalTagCascadeCloud(uid: string, tagId: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'personal_notes'), where('tagIds', 'array-contains', tagId))
  );
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => {
      const data = d.data() as PersonalNote;
      batch.set(d.ref, sanitizeForFirestore({
        ...data,
        tagIds: (data.tagIds || []).filter((t) => t !== tagId),
        updatedAt: Date.now()
      }));
    });
    await batch.commit();
  }
  await deletePersonalTagCloud(uid, tagId);
}

export async function setActiveUniversityTermCloud(uid: string, activeTermId: string): Promise<void> {
  const snap = await getDocs(collection(db, 'users', uid, 'university_terms'));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.set(d.ref, sanitizeForFirestore({
      ...(d.data() as UniversityTerm),
      isActive: d.id === activeTermId,
      updatedAt: Date.now()
    }));
  });
  await batch.commit();
}

const USER_COLLECTIONS = [
  'students', 'student_notes', 'parent_call_sessions', 'study_tasks', 'study_day_configs',
  'day_checkins', 'english_notes', 'english_decks', 'english_cards', 'english_review_logs',
  'university_terms', 'university_courses', 'university_exams', 'university_notes',
  'university_assignments', 'project_ideas', 'personal_notes', 'personal_tags', 'settings', 'photos'
];

/**
 * Hesaba ait tüm verileri siler (profil belgesi korunur).
 */
export async function clearAllUserDataCloud(uid: string): Promise<void> {
  for (const name of USER_COLLECTIONS) {
    const snap = await getDocs(collection(db, 'users', uid, name));
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}
