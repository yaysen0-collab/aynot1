import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bold, 
  Italic, 
  Heading, 
  List, 
  Image as ImageIcon, 
  Mic, 
  Tag, 
  Trash2, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { UniversityNote, UniversityNoteTag, UniversityCourse } from '../../types';
import { compressImageFile } from '../../utils/universityUtils';
import { VoiceInputButton } from '../common/VoiceInputButton';

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

const TAG_OPTIONS: Array<{ id: UniversityNoteTag; label: string; color: string }> = [
  { id: 'konu', label: 'Konu Notu', color: 'indigo' },
  { id: 'ozet', label: 'Özet', color: 'teal' },
  { id: 'soru', label: 'Soru & Cevap', color: 'amber' },
  { id: 'onemli', label: 'Önemli / Sınavda Çıkar', color: 'rose' },
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
  const [selectedCourseId, setSelectedCourseId] = useState(noteToEdit?.courseId || courseId);

  // Modal sürekli bağlı kalabiliyor (ders detay sayfası); her açılışta / farklı not seçildiğinde formu sıfırla
  useEffect(() => {
    if (!isOpen) return;
    setTitle(noteToEdit?.title || '');
    setContent(noteToEdit?.content || '');
    setTag(noteToEdit?.tag || 'konu');
    setImageUrl(noteToEdit?.imageUrl);
    setSelectedCourseId(noteToEdit?.courseId || courseId);
  }, [isOpen, noteToEdit?.id, courseId]);

  if (!isOpen) return null;

  const selectableCourses = courses && courses.length > 0 ? courses : null;
  const selectedCourse = selectableCourses?.find((c) => c.id === selectedCourseId);
  const effectiveCourseId = selectedCourse ? selectedCourse.id : courseId;
  const effectiveTermId = selectedCourse ? selectedCourse.termId : termId;
  const effectiveCourseName = selectedCourse ? selectedCourse.name : courseName;

  const handleFormatText = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('univ-note-content-area') as HTMLTextAreaElement;
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
      // ignore
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              {effectiveCourseName}
            </span>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {noteToEdit ? 'Ders Notunu Düzenle' : 'Yeni Ders Notu Ekle'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {/* Ders seçici */}
          {selectableCourses && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ders <span className="text-rose-500">*</span>
              </label>
              <select
                value={effectiveCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                {selectableCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code ? `${c.code} - ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Not Başlığı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="örn. 3. Ünite: SQL Join Türleri ve İndeksler"
              required
              className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Etiket
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTag(t.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition active:scale-95 text-[11px] ${
                    tag === t.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  #{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center flex-wrap gap-1 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleFormatText('**', '**')}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="Kalın"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatText('*', '*')}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="İtalik"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatText('\n### ', '\n')}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="Başlık"
            >
              <Heading className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatText('\n- ')}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="Madde İşareti"
            >
              <List className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />

            {/* Image upload */}
            <label className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              <span className="text-[10px] font-medium hidden sm:inline">Fotoğraf Ekle</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {/* Voice typing */}
            {voiceNotesEnabled && (
              <div className="ml-auto">
                <VoiceInputButton
                  onInsertText={(transcript) => {
                    setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
                  }}
                  compact
                />
              </div>
            )}
          </div>

          {/* Content Area */}
          <div>
            <textarea
              id="univ-note-content-area"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Notlarınızı buraya yazın... Kalın, italik, başlık ve madde işaretleri desteklenir."
              required
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 leading-relaxed font-sans focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Uploaded Image Preview */}
          {imageUrl && (
            <div className="relative p-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 inline-block">
              <img
                src={imageUrl}
                alt="Eklenen fotoğraf"
                className="max-h-36 rounded-xl object-contain"
              />
              <button
                type="button"
                onClick={() => setImageUrl(undefined)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition"
                title="Fotoğrafı Kaldır"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isCompressing && (
            <div className="text-[11px] text-indigo-600 animate-pulse">
              Görsel boyutu otomatik optimize ediliyor...
            </div>
          )}

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim() || !content.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <span>{noteToEdit ? 'Güncelle' : 'Kaydet'}</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
