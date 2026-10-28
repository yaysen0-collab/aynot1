import React, { useEffect, useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Volume2, 
  Layers, 
  FolderPlus, 
  Upload, 
  Download, 
  Check, 
  Search,
  BookOpen,
  Filter
} from 'lucide-react';
import { EnglishCard, EnglishDeck } from '../../types';
import { speakEnglish, exportCardsToCSV, parseCardsCSV, downloadFile } from '../../utils/englishUtils';

import { toLocalISODate } from '../../utils/calendar';
import { ModalShell } from '../common/ModalShell';
interface FlashcardManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: EnglishCard[];
  decks: EnglishDeck[];
  onSaveCard: (card: EnglishCard) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onSaveDeck: (deck: EnglishDeck) => Promise<void>;
  onDeleteDeck: (deckId: string) => Promise<void>;
  onImportCards: (cards: EnglishCard[]) => Promise<void>;
  initialDeckId?: string;
  initialWord?: string;
  initialMeaning?: string;
}

export const FlashcardManagerModal: React.FC<FlashcardManagerModalProps> = ({
  isOpen,
  onClose,
  cards,
  decks,
  onSaveCard,
  onDeleteCard,
  onSaveDeck,
  onDeleteDeck,
  onImportCards,
  initialDeckId,
  initialWord = '',
  initialMeaning = '',
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    initialDeckId || (decks.length > 0 ? decks[0].id : '')
  );

  // Fast Add Card Form State
  const [word, setWord] = useState(initialWord);
  const [meaning, setMeaning] = useState(initialMeaning);
  const [exampleSentence, setExampleSentence] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [targetDeckId, setTargetDeckId] = useState<string>(
    initialDeckId || (decks.length > 0 ? decks[0].id : '')
  );
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [cardSaveSuccess, setCardSaveSuccess] = useState(false);

  // New Deck Form State
  const [isAddingDeck, setIsAddingDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Bu pencere sürekli bağlı kalır; state'ler ilk çizimdeki props ile dolduğu için pencere her
  // açıldığında güncel taslakla ("Karta Çevir") ve geçerli destelerle yeniden eşitlenir.
  useEffect(() => {
    if (!isOpen) return;
    setWord(initialWord);
    setMeaning(initialMeaning);
    setSelectedDeckId((prev) => (prev && !decks.some((d) => d.id === prev) ? '' : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  // Seçili/hedef deste silinmiş ya da hiç belirlenmemişse (örn. pencere deste yokken çizildiyse)
  // geçerli bir desteye düş. Böylece kart, ekranda görünen listedeki desteye eklenir.
  const deckExists = (id: string) => Boolean(id) && decks.some((d) => d.id === id);
  const activeSelectedDeckId = deckExists(selectedDeckId) ? selectedDeckId : '';
  const activeTargetDeckId = deckExists(targetDeckId)
    ? targetDeckId
    : activeSelectedDeckId || decks[0]?.id || '';

  // Filtered Cards
  const displayedCards = cards.filter((c) => {
    const matchesDeck = !activeSelectedDeckId || c.deckId === activeSelectedDeckId;
    const matchesSearch =
      !searchQuery ||
      c.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.exampleSentence && c.exampleSentence.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDeck && matchesSearch;
  });

  const handleQuickAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) return;

    let deckToUse = activeTargetDeckId;
    // If no deck exists, auto-create a default one
    if (!deckToUse) {
      const defaultDeck: EnglishDeck = {
        id: `deck-${Date.now()}`,
        name: 'Genel Kelimeler',
        color: 'teal',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await onSaveDeck(defaultDeck);
      deckToUse = defaultDeck.id;
      setTargetDeckId(defaultDeck.id);
    }

    setIsSavingCard(true);
    const todayStr = toLocalISODate();
    const newCard: EnglishCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      deckId: deckToUse,
      word: word.trim(),
      meaning: meaning.trim(),
      exampleSentence: exampleSentence.trim() || undefined,
      personalNote: personalNote.trim() || undefined,
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: todayStr,
      learnedDate: todayStr,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await onSaveCard(newCard);
      // Liste başka bir desteye filtreliyse yeni kart görünmez; o desteye geç
      if (activeSelectedDeckId && activeSelectedDeckId !== deckToUse) setSelectedDeckId(deckToUse);
      setCardSaveSuccess(true);
      setTimeout(() => setCardSaveSuccess(false), 2000);
      // Reset input for lightning-fast consecutive adding, keep current target deck
      setWord('');
      setMeaning('');
      setExampleSentence('');
      setPersonalNote('');
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;

    const newDeck: EnglishDeck = {
      id: `deck-${Date.now()}`,
      name: newDeckName.trim(),
      description: newDeckDesc.trim() || undefined,
      color: 'teal',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await onSaveDeck(newDeck);
    setSelectedDeckId(newDeck.id);
    setTargetDeckId(newDeck.id);
    setNewDeckName('');
    setNewDeckDesc('');
    setIsAddingDeck(false);
  };

  const handleExportCSV = () => {
    const csvContent = exportCardsToCSV(displayedCards.length > 0 ? displayedCards : cards);
    const filename = `ingilizce_kelime_kartlari_${toLocalISODate()}.csv`;
    downloadFile(csvContent, filename);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsed = parseCardsCSV(text);
      if (parsed.length === 0) {
        alert('CSV dosyasında geçerli kelime bulunamadı.');
        return;
      }

      const activeDeck = targetDeckId || (decks.length > 0 ? decks[0].id : 'deck-default');
      const todayStr = toLocalISODate();

      const newCards: EnglishCard[] = parsed.map((item, index) => ({
        id: `card-csv-${Date.now()}-${index}`,
        deckId: activeDeck,
        word: item.word,
        meaning: item.meaning,
        exampleSentence: item.exampleSentence,
        personalNote: item.personalNote,
        intervalDays: 1,
        easeFactor: 2.5,
        repetitions: 0,
        nextReviewDate: todayStr,
        learnedDate: todayStr,
        createdAt: Date.now() + index,
        updatedAt: Date.now() + index,
      }));

      await onImportCards(newCards);
      alert(`${newCards.length} kelime kartı başarıyla içe aktarıldı!`);
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  return (
    <ModalShell onClose={onClose} maxWidthClass="max-w-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Kelime Kartları ve Desteler
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hızlı kart ekleme, deste yönetimi ve CSV aktarımı
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Fast Add Card Form */}
          <div className="rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Hızlı Kart Ekle (Arka Arkaya Giriş)
              </span>
              {cardSaveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" /> Kaydedildi!
                </span>
              )}
            </div>

            <form onSubmit={handleQuickAddCard} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    İngilizce Kelime / Kalıp *
                  </label>
                  <input
                    type="text"
                    required
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="örn: encourage"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Türkçe Karşılığı *
                  </label>
                  <input
                    type="text"
                    required
                    value={meaning}
                    onChange={(e) => setMeaning(e.target.value)}
                    placeholder="örn: cesaretlendirmek, teşvik etmek"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Örnek Cümle (İsteğe bağlı)
                  </label>
                  <input
                    type="text"
                    value={exampleSentence}
                    onChange={(e) => setExampleSentence(e.target.value)}
                    placeholder="örn: Teachers encourage students to ask questions."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deste
                  </label>
                  <select
                    value={activeTargetDeckId}
                    onChange={(e) => setTargetDeckId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    {decks.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                    {decks.length === 0 && <option value="">Genel Deste</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kendi Notum (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  placeholder="örn: preposition: encourage someone to do something"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSavingCard || !word.trim() || !meaning.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition flex items-center gap-1.5 touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kartı Kaydet ve Devam Et</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. Decks Bar & New Deck Modal Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                Desteler ({decks.length})
              </span>
              <button
                onClick={() => setIsAddingDeck(!isAddingDeck)}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Yeni Deste Oluştur</span>
              </button>
            </div>

            {/* Inline New Deck Form */}
            {isAddingDeck && (
              <form onSubmit={handleCreateDeck} className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-2.5 animate-in fade-in">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Yeni Kelime Destesi
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="Deste adı (örn: Seyahat & Ulaşım)"
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={newDeckDesc}
                    onChange={(e) => setNewDeckDesc(e.target.value)}
                    placeholder="Açıklama (isteğe bağlı)"
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingDeck(false)}
                    className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
                  >
                    Deste Ekle
                  </button>
                </div>
              </form>
            )}

            {/* Deck Badges */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedDeckId('')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  activeSelectedDeckId === ''
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Tüm Desteler ({cards.length})
              </button>
              {decks.map((deck) => {
                const count = cards.filter((c) => c.deckId === deck.id).length;
                const isSelected = activeSelectedDeckId === deck.id;
                return (
                  <div key={deck.id} className="relative group inline-flex items-center">
                    <button
                      onClick={() => setSelectedDeckId(deck.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{deck.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        {count}
                      </span>
                    </button>
                    {decks.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`"${deck.name}" destesini ve içindeki kartları silmek istiyor musunuz?`)) {
                            onDeleteDeck(deck.id);
                            if (selectedDeckId === deck.id) setSelectedDeckId('');
                          }
                        }}
                        title="Desteyi sil"
                        className="opacity-0 group-hover:opacity-100 -ml-1 text-slate-400 hover:text-rose-600 transition p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. CSV Import / Export Actions & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mevcut kartlarda ara..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition touch-manipulation"
                title="Kartları CSV olarak indir"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>CSV İndir</span>
              </button>

              <label className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer touch-manipulation">
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                <span>CSV İçe Aktar</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleImportCSV}
                />
              </label>
            </div>
          </div>

          {/* 4. Cards List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Kart Listesi ({displayedCards.length})</span>
              <span>Tekrar Tarihi</span>
            </div>

            {displayedCards.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Bu kriterlere uygun kart bulunamadı. Yukarıdan hemen yeni kart ekleyebilirsiniz.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {displayedCards.map((card) => {
                  const deck = decks.find((d) => d.id === card.deckId);
                  return (
                    <div
                      key={card.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 group hover:border-teal-500/40 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {card.word}
                          </span>
                          <button
                            onClick={() => speakEnglish(card.word)}
                            className="p-1 rounded-full text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/60 transition"
                            title="Telaffuzu Dinle"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          {deck && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {deck.name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                          {card.meaning}
                        </div>
                        {card.exampleSentence && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5 line-clamp-1">
                            "{card.exampleSentence}"
                          </div>
                        )}
                        {card.personalNote && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                            Not: {card.personalNote}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {card.nextReviewDate || 'Bugün'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {card.repetitions || 0} tekrar
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm(`"${card.word}" kartını silmek istiyor musunuz?`)) {
                              onDeleteCard(card.id);
                            }
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                          title="Kartı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-semibold text-xs sm:text-sm hover:opacity-90 transition active:scale-95 touch-manipulation"
          >
            Tamam
          </button>
        </div>
    </ModalShell>
  );
};
