import React from 'react';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  Languages, 
  StickyNote, 
  Settings, 
  Search, 
  Sun, 
  Moon,
  Smartphone,
  WifiOff
} from 'lucide-react';
import { TabId } from './BottomNav';
import { AynotLogo } from './common/AynotLogo';
import { ThemeMode } from '../hooks/useTheme';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

export interface ModuleSettings {
  showSchool: boolean;
  showStudy: boolean;
  showEnglish: boolean;
  showNotes: boolean;
}

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  englishDueCount?: number;
  reviewBadge?: number;
  upcomingExamsBadge?: number;
  userName?: string;
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onOpenInstallGuide: () => void;
  moduleSettings?: ModuleSettings;
}

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  englishDueCount = 0,
  reviewBadge,
  upcomingExamsBadge = 0,
  userName = 'Zipidola',
  resolvedTheme,
  onToggleTheme,
  onOpenSearch,
  onOpenInstallGuide,
  moduleSettings = {
    showSchool: true,
    showStudy: true,
    showEnglish: true,
    showNotes: true,
  },
}) => {
  const isOnline = useOnlineStatus();
  const { isInstalled, isInstallable, install } = usePWAInstall();

  const badgeCount = reviewBadge !== undefined ? reviewBadge : englishDueCount;

  const allNavItems: NavItem[] = [
    { id: 'bugun', label: 'Bugün', icon: Calendar },
    { id: 'ogrenciler', label: 'Okul', icon: Users },
    { id: 'calisma', label: 'Çalışma', icon: BookOpen, badge: upcomingExamsBadge },
    { id: 'ingilizce', label: 'İngilizce', icon: Languages, badge: badgeCount },
    { id: 'notlar', label: 'Notlar', icon: StickyNote },
    { id: 'ayarlar', label: 'Ayarlar', icon: Settings },
  ];

  // Modül ayarlarına göre sekmeleri filtrele
  const navItems = allNavItems.filter((item) => {
    if (item.id === 'ogrenciler' && !moduleSettings.showSchool) return false;
    if (item.id === 'calisma' && !moduleSettings.showStudy) return false;
    if (item.id === 'ingilizce' && !moduleSettings.showEnglish) return false;
    if (item.id === 'notlar' && !moduleSettings.showNotes) return false;
    return true;
  });

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else {
      onOpenInstallGuide();
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 z-30 select-none transition-colors">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
        <AynotLogo size={36} showText={true} />

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 touch-manipulation"
          title="Arama yap"
          aria-label="Arama"
        >
          <Search className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
             onClick={() => {
              if (isActive) return;
                onTabChange(item.id);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 text-left active:scale-[0.98] ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {/* Badge */}
              {Boolean(item.badge && item.badge > 0) && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Offline indicator if any */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Çevrimdışı Mod</span>
          </div>
        )}

        {/* User Card & Theme Switcher */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div 
            onClick={() => onTabChange('ayarlar')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-600 transition">
                {userName}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                Aynot. v1.0
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Install Prompt (if not installed) */}
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition active:scale-95"
                title="Uygulamayı Yükle"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition active:scale-95"
              title={resolvedTheme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
