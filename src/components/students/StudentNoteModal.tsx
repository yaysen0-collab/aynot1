import React, { useState, useEffect, useRef } from 'react';
import { Camera, Trash2, Check, Mic, AlertTriangle } from 'lucide-react';
import { Student, StudentNote, NoteCategory, SchoolNoteTag } from '../../types';
import { ALL_SCHOOL_NOTE_TAGS, SCHOOL_NOTE_TAGS, getSchoolNoteTag } from '../../utils/schoolNoteUtils';
import { VoiceInputButton } from '../common/VoiceInputButton';
import {
  NoteEditorShell,
  AutoGrowTextarea,
  NoteMetaCard,
  NoteMetaRow,
  NoteChipRow,
  noteInputClass,
} from '../common/NoteEditorShell';
import { toLocalISODate } from '../../utils/calendar';

interface StudentNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: Partial<StudentNote>) => Promise<void>;
  noteToEdit?: StudentNote | null;
  targetStudentId?: string | null;
  students: Student[];
  voiceNotesEnabled?: boolean;
  autoStartVoice?: boolean;
}

const nowTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export const StudentNoteModal: React.FC<StudentNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  noteToEdit,
  targetStudentId,
  students,
  voiceNotesEnabled = true,
  autoStartVoice = false,
}) => {
  const [title, setTitle] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [tag, setTag] = useState<SchoolNoteTag>('ogrenci');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialSnapRef = useRef<string>('');

  const snapshot = (v: {
    title: string;
    studentId: string;
    tag: string;
    date: string;
    time: string;
    content: string;
    photo: string | null;
  }) => JSON.stringify(v);

  useEffect(() => {
    if (!isOpen) return;
    const now = new Date();
    const init = noteToEdit
      ? {
          title: noteToEdit.title || '',
          studentId: noteToEdit.studentId || '',
          tag: getSchoolNoteTag(noteToEdit) as string,
          date: noteToEdit.date,
          time: noteToEdit.time || '',
          content: noteToEdit.content,
          photo: noteToEdit.photoUrl || null,
        }
      : {
          title: '',
          studentId: targetStudentId || '',
          tag: 'ogrenci',
          date: toLocalISODate(now),
          time: nowTime(now),
          content: '',
          photo: null as string | null,
        };

    setTitle(init.title);
    setSelectedStudentId(init.studentId);
    setTag(init.tag as SchoolNoteTag);
    setDate(init.date);
    setTime(init.time);
    setContent(init.content);
    setPhotoUrl(init.photo);
    setError(null);
    initialSnapRef.current = snapshot(init);

    // Yeni notta doğrudan yazmaya başla (iPhone gibi); düzenlemede klavye kendiliğinden açılmasın
    if (!noteToEdit) setTimeout(() => textareaRef.current?.focus(), 150);
  }, [isOpen, noteToEdit, targetStudentId]);

  if (!isOpen) return null;

  // Insert dictated text at cursor position or append cleanly
  const handleInsertVoiceText = (dictatedText: string) => {
    if (!dictatedText) return;

    setContent((prev) => {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart ?? prev.length;
        const end = textarea.selectionEnd ?? prev.length;
        const before = prev.slice(0, start);
        const after = prev.slice(end);

        const needSpace =
          before.length > 0 &&
          !before.endsWith(' ') &&
          !before.endsWith('\n') &&
          !dictatedText.startsWith(' ') &&
          !dictatedText.startsWith('\n');

        const insert = (needSpace ? ' ' : '') + dictatedText;
        const updated = before + insert + after;

        setTimeout(() => {
          if (textareaRef.current) {
            const newPos = start + insert.length;
            textareaRef.current.selectionStart = newPos;
            textareaRef.current.selectionEnd = newPos;
            textareaRef.current.focus();
          }
        }, 0);

        return updated;
      } else {
        const needSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
        return prev + (needSpace ? ' ' : '') + dictatedText;
      }
    });
  };

  // Compress / read uploaded image
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Lütfen geçerli bir resim dosyası seçin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setPhotoUrl(compressedDataUrl);
          setError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Lütfen not içeriğini yazınız.');
      return;
    }
    if (!date) {
      setError('Lütfen tarih seçiniz.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Map tag to category for backwards compatibility
    let legacyCat: NoteCategory = 'diger';
    if (tag === 'veli') legacyCat = 'veli_gorusmesi';
    else if (tag === 'ogrenci') legacyCat = 'gelisim';

    try {
      await onSave({
        title: title.trim() || undefined,
        studentId: selectedStudentId ? selectedStudentId : undefined,
        tag,
        category: legacyCat,
        date,
        time: time.trim() || undefined,
        content: content.trim(),
        photoUrl: photoUrl || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Not kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStudent = selectedStudentId ? students.find((s) => s.id === selectedStudentId) : null;

  const isDirty =
    snapshot({
      title,
      studentId: selectedStudentId,
      tag,
      date,
      time,
      content,
      photo: photoUrl,
    }) !== initialSnapRef.current;

  const dateText = date
    ? new Date(`${date}T${time || '00:00'}`).toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
      })
    : undefined;

  return (
    <NoteEditorShell
      backLabel="Okul"
      dateText={dateText}
      title={title}
      onTitleChange={setTitle}
      titlePlaceholder="Başlık"
      onTitleEnter={() => textareaRef.current?.focus()}
      autoFocusTitle={false}
      isSaving={isSubmitting}
      isDirty={isDirty}
      canSave={!!content.trim() && !!date}
      onSave={handleSubmit}
      onClose={onClose}
      error={error}
      onEmptyAreaClick={() => textareaRef.current?.focus()}
      headerActions={
        voiceNotesEnabled ? (
          <VoiceInputButton onInsertText={handleInsertVoiceText} enabled={voiceNotesEnabled} compact />
        ) : undefined
      }
    >
      {autoStartVoice && (
        <div className="mb-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
            <Mic className="w-3 h-3 text-teal-600" /> Sesli Giriş
          </span>
        </div>
      )}

      <NoteMetaCard>
        <NoteMetaRow label="Etiket">
          <NoteChipRow>
            {ALL_SCHOOL_NOTE_TAGS.map((tagKey) => {
              const meta = SCHOOL_NOTE_TAGS[tagKey];
              const isSelected = tag === tagKey;
              return (
                <button
                  key={tagKey}
                  type="button"
                  onClick={() => setTag(tagKey)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition flex items-center gap-1.5 border active:scale-95 ${
                    isSelected
                      ? `${meta.badgeClass} ring-2 ring-teal-500/40 font-bold`
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                  <span>{meta.label}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              );
            })}
          </NoteChipRow>
        </NoteMetaRow>

        <NoteMetaRow label="Öğrenci">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className={`${noteInputClass} cursor-pointer`}
          >
            <option value="">Seçilmedi (genel okul notu)</option>
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} {st.group ? `(${st.group})` : ''}
              </option>
            ))}
          </select>
        </NoteMetaRow>

        <NoteMetaRow label="Tarih">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${noteInputClass} flex-1`}
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`${noteInputClass} w-24 text-right`}
            />
          </div>
        </NoteMetaRow>
      </NoteMetaCard>

      {currentStudent?.healthAlert && (
        <p className="mb-1 text-[12px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Sağlık Uyarısı: {currentStudent.healthAlert}</span>
        </p>
      )}

      <AutoGrowTextarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Not yazın veya sağ üstteki mikrofonla dikte edin..."
      />

      {/* Fotoğraf */}
      <div className="mt-2 pb-4">
        {photoUrl ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900/5">
            <img src={photoUrl} alt="Önizleme" className="w-full max-h-72 object-cover" />
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute top-2 right-2 p-2 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 active:scale-95 transition"
              title="Fotoğrafı Kaldır"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="note-photo-input"
            />
            <label
              htmlFor="note-photo-input"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium cursor-pointer active:scale-95 transition"
            >
              <Camera className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Fotoğraf Çek veya Galeriden Seç</span>
            </label>
          </div>
        )}
      </div>
    </NoteEditorShell>
  );
};
