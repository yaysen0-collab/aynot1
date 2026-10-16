import React, { useState, useEffect, useRef } from 'react';
import { Mic, CreditCard } from 'lucide-react';
import { EnglishNote, EnglishNoteTag } from '../../types';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import {
  NoteEditorShell,
  AutoGrowTextarea,
  NoteMetaCard,
  NoteMetaRow,
  NoteChipRow,
  noteChipClass,
} from '../common/NoteEditorShell';

interface EnglishNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: EnglishNote | null;
  onSaveNote: (note: EnglishNote) => Promise<void>;
  onConvertToCard?: (selectedText: string) => void;
  voiceNotesEnabled?: boolean;
}

const TAG_OPTIONS: Array<{ id: EnglishNoteTag; label: string }> = [
  { id: 'vocabulary', label: 'Kelime & İfade' },
  { id: 'grammar', label: 'Dilbilgisi (Grammar)' },
  { id: 'speaking', label: 'Konuşma (Speaking)' },
  { id: 'listening', label: 'Dinleme (Listening)' },
  { id: 'writing', label: 'Yazma (Writing)' },
  { id: 'diger', label: 'Diğer Notlar' },
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
  const [error, setError] = useState<string | null>(null);
  const [openedAt, setOpenedAt] = useState(Date.now());

  // Selected text tracking for "Karta Çevir"
  const [selectedText, setSelectedText] = useState('');

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const initialSnapRef = useRef<string>('');

  // Speech Recognition hook
  const {
    isListening,
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

  // Pencere sürekli bağlı kalıyor; her açılışta / farklı not seçildiğinde formu sıfırla
  useEffect(() => {
    if (!isOpen) return;
    const init = {
      t: noteToEdit?.title || '',
      c: noteToEdit?.content || '',
      g: noteToEdit?.tag || 'vocabulary',
    };
    setTitle(init.t);
    setContent(init.c);
    setTag(init.g as EnglishNoteTag);
    setSelectedText('');
    setError(null);
    setOpenedAt(noteToEdit?.updatedAt || noteToEdit?.createdAt || Date.now());
    initialSnapRef.current = JSON.stringify(init);
    if (!noteToEdit) setTimeout(() => bodyRef.current?.focus(), 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, noteToEdit?.id]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Lütfen not başlığını yazınız.');
      return;
    }
    if (!content.trim()) {
      setError('Lütfen not içeriğini yazınız.');
      return;
    }

    setIsSaving(true);
    setError(null);
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Not kaydedilirken bir hata oluştu.');
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

  const isDirty = JSON.stringify({ t: title, c: content, g: tag }) !== initialSnapRef.current;

  const dateText = new Date(openedAt).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <NoteEditorShell
      backLabel="İngilizce"
      dateText={dateText}
      title={title}
      onTitleChange={setTitle}
      titlePlaceholder="Başlık"
      onTitleEnter={() => bodyRef.current?.focus()}
      isSaving={isSaving}
      isDirty={isDirty}
      canSave={!!title.trim() && !!content.trim()}
      onSave={handleSubmit}
      onClose={onClose}
      error={error}
      onEmptyAreaClick={() => bodyRef.current?.focus()}
      headerActions={
        voiceNotesEnabled ? (
          <div className="flex items-center gap-1.5 mr-1">
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setSpeechLang('en-US')}
                className={`px-1.5 py-0.5 rounded ${speechLang === 'en-US' ? 'bg-white dark:bg-slate-700 shadow-xs text-teal-600 font-bold' : ''}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setSpeechLang('tr-TR')}
                className={`px-1.5 py-0.5 rounded ${speechLang === 'tr-TR' ? 'bg-white dark:bg-slate-700 shadow-xs text-teal-600 font-bold' : ''}`}
              >
                TR
              </button>
            </div>
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-2 rounded-xl transition active:scale-90 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isListening ? 'Dinleniyor... (durdurmak için dokunun)' : 'Sesle yaz'}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        ) : undefined
      }
    >
      <NoteMetaCard>
        <NoteMetaRow label="Etiket">
          <NoteChipRow>
            {TAG_OPTIONS.map((opt) => (
              <button key={opt.id} type="button" onClick={() => setTag(opt.id)} className={noteChipClass(tag === opt.id)}>
                {opt.label}
              </button>
            ))}
          </NoteChipRow>
        </NoteMetaRow>
      </NoteMetaCard>

      <AutoGrowTextarea
        ref={bodyRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onSelect={handleTextSelect}
        placeholder="Not yazın veya mikrofonla dikte edin. Metin seçerek doğrudan kelime kartına çevirebilirsiniz..."
      />

      {speechError && (
        <div className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl">
          <div>{speechError}</div>
          {errorGuide && <div className="text-[11px] opacity-80 mt-0.5">{errorGuide}</div>}
        </div>
      )}

      {/* Seçili metni karta çevir */}
      {selectedText && (
        <div className="sticky bottom-3 mt-2 mb-4 p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 shadow-md animate-in fade-in">
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
    </NoteEditorShell>
  );
};
