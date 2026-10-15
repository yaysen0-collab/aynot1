export type NoteCategory = 
  | 'gelisim'
  | 'davranis'
  | 'veli_gorusmesi'
  | 'saglik'
  | 'diger';

export type SchoolNoteTag = 'ogrenci' | 'veli' | 'etkinlik' | 'malzeme' | 'diger';

export interface Student {
  id: string;
  name: string;
  birthDate?: string; // YYYY-MM-DD
  group: string; // Sınıf veya grup örn: "4-A", "Anaokulu-Mavi"
  parentName?: string;
  parentPhone?: string;
  healthAlert?: string; // Alerji / Sağlık uyarısı
  createdAt: number;
  updatedAt: number;
}

export interface StudentNote {
  id: string;
  title?: string; // Boşsa ilk satır başlık sayılır
  studentId?: string; // İsteğe bağlı öğrenci bağı
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  category?: NoteCategory; // Geriye dönük uyumluluk
  tag?: SchoolNoteTag; // 'ogrenci' | 'veli' | 'etkinlik' | 'malzeme' | 'diger'
  content: string;
  photoUrl?: string; // Base64 data URL
  createdAt: number;
  updatedAt: number;
}

export type SchoolNote = StudentNote;

// ---------------- Cuma / Haftalık Veli Aramaları Tipleri ----------------
export interface WeeklyCallItem {
  studentId: string;
  studentName: string;
  parentName?: string;
  parentPhone?: string;
  excluded: boolean; // O haftalık listeden çıkarıldı mı?
  called: boolean; // Arandı mı?
  calledAt?: string; // Görüşme saati örn: "14:25"
  notes?: string; // Velinin söyledikleri
  linkedNoteId?: string; // Öğrencinin genel not akışına bağlanan not ID'si
}

export interface WeeklyCallSession {
  id: string; // Oturum kimliği örn: "call-2026-10-16"
  weekDate: string; // O haftanın arama tarihi (YYYY-MM-DD)
  dayOfWeek: number; // 5 = Cuma
  callTime: string; // "14:00"
  status: 'active' | 'completed';
  items: WeeklyCallItem[];
  createdAt: number;
  updatedAt: number;
}

export interface ParentCallSettings {
  callDay: number; // 0: Pazar, 1: Pazartesi, ... 5: Cuma, 6: Cumartesi
  callTime: string; // "14:00"
  reminderEnabled: boolean; // Hatırlatma açık/kapalı
}

// ---------------- Çalışma Planı & Yorgunluk Dostu Mod Tipleri ----------------
export type StudyTaskType = 'universite' | 'ingilizce' | 'diger';

export interface StudyTask {
  id: string;
  title: string;
  type: StudyTaskType;
  targetDurationMinutes: number; // Hedef çalışma süresi (dk)
  actualDurationMinutes: number; // Harcanan / sayaç süresi (dk)
  time?: string; // İsteğe bağlı saat örn: "19:30"
  completed: boolean;
  completedAt?: number;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0..6 (Pazar=0, Pazartesi=1... Cumartesi=6)
  reminderTime?: string; // HH:mm
  isReduced?: boolean; // Yorgunluk modunda hafifletildi mi
  originalDuration?: number; // Hafifletilmeden önceki süre
  postponedFromDate?: string; // Başka bir günden kaydırıldıysa
  createdAt: number;
  updatedAt: number;
}

export type DayType = 'okul_gunu' | 'bos_gun';

export interface StudyDayConfig {
  dayOfWeek: number; // 0..6 (1: Pazartesi, 2: Salı... 5: Cuma, 6: Cmt, 0: Pazar)
  dayType: DayType; // 'okul_gunu' (anaokulu çalışma günü) veya 'bos_gun' (tatil/serbest gün)
  notes?: string;
}

export type DayEnergyRating = 'rahat' | 'normal' | 'yorucu';

export interface DayCheckin {
  date: string; // YYYY-MM-DD
  rating: DayEnergyRating;
  appliedLightPlan?: boolean;
  timestamp: number;
}

export interface StudySettings {
  pomodoroWorkMinutes: number; // Varsayılan 25 dk
  pomodoroBreakMinutes: number; // Varsayılan 5 dk
  eveningCheckinHour: number; // Akşam sorusu saati (varsayılan 18:00)
  alwaysSuggestLightOnFatigue: boolean; // Yorucu günlerde otomatik hafifletme öner
}

// ---------------- İngilizce Bölümü Tipleri ----------------
export type EnglishNoteTag = 'grammar' | 'vocabulary' | 'speaking' | 'listening' | 'writing' | 'diger';

export interface EnglishNote {
  id: string;
  title: string;
  content: string;
  tag: EnglishNoteTag;
  createdAt: number;
  updatedAt: number;
}

