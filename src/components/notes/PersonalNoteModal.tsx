import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  Pin,
  Tag,
  MoreHorizontal,
  Check,
  Copy,
  Archive,
  Trash2,
  List,
  ListOrdered,
  Plus,
  Loader2,
} from 'lucide-react';
import { PersonalNote, PersonalNoteTag } from '../../types';
import { NOTE_TAG_COLORS } from '../../utils/noteUtils';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface PersonalNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit: PersonalNote | null;
  tags: PersonalNoteTag[];
  onSaveNote: (note: PersonalNote) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
  onOpenManageTags?: () => void;
  voiceNotesEnabled?: boolean;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_DELAY_MS = 700;

const newNoteId = () => `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const formatEditorDate = (ts: number) =>
  new Date(ts).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * iPhone "Notlar" benzeri tam ekran not editörü.
 * - Başlık ve gövde sayfa gibi geniş; yazdıkça otomatik kaydedilir (Kaydet düğmesi yok).
 * - Geri oku / "Bitti" ile çıkınca son hali kaydedilir; boş not kaydedilmez, boşaltılan not silinir.
 * - Satır başında "- " , "• " veya "1. " ile yazılan listeler Enter ile devam eder.
 */
export const PersonalNoteModal: React.FC<PersonalNoteModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  tags,
  onSaveNote,
  onDeleteNote,
  onOpenManageTags,
  voiceNotesEnabled = true,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [showTags, setShowTags] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);
  const [displayDate, setDisplayDate] = useState(Date.now());

  const idRef = useRef<string>('');
  const createdAtRef = useRef<number>(Date.now());
  const lastSavedRef = useRef<string>('');
  const hasStoredRef = useRef<boolean>(false); // not depoda var mı (düzenleme veya otomatik kayıt sonrası)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const closingRef = useRef(false);

  // En güncel değerler (zamanlayıcı içinde eski state okunmasın)
  const latest = useRef({ title, content, selectedTagIds, isPinned, isArchived });
  latest.current = { title, content, selectedTagIds, isPinned, isArchived };

  const snapshotOf = (v: typeof latest.current) =>
    JSON.stringify({
      t: v.title.trim(),
      c: v.content.replace(/\s+$/, ''),
      g: v.selectedTagIds,
      p: v.isPinned,
      a: v.isArchived,
    });

  // Sadece açılışta / farklı not seçildiğinde sıfırla (tags veya notes yenilenince formu ezme)
  useEffect(() => {
    if (!isOpen) return;
    closingRef.current = false;
    setShowTags(false);
    setShowMenu(false);
    setConfirmDelete(false);
    setCopied(false);
    setSaveState('idle');

    if (noteToEdit) {
      idRef.current = noteToEdit.id;
      createdAtRef.current = noteToEdit.createdAt;
      hasStoredRef.current = true;
      setTitle(noteToEdit.title || '');
      setContent(noteToEdit.content || '');
      setSelectedTagIds(noteToEdit.tagIds || []);
      setIsPinned(noteToEdit.isPinned);
      setIsArchived(noteToEdit.isArchived);
      setDisplayDate(noteToEdit.updatedAt || noteToEdit.createdAt);
      lastSavedRef.current = snapshotOf({
        title: noteToEdit.title || '',
        content: noteToEdit.content || '',
        selectedTagIds: noteToEdit.tagIds || [],
        isPinned: noteToEdit.isPinned,
        isArchived: noteToEdit.isArchived,
      });
    } else {
      idRef.current = newNoteId();
      createdAtRef.current = Date.now();
      hasStoredRef.current = false;
      lastSavedRef.current = '';
      const defaultTag = tags.find((t) => t.id === 'tag-not' || t.name.toLowerCase() === 'not');
      setTitle('');
      setContent('');
      setSelectedTagIds(defaultTag ? [defaultTag.id] : []);
      setIsPinned(false);
      setIsArchived(false);
      setDisplayDate(Date.now());
      setTimeout(() => titleRef.current?.focus(), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, noteToEdit?.id]);

  // Klavye açılınca ekran yüksekliğini görünen alana uydur (iPhone Safari)
  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setViewport({ height: vv.height, top: vv.offsetTop });
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [isOpen]);

  // Gövde alanı yazdıkça uzasın
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [content, isOpen]);

  const persist = useCallback(async (): Promise<boolean> => {
    const cur = latest.current;
    const snap = snapshotOf(cur);
    if (snap === lastSavedRef.current) return true;
    if (!cur.title.trim() && !cur.content.trim()) return true; // boş not kaydedilmez

    setSaveState('saving');
    try {
      const now = Date.now();
      await onSaveNote({
        id: idRef.current,
        title: cur.title.trim() || undefined,
        content: cur.content.replace(/\s+$/, ''),
        tagIds: cur.selectedTagIds,
        isPinned: cur.isPinned,
        isArchived: cur.isArchived,
        createdAt: createdAtRef.current,
        updatedAt: now,
      });
      lastSavedRef.current = snap;
      hasStoredRef.current = true;
      setDisplayDate(now);
      setSaveState('saved');
      return true;
    } catch (err) {
      console.error(err);
      setSaveState('error');
      return false;
    }
  }, [onSaveNote]);

  // Otomatik kayıt (yazmayı bırakınca)
  useEffect(() => {
    if (!isOpen) return;
    if (snapshotOf(latest.current) === lastSavedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      persist();
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, selectedTagIds, isPinned, isArchived, isOpen]);

  const handleClose = async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);

    const cur = latest.current;
    const isEmpty = !cur.title.trim() && !cur.content.trim();

    try {
      if (isEmpty) {
        // iPhone Notlar gibi: tamamen boşaltılan not silinir, hiç yazılmamış not kaydedilmez
        if (hasStoredRef.current && onDeleteNote) {
          await onDeleteNote(idRef.current);
        }
      } else {
        const ok = await persist();
        if (!ok) {
          closingRef.current = false; // kayıt başarısız: ekranda kal, yazılanlar kaybolmasın
          return;
        }
      }
    } catch (err) {
      console.error(err);
      closingRef.current = false;
      setSaveState('error');
      return;
    }
    onClose();
  };

  const handleDelete = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    closingRef.current = true;
    try {
      if (hasStoredRef.current && onDeleteNote) {
        await onDeleteNote(idRef.current);
      }
      onClose();
    } catch (err) {
      console.error(err);
      closingRef.current = false;
      setSaveState('error');
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const handleCopy = () => {
    const text = [title.trim(), content].filter(Boolean).join('\n\n');
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setShowMenu(false);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertAtLineStart = (prefix: string) => {
    const el = bodyRef.current;
    const pos = el ? el.selectionStart : content.length;
    const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
    const next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(next);
    setShowMenu(false);
    requestAnimationFrame(() => {
      if (!bodyRef.current) return;
      bodyRef.current.focus();
      const caret = pos + prefix.length;
      bodyRef.current.setSelectionRange(caret, caret);
    });
  };

  const handleBodyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleClose();
      return;
    }
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;

    const el = e.currentTarget;
    const pos = el.selectionStart;
    if (pos !== el.selectionEnd) return;

    const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
    const line = content.slice(lineStart, pos);
    const bullet = line.match(/^(\s*)([•\-–])\s(.*)$/);
    const numbered = line.match(/^(\s*)(\d+)\.\s(.*)$/);
    const match = bullet || numbered;
    if (!match) return;

    e.preventDefault();
    const rest = match[3];
    if (rest.trim() === '') {
      // Boş madde üzerinde Enter: listeyi bitir (maddeyi kaldır)
      const next = content.slice(0, lineStart) + content.slice(pos);
      setContent(next);
      requestAnimationFrame(() => bodyRef.current?.setSelectionRange(lineStart, lineStart));
      return;
    }
    const marker = bullet ? `${match[1]}${match[2]} ` : `${match[1]}${parseInt(match[2], 10) + 1}. `;
    const insert = `\n${marker}`;
    const next = content.slice(0, pos) + insert + content.slice(pos);
    setContent(next);
    requestAnimationFrame(() => {
      const caret = pos + insert.length;
      bodyRef.current?.setSelectionRange(caret, caret);
    });
  };

  // Kod etiketi seçiliyse eşit aralıklı yazı tipi
  const hasCodeTagSelected = selectedTagIds.some((id) => {
    const t = tags.find((tag) => tag.id === id);
    return t && (t.color === 'green' || t.name.toLowerCase().includes('kod'));
  });

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onClose, onSaveNote, onDeleteNote]);

  if (!isOpen) return null;

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));
  const hasText = !!(title.trim() || content.trim());

  return (
    <div
      className="fixed inset-x-0 z-50 flex flex-col bg-white dark:bg-slate-950 animate-in fade-in duration-150"
      style={{
        top: viewport ? `${viewport.top}px` : 0,
        height: viewport ? `${viewport.height}px` : '100dvh',
      }}
    >
      {/* Üst çubuk */}
      <div
        className="flex items-center justify-between gap-1 px-2 sm:px-4 border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)', paddingBottom: '0.5rem' }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center gap-0.5 pl-1 pr-2 py-1.5 rounded-xl text-teal-600 dark:text-teal-400 font-semibold text-[15px] active:opacity-60 transition"
        >
          <ChevronLeft className="w-6 h-6 -ml-1" />
          <span>Notlar</span>
        </button>

        <div className="flex items-center gap-0.5 relative">
          <button
            type="button"
            onClick={() => setIsPinned((p) => !p)}
            className={`p-2 rounded-xl transition active:scale-90 ${
              isPinned ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'
            }`}
            title={isPinned ? 'Sabitlemeyi kaldır' : 'Başa sabitle'}
          >
            <Pin className={`w-5 h-5 ${isPinned ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setShowTags((s) => !s);
              setShowMenu(false);
            }}
            className={`p-2 rounded-xl transition active:scale-90 ${
              showTags || selectedTagIds.length > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
            }`}
            title="Etiketler"
          >
            <Tag className="w-5 h-5" />
          </button>

          {voiceNotesEnabled && (
            <VoiceInputButton
              compact
              onInsertText={(transcript) => setContent((prev) => (prev ? `${prev} ${transcript}` : transcript))}
            />
          )}

          <button
            type="button"
            onClick={() => {
              setShowMenu((m) => !m);
              setShowTags(false);
            }}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 transition active:scale-90"
            title="Daha fazla"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="ml-1 px-3 py-1.5 rounded-xl text-[15px] font-bold text-teal-600 dark:text-teal-400 active:opacity-60 transition"
          >
            Bitti
          </button>

          {/* ⋯ menüsü */}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 text-sm">
                <button
                  type="button"
                  onClick={() => insertAtLineStart('• ')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <List className="w-4 h-4" />
                  <span>Madde işareti</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertAtLineStart('1. ')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ListOrdered className="w-4 h-4" />
                  <span>Numaralı liste</span>
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!hasText}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsArchived((a) => !a);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Archive className="w-4 h-4" />
                  <span>{isArchived ? 'Arşivden çıkar' : 'Arşivle'}</span>
                </button>
                {onDeleteNote && (hasStoredRef.current || noteToEdit) && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setConfirmDelete(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Notu sil</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Silme onayı */}
      {confirmDelete && (
        <div className="px-4 py-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3">
          <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">Bu not kalıcı olarak silinecek. Emin misiniz?</span>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
            >
              Evet, Sil
            </button>
          </div>
        </div>
      )}

      {/* Yazı alanı */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        onClick={(e) => {
          // Boş alana dokununca yazmaya devam et
          if (e.target === e.currentTarget) bodyRef.current?.focus();
        }}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
      >
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-4 min-h-full flex flex-col">
          <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 mb-3">
            {formatEditorDate(displayDate)}
            {saveState === 'saving' && ' • Kaydediliyor...'}
            {saveState === 'saved' && ' • Kaydedildi'}
            {saveState === 'error' && <span className="text-rose-500"> • Kaydedilemedi, tekrar denenecek</span>}
          </div>

          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                bodyRef.current?.focus();
              }
            }}
            placeholder="Başlık"
            enterKeyHint="next"
            className="w-full bg-transparent border-0 outline-none focus:ring-0 text-[26px] sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 py-1"
          />

          {/* Seçili etiketler */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1 mb-1">
              {selectedTags.map((tag) => {
                const conf = NOTE_TAG_COLORS[tag.color] || NOTE_TAG_COLORS.purple;
                return (
                  <span
                    key={tag.id}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${conf.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                    {tag.name}
                  </span>
                );
              })}
            </div>
          )}

          {/* Etiket seçici */}
          {showTags && (
            <div className="my-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Etiketler</span>
                {onOpenManageTags && (
                  <button
                    type="button"
                    onClick={onOpenManageTags}
                    className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Yeni etiket</span>
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
                          ? `${conf.badge} ring-2 ring-teal-500 font-bold`
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                      <span>{tag.name}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <textarea
            ref={bodyRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleBodyKeyDown}
            placeholder="Not yazın..."
            className={`w-full shrink-0 bg-transparent border-0 outline-none focus:ring-0 resize-none overflow-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 min-h-[55vh] pt-2 ${
              hasCodeTagSelected ? 'font-mono text-sm leading-6' : 'text-[17px] leading-[1.65]'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
