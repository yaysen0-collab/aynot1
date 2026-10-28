import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Download, 
  Upload, 
  Database, 
  ShieldCheck, 
  Smartphone, 
  Trash2, 
  Sparkles, 
  Check, 
  AlertCircle,
  PhoneCall,
  Bell,
  Calendar,
  ExternalLink,
  Clock,
  Info,
  Mic,
  BookOpen,
  Coffee,
  Languages,
  User,
  LogOut,
  Cloud,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from 'lucide-react';
import { ThemeMode } from '../../hooks/useTheme';
import { ErrorLogCard } from './ErrorLogCard';
import { getBuildLabel } from '../../utils/buildInfo';
import { exportDatabase, importDatabase, seedSampleData } from '../../db/indexedDb';
// Oturum açıksa hesabın bulut verisini, değilse yerel veriyi temizler
import { clearAllDatabase as clearAllRepositoryData } from '../../db/repository';
import { clearAllDatabase as clearLocalDatabase } from '../../db/indexedDb';
import { BackupData, ParentCallSettings, StudySettings, EnglishDailyGoalSettings } from '../../types';
import { DAY_NAMES_TR, downloadIcsFile, getGoogleCalendarUrl, requestNotificationPermission, toLocalISODate } from '../../utils/calendar';
import { ModalShell } from '../common/ModalShell';

export interface ModuleSettings {
  showSchool: boolean;
  showStudy: boolean;
  showEnglish: boolean;
  showNotes: boolean;
}