export interface EnglishDeck {
  id: string;
  name: string;
  description?: string;
  color?: string; // Tailwind color accent
  createdAt: number;
  updatedAt: number;
}

export type SpacedRepetitionRating = 'bildim' | 'zorlandim' | 'bilmedim';

export interface EnglishCard {
  id: string;
  deckId: string;
  word: string; // İngilizce kelime/ifade
  meaning: string; // Türkçe karşılığı
  exampleSentence?: string; // Örnek cümle
  personalNote?: string; // Kendi notum
  // Spaced repetition fields (SM-2 / Leitner style)
  intervalDays: number; // Bir sonraki tekrar aralığı (gün)
  easeFactor: number; // Kolaylık çarpanı (varsayılan 2.5)
  repetitions: number; // Başarılı tekrar sayısı
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedAt?: number; // timestamp
  learnedDate?: string; // İlk öğrenilme / oluşturulma tarihi YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
}

export interface EnglishDailyGoalSettings {
  dailyNewWordGoal: number; // Varsayılan 5
  dailyReviewLimit: number; // Varsayılan 20 (veya sınırsız)
  reduceGoalOnFatigue: boolean; // "Yorucu" günlerde hedefi yarıya indir (varsayılan true)
}

export interface EnglishStudyReviewLog {
  id: string;
  cardId: string;
  deckId?: string;
  date: string; // YYYY-MM-DD
  rating: SpacedRepetitionRating;
  timestamp: number;
  isCorrect?: boolean;
}

// ---------------- Üniversite Bölümü Tipleri ----------------
export interface UniversityTerm {
  id: string;
  name: string; // e.g. "2026-2027 Güz", "2026-2027 Bahar"
  isActive: boolean; // Aktif dönem
  isArchived: boolean; // Arşivlenmiş eski dönem
  createdAt: number;
  updatedAt: number;
}

export interface UniversityCourse {
  id: string;
  termId: string;
  name: string; // Ders adı (örn. "Veri Tabanı Yönetim Sistemleri")
  code?: string; // İsteğe bağlı ders kodu (örn. "BİL102")
  instructor?: string; // İsteğe bağlı hoca adı
  color: string; // Renk etiketi (teal, indigo, sky, emerald, amber, rose, purple)
  createdAt: number;
  updatedAt: number;
}

export type ExamType = 'ara_sinav' | 'donem_sonu' | 'butunleme' | 'diger';
export type ExamResultStatus = 'passed' | 'failed' | 'needs_resit' | 'pending';

export interface UniversityExam {
  id: string;
  termId: string;
  courseId: string;
  examType: ExamType; // Ara Sınav, Dönem Sonu, Bütünleme, Diğer
  title?: string; // İsteğe bağlı özel başlık
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (örn. "09:30")
  reminderDaysBefore?: number; // Sınavdan kaç gün önce hatırlatma
  expectedResultDate?: string; // Sonuç açıklanma tarihi (isteğe bağlı YYYY-MM-DD)
  // Sonuç alanları
  resultStatus?: ExamResultStatus; // 'passed' (Geçtim) | 'failed' (Kaldım) | 'needs_resit' (Bütünlemeye kaldım)
  resultScore?: string; // Puan veya harf notu (örn. "85" veya "AA")
  resultDate?: string; // Sonucun girildiği tarih (YYYY-MM-DD)
  resultFeedbackNote?: string; // İsteğe bağlı kişisel not
  resultPromptDismissedUntil?: string; // "Daha değil" dendiğinde ertesi güne kadar erteleme (YYYY-MM-DD)
  hasPromptedStudyTask?: boolean; // 3 gün kala çalışma görevi soruldu mu
  commonGroup?: string; // 'main' ise "ortak sınav tarihi" ile tüm derslere birlikte oluşturulmuştur
  createdAt: number;
  updatedAt: number;
}

export type UniversityNoteTag = 'konu' | 'ozet' | 'soru' | 'onemli';

export interface UniversityNote {
  id: string;
  termId: string;
  courseId: string;
  title: string;
  content: string;
  tag: UniversityNoteTag;
  imageUrl?: string; // Sıkıştırılmış görsel verisi (Data URI)
  createdAt: number;
  updatedAt: number;
}

export type UniversityAssignmentType = 'odev' | 'proje' | 'rapor' | 'diger';

