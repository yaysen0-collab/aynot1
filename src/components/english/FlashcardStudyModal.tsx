import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  RotateCw, 
  Volume2, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Trophy
} from 'lucide-react';
import { EnglishCard, EnglishDeck, SpacedRepetitionRating } from '../../types';
import { speakEnglish } from '../../utils/englishUtils';
import { ModalShell } from '../common/ModalShell';

interface FlashcardStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: EnglishCard[];
  decks: EnglishDeck[];
  onReviewCard: (card: EnglishCard, rating: SpacedRepetitionRating) => Promise<void>;
  dailyReviewLimit?: number;
}

export const FlashcardStudyModal: React.FC<FlashcardStudyModalProps> = ({
  isOpen,
  onClose,
  cards,
  decks,
  onReviewCard,
  dailyReviewLimit = 20,
}) => {
  // 1. KURAL: BÜTÜN HOOK'LAR EN ÜSTTE OLMALIDIR (if/return koşullarından önce)
  const [studyCards, setStudyCards] = useState<EnglishCard[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [direction, setDirection] = useState<'en_to_tr' | 'tr_to_en'>('en_to_tr');
  const [mode, setMode] = useState<'flip' | 'test'>('flip');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [testScore, setTestScore] = useState({ correct: 0, total: 0 });
  const [wrongCards, setWrongCards] = useState<EnglishCard[]>([]);

  // Modal açıldığında kartların "sabit" bir kopyasını alıyoruz ki işlem yaparken liste küçülüp uygulamayı çökertmesin.
  useEffect(() => {
    if (isOpen) {
      const filtered = selectedDeckId === 'all' 
        ? cards 
        : cards.filter(c => c.deckId === selectedDeckId);
      
      setStudyCards(filtered.slice(0, dailyReviewLimit));
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionCompleted(false);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setTestScore({ correct: 0, total: 0 });
      setWrongCards([]);
    }
  }, [isOpen, selectedDeckId, dailyReviewLimit]); 

  const currentCard = studyCards[currentIndex];

  // Test modu şıklarını oluşturan kanca (Hook kuralları gereği return'den önce yazıldı)
  const currentOptions = useMemo(() => {
    if (mode !== 'test' || !currentCard) return [];

    const correctAnswer = direction === 'en_to_tr' ? currentCard.meaning : currentCard.word;
    const pool = studyCards
      .filter((c) => c.id !== currentCard.id)
      .map((c) => (direction === 'en_to_tr' ? c.meaning : c.word));

    const shuffledPool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    return [correctAnswer, ...shuffledPool].sort(() => 0.5 - Math.random());
  }, [currentIndex, mode, direction, currentCard?.id, studyCards]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = async (rating: SpacedRepetitionRating) => {
    if (!currentCard) return;

    await onReviewCard(currentCard, rating);

    if (rating === 'bilmedim') {
      setWrongCards((prev) => [...prev, currentCard]);
    }

    if (currentIndex + 1 < studyCards.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      setSessionCompleted(true);
    }
  };

  const handleSelectOption = (option: string) => {
    if (isAnswerChecked || !currentCard) return;
    setSelectedOption(option);
    setIsAnswerChecked(true);

    const correctAnswer = direction === 'en_to_tr' ? currentCard.meaning : currentCard.word;
    const isCorrect = option === correctAnswer;

    setTestScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    if (!isCorrect) {
      setWrongCards((prev) => [...prev, currentCard]);
      onReviewCard(currentCard, 'bilmedim');
    } else {
      onReviewCard(currentCard, 'bildim');
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < studyCards.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      setSessionCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setTestScore({ correct: 0, total: 0 });
    setWrongCards([]);
  };

  // HOOK'LAR BİTTİ - Artık ekran gizleme (early return) işlemini güvenle yapabiliriz
  if (!isOpen) return null;

  return (
    <ModalShell onClose={onClose} maxWidthClass="max-w-xl" dismissible={false}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {mode === 'flip' ? 'Kart Çevirme Çalışması' : 'Çoktan Seçmeli Test Modu'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aralıklı tekrar sistemi (SM-2) ile kalıcı öğrenme
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

        {/* Controls & Options Bar */}
        {!sessionCompleted && studyCards.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMode('flip')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  mode === 'flip'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Kart Çevir
              </button>
              <button
                onClick={() => setMode('test')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  mode === 'test'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Test Modu
              </button>

              <button
                onClick={() => setDirection(direction === 'en_to_tr' ? 'tr_to_en' : 'en_to_tr')}
                className="ml-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition font-medium flex items-center gap-1"
                title="Yönü Değiştir"
              >
                <RotateCw className="w-3 h-3" />
                <span>{direction === 'en_to_tr' ? 'EN → TR' : 'TR → EN'}</span>
              </button>
            </div>

            <div className="font-semibold text-slate-600 dark:text-slate-400">
              {currentIndex + 1} / {studyCards.length}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-center items-center">
          {studyCards.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Bugün Tekrar Edilecek Kart Yok!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Tüm kelime tekrarlarınızı harika bir şekilde tamamladınız veya henüz bu destede kart bulunmuyor.
              </p>
            </div>
          ) : sessionCompleted ? (
            <div className="w-full text-center py-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-lg">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Tebrikler! Çalışma Seansı Tamamlandı
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {studyCards.length} kart aralıklı tekrar algoritmasına göre güncellendi.
                </p>
              </div>

              {mode === 'test' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-xs mx-auto">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    %{Math.round((testScore.correct / Math.max(1, testScore.total)) * 100)}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                    Skor: {testScore.correct} / {testScore.total} Doğru
                  </div>
                </div>
              )}

              {wrongCards.length > 0 && (
                <div className="text-left max-w-md mx-auto space-y-2">
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    <span>Tekrar Edilmesi Gerekenler ({wrongCards.length}):</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {wrongCards.map((c, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs flex justify-between items-center"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">{c.word}</span>
                        <span className="text-slate-600 dark:text-slate-400">{c.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleRestart}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tekrar Başlat</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md transition"
                >
                  Tamamla
                </button>
              </div>
            </div>
          ) : mode === 'flip' ? (
            <div className="w-full flex flex-col items-center space-y-5">
              <div
                onClick={handleFlip}
                className="w-full max-w-md min-h-[220px] p-6 rounded-3xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-850 border-2 border-slate-200/90 dark:border-slate-700/80 shadow-xl flex flex-col justify-between items-center text-center cursor-pointer select-none transition-all duration-300 hover:scale-[1.01] active:scale-95"
              >
                <div className="w-full flex items-center justify-between text-xs text-slate-400">
                  <span>Dokunarak çevir</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakEnglish(currentCard.word);
                      }}
                      className="p-1.5 rounded-full hover:bg-teal-50 dark:hover:bg-teal-950/60 text-teal-600 dark:text-teal-400 transition"
                      title="Telaffuzu Dinle"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="my-auto space-y-3">
                  {!isFlipped ? (
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {direction === 'en_to_tr' ? currentCard.word : currentCard.meaning}
                      </div>
                      <div className="text-xs text-slate-400 mt-2">
                        {direction === 'en_to_tr' ? 'Türkçe anlamını hatırlamaya çalışın' : 'İngilizce karşılığını hatırlayın'}
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-200 space-y-2">
                      <div className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-300 tracking-tight">
                        {direction === 'en_to_tr' ? currentCard.meaning : currentCard.word}
                      </div>
                      {currentCard.exampleSentence && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic max-w-sm mx-auto leading-relaxed">
                          "{currentCard.exampleSentence}"
                        </p>
                      )}
                      {currentCard.personalNote && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                          Not: {currentCard.personalNote}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-[11px] font-medium text-slate-400">
                  {isFlipped ? 'Nasıl hatırladığınızı aşağıdan seçin 👇' : 'Cevabı görmek için karta dokunun'}
                </div>
              </div>

              <div className="w-full max-w-md grid grid-cols-3 gap-2.5 pt-2">
                <button
                  onClick={() => handleRating('bilmedim')}
                  className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Bilmedim</span>
                  <span className="text-[10px] font-normal opacity-80">(Yarın tekrar)</span>
                </button>

                <button
                  onClick={() => handleRating('zorlandim')}
                  className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Zorlandım</span>
                  <span className="text-[10px] font-normal opacity-80">(Kısa aralık)</span>
                </button>

                <button
                  onClick={() => handleRating('bildim')}
                  className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bildim</span>
                  <span className="text-[10px] font-normal opacity-80">(Uzun aralık)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md space-y-4">
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Soru {currentIndex + 1}
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {direction === 'en_to_tr' ? currentCard.word : currentCard.meaning}
                </div>
                <button
                  onClick={() => speakEnglish(currentCard.word)}
                  className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Telaffuz</span>
                </button>
              </div>

              <div className="space-y-2">
                {currentOptions.map((opt, i) => {
                  const correctAnswer = direction === 'en_to_tr' ? currentCard.meaning : currentCard.word;
                  const isSelected = selectedOption === opt;
                  const isCorrect = opt === correctAnswer;

                  let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-teal-500';

                  if (isAnswerChecked) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-100 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 font-bold';
                    } else {
                      btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={isAnswerChecked}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm transition flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {isAnswerChecked && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      {isAnswerChecked && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {isAnswerChecked && (
                <div className="pt-2 flex justify-end animate-in fade-in">
                  <button
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center gap-1.5"
                  >
                    <span>{currentIndex + 1 < studyCards.length ? 'Sonraki Soru' : 'Sonucu Gör'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
    </ModalShell>
  );
};
