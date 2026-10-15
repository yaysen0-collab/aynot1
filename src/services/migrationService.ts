import {
  getAllStudents,
  getAllNotes,
  getAllCallSessions,
  getAllStudyTasks,
  getAllDayConfigs,
  getAllDayCheckins,
  getAllEnglishNotes,
  getAllEnglishDecks,
  getAllEnglishCards,
  getAllUniversityTerms,
  getAllUniversityCourses,
  getAllUniversityExams,
  getAllUniversityNotes,
  getAllUniversityAssignments,
  getAllProjectIdeas,
  getAllPersonalNotes,
  getAllPersonalTags,
  getParentCallSettings,
  getStudySettings,
  getEnglishSettings,
  getUserName
} from '../db/indexedDb';
import {
  saveStudentCloud,
  saveStudentNoteCloud,
  saveCallSessionCloud,
  saveStudyTaskCloud,
  saveDayConfigCloud,
  saveDayCheckinCloud,
  saveEnglishNoteCloud,
  saveEnglishDeckCloud,
  saveEnglishCardCloud,
  saveUniversityTermCloud,
  saveUniversityCourseCloud,
  saveUniversityExamCloud,
  saveUniversityNoteCloud,
  saveUniversityAssignmentCloud,
  saveProjectIdeaCloud,
  savePersonalNoteCloud,
  savePersonalTagCloud,
  saveSettingCloud
} from './cloudDataService';

export interface LocalDataSummary {
  totalCount: number;
  breakdown: {
    students: number;
    notes: number;
    callSessions: number;
    studyTasks: number;
    englishItems: number;
    universityItems: number;
    ideas: number;
    personalNotes: number;
    tags: number;
  };
}

/**
 * Checks if there is any local data in IndexedDB on this device
 */
export async function getLocalDataSummary(): Promise<LocalDataSummary> {
  const [
    students,
    notes,
    callSessions,
    studyTasks,
    dayConfigs,
    dayCheckins,
    engNotes,
    engDecks,
    engCards,
    uTerms,
    uCourses,
    uExams,
    uNotes,
    uAssignments,
    ideas,
    pNotes,
    pTags
  ] = await Promise.all([
    getAllStudents().catch(() => []),
    getAllNotes().catch(() => []),
    getAllCallSessions().catch(() => []),
    getAllStudyTasks().catch(() => []),
    getAllDayConfigs().catch(() => []),
    getAllDayCheckins().catch(() => []),
    getAllEnglishNotes().catch(() => []),
    getAllEnglishDecks().catch(() => []),
    getAllEnglishCards().catch(() => []),
    getAllUniversityTerms().catch(() => []),
    getAllUniversityCourses().catch(() => []),
    getAllUniversityExams().catch(() => []),
    getAllUniversityNotes().catch(() => []),
    getAllUniversityAssignments().catch(() => []),
    getAllProjectIdeas().catch(() => []),
    getAllPersonalNotes().catch(() => []),
    getAllPersonalTags().catch(() => [])
  ]);

  const englishTotal = engNotes.length + engDecks.length + engCards.length;
  const universityTotal = uTerms.length + uCourses.length + uExams.length + uNotes.length + uAssignments.length;

  const total =
    students.length +
    notes.length +
    callSessions.length +
    studyTasks.length +
    dayConfigs.length +
    dayCheckins.length +
    englishTotal +
    universityTotal +
    ideas.length +
    pNotes.length +
    pTags.length;

  return {
    totalCount: total,
    breakdown: {
      students: students.length,
      notes: notes.length,
      callSessions: callSessions.length,
      studyTasks: studyTasks.length,
      englishItems: englishTotal,
      universityItems: universityTotal,
      ideas: ideas.length,
      personalNotes: pNotes.length,
      tags: pTags.length
    }
  };
}

export function isUserMigrated(uid: string): boolean {
  return localStorage.getItem(`oa_migrated_to_uid_${uid}`) === 'true';
}

export function markUserAsMigrated(uid: string): void {
  localStorage.setItem(`oa_migrated_to_uid_${uid}`, 'true');
}

/**
 * Migrates all local data from IndexedDB to Firestore under users/{uid}/
 * Preserves exact same record IDs to ensure idempotency.
 * Does NOT delete local data.
 */
