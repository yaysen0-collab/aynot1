import React, { useState, useEffect, useCallback } from 'react';
import { 
  Student, 
  StudentNote, 
  WeeklyCallSession, 
  ParentCallSettings,
  StudyTask,
  StudyDayConfig,
  DayCheckin,
  StudySettings,
  DayEnergyRating,
  EnglishNote,
  EnglishDeck,
  EnglishCard,
  EnglishDailyGoalSettings,
  EnglishStudyReviewLog,
  SpacedRepetitionRating,
  UniversityTerm,
  UniversityCourse,
  UniversityExam,
  UniversityNote,
  UniversityAssignment,
  ExamResultStatus,
  ExamType,
  ProjectIdea,
  PersonalNote,
  PersonalNoteTag,
  BackupData
} from './types';
import {
  DEFAULT_PERSONAL_TAGS,
  getAllStudents,
  getAllNotes,
  getDatabaseStats,
  seedSampleData,
  getAllCallSessions,
  getParentCallSettings,
  getAllStudyTasks,
  getAllDayConfigs,
  getDayCheckin,
  getAllDayCheckins,
  getStudySettings,
  getAllEnglishNotes,
  getAllEnglishDecks,
  getAllEnglishCards,
  getEnglishSettings,
  getAllUniversityTerms,
  getAllUniversityCourses,
  getAllUniversityExams,
  getAllUniversityNotes,
  getAllUniversityAssignments,
  getAllProjectIdeas,
  getAllPersonalNotes,
  getAllPersonalTags,
  getUserName
} from './db/indexedDb';
import {
  setRepositoryUser,
  getRepositoryUser as getRepositoryUserId,
  clearAllDatabase as clearAllRepositoryData,
  saveStudent,
  deleteStudent,
  saveNote,
  deleteNote,
  saveParentCallSettings,
  saveStudyTask,
  saveMultipleStudyTasks,
  deleteStudyTask,
  saveDayConfig,
  saveDayCheckin,
  saveStudySettings,
  saveEnglishNote,
  deleteEnglishNote,
  saveEnglishDeck,
  deleteEnglishDeck,
  saveEnglishCard,
  saveMultipleEnglishCards,
  deleteEnglishCard,
  saveEnglishReviewLog,
  saveEnglishSettings,
  saveUniversityTerm,
  setActiveUniversityTerm,
  deleteUniversityTerm,
  saveUniversityCourse,
  saveMultipleUniversityCourses,
  deleteUniversityCourse,
  saveUniversityExam,
  saveMultipleUniversityExams,
  deleteUniversityExam,
  saveUniversityNote,
  deleteUniversityNote,
  saveUniversityAssignment,
  deleteUniversityAssignment,
  saveProjectIdea,
  deleteProjectIdea,
  savePersonalNote,
  deletePersonalNote,
  savePersonalTag,
  deletePersonalTag,
  saveUserName,
  saveCallSession
} from './db/repository';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { BottomNav, TabId } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { AynotLogo } from './components/common/AynotLogo';
import { EnglishView } from './components/english/EnglishView';
import { UniversityView } from './components/university/UniversityView';
import { IdeasView } from './components/ideas/IdeasView';
import { QuickIdeaModal } from './components/ideas/QuickIdeaModal';
import { NotesView } from './components/notes/NotesView';
import { QuickPersonalNoteModal } from './components/notes/QuickPersonalNoteModal';
import { StudyContainerView, StudySubTab } from './components/study/StudyContainerView';
import { NotesContainerView, NotesSubTab } from './components/notes/NotesContainerView';
import { SchoolContainerView, SchoolSubTab } from './components/school/SchoolContainerView';
import { isCardDueToday, calculateNextReview } from './utils/englishUtils';
import { getExamCountdown, getExamTypeTitle } from './utils/universityUtils';
import { COMMON_EXAM_GROUP, storeCommonExam, clearStoredCommonExam } from './utils/commonExam';
import { FloatingActionButton } from './components/FloatingActionButton';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { TodayView } from './components/today/TodayView';
import { StudentsView } from './components/students/StudentsView';
import { StudentDetailView } from './components/students/StudentDetailView';
import { StudentModal } from './components/students/StudentModal';
import { StudentNoteModal } from './components/students/StudentNoteModal';
import { SettingsView } from './components/settings/SettingsView';
import { PWAInstallModal } from './components/PWAInstallModal';
import { ParentCallsModal } from './components/parentCalls/ParentCallsModal';
import { ParentCallsHistoryModal } from './components/parentCalls/ParentCallsHistoryModal';
import { StudyView } from './components/study/StudyView';
import { StudyTaskModal } from './components/study/StudyTaskModal';
import { PomodoroModal } from './components/study/PomodoroModal';
import { getOrCreateCurrentSession, MissedCallInfo } from './services/parentCallService';
import { sendBrowserNotification, getTargetDateOfWeek, toLocalISODate } from './utils/calendar';
import { auth } from './db/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { logoutUser, ensureUserProfile } from './services/authService';
import { clearAllDatabase as clearLocalDatabase } from './db/indexedDb';
import { AuthScreen } from './components/auth/AuthScreen';
import { DataMigrationModal } from './components/auth/DataMigrationModal';
import {
  LocalDataSummary,
  getLocalDataSummary,
  isUserMigrated,
  markUserAsMigrated
} from './services/migrationService';
import {
  subscribeToUserData,
  saveStudentCloud,
  deleteStudentCloud,
  saveStudentNoteCloud,
  deleteStudentNoteCloud,
  saveCallSessionCloud,
  saveStudyTaskCloud,
  saveMultipleStudyTasksCloud,
  deleteStudyTaskCloud,
  saveDayConfigCloud,
  saveDayCheckinCloud,
  saveEnglishNoteCloud,
  deleteEnglishNoteCloud,
  saveEnglishDeckCloud,
  deleteEnglishDeckCloud,
  saveEnglishCardCloud,
  saveMultipleEnglishCardsCloud,
  deleteEnglishCardCloud,
  saveEnglishReviewLogCloud,
  saveUniversityTermCloud,
  deleteUniversityTermCloud,
  saveUniversityCourseCloud,
  saveMultipleUniversityCoursesCloud,
  deleteUniversityCourseCloud,
  saveUniversityExamCloud,
  saveMultipleUniversityExamsCloud,
  deleteUniversityExamCloud,
  saveUniversityNoteCloud,
  deleteUniversityNoteCloud,
  saveUniversityAssignmentCloud,
  deleteUniversityAssignmentCloud,
  saveProjectIdeaCloud,
  deleteProjectIdeaCloud,
  savePersonalNoteCloud,
  deletePersonalNoteCloud,
  savePersonalTagCloud,
  deletePersonalTagCloud,
  saveSettingCloud,
  clearAllUserDataCloud
} from './services/cloudDataService';

// true: giriş yapmadan uygulama açılmaz. false yapılırsa oturumsuz kullanım (yalnızca yerel IndexedDB) çalışır.
const REQUIRE_LOGIN = true;

