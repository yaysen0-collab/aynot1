import { 
  Student, 
  StudentNote, 
  BackupData, 
  WeeklyCallSession, 
  ParentCallSettings,
  StudyTask,
  StudyDayConfig,
  DayCheckin,
  StudySettings,
  EnglishNote,
  EnglishDeck,
  EnglishCard,
  EnglishStudyReviewLog,
  EnglishDailyGoalSettings,
  UniversityTerm,
  UniversityCourse,
  UniversityExam,
  UniversityNote,
  UniversityAssignment,
  ProjectIdea,
  PersonalNote,
  PersonalNoteTag
} from '../types';

import { toLocalISODate } from '../utils/calendar';
const DB_NAME = 'ogretmen_asistani_db';
const DB_VERSION = 7; // Incremented for Personal Notes & Tags migration

const STORES = {
  STUDENTS: 'students',
  NOTES: 'student_notes',
  SETTINGS: 'settings',
  CALL_SESSIONS: 'parent_call_sessions',
  STUDY_TASKS: 'study_tasks',
  DAY_CONFIGS: 'study_day_configs',
  DAY_CHECKINS: 'day_checkins',
  ENGLISH_NOTES: 'english_notes',
  ENGLISH_DECKS: 'english_decks',
  ENGLISH_CARDS: 'english_cards',
  ENGLISH_LOGS: 'english_review_logs',
  UNIVERSITY_TERMS: 'university_terms',
  UNIVERSITY_COURSES: 'university_courses',
  UNIVERSITY_EXAMS: 'university_exams',
  UNIVERSITY_NOTES: 'university_notes',
  UNIVERSITY_ASSIGNMENTS: 'university_assignments',
  PROJECT_IDEAS: 'project_ideas',
  PERSONAL_NOTES: 'personal_notes',
  PERSONAL_TAGS: 'personal_tags',
} as const;

