/**
 * Veri erişim katmanı (repository).
 *
 * Oturum açıkken yazma/silme işlemleri Firestore'a (users/{uid}/...) gider,
 * oturum yokken yerel IndexedDB'ye yazılır. Fonksiyon adları indexedDb.ts ile
 * birebir aynıdır; böylece App.tsx sadece import satırını değiştirerek kullanır.
 *
 * Okuma tarafı: oturum açıkken veriler `subscribeToUserData` (onSnapshot) ile
 * gelir, bu yüzden burada getAll* fonksiyonu yoktur.
 */
import * as local from './indexedDb';
import * as cloud from '../services/cloudDataService';
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

let activeUid: string | null = null;

/** Oturum açıldığında uid ile, çıkışta null ile çağrılır. */
export function setRepositoryUser(uid: string | null): void {
  activeUid = uid;
}

export function getRepositoryUser(): string | null {
  return activeUid;
}

/**
 * Firestore, çevrimdışıyken yazma promise'ini sunucu onayına kadar bekletir.
 * Yazma yerel önbelleğe anında işlendiği için arayüzü bloklamamak adına en fazla
 * 2.5 sn bekleriz; izin hatası gibi gerçek hatalar yine de yukarı fırlatılır.
 */
function settle(p: Promise<unknown>): Promise<void> {
  const guarded = p.catch((e) => {
    console.error('Bulut yazma hatası:', e);
    throw e;
  });
  guarded.catch(() => {}); // zaman aşımından sonra oluşan hatalar "unhandled" olmasın
  return Promise.race([
    guarded.then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, 2500))
  ]);
}

function route<A extends unknown[]>(
  cloudFn: (uid: string, ...args: A) => Promise<unknown>,
  localFn: (...args: A) => Promise<unknown>
) {
  return async (...args: A): Promise<void> => {
    if (activeUid) {
      await settle(cloudFn(activeUid, ...args));
    } else {
      await localFn(...args);
    }
  };
}

// ---------- Okul ----------
export const saveStudent = route<[Student]>(cloud.saveStudentCloud, local.saveStudent);
export const deleteStudent = route<[string]>(cloud.deleteStudentCascadeCloud, local.deleteStudent);
export const saveNote = route<[StudentNote]>(cloud.saveStudentNoteCloud, local.saveNote);
export const deleteNote = route<[string]>(cloud.deleteStudentNoteCloud, local.deleteNote);
export const saveCallSession = route<[WeeklyCallSession]>(cloud.saveCallSessionCloud, local.saveCallSession);
export const saveParentCallSettings = route<[ParentCallSettings]>(
  (uid, s) => cloud.saveSettingCloud(uid, 'parent_call_settings', s),
  local.saveParentCallSettings
);

// ---------- Çalışma ----------
export const saveStudyTask = route<[StudyTask]>(cloud.saveStudyTaskCloud, local.saveStudyTask);
export const saveMultipleStudyTasks = route<[StudyTask[]]>(cloud.saveMultipleStudyTasksCloud, local.saveMultipleStudyTasks);
export const deleteStudyTask = route<[string]>(cloud.deleteStudyTaskCloud, local.deleteStudyTask);
export const saveDayConfig = route<[StudyDayConfig]>(cloud.saveDayConfigCloud, local.saveDayConfig);
export const saveDayCheckin = route<[DayCheckin]>(cloud.saveDayCheckinCloud, local.saveDayCheckin);
export const saveStudySettings = route<[StudySettings]>(
  (uid, s) => cloud.saveSettingCloud(uid, 'study_settings', s),
  local.saveStudySettings
);

