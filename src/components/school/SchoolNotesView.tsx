import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  X, 
  Tag, 
  User, 
  Calendar, 
  Clock, 
  Edit3, 
  Trash2, 
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Student, StudentNote, SchoolNoteTag } from '../../types';
import { 
  ALL_SCHOOL_NOTE_TAGS, 
  SCHOOL_NOTE_TAGS, 
  getSchoolNoteTag, 
  getSchoolNoteTagMeta, 
  getSchoolNoteTitle 
} from '../../utils/schoolNoteUtils';
import { normalizeTurkish } from '../../services/searchService';
import { PhotoLightboxModal } from '../students/PhotoLightboxModal';

interface SchoolNotesViewProps {
  notes: StudentNote[];
  students: Student[];
  onAddNewNote: () => void;
  onEditNote: (note: StudentNote) => void;
  onDeleteNote: (noteId: string) => void;
  onSelectStudent?: (studentId: string) => void;
  initialSelectedNoteId?: string | null;
  onClearInitialSelectedNoteId?: () => void;
}

export const SchoolNotesView: React.FC<SchoolNotesViewProps> = ({
  notes,
  students,
  onAddNewNote,
  onEditNote,
  onDeleteNote,
  onSelectStudent,
  initialSelectedNoteId,
  onClearInitialSelectedNoteId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<SchoolNoteTag | 'all'>('all');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
  const [lightboxPhotoUrl, setLightboxPhotoUrl] = useState<string | null>(null);

  // Student map for fast lookup
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    for (const s of students) {
      map.set(s.id, s);
    }
    return map;
  }, [students]);

  // Tag counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notes.length };
    for (const t of ALL_SCHOOL_NOTE_TAGS) {
      counts[t] = 0;
    }
    for (const n of notes) {
      const tag = getSchoolNoteTag(n);
      counts[tag] = (counts[tag] || 0) + 1;
    }
    return counts;
  }, [notes]);

  // Filtered and sorted notes (newest first)
  const filteredNotes = useMemo(() => {
    const normQ = normalizeTurkish(searchQuery);

    return notes
      .filter((n) => {
        const noteTag = getSchoolNoteTag(n);

        // Tag filter
        if (selectedTag !== 'all' && noteTag !== selectedTag) {
          return false;
        }

        // Student filter
        if (selectedStudentFilter !== 'all') {
          if (selectedStudentFilter === 'unlinked') {
            if (n.studentId) return false;
          } else if (n.studentId !== selectedStudentFilter) {
            return false;
          }
        }

        // Search query
        if (normQ) {
          const title = normalizeTurkish(n.title || '');
          const content = normalizeTurkish(n.content);
          const studentName = n.studentId && studentMap.get(n.studentId)
            ? normalizeTurkish(studentMap.get(n.studentId)!.name)
            : '';
          const tagLabel = normalizeTurkish(SCHOOL_NOTE_TAGS[noteTag]?.label || '');

          return (
            title.includes(normQ) ||
            content.includes(normQ) ||
            studentName.includes(normQ) ||
            tagLabel.includes(normQ)
          );
        }

        return true;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [notes, selectedTag, selectedStudentFilter, searchQuery, studentMap]);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Header & Fast Add */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>Okul Notları</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {notes.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Öğrenciler, veliler, etkinlikler ve sınıf kayıtları
          </p>
        </div>

        <button
          onClick={onAddNewNote}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Not Ekle</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Not başlığı, içerik veya öğrenci ara..."
          className="w-full pl-9 pr-9 py-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Etiketler Filtreleme Çipleri (öğrenci, veli, etkinlik, malzeme, diğer) */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        <button
          onClick={() => setSelectedTag('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition touch-manipulation ${
            selectedTag === 'all'
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Tümü ({tagCounts.all || 0})
        </button>

        {ALL_SCHOOL_NOTE_TAGS.map((t) => {
          const meta = SCHOOL_NOTE_TAGS[t];
          const isSelected = selectedTag === t;
          const count = tagCounts[t] || 0;

          return (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition touch-manipulation flex items-center gap-1.5 ${
                isSelected
                  ? `${meta.badgeClass} ring-2 ring-teal-500/30 font-bold shadow-xs`
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
              <span>{meta.label}</span>
              <span className="text-[10px] opacity-75 font-semibold">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Öğrenciye Göre Ek Filtre (Varsa) */}
      {students.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Öğrenci:
          </span>
          <select
            value={selectedStudentFilter}
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">Tüm Öğrenciler / Genel Notlar</option>
            <option value="unlinked">Sadece Genel Notlar (Öğrenciye bağlı olmayan)</option>
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} {st.group ? `(${st.group})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
          <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {searchQuery || selectedTag !== 'all' || selectedStudentFilter !== 'all'
              ? 'Filtreye uygun okul notu bulunamadı.'
              : 'Henüz okul notu eklenmemiş.'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
            {searchQuery || selectedTag !== 'all' || selectedStudentFilter !== 'all'
              ? 'Filtreleri veya arama kutusunu temizleyerek tekrar deneyebilirsiniz.'
              : 'Öğrenci gözlemleri, veli görüşmeleri, etkinlikler veya sınıf malzemeleri için hızlıca not ekleyin.'}
          </p>
          <button
            onClick={onAddNewNote}
            className="mt-4 px-4 py-2 rounded-2xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition"
          >
            İlk Notu Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNotes.map((note) => {
            const noteTag = getSchoolNoteTag(note);
            const tagMeta = getSchoolNoteTagMeta(noteTag);
            const displayTitle = getSchoolNoteTitle(note);
            const linkedStudent = note.studentId ? studentMap.get(note.studentId) : null;
            const isHighlighted = initialSelectedNoteId === note.id;

            return (
              <div
                key={note.id}
                className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border transition shadow-xs group ${
                  isHighlighted
                    ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Header row: Title + Tag badge + Date */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${tagMeta.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${tagMeta.dotColor}`} />
                        <span>{tagMeta.label}</span>
                      </span>

                      {/* Linked student badge if any */}
                      {linkedStudent && (
                        <button
                          type="button"
                          onClick={() => onSelectStudent?.(linkedStudent.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-950/70 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 transition"
                          title="Öğrencinin detaylarına git"
                        >
                          <User className="w-3 h-3" />
                          <span className="font-semibold">{linkedStudent.name}</span>
                          {linkedStudent.group && (
                            <span className="text-[10px] text-slate-400">({linkedStudent.group})</span>
                          )}
                        </button>
                      )}

                      <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto">
                        <Calendar className="w-3 h-3" />
                        <span>{note.date}</span>
                        {note.time && (
                          <>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>{note.time}</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-2">
                      {displayTitle}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditNote(note)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Notu Düzenle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Notu Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>

                {/* Photo Thumbnail if attached */}
                {note.photoUrl && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setLightboxPhotoUrl(note.photoUrl!)}
                      className="inline-block relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:opacity-95 transition"
                    >
                      <img
                        src={note.photoUrl}
                        alt="Ekli Görsel"
                        className="h-28 w-auto max-w-xs object-cover rounded-2xl"
                      />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxPhotoUrl && (
        <PhotoLightboxModal
          photoUrl={lightboxPhotoUrl}
          onClose={() => setLightboxPhotoUrl(null)}
        />
      )}
    </div>
  );
};