export const DEFAULT_PERSONAL_TAGS: PersonalNoteTag[] = [
  { id: 'tag-prompt', name: 'Prompt', color: 'purple', isDefault: true },
  { id: 'tag-fikir', name: 'Fikir', color: 'amber', isDefault: true },
  { id: 'tag-not', name: 'Not', color: 'blue', isDefault: true },
  { id: 'tag-yapilacak', name: 'Yapılacak', color: 'orange', isDefault: true },
  { id: 'tag-kod', name: 'Kod', color: 'green', isDefault: true },
  { id: 'tag-link', name: 'Link', color: 'teal', isDefault: true },
  { id: 'tag-onemli', name: 'Önemli', color: 'rose', isDefault: true },
];

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Students store
      if (!db.objectStoreNames.contains(STORES.STUDENTS)) {
        const studentStore = db.createObjectStore(STORES.STUDENTS, { keyPath: 'id' });
        studentStore.createIndex('group', 'group', { unique: false });
        studentStore.createIndex('name', 'name', { unique: false });
      }

      // 2. Notes store
      if (!db.objectStoreNames.contains(STORES.NOTES)) {
        const noteStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
        noteStore.createIndex('studentId', 'studentId', { unique: false });
        noteStore.createIndex('category', 'category', { unique: false });
        noteStore.createIndex('date', 'date', { unique: false });
      }

      // 3. Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      // 4. Version 2 Migration: Parent Call Sessions store
      if (!db.objectStoreNames.contains(STORES.CALL_SESSIONS)) {
        const callStore = db.createObjectStore(STORES.CALL_SESSIONS, { keyPath: 'id' });
        callStore.createIndex('weekDate', 'weekDate', { unique: false });
        callStore.createIndex('status', 'status', { unique: false });
      }

      // 5. Version 3 Migration: Study Tasks
      if (!db.objectStoreNames.contains(STORES.STUDY_TASKS)) {
        const taskStore = db.createObjectStore(STORES.STUDY_TASKS, { keyPath: 'id' });
        taskStore.createIndex('date', 'date', { unique: false });
        taskStore.createIndex('dayOfWeek', 'dayOfWeek', { unique: false });
        taskStore.createIndex('type', 'type', { unique: false });
        taskStore.createIndex('completed', 'completed', { unique: false });
      }

      // 6. Version 3 Migration: Day Configs (okul günü / boş gün)
      if (!db.objectStoreNames.contains(STORES.DAY_CONFIGS)) {
        db.createObjectStore(STORES.DAY_CONFIGS, { keyPath: 'dayOfWeek' });
      }

      // 7. Version 3 Migration: Evening Check-ins (rahat / normal / yorucu)
      if (!db.objectStoreNames.contains(STORES.DAY_CHECKINS)) {
        db.createObjectStore(STORES.DAY_CHECKINS, { keyPath: 'date' });
      }

      // 8. Version 4 Migration: English Notes
      if (!db.objectStoreNames.contains(STORES.ENGLISH_NOTES)) {
        const engNoteStore = db.createObjectStore(STORES.ENGLISH_NOTES, { keyPath: 'id' });
        engNoteStore.createIndex('tag', 'tag', { unique: false });
        engNoteStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 9. Version 4 Migration: English Decks
      if (!db.objectStoreNames.contains(STORES.ENGLISH_DECKS)) {
        const engDeckStore = db.createObjectStore(STORES.ENGLISH_DECKS, { keyPath: 'id' });
        engDeckStore.createIndex('name', 'name', { unique: false });
      }

      // 10. Version 4 Migration: English Cards
      if (!db.objectStoreNames.contains(STORES.ENGLISH_CARDS)) {
        const engCardStore = db.createObjectStore(STORES.ENGLISH_CARDS, { keyPath: 'id' });
        engCardStore.createIndex('deckId', 'deckId', { unique: false });
        engCardStore.createIndex('nextReviewDate', 'nextReviewDate', { unique: false });
        engCardStore.createIndex('learnedDate', 'learnedDate', { unique: false });
      }

      // 11. Version 4 Migration: English Study Review Logs
      if (!db.objectStoreNames.contains(STORES.ENGLISH_LOGS)) {
        const engLogStore = db.createObjectStore(STORES.ENGLISH_LOGS, { keyPath: 'id' });
        engLogStore.createIndex('date', 'date', { unique: false });
        engLogStore.createIndex('cardId', 'cardId', { unique: false });
      }

      // 12. Version 5 Migration: University Terms
      if (!db.objectStoreNames.contains(STORES.UNIVERSITY_TERMS)) {
        const termStore = db.createObjectStore(STORES.UNIVERSITY_TERMS, { keyPath: 'id' });
        termStore.createIndex('isActive', 'isActive', { unique: false });
        termStore.createIndex('isArchived', 'isArchived', { unique: false });
      }

      // 13. Version 5 Migration: University Courses
      if (!db.objectStoreNames.contains(STORES.UNIVERSITY_COURSES)) {
        const courseStore = db.createObjectStore(STORES.UNIVERSITY_COURSES, { keyPath: 'id' });
        courseStore.createIndex('termId', 'termId', { unique: false });
        courseStore.createIndex('name', 'name', { unique: false });
      }

      // 14. Version 5 Migration: University Exams
      if (!db.objectStoreNames.contains(STORES.UNIVERSITY_EXAMS)) {
        const examStore = db.createObjectStore(STORES.UNIVERSITY_EXAMS, { keyPath: 'id' });
        examStore.createIndex('termId', 'termId', { unique: false });
        examStore.createIndex('courseId', 'courseId', { unique: false });
        examStore.createIndex('date', 'date', { unique: false });
      }

      // 15. Version 5 Migration: University Notes
      if (!db.objectStoreNames.contains(STORES.UNIVERSITY_NOTES)) {
        const univNoteStore = db.createObjectStore(STORES.UNIVERSITY_NOTES, { keyPath: 'id' });
        univNoteStore.createIndex('termId', 'termId', { unique: false });
        univNoteStore.createIndex('courseId', 'courseId', { unique: false });
        univNoteStore.createIndex('tag', 'tag', { unique: false });
      }

      // 16. Version 5 Migration: University Assignments
      if (!db.objectStoreNames.contains(STORES.UNIVERSITY_ASSIGNMENTS)) {
        const assignmentStore = db.createObjectStore(STORES.UNIVERSITY_ASSIGNMENTS, { keyPath: 'id' });
        assignmentStore.createIndex('termId', 'termId', { unique: false });
        assignmentStore.createIndex('courseId', 'courseId', { unique: false });
        assignmentStore.createIndex('dueDate', 'dueDate', { unique: false });
      }

      // 17. Version 6 Migration: Project Ideas & SaaS Projects
      if (!db.objectStoreNames.contains(STORES.PROJECT_IDEAS)) {
        const ideaStore = db.createObjectStore(STORES.PROJECT_IDEAS, { keyPath: 'id' });
        ideaStore.createIndex('status', 'status', { unique: false });
        ideaStore.createIndex('type', 'type', { unique: false });
        ideaStore.createIndex('isStarred', 'isStarred', { unique: false });
        ideaStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        ideaStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 18. Version 7 Migration: Personal Notes & Tags
      if (!db.objectStoreNames.contains(STORES.PERSONAL_NOTES)) {
        const pNoteStore = db.createObjectStore(STORES.PERSONAL_NOTES, { keyPath: 'id' });
        pNoteStore.createIndex('isPinned', 'isPinned', { unique: false });
        pNoteStore.createIndex('isArchived', 'isArchived', { unique: false });
        pNoteStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        pNoteStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PERSONAL_TAGS)) {
        const pTagStore = db.createObjectStore(STORES.PERSONAL_TAGS, { keyPath: 'id' });
        pTagStore.createIndex('name', 'name', { unique: false });
        for (const tag of DEFAULT_PERSONAL_TAGS) {
          pTagStore.put(tag);
        }
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// ---------------- Students CRUD ----------------

export async function getAllStudents(): Promise<Student[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.STUDENTS, 'readonly');
    const store = tx.objectStore(STORES.STUDENTS);
    const req = store.getAll();
    req.onsuccess = () => {
      const students = (req.result || []) as Student[];
      students.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      resolve(students);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getStudentById(id: string): Promise<Student | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.STUDENTS, 'readonly');
    const store = tx.objectStore(STORES.STUDENTS);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveStudent(student: Student): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.STUDENTS, 'readwrite');
    const store = tx.objectStore(STORES.STUDENTS);
    const req = store.put(student);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteStudent(studentId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.STUDENTS, STORES.NOTES], 'readwrite');
    const studentStore = tx.objectStore(STORES.STUDENTS);
    const noteStore = tx.objectStore(STORES.NOTES);

    studentStore.delete(studentId);

    const noteIndex = noteStore.index('studentId');
    const noteReq = noteIndex.getAllKeys(studentId);

    noteReq.onsuccess = () => {
      const noteKeys = noteReq.result;
      for (const key of noteKeys) {
        noteStore.delete(key);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------- Notes CRUD ----------------

export async function getNotesByStudentId(studentId: string): Promise<StudentNote[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.NOTES, 'readonly');
    const store = tx.objectStore(STORES.NOTES);
    const index = store.index('studentId');
    const req = index.getAll(studentId);
    req.onsuccess = () => {
      const notes = (req.result || []) as StudentNote[];
      notes.sort((a, b) => b.createdAt - a.createdAt);
      resolve(notes);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAllNotes(): Promise<StudentNote[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.NOTES, 'readonly');
    const store = tx.objectStore(STORES.NOTES);
    const req = store.getAll();
    req.onsuccess = () => {
      const notes = (req.result || []) as StudentNote[];
      notes.sort((a, b) => b.createdAt - a.createdAt);
      resolve(notes);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveNote(note: StudentNote): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.NOTES, 'readwrite');
    const store = tx.objectStore(STORES.NOTES);
    const req = store.put(note);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.NOTES, 'readwrite');
    const store = tx.objectStore(STORES.NOTES);
    const req = store.delete(noteId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- Weekly Parent Call Sessions CRUD ----------------

export async function getAllCallSessions(): Promise<WeeklyCallSession[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CALL_SESSIONS, 'readonly');
    const store = tx.objectStore(STORES.CALL_SESSIONS);
    const req = store.getAll();
    req.onsuccess = () => {
      const sessions = (req.result || []) as WeeklyCallSession[];
      sessions.sort((a, b) => b.weekDate.localeCompare(a.weekDate));
      resolve(sessions);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getCallSessionById(id: string): Promise<WeeklyCallSession | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CALL_SESSIONS, 'readonly');
    const store = tx.objectStore(STORES.CALL_SESSIONS);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCallSession(session: WeeklyCallSession): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CALL_SESSIONS, 'readwrite');
    const store = tx.objectStore(STORES.CALL_SESSIONS);
    const req = store.put(session);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCallSession(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CALL_SESSIONS, 'readwrite');
    const store = tx.objectStore(STORES.CALL_SESSIONS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- Study Tasks CRUD ----------------

export async function getAllStudyTasks(): Promise<StudyTask[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.STUDY_TASKS, 'readonly');
    const store = tx.objectStore(STORES.STUDY_TASKS);
    const req = store.getAll();
    req.onsuccess = () => {
      const tasks = (req.result || []) as StudyTask[];
      tasks.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
      resolve(tasks);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getStudyTasksByDate(date: string): Promise<StudyTask[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.STUDY_TASKS, 'readonly');
    const store = tx.objectStore(STORES.STUDY_TASKS);
    const index = store.index('date');
    const req = index.getAll(date);
    req.onsuccess = () => {
      const tasks = (req.result || []) as StudyTask[];
      tasks.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
      resolve(tasks);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveStudyTask(task: StudyTask): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.STUDY_TASKS, 'readwrite');
    const store = tx.objectStore(STORES.STUDY_TASKS);
    const req = store.put(task);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveMultipleStudyTasks(tasks: StudyTask[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.STUDY_TASKS, 'readwrite');
    const store = tx.objectStore(STORES.STUDY_TASKS);
    for (const t of tasks) {
      store.put(t);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteStudyTask(taskId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.STUDY_TASKS, 'readwrite');
    const store = tx.objectStore(STORES.STUDY_TASKS);
    const req = store.delete(taskId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- Study Day Configurations (Okul Günü / Boş Gün) ----------------

const DEFAULT_DAY_CONFIGS: StudyDayConfig[] = [
  { dayOfWeek: 1, dayType: 'okul_gunu', notes: 'Pazartesi - Okul günü' },
  { dayOfWeek: 2, dayType: 'okul_gunu', notes: 'Salı - Okul günü' },
  { dayOfWeek: 3, dayType: 'okul_gunu', notes: 'Çarşamba - Okul günü' },
  { dayOfWeek: 4, dayType: 'okul_gunu', notes: 'Perşembe - Okul günü' },
  { dayOfWeek: 5, dayType: 'okul_gunu', notes: 'Cuma - Okul günü' },
  { dayOfWeek: 6, dayType: 'bos_gun', notes: 'Cumartesi - Boş gün' },
  { dayOfWeek: 0, dayType: 'bos_gun', notes: 'Pazar - Boş gün' },
];

export async function getAllDayConfigs(): Promise<StudyDayConfig[]> {
  const db = await getDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.DAY_CONFIGS, 'readonly');
      const store = tx.objectStore(STORES.DAY_CONFIGS);
      const req = store.getAll();
      req.onsuccess = () => {
        const result = (req.result || []) as StudyDayConfig[];
        if (result.length === 0) {
          resolve(DEFAULT_DAY_CONFIGS);
        } else {
          resolve(result);
        }
      };
      req.onerror = () => resolve(DEFAULT_DAY_CONFIGS);
    } catch {
      resolve(DEFAULT_DAY_CONFIGS);
    }
  });
}

export async function saveDayConfig(config: StudyDayConfig): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DAY_CONFIGS, 'readwrite');
    const store = tx.objectStore(STORES.DAY_CONFIGS);
    const req = store.put(config);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveAllDayConfigs(configs: StudyDayConfig[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DAY_CONFIGS, 'readwrite');
    const store = tx.objectStore(STORES.DAY_CONFIGS);
    for (const c of configs) {
      store.put(c);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------- Evening Check-ins (Day Energy Rating) ----------------

export async function getDayCheckin(date: string): Promise<DayCheckin | null> {
  const db = await getDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.DAY_CHECKINS, 'readonly');
      const store = tx.objectStore(STORES.DAY_CHECKINS);
      const req = store.get(date);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveDayCheckin(checkin: DayCheckin): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DAY_CHECKINS, 'readwrite');
    const store = tx.objectStore(STORES.DAY_CHECKINS);
    const req = store.put(checkin);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllDayCheckins(): Promise<DayCheckin[]> {
  const db = await getDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.DAY_CHECKINS, 'readonly');
      const store = tx.objectStore(STORES.DAY_CHECKINS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as DayCheckin[]);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

// ---------------- Study Settings ----------------

const DEFAULT_STUDY_SETTINGS: StudySettings = {
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  eveningCheckinHour: 18,
  alwaysSuggestLightOnFatigue: true,
};

export async function getStudySettings(): Promise<StudySettings> {
  const db = await getDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.SETTINGS, 'readonly');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.get('study_settings');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve(req.result.value as StudySettings);
        } else {
          const saved = localStorage.getItem('oa_study_settings');
          if (saved) {
            try {
              resolve(JSON.parse(saved));
              return;
            } catch {
              // ignore
            }
          }
          resolve(DEFAULT_STUDY_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_STUDY_SETTINGS);
    } catch {
      resolve(DEFAULT_STUDY_SETTINGS);
    }
  });
}

