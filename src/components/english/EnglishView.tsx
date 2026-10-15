import React, { useState, useMemo } from 'react';
import { 
  Languages, 
  Plus, 
  Sparkles, 
  Layers, 
  Play, 
  RotateCw, 
  BookOpen, 
  Search, 
  Tag, 
  Volume2, 
  Edit3, 
  Trash2, 
  Flame, 
  CheckCircle2, 
  TrendingUp, 
  FileText,
  Calendar,
  CreditCard,
  Target,
  BarChart3
} from 'lucide-react';
import { 
  EnglishNote, 
  EnglishDeck, 
  EnglishCard, 
  EnglishStudyReviewLog, 
  EnglishDailyGoalSettings,
  EnglishNoteTag,
  SpacedRepetitionRating
} from '../../types';
import { speakEnglish, isCardDueToday } from '../../utils/englishUtils';
import { FlashcardManagerModal } from './FlashcardManagerModal';
import { FlashcardStudyModal } from './FlashcardStudyModal';
import { EnglishNoteModal } from './EnglishNoteModal';

import { toLocalISODate } from '../../utils/calendar';
interface EnglishViewProps {
  englishNotes?: EnglishNote[];
  notes?: EnglishNote[];
  englishDecks?: EnglishDeck[];
  decks?: EnglishDeck[];
  englishCards?: EnglishCard[];
  cards?: EnglishCard[];
  englishLogs?: EnglishStudyReviewLog[];
  logs?: EnglishStudyReviewLog[];
  englishSettings?: EnglishDailyGoalSettings;
  settings?: EnglishDailyGoalSettings;
  todayCheckin?: { rating?: string } | null;
  onSaveNote: (note: Partial<EnglishNote>) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onSaveDeck: (deck: Partial<EnglishDeck>) => Promise<void>;
  onDeleteDeck: (deckId: string) => Promise<void>;
  onSaveCard: (card: Partial<EnglishCard>) => Promise<void>;
  onSaveMultipleCards: (cards: Partial<EnglishCard>[]) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onReviewCard?: (card: EnglishCard, rating: SpacedRepetitionRating) => Promise<void>;
  onSaveReviewRating?: (cardId: string, rating: SpacedRepetitionRating) => Promise<void>;
  onSaveSettings?: (settings: EnglishDailyGoalSettings) => Promise<void>;
  onRefreshData?: () => Promise<void>;
  voiceNotesEnabled?: boolean;
  isTodayTiring?: boolean;
}

