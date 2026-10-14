import React from 'react';
import { Calendar, Users, BookOpen, Languages, Settings, GraduationCap, Lightbulb, StickyNote } from 'lucide-react';

export type TabId = 'bugun' | 'ogrenciler' | 'calisma' | 'universite' | 'fikirler' | 'notlar' | 'ingilizce' | 'ayarlar';

export interface TabItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_TABS: TabItem[] = [
  { id: 'bugun', label: 'Bugün', icon: Calendar },
  { id: 'ogrenciler', label: 'Okul', icon: Users },
  { id: 'calisma', label: 'Çalışma', icon: BookOpen },
  { id: 'ingilizce', label: 'İngilizce', icon: Languages },
  { id: 'notlar', label: 'Notlar', icon: StickyNote },
];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  englishDueCount?: number;
  reviewBadge?: number;
  upcomingExamsBadge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  onTabChange, 
  englishDueCount, 
  reviewBadge,
  upcomingExamsBadge = 0
}) => {
  const badgeCount = reviewBadge !== undefined ? reviewBadge : (englishDueCount || 0);
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-950/5 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-1.5 transition-colors">
      <div className="max-w-md mx-auto px-1 flex items-center justify-around">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isEnglish = tab.id === 'ingilizce';
          const isCalisma = tab.id === 'calisma';

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-2xl transition-all duration-200 touch-manipulation select-none active:scale-95 ${
                isActive
                  ? 'text-teal-700 dark:text-teal-300 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-teal-100 dark:bg-teal-950/70 scale-105'
                    : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />

                {/* English Due Badge */}
                {isEnglish && badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[16px] h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}

                {/* Çalışma / Sınavlar Badge */}
                {isCalisma && upcomingExamsBadge > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[16px] h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                    {upcomingExamsBadge > 99 ? '99+' : upcomingExamsBadge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] sm:text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
