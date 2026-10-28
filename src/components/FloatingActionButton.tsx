import React, { useState } from 'react';
import { Plus, Edit3, Lightbulb, StickyNote } from 'lucide-react';
import type { ModuleSettings } from './BottomNav';

interface FloatingActionButtonProps {
  onQuickNote: () => void;
  onQuickIdea?: () => void;
  onQuickPersonalNote?: () => void;
  moduleSettings?: ModuleSettings;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onQuickNote,
  onQuickIdea,
  onQuickPersonalNote,
  moduleSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Kapalı modüllerin seçenekleri menüde görünmez (Ayarlar → Modüller)
  const showSchool = moduleSettings?.showSchool ?? true;
  const showNotes = moduleSettings?.showNotes ?? true;

  // Gösterilecek hiç seçenek yoksa düğme de çizilmez
  const hasNotesActions = showNotes && (onQuickPersonalNote || onQuickIdea);
  if (!showSchool && !hasNotesActions) {
    return null;
  }

  const handleQuickNote = () => {
    setIsOpen(false);
    onQuickNote();
  };

  const handleQuickPersonalNote = () => {
    setIsOpen(false);
    if (onQuickPersonalNote) {
      onQuickPersonalNote();
    } else {
      onQuickNote();
    }
  };

  const handleQuickIdea = () => {
    setIsOpen(false);
    if (onQuickIdea) {
      onQuickIdea();
    }
  };

  return (
    <div className="fixed bottom-[calc(4.75rem+16px+env(safe-area-inset-bottom,0px))] right-4 md:bottom-8 md:right-8 z-40 flex flex-col items-end pointer-events-none">
      {/* Backdrop overlay when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-30 transition-opacity pointer-events-auto"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Expanded Actions */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2.5 mb-3 z-40 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
          {/* Hızlı Not (Kişisel Not) Butonu */}
          {showNotes && onQuickPersonalNote && (
            <button
              onClick={handleQuickPersonalNote}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg active:scale-95 transition text-sm font-semibold touch-manipulation"
            >
              <span className="text-xs font-semibold">Kişisel Not</span>
              <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center">
                <StickyNote className="w-4 h-4" />
              </div>
            </button>
          )}

          {/* Hızlı Fikir Ekleme Butonu */}
          {showNotes && onQuickIdea && (
            <button
              onClick={handleQuickIdea}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg active:scale-95 transition text-sm font-semibold touch-manipulation"
            >
              <span className="text-xs font-semibold">Fikir</span>
              <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
            </button>
          )}

          {showSchool && (
            <button
              onClick={handleQuickNote}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg active:scale-95 transition text-sm font-medium touch-manipulation"
            >
              <span className="text-xs font-semibold">Okul Notu</span>
              <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
            </button>
          )}
        </div>
      )}

      {/* Main floating "+" button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 active:scale-90 z-40 touch-manipulation pointer-events-auto ${
          isOpen
            ? 'bg-slate-800 dark:bg-slate-700 text-white rotate-45'
            : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-900/20 hover:shadow-teal-900/30'
        }`}
        aria-label="Hızlı İşlem Ekle"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>
    </div>
  );
};
