import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Trash2, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Check, 
  Mic,
  Tag,
  User,
  FileText
} from 'lucide-react';
import { Student, StudentNote, NoteCategory, SchoolNoteTag } from '../../types';
import { ALL_SCHOOL_NOTE_TAGS, SCHOOL_NOTE_TAGS, getSchoolNoteTag } from '../../utils/schoolNoteUtils';
import { VoiceInputButton } from '../common/VoiceInputButton';

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

  useEffect(() => {
    if (isOpen) {
      if (noteToEdit) {
        setTitle(noteToEdit.title || '');
        setSelectedStudentId(noteToEdit.studentId || '');
        setTag(getSchoolNoteTag(noteToEdit));
        setDate(noteToEdit.date);
        setTime(noteToEdit.time || '');
        setContent(noteToEdit.content);
        setPhotoUrl(noteToEdit.photoUrl || null);
      } else {
        setTitle('');
        setSelectedStudentId(targetStudentId || '');
        setTag('ogrenci');
        const now = new Date();
        setDate(toLocalISODate(now));
        setTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        );
        setContent('');
        setPhotoUrl(null);
      }
      setError(null);

      // Focus textarea or title
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
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
        const needSpace =
          prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const currentStudent = selectedStudentId 
    ? students.find((s) => s.id === selectedStudentId) 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>{noteToEdit ? 'Okul Notunu Düzenle' : 'Yeni Okul Notu Ekle'}</span>
              {autoStartVoice && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 flex items-center gap-1">
                  <Mic className="w-3 h-3 text-teal-600" /> Sesli Giriş
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Öğrenci, veli, etkinlik veya malzeme notu
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Başlık (İsteğe bağlı, boşsa ilk satır sayılır) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Not Başlığı</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Boşsa ilk satır başlık sayılır</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: 23 Nisan Gösteri Planı (İsteğe bağlı)"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
            />
          </div>

          {/* Etiket Seçimi (öğrenci, veli, etkinlik, malzeme, diğer) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Etiket</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_SCHOOL_NOTE_TAGS.map((tagKey) => {
                const meta = SCHOOL_NOTE_TAGS[tagKey];
                const isSelected = tag === tagKey;

                return (
                  <button
                    key={tagKey}
                    type="button"
                    onClick={() => setTag(tagKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border touch-manipulation active:scale-95 ${
                      isSelected
                        ? `${meta.badgeClass} ring-2 ring-teal-500/30 shadow-xs font-bold`
                        : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                    <span>{meta.label}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Öğrenci Bağlama (İSTEĞE BAĞLI) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Öğrenci Bağla</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">İsteğe bağlı</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
            >
              <option value="">— Öğrenci seçilmedi (Genel okul notu) —</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.group ? `(${st.group})` : ''}
                </option>
              ))}
            </select>
            {currentStudent?.healthAlert && (
              <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3 h-3" />
                <span>Sağlık Uyarısı: {currentStudent.healthAlert}</span>
              </p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Tarih *</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Saat</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Note Content + Voice Input Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Not İçeriği <span className="text-teal-600 font-bold">*</span>
              </label>

              {/* Voice Input Microphone Button */}
              {voiceNotesEnabled && (
                <VoiceInputButton
                  onInsertText={handleInsertVoiceText}
                  enabled={voiceNotesEnabled}
                />
              )}
            </div>

            <textarea
              ref={textareaRef}
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Notunuzu buraya yazın veya ses butonuna basarak dikte edin..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Photo Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Fotoğraf Ekle (İsteğe bağlı)
            </label>

            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 group bg-slate-900/5">
                <img
                  src={photoUrl}
                  alt="Önizleme"
                  className="w-full h-44 object-cover"
                />
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
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 text-slate-600 dark:text-slate-300 text-xs font-medium cursor-pointer transition"
                >
                  <Camera className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Fotoğraf Çek veya Galeriden Seç</span>
                </label>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-sm font-semibold shadow-md shadow-teal-700/20 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Kaydediliyor...' : noteToEdit ? 'Notu Güncelle' : 'Notu Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