export const EnglishView: React.FC<EnglishViewProps> = ({
  englishNotes: propEngNotes,
  notes: propNotes,
  englishDecks: propEngDecks,
  decks: propDecks,
  englishCards: propEngCards,
  cards: propCards,
  englishLogs: propEngLogs,
  logs: propLogs,
  englishSettings: propEngSettings,
  settings: propSettings,
  todayCheckin,
  onSaveNote,
  onDeleteNote,
  onSaveDeck,
  onDeleteDeck,
  onSaveCard,
  onSaveMultipleCards,
  onDeleteCard,
  onReviewCard,
  onSaveReviewRating,
  onSaveSettings,
  onRefreshData,
  voiceNotesEnabled = true,
  isTodayTiring: propIsTiring,
}) => {
  const englishNotes = propEngNotes || propNotes || [];
  const englishDecks = propEngDecks || propDecks || [];
  const englishCards = propEngCards || propCards || [];
  const englishLogs = propEngLogs || propLogs || [];
  const englishSettings = propEngSettings || propSettings || {
    dailyNewWordGoal: 5,
    dailyReviewLimit: 20,
    reduceGoalOnFatigue: true,
  };
  const isTodayTiring = propIsTiring !== undefined 
    ? propIsTiring 
    : todayCheckin?.rating === 'yorucu';

  const handleReviewCard = async (card: EnglishCard, rating: SpacedRepetitionRating) => {
    if (onReviewCard) {
      await onReviewCard(card, rating);
    } else if (onSaveReviewRating) {
      await onSaveReviewRating(card.id, rating);
    }
  };
  // Navigation inside English tab: 'kartlar' (Cards) or 'notlar' (Notes)
  const [activeSubTab, setActiveSubTab] = useState<'kartlar' | 'notlar'>('kartlar');

  // Modals
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isStudyOpen, setIsStudyOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<EnglishNote | null>(null);

  // Conversion draft for new flashcard
  const [cardDraftWord, setCardDraftWord] = useState('');

  // Search & Filter for Notes
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const todayStr = useMemo(() => toLocalISODate(), []);

  // Calculate Due Cards today
  const dueCards = useMemo(() => {
    return englishCards.filter((card) => isCardDueToday(card, todayStr));
  }, [englishCards, todayStr]);

  // Calculate Today's Learned / New Words
  const todayLearnedCards = useMemo(() => {
    return englishCards.filter((c) => c.learnedDate === todayStr);
  }, [englishCards, todayStr]);

  // Target goal for today (cut by half if tiring and reduceGoalOnFatigue is true)
  const effectiveGoal = useMemo(() => {
    if (isTodayTiring && englishSettings.reduceGoalOnFatigue) {
      return Math.max(1, Math.round(englishSettings.dailyNewWordGoal / 2));
    }
    return englishSettings.dailyNewWordGoal || 5;
  }, [isTodayTiring, englishSettings]);

  // English Streak calculation
  const streakDays = useMemo(() => {
    // Count consecutive days with at least 1 review or new word
    const datesWithActivity = new Set<string>();
    for (const card of englishCards) {
      if (card.learnedDate) datesWithActivity.add(card.learnedDate);
    }
    for (const log of englishLogs) {
      if (log.date) datesWithActivity.add(log.date);
    }

    let streak = 0;
    const checkDate = new Date();
    // Check today first, if not yet active, check starting from yesterday
    const todayFormatted = toLocalISODate(checkDate);
    if (datesWithActivity.has(todayFormatted)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Allow streak to remain intact if teacher just hasn't completed today's goal yet
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (streak < 365) {
      const dStr = toLocalISODate(checkDate);
      if (datesWithActivity.has(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [englishCards, englishLogs]);

  // Weekly Summary (last 7 days)
  const weeklyStats = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs = englishLogs.filter((l) => l.timestamp >= oneWeekAgo);
    const newWordsCount = englishCards.filter((c) => c.createdAt >= oneWeekAgo).length;
    const reviewCount = recentLogs.length;

    const correctReviews = recentLogs.filter((l) => l.rating === 'bildim').length;
    const accuracy = reviewCount > 0 ? Math.round((correctReviews / reviewCount) * 100) : 100;

    return {
      newWordsCount,
      reviewCount,
      accuracy,
    };
  }, [englishCards, englishLogs]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return englishNotes.filter((note) => {
      const matchesTag = selectedTag === 'all' || note.tag === selectedTag;
      const matchesSearch =
        !noteSearchQuery ||
        note.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(noteSearchQuery.toLowerCase());
      return matchesTag && matchesSearch;
    });
  }, [englishNotes, selectedTag, noteSearchQuery]);

  const handleConvertTextToCard = (selectedWord: string) => {
    setIsNoteModalOpen(false);
    setCardDraftWord(selectedWord);
    setIsManagerOpen(true);
  };

  return (
    <div className="pb-28 max-w-3xl mx-auto px-3 sm:px-4 pt-3 space-y-4">
      {/* Top Banner / Goal & Streak Header */}
      <div className="rounded-3xl bg-gradient-to-br from-teal-700 via-sky-800 to-indigo-900 text-white p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-teal-100">
              <Languages className="w-3.5 h-3.5" />
              <span>İngilizce Gelişim & Kelime Bölümü</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Aralıklı Tekrar & Çalışma
            </h1>
            <p className="text-xs text-sky-100/90 leading-relaxed max-w-md">
              Her gün birkaç kelime ve düzenli tekrar ile kalıcı öğrenme.
            </p>
          </div>

          {/* Quick Metrics (Streak & Today's Goal) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Streak Badge */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-sm">
                <Flame className="w-5 h-5 fill-amber-950" />
              </div>
              <div>
                <div className="text-sm font-black">{streakDays} Gün</div>
                <div className="text-[10px] text-teal-100 font-medium">Öğrenme Serisi</div>
              </div>
            </div>

            {/* Daily Goal Mini Card */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-400 text-teal-950 flex items-center justify-center font-black shadow-sm">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black">
                  {todayLearnedCards.length}/{effectiveGoal}
                </div>
                <div className="text-[10px] text-teal-100 font-medium">
                  {isTodayTiring && englishSettings.reduceGoalOnFatigue
                    ? 'Yorgunluk Dostu Hedef'
                    : 'Günlük Hedef'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Goal Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-sky-100">
          <span>Günlük İlerleme ({todayLearnedCards.length}/{effectiveGoal} yeni kelime)</span>
          <span className="font-bold">
            {Math.min(100, Math.round((todayLearnedCards.length / Math.max(1, effectiveGoal)) * 100))}%
          </span>
        </div>
        <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mt-1.5">
          <div
            className="bg-emerald-400 h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (todayLearnedCards.length / Math.max(1, effectiveGoal)) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* SubTab Switcher (Kelime Kartları vs İngilizce Notlar) */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('kartlar')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
            activeSubTab === 'kartlar'
              ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kelime Kartları ({englishCards.length})</span>
          {dueCards.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {dueCards.length} Tekrar
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('notlar')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
            activeSubTab === 'notlar'
              ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>İngilizce Notlar ({englishNotes.length})</span>
        </button>
      </div>

      {/* SUB-VIEW 1: KELİME KARTLARI (Flashcards & Spaced Repetition) */}
      {activeSubTab === 'kartlar' && (
        <div className="space-y-4">
          {/* Action Hero Bar: Start Study & Manage Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Start Review Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Aralıklı Tekrar Zamanı</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
                    {dueCards.length > 0
                      ? `${dueCards.length} Kart Tekrar Bekliyor`
                      : 'Tüm Kartlar Güncel'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    SM-2 algoritması: Kart çevirme veya test modu
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg">
                  {dueCards.length}
                </div>
              </div>

              <button
                onClick={() => setIsStudyOpen(true)}
                disabled={englishCards.length === 0}
                className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center justify-center gap-2 touch-manipulation"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Çalışmaya Başla ({dueCards.length > 0 ? dueCards.length : englishCards.length} Kart)</span>
              </button>
            </div>

            {/* Manage & Add Cards Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Deste & Kart Kütüphanesi</span>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {englishCards.length} Kelime • {englishDecks.length} Deste
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Seri kelime girişi, deste düzenleme ve CSV içe/dışa aktar
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCardDraftWord('');
                    setIsManagerOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-700/20 active:scale-95 transition flex items-center justify-center gap-2 touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                  <span>Hızlı Kart Ekle</span>
                </button>
              </div>
            </div>
          </div>

          {/* Weekly Summary Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Haftalık Öğrenme Özeti (Son 7 Gün)
              </span>
              <span className="text-[11px] text-slate-400">Canlı İstatistik</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
                <div className="text-lg sm:text-xl font-black text-teal-600 dark:text-teal-400">
                  {weeklyStats.newWordsCount}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Yeni Kelime
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
                <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
                  {weeklyStats.reviewCount}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Tekrar Sayısı
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
                <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                  %{weeklyStats.accuracy}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Doğruluk Oranı
                </div>
              </div>
            </div>
          </div>

          {/* Quick Deck Cards Grid Preview */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                Kayıtlı Kelimelerden Örnekler ({englishCards.length})
              </span>
              <button
                onClick={() => setIsManagerOpen(true)}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                Tümünü Yönet
              </button>
            </div>

            {englishCards.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                Henüz kelime kartı eklenmedi. "Hızlı Kart Ekle" butonuna basarak ilk kartınızı oluşturun.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {englishCards.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {c.word}
                        </span>
                        <button
                          onClick={() => speakEnglish(c.word)}
                          className="text-slate-400 hover:text-teal-600 p-0.5"
                          title="Dinle"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        {c.meaning}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex-shrink-0">
                      {c.repetitions || 0} tekrar
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: İNGİLİZCE NOTLAR (Notes with Tag Filters & Search) */}
      {activeSubTab === 'notlar' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
                placeholder="İngilizce notlarda ara..."
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>

            <button
              onClick={() => {
                setNoteToEdit(null);
                setIsNoteModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-600/20 active:scale-95 transition flex items-center justify-center gap-1.5 touch-manipulation flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni İngilizce Not</span>
            </button>
          </div>

          {/* Tag Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'vocabulary', label: 'Kelime' },
              { id: 'grammar', label: 'Grammar' },
              { id: 'speaking', label: 'Speaking' },
              { id: 'listening', label: 'Listening' },
              { id: 'writing', label: 'Writing' },
              { id: 'diger', label: 'Diğer' },
            ].map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  selectedTag === tag.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-400" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Kayıtlı İngilizce Not Bulunamadı
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Yukarıdaki "Yeni İngilizce Not" butonuna basarak sesle veya klavyeyle dilbilgisi kuralları ve diyalog notları tutabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3 group hover:border-sky-500/40 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                          #{note.tag}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(note.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {note.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setNoteToEdit(note);
                          setIsNoteModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/60 transition"
                        title="Düzenle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`"${note.title}" notunu silmek istiyor musunuz?`)) {
                            onDeleteNote(note.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px]">
                      İpucu: Notu düzenlerken metin seçip <strong>"Karta Çevir"</strong> diyebilirsiniz.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <FlashcardManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        cards={englishCards}
        decks={englishDecks}
        onSaveCard={onSaveCard}
        onDeleteCard={onDeleteCard}
        onSaveDeck={onSaveDeck}
        onDeleteDeck={onDeleteDeck}
        onImportCards={onSaveMultipleCards}
        initialWord={cardDraftWord}
      />

      <FlashcardStudyModal
        isOpen={isStudyOpen}
        onClose={() => setIsStudyOpen(false)}
        cards={dueCards.length > 0 ? dueCards : englishCards}
        decks={englishDecks}
        onReviewCard={handleReviewCard}
        dailyReviewLimit={englishSettings.dailyReviewLimit}
      />

      <EnglishNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setNoteToEdit(null);
        }}
        noteToEdit={noteToEdit}
        onSaveNote={onSaveNote}
        onConvertToCard={handleConvertTextToCard}
        voiceNotesEnabled={voiceNotesEnabled}
      />
    </div>
  );
};