export async function saveStudySettings(settings: StudySettings): Promise<void> {
  localStorage.setItem('oa_study_settings', JSON.stringify(settings));
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = tx.objectStore(STORES.SETTINGS);
    const req = store.put({ key: 'study_settings', value: settings });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- Settings Store CRUD ----------------

const DEFAULT_CALL_SETTINGS: ParentCallSettings = {
  callDay: 5, // Cuma
  callTime: '14:00',
  reminderEnabled: true,
};

export async function getParentCallSettings(): Promise<ParentCallSettings> {
  const db = await getDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.SETTINGS, 'readonly');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.get('parent_call_settings');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve(req.result.value as ParentCallSettings);
        } else {
          const saved = localStorage.getItem('oa_parent_call_settings');
          if (saved) {
            try {
              resolve(JSON.parse(saved));
              return;
            } catch {
              // ignore
            }
          }
          resolve(DEFAULT_CALL_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_CALL_SETTINGS);
    } catch {
      resolve(DEFAULT_CALL_SETTINGS);
    }
  });
}

export async function saveParentCallSettings(settings: ParentCallSettings): Promise<void> {
  localStorage.setItem('oa_parent_call_settings', JSON.stringify(settings));
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = tx.objectStore(STORES.SETTINGS);
    const req = store.put({ key: 'parent_call_settings', value: settings });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getUserName(): Promise<string> {
  const local = localStorage.getItem('aynot_user_name') || localStorage.getItem('oa_user_name');
  if (local && local.trim()) return local.trim();
  const db = await getDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.SETTINGS, 'readonly');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.get('user_name');
      req.onsuccess = () => {
        if (req.result && req.result.value && typeof req.result.value === 'string' && req.result.value.trim()) {
          resolve(req.result.value.trim());
        } else {
          resolve('Zipidola');
        }
      };
      req.onerror = () => resolve('Zipidola');
    } catch {
      resolve('Zipidola');
    }
  });
}

export async function saveUserName(name: string): Promise<void> {
  const cleanName = (name && name.trim()) ? name.trim() : 'Zipidola';
  localStorage.setItem('aynot_user_name', cleanName);
  localStorage.setItem('oa_user_name', cleanName);
  const db = await getDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.SETTINGS, 'readwrite');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.put({ key: 'user_name', value: cleanName });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}


// ---------------- English Store CRUD ----------------

export async function getAllEnglishNotes(): Promise<EnglishNote[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ENGLISH_NOTES, 'readonly');
    const store = tx.objectStore(STORES.ENGLISH_NOTES);
    const req = store.getAll();
    req.onsuccess = () => {
      const notes = (req.result || []) as EnglishNote[];
      notes.sort((a, b) => b.createdAt - a.createdAt);
      resolve(notes);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveEnglishNote(note: EnglishNote): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ENGLISH_NOTES, 'readwrite');
    const store = tx.objectStore(STORES.ENGLISH_NOTES);
    const req = store.put(note);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteEnglishNote(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ENGLISH_NOTES, 'readwrite');
    const store = tx.objectStore(STORES.ENGLISH_NOTES);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllEnglishDecks(): Promise<EnglishDeck[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ENGLISH_DECKS, 'readonly');
    const store = tx.objectStore(STORES.ENGLISH_DECKS);
    const req = store.getAll();
    req.onsuccess = () => {
      const decks = (req.result || []) as EnglishDeck[];
      decks.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      resolve(decks);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveEnglishDeck(deck: EnglishDeck): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ENGLISH_DECKS, 'readwrite');
    const store = tx.objectStore(STORES.ENGLISH_DECKS);
    const req = store.put(deck);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteEnglishDeck(deckId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.ENGLISH_DECKS, STORES.ENGLISH_CARDS], 'readwrite');
    const deckStore = tx.objectStore(STORES.ENGLISH_DECKS);
    const cardStore = tx.objectStore(STORES.ENGLISH_CARDS);

    deckStore.delete(deckId);

    const cardIndex = cardStore.index('deckId');
    const cardReq = cardIndex.getAllKeys(deckId);
    cardReq.onsuccess = () => {
      for (const key of cardReq.result) {
        cardStore.delete(key);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllEnglishCards(): Promise<EnglishCard[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ENGLISH_CARDS, 'readonly');
    const store = tx.objectStore(STORES.ENGLISH_CARDS);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []) as EnglishCard[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveEnglishCard(card: EnglishCard): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ENGLISH_CARDS, 'readwrite');
    const store = tx.objectStore(STORES.ENGLISH_CARDS);
    const req = store.put(card);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveMultipleEnglishCards(cards: EnglishCard[]): Promise<void> {
  if (cards.length === 0) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ENGLISH_CARDS, 'readwrite');
    const store = tx.objectStore(STORES.ENGLISH_CARDS);
    for (const card of cards) {
      store.put(card);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteEnglishCard(cardId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ENGLISH_CARDS, 'readwrite');
    const store = tx.objectStore(STORES.ENGLISH_CARDS);
    const req = store.delete(cardId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllEnglishLogs(): Promise<EnglishStudyReviewLog[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ENGLISH_LOGS, 'readonly');
    const store = tx.objectStore(STORES.ENGLISH_LOGS);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []) as EnglishStudyReviewLog[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveEnglishLog(log: EnglishStudyReviewLog): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ENGLISH_LOGS, 'readwrite');
    const store = tx.objectStore(STORES.ENGLISH_LOGS);
    const req = store.put(log);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export const saveEnglishReviewLog = saveEnglishLog;

// ---------------- English Daily Goal Settings ----------------
export const DEFAULT_ENGLISH_SETTINGS: EnglishDailyGoalSettings = {
  dailyNewWordGoal: 5,
  dailyReviewLimit: 20,
  reduceGoalOnFatigue: true,
};

export async function getEnglishSettings(): Promise<EnglishDailyGoalSettings> {
  const db = await getDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.SETTINGS, 'readonly');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.get('english_settings');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve(req.result.value as EnglishDailyGoalSettings);
        } else {
          const saved = localStorage.getItem('oa_english_settings');
          if (saved) {
            try {
              resolve(JSON.parse(saved));
              return;
            } catch {
              // ignore
            }
          }
          resolve(DEFAULT_ENGLISH_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_ENGLISH_SETTINGS);
    } catch {
      resolve(DEFAULT_ENGLISH_SETTINGS);
    }
  });
}