export interface UniversityAssignment {
  id: string;
  termId: string;
  courseId: string;
  title: string;
  type: UniversityAssignmentType;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// ---------------- Fikirler ve Projeler Tipleri ----------------
export type IdeaStatus = 
  | 'fikir'           // Fikir
  | 'arastiriliyor'   // Araştırılıyor
  | 'planlaniyor'     // Planlanıyor
  | 'yapiliyor'       // Yapılıyor
  | 'bitti'           // Bitti
  | 'rafa_kaldirildi'; // Rafa kaldırıldı

export type IdeaType = 
  | 'saas'            // SaaS
  | 'mobile'          // Mobil Uygulama
  | 'web'             // Web Sitesi
  | 'tool'            // Araç / Otomasyon
  | 'other';          // Diğer

export interface IdeaLink {
  id: string;
  title: string;      // GitHub, Canlı Site, Tasarım, vb.
  url: string;
  type?: 'github' | 'live' | 'design' | 'other';
}

export interface IdeaNote {
  id: string;
  content: string;
  date: string;       // YYYY-MM-DD
  createdAt: number;
}

export interface IdeaTodo {
  id: string;
  text: string;
  completed: boolean;
  isMvp: boolean;     // MVP maddesi
  createdAt?: number;
}

export interface IdeaPrompt {
  id: string;
  title: string;      // Prompt başlığı
  promptText: string; // Prompt metni
  order: number;      // Sıralı adım
  createdAt?: number;
}

export interface ProjectIdea {
  id: string;
  title: string;
  summary?: string;   // Tek cümlelik özet
  type: IdeaType;
  status: IdeaStatus;
  isStarred: boolean; // Önemli / favori
  tags: string[];     // Etiketler

  // Detay alanları
  problem?: string;        // Çözdüğü problem
  targetAudience?: string; // Hedef kullanıcı
  monetization?: string;   // Nasıl para kazanır
  competitors?: string;    // Rakipler / benzerleri
  techStack?: string;      // Kullanılacak teknolojiler
  nextStep?: string;       // Bir sonraki adım

  links: IdeaLink[];
  notes: IdeaNote[];
  todos: IdeaTodo[];
  prompts: IdeaPrompt[];

  createdAt: number;
  updatedAt: number;
}

// ---------------- Kişisel Notlar & Etiketler Tipleri ----------------
export type NoteTagColor = 
  | 'purple'   // Prompt (mor)
  | 'amber'    // Fikir (sarı)
  | 'blue'     // Not (mavi)
  | 'orange'   // Yapılacak (turuncu)
  | 'green'    // Kod (yeşil)
  | 'teal'     // Link (turkuaz)
  | 'rose'     // Önemli (kırmızı)
  | 'pink'
  | 'indigo'
  | 'slate';

export interface PersonalNoteTag {
  id: string;
  name: string;
  color: NoteTagColor;
  isDefault?: boolean;
}

export interface PersonalNote {
  id: string;
  title?: string; // İsteğe bağlı, boşsa ilk satır başlık sayılır
  content: string;
  tagIds: string[]; // Birden fazla etiket seçilebilir
  isPinned: boolean; // Sabitleme (üstte kalsın)
  isArchived: boolean; // Arşivleme (varsayılan gizli)
  createdAt: number;
  updatedAt: number;
}

// Extensible search result schema for unified search
export type SearchResultType = 
  | 'student' 
  | 'student_note' 
  | 'school_note'
  | 'parent_call' 
  | 'study_task' 
  | 'english_note' 
  | 'english_card' 
  | 'university_course' 
  | 'university_exam' 
  | 'university_note' 
  | 'idea'
  | 'idea_note'
  | 'idea_prompt'
  | 'personal_note'
  | 'lesson_plan' 
  | 'flashcard';

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  snippet: string;
  date?: string;
  badge?: string;
  badgeColor?: string;
  studentId?: string; // If related to a student
  ideaId?: string;    // If related to an idea
  noteId?: string;    // If related to a personal note
  targetId: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  userName?: string;
  teacherName?: string;
  lastBackupDate?: string;
  parentCalls?: ParentCallSettings;
  voiceNotesEnabled?: boolean;
  studySettings?: StudySettings;
  englishSettings?: EnglishDailyGoalSettings;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  appName: string;
  students: Student[];
  studentNotes: StudentNote[];
  weeklyCallSessions?: WeeklyCallSession[];
  studyTasks?: StudyTask[];
  studyDayConfigs?: StudyDayConfig[];
  dayCheckins?: DayCheckin[];
  englishNotes?: EnglishNote[];
  englishDecks?: EnglishDeck[];
  englishCards?: EnglishCard[];
  englishLogs?: EnglishStudyReviewLog[];
  universityTerms?: UniversityTerm[];
  universityCourses?: UniversityCourse[];
  universityExams?: UniversityExam[];
  universityNotes?: UniversityNote[];
  universityAssignments?: UniversityAssignment[];
  projectIdeas?: ProjectIdea[];
  personalNotes?: PersonalNote[];
  personalTags?: PersonalNoteTag[];
  settings?: AppSettings;
}


