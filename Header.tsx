import React from 'react';
import { Search, Moon, Sun, Smartphone, WifiOff, Settings } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

import { AynotLogo } from './common/AynotLogo';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenInstallGuide: () => void;
  onOpenSettings?: () => void;
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenInstallGuide,
  onOpenSettings,
  resolvedTheme,
  onToggleTheme,
  activeTab,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstalled, isInstallable, isIOS, install } = usePWAInstall();

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else {
      onOpenInstallGuide();
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-[1100px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* App Logo & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <AynotLogo size={34} showText={true} />
          {!isOnline && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-md font-medium ml-1">
              <WifiOff className="w-3 h-3" /> Çevrimdışı
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition text-sm font-medium touch-manipulation"
            aria-label="Arama yap"
          >
            <Search className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">Ara...</span>
          </button>

          {/* Quick Install Prompt (if not installed) */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 dark:text-teal-300 transition text-xs font-medium flex items-center gap-1.5 active:scale-95 touch-manipulation"
              title="Telefona veya Masaüstüne Yükle"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">Yükle</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition touch-manipulation"
            aria-label="Temayı değiştir"
            title={resolvedTheme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`p-2.5 rounded-xl transition touch-manipulation active:scale-95 ${
                activeTab === 'ayarlar'
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-label="Ayarlar"
              title="Ayarlar ve Yedekleme"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