interface SettingsViewProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  parentCallSettings: ParentCallSettings;
  onSaveParentCallSettings: (settings: ParentCallSettings) => Promise<void>;
  studySettings?: StudySettings;
  onSaveStudySettings?: (settings: StudySettings) => Promise<void>;
  englishSettings?: EnglishDailyGoalSettings;
  onSaveEnglishSettings?: (settings: EnglishDailyGoalSettings) => Promise<void>;
  moduleSettings?: ModuleSettings;
  onSaveModuleSettings?: (settings: ModuleSettings) => Promise<void>;
  stats: {
    studentsCount: number;
    notesCount: number;
    photosCount: number;
    alertStudentsCount: number;
    totalCallsCount?: number;
    totalStudyTasksCount?: number;
    englishCardsCount?: number;
    englishNotesCount?: number;
  };
  onRefreshData: () => Promise<void>;
  onOpenInstallGuide: () => void;
  voiceNotesEnabled?: boolean;
  onToggleVoiceNotes?: (enabled: boolean) => Promise<void>;
  userName?: string;
  onSaveUserName?: (name: string) => Promise<void>;
  user?: { email?: string | null; displayName?: string | null; uid: string } | null;
  onLogout?: () => Promise<void>;
  onClearLocalData?: () => Promise<void>;
  onImportCloudBackup?: (backup: BackupData, mode: 'merge' | 'overwrite') => Promise<void>;
  onExportCloudBackup?: () => Promise<BackupData>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onThemeChange,
  parentCallSettings,
  onSaveParentCallSettings,
  studySettings = {
    pomodoroWorkMinutes: 25,
    pomodoroBreakMinutes: 5,
    eveningCheckinHour: 18,
    alwaysSuggestLightOnFatigue: true,
  },
  onSaveStudySettings,
  englishSettings = {
    dailyNewWordGoal: 5,
    dailyReviewLimit: 20,
    reduceGoalOnFatigue: true,
  },
  onSaveEnglishSettings,
  moduleSettings = {
    showSchool: true,
    showStudy: true,
    showEnglish: true,
    showNotes: true,
  },
  onSaveModuleSettings,
  stats,
  onRefreshData,
  onOpenInstallGuide,
  voiceNotesEnabled = true,
  onToggleVoiceNotes,
  userName = 'Zipidola',
  onSaveUserName,
  user = null,
  onLogout,
  onClearLocalData,
  onImportCloudBackup,
  onExportCloudBackup,
}) => {
  const [userNameInput, setUserNameInput] = useState(userName || 'Zipidola');
  const [savingUserName, setSavingUserName] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showClearLocalModal, setShowClearLocalModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [showFirebaseHelp, setShowFirebaseHelp] = useState(false);
  const [isClearingLocal, setIsClearingLocal] = useState(false);

  // Parent Call Settings local state
  const [callDay, setCallDay] = useState(parentCallSettings.callDay);
  const [callTime, setCallTime] = useState(parentCallSettings.callTime);
  const [reminderEnabled, setReminderEnabled] = useState(parentCallSettings.reminderEnabled);
  const [savingCallSettings, setSavingCallSettings] = useState(false);

  // Study Settings state
  const [pomodoroWork, setPomodoroWork] = useState(studySettings.pomodoroWorkMinutes || 25);
  const [pomodoroBreak, setPomodoroBreak] = useState(studySettings.pomodoroBreakMinutes || 5);
  const [checkinHour, setCheckinHour] = useState(studySettings.eveningCheckinHour || 18);
  const [suggestLightOnFatigue, setSuggestLightOnFatigue] = useState(studySettings.alwaysSuggestLightOnFatigue ?? true);

  // English Settings state
  const [englishGoal, setEnglishGoal] = useState(englishSettings.dailyNewWordGoal || 5);
  const [englishReviewLimit, setEnglishReviewLimit] = useState(englishSettings.dailyReviewLimit || 20);
  const [reduceGoalOnFatigue, setReduceGoalOnFatigue] = useState(englishSettings.reduceGoalOnFatigue ?? true);

  // Module Settings state
  const [modSchool, setModSchool] = useState(moduleSettings.showSchool);
  const [modStudy, setModStudy] = useState(moduleSettings.showStudy);
  const [modEnglish, setModEnglish] = useState(moduleSettings.showEnglish);
  const [modNotes, setModNotes] = useState(moduleSettings.showNotes);

  useEffect(() => {
    setModSchool(moduleSettings.showSchool);
    setModStudy(moduleSettings.showStudy);
    setModEnglish(moduleSettings.showEnglish);
    setModNotes(moduleSettings.showNotes);
  }, [moduleSettings]);

  const handleToggleModule = async (key: keyof ModuleSettings, value: boolean) => {
    const newSettings = {
      showSchool: modSchool,
      showStudy: modStudy,
      showEnglish: modEnglish,
      showNotes: modNotes,
      [key]: value
    };
    
    if (key === 'showSchool') setModSchool(value);
    if (key === 'showStudy') setModStudy(value);
    if (key === 'showEnglish') setModEnglish(value);
    if (key === 'showNotes') setModNotes(value);

    if (onSaveModuleSettings) {
      try {
        await onSaveModuleSettings(newSettings);
        setStatusMessage({ text: 'Sekme ayarları başarıyla güncellendi.', type: 'success' });
      } catch (err: unknown) {
        setStatusMessage({ text: 'Ayar kaydedilemedi.', type: 'error' });
      }
    }
  };

  const handleSaveUserName = async () => {
    if (!onSaveUserName) return;
    setSavingUserName(true);
    try {
      await onSaveUserName(userNameInput.trim() || 'Zipidola');
      setStatusMessage({
        text: 'Kullanıcı ismi başarıyla kaydedildi.',
        type: 'success',
      });
    } catch {
      setStatusMessage({
        text: 'Kullanıcı ismi kaydedilemedi.',
        type: 'error',
      });
    } finally {
      setSavingUserName(false);
    }
  };

  const handleSaveEnglish = async (
    goal = englishGoal,
    limit = englishReviewLimit,
    reduce = reduceGoalOnFatigue
  ) => {
    if (!onSaveEnglishSettings) return;
    try {
      await onSaveEnglishSettings({
        dailyNewWordGoal: goal,
        dailyReviewLimit: limit,
        reduceGoalOnFatigue: reduce,
      });
      setStatusMessage({
        text: 'İngilizce çalışma hedefleri kaydedildi.',
        type: 'success',
      });
    } catch {
      setStatusMessage({
        text: 'İngilizce hedefleri kaydedilemedi.',
        type: 'error',
      });
    }
  };

  const handleSaveStudy = async (work = pomodoroWork, brk = pomodoroBreak, hour = checkinHour, light = suggestLightOnFatigue) => {
    if (!onSaveStudySettings) return;
    try {
      const updated: StudySettings = {
        pomodoroWorkMinutes: work,
        pomodoroBreakMinutes: brk,
        eveningCheckinHour: hour,
        alwaysSuggestLightOnFatigue: light,
      };
      await onSaveStudySettings(updated);
      setStatusMessage({
        text: 'Çalışma ve yorgunluk modu ayarları güncellendi.',
        type: 'success',
      });
    } catch (err: unknown) {
      setStatusMessage({
        text: 'Ayarlar kaydedilemedi: ' + (err instanceof Error ? err.message : ''),
        type: 'error',
      });
    }
  };

  // Notification permission state
  const [notificationStatus, setNotificationStatus] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'unsupported';
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle saving parent call settings
  const handleSaveCallSettings = async (newDay = callDay, newTime = callTime, newReminder = reminderEnabled) => {
    try {
      setSavingCallSettings(true);
      const newSettings: ParentCallSettings = {
        callDay: newDay,
        callTime: newTime,
        reminderEnabled: newReminder,
      };
      await onSaveParentCallSettings(newSettings);
      setStatusMessage({
        text: 'Veli aramaları ayarları başarıyla güncellendi.',
        type: 'success',
      });
    } catch (err: unknown) {
      setStatusMessage({
        text: 'Arama ayarları kaydedilemedi: ' + (err instanceof Error ? err.message : ''),
        type: 'error',
      });
    } finally {
      setSavingCallSettings(false);
    }
  };

  const handleRequestNotification = async () => {
    const res = await requestNotificationPermission();
    setNotificationStatus(res);
    if (res === 'granted') {
      setStatusMessage({
        text: 'Bildirim izni başarıyla verildi! Cuma günleri uygulama açık olduğunda hatırlatma yapılacaktır.',
        type: 'success',
      });
    } else if (res === 'denied') {
      setStatusMessage({
        text: 'Bildirim izni reddedildi. Tarayıcı ayarlarından izin verebilir veya Takvim (.ics) yöntemini kullanabilirsiniz.',
        type: 'error',
      });
    }
  };

  // Export JSON backup file
  const handleExport = async () => {
    try {
      setExporting(true);
      const data: BackupData = onExportCloudBackup 
        ? await onExportCloudBackup() 
        : await exportDatabase();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const nowStr = toLocalISODate();
      link.href = url;
      link.download = `aynot_yedek_${nowStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({
        text: 'Yedek dosyası başarıyla indirildi. Dosyayı güvenli bir yerde saklayabilirsiniz.',
        type: 'success',
      });
    } catch (err: unknown) {
      setStatusMessage({
        text: 'Yedekleme sırasında bir hata oluştu: ' + (err instanceof Error ? err.message : ''),
        type: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  // Import JSON backup file
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupData;
      setPendingBackup(parsed);
      setShowConflictModal(true);
    } catch (err: unknown) {
      setStatusMessage({
        text: 'Yedek dosyası açılamadı: ' + (err instanceof Error ? err.message : 'Geçersiz JSON formatı'),
        type: 'error',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async (mode: 'overwrite' | 'merge') => {
    if (!pendingBackup) return;
    try {
      setImporting(true);
      if (onImportCloudBackup) {
        await onImportCloudBackup(pendingBackup, mode);
      } else {
        await importDatabase(pendingBackup, mode);
      }
      await onRefreshData();

      setStatusMessage({
        text: `Yedek ${mode === 'overwrite' ? 'üzerine yazılarak' : 'mevcut verilerle birleştirilerek'} başarıyla yüklendi!`,
        type: 'success',
      });
    } catch (err: unknown) {
      setStatusMessage({
        text: 'İçe aktarma sırasında hata oluştu: ' + (err instanceof Error ? err.message : ''),
        type: 'error',
      });
    } finally {
      setImporting(false);
      setShowConflictModal(false);
      setPendingBackup(null);
    }
  };

  const handleConfirmClearLocal = async () => {
    try {
      setIsClearingLocal(true);
      if (onClearLocalData) {
        await onClearLocalData();
      } else {
        await clearLocalDatabase();
      }
      await onRefreshData();
      setStatusMessage({
        text: 'Bu cihazdaki yerel çevrimdışı kopya temizlendi. Buluttaki verileriniz güvendedir.',
        type: 'success',
      });
    } catch (err: unknown) {
      setStatusMessage({
        text: 'Yerel veriler temizlenirken hata oluştu: ' + (err instanceof Error ? err.message : ''),
        type: 'error',
      });
    } finally {
      setIsClearingLocal(false);
      setShowClearLocalModal(false);
    }
  };

  // Seed sample demo data
  const handleSeedData = async () => {
    try {
      await seedSampleData();
      await onRefreshData();
      setStatusMessage({
        text: 'Örnek veriler başarıyla yüklendi! Öğrenciler ve İngilizce sekmelerinden inceleyebilirsiniz.',
        type: 'success',
      });
    } catch (err: unknown) {
      setStatusMessage({
        text: 'Örnek veri yüklenirken hata oluştu: ' + (err instanceof Error ? err.message : ''),
        type: 'error',
      });
    }
  };

  // Clear all data
  const handleConfirmClearAll = async () => {
    try {
      await clearAllRepositoryData();
      await onRefreshData();
      setStatusMessage({
        text: user ? 'Hesabınızdaki tüm veriler silindi.' : 'Tüm veriler cihazdan temizlendi.',
        type: 'success',
      });
    } catch (err: unknown) {
      setStatusMessage({
        text: 'Veriler silinirken hata oluştu: ' + (err instanceof Error ? err.message : ''),
        type: 'error',
      });
    } finally {
      setShowClearConfirmModal(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Uygulama Ayarları
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Görünüm, veli aramaları, takvim entegrasyonu ve veri yedekleme
        </p>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 border animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[11px] font-semibold underline px-1"
          >
            Tamam
          </button>
        </div>
      )}

      {/* 0. HESAP & BULUT SENKRONİZASYONU */}
      {user && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/40 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-base">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{user.displayName || userName || 'Kullanıcı'}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Bulut Aktif
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {user.email || 'Google Hesabı'}
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition active:scale-95 border border-rose-200/60 dark:border-rose-900"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Çıkış Yap</span>
              </button>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 flex items-start gap-2.5 text-xs text-sky-800 dark:text-sky-300">
            <Cloud className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
            <span>
              Tüm verileriniz güvenle bulutta saklanır ve gerçek zamanlı olarak eşitlenir.
            </span>
          </div>
        </div>
      )}

      {/* 0. KULLANICI PROFİLİ & KARŞILAMA İSMİ */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Kullanıcı İsmi & Karşılama
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bugün ekranındaki selamlama ve hitap ismi (Varsayılan: Zipidola)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <input
            type="text"
            value={userNameInput}
            onChange={(e) => setUserNameInput(e.target.value)}
            placeholder="İsminiz (Örn: Zipidola)"
            className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="button"
            onClick={handleSaveUserName}
            disabled={savingUserName || !userNameInput.trim()}
            className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition active:scale-95 touch-manipulation"
          >
            {savingUserName ? 'Kaydediliyor...' : 'İsmi Kaydet'}
          </button>
        </div>
      </div>

      {/* 1. VELİ ARAMALARI AYARLARI (Cuma Arama Saati & Günü) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Veli Aramaları Ayarları
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Arama günü, saati ve hatırlatıcı tercihleri
            </p>
          </div>
        </div>

        {/* Day & Time Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Arama Günü (Varsayılan: Cuma)</span>
            </label>
            <select
              value={callDay}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setCallDay(val);
                handleSaveCallSettings(val, callTime, reminderEnabled);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              {DAY_NAMES_TR.map((name, idx) => (
                <option key={name} value={idx}>
                  {name} {idx === 5 ? '(Önerilen)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Arama Saati</span>
            </label>
            <input
              type="time"
              value={callTime}
              onChange={(e) => {
                const val = e.target.value;
                setCallTime(val);
                handleSaveCallSettings(callDay, val, reminderEnabled);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
        </div>

        {/* Reminder Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Arama Hatırlatması
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Gününde arama saati gelince bildirim gelsin
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                setReminderEnabled(checked);
                handleSaveCallSettings(callDay, callTime, checked);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Web Notification Permission Button */}
        {reminderEnabled && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">
              Tarayıcı Bildirim İzni:{' '}
              <strong className={notificationStatus === 'granted' ? 'text-teal-600' : 'text-amber-600'}>
                {notificationStatus === 'granted'
                  ? 'İzin Verildi ✓'
                  : notificationStatus === 'denied'
                  ? 'Engellendi ✗'
                  : 'İzin İstenmedi'}
              </strong>
            </span>
            {notificationStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestNotification}
                className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold active:scale-95 transition"
              >
                İzin İste
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. TAKVİM ENTEGRASYONU & GÜVENİLİR HATIRLATMA (Google Takvim & .ics) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Takvim Entegrasyonu & Kesin Hatırlatıcı
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Telefon takvimine (Google / Apple / Outlook) tek tıkla ekleme
            </p>
          </div>
        </div>

        {/* Clear & Honest Platform Notification Explanation */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Mobil Bildirimler Hakkında Önemli Bilgi:</span>
          </div>
          <p>
            Web tarayıcı bildirimleri, telefon kilitliyken veya uygulama tamamen kapalıyken (özellikle iOS / iPhone'da ve Android pil tasarrufu modlarında) sistem tarafından durdurulabilir. 
            Bu nedenle veli aramalarını hiç kaçırmamak için <strong>aşağıdaki takvim butonlarıyla telefonunuzun takvimine eklemeniz en güvenilir ve garantili ana hatırlatma yöntemidir</strong>.
          </p>
        </div>

        {/* Action Buttons for Calendar Integration */}
        <div className="space-y-2 pt-1">
          {/* Button 1: Google Takvim Direct Link */}
          <a
            href={getGoogleCalendarUrl(callDay, callTime)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 text-center"
          >
            <Calendar className="w-4 h-4" />
            <span>Google Takvim'e Haftalık Tekrarlı Ekle</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          {/* Button 2: Repeating .ics file download */}
          <button
            onClick={() => downloadIcsFile(callDay, callTime)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-95"
          >
            <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Apple Takvim / Telefon Takvimi İçin .ics İndir</span>
          </button>
        </div>

        {/* Step-by-step guidance for .ics file */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            📌 .ics Dosyası Nasıl Kurulur?
          </div>
          <p>
            1. ".ics İndir" butonuna dokunup dosyayı indirin.<br />
            2. İndirilen dosyaya dokunun; iPhone "Takvime Ekle", Android ise varsayılan takvim uygulamanız ile açacaktır.<br />
            3. Her {DAY_NAMES_TR[callDay]} saat {callTime} için otomatik 15 dakika önceden sesli alarm kurulacaktır.
          </p>
        </div>
      </div>

      {/* 3. SESLE NOT ALMA TERCİHLERİ & GİZLİLİK */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Sesle Not Alma Tercihleri
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Türkçe (tr-TR) konuşma tanıma ve mikrofon ayarları
            </p>
          </div>
        </div>

        {/* Toggle Voice Notes */}
        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Sesle Not Alma Butonları
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Öğrenci notları ve veli görüşmelerindeki mikrofon butonlarını göster
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={voiceNotesEnabled}
              onChange={(e) => {
                if (onToggleVoiceNotes) {
                  onToggleVoiceNotes(e.target.checked);
                }
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        {/* Supported voice commands */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span>🗣️ Türkçe Sesli Noktalama Komutları:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">"nokta"</code>
              <span>→ Nokta (.) ve büyük harf</span>
            </div>
            <div className="flex items-center gap-1.5">
              <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">"virgül"</code>
              <span>→ Virgül (,)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">"soru işareti"</code>
              <span>→ Soru işareti (?)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">"yeni satır"</code>
              <span>→ Alt satıra geçer (\n)</span>
            </div>
          </div>
        </div>

        {/* Servis Bilgisi */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Sesle Yazma Servis Bilgisi:</span>
          </div>
          <p>
            Sesle yazma, tarayıcınızın konuşma tanıma servisini kullanır (Google / Apple). Tarayıcıya ve cihaza göre ses kaydı metne dönüştürülmek üzere o servise geçici olarak gönderilebilir. İstemediğiniz takdirde yukarıdaki anahtardan bu özelliği tamamen kapatabilirsiniz.
          </p>
        </div>
      </div>

      {/* 4. ÇALIŞMA PLANI, SAYAÇ VE YORGUNLUK MODU AYARLARI */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Çalışma Planı & Yorgunluk Modu Ayarları
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pomodoro sayaç süreleri ve akşam değerlendirme saati
            </p>
          </div>
        </div>

        {/* Pomodoro Durations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pomodoro Çalışma Süresi (dk)</span>
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={pomodoroWork}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 25;
                setPomodoroWork(val);
                handleSaveStudy(val, pomodoroBreak, checkinHour, suggestLightOnFatigue);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mola Süresi (dk)</span>
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={pomodoroBreak}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 5;
                setPomodoroBreak(val);
                handleSaveStudy(pomodoroWork, val, checkinHour, suggestLightOnFatigue);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>

        {/* Evening Checkin Hour */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Akşam "Bugün Nasıldı?" Sorusu Saati</span>
          </label>
          <select
            value={checkinHour}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setCheckinHour(val);
              handleSaveStudy(pomodoroWork, pomodoroBreak, val, suggestLightOnFatigue);
            }}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value={16}>16:00 (İkindi)</option>
            <option value={17}>17:00 (Okul Çıkışı)</option>
            <option value={18}>18:00 (Akşam Başlangıcı - Önerilen)</option>
            <option value={19}>19:00 (Akşam Yemeği)</option>
            <option value={20}>20:00 (Gece)</option>
          </select>
        </div>

        {/* Fatigue Mode light plan toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Yorucu Günlerde Hafif Plan Önerisi
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              "Yorucu" seçildiğinde kalan görevleri otomatik küçültme önerilerini aç
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={suggestLightOnFatigue}
              onChange={(e) => {
                const checked = e.target.checked;
                setSuggestLightOnFatigue(checked);
                handleSaveStudy(pomodoroWork, pomodoroBreak, checkinHour, checked);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      {/* 4.5. İNGİLİZCE BÖLÜMÜ AYARLARI */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              İngilizce Kelime & Tekrar Hedefleri
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Günlük yeni kelime hedefi ve aralıklı tekrar limitleri
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <span>Günlük Yeni Kelime Hedefi (Varsayılan: 5)</span>
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={englishGoal}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 5;
                setEnglishGoal(val);
                handleSaveEnglish(val, englishReviewLimit, reduceGoalOnFatigue);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <span>Günlük Maksimum Tekrar Limiti</span>
            </label>
            <input
              type="number"
              min="5"
              max="200"
              value={englishReviewLimit}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 20;
                setEnglishReviewLimit(val);
                handleSaveEnglish(englishGoal, val, reduceGoalOnFatigue);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>
        </div>

        {/* Fatigue Mode: Halve goal toggle */}
        <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/50 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Yorgun Günlerde Hedefi Yarıya İndir
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              "Bugün nasıldı?" sorusunda Yorucu seçildiğinde kelime hedefini nazikçe hafifletir
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={reduceGoalOnFatigue}
              onChange={(e) => {
                const checked = e.target.checked;
                setReduceGoalOnFatigue(checked);
                handleSaveEnglish(englishGoal, englishReviewLimit, checked);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
          </label>
        </div>
      </div>

      {/* 5. UYGULAMA MODÜLLERİ (SEKMELER) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Kullanılacak Sekmeler
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              İhtiyacınız olmayan menüleri gizleyerek arayüzü sadeleştirin
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {/* Okul Modülü */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Okul & Veliler</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Öğrenciler, notlar ve veli aramaları</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={modSchool} onChange={(e) => handleToggleModule('showSchool', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Çalışma Modülü */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Çalışma Planı & Sınavlar</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Görevler, pomodoro ve üniversite</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={modStudy} onChange={(e) => handleToggleModule('showStudy', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          {/* İngilizce Modülü */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">İngilizce</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Kelime kartları ve aralıklı tekrar</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={modEnglish} onChange={(e) => handleToggleModule('showEnglish', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>

          {/* Notlar Modülü */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Notlar & Fikirler</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Kişisel notlar ve proje fikirleri</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={modNotes} onChange={(e) => handleToggleModule('showNotes', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 6. TEMA SEÇİMİ */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Görünüm & Tema
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gözü yormayan sakin renk paleti
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => onThemeChange('light')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition active:scale-95 touch-manipulation ${
              theme === 'light'
                ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20 font-semibold'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs">Açık</span>
          </button>

          <button
            onClick={() => onThemeChange('dark')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition active:scale-95 touch-manipulation ${
              theme === 'dark'
                ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20 font-semibold'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs">Koyu</span>
          </button>

          <button
            onClick={() => onThemeChange('system')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition active:scale-95 touch-manipulation ${
              theme === 'system'
                ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20 font-semibold'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Monitor className="w-5 h-5 text-slate-500" />
            <span className="text-xs">Sistem</span>
          </button>
        </div>
      </div>

      {/* 7. VERİ YEDEKLEME & DIŞA/İÇE AKTARMA */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Veri Yedekleme ve Taşıma
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Öğrenciler, notlar ve arama kayıtlarını JSON olarak indirin
            </p>
          </div>
        </div>

        {/* Current Database Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
            <div className="text-xs text-slate-400">Öğrenci</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100">{stats.studentsCount}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
            <div className="text-xs text-slate-400">Not</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100">{stats.notesCount}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
            <div className="text-xs text-slate-400">Kelime Kartı</div>
            <div className="text-base font-bold text-sky-600 dark:text-sky-400">{stats.englishCardsCount || 0}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
            <div className="text-xs text-slate-400">İngilizce Not</div>
            <div className="text-base font-bold text-sky-600 dark:text-sky-400">{stats.englishNotesCount || 0}</div>
          </div>
        </div>

        {/* Action Buttons: Export & Import */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50 touch-manipulation"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Yedekleniyor...' : 'Tüm Veriyi Yedekle (.json)'}</span>
          </button>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
              id="import-backup-input"
            />
            <label
              htmlFor="import-backup-input"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition active:scale-95 touch-manipulation text-center"
            >
              <Upload className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{importing ? 'Yükleniyor...' : 'Yedekten Geri Yükle'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* 8. YÖNETİM VE SIFIRLAMA */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Yönetim & Sıfırlama
        </h4>

        <div className="flex flex-col sm:flex-row gap-2">
          {!user && stats.studentsCount === 0 && (
            <button
              onClick={handleSeedData}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-teal-100 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Örnek Verileri Yükle</span>
            </button>
          )}

          <button
            onClick={() => setShowClearLocalModal(true)}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-amber-100 transition active:scale-95"
          >
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span>Yerel Verileri Temizle</span>
          </button>

          <button
            onClick={() => setShowClearConfirmModal(true)}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-rose-100 transition active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tüm Verileri Temizle</span>
          </button>
        </div>
      </div>

      {/* 9. FIREBASE KURULUM REHBERİ */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
        <button
          type="button"
          onClick={() => setShowFirebaseHelp(!showFirebaseHelp)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Firebase Konsol Kurulum Rehberi
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Giriş yöntemleri ve yetkili alan adı kontrol listesi
              </p>
            </div>
          </div>
          {showFirebaseHelp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showFirebaseHelp && (
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Google Girişi:</strong> Firebase Console &gt; Authentication &gt; Sign-in method sekmesinden "Google" sağlayıcısını etkinleştirin ve destek e-postanızı seçip kaydedin.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">E-posta/Şifre Girişi:</strong> Firebase Console &gt; Authentication &gt; Sign-in method sekmesinden "Email/Password" seçeneğini etkinleştirin.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Yetkili Alan Adı (Authorized Domains):</strong> Authentication &gt; Settings &gt; Authorized domains bölümüne uygulamanızın çalıştığı alan adını ekleyin.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold flex items-center justify-center shrink-0 text-[10px]">✓</span>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Firestore Kuralları:</strong> Sıfır-güven (zero-trust) güvenlik kuralları başarıyla dağıtıldı. Her kullanıcı yalnızca kendi verilerine erişebilir.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 10. UYGULAMA HAKKINDA */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 text-xs font-bold">
          <Info className="w-4 h-4 text-teal-600" />
          <span>Aynot. Hakkında</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Aynot. — Kişisel takip, okul notları ve çalışma asistanı.
        </p>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
          Sürüm: Aynot. v1.0 • PWA • Derleme: {getBuildLabel()}
        </div>
      </div>

      {/* 11. HATA KAYITLARI */}
      <ErrorLogCard />

      {/* MODAL 1: İÇE AKTARMA ÇAKIŞMA YÖNETİMİ MODALİ */}
      {showConflictModal && pendingBackup && (
        <ModalShell
          onClose={() => {
            setShowConflictModal(false);
            setPendingBackup(null);
          }}
          maxWidthClass="max-w-md"
          dismissible={!importing}
        >
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Yedek Dosyası İçe Aktarma
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mevcut verilerinizle nasıl işlensin?
                </p>
              </div>
            </div>

            <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Dosya İçeriği:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-slate-600 dark:text-slate-300">
                  <div>👥 {pendingBackup.students?.length || 0} Öğrenci</div>
                  <div>📝 {pendingBackup.studentNotes?.length || 0} Öğrenci Notu</div>
                  <div>🎓 {pendingBackup.universityCourses?.length || 0} Üniversite Dersi</div>
                  <div>📅 {pendingBackup.universityExams?.length || 0} Sınav</div>
                  <div>📑 {pendingBackup.universityNotes?.length || 0} Ders Notu</div>
                  <div>💡 {pendingBackup.projectIdeas?.length || 0} Fikir & Proje</div>
                  <div>📌 {pendingBackup.personalNotes?.length || 0} Kişisel Not</div>
                  <div>🏷️ {pendingBackup.personalTags?.length || 0} Etiket</div>
                  <div>🔤 {pendingBackup.englishCards?.length || 0} Kelime</div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => handleConfirmImport('merge')}
                  className="w-full p-3.5 rounded-2xl border border-teal-300 dark:border-teal-750 bg-teal-50/60 dark:bg-teal-950/40 hover:bg-teal-100/60 text-left transition active:scale-98"
                >
                  <div className="font-bold text-teal-900 dark:text-teal-200 flex items-center justify-between">
                    <span>Mevcut Verilerle Birleştir (Önerilen)</span>
                    <span className="text-xs">🛡️</span>
                  </div>
                  <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-1">
                    Cihazınızdaki mevcut veriler silinmez. Yedek dosyasındaki yeni öğrenciler ve kartlar eklenir.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={importing}
                  onClick={() => handleConfirmImport('overwrite')}
                  className="w-full p-3.5 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/50 text-left transition active:scale-98"
                >
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                    <span>Mevcutların Üzerine Yaz</span>
                    <span className="text-xs">⚠️</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                    Mevcut veriler temizlenir ve sistem tamamen bu yedek dosyasının haliyle değiştirilir.
                  </p>
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowConflictModal(false);
                  setPendingBackup(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                İptal Et
              </button>
            </div>
        </ModalShell>
      )}

      {/* MODAL 2: TÜM VERİLERİ SİLME ONAY MODALİ */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900 overflow-hidden animate-in zoom-in-95 duration-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tüm Verileri Temizle
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  Bu işlem geri alınamaz
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {user ? 'Hesabınıza kayıtlı (buluttaki) tüm öğrenci kayıtları, veli aramaları, ders programı, İngilizce kartları ve notlar tüm cihazlarınızdan kalıcı olarak silinecektir. Bu işlem geri alınamaz.' : 'Cihazınızdaki tüm öğrenci kayıtları, veli aramaları, ders programı ve İngilizce kelime kartları kalıcı olarak silinecektir.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition active:scale-95 shadow-sm"
              >
                Evet, Hepsini Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: YEREL VERİLERİ TEMİZLEME ONAY MODALİ */}
      {showClearLocalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-200 dark:border-amber-900 overflow-hidden animate-in zoom-in-95 duration-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Yerel Verileri Temizle
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  Yalnızca bu cihazdaki çevrimdışı kopya silinir
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Bu işlem cihazınızdaki eski IndexedDB verilerini temizler. Bulut hesabınızdaki veriler güvenle korunur ve silinmez.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isClearingLocal}
                onClick={() => setShowClearLocalModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isClearingLocal}
                onClick={handleConfirmClearLocal}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition active:scale-95 shadow-sm disabled:opacity-50"
              >
                {isClearingLocal ? 'Temizleniyor...' : 'Evet, Yerel Verileri Temizle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ÇIKIŞ YAP ONAY MODALİ */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Çıkış Yap
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hesabınızdan çıkış yapmak istediğinize emin misiniz?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowLogoutConfirmModal(false);
                  if (onLogout) await onLogout();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition active:scale-95 shadow-sm"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
