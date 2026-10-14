import React, { useState, useMemo, useEffect } from 'react';
import { 
  StickyNote, 
  Plus, 
  Search, 
  Filter, 
  Tag, 
  Pin, 
  Archive, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Sparkles, 
  ArrowUpDown, 
  Code2, 
  AlertCircle,
  X
} from 'lucide-react';
import { PersonalNote, PersonalNoteTag } from '../../types';
import { 
  NOTE_TAG_COLORS, 
  getNoteDisplayTitle, 
  getNoteContentPreview, 
  hasPromptTag, 
  hasCodeTag, 
  formatNoteDate 
} from '../../utils/noteUtils';
import { PersonalNoteModal } from './PersonalNoteModal';
import { TagManageModal } from './TagManageModal';

interface NotesViewProps {
  notes: PersonalNote[];
  tags: PersonalNoteTag[];
  onSaveNote: (note: PersonalNote) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onSaveTag: (tag: PersonalNoteTag) => Promise<void>;
  onDeleteTag: (tagId: string) => Promise<void>;
  voiceNotesEnabled?: boolean;
  initialSelectedNoteId?: string | null;
  onClearInitialSelectedNoteId?: () => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  tags,
  onSaveNote,
  onDeleteNote,
  onSaveTag,
  onDeleteTag,
  voiceNotesEnabled = true,
  initialSelectedNoteId,
  onClearInitialSelectedNoteId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'updated' | 'created'>('updated');
  const [showArchived, setShowArchived] = useState(false);

  // Modals state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<PersonalNote | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<PersonalNote | null>(null);

  // Copy feedback tracking
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Fast map of tags for lookup
  const tagsMap = useMemo(() => {
    const map = new Map<string, PersonalNoteTag>();
    for (const t of tags) {
      map.set(t.id, t);
    }
    return map;
  }, [tags]);

  // Open note if initialSelectedNoteId is provided (e.g. from global search)
  useEffect(() => {
    if (initialSelectedNoteId) {
      const targetNote = notes.find((n) => n.id === initialSelectedNoteId);
      if (targetNote) {
        setNoteToEdit(targetNote);
        setIsNoteModalOpen(true);
      }
      onClearInitialSelectedNoteId?.();
    }
  }, [initialSelectedNoteId, notes, onClearInitialSelectedNoteId]);

