import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Heading, List, Image as ImageIcon, Trash2 } from 'lucide-react';
import { UniversityNote, UniversityNoteTag, UniversityCourse } from '../../types';
import { compressImageFile } from '../../utils/universityUtils';
import { VoiceInputButton } from '../common/VoiceInputButton';
import {
  NoteEditorShell,
  AutoGrowTextarea,
  NoteMetaCard,
  NoteMetaRow,
  NoteChipRow,
  noteChipClass,
  noteInputClass,
} from '../common/NoteEditorShell';

interface UniversityNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  termId: string;
  courseId: string;
  courseName: string;
  /** Verilirse modalda "Ders" seçici gösterilir ve not seçilen derse kaydedilir. */
  courses?: UniversityCourse[];
  noteToEdit?: UniversityNote | null;
  onSaveNote: (note: Partial<UniversityNote>) => Promise<void>;
  voiceNotesEnabled?: boolean;
}

const TAG_OPTIONS: Array<{ id: UniversityNoteTag; label: string }> = [
  { id: 'konu', label: 'Konu Notu' },
  { id: 'ozet', label: 'Özet' },
  { id: 'soru', label: 'Soru & Cevap' },
  { id: 'onemli', label: 'Önemli / Sınavda Çıkar' },
];

export const UniversityNoteModal: React.FC<UniversityNoteModalProps> = ({
  isOpen,
  onClose,
  termId,
  courseId,
  courseName,
  courses,
  noteToEdit,
  onSaveNote,
  voiceNotesEnabled = true,
}) => {
  const [title, setTitle] = useState(noteToEdit?.title || '');
  const [content, setContent] = useState(noteToEdit?.content || '');
  const [tag, setTag] = useState<UniversityNoteTag>(noteToEdit?.tag || 'konu');
  const [imageUrl, setImageUrl] = useState<string | undefined>(noteToEdit?.imageUrl);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState(noteToEdit?.courseId || courseId);
  const [openedAt, setOpenedAt] = useState(Date.now());

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const initialSnapRef = useRef<string>('');

  const snapshot = (v: { t: string; c: string; g: string; i?: string; k: string }) => JSON.stringify(v);

  // Modal sürekli bağlı kalabiliyor (ders detay sayfası); her açılışta / farklı not seçildiğinde formu sıfırla
  useEffect(() => {
    if (!isOpen) return;
    const init = {
      t: noteToEdit?.title || '',
      c: noteToEdit?.content || '',
      g: noteToEdit?.tag || 'konu',
      i: noteToEdit?.imageUrl,
      k: noteToEdit?.courseId || courseId,
    };
    setTitle(init.t);
    setContent(init.c);
    setTag(init.g as UniversityNoteTag);
    setImageUrl(init.i);
    setSelectedCourseId(init.k);
    setError(null);
    setOpenedAt(noteToEdit?.updatedAt || noteToEdit?.createdAt || Date.now());
    initialSnapRef.current = snapshot(init);
    if (!noteToEdit) setTimeout(() => bodyRef.current?.focus(), 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, noteToEdit?.id, courseId]);

  if (!isOpen) return null;

  const selectableCourses = courses && courses.length > 0 ? courses : null;
  const selectedCourse = selectableCourses?.find((c) => c.id === selectedCourseId);
  const effectiveCourseId = selectedCourse ? selectedCourse.id : courseId;
  const effectiveTermId = selectedCourse ? selectedCourse.termId : termId;
  const effectiveCourseName = selectedCourse ? selectedCourse.name : courseName;

  const handleFormatText = (prefix: string, suffix: string = '') => {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const replacement = `${prefix}${selected || 'metin'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 20);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      // Compress to maximum 1200px width/height and quality 0.75
      const compressedDataUrl = await compressImageFile(file, 1200, 0.75);
      setImageUrl(compressedDataUrl);
    } catch {
      setError('Fotoğraf eklenemedi, lütfen tekrar deneyin.');
    } finally {
      setIsCompressing(false);
    }
  };

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
      await onSaveNote({
        id: noteToEdit?.id,
        createdAt: noteToEdit?.createdAt, // düzenlemede oluşturulma tarihi sıfırlanmasın
        termId: effectiveTermId,
        courseId: effectiveCourseId,
        title: title.trim(),
        content: content.trim(),
        tag,
        imageUrl,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Not kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty =
    snapshot({ t: title, c: content, g: tag, i: imageUrl, k: selectedCourseId }) !== initialSnapRef.current;

  const dateText = new Date(openedAt).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatBtn =
    'p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition';

  return (
    <NoteEditorShell
      backLabel="Ders Notları"
      dateText={dateText}
      title={title}
      onTitleChange={setTitle}
      titlePlaceholder="Başlık"
      onTitleEnter={() => bodyRef.current?.focus()}
      isSaving={isSaving}
      isDirty={isDirty}
      canSave={!!title.trim() && !!content.trim() && !isCompressing}
      onSave={handleSubmit}
      onClose={onClose}
      error={error}
      onEmptyAreaClick={() => bodyRef.current?.focus()}
      headerActions={
        voiceNotesEnabled ? (
          <VoiceInputButton
            onInsertText={(transcript) => setContent((prev) => (prev ? `${prev} ${transcript}` : transcript))}
            compact
          />
        ) : undefined
      }
    >
      <NoteMetaCard>
        <NoteMetaRow label="Ders">
          {selectableCourses ? (
            <select
              value={effectiveCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className={`${noteInputClass} font-semibold cursor-pointer`}
            >
              {selectableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `${c.code} - ${c.name}` : c.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{effectiveCourseName}</span>
          )}
        </NoteMetaRow>
        <NoteMetaRow label="Etiket">
          <NoteChipRow>
            {TAG_OPTIONS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTag(t.id)} className={noteChipClass(tag === t.id)}>
                #{t.label}
              </button>
            ))}
          </NoteChipRow>
        </NoteMetaRow>
      </NoteMetaCard>

      {/* Biçimlendirme */}
      <div className="flex items-center gap-0.5 -ml-2 mb-1">
        <button type="button" onClick={() => handleFormatText('**', '**')} className={formatBtn} title="Kalın">
          <Bold className="w-[18px] h-[18px]" />
        </button>
        <button type="button" onClick={() => handleFormatText('*', '*')} className={formatBtn} title="İtalik">
          <Italic className="w-[18px] h-[18px]" />
        </button>
        <button type="button" onClick={() => handleFormatText('\n### ', '\n')} className={formatBtn} title="Başlık">
          <Heading className="w-[18px] h-[18px]" />
        </button>
        <button type="button" onClick={() => handleFormatText('\n- ')} className={formatBtn} title="Madde İşareti">
          <List className="w-[18px] h-[18px]" />
        </button>
        <label className={`${formatBtn} cursor-pointer flex items-center`} title="Fotoğraf Ekle">
          <ImageIcon className="w-[18px] h-[18px]" />
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
        {isCompressing && <span className="ml-2 text-[11px] text-teal-600 animate-pulse">Görsel optimize ediliyor...</span>}
      </div>

      <AutoGrowTextarea
        ref={bodyRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Not yazın... Kalın, italik, başlık ve madde işaretleri desteklenir."
      />

      {imageUrl && (
        <div className="relative mt-2 mb-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <img src={imageUrl} alt="Eklenen fotoğraf" className="w-full max-h-72 object-contain" />
          <button
            type="button"
            onClick={() => setImageUrl(undefined)}
            className="absolute top-2 right-2 p-2 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition"
            title="Fotoğrafı Kaldır"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </NoteEditorShell>
  );
};