// ---------- İngilizce ----------
export const saveEnglishNote = route<[EnglishNote]>(cloud.saveEnglishNoteCloud, local.saveEnglishNote);
export const deleteEnglishNote = route<[string]>(cloud.deleteEnglishNoteCloud, local.deleteEnglishNote);
export const saveEnglishDeck = route<[EnglishDeck]>(cloud.saveEnglishDeckCloud, local.saveEnglishDeck);
export const deleteEnglishDeck = route<[string]>(cloud.deleteEnglishDeckCascadeCloud, local.deleteEnglishDeck);
export const saveEnglishCard = route<[EnglishCard]>(cloud.saveEnglishCardCloud, local.saveEnglishCard);
export const saveMultipleEnglishCards = route<[EnglishCard[]]>(cloud.saveMultipleEnglishCardsCloud, local.saveMultipleEnglishCards);
export const deleteEnglishCard = route<[string]>(cloud.deleteEnglishCardCloud, local.deleteEnglishCard);
export const saveEnglishReviewLog = route<[EnglishStudyReviewLog]>(cloud.saveEnglishReviewLogCloud, local.saveEnglishReviewLog);
export const saveEnglishSettings = route<[EnglishDailyGoalSettings]>(
  (uid, s) => cloud.saveSettingCloud(uid, 'english_settings', s),
  local.saveEnglishSettings
);

// ---------- Üniversite ----------
export const saveUniversityTerm = route<[UniversityTerm]>(cloud.saveUniversityTermCloud, local.saveUniversityTerm);
export const setActiveUniversityTerm = route<[string]>(cloud.setActiveUniversityTermCloud, local.setActiveUniversityTerm);
export const deleteUniversityTerm = route<[string]>(cloud.deleteUniversityTermCascadeCloud, local.deleteUniversityTerm);
export const saveUniversityCourse = route<[UniversityCourse]>(cloud.saveUniversityCourseCloud, local.saveUniversityCourse);
export const saveMultipleUniversityCourses = route<[UniversityCourse[]]>(
  cloud.saveMultipleUniversityCoursesCloud,
  local.saveMultipleUniversityCourses
);
export const deleteUniversityCourse = route<[string]>(cloud.deleteUniversityCourseCascadeCloud, local.deleteUniversityCourse);
export const saveUniversityExam = route<[UniversityExam]>(cloud.saveUniversityExamCloud, local.saveUniversityExam);
export const saveMultipleUniversityExams = route<[UniversityExam[]]>(
  cloud.saveMultipleUniversityExamsCloud,
  local.saveMultipleUniversityExams
);
export const deleteUniversityExam = route<[string]>(cloud.deleteUniversityExamCloud, local.deleteUniversityExam);
export const saveUniversityNote = route<[UniversityNote]>(cloud.saveUniversityNoteCloud, local.saveUniversityNote);
export const deleteUniversityNote = route<[string]>(cloud.deleteUniversityNoteCloud, local.deleteUniversityNote);
export const saveUniversityAssignment = route<[UniversityAssignment]>(
  cloud.saveUniversityAssignmentCloud,
  local.saveUniversityAssignment
);
export const deleteUniversityAssignment = route<[string]>(
  cloud.deleteUniversityAssignmentCloud,
  local.deleteUniversityAssignment
);

// ---------- Fikirler & Kişisel notlar ----------
export const saveProjectIdea = route<[ProjectIdea]>(cloud.saveProjectIdeaCloud, local.saveProjectIdea);
export const deleteProjectIdea = route<[string]>(cloud.deleteProjectIdeaCloud, local.deleteProjectIdea);
export const savePersonalNote = route<[PersonalNote]>(cloud.savePersonalNoteCloud, local.savePersonalNote);
export const deletePersonalNote = route<[string]>(cloud.deletePersonalNoteCloud, local.deletePersonalNote);
export const savePersonalTag = route<[PersonalNoteTag]>(cloud.savePersonalTagCloud, local.savePersonalTag);
export const deletePersonalTag = route<[string]>(cloud.deletePersonalTagCascadeCloud, local.deletePersonalTag);

// ---------- Ayarlar ----------
export const saveUserName = route<[string]>(
  (uid, name) => cloud.saveSettingCloud(uid, 'userName', name),
  local.saveUserName
);

// ---------- Toplu temizlik ----------
/** Oturum açıksa hesabın bulut verisini, değilse yerel veriyi siler. */
export async function clearAllDatabase(): Promise<void> {
  if (activeUid) {
    await cloud.clearAllUserDataCloud(activeUid);
  } else {
    await local.clearAllDatabase();
  }
}