export async function saveEnglishSettings(settings: EnglishDailyGoalSettings): Promise<void> {
  localStorage.setItem('oa_english_settings', JSON.stringify(settings));
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = tx.objectStore(STORES.SETTINGS);
    const req = store.put({ key: 'english_settings', value: settings });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- University Store CRUD ----------------

export async function getAllUniversityTerms(): Promise<UniversityTerm[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_TERMS, 'readonly');
    const store = tx.objectStore(STORES.UNIVERSITY_TERMS);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []) as UniversityTerm[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveUniversityTerm(term: UniversityTerm): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_TERMS, 'readwrite');
    const store = tx.objectStore(STORES.UNIVERSITY_TERMS);
    const req = store.put(term);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function setActiveUniversityTerm(activeTermId: string): Promise<void> {
  const terms = await getAllUniversityTerms();
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_TERMS, 'readwrite');
    const store = tx.objectStore(STORES.UNIVERSITY_TERMS);
    for (const term of terms) {
      store.put({
        ...term,
        isActive: term.id === activeTermId,
        updatedAt: Date.now(),
      });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteUniversityTerm(termId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([
      STORES.UNIVERSITY_TERMS,
      STORES.UNIVERSITY_COURSES,
      STORES.UNIVERSITY_EXAMS,
      STORES.UNIVERSITY_NOTES,
      STORES.UNIVERSITY_ASSIGNMENTS
    ], 'readwrite');

    tx.objectStore(STORES.UNIVERSITY_TERMS).delete(termId);
    
    // Also remove cascaded items from this term
    const courseStore = tx.objectStore(STORES.UNIVERSITY_COURSES);
    const courseReq = courseStore.getAll();
    courseReq.onsuccess = () => {
      const courses = (courseReq.result || []) as UniversityCourse[];
      const toDeleteCourseIds = new Set(courses.filter(c => c.termId === termId).map(c => c.id));
      for (const c of courses) {
        if (c.termId === termId) courseStore.delete(c.id);
      }

      const examStore = tx.objectStore(STORES.UNIVERSITY_EXAMS);
      const examReq = examStore.getAll();
      examReq.onsuccess = () => {
        const exams = (examReq.result || []) as UniversityExam[];
        for (const e of exams) {
          if (e.termId === termId || toDeleteCourseIds.has(e.courseId)) {
            examStore.delete(e.id);
          }
        }
      };

      const noteStore = tx.objectStore(STORES.UNIVERSITY_NOTES);
      const noteReq = noteStore.getAll();
      noteReq.onsuccess = () => {
        const notes = (noteReq.result || []) as UniversityNote[];
        for (const n of notes) {
          if (n.termId === termId || toDeleteCourseIds.has(n.courseId)) {
            noteStore.delete(n.id);
          }
        }
      };

      const assignStore = tx.objectStore(STORES.UNIVERSITY_ASSIGNMENTS);
      const assignReq = assignStore.getAll();
      assignReq.onsuccess = () => {
        const assigns = (assignReq.result || []) as UniversityAssignment[];
        for (const a of assigns) {
          if (a.termId === termId || toDeleteCourseIds.has(a.courseId)) {
            assignStore.delete(a.id);
          }
        }
      };
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllUniversityCourses(): Promise<UniversityCourse[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_COURSES, 'readonly');
    const store = tx.objectStore(STORES.UNIVERSITY_COURSES);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []) as UniversityCourse[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveUniversityCourse(course: UniversityCourse): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_COURSES, 'readwrite');
    const store = tx.objectStore(STORES.UNIVERSITY_COURSES);
    const req = store.put(course);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveMultipleUniversityCourses(courses: UniversityCourse[]): Promise<void> {
  if (courses.length === 0) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_COURSES, 'readwrite');
    const store = tx.objectStore(STORES.UNIVERSITY_COURSES);
    for (const c of courses) {
      store.put(c);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteUniversityCourse(courseId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([
      STORES.UNIVERSITY_COURSES,
      STORES.UNIVERSITY_EXAMS,
      STORES.UNIVERSITY_NOTES,
      STORES.UNIVERSITY_ASSIGNMENTS
    ], 'readwrite');

    tx.objectStore(STORES.UNIVERSITY_COURSES).delete(courseId);

    // Delete exams for this course
    const examStore = tx.objectStore(STORES.UNIVERSITY_EXAMS);
    const examReq = examStore.getAll();
    examReq.onsuccess = () => {
      const exams = (examReq.result || []) as UniversityExam[];
      for (const e of exams) {
        if (e.courseId === courseId) examStore.delete(e.id);
      }
    };

    // Delete notes for this course
    const noteStore = tx.objectStore(STORES.UNIVERSITY_NOTES);
    const noteReq = noteStore.getAll();
    noteReq.onsuccess = () => {
      const notes = (noteReq.result || []) as UniversityNote[];
      for (const n of notes) {
        if (n.courseId === courseId) noteStore.delete(n.id);
      }
    };

    // Delete assignments for this course
    const assignStore = tx.objectStore(STORES.UNIVERSITY_ASSIGNMENTS);
    const assignReq = assignStore.getAll();
    assignReq.onsuccess = () => {
      const assigns = (assignReq.result || []) as UniversityAssignment[];
      for (const a of assigns) {
        if (a.courseId === courseId) assignStore.delete(a.id);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllUniversityExams(): Promise<UniversityExam[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_EXAMS, 'readonly');
    const store = tx.objectStore(STORES.UNIVERSITY_EXAMS);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []) as UniversityExam[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveUniversityExam(exam: UniversityExam): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_EXAMS, 'readwrite');
    const store = tx.objectStore(STORES.UNIVERSITY_EXAMS);
    const req = store.put(exam);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveMultipleUniversityExams(exams: UniversityExam[]): Promise<void> {
  if (exams.length === 0) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_EXAMS, 'readwrite');
    const store = tx.objectStore(STORES.UNIVERSITY_EXAMS);
    for (const e of exams) {
      store.put(e);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteUniversityExam(examId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_EXAMS, 'readwrite');
    const store = tx.objectStore(STORES.UNIVERSITY_EXAMS);
    const req = store.delete(examId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllUniversityNotes(): Promise<UniversityNote[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_NOTES, 'readonly');
    const store = tx.objectStore(STORES.UNIVERSITY_NOTES);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []) as UniversityNote[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveUniversityNote(note: UniversityNote): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_NOTES, 'readwrite');
    const store = tx.objectStore(STORES.UNIVERSITY_NOTES);
    const req = store.put(note);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteUniversityNote(noteId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_NOTES, 'readwrite');
    const store = tx.objectStore(STORES.UNIVERSITY_NOTES);
    const req = store.delete(noteId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllUniversityAssignments(): Promise<UniversityAssignment[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_ASSIGNMENTS, 'readonly');
    const store = tx.objectStore(STORES.UNIVERSITY_ASSIGNMENTS);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []) as UniversityAssignment[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveUniversityAssignment(assignment: UniversityAssignment): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_ASSIGNMENTS, 'readwrite');
    const store = tx.objectStore(STORES.UNIVERSITY_ASSIGNMENTS);
    const req = store.put(assignment);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteUniversityAssignment(assignmentId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.UNIVERSITY_ASSIGNMENTS, 'readwrite');
    const store = tx.objectStore(STORES.UNIVERSITY_ASSIGNMENTS);
    const req = store.delete(assignmentId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- Project Ideas & SaaS Projects ----------------

export async function getAllProjectIdeas(): Promise<ProjectIdea[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PROJECT_IDEAS, 'readonly');
    const store = tx.objectStore(STORES.PROJECT_IDEAS);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result || []) as ProjectIdea[];
      // Sort by updatedAt descending by default
      items.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getProjectIdeaById(ideaId: string): Promise<ProjectIdea | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PROJECT_IDEAS, 'readonly');
    const store = tx.objectStore(STORES.PROJECT_IDEAS);
    const req = store.get(ideaId);
    req.onsuccess = () => resolve((req.result as ProjectIdea) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProjectIdea(idea: ProjectIdea): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PROJECT_IDEAS, 'readwrite');
    const store = tx.objectStore(STORES.PROJECT_IDEAS);
    const req = store.put(idea);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveMultipleProjectIdeas(ideas: ProjectIdea[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PROJECT_IDEAS, 'readwrite');
    const store = tx.objectStore(STORES.PROJECT_IDEAS);
    for (const idea of ideas) {
      store.put(idea);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteProjectIdea(ideaId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PROJECT_IDEAS, 'readwrite');
    const store = tx.objectStore(STORES.PROJECT_IDEAS);
    const req = store.delete(ideaId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- Kişisel Notlar & Etiketler CRUD ----------------

export async function getAllPersonalTags(): Promise<PersonalNoteTag[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PERSONAL_TAGS, 'readonly');
    const store = tx.objectStore(STORES.PERSONAL_TAGS);
    const req = store.getAll();
    req.onsuccess = () => {
      const tags = (req.result || []) as PersonalNoteTag[];
      if (tags.length === 0) {
        // If empty, initialize default tags
        const initTx = db.transaction(STORES.PERSONAL_TAGS, 'readwrite');
        const initStore = initTx.objectStore(STORES.PERSONAL_TAGS);
        for (const t of DEFAULT_PERSONAL_TAGS) {
          initStore.put(t);
        }
        initTx.oncomplete = () => resolve(DEFAULT_PERSONAL_TAGS);
        initTx.onerror = () => resolve(DEFAULT_PERSONAL_TAGS);
      } else {
        resolve(tags);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function savePersonalTag(tag: PersonalNoteTag): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PERSONAL_TAGS, 'readwrite');
    const store = tx.objectStore(STORES.PERSONAL_TAGS);
    const req = store.put(tag);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deletePersonalTag(tagId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.PERSONAL_TAGS, STORES.PERSONAL_NOTES], 'readwrite');
    const tagStore = tx.objectStore(STORES.PERSONAL_TAGS);
    const noteStore = tx.objectStore(STORES.PERSONAL_NOTES);

    tagStore.delete(tagId);

    // Clean tagId from all personal notes without deleting the notes
    const req = noteStore.getAll();
    req.onsuccess = () => {
      const notes = (req.result || []) as PersonalNote[];
      for (const note of notes) {
        if (note.tagIds && note.tagIds.includes(tagId)) {
          const updatedNote = {
            ...note,
            tagIds: note.tagIds.filter((t) => t !== tagId),
            updatedAt: Date.now(),
          };
          noteStore.put(updatedNote);
        }
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllPersonalNotes(): Promise<PersonalNote[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PERSONAL_NOTES, 'readonly');
    const store = tx.objectStore(STORES.PERSONAL_NOTES);
    const req = store.getAll();
    req.onsuccess = () => {
      const notes = (req.result || []) as PersonalNote[];
      // Sort pinned first, then by updatedAt descending
      notes.sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        return b.updatedAt - a.updatedAt;
      });
      resolve(notes);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function savePersonalNote(note: PersonalNote): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PERSONAL_NOTES, 'readwrite');
    const store = tx.objectStore(STORES.PERSONAL_NOTES);
    const req = store.put(note);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deletePersonalNote(noteId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PERSONAL_NOTES, 'readwrite');
    const store = tx.objectStore(STORES.PERSONAL_NOTES);
    const req = store.delete(noteId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- Data Backup / Export & Import ----------------

export async function exportDatabase(): Promise<BackupData> {
  const [
    students, 
    notes, 
    sessions, 
    callSettings, 
    tasks, 
    dayConfigs, 
    checkins, 
    studySettings,
    engNotes,
    engDecks,
    engCards,
    engLogs,
    engSettings,
    univTerms,
    univCourses,
    univExams,
    univNotes,
    univAssigns,
    projectIdeas,
    personalNotes,
    personalTags
  ] = await Promise.all([
    getAllStudents(),
    getAllNotes(),
    getAllCallSessions(),
    getParentCallSettings(),
    getAllStudyTasks(),
    getAllDayConfigs(),
    getAllDayCheckins(),
    getStudySettings(),
    getAllEnglishNotes(),
    getAllEnglishDecks(),
    getAllEnglishCards(),
    getAllEnglishLogs(),
    getEnglishSettings(),
    getAllUniversityTerms(),
    getAllUniversityCourses(),
    getAllUniversityExams(),
    getAllUniversityNotes(),
    getAllUniversityAssignments(),
    getAllProjectIdeas(),
    getAllPersonalNotes(),
    getAllPersonalTags(),
  ]);

  return {
    version: 7,
    exportedAt: new Date().toISOString(),
    appName: 'Aynot.',
    students,
    studentNotes: notes,
    weeklyCallSessions: sessions,
    studyTasks: tasks,
    studyDayConfigs: dayConfigs,
    dayCheckins: checkins,
    englishNotes: engNotes,
    englishDecks: engDecks,
    englishCards: engCards,
    englishLogs: engLogs,
    universityTerms: univTerms,
    universityCourses: univCourses,
    universityExams: univExams,
    universityNotes: univNotes,
    universityAssignments: univAssigns,
    projectIdeas,
    personalNotes,
    personalTags,
    settings: {
      theme: (localStorage.getItem('oa_theme') as 'light' | 'dark' | 'system') || 'system',
      userName: await getUserName(),
      parentCalls: callSettings,
      voiceNotesEnabled: localStorage.getItem('oa_voice_notes_enabled') !== 'false',
      studySettings,
      englishSettings: engSettings,
    },
  };
}

export async function importDatabase(backup: BackupData, mode: 'overwrite' | 'merge' = 'overwrite'): Promise<{ 
  studentCount: number; 
  noteCount: number;
  sessionCount: number;
  taskCount: number;
  englishCardCount: number;
  universityCourseCount: number;
  universityExamCount: number;
  projectIdeaCount?: number;
  personalNoteCount?: number;
}> {
  if (!backup || !Array.isArray(backup.students) || !Array.isArray(backup.studentNotes)) {
    throw new Error('Geçersiz yedek dosyası formatı. Lütfen geçerli bir JSON yedek dosyası seçin.');
  }

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const storeNames = [
      STORES.STUDENTS, 
      STORES.NOTES, 
      STORES.CALL_SESSIONS, 
      STORES.STUDY_TASKS,
      STORES.DAY_CONFIGS,
      STORES.DAY_CHECKINS,
      STORES.ENGLISH_NOTES,
      STORES.ENGLISH_DECKS,
      STORES.ENGLISH_CARDS,
      STORES.ENGLISH_LOGS,
      STORES.UNIVERSITY_TERMS,
      STORES.UNIVERSITY_COURSES,
      STORES.UNIVERSITY_EXAMS,
      STORES.UNIVERSITY_NOTES,
      STORES.UNIVERSITY_ASSIGNMENTS,
      STORES.PROJECT_IDEAS,
      STORES.PERSONAL_NOTES,
      STORES.PERSONAL_TAGS,
      STORES.SETTINGS
    ];
    const tx = db.transaction(storeNames, 'readwrite');
    const studentStore = tx.objectStore(STORES.STUDENTS);
    const noteStore = tx.objectStore(STORES.NOTES);
    const callStore = tx.objectStore(STORES.CALL_SESSIONS);
    const taskStore = tx.objectStore(STORES.STUDY_TASKS);
    const dayConfigStore = tx.objectStore(STORES.DAY_CONFIGS);
    const checkinStore = tx.objectStore(STORES.DAY_CHECKINS);
    const engNoteStore = tx.objectStore(STORES.ENGLISH_NOTES);
    const engDeckStore = tx.objectStore(STORES.ENGLISH_DECKS);
    const engCardStore = tx.objectStore(STORES.ENGLISH_CARDS);
    const engLogStore = tx.objectStore(STORES.ENGLISH_LOGS);
    const termStore = tx.objectStore(STORES.UNIVERSITY_TERMS);
    const courseStore = tx.objectStore(STORES.UNIVERSITY_COURSES);
    const examStore = tx.objectStore(STORES.UNIVERSITY_EXAMS);
    const univNoteStore = tx.objectStore(STORES.UNIVERSITY_NOTES);
    const assignStore = tx.objectStore(STORES.UNIVERSITY_ASSIGNMENTS);
    const ideaStore = tx.objectStore(STORES.PROJECT_IDEAS);
    const pNoteStore = tx.objectStore(STORES.PERSONAL_NOTES);
    const pTagStore = tx.objectStore(STORES.PERSONAL_TAGS);
    const settingsStore = tx.objectStore(STORES.SETTINGS);

    // Only clear if mode is 'overwrite'
    if (mode === 'overwrite') {
      studentStore.clear();
      noteStore.clear();
      callStore.clear();
      taskStore.clear();
      dayConfigStore.clear();
      checkinStore.clear();
      engNoteStore.clear();
      engDeckStore.clear();
      engCardStore.clear();
      engLogStore.clear();
      termStore.clear();
      courseStore.clear();
      examStore.clear();
      univNoteStore.clear();
      assignStore.clear();
      ideaStore.clear();
      pNoteStore.clear();
      pTagStore.clear();
    }

    for (const student of backup.students) {
      studentStore.put(student);
    }

    for (const note of backup.studentNotes) {
      noteStore.put(note);
    }

    let sessionCount = 0;
    if (Array.isArray(backup.weeklyCallSessions)) {
      for (const session of backup.weeklyCallSessions) {
        callStore.put(session);
        sessionCount++;
      }
    }

    let taskCount = 0;
    if (Array.isArray(backup.studyTasks)) {
      for (const task of backup.studyTasks) {
        taskStore.put(task);
        taskCount++;
      }
    }

    if (Array.isArray(backup.studyDayConfigs)) {
      for (const config of backup.studyDayConfigs) {
        dayConfigStore.put(config);
      }
    }

    if (Array.isArray(backup.dayCheckins)) {
      for (const checkin of backup.dayCheckins) {
        checkinStore.put(checkin);
      }
    }

    if (Array.isArray(backup.englishNotes)) {
      for (const en of backup.englishNotes) {
        engNoteStore.put(en);
      }
    }

    if (Array.isArray(backup.englishDecks)) {
      for (const deck of backup.englishDecks) {
        engDeckStore.put(deck);
      }
    }

    let cardCount = 0;
    if (Array.isArray(backup.englishCards)) {
      for (const card of backup.englishCards) {
        engCardStore.put(card);
        cardCount++;
      }
    }

    if (Array.isArray(backup.englishLogs)) {
      for (const log of backup.englishLogs) {
        engLogStore.put(log);
      }
    }

    if (Array.isArray(backup.universityTerms)) {
      for (const term of backup.universityTerms) {
        termStore.put(term);
      }
    }

    let univCourseCount = 0;
    if (Array.isArray(backup.universityCourses)) {
      for (const course of backup.universityCourses) {
        courseStore.put(course);
        univCourseCount++;
      }
    }

    let univExamCount = 0;
    if (Array.isArray(backup.universityExams)) {
      for (const exam of backup.universityExams) {
        examStore.put(exam);
        univExamCount++;
      }
    }

    if (Array.isArray(backup.universityNotes)) {
      for (const un of backup.universityNotes) {
        univNoteStore.put(un);
      }
    }

    if (Array.isArray(backup.universityAssignments)) {
      for (const a of backup.universityAssignments) {
        assignStore.put(a);
      }
    }

    let projectIdeaCount = 0;
    if (Array.isArray(backup.projectIdeas)) {
      for (const idea of backup.projectIdeas) {
        ideaStore.put(idea);
        projectIdeaCount++;
      }
    }

    let personalNoteCount = 0;
    if (Array.isArray(backup.personalNotes)) {
      for (const pNote of backup.personalNotes) {
        pNoteStore.put(pNote);
        personalNoteCount++;
      }
    }

    if (Array.isArray(backup.personalTags)) {
      for (const pTag of backup.personalTags) {
        pTagStore.put(pTag);
      }
    }

    if (backup.settings?.parentCalls) {
      settingsStore.put({ key: 'parent_call_settings', value: backup.settings.parentCalls });
      localStorage.setItem('oa_parent_call_settings', JSON.stringify(backup.settings.parentCalls));
    }

    if (backup.settings?.studySettings) {
      settingsStore.put({ key: 'study_settings', value: backup.settings.studySettings });
      localStorage.setItem('oa_study_settings', JSON.stringify(backup.settings.studySettings));
    }

    if (backup.settings?.englishSettings) {
      settingsStore.put({ key: 'english_settings', value: backup.settings.englishSettings });
      localStorage.setItem('oa_english_settings', JSON.stringify(backup.settings.englishSettings));
    }

    tx.oncomplete = () => {
      resolve({
        studentCount: backup.students.length,
        noteCount: backup.studentNotes.length,
        sessionCount,
        taskCount,
        englishCardCount: cardCount,
        universityCourseCount: univCourseCount,
        universityExamCount: univExamCount,
        projectIdeaCount,
        personalNoteCount,
      });
    };

    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllDatabase(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([
      STORES.STUDENTS, 
      STORES.NOTES, 
      STORES.CALL_SESSIONS, 
      STORES.STUDY_TASKS, 
      STORES.DAY_CONFIGS, 
      STORES.DAY_CHECKINS,
      STORES.ENGLISH_NOTES,
      STORES.ENGLISH_DECKS,
      STORES.ENGLISH_CARDS,
      STORES.ENGLISH_LOGS,
      STORES.UNIVERSITY_TERMS,
      STORES.UNIVERSITY_COURSES,
      STORES.UNIVERSITY_EXAMS,
      STORES.UNIVERSITY_NOTES,
      STORES.UNIVERSITY_ASSIGNMENTS,
      STORES.PROJECT_IDEAS,
      STORES.PERSONAL_NOTES,
      STORES.PERSONAL_TAGS
    ], 'readwrite');
    tx.objectStore(STORES.STUDENTS).clear();
    tx.objectStore(STORES.NOTES).clear();
    tx.objectStore(STORES.CALL_SESSIONS).clear();
    tx.objectStore(STORES.STUDY_TASKS).clear();
    tx.objectStore(STORES.DAY_CONFIGS).clear();
    tx.objectStore(STORES.DAY_CHECKINS).clear();
    tx.objectStore(STORES.ENGLISH_NOTES).clear();
    tx.objectStore(STORES.ENGLISH_DECKS).clear();
    tx.objectStore(STORES.ENGLISH_CARDS).clear();
    tx.objectStore(STORES.ENGLISH_LOGS).clear();
    tx.objectStore(STORES.UNIVERSITY_TERMS).clear();
    tx.objectStore(STORES.UNIVERSITY_COURSES).clear();
    tx.objectStore(STORES.UNIVERSITY_EXAMS).clear();
    tx.objectStore(STORES.UNIVERSITY_NOTES).clear();
    tx.objectStore(STORES.UNIVERSITY_ASSIGNMENTS).clear();
    tx.objectStore(STORES.PROJECT_IDEAS).clear();
    tx.objectStore(STORES.PERSONAL_NOTES).clear();
    tx.objectStore(STORES.PERSONAL_TAGS).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDatabaseStats(): Promise<{
  studentsCount: number;
  notesCount: number;
  photosCount: number;
  alertStudentsCount: number;
  totalCallsCount: number;
  totalStudyTasksCount: number;
  englishCardsCount: number;
  englishNotesCount: number;
  universityCoursesCount: number;
  universityExamsCount: number;
  universityNotesCount: number;
  personalNotesCount: number;
}> {
  const [students, notes, sessions, tasks, cards, engNotes, courses, exams, uNotes, pNotes] = await Promise.all([
    getAllStudents(), 
    getAllNotes(),
    getAllCallSessions(),
    getAllStudyTasks(),
    getAllEnglishCards(),
    getAllEnglishNotes(),
    getAllUniversityCourses(),
    getAllUniversityExams(),
    getAllUniversityNotes(),
    getAllPersonalNotes(),
  ]);

  const alertStudentsCount = students.filter((s) => s.healthAlert && s.healthAlert.trim() !== '').length;
  const photosCount = notes.filter((n) => !!n.photoUrl).length;

  let totalCallsCount = 0;
  for (const session of sessions) {
    totalCallsCount += session.items.filter((item) => item.called).length;
  }

  return {
    studentsCount: students.length,
    notesCount: notes.length,
    photosCount,
    alertStudentsCount,
    totalCallsCount,
    totalStudyTasksCount: tasks.length,
    englishCardsCount: cards.length,
    englishNotesCount: engNotes.length,
    universityCoursesCount: courses.length,
    universityExamsCount: exams.length,
    universityNotesCount: uNotes.length,
    personalNotesCount: pNotes.length,
  };
}

// ---------------- Demo / Seed Data ----------------
export async function seedSampleData(): Promise<void> {
  const sampleStudents: Student[] = [
    {
      id: 'demo-st-1',
      name: 'Ali Yılmaz',
      birthDate: '2016-04-12',
      group: '3-A',
      parentName: 'Fatma Yılmaz (Anne)',
      parentPhone: '0532 555 10 20',
      healthAlert: 'Yer fıstığı alerjisi (Anafilaksi riski, okulda epipen var)',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: 'demo-st-2',
      name: 'Zeynep Kaya',
      birthDate: '2016-08-25',
      group: '3-A',
      parentName: 'Murat Kaya (Baba)',
      parentPhone: '0544 333 44 55',
      healthAlert: '',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    },
    {
      id: 'demo-st-3',
      name: 'Ege Demir',
      birthDate: '2015-11-03',
      group: '4-B',
      parentName: 'Elif Demir (Anne)',
      parentPhone: '0505 888 77 66',
      healthAlert: 'Hafif astım (Beden eğitimi öncesi sprey)',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
      id: 'demo-st-4',
      name: 'Defne Şahin',
      birthDate: '2016-02-18',
      group: '3-A',
      parentName: 'Selin Şahin (Anne)',
      parentPhone: '0533 123 45 67',
      healthAlert: '',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    },
  ];

  const todayStr = toLocalISODate();
  const todayDayOfWeek = new Date().getDay();
  const yesterdayStr = toLocalISODate(new Date(Date.now() - 86400000));

  const sampleNotes: StudentNote[] = [
    {
      id: 'demo-note-1',
      studentId: 'demo-st-1',
      date: todayStr,
      time: '10:30',
      category: 'saglik',
      content: 'Beden eğitimi dersinde hafif yorgun hissettiğini söyledi, dinlenmesine izin verildi. Yanında getirdiği atıştırmalığı kontrol edildi.',
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    },
    {
      id: 'demo-note-2',
      studentId: 'demo-st-1',
      date: yesterdayStr,
      time: '14:15',
      category: 'gelisim',
      content: 'Matematik kesirler konusunda tahtaya kalkıp problemleri başarıyla çözdü. Özgüveni belirgin şekilde arttı.',
      createdAt: Date.now() - 1000 * 60 * 60 * 26,
      updatedAt: Date.now() - 1000 * 60 * 60 * 26,
    },
    {
      id: 'demo-note-3',
      studentId: 'demo-st-2',
      date: todayStr,
      time: '11:45',
      category: 'veli_gorusmesi',
      content: 'Anne Fatma Hanım ile telefonla görüşüldü. Okuma kulübüne katılmasından memnunlar, haftalık kitap listesi paylaşıldı.',
      createdAt: Date.now() - 1000 * 60 * 60 * 4,
      updatedAt: Date.now() - 1000 * 60 * 60 * 4,
    },
    {
      id: 'demo-note-4',
      studentId: 'demo-st-3',
      date: yesterdayStr,
      time: '09:15',
      category: 'davranis',
      content: 'Grup çalışmasında arkadaşlarına liderlik etti ve malzeme paylaşımında çok özenli davrandı.',
      createdAt: Date.now() - 1000 * 60 * 60 * 30,
      updatedAt: Date.now() - 1000 * 60 * 60 * 30,
    },
  ];

  // Sample initial study tasks for the teacher
  const sampleTasks: StudyTask[] = [
    {
      id: 'task-demo-1',
      title: 'İngilizce B2 Okuma & Kelime Tekrarı',
      type: 'ingilizce',
      targetDurationMinutes: 30,
      actualDurationMinutes: 0,
      time: '19:00',
      completed: false,
      date: todayStr,
      dayOfWeek: todayDayOfWeek,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'task-demo-2',
      title: 'Eğitim Yönetimi ve Denetimi Makale Özeti',
      type: 'universite',
      targetDurationMinutes: 45,
      actualDurationMinutes: 0,
      time: '20:00',
      completed: false,
      date: todayStr,
      dayOfWeek: todayDayOfWeek,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'task-demo-3',
      title: 'Gelecek Hafta Anaokulu Sanat Etkinliği Tasarımı',
      type: 'diger',
      targetDurationMinutes: 25,
      actualDurationMinutes: 25,
      time: '17:30',
      completed: true,
      completedAt: Date.now() - 1000 * 60 * 90,
      date: todayStr,
      dayOfWeek: todayDayOfWeek,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  // Sample English Decks
  const sampleDecks: EnglishDeck[] = [
    {
      id: 'deck-demo-1',
      name: 'Günlük Konuşma',
      description: 'Sık kullanılan günlük diyalog ve ifadeler',
      color: 'teal',
      createdAt: Date.now() - 1000 * 60 * 60 * 48,
      updatedAt: Date.now() - 1000 * 60 * 60 * 48,
    },
    {
      id: 'deck-demo-2',
      name: 'Okul & Sınıf Yönetimi',
      description: 'Eğitim, çocuk gelişimi ve sınıf içi komutlar',
      color: 'amber',
      createdAt: Date.now() - 1000 * 60 * 60 * 48,
      updatedAt: Date.now() - 1000 * 60 * 60 * 48,
    },
    {
      id: 'deck-demo-3',
      name: 'Üniversite & Akademik',
      description: 'Makale okuma ve yüksek lisans sınav kelimeleri',
      color: 'indigo',
      createdAt: Date.now() - 1000 * 60 * 60 * 48,
      updatedAt: Date.now() - 1000 * 60 * 60 * 48,
    },
  ];

  // Sample English Cards
  const sampleCards: EnglishCard[] = [
    {
      id: 'card-demo-1',
      deckId: 'deck-demo-1',
      word: 'encourage',
      meaning: 'cesaretlendirmek, teşvik etmek',
      exampleSentence: 'Teachers should always encourage curiosity in young learners.',
      personalNote: 'Öğrenci övgülerinde sık kullan',
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: todayStr,
      learnedDate: todayStr,
      createdAt: Date.now() - 1000 * 60 * 60 * 12,
      updatedAt: Date.now() - 1000 * 60 * 60 * 12,
    },
    {
      id: 'card-demo-2',
      deckId: 'deck-demo-1',
      word: 'resilient',
      meaning: 'çabuk toparlanan, dirençli, esnek',
      exampleSentence: 'Children are remarkably resilient and adapt to changes quickly.',
      personalNote: 'Gelişim raporu için güzel sıfat',
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: todayStr,
      learnedDate: todayStr,
      createdAt: Date.now() - 1000 * 60 * 60 * 10,
      updatedAt: Date.now() - 1000 * 60 * 60 * 10,
    },
    {
      id: 'card-demo-3',
      deckId: 'deck-demo-2',
      word: 'collaborate',
      meaning: 'iş birliği yapmak, birlikte çalışmak',
      exampleSentence: 'The students collaborated on the science project.',
      personalNote: 'Grup etkinlikleri için anahtar kelime',
      intervalDays: 3,
      easeFactor: 2.6,
      repetitions: 2,
      nextReviewDate: todayStr,
      learnedDate: yesterdayStr,
      createdAt: Date.now() - 1000 * 60 * 60 * 30,
      updatedAt: Date.now() - 1000 * 60 * 60 * 5,
    },
    {
      id: 'card-demo-4',
      deckId: 'deck-demo-3',
      word: 'methodology',
      meaning: 'metodoloji, yöntem bilimi',
      exampleSentence: 'The research methodology was explained in detail in chapter three.',
      personalNote: 'Tez yazımında sürekli geçer',
      intervalDays: 6,
      easeFactor: 2.5,
      repetitions: 3,
      nextReviewDate: toLocalISODate(new Date(Date.now() + 86400000 * 3)),
      learnedDate: yesterdayStr,
      createdAt: Date.now() - 1000 * 60 * 60 * 40,
      updatedAt: Date.now() - 1000 * 60 * 60 * 20,
    },
    {
      id: 'card-demo-5',
      deckId: 'deck-demo-2',
      word: 'facilitate',
      meaning: 'kolaylaştırmak, olanak sağlamak',
      exampleSentence: 'A good educator facilitates discussion rather than lecturing.',
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: todayStr,
      learnedDate: todayStr,
      createdAt: Date.now() - 1000 * 60 * 60 * 8,
      updatedAt: Date.now() - 1000 * 60 * 60 * 8,
    },
  ];

  // Sample English Notes
  const sampleEngNotes: EnglishNote[] = [
    {
      id: 'eng-note-1',
      title: 'Classroom English Komutları ve Sık Kullanılan Kalıplar',
      content: 'Sınıfta çocuklarla konuşurken kullanabileceğim doğal kalıplar:\n- "Let\'s tidy up our toys!" (Oyuncaklarımızı toplayalım!)\n- "Whose turn is it today?" (Bugün kimin sırası?)\n- "Take a deep breath and share." (Derin bir nefes al ve paylaş.)\n- "Excellent teamwork everyone!"',
      tag: 'speaking',
      createdAt: Date.now() - 1000 * 60 * 60 * 24,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    },
    {
      id: 'eng-note-2',
      title: 'Present Perfect vs Past Simple İpuçları',
      content: 'Zaman belirteci varsa (yesterday, in 2020, ago) mutlaka Past Simple.\nEtkisi şu anda devam ediyorsa veya tecrübe anlatılıyorsa (ever, never, just, already) Present Perfect.',
      tag: 'grammar',
      createdAt: Date.now() - 1000 * 60 * 60 * 48,
      updatedAt: Date.now() - 1000 * 60 * 60 * 48,
    },
  ];

  // Sample University Data (ATA AÖF Bilgisayar Programcılığı)
  const sampleTerm: UniversityTerm = {
    id: 'term-guz-2026',
    name: '2026-2027 Güz',
    isActive: true,
    isArchived: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  };

  const sampleCourses: UniversityCourse[] = [
    {
      id: 'course-1',
      termId: 'term-guz-2026',
      name: 'Algoritma ve Programlama I',
      code: 'BİL101',
      instructor: 'Dr. Öğr. Üyesi Ahmet Y.',
      color: 'indigo',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    },
    {
      id: 'course-2',
      termId: 'term-guz-2026',
      name: 'Veri Tabanı Yönetim Sistemleri',
      code: 'BİL103',
      instructor: 'Doç. Dr. Selin B.',
      color: 'teal',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    },
    {
      id: 'course-3',
      termId: 'term-guz-2026',
      name: 'Web Tasarımının Temelleri',
      code: 'BİL105',
      instructor: 'Öğr. Gör. Murat K.',
      color: 'sky',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    },
    {
      id: 'course-4',
      termId: 'term-guz-2026',
      name: 'Bilgisayar Donanımı',
      code: 'BİL107',
      instructor: 'Öğr. Gör. Cemal D.',
      color: 'amber',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    },
  ];

  const sampleExams: UniversityExam[] = [
    {
      id: 'exam-1',
      termId: 'term-guz-2026',
      courseId: 'course-1',
      examType: 'ara_sinav',
      title: 'Vize Sınavı',
      date: toLocalISODate(new Date(Date.now() + 86400000 * 4)),
      time: '09:30',
      reminderDaysBefore: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'exam-2',
      termId: 'term-guz-2026',
      courseId: 'course-2',
      examType: 'ara_sinav',
      title: 'Vize Sınavı',
      date: toLocalISODate(new Date(Date.now() + 86400000 * 11)),
      time: '14:00',
      reminderDaysBefore: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  const sampleUnivNotes: UniversityNote[] = [
    {
      id: 'unote-1',
      termId: 'term-guz-2026',
      courseId: 'course-2',
      title: 'İlişkisel Veri Tabanı ve Normalizasyon Kuralları',
      content: '1NF: Atomik değerler olmalı, tekrarlayan sütunlar olmamalı.\n2NF: 1NF şartı + anahtara tam fonksiyonel bağımlılık.\n3NF: 2NF şartı + geçişli (transitive) bağımlılık olmamalı.\n\nİpucu: Birincil Anahtar (PK) ve Yabancı Anahtar (FK) kuralları veri tekrarını önler.',
      tag: 'ozet',
      createdAt: Date.now() - 1000 * 60 * 60 * 20,
      updatedAt: Date.now() - 1000 * 60 * 60 * 20,
    },
  ];

  const sampleAssignments: UniversityAssignment[] = [
    {
      id: 'uassign-1',
      termId: 'term-guz-2026',
      courseId: 'course-3',
      title: 'Responsive Web Arayüzü Proje Tasarımı',
      type: 'proje',
      dueDate: toLocalISODate(new Date(Date.now() + 86400000 * 8)),
      completed: false,
      notes: 'Flexbox, CSS Grid ve mobil uyumlu medya sorguları kullanılacak.',
      createdAt: Date.now() - 1000 * 60 * 60 * 12,
      updatedAt: Date.now() - 1000 * 60 * 60 * 12,
    },
  ];

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([
      STORES.STUDENTS, 
      STORES.NOTES, 
      STORES.STUDY_TASKS,
      STORES.DAY_CONFIGS,
      STORES.ENGLISH_DECKS,
      STORES.ENGLISH_CARDS,
      STORES.ENGLISH_NOTES,
      STORES.UNIVERSITY_TERMS,
      STORES.UNIVERSITY_COURSES,
      STORES.UNIVERSITY_EXAMS,
      STORES.UNIVERSITY_NOTES,
      STORES.UNIVERSITY_ASSIGNMENTS
    ], 'readwrite');
    const studentStore = tx.objectStore(STORES.STUDENTS);
    const noteStore = tx.objectStore(STORES.NOTES);
    const taskStore = tx.objectStore(STORES.STUDY_TASKS);
    const dayConfigStore = tx.objectStore(STORES.DAY_CONFIGS);
    const deckStore = tx.objectStore(STORES.ENGLISH_DECKS);
    const cardStore = tx.objectStore(STORES.ENGLISH_CARDS);
    const engNoteStore = tx.objectStore(STORES.ENGLISH_NOTES);
    const termStore = tx.objectStore(STORES.UNIVERSITY_TERMS);
    const courseStore = tx.objectStore(STORES.UNIVERSITY_COURSES);
    const examStore = tx.objectStore(STORES.UNIVERSITY_EXAMS);
    const univNoteStore = tx.objectStore(STORES.UNIVERSITY_NOTES);
    const assignStore = tx.objectStore(STORES.UNIVERSITY_ASSIGNMENTS);

    for (const s of sampleStudents) studentStore.put(s);
    for (const n of sampleNotes) noteStore.put(n);
    for (const t of sampleTasks) taskStore.put(t);
    for (const c of DEFAULT_DAY_CONFIGS) dayConfigStore.put(c);
    for (const d of sampleDecks) deckStore.put(d);
    for (const cd of sampleCards) cardStore.put(cd);
    for (const en of sampleEngNotes) engNoteStore.put(en);
    termStore.put(sampleTerm);
    for (const cr of sampleCourses) courseStore.put(cr);
    for (const ex of sampleExams) examStore.put(ex);
    for (const un of sampleUnivNotes) univNoteStore.put(un);
    for (const ua of sampleAssignments) assignStore.put(ua);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