  // Handle multi-select tag filter chip toggle
  const toggleTagFilter = (tagId: string) => {
    setSelectedTagFilters((prev) => 
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const clearTagFilters = () => {
    setSelectedTagFilters([]);
  };

  // Filtered and sorted notes
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return notes.filter((note) => {
      // Archive filter
      if (!showArchived && note.isArchived) return false;
      if (showArchived && !note.isArchived) return false;

      // Tag filter
      if (selectedTagFilters.length > 0) {
        const hasMatchingTag = selectedTagFilters.some((filterId) => 
          note.tagIds && note.tagIds.includes(filterId)
        );
        if (!hasMatchingTag) return false;
      }

      // Search query filter
      if (q) {
        const titleMatch = (note.title || '').toLowerCase().includes(q);
        const contentMatch = (note.content || '').toLowerCase().includes(q);
        const tagMatch = (note.tagIds || []).some((id) => {
          const t = tagsMap.get(id);
          return t && t.name.toLowerCase().includes(q);
        });
        if (!titleMatch && !contentMatch && !tagMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      // Pinned notes always stay at top
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      // Then sort by chosen criterion
      if (sortBy === 'created') {
        return b.createdAt - a.createdAt;
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, showArchived, selectedTagFilters, searchQuery, tagsMap, sortBy]);

  // Copy note content
  const handleCopy = (e: React.MouseEvent, note: PersonalNote) => {
    e.stopPropagation();
    if (!note.content) return;
    navigator.clipboard.writeText(note.content);
    setCopiedNoteId(note.id);
    setTimeout(() => {
      setCopiedNoteId((current) => (current === note.id ? null : current));
    }, 2000);
  };

  // Toggle pin
  const handleTogglePin = async (e: React.MouseEvent, note: PersonalNote) => {
    e.stopPropagation();
    await onSaveNote({
      ...note,
      isPinned: !note.isPinned,
      updatedAt: Date.now(),
    });
  };

  // Toggle archive
  const handleToggleArchive = async (e: React.MouseEvent, note: PersonalNote) => {
    e.stopPropagation();
    await onSaveNote({
      ...note,
      isArchived: !note.isArchived,
      updatedAt: Date.now(),
    });
  };

  // Confirm delete note
  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    try {
      await onDeleteNote(noteToDelete.id);
      setNoteToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const archivedCount = useMemo(() => notes.filter((n) => n.isArchived).length, [notes]);
  const activeCount = useMemo(() => notes.filter((n) => !n.isArchived).length, [notes]);

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shadow-xs">
              <StickyNote className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  Notlar & Etiketler
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold">
                  {showArchived ? `${archivedCount} Arşivde` : `${activeCount} Not`}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI promptları, fikirler, kod parçaları ve renkli etiketli kişisel notlarınız
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsTagModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <Tag className="w-4 h-4 text-purple-600" />
              <span>Etiketleri Yönet</span>
            </button>

            <button
              onClick={() => {
                setNoteToEdit(null);
                setIsNoteModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Not</span>
            </button>
          </div>
        </div>

        {/* Search & Sort & Archive Toggle Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Not başlığı, içeriği veya etiket ara..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'updated' | 'created')}
                className="bg-transparent border-none text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="updated">Son Güncellenen</option>
                <option value="created">Oluşturma Tarihi</option>
              </select>
            </div>

            {/* Archive toggle button */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition active:scale-95 ${
                showArchived
                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{showArchived ? 'Arşiv Kapat' : 'Arşivi Göster'}</span>
              {archivedCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold">
                  {archivedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tag Filter Chips Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 flex-shrink-0 mr-1">
            <Filter className="w-3 h-3" />
            <span>Etiket:</span>
          </span>

          <button
            onClick={clearTagFilters}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex-shrink-0 ${
              selectedTagFilters.length === 0
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Tümü
          </button>

          {tags.map((tag) => {
            const isSelected = selectedTagFilters.includes(tag.id);
            const conf = NOTE_TAG_COLORS[tag.color] || NOTE_TAG_COLORS.purple;

            return (
              <button
                key={tag.id}
                onClick={() => toggleTagFilter(tag.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition flex-shrink-0 active:scale-95 ${
                  isSelected
                    ? `${conf.badge} ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-slate-900 font-bold shadow-xs`
                    : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                <span>{tag.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-3">
            <StickyNote className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
            {showArchived
              ? 'Arşivde not bulunamadı'
              : selectedTagFilters.length > 0 || searchQuery
              ? 'Filtrelere uygun not bulunamadı'
              : 'Henüz not eklenmedi'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {showArchived
              ? 'Daha önce arşivlediğiniz notlar burada görünür.'
              : selectedTagFilters.length > 0 || searchQuery
              ? 'Farklı bir arama terimi deneyin veya etiket filtrelerini sıfırlayın.'
              : 'AI promptlarınızı, SaaS fikirlerinizi, kod parçalarını veya toplantı notlarınızı hemen kaydedin.'}
          </p>

          {!showArchived && (
            <button
              onClick={() => {
                setNoteToEdit(null);
                setIsNoteModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Notu Ekle</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredNotes.map((note) => {
            const displayTitle = getNoteDisplayTitle(note);
            const contentPreview = getNoteContentPreview(note);
            const isPrompt = hasPromptTag(note, tagsMap);
            const isCode = hasCodeTag(note, tagsMap);
            const isCopied = copiedNoteId === note.id;

            // Note tags objects
            const noteTags = (note.tagIds || [])
              .map((id) => tagsMap.get(id))
              .filter(Boolean) as PersonalNoteTag[];

            return (
              <div
                key={note.id}
                onClick={() => {
                  setNoteToEdit(note);
                  setIsNoteModalOpen(true);
                }}
                className={`relative group rounded-3xl p-4 sm:p-5 transition-all duration-200 cursor-pointer border flex flex-col justify-between ${
                  note.isPinned
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-sm hover:shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-sm'
                }`}
              >
                {/* Card Top: Pinned Indicator, Title & Action Buttons */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {note.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                            <Pin className="w-3 h-3 fill-amber-500" />
                            <span>Sabitlendi</span>
                          </span>
                        )}

                        {note.isArchived && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                            <Archive className="w-3 h-3" />
                            <span>Arşivde</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                        {displayTitle}
                      </h3>
                    </div>

                    {/* Card Actions (Pin, Archive, Delete) */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(e, note)}
                        className={`p-1.5 rounded-xl transition ${
                          note.isPinned
                            ? 'text-amber-600 bg-amber-100/80 dark:bg-amber-950'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={note.isPinned ? 'Sabitlemeyi kaldır' : 'Başa sabitle'}
                      >
                        <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-500' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleArchive(e, note)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title={note.isArchived ? 'Arşivden çıkar' : 'Arşive kaldır'}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToDelete(note);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        title="Notu sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content Preview (Line-clamp-2) & Code-formatting for 'Kod' tag */}
                  <div className="my-2.5">
                    {isCode ? (
                      <div className="p-2.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs border border-slate-800/80 line-clamp-2 select-text leading-relaxed">
                        {contentPreview || note.content}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {contentPreview || note.content || '(İçerik boş)'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Tags, Date and Copy Button */}
                <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  {/* Tag badges */}
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {noteTags.length > 0 ? (
                      noteTags.map((tag) => {
                        const conf = NOTE_TAG_COLORS[tag.color] || NOTE_TAG_COLORS.purple;
                        return (
                          <span
                            key={tag.id}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border flex items-center gap-1 ${conf.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                            <span>{tag.name}</span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        Etiketsiz
                      </span>
                    )}
                  </div>

                  {/* Date & Copy Button */}
                  <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {formatNoteDate(sortBy === 'created' ? note.createdAt : note.updatedAt)}
                    </span>

                    {/* Copy Button (Specially highlighted for "Prompt" tag) */}
                    {isPrompt ? (
                      <button
                        type="button"
                        onClick={(e) => handleCopy(e, note)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-xs ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                        }`}
                        title="AI Prompt Metnini Kopyala"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Kopyalandı!' : "Prompt'u Kopyala"}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleCopy(e, note)}
                        className={`p-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1 active:scale-95 ${
                          isCopied
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                        }`}
                        title="İçeriği Kopyala"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isCopied ? 'Kopyalandı' : 'Kopyala'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mx-auto mb-3 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Notu Silmek İstediğinize Emin misiniz?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
              "{getNoteDisplayTitle(noteToDelete)}" başlıklı not kalıcı olarak silinecektir.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Note Edit / Add Modal */}
      <PersonalNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setNoteToEdit(null);
        }}
        noteToEdit={noteToEdit}
        tags={tags}
        onSaveNote={onSaveNote}
        onDeleteNote={onDeleteNote}
        onOpenManageTags={() => setIsTagModalOpen(true)}
        voiceNotesEnabled={voiceNotesEnabled}
      />

      {/* Tag Management Modal */}
      <TagManageModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        tags={tags}
        onSaveTag={onSaveTag}
        onDeleteTag={onDeleteTag}
      />
    </div>
  );
};