export async function migrateLocalDataToCloud(
  uid: string,
  onProgress?: (percent: number, currentItem: string) => void
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  try {
    const [
      students,
      notes,
      callSessions,
      studyTasks,
      dayConfigs,
      dayCheckins,
      engNotes,
      engDecks,
      engCards,
      uTerms,
      uCourses,
      uExams,
      uNotes,
      uAssignments,
      ideas,
      pNotes,
      pTags,
      callSettings,
      studySettings,
      engSettings,
      userName
    ] = await Promise.all([
      getAllStudents(),
      getAllNotes(),
      getAllCallSessions(),
      getAllStudyTasks(),
      getAllDayConfigs(),
      getAllDayCheckins(),
      getAllEnglishNotes(),
      getAllEnglishDecks(),
      getAllEnglishCards(),
      getAllUniversityTerms(),
      getAllUniversityCourses(),
      getAllUniversityExams(),
      getAllUniversityNotes(),
      getAllUniversityAssignments(),
      getAllProjectIdeas(),
      getAllPersonalNotes(),
      getAllPersonalTags(),
      getParentCallSettings(),
      getStudySettings(),
      getEnglishSettings(),
      getUserName()
    ]);

    const totalItems =
      students.length +
      notes.length +
      callSessions.length +
      studyTasks.length +
      dayConfigs.length +
      dayCheckins.length +
      engNotes.length +
      engDecks.length +
      engCards.length +
      uTerms.length +
      uCourses.length +
      uExams.length +
      uNotes.length +
      uAssignments.length +
      ideas.length +
      pNotes.length +
      pTags.length +
      4; // settings items

    let completed = 0;
    const report = (name: string) => {
      completed++;
      if (onProgress) {
        const pct = totalItems > 0 ? Math.min(100, Math.round((completed / totalItems) * 100)) : 100;
        onProgress(pct, name);
      }
    };

    // 1. Öğrenciler
    for (const student of students) {
      await saveStudentCloud(uid, student);
      report(`Öğrenci: ${student.name}`);
    }

    // 2. Okul Notları
    for (const note of notes) {
      await saveStudentNoteCloud(uid, note);
      report(`Not: ${note.title || note.content.slice(0, 15)}...`);
    }

    // 3. Veli Görüşmeleri
    for (const session of callSessions) {
      await saveCallSessionCloud(uid, session);
      report(`Veli Oturumu: ${session.weekDate}`);
    }

    // 4. Çalışma Görevleri
    for (const task of studyTasks) {
      await saveStudyTaskCloud(uid, task);
      report(`Görev: ${task.title}`);
    }

    // 5. Gün Yapılandırmaları & Checkinler
    for (const conf of dayConfigs) {
      await saveDayConfigCloud(uid, conf);
      report(`Gün Ayarı`);
    }
    for (const checkin of dayCheckins) {
      await saveDayCheckinCloud(uid, checkin);
      report(`Günlük Değerlendirme`);
    }

    // 6. İngilizce Verileri
    for (const en of engNotes) {
      await saveEnglishNoteCloud(uid, en);
      report(`İngilizce Notu`);
    }
    for (const ed of engDecks) {
      await saveEnglishDeckCloud(uid, ed);
      report(`Deste: ${ed.name}`);
    }
    for (const ec of engCards) {
      await saveEnglishCardCloud(uid, ec);
      report(`Kelime: ${ec.word}`);
    }

    // 7. Üniversite Verileri
    for (const ut of uTerms) {
      await saveUniversityTermCloud(uid, ut);
      report(`Dönem: ${ut.name}`);
    }
    for (const uc of uCourses) {
      await saveUniversityCourseCloud(uid, uc);
      report(`Ders: ${uc.name}`);
    }
    for (const ue of uExams) {
      await saveUniversityExamCloud(uid, ue);
      report(`Sınav`);
    }
    for (const un of uNotes) {
      await saveUniversityNoteCloud(uid, un);
      report(`Ders Notu`);
    }
    for (const ua of uAssignments) {
      await saveUniversityAssignmentCloud(uid, ua);
      report(`Ödev`);
    }

    // 8. Fikirler, Kişisel Notlar & Etiketler
    for (const id of ideas) {
      await saveProjectIdeaCloud(uid, id);
      report(`Fikir: ${id.title}`);
    }
    for (const pn of pNotes) {
      await savePersonalNoteCloud(uid, pn);
      report(`Not: ${pn.title}`);
    }
    for (const pt of pTags) {
      await savePersonalTagCloud(uid, pt);
      report(`Etiket: ${pt.name}`);
    }

    // 9. Ayarlar
    await saveSettingCloud(uid, 'parent_call_settings', callSettings);
    report('Veli Arama Ayarları');
    await saveSettingCloud(uid, 'study_settings', studySettings);
    report('Çalışma Ayarları');
    await saveSettingCloud(uid, 'english_settings', engSettings);
    report('İngilizce Ayarları');
    await saveSettingCloud(uid, 'userName', userName || 'Zipidola');
    report('Kullanıcı Adı');

    markUserAsMigrated(uid);
    return { success: true, migratedCount: completed };
  } catch (err: any) {
    console.error('Migration failed:', err);
    return {
      success: false,
      migratedCount: 0,
      error: err?.message || 'Veriler aktarılırken bir hata oluştu. Yerel verileriniz korundu.'
    };
  }
}