export default function App() {
  const { theme, setTheme, resolvedTheme, toggleTheme } = useTheme();

  // Navigation state
  const [activeTab, setActiveTab] = useState<TabId>('bugun');
  const [schoolSubTab, setSchoolSubTab] = useState<SchoolSubTab>('notlar');
  const [studySubTab, setStudySubTab] = useState<StudySubTab>('plan');
  const [notesSubTab, setNotesSubTab] = useState<NotesSubTab>('notlar');
  const [selectedCourseIdForView, setSelectedCourseIdForView] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedSchoolNoteIdForView, setSelectedSchoolNoteIdForView] = useState<string | null>(null);

  // Student & Note data
  const [students, setStudents] = useState<Student[]>([]);
  const [studentNotes, setStudentNotes] = useState<StudentNote[]>([]);

  // Parent Call data
  const [callSessions, setCallSessions] = useState<WeeklyCallSession[]>([]);
  const [currentCallSession, setCurrentCallSession] = useState<WeeklyCallSession | null>(null);
  const [missedCalls, setMissedCalls] = useState<MissedCallInfo[]>([]);
  const [parentCallSettings, setParentCallSettings] = useState<ParentCallSettings>({
    callDay: 5, // Cuma
    callTime: '14:00',
    reminderEnabled: true,
  });

  // Study & Fatigue Mode data
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>([]);
  const [dayConfigs, setDayConfigs] = useState<StudyDayConfig[]>([]);
  const [dayCheckins, setDayCheckins] = useState<DayCheckin[]>([]);
  const [studySettings, setStudySettings] = useState<StudySettings>({
    pomodoroWorkMinutes: 25,
    pomodoroBreakMinutes: 5,
    eveningCheckinHour: 18,
    alwaysSuggestLightOnFatigue: true,
  });
  const [todayCheckin, setTodayCheckin] = useState<DayCheckin | null>(null);

  // English section state
  const [englishNotes, setEnglishNotes] = useState<EnglishNote[]>([]);
  const [englishDecks, setEnglishDecks] = useState<EnglishDeck[]>([]);
  const [englishCards, setEnglishCards] = useState<EnglishCard[]>([]);
  const [englishSettings, setEnglishSettings] = useState<EnglishDailyGoalSettings>({
    dailyNewWordGoal: 5,
    dailyReviewLimit: 20,
    reduceGoalOnFatigue: true,
  });

  // University section state
  const [universityTerms, setUniversityTerms] = useState<UniversityTerm[]>([]);
  const [universityCourses, setUniversityCourses] = useState<UniversityCourse[]>([]);
  const [universityExams, setUniversityExams] = useState<UniversityExam[]>([]);
  const [universityNotes, setUniversityNotes] = useState<UniversityNote[]>([]);
  const [universityAssignments, setUniversityAssignments] = useState<UniversityAssignment[]>([]);

  // Project Ideas section state
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
  const [selectedIdeaIdForView, setSelectedIdeaIdForView] = useState<string | null>(null);
  const [isGlobalQuickIdeaOpen, setIsGlobalQuickIdeaOpen] = useState(false);

  // Personal Notes & Tags section state
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>([]);
  const [personalTags, setPersonalTags] = useState<PersonalNoteTag[]>([]);
  const [selectedNoteIdForView, setSelectedNoteIdForView] = useState<string | null>(null);
  const [isGlobalQuickNoteOpen, setIsGlobalQuickNoteOpen] = useState(false);
  const [userName, setUserName] = useState<string>('Zipidola');

  const [stats, setStats] = useState({
    studentsCount: 0,
    notesCount: 0,
    photosCount: 0,
    alertStudentsCount: 0,
    totalCallsCount: 0,
    totalStudyTasksCount: 0,
    englishCardsCount: 0,
    englishNotesCount: 0,
    universityCoursesCount: 0,
    universityExamsCount: 0,
    universityNotesCount: 0,
    personalNotesCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<StudentNote | null>(null);
  const [noteTargetStudentId, setNoteTargetStudentId] = useState<string | null>(null);
  const [isVoiceQuickNote, setIsVoiceQuickNote] = useState(false);

  // Voice Notes toggle preference (default true)
  const [voiceNotesEnabled, setVoiceNotesEnabled] = useState<boolean>(() => {
    return localStorage.getItem('oa_voice_notes_enabled') !== 'false';
  });

  // Parent Calls Modals
  const [isParentCallsModalOpen, setIsParentCallsModalOpen] = useState(false);
  const [isCallHistoryModalOpen, setIsCallHistoryModalOpen] = useState(false);

  // Study Plan Modals
  const [isStudyTaskModalOpen, setIsStudyTaskModalOpen] = useState(false);
  const [studyTaskToEdit, setStudyTaskToEdit] = useState<StudyTask | null>(null);
  const [studyTaskDefaultDate, setStudyTaskDefaultDate] = useState<string | undefined>();
  const [studyTaskDefaultDayOfWeek, setStudyTaskDefaultDayOfWeek] = useState<number | undefined>();

  // Pomodoro Modal
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [activePomodoroTask, setActivePomodoroTask] = useState<StudyTask | null>(null);

  // Firebase Auth & Migration State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [migrationSummary, setMigrationSummary] = useState<LocalDataSummary | null>(null);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  // Öğrenciler + veli oturumları + ayarlar ilk kez buluttan geldi mi? (Haftalık oturumu ezmemek için bekleriz)
  const [cloudSynced, setCloudSynced] = useState(false);

  // Load all data from IndexedDB
  const refreshData = useCallback(async () => {
    // Oturum açıkken tüm veri Firestore dinleyicilerinden gelir; IndexedDB'den okumak state'i eskiyle ezer.
    if (getRepositoryUserId()) return;
    try {
      const todayIso = toLocalISODate();

      const [
        allSt, 
        allNt, 
        allSessions, 
        callSettings, 
        tasks, 
        dConfigs, 
        checkins, 
        sSettings,
        tCheckin,
        engNotes,
        engDecks,
        engCards,
        engSettings,
        uTerms,
        uCourses,
        uExams,
        uNotes,
        uAssignments,
        allIdeas,
        allPNotes,
        allPTags,
        stStats
      ] = await Promise.all([
        getAllStudents(),
        getAllNotes(),
        getAllCallSessions(),
        getParentCallSettings(),
        getAllStudyTasks(),
        getAllDayConfigs(),
        getAllDayCheckins(),
        getStudySettings(),
        getDayCheckin(todayIso),
        getAllEnglishNotes(),
        getAllEnglishDecks(),
        getAllEnglishCards(),
        getEnglishSettings(),
        getAllUniversityTerms(),
        getAllUniversityCourses(),
        getAllUniversityExams(),
        getAllUniversityNotes(),
        getAllUniversityAssignments(),
        getAllProjectIdeas(),
        getAllPersonalNotes(),
        getAllPersonalTags(),
        getDatabaseStats(),
      ]);

      // Seed initial demo data on first start if totally empty so user gets a warm start
      let activeStudents = allSt;
      let activeNotes = allNt;
      let activeSessions = allSessions;
      let activeTasks = tasks;
      let activeDayConfigs = dConfigs;
      let activeEngNotes = engNotes;
      let activeEngDecks = engDecks;
      let activeEngCards = engCards;
      let activeUTerms = uTerms;
      let activeUCourses = uCourses;
      let activeUExams = uExams;
      let activeUNotes = uNotes;
      let activeUAssignments = uAssignments;

      if (allSt.length === 0 && !localStorage.getItem('oa_has_seeded')) {
        localStorage.setItem('oa_has_seeded', 'true');
        await seedSampleData();
        const [
          seededSt, 
          seededNt, 
          seededSessions, 
          seededTasks, 
          seededConfigs, 
          seededEngNotes, 
          seededEngDecks, 
          seededEngCards, 
          seededUTerms,
          seededUCourses,
          seededUExams,
          seededUNotes,
          seededUAssignments,
          seededStats
        ] = await Promise.all([
          getAllStudents(),
          getAllNotes(),
          getAllCallSessions(),
          getAllStudyTasks(),
          getAllDayConfigs(),
          getAllEnglishNotes(),
          getAllEnglishDecks(),
          getAllEnglishCards(),
          getAllUniversityTerms(),
          getAllUniversityCourses(),
          getAllUniversityExams(),
          getAllUniversityNotes(),
          getAllUniversityAssignments(),
          getDatabaseStats(),
        ]);
        activeStudents = seededSt;
        activeNotes = seededNt;
        activeSessions = seededSessions;
        activeTasks = seededTasks;
        activeDayConfigs = seededConfigs;
        activeEngNotes = seededEngNotes;
        activeEngDecks = seededEngDecks;
        activeEngCards = seededEngCards;
        activeUTerms = seededUTerms;
        activeUCourses = seededUCourses;
        activeUExams = seededUExams;
        activeUNotes = seededUNotes;
        activeUAssignments = seededUAssignments;
        setStats(seededStats);
      } else {
        setStats(stStats);
      }

      // If no terms exist, ensure default 2026-2027 Güz term
      if (activeUTerms.length === 0) {
        const defaultTerm: UniversityTerm = {
          id: 'term-guz-2026',
          name: '2026-2027 Güz',
          isActive: true,
          isArchived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await saveUniversityTerm(defaultTerm);
        activeUTerms = [defaultTerm];
      }

      setStudents(activeStudents);
      setStudentNotes(activeNotes);
      setCallSessions(activeSessions);
      setParentCallSettings(callSettings);
      setStudyTasks(activeTasks);
      setDayConfigs(activeDayConfigs);
      setDayCheckins(checkins);
      setStudySettings(sSettings);
      setTodayCheckin(tCheckin);
      setEnglishNotes(activeEngNotes);
      setEnglishDecks(activeEngDecks);
      setEnglishCards(activeEngCards);
      setEnglishSettings(engSettings);
      setUniversityTerms(activeUTerms);
      setUniversityCourses(activeUCourses);
      setUniversityExams(activeUExams);
      setUniversityNotes(activeUNotes);
      setUniversityAssignments(activeUAssignments);
      setProjectIdeas(allIdeas);
      setPersonalNotes(allPNotes);
      setPersonalTags(allPTags);

      const uName = await getUserName();
      setUserName(uName || 'Zipidola');

      // Initialize or sync this week's call session
      if (activeStudents.length > 0) {
        const { currentSession, missedCalls: missed } = await getOrCreateCurrentSession(
          activeStudents,
          callSettings,
          activeSessions
        );
        setCurrentCallSession(currentSession);
        setMissedCalls(missed);
      } else {
        setCurrentCallSession(null);
        setMissedCalls([]);
      }
    } catch (err) {
      console.error('Failed to load from IndexedDB', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Repository'yi önce güncelle: bundan sonraki tüm yazmalar doğru yere gitsin
      setRepositoryUser(user ? user.uid : null);
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        // Profil belgesi (Google / yönlendirmeli girişlerde de) garanti altına alınır; hata girişi engellemez
        ensureUserProfile(user).catch((e) => console.warn('Profil oluşturulamadı:', e));

        try {
          if (!isUserMigrated(user.uid)) {
            const summary = await getLocalDataSummary();
            if (summary.totalCount > 0) {
              setMigrationSummary(summary);
              setIsMigrationModalOpen(true);
            }
          }
        } catch (e) {
          console.warn('Migration check notice:', e);
        }
      } else {
        setCloudSynced(false);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to Realtime Firestore Collections for the authenticated user
  useEffect(() => {
    if (!currentUser) return;

    setIsLoading(true);
    setCloudSynced(false);

    const loaded = { students: false, sessions: false, settings: false };
    const markLoaded = (key: keyof typeof loaded) => {
      loaded[key] = true;
      if (loaded.students && loaded.sessions && loaded.settings) setCloudSynced(true);
    };

    // İnternet yoksa ve önbellek boşsa snapshot gelmeyebilir; sonsuz yükleme ekranında kalma
    const loadingFallback = setTimeout(() => setIsLoading(false), 8000);

    const unsubscribe = subscribeToUserData(currentUser.uid, {
      onStudents: (items) => {
        setStudents(items);
        setIsLoading(false);
        markLoaded('students');
      },
      onStudentNotes: (items) => setStudentNotes(items),
      onCallSessions: (items) => {
        setCallSessions(items);
        markLoaded('sessions');
      },
      onStudyTasks: (items) => setStudyTasks(items),
      onDayConfigs: (items) => setDayConfigs(items),
      onDayCheckins: (items) => {
        setDayCheckins(items);
        const todayIso = toLocalISODate();
        const found = items.find((c) => c.date === todayIso);
        setTodayCheckin(found || null);
      },
      onEnglishNotes: (items) => setEnglishNotes(items),
      onEnglishDecks: (items) => setEnglishDecks(items),
      onEnglishCards: (items) => setEnglishCards(items),
      onUniversityTerms: (items) => {
        if (items.length === 0) {
          const defaultTerm: UniversityTerm = {
            id: 'term-guz-2026',
            name: '2026-2027 Güz',
            isActive: true,
            isArchived: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          saveUniversityTermCloud(currentUser.uid, defaultTerm).catch(() => {});
          setUniversityTerms([defaultTerm]);
        } else {
          setUniversityTerms(items);
        }
      },
      onUniversityCourses: (items) => setUniversityCourses(items),
      onUniversityExams: (items) => setUniversityExams(items),
      onUniversityNotes: (items) => setUniversityNotes(items),
      onUniversityAssignments: (items) => setUniversityAssignments(items),
      onProjectIdeas: (items) => setProjectIdeas(items),
      onPersonalNotes: (items) => setPersonalNotes(items),
      onPersonalTags: (items) => {
        if (items.length === 0) {
          DEFAULT_PERSONAL_TAGS.forEach((tag) => {
            savePersonalTagCloud(currentUser.uid, tag).catch(() => {});
          });
          setPersonalTags(DEFAULT_PERSONAL_TAGS);
        } else {
          setPersonalTags(items);
        }
      },
      onSettings: (map) => {
        if (map['parent_call_settings']) setParentCallSettings(map['parent_call_settings']);
        if (map['study_settings']) setStudySettings(map['study_settings']);
        if (map['english_settings']) setEnglishSettings(map['english_settings']);
        if (map['userName']) setUserName(map['userName']);
        markLoaded('settings');
      }
    });

    return () => {
      clearTimeout(loadingFallback);
      unsubscribe();
    };
  }, [currentUser]);

  // Bulut modunda: bu haftanın veli arama oturumunu oluştur / öğrencilerle senkronize et
  // (yerel modda bu işi refreshData yapıyor)
  useEffect(() => {
    if (!currentUser || !cloudSynced) return;
    if (students.length === 0) {
      setCurrentCallSession(null);
      setMissedCalls([]);
      return;
    }
    let cancelled = false;
    getOrCreateCurrentSession(students, parentCallSettings, callSessions)
      .then(({ currentSession, missedCalls: missed }) => {
        if (cancelled) return;
        setCurrentCallSession(currentSession);
        setMissedCalls(missed);
      })
      .catch((e) => console.warn('Veli oturumu hazırlanamadı:', e));
    return () => {
      cancelled = true;
    };
  }, [currentUser, cloudSynced, students, callSessions, parentCallSettings]);

  // Keep stats dynamically in sync
  useEffect(() => {
    setStats({
      studentsCount: students.length,
      notesCount: studentNotes.length,
      photosCount: studentNotes.filter((n) => Boolean(n.photoUrl)).length,
      alertStudentsCount: students.filter((s) => Boolean(s.healthAlert)).length,
      totalCallsCount: callSessions.reduce((acc, s) => acc + (s.items?.filter((i) => i.called).length || 0), 0),
      totalStudyTasksCount: studyTasks.length,
      englishCardsCount: englishCards.length,
      englishNotesCount: englishNotes.length,
      universityCoursesCount: universityCourses.length,
      universityExamsCount: universityExams.length,
      universityNotesCount: universityNotes.length,
      personalNotesCount: personalNotes.length,
    });
  }, [
    students,
    studentNotes,
    callSessions,
    studyTasks,
    englishCards,
    englishNotes,
    universityCourses,
    universityExams,
    universityNotes,
    personalNotes
  ]);

  const handleExportCloudBackup = async (): Promise<BackupData> => {
    return {
      version: 7,
      exportedAt: new Date().toISOString(),
      appName: 'Aynot.',
      students,
      studentNotes,
      weeklyCallSessions: callSessions,
      studyTasks,
      studyDayConfigs: dayConfigs,
      dayCheckins,
      englishNotes,
      englishDecks,
      englishCards,
      universityTerms,
      universityCourses,
      universityExams,
      universityNotes,
      universityAssignments,
      projectIdeas,
      personalNotes,
      personalTags,
      settings: {
        theme,
        userName,
        parentCalls: parentCallSettings,
        voiceNotesEnabled,
        studySettings,
        englishSettings,
      }
    };
  };

  const handleImportCloudBackup = async (backup: BackupData, mode: 'merge' | 'overwrite') => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    // "Üzerine yaz" seçildiyse önce hesaptaki mevcut veriler silinir (eskiden bu mod yok sayılıyordu)
    if (mode === 'overwrite') {
      await clearAllUserDataCloud(uid);
    }

    if (backup.students) {
      for (const s of backup.students) await saveStudentCloud(uid, s);
    }
    if (backup.studentNotes) {
      for (const n of backup.studentNotes) await saveStudentNoteCloud(uid, n);
    }
    if (backup.weeklyCallSessions) {
      for (const c of backup.weeklyCallSessions) await saveCallSessionCloud(uid, c);
    }
    if (backup.studyTasks) {
      await saveMultipleStudyTasksCloud(uid, backup.studyTasks);
    }
    if (backup.studyDayConfigs) {
      for (const d of backup.studyDayConfigs) await saveDayConfigCloud(uid, d);
    }
    if (backup.dayCheckins) {
      for (const ch of backup.dayCheckins) await saveDayCheckinCloud(uid, ch);
    }
    if (backup.englishNotes) {
      for (const en of backup.englishNotes) await saveEnglishNoteCloud(uid, en);
    }
    if (backup.englishDecks) {
      for (const ed of backup.englishDecks) await saveEnglishDeckCloud(uid, ed);
    }
    if (backup.englishCards) {
      await saveMultipleEnglishCardsCloud(uid, backup.englishCards);
    }
    if (backup.universityTerms) {
      for (const ut of backup.universityTerms) await saveUniversityTermCloud(uid, ut);
    }
    if (backup.universityCourses) {
      await saveMultipleUniversityCoursesCloud(uid, backup.universityCourses);
    }
    if (backup.universityExams) {
      await saveMultipleUniversityExamsCloud(uid, backup.universityExams);
    }
    if (backup.universityNotes) {
      for (const un of backup.universityNotes) await saveUniversityNoteCloud(uid, un);
    }
    if (backup.universityAssignments) {
      for (const ua of backup.universityAssignments) await saveUniversityAssignmentCloud(uid, ua);
    }
    if (backup.projectIdeas) {
      for (const pi of backup.projectIdeas) await saveProjectIdeaCloud(uid, pi);
    }
    if (backup.personalNotes) {
      for (const pn of backup.personalNotes) await savePersonalNoteCloud(uid, pn);
    }
    if (backup.personalTags) {
      for (const pt of backup.personalTags) await savePersonalTagCloud(uid, pt);
    }
    if (backup.englishLogs) {
      for (const log of backup.englishLogs) await saveEnglishReviewLogCloud(uid, log);
    }
    if (backup.settings?.parentCalls) {
      await saveSettingCloud(uid, 'parent_call_settings', backup.settings.parentCalls);
    }
    if (backup.settings?.studySettings) {
      await saveSettingCloud(uid, 'study_settings', backup.settings.studySettings);
    }
    if (backup.settings?.englishSettings) {
      await saveSettingCloud(uid, 'english_settings', backup.settings.englishSettings);
    }
    if (backup.settings?.userName) {
      await saveSettingCloud(uid, 'userName', backup.settings.userName);
    }
  };

  const handleSaveUserName = async (name: string) => {
    await saveUserName(name);
    setUserName(name || 'Zipidola');
  };

  useEffect(() => {
    // Giriş zorunluyken oturumsuz durumda yerel veri okunmaz (ve örnek veri tohumlanmaz)
    if (!currentUser && !authLoading && !REQUIRE_LOGIN) {
      refreshData();
    }
  }, [currentUser, authLoading, refreshData]);

  // Reset scroll and guarantee body overflow is unlocked on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, [activeTab]);

  // Check and trigger parent calls reminder notification
  useEffect(() => {
    if (!parentCallSettings.reminderEnabled) return;

    const checkReminder = () => {
      const now = new Date();
      const currentDay = now.getDay();
      if (currentDay !== parentCallSettings.callDay) return;

      const [targetH, targetM] = parentCallSettings.callTime.split(':').map((v) => parseInt(v, 10));
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      if (currentH === targetH && Math.abs(currentM - targetM) <= 15) {
        const dateKey = toLocalISODate(now);
        const lastAlerted = localStorage.getItem('oa_last_call_alert_date');

        if (lastAlerted !== dateKey) {
          localStorage.setItem('oa_last_call_alert_date', dateKey);
          sendBrowserNotification('Aynot.: Veli Aramaları', {
            body: 'Bugün veli aramaları saati geldi! Arama listenizi kontrol etmek için dokunun.',
          });
        }
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, [parentCallSettings]);

  // Student CRUD handlers
  const handleSaveStudent = async (data: Partial<Student>) => {
    const now = Date.now();
    let studentToSave: Student;

    if (studentToEdit) {
      studentToSave = {
        ...studentToEdit,
        ...data,
        name: data.name || studentToEdit.name,
        group: data.group || studentToEdit.group,
        updatedAt: now,
      };
    } else {
      studentToSave = {
        id: 'st-' + now + '-' + Math.random().toString(36).substring(2, 7),
        name: data.name!,
        birthDate: data.birthDate,
        group: data.group!,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        healthAlert: data.healthAlert,
        createdAt: now,
        updatedAt: now,
      };
    }

    await saveStudent(studentToSave);
    await refreshData();
    setIsStudentModalOpen(false);
    setStudentToEdit(null);
  };

  const handleDeleteStudent = async (studentId: string) => {
    await deleteStudent(studentId);
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
    }
    await refreshData();
  };

  // Note CRUD handlers
  const handleSaveNote = async (data: Partial<StudentNote>) => {
    const now = Date.now();
    let noteToSave: StudentNote;

    if (noteToEdit) {
      noteToSave = {
        ...noteToEdit,
        ...data,
        updatedAt: now,
      };
    } else {
      noteToSave = {
        id: 'nt-' + now + '-' + Math.random().toString(36).substring(2, 7),
        title: data.title?.trim() || undefined,
        studentId: data.studentId || undefined,
        tag: data.tag || 'ogrenci',
        date: data.date || toLocalISODate(),
        time: data.time,
        category: data.category || 'gelisim',
        content: data.content!,
        photoUrl: data.photoUrl,
        createdAt: now,
        updatedAt: now,
      };
    }

    await saveNote(noteToSave);
    await refreshData();
    setIsNoteModalOpen(false);
    setNoteToEdit(null);
    setNoteTargetStudentId(null);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
    await refreshData();
  };

  // Parent Call Settings save
  const handleSaveParentCallSettings = async (newSettings: ParentCallSettings) => {
    await saveParentCallSettings(newSettings);
    setParentCallSettings(newSettings);
    await refreshData();
  };

  // Update Call Session (called from ParentCallsModal)
  const handleUpdateCallSession = async (updatedSession: WeeklyCallSession) => {
    setCurrentCallSession(updatedSession);
    setCallSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === updatedSession.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updatedSession;
        return copy;
      }
      return [updatedSession, ...prev];
    });
    await saveCallSession(updatedSession);
    await refreshData();
  };

  // ---------------- Study Tasks & Fatigue Mode Handlers ----------------

  const handleToggleStudyTask = async (taskId: string, completed: boolean) => {
    const task = studyTasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask: StudyTask = {
      ...task,
      completed,
      completedAt: completed ? Date.now() : undefined,
      updatedAt: Date.now(),
    };

    await saveStudyTask(updatedTask);
    await refreshData();
  };

  const handleSaveStudyTask = async (taskData: Partial<StudyTask>, replicateDayIndexes: number[] = []) => {
    const now = Date.now();

    if (studyTaskToEdit) {
      const updatedTask: StudyTask = {
        ...studyTaskToEdit,
        ...taskData,
        updatedAt: now,
      };
      await saveStudyTask(updatedTask);
    } else {
      const primaryTask: StudyTask = {
        id: 'task-' + now + '-' + Math.random().toString(36).substring(2, 7),
        title: taskData.title!,
        type: taskData.type || 'universite',
        targetDurationMinutes: taskData.targetDurationMinutes || 25,
        actualDurationMinutes: 0,
        time: taskData.time,
        reminderTime: taskData.reminderTime,
        completed: false,
        date: taskData.date || toLocalISODate(),
        dayOfWeek: taskData.dayOfWeek !== undefined ? taskData.dayOfWeek : new Date().getDay(),
        createdAt: now,
        updatedAt: now,
      };

      const tasksToSave: StudyTask[] = [primaryTask];

      // Replicate to other days if chosen
      for (const dIdx of replicateDayIndexes) {
        if (dIdx !== primaryTask.dayOfWeek) {
          tasksToSave.push({
            ...primaryTask,
            id: 'task-' + now + '-' + Math.random().toString(36).substring(2, 7) + '-rep-' + dIdx,
            date: getTargetDateOfWeek(dIdx),
            dayOfWeek: dIdx,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      await saveMultipleStudyTasks(tasksToSave);
    }

    await refreshData();
    setIsStudyTaskModalOpen(false);
    setStudyTaskToEdit(null);
  };

  const handleDeleteStudyTask = async (taskId: string) => {
    await deleteStudyTask(taskId);
    await refreshData();
  };

  const handleCopyDayTasks = async (sourceDayOfWeek: number, targetDays: number[]) => {
    const sourceTasks = studyTasks.filter((t) => t.dayOfWeek === sourceDayOfWeek);
    if (sourceTasks.length === 0) return;

    const now = Date.now();
    const newTasks: StudyTask[] = [];

    for (const targetDay of targetDays) {
      const targetDate = getTargetDateOfWeek(targetDay);
      for (const st of sourceTasks) {
        newTasks.push({
          ...st,
          id: 'task-' + now + '-' + Math.random().toString(36).substring(2, 7) + '-cp-' + targetDay,
          date: targetDate,
          dayOfWeek: targetDay,
          completed: false,
          actualDurationMinutes: 0,
          completedAt: undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await saveMultipleStudyTasks(newTasks);
    await refreshData();
  };

  const handleSaveDayConfig = async (config: StudyDayConfig) => {
    await saveDayConfig(config);
    setDayConfigs((prev) => {
      const idx = prev.findIndex((c) => c.dayOfWeek === config.dayOfWeek);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = config;
        return copy;
      }
      return [...prev, config];
    });
  };

  const handleSaveStudySettings = async (newSettings: StudySettings) => {
    await saveStudySettings(newSettings);
    setStudySettings(newSettings);
    await refreshData();
  };

  const handleSaveDayCheckin = async (rating: DayEnergyRating) => {
    const todayIso = toLocalISODate();
    const checkin: DayCheckin = {
      date: todayIso,
      rating,
      timestamp: Date.now(),
    };
    await saveDayCheckin(checkin);
    setTodayCheckin(checkin);
  };

  // Pomodoro timer start and duration save
  const handleStartPomodoro = (task: StudyTask) => {
    setActivePomodoroTask(task);
    setIsPomodoroOpen(true);
  };

  const handleSavePomodoroDuration = async (
    taskId: string, 
    additionalMinutes: number, 
    markCompleted: boolean
  ) => {
    const task = studyTasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask: StudyTask = {
      ...task,
      actualDurationMinutes: (task.actualDurationMinutes || 0) + additionalMinutes,
      completed: markCompleted ? true : task.completed,
      completedAt: markCompleted ? Date.now() : task.completedAt,
      updatedAt: Date.now(),
    };

    await saveStudyTask(updatedTask);
    await refreshData();
  };

  // Incomplete Tasks Actions (Postpone to tomorrow, other day, or delete)
  const handlePostponeIncompleteTasks = async (
    action: 'tomorrow' | 'target_day' | 'delete', 
    targetDayIndex?: number
  ) => {
    const todayIso = toLocalISODate();
    const currentDayIdx = new Date().getDay();

    const todayIncomplete = studyTasks.filter(
      (t) => (t.date === todayIso || t.dayOfWeek === currentDayIdx) && !t.completed
    );

    if (todayIncomplete.length === 0) return;

    if (action === 'delete') {
      for (const t of todayIncomplete) {
        await deleteStudyTask(t.id);
      }
    } else if (action === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowIso = toLocalISODate(tomorrow);
      const tomorrowDayOfWeek = tomorrow.getDay();

      const updated = todayIncomplete.map((t) => ({
        ...t,
        date: tomorrowIso,
        dayOfWeek: tomorrowDayOfWeek,
        postponedFromDate: todayIso,
        updatedAt: Date.now(),
      }));

      await saveMultipleStudyTasks(updated);
    } else if (action === 'target_day' && targetDayIndex !== undefined) {
      const targetDate = getTargetDateOfWeek(targetDayIndex);
      const updated = todayIncomplete.map((t) => ({
        ...t,
        date: targetDate,
        dayOfWeek: targetDayIndex,
        postponedFromDate: todayIso,
        updatedAt: Date.now(),
      }));

      await saveMultipleStudyTasks(updated);
    }

    await refreshData();
  };

  // Fatigue Relief Actions (Halve duration, keep priority 1 task, or postpone all)
  const handleApplyFatigueRelief = async (
    action: 'halve_duration' | 'keep_priority_postpone_rest' | 'postpone_all'
  ) => {
    const todayIso = toLocalISODate();
    const currentDayIdx = new Date().getDay();

    const todayIncomplete = studyTasks.filter(
      (t) => (t.date === todayIso || t.dayOfWeek === currentDayIdx) && !t.completed
    );

    if (todayIncomplete.length === 0) return;

    if (action === 'halve_duration') {
      const updated = todayIncomplete.map((t) => ({
        ...t,
        originalDuration: t.originalDuration || t.targetDurationMinutes,
        targetDurationMinutes: Math.max(10, Math.round(t.targetDurationMinutes / 2)),
        isReduced: true,
        updatedAt: Date.now(),
      }));
      await saveMultipleStudyTasks(updated);
    } else if (action === 'keep_priority_postpone_rest') {
      // Keep the first task for today, move the rest to tomorrow
      const [firstTask, ...restTasks] = todayIncomplete;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowIso = toLocalISODate(tomorrow);
      const tomorrowDayOfWeek = tomorrow.getDay();

      const toPostpone = restTasks.map((t) => ({
        ...t,
        date: tomorrowIso,
        dayOfWeek: tomorrowDayOfWeek,
        postponedFromDate: todayIso,
        updatedAt: Date.now(),
      }));

      if (firstTask) {
        // Lighten first task slightly too
        const updatedFirst: StudyTask = {
          ...firstTask,
          originalDuration: firstTask.originalDuration || firstTask.targetDurationMinutes,
          targetDurationMinutes: Math.max(15, Math.round(firstTask.targetDurationMinutes * 0.7)),
          isReduced: true,
          updatedAt: Date.now(),
        };
        await saveStudyTask(updatedFirst);
      }

      if (toPostpone.length > 0) {
        await saveMultipleStudyTasks(toPostpone);
      }
    } else if (action === 'postpone_all') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowIso = toLocalISODate(tomorrow);
      const tomorrowDayOfWeek = tomorrow.getDay();

      const updated = todayIncomplete.map((t) => ({
        ...t,
        date: tomorrowIso,
        dayOfWeek: tomorrowDayOfWeek,
        postponedFromDate: todayIso,
        updatedAt: Date.now(),
      }));

      await saveMultipleStudyTasks(updated);
    }

    // Mark checkin as appliedLightPlan
    if (todayCheckin) {
      await saveDayCheckin({ ...todayCheckin, appliedLightPlan: true });
    }

    await refreshData();
  };

  // Quick Action Triggers
  const handleOpenQuickNote = (studentId?: string) => {
    setNoteToEdit(null);
    setNoteTargetStudentId(studentId || selectedStudentId || null);
    setIsVoiceQuickNote(false);
    setIsNoteModalOpen(true);
  };

  const handleOpenVoiceQuickNote = (studentId?: string) => {
    setNoteToEdit(null);
    setNoteTargetStudentId(studentId || selectedStudentId || null);
    setIsVoiceQuickNote(true);
    setIsNoteModalOpen(true);
  };

  const handleToggleVoiceNotes = async (enabled: boolean) => {
    setVoiceNotesEnabled(enabled);
    localStorage.setItem('oa_voice_notes_enabled', String(enabled));
  };

  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  const handleEditNote = (note: StudentNote) => {
    setNoteToEdit(note);
    setNoteTargetStudentId(note.studentId || null);
    setIsNoteModalOpen(true);
  };

  // Study task trigger
  const handleOpenAddStudyTask = (defaultDate?: string, defaultDayOfWeek?: number) => {
    setStudyTaskToEdit(null);
    setStudyTaskDefaultDate(defaultDate);
    setStudyTaskDefaultDayOfWeek(defaultDayOfWeek);
    setIsStudyTaskModalOpen(true);
  };

  const handleEditStudyTask = (task: StudyTask) => {
    setStudyTaskToEdit(task);
    setStudyTaskDefaultDate(task.date);
    setStudyTaskDefaultDayOfWeek(task.dayOfWeek);
    setIsStudyTaskModalOpen(true);
  };

  // English CRUD & Study handlers
  const handleSaveEnglishNote = async (note: Partial<EnglishNote>) => {
    const toSave: EnglishNote = {
      id: note.id || `eng-note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: note.title?.trim() || 'Başlıksız Not',
      content: note.content || '',
      tag: note.tag || 'diger',
      createdAt: note.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await saveEnglishNote(toSave);
    await refreshData();
  };

  const handleDeleteEnglishNote = async (noteId: string) => {
    await deleteEnglishNote(noteId);
    await refreshData();
  };

  const handleSaveEnglishDeck = async (deck: Partial<EnglishDeck>) => {
    const toSave: EnglishDeck = {
      id: deck.id || `deck-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: deck.name?.trim() || 'Yeni Deste',
      description: deck.description?.trim(),
      color: deck.color || 'teal',
      createdAt: deck.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await saveEnglishDeck(toSave);
    await refreshData();
  };

  const handleDeleteEnglishDeck = async (deckId: string) => {
    await deleteEnglishDeck(deckId);
    await refreshData();
  };

  const handleSaveEnglishCard = async (card: Partial<EnglishCard>) => {
    const toSave: EnglishCard = {
      id: card.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      deckId: card.deckId || (englishDecks[0]?.id || 'deck-demo-1'),
      word: card.word?.trim() || '',
      meaning: card.meaning?.trim() || '',
      exampleSentence: card.exampleSentence?.trim(),
      personalNote: card.personalNote?.trim(),
      intervalDays: card.intervalDays ?? 0,
      easeFactor: card.easeFactor ?? 2.5,
      repetitions: card.repetitions ?? 0,
      nextReviewDate: card.nextReviewDate || toLocalISODate(),
      createdAt: card.createdAt || Date.now(),
      updatedAt: Date.now(),
      learnedDate: card.learnedDate,
    };
    await saveEnglishCard(toSave);
    await refreshData();
  };

  const handleSaveMultipleEnglishCards = async (cards: Partial<EnglishCard>[]) => {
    const toSaveList: EnglishCard[] = cards.map((c) => ({
      id: c.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      deckId: c.deckId || (englishDecks[0]?.id || 'deck-demo-1'),
      word: c.word?.trim() || '',
      meaning: c.meaning?.trim() || '',
      exampleSentence: c.exampleSentence?.trim(),
      personalNote: c.personalNote?.trim(),
      intervalDays: c.intervalDays ?? 0,
      easeFactor: c.easeFactor ?? 2.5,
      repetitions: c.repetitions ?? 0,
      nextReviewDate: c.nextReviewDate || toLocalISODate(),
      createdAt: c.createdAt || Date.now(),
      updatedAt: Date.now(),
      learnedDate: c.learnedDate,
    }));
    await saveMultipleEnglishCards(toSaveList);
    await refreshData();
  };

  const handleDeleteEnglishCard = async (cardId: string) => {
    await deleteEnglishCard(cardId);
    await refreshData();
  };

  const handleSaveEnglishReviewRating = async (cardId: string, rating: SpacedRepetitionRating) => {
    const card = englishCards.find((c) => c.id === cardId);
    if (!card) return;

    const todayIso = toLocalISODate();
    const { nextReviewDate, intervalDays, easeFactor, repetitions } = calculateNextReview(card, rating);

    const updatedCard: EnglishCard = {
      ...card,
      nextReviewDate,
      intervalDays,
      easeFactor,
      repetitions,
      lastReviewedAt: Date.now(),
      learnedDate: card.learnedDate || todayIso,
      updatedAt: Date.now(),
    };

    const reviewLog: EnglishStudyReviewLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      cardId,
      deckId: card.deckId,
      rating,
      date: todayIso,
      timestamp: Date.now(),
      isCorrect: rating === 'bildim' || rating === 'zorlandim',
    };

    await saveEnglishCard(updatedCard);
    await saveEnglishReviewLog(reviewLog);
    await refreshData();
  };

  const handleSaveEnglishSettings = async (settings: EnglishDailyGoalSettings) => {
    await saveEnglishSettings(settings);
    setEnglishSettings(settings);
    await refreshData();
  };

  // University CRUD & Exam Handlers
  const handleSaveUniversityTerm = async (term: UniversityTerm) => {
    await saveUniversityTerm(term);
    await refreshData();
  };

  const handleSetActiveUniversityTerm = async (termId: string) => {
    await setActiveUniversityTerm(termId);
    await refreshData();
  };

  const handleDeleteUniversityTerm = async (termId: string) => {
    await deleteUniversityTerm(termId);
    await refreshData();
  };

  // Ortak sınav tarihi: giriş ekranında da gösterilebilsin diye bu cihaza yazılır
  useEffect(() => {
    const common = universityExams
      .filter((e) => e.commonGroup === COMMON_EXAM_GROUP)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (common) {
      storeCommonExam({ date: common.date, time: common.time, label: getExamTypeTitle(common.examType) });
    }
  }, [universityExams]);

  // Ortak tarih varsa, sonradan eklenen derslere de aynı sınavı otomatik oluştur
  const ensureCommonExamsForCourses = async (newCourses: UniversityCourse[]) => {
    const ref = universityExams
      .filter((e) => e.commonGroup === COMMON_EXAM_GROUP)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!ref) return;
    const now = Date.now();
    const toCreate: UniversityExam[] = newCourses
      .filter((c) => c.termId === ref.termId && !universityExams.some((e) => e.id === `exam-common-${c.id}`))
      .map((c) => ({
        id: `exam-common-${c.id}`,
        termId: c.termId,
        courseId: c.id,
        examType: ref.examType,
        date: ref.date,
        time: ref.time,
        reminderDaysBefore: ref.reminderDaysBefore ?? 3,
        resultStatus: 'pending',
        commonGroup: COMMON_EXAM_GROUP,
        createdAt: now,
        updatedAt: now,
      }));
    if (toCreate.length > 0) await saveMultipleUniversityExams(toCreate);
  };

  const handleApplyCommonExamDate = async (date: string, time: string | undefined, examType: ExamType) => {
    const term = universityTerms.find((t) => t.isActive);
    if (!term) return;
    const termCourses = universityCourses.filter((c) => c.termId === term.id);
    const now = Date.now();
    const toSave: UniversityExam[] = termCourses.map((course) => {
      const id = `exam-common-${course.id}`;
      const existing = universityExams.find((e) => e.id === id);
      return {
        ...(existing || {}),
        id,
        termId: term.id,
        courseId: course.id,
        examType,
        date,
        time: time || undefined,
        reminderDaysBefore: existing?.reminderDaysBefore ?? 3,
        resultStatus: existing?.resultStatus || 'pending',
        // Tarih değiştiyse "3 gün kala çalışma görevi" sorusu yeniden sorulabilsin
        hasPromptedStudyTask: existing && existing.date === date ? existing.hasPromptedStudyTask : false,
        commonGroup: COMMON_EXAM_GROUP,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      } as UniversityExam;
    });
    if (toSave.length > 0) await saveMultipleUniversityExams(toSave);
    storeCommonExam({ date, time, label: getExamTypeTitle(examType) });
    await refreshData();
  };

  const handleClearCommonExamDate = async () => {
    // Sonucu girilmiş sınavlar silinmez
    const targets = universityExams.filter(
      (e) => e.commonGroup === COMMON_EXAM_GROUP && (!e.resultStatus || e.resultStatus === 'pending')
    );
    for (const e of targets) {
      await deleteUniversityExam(e.id);
    }
    clearStoredCommonExam();
    await refreshData();
  };

  const handleSaveUniversityCourse = async (course: UniversityCourse) => {
    const isNew = !universityCourses.some((c) => c.id === course.id);
    await saveUniversityCourse(course);
    if (isNew) await ensureCommonExamsForCourses([course]);
    await refreshData();
  };

  const handleSaveMultipleUniversityCourses = async (
    courses: Array<Omit<UniversityCourse, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    const toSave: UniversityCourse[] = courses.map((c) => ({
      ...c,
      id: `course-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    await saveMultipleUniversityCourses(toSave);
    await ensureCommonExamsForCourses(toSave);
    await refreshData();
  };

  const handleDeleteUniversityCourse = async (courseId: string) => {
    await deleteUniversityCourse(courseId);
    await refreshData();
  };

  const handleSaveUniversityExam = async (exam: Partial<UniversityExam>) => {
    const toSave: UniversityExam = {
      id: exam.id || `exam-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      termId: exam.termId || (universityTerms.find((t) => t.isActive)?.id || 'term-guz-2026'),
      courseId: exam.courseId || (universityCourses[0]?.id || ''),
      examType: exam.examType || 'ara_sinav',
      title: exam.title?.trim() || undefined,
      date: exam.date || toLocalISODate(),
      time: exam.time?.trim() || undefined,
      reminderDaysBefore: exam.reminderDaysBefore ?? 3,
      expectedResultDate: exam.expectedResultDate || undefined,
      resultStatus: exam.resultStatus || 'pending',
      resultScore: exam.resultScore,
      resultDate: exam.resultDate,
      resultFeedbackNote: exam.resultFeedbackNote,
      resultPromptDismissedUntil: exam.resultPromptDismissedUntil,
      hasPromptedStudyTask: exam.hasPromptedStudyTask,
      createdAt: exam.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await saveUniversityExam(toSave);
    await refreshData();
  };

  const handleSaveMultipleUniversityExams = async (
    exams: Array<Omit<UniversityExam, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    const toSave: UniversityExam[] = exams.map((e) => ({
      ...e,
      id: `exam-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      resultStatus: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    await saveMultipleUniversityExams(toSave);
    await refreshData();
  };

  const handleDeleteUniversityExam = async (examId: string) => {
    await deleteUniversityExam(examId);
    await refreshData();
  };

  const handleSaveUniversityNote = async (note: Partial<UniversityNote>) => {
    const toSave: UniversityNote = {
      id: note.id || `unote-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      termId: note.termId || (universityTerms.find((t) => t.isActive)?.id || 'term-guz-2026'),
      courseId: note.courseId || (universityCourses[0]?.id || ''),
      title: note.title?.trim() || 'Başlıksız Not',
      content: note.content || '',
      tag: note.tag || 'konu',
      imageUrl: note.imageUrl,
      createdAt: note.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await saveUniversityNote(toSave);
    await refreshData();
  };

  const handleDeleteUniversityNote = async (noteId: string) => {
    await deleteUniversityNote(noteId);
    await refreshData();
  };

  const handleSaveUniversityAssignment = async (assignment: Partial<UniversityAssignment>) => {
    const toSave: UniversityAssignment = {
      id: assignment.id || `uassign-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      termId: assignment.termId || (universityTerms.find((t) => t.isActive)?.id || 'term-guz-2026'),
      courseId: assignment.courseId || (universityCourses[0]?.id || ''),
      title: assignment.title?.trim() || 'Yeni Ödev',
      type: assignment.type || 'odev',
      dueDate: assignment.dueDate || toLocalISODate(),
      completed: assignment.completed ?? false,
      completedAt: assignment.completedAt,
      notes: assignment.notes?.trim() || undefined,
      createdAt: assignment.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await saveUniversityAssignment(toSave);
    await refreshData();
  };

  const handleToggleUniversityAssignment = async (assignmentId: string, completed: boolean) => {
    const item = universityAssignments.find((a) => a.id === assignmentId);
    if (!item) return;
    const updated: UniversityAssignment = {
      ...item,
      completed,
      completedAt: completed ? Date.now() : undefined,
      updatedAt: Date.now(),
    };
    await saveUniversityAssignment(updated);
    await refreshData();
  };

  const handleDeleteUniversityAssignment = async (assignmentId: string) => {
    await deleteUniversityAssignment(assignmentId);
    await refreshData();
  };

  // Result answer handler
  const handleSaveExamResult = async (
    examId: string, 
    resultStatus: ExamResultStatus, 
    score?: string, 
    feedback?: string
  ) => {
    const exam = universityExams.find((e) => e.id === examId);
    if (!exam) return;

    const todayStr = toLocalISODate();
    const updatedExam: UniversityExam = {
      ...exam,
      resultStatus,
      resultScore: score,
      resultFeedbackNote: feedback,
      resultDate: todayStr,
      updatedAt: Date.now(),
    };

    await saveUniversityExam(updatedExam);
    await refreshData();
  };

  const handlePostponeExamResultPrompt = async (examId: string) => {
    const exam = universityExams.find((e) => e.id === examId);
    if (!exam) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = toLocalISODate(tomorrow);

    const updatedExam: UniversityExam = {
      ...exam,
      resultPromptDismissedUntil: tomorrowStr,
      updatedAt: Date.now(),
    };

    await saveUniversityExam(updatedExam);
    await refreshData();
  };

  // Exam 3 days before -> add study task to study plan
  const handleAddExamStudyTasks = async (exam: UniversityExam, courseName: string) => {
    const todayStr = toLocalISODate();
    const dayOfWeek = new Date().getDay();

    const newTask: StudyTask = {
      id: `task-exam-${exam.id}-${Date.now()}`,
      title: `${courseName} Sınav Tekrarı ve Soru Çözümü`,
      type: 'universite',
      targetDurationMinutes: 45,
      actualDurationMinutes: 0,
      completed: false,
      date: todayStr,
      dayOfWeek,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Mark that user was prompted and accepted
    const updatedExam: UniversityExam = {
      ...exam,
      hasPromptedStudyTask: true,
      updatedAt: Date.now(),
    };

    await saveStudyTask(newTask);
    await saveUniversityExam(updatedExam);
    await refreshData();
  };

  // Project Idea Handlers
  const handleSaveProjectIdea = async (idea: Partial<ProjectIdea>, openDetail?: boolean) => {
    const newId = idea.id || `idea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const toSave: ProjectIdea = {
      id: newId,
      title: idea.title?.trim() || 'Yeni Fikir',
      summary: idea.summary?.trim() || undefined,
      type: idea.type || 'saas',
      status: idea.status || 'fikir',
      isStarred: idea.isStarred ?? false,
      tags: idea.tags || [],
      problem: idea.problem?.trim() || undefined,
      targetAudience: idea.targetAudience?.trim() || undefined,
      monetization: idea.monetization?.trim() || undefined,
      competitors: idea.competitors?.trim() || undefined,
      techStack: idea.techStack?.trim() || undefined,
      nextStep: idea.nextStep?.trim() || undefined,
      links: idea.links || [],
      notes: idea.notes || [],
      todos: idea.todos || [],
      prompts: idea.prompts || [],
      createdAt: idea.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await saveProjectIdea(toSave);
    await refreshData();
    if (openDetail) {
      setSelectedIdeaIdForView(newId);
      setActiveTab('fikirler');
    }
  };

  const handleUpdateProjectIdea = async (idea: ProjectIdea) => {
    await saveProjectIdea({
      ...idea,
      updatedAt: Date.now(),
    });
    await refreshData();
  };

  const handleDeleteProjectIdea = async (ideaId: string) => {
    await deleteProjectIdea(ideaId);
    if (selectedIdeaIdForView === ideaId) {
      setSelectedIdeaIdForView(null);
    }
    await refreshData();
  };

  const handleSelectIdeaFromSearch = (ideaId: string) => {
    setSelectedIdeaIdForView(ideaId);
    setNotesSubTab('fikirler');
    setActiveTab('notlar');
  };

  // Personal Notes & Tags Handlers
  const handleSavePersonalNote = async (note: PersonalNote) => {
    await savePersonalNote(note);
    await refreshData();
  };

  const handleDeletePersonalNote = async (noteId: string) => {
    await deletePersonalNote(noteId);
    if (selectedNoteIdForView === noteId) {
      setSelectedNoteIdForView(null);
    }
    await refreshData();
  };

  const handleSavePersonalTag = async (tag: PersonalNoteTag) => {
    await savePersonalTag(tag);
    await refreshData();
  };

  const handleDeletePersonalTag = async (tagId: string) => {
    await deletePersonalTag(tagId);
    await refreshData();
  };

  const handleSelectPersonalNoteFromSearch = (noteId: string) => {
    setSelectedNoteIdForView(noteId);
    setNotesSubTab('notlar');
    setActiveTab('notlar');
  };

  // Search result jump actions
  const handleSelectStudentFromSearch = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSchoolSubTab('ogrenciler');
    setActiveTab('ogrenciler');
  };

  const handleSelectNoteFromSearch = (studentId: string, noteId: string) => {
    if (studentId) {
      setSelectedStudentId(studentId);
      setSchoolSubTab('ogrenciler');
    } else {
      setSelectedSchoolNoteIdForView(noteId);
      setSchoolSubTab('notlar');
    }
    setActiveTab('ogrenciler');
  };

  const handleSelectStudyTaskFromSearch = (_taskId: string) => {
    setStudySubTab('plan');
    setActiveTab('calisma');
  };

  const handleSelectEnglishNoteFromSearch = (_noteId: string) => {
    setActiveTab('ingilizce');
  };

  const handleSelectEnglishCardFromSearch = (_cardId: string) => {
    setActiveTab('ingilizce');
  };

  const handleSelectUniversityCourseFromSearch = (courseId: string) => {
    setSelectedCourseIdForView(courseId);
    setStudySubTab('dersler');
    setActiveTab('calisma');
  };

  const handleSelectUniversityExamFromSearch = (_examId: string) => {
    setStudySubTab('sinavlar');
    setActiveTab('calisma');
  };

  const handleSelectUniversityNoteFromSearch = (_noteId: string) => {
    setStudySubTab('notlar');
    setActiveTab('calisma');
  };

  const handleLogout = async () => {
    await logoutUser();
    // Önceki kullanıcının verisi bellekte kalmasın, dinleyiciler tamamen sıfırlansın
    window.location.reload();
  };

  const handleClearLocalData = async () => {
    // Yalnızca bu cihazdaki IndexedDB kopyası; buluttaki veriye dokunmaz
    await clearLocalDatabase();
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400">
        <AynotLogo size={64} showText={true} textClassName="text-2xl" className="mb-4" />
        <div className="w-6 h-6 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (REQUIRE_LOGIN && !currentUser) {
    return <AuthScreen />;
  }

  const todayIsoStr = toLocalISODate();
  const dueEnglishCardsCount = englishCards.filter((c) => isCardDueToday(c, todayIsoStr)).length;
  const upcomingExamsCount = universityExams.filter((e) => {
    const cd = getExamCountdown(e, todayIsoStr);
    return !cd.isPast && cd.daysLeft <= 7;
  }).length;

  const selectedStudent = selectedStudentId
    ? students.find((s) => s.id === selectedStudentId) || null
    : null;

  const selectedStudentNotes = selectedStudentId
    ? studentNotes.filter((n) => n.studentId === selectedStudentId)
    : [];

  const existingGroups = Array.from(new Set(students.map((s) => s.group))).filter(Boolean);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row font-sans antialiased transition-colors selection:bg-teal-500 selection:text-white">
      {/* Mobile Top Header (< 768px) */}
      <div className="md:hidden">
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
          onOpenSettings={() => setActiveTab('ayarlar')}
          theme={theme}
          resolvedTheme={resolvedTheme}
          onToggleTheme={toggleTheme}
          activeTab={activeTab}
        />
      </div>

      {/* Desktop Vertical Sidebar (>= 768px) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedStudentId(null);
          setActiveTab(tab);
        }}
        englishDueCount={dueEnglishCardsCount}
        upcomingExamsBadge={upcomingExamsCount}
        userName={userName}
        theme={theme}
        resolvedTheme={resolvedTheme}
        onToggleTheme={toggleTheme}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
      />

      {/* Content wrapper with scroll on desktop */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto">
        <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 pt-4 md:pt-6 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] md:pb-20">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-28 text-slate-400">
              <AynotLogo size={64} showText={true} textClassName="text-2xl" className="mb-4" />
              <div className="w-6 h-6 rounded-full border-2 border-teal-600 border-t-transparent animate-spin mb-3" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Aynot. hazırlanıyor...</p>
            </div>
          ) : (
          <>
            {/* TAB 1: Bugün (Today) */}
            {activeTab === 'bugun' && (
              <TodayView
                students={students}
                studentNotes={studentNotes}
                parentCallSession={currentCallSession}
                parentCallSettings={parentCallSettings}
                missedCalls={missedCalls}
                studyTasks={studyTasks}
                studyDayConfigs={dayConfigs}
                studySettings={studySettings}
                todayCheckin={todayCheckin}
                englishCards={englishCards}
                englishSettings={englishSettings}
                universityCourses={universityCourses}
                universityExams={universityExams}
                projectIdeas={projectIdeas}
                userName={userName}
                personalNotes={personalNotes}
                onNavigateToStudents={() => {
                  setSelectedStudentId(null);
                  setSchoolSubTab('ogrenciler');
                  setActiveTab('ogrenciler');
                }}
                onSelectStudent={(stId) => {
                  setSelectedStudentId(stId);
                  setSchoolSubTab('ogrenciler');
                  setActiveTab('ogrenciler');
                }}
                onOpenQuickNote={() => handleOpenQuickNote()}
                onAddStudent={handleOpenAddStudent}
                onOpenParentCalls={() => {
                  setSchoolSubTab('veli_aramalari');
                  setActiveTab('ogrenciler');
                }}
                onNavigateToStudy={(subTab) => {
                  setStudySubTab(subTab || 'plan');
                  setActiveTab('calisma');
                }}
                onNavigateToEnglish={() => setActiveTab('ingilizce')}
                onNavigateToNotes={() => {
                  setNotesSubTab('notlar');
                  setActiveTab('notlar');
                }}
                onNavigateToUniversity={() => {
                  setStudySubTab('sinavlar');
                  setActiveTab('calisma');
                }}
                onNavigateToIdeas={(ideaId) => {
                  if (ideaId) setSelectedIdeaIdForView(ideaId);
                  setNotesSubTab('fikirler');
                  setActiveTab('notlar');
                }}
                onOpenAddStudyTask={(defaultTitle) => handleOpenAddStudyTask(undefined, undefined)}
                onToggleTaskComplete={handleToggleStudyTask}
                onStartPomodoro={handleStartPomodoro}
                onSaveDayCheckin={handleSaveDayCheckin}
                onApplyFatigueRelief={handleApplyFatigueRelief}
                onPostponeIncompleteTasks={handlePostponeIncompleteTasks}
                onSaveExamResult={handleSaveExamResult}
                onPostponeExamResultPrompt={handlePostponeExamResultPrompt}
                onAddExamStudyTasks={handleAddExamStudyTasks}
              />
            )}

            {/* TAB 2: Okul (Notlar | Veli aramaları | Öğrenciler) */}
            {activeTab === 'ogrenciler' && (
              <SchoolContainerView
                activeSubTab={schoolSubTab}
                onSubTabChange={(subTab) => setSchoolSubTab(subTab)}
                students={students}
                notes={studentNotes}
                selectedStudent={selectedStudent}
                onSelectStudent={(stId) => setSelectedStudentId(stId)}
                onAddNewStudent={handleOpenAddStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                onAddNewNote={(stId) => handleOpenQuickNote(stId)}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                callSession={currentCallSession}
                missedCalls={missedCalls}
                allCallSessions={callSessions}
                parentCallSettings={parentCallSettings}
                onUpdateCallSession={handleUpdateCallSession}
                onOpenCallHistory={() => setIsCallHistoryModalOpen(true)}
                initialSelectedNoteId={selectedSchoolNoteIdForView}
                onClearInitialSelectedNoteId={() => setSelectedSchoolNoteIdForView(null)}
              />
            )}

            {/* TAB 3: Çalışma (Plan | Dersler | Sınavlar | Ders notları) */}
            {(activeTab === 'calisma' || (activeTab as string) === 'universite') && (
              <StudyContainerView
                studyTasks={studyTasks}
                dayConfigs={dayConfigs}
                studySettings={studySettings}
                onSaveTask={handleSaveStudyTask}
                onToggleTaskComplete={handleToggleStudyTask}
                onDeleteTask={handleDeleteStudyTask}
                onEditTask={handleEditStudyTask}
                onOpenAddTask={handleOpenAddStudyTask}
                onStartPomodoro={handleStartPomodoro}
                onSaveDayConfig={handleSaveDayConfig}
                onCopyDayTasks={handleCopyDayTasks}
                terms={universityTerms}
                courses={universityCourses}
                exams={universityExams}
                notes={universityNotes}
                assignments={universityAssignments}
                onSaveTerm={handleSaveUniversityTerm}
                onSetActiveTerm={handleSetActiveUniversityTerm}
                onDeleteTerm={handleDeleteUniversityTerm}
                onSaveCourse={handleSaveUniversityCourse}
                onSaveMultipleCourses={handleSaveMultipleUniversityCourses}
                onDeleteCourse={handleDeleteUniversityCourse}
                onSaveExam={handleSaveUniversityExam}
                onSaveMultipleExams={handleSaveMultipleUniversityExams}
                onApplyCommonExamDate={handleApplyCommonExamDate}
                onClearCommonExamDate={handleClearCommonExamDate}
                onDeleteExam={handleDeleteUniversityExam}
                onSaveNote={handleSaveUniversityNote}
                onDeleteNote={handleDeleteUniversityNote}
                onSaveAssignment={handleSaveUniversityAssignment}
                onToggleAssignment={handleToggleUniversityAssignment}
                onDeleteAssignment={handleDeleteUniversityAssignment}
                onSaveExamResult={handleSaveExamResult}
                onPostponeResultPrompt={handlePostponeExamResultPrompt}
                onSuggestStudyTask={(courseName) => {
                  handleOpenAddStudyTask();
                }}
                voiceNotesEnabled={voiceNotesEnabled}
                initialSubTab={studySubTab}
                initialSelectedCourseId={selectedCourseIdForView}
                onClearInitialSelectedCourseId={() => setSelectedCourseIdForView(null)}
              />
            )}

            {/* TAB 4: Notlar (Notlar | Fikirler) */}
            {(activeTab === 'notlar' || (activeTab as string) === 'fikirler') && (
              <NotesContainerView
                personalNotes={personalNotes}
                personalTags={personalTags}
                onSavePersonalNote={handleSavePersonalNote}
                onDeletePersonalNote={handleDeletePersonalNote}
                onSavePersonalTag={handleSavePersonalTag}
                onDeletePersonalTag={handleDeletePersonalTag}
                projectIdeas={projectIdeas}
                onSaveProjectIdea={handleSaveProjectIdea}
                onUpdateProjectIdea={handleUpdateProjectIdea}
                onDeleteProjectIdea={handleDeleteProjectIdea}
                voiceNotesEnabled={voiceNotesEnabled}
                initialSubTab={notesSubTab}
                initialSelectedIdeaId={selectedIdeaIdForView}
                onClearInitialSelectedIdeaId={() => setSelectedIdeaIdForView(null)}
                initialSelectedNoteId={selectedNoteIdForView}
                onClearInitialSelectedNoteId={() => setSelectedNoteIdForView(null)}
              />
            )}

            {/* TAB 6: İngilizce (English Notes & Flashcards) */}
            {activeTab === 'ingilizce' && (
              <EnglishView
                notes={englishNotes}
                decks={englishDecks}
                cards={englishCards}
                settings={englishSettings}
                todayCheckin={todayCheckin}
                onSaveNote={handleSaveEnglishNote}
                onDeleteNote={handleDeleteEnglishNote}
                onSaveDeck={handleSaveEnglishDeck}
                onDeleteDeck={handleDeleteEnglishDeck}
                onSaveCard={handleSaveEnglishCard}
                onSaveMultipleCards={handleSaveMultipleEnglishCards}
                onDeleteCard={handleDeleteEnglishCard}
                onSaveReviewRating={handleSaveEnglishReviewRating}
                onSaveSettings={handleSaveEnglishSettings}
                onRefreshData={refreshData}
                voiceNotesEnabled={voiceNotesEnabled}
              />
            )}

            {/* TAB 7: Ayarlar (Settings) */}
            {activeTab === 'ayarlar' && (
              <SettingsView
                theme={theme}
                onThemeChange={setTheme}
                parentCallSettings={parentCallSettings}
                onSaveParentCallSettings={handleSaveParentCallSettings}
                studySettings={studySettings}
                onSaveStudySettings={handleSaveStudySettings}
                englishSettings={englishSettings}
                onSaveEnglishSettings={handleSaveEnglishSettings}
                stats={stats}
                onRefreshData={refreshData}
                onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
                voiceNotesEnabled={voiceNotesEnabled}
                onToggleVoiceNotes={handleToggleVoiceNotes}
                userName={userName}
                onSaveUserName={handleSaveUserName}
                user={currentUser}
                onLogout={handleLogout}
                onClearLocalData={handleClearLocalData}
                onExportCloudBackup={currentUser ? handleExportCloudBackup : undefined}
                onImportCloudBackup={currentUser ? handleImportCloudBackup : undefined}
              />
            )}
          </>
        )}
      </main>
      </div>

      {/* Floating Action Button for Quick Actions */}
      <FloatingActionButton
        onQuickNote={() => handleOpenQuickNote()}
        onVoiceQuickNote={() => handleOpenVoiceQuickNote()}
        onAddStudent={handleOpenAddStudent}
        onQuickIdea={() => setIsGlobalQuickIdeaOpen(true)}
        onQuickPersonalNote={() => setIsGlobalQuickNoteOpen(true)}
        voiceNotesEnabled={voiceNotesEnabled}
      />

      {/* Fixed Bottom Navigation (Mobile only) */}
      <BottomNav
        activeTab={activeTab}
        reviewBadge={dueEnglishCardsCount}
        upcomingExamsBadge={upcomingExamsCount}
        onTabChange={(tab) => {
          setSelectedStudentId(null);
          setActiveTab(tab);
        }}
      />

      {/* Global Unified Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        students={students}
        studentNotes={studentNotes}
        weeklyCallSessions={callSessions}
        studyTasks={studyTasks}
        englishNotes={englishNotes}
        englishCards={englishCards}
        universityCourses={universityCourses}
        universityExams={universityExams}
        universityNotes={universityNotes}
        projectIdeas={projectIdeas}
        personalNotes={personalNotes}
        personalTags={personalTags}
        onSelectStudent={handleSelectStudentFromSearch}
        onSelectNote={handleSelectNoteFromSearch}
        onSelectCallRecord={(stId) => {
          setSelectedStudentId(stId);
          setActiveTab('ogrenciler');
        }}
        onSelectStudyTask={handleSelectStudyTaskFromSearch}
        onSelectEnglishNote={handleSelectEnglishNoteFromSearch}
        onSelectEnglishCard={handleSelectEnglishCardFromSearch}
        onSelectUniversityCourse={handleSelectUniversityCourseFromSearch}
        onSelectUniversityExam={handleSelectUniversityExamFromSearch}
        onSelectUniversityNote={handleSelectUniversityNoteFromSearch}
        onSelectIdea={handleSelectIdeaFromSearch}
        onSelectPersonalNote={handleSelectPersonalNoteFromSearch}
      />

      {/* Quick Idea Creation Modal from FAB */}
      <QuickIdeaModal
        isOpen={isGlobalQuickIdeaOpen}
        onClose={() => setIsGlobalQuickIdeaOpen(false)}
        onSave={handleSaveProjectIdea}
        voiceNotesEnabled={voiceNotesEnabled}
      />

      {/* Quick Personal Note Creation Modal from FAB */}
      <QuickPersonalNoteModal
        isOpen={isGlobalQuickNoteOpen}
        onClose={() => setIsGlobalQuickNoteOpen(false)}
        tags={personalTags}
        onSaveNote={handleSavePersonalNote}
        onDeleteNote={handleDeletePersonalNote}
        voiceNotesEnabled={voiceNotesEnabled}
      />

      {/* Student Add / Edit Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setStudentToEdit(null);
        }}
        onSave={handleSaveStudent}
        studentToEdit={studentToEdit}
        existingGroups={existingGroups}
      />

      {/* Student Note Add / Edit Modal */}
      <StudentNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setNoteToEdit(null);
          setNoteTargetStudentId(null);
          setIsVoiceQuickNote(false);
        }}
        onSave={handleSaveNote}
        noteToEdit={noteToEdit}
        targetStudentId={noteTargetStudentId}
        students={students}
        voiceNotesEnabled={voiceNotesEnabled}
        autoStartVoice={isVoiceQuickNote}
      />

      {/* Friday Parent Calls Manager Modal */}
      <ParentCallsModal
        isOpen={isParentCallsModalOpen}
        onClose={() => setIsParentCallsModalOpen(false)}
        session={currentCallSession}
        missedCalls={missedCalls}
        allSessions={callSessions}
        settings={parentCallSettings}
        onUpdateSession={handleUpdateCallSession}
        onOpenHistory={() => {
          setIsParentCallsModalOpen(false);
          setIsCallHistoryModalOpen(true);
        }}
        onNavigateToStudent={(stId) => {
          setIsParentCallsModalOpen(false);
          setSelectedStudentId(stId);
          setActiveTab('ogrenciler');
        }}
      />

      {/* Parent Calls History Archive Modal */}
      <ParentCallsHistoryModal
        isOpen={isCallHistoryModalOpen}
        onClose={() => setIsCallHistoryModalOpen(false)}
        sessions={callSessions}
        onSelectStudent={(stId) => {
          setIsCallHistoryModalOpen(false);
          setSelectedStudentId(stId);
          setActiveTab('ogrenciler');
        }}
      />

      {/* Study Task Add / Edit Modal */}
      <StudyTaskModal
        isOpen={isStudyTaskModalOpen}
        onClose={() => {
          setIsStudyTaskModalOpen(false);
          setStudyTaskToEdit(null);
        }}
        onSaveTask={handleSaveStudyTask}
        taskToEdit={studyTaskToEdit}
        defaultDate={studyTaskDefaultDate}
        defaultDayOfWeek={studyTaskDefaultDayOfWeek}
        voiceNotesEnabled={voiceNotesEnabled}
      />

      {/* Pomodoro Timer Modal */}
      <PomodoroModal
        isOpen={isPomodoroOpen}
        onClose={() => {
          setIsPomodoroOpen(false);
          setActivePomodoroTask(null);
        }}
        task={activePomodoroTask}
        settings={studySettings}
        onSaveTaskDuration={handleSavePomodoroDuration}
      />

      {/* Yerel veriyi hesaba aktarma */}
      {currentUser && migrationSummary && (
        <DataMigrationModal
          uid={currentUser.uid}
          summary={migrationSummary}
          isOpen={isMigrationModalOpen}
          onClose={() => {
            setIsMigrationModalOpen(false);
          }}
          onMigrated={() => {
            markUserAsMigrated(currentUser.uid);
            setMigrationSummary(null);
          }}
        />
      )}

      {/* PWA Phone Installation Guide Modal */}
      <PWAInstallModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      />
    </div>
  );
}
