import React, { useState } from 'react';
import { X, Tag, Plus, Edit2, Trash2, Check, AlertCircle } from 'lucide-react';
import { PersonalNoteTag, NoteTagColor } from '../../types';
import { NOTE_TAG_COLORS, COLOR_OPTIONS } from '../../utils/noteUtils';

interface TagManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: PersonalNoteTag[];
  onSaveTag: (tag: PersonalNoteTag) => Promise<void>;
  onDeleteTag: (tagId: string) => Promise<void>;
}

export const TagManageModal: React.FC<TagManageModalProps> = ({
  isOpen,
  onClose,
  tags,
  onSaveTag,
  onDeleteTag,
}) => {
  const [editingTag, setEditingTag] = useState<PersonalNoteTag | null>(null);
  const [tagName, setTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteTagColor>('purple');
  const [tagToDelete, setTagToDelete] = useState<PersonalNoteTag | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingTag(null);
    setTagName('');
    setSelectedColor('purple');
    setError('');
  };

  const handleStartEdit = (tag: PersonalNoteTag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setSelectedColor(tag.color);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tagName.trim();
    if (!trimmed) {
      setError('Lütfen bir etiket adı yazın.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTag) {
        await onSaveTag({
          ...editingTag,
          name: trimmed,
          color: selectedColor,
        });
      } else {
        await onSaveTag({
          id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: trimmed,
          color: selectedColor,
        });
      }
      setEditingTag(null);
      setTagName('');
      setError('');
    } catch (err) {
      console.error(err);
      setError('Etiket kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;
    setIsSubmitting(true);
    try {
      await onDeleteTag(tagToDelete.id);
      setTagToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Etiketleri Yönet
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Notlarınız için renkli etiketler oluşturun ve düzenleyin
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

        {/* Form to add or edit */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40">
          <form onSubmit={handleSave} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {editingTag ? 'Etiketi Düzenle' : 'Yeni Etiket Ekle'}
              </span>
              {editingTag && (
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Vazgeç / Yeni Ekle
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={tagName}
                onChange={(e) => {
                  setTagName(e.target.value);
                  setError('');
                }}
                placeholder="Örn: Araştırma, Dokümantasyon..."
                maxLength={25}
                className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={isSubmitting || !tagName.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                {editingTag ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingTag ? 'Güncelle' : 'Ekle'}</span>
              </button>
            </div>

            {error && <p className="text-xs text-rose-500">{error}</p>}

            {/* Color selection row */}
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                Renk Seçimi:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((c) => {
                  const conf = NOTE_TAG_COLORS[c];
                  const isSelected = selectedColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition active:scale-95 ${conf.badge} ${
                        isSelected ? 'ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-slate-900 scale-105 shadow-xs font-bold' : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                      <span>{conf.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Existing tags list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Mevcut Etiketler ({tags.length})
          </div>

          {tags.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400">
              Henüz etiket bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tags.map((tag) => {
                const conf = NOTE_TAG_COLORS[tag.color] || NOTE_TAG_COLORS.purple;
                const isCurrentEdit = editingTag?.id === tag.id;

                return (
                  <div
                    key={tag.id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition ${
                      isCurrentEdit
                        ? 'border-purple-400 bg-purple-50/50 dark:bg-purple-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${conf.dot}`} />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {tag.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(tag)}
                        className="p-1 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTagToDelete(tag)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {tagToDelete && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-sm w-full text-center animate-in zoom-in-95">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mx-auto mb-3 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                "{tagToDelete.name}" Etiketini Sil?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Bu etiketi silerseniz <strong>notlarınız silinmez</strong>, sadece notlardaki bu etiket kaldırılır.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setTagToDelete(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs"
                >
                  Etiketi Sil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
