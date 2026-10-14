import React, { useState } from 'react';
import { 
  X, 
  Mic, 
  Languages, 
  Sparkles, 
  Tag, 
  Check, 
  Layers, 
  CreditCard 
} from 'lucide-react';
import { EnglishNote, EnglishNoteTag } from '../../types';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface EnglishNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: EnglishNote | null;
  onSaveNote: (note: EnglishNote) => Promise<void>;
  onConvertToCard?: (selectedText: string) => void;
  voiceNotesEnabled?: boolean;
}

const TAG_OPTIONS: Array<{ id: EnglishNoteTag; label: string; color: string }> = [
  { id: 'vocabulary', label: 'Kelime & İfade', color: 'emerald' },
  { id: 'grammar', label: 'Dilbilgisi (Grammar)', color: 'indigo' },
  { id: 'speaking', label: 'Konuşma (Speaking)', color: 'amber' },
  { id: 'listening', label: 'Dinleme (Listening)', color: 'sky' },
  { id: 'writing', label: 'Yazma (Writing)', color: 'rose' },
  { id: 'diger', label: 'Diğer Notlar', color: 'slate' },
];

export const EnglishNoteModal: React.FC<EnglishNoteModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  onSaveNote,
  onConvertToCard,
  voiceNotesEnabled = true,
}) => {
  const [title, setTitle] = useState(noteToEdit?.title || '');
  const [content, setContent] = useState(noteToEdit?.content || '');
  const [tag, setTag] = useState<EnglishNoteTag>(noteToEdit?.tag || 'vocabulary');
  const [speechLang, setSpeechLang] = useState<'tr-TR' | 'en-US'>('en-US');
  const [isSaving, setIsSaving] = useState(false);

  // Selected text tracking for "Karta Çevir"
  const [selectedText, setSelectedText] = useState('');

  // Speech Recognition hook
  const {
    isListening,
    isSupported,
    error: speechError,
    errorGuide,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    lang: speechLang,
    onTranscript: (formattedSegment) => {
      setContent((prev) => (prev ? `${prev} ${formattedSegment}` : formattedSegment));
    },
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    try {
      const note: EnglishNote = {
        id: noteToEdit?.id || `eng-note-${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        tag,
        createdAt: noteToEdit?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      await onSaveNote(note);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const text = target.value.substring(target.selectionStart, target.selectionEnd).trim();
    setSelectedText(text);
  };

  const handleConvertToCardClick = () => {
    if (!selectedText) return;
    if (onConvertToCard) {
      onConvertToCard(selectedText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center shadow-sm">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {noteToEdit ? 'İngilizce Notu Düzenle' : 'Yeni İngilizce Notu'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dilbilgisi, kalıplar ve çalışma notları
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Note Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Not Başlığı *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="örn: Present Perfect Tense İpuçları & Sık Hatalar"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          {/* Tag Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-sky-600" />
              <span>Kategori & Etiket</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setTag(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    tag === opt.id
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content with Voice Dictation & Selection to Flashcard */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Not İçeriği *
              </label>

              {/* Voice recognition button and language toggle */}
              {voiceNotesEnabled && (
                <div className="flex items-center gap-1.5">
                  <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    <button
                      type="button"
                      onClick={() => setSpeechLang('en-US')}
                      className={`px-1.5 py-0.5 rounded ${speechLang === 'en-US' ? 'bg-white dark:bg-slate-700 shadow-xs text-sky-600 font-bold' : ''}`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpeechLang('tr-TR')}
                      className={`px-1.5 py-0.5 rounded ${speechLang === 'tr-TR' ? 'bg-white dark:bg-slate-700 shadow-xs text-sky-600 font-bold' : ''}`}
                    >
                      TR
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isListening ? 'Dinleniyor...' : 'Sesle Yaz'}</span>
                  </button>
                </div>
              )}
            </div>

            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onSelect={handleTextSelect}
              placeholder="Notunuzu buraya yazın veya mikrofonla sesle dikte edin. Metin seçerek doğrudan kelime kartına çevirebilirsiniz..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 leading-relaxed"
            />

            {/* Error or Help guidance for voice */}
            {speechError && (
              <div className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl">
                <div>{speechError}</div>
                {errorGuide && <div className="text-[11px] opacity-80 mt-0.5">{errorGuide}</div>}
              </div>
            )}

            {/* Selection convert to card tooltip */}
            {selectedText && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 animate-in fade-in">
                <div className="text-xs text-amber-900 dark:text-amber-200 truncate">
                  Seçilen: <strong>"{selectedText}"</strong>
                </div>
                <button
                  type="button"
                  onClick={handleConvertToCardClick}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs flex-shrink-0"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Karta Çevir</span>
                </button>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim() || !content.trim()}
              className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-600/20 active:scale-95 transition flex items-center gap-1.5 touch-manipulation"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Kaydediliyor...' : 'Notu Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
