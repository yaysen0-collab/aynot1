import React, { useState } from 'react';
import { Mic, MicOff, AlertCircle, X, Volume2, Info } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface VoiceInputButtonProps {
  onInsertText: (text: string) => void;
  disabled?: boolean;
  className?: string;
  enabled?: boolean; // App setting toggle
  compact?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onInsertText,
  disabled = false,
  className = '',
  enabled = true,
  compact = false,
}) => {
  const [showErrorModal, setShowErrorModal] = useState(false);

  const {
    isListening,
    isSupported,
    error,
    errorGuide,
    startListening,
    stopListening,
    clearError,
  } = useSpeechRecognition({
    onTranscript: (incomingText) => {
      onInsertText(incomingText);
    },
    lang: 'tr-TR',
  });

  if (!enabled) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (error) {
      clearError();
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Listening pulse rings when active */}
      {isListening && (
        <span className="absolute -inset-1 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        className={`relative flex items-center justify-center gap-1.5 rounded-full transition-all duration-200 select-none touch-manipulation active:scale-95 ${
          compact ? 'p-2 text-xs' : 'px-3 py-1.5 text-xs font-semibold'
        } ${
          isListening
            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/40 ring-2 ring-rose-400'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
        }`}
        title={
          isListening
            ? 'Dinleniyor... Durdurmak için dokunun'
            : 'Sesle Yazdır (tr-TR) - Dokunun'
        }
        aria-label={isListening ? 'Ses kaydını durdur' : 'Sesle not al'}
      >
        {isListening ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <Mic className="w-4 h-4 animate-bounce" />
            {!compact && <span className="tracking-tight">Dinleniyor...</span>}
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            {!compact && <span>Sesle Yaz</span>}
          </>
        )}
      </button>

      {/* Inline Warning/Error trigger badge if an error occurs */}
      {error && (
        <button
          type="button"
          onClick={() => setShowErrorModal(true)}
          className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold text-rose-700 dark:text-rose-300 animate-in fade-in"
          title="Hata detayını ve çözümünü gör"
        >
          <AlertCircle className="w-3 h-3 text-rose-600 flex-shrink-0" />
          <span className="max-w-[120px] truncate">{error}</span>
        </button>
      )}

      {/* Helpful Voice Guidance Tip Modal */}
      {showErrorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowErrorModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Mikrofon Uyarısı</span>
              </div>
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {error}
            </p>

            {errorGuide && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {errorGuide}
              </div>
            )}

            <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              💡 Not: Klavyeyle yazarak notlarınızı kaydetmeye devam edebilirsiniz.
            </div>

            <button
              type="button"
              onClick={() => {
                clearError();
                setShowErrorModal(false);
              }}
              className="w-full py-2 rounded-xl bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
