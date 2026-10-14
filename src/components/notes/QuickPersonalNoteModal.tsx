import React, { useState, useEffect, useRef } from 'react';
import { X, StickyNote, Mic, MicOff, Pin, Check, Plus, Tag } from 'lucide-react';
import { PersonalNote, PersonalNoteTag } from '../../types';
import { NOTE_TAG_COLORS } from '../../utils/noteUtils';

interface QuickPersonalNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: PersonalNoteTag[];
  onSaveNote: (note: PersonalNote) => Promise<void>;
  onOpenManageTags?: () => void;
  voiceNotesEnabled?: boolean;
}

export const QuickPersonalNoteModal: React.FC<QuickPersonalNoteModalProps> = ({
  isOpen,
  onClose,
  tags,
  onSaveNote,
  onOpenManageTags,
  voiceNotesEnabled = true,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      // Default to "Not" tag if available
      const defaultTag = tags.find((t) => t.id === 'tag-not' || t.name.toLowerCase() === 'not');
      setSelectedTagIds(defaultTag ? [defaultTag.id] : []);
      setIsPinned(false);
      setIsRecording(false);
      setError('');
      setTimeout(() => {
        contentTextareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, tags]);

  // Voice typing setup
  const isSpeechSupported = 
    typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startVoiceInput = () => {
    if (!isSpeechSupported || !voiceNotesEnabled) return;

    try {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => 
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle && !trimmedContent) {
      setError('Lütfen bir not içeriği veya başlık girin.');
      contentTextareaRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      const newNote: PersonalNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: trimmedTitle || undefined,
        content: trimmedContent,
        tagIds: selectedTagIds,
        isPinned,
        isArchived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await onSaveNote(newNote);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Not kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Hızlı Not
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Başlık zorunlu değildir, boşsa ilk satır başlık sayılır
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
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Optional Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Başlık <span className="text-slate-400 font-normal">(İsteğe bağlı)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder="Örn: Toplantı Notu, API Anahtarları..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Note Content with Speech Recognition */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                İçerik
              </label>

              {isSpeechSupported && voiceNotesEnabled && (
                <button
                  type="button"
                  onClick={isRecording ? stopVoiceInput : startVoiceInput}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition active:scale-95 ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse shadow-sm'
                      : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isRecording ? 'Dinleniyor... (Durdur)' : 'Sesle Yaz'}</span>
                </button>
              )}
            </div>

            <textarea
              ref={contentTextareaRef}
              rows={6}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder="Notunuzu buraya yazın veya ses butonuna basarak konuşun... (Kaydetmek için Ctrl+Enter tuşlayabilirsiniz)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed resize-y"
            />
          </div>

          {/* Tag Selector (Multi-select) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Etiketler (Birden fazla seçilebilir)</span>
              </span>
              {onOpenManageTags && (
                <button
                  type="button"
                  onClick={onOpenManageTags}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Yeni Etiket</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                const conf = NOTE_TAG_COLORS[tag.color] || NOTE_TAG_COLORS.purple;

                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition active:scale-95 ${
                      isSelected
                        ? `${conf.badge} ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-slate-900 font-bold shadow-xs`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                    <span>{tag.name}</span>
                    {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pin toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                isPinned
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{isPinned ? '📌 Not Sabitlendi (En üstte kalacak)' : 'Notu Başa Sabitle'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (!title.trim() && !content.trim())}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Kaydediliyor...' : 'Notu Kaydet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
