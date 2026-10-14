import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  AlertTriangle, 
  Plus, 
  Calendar, 
  Edit3, 
  Trash2, 
  Camera, 
  User, 
  Filter, 
  ExternalLink,
  PhoneCall,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock
} from 'lucide-react';
import { Student, StudentNote, NoteCategory, WeeklyCallSession } from '../../types';
import { NOTE_CATEGORIES, getCategoryMeta } from '../../utils/categories';
import { PhotoLightboxModal } from './PhotoLightboxModal';

interface StudentDetailViewProps {
  student: Student;
  notes: StudentNote[];
  callSessions?: WeeklyCallSession[];
  onBack: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onAddNote: (studentId: string) => void;
  onEditNote: (note: StudentNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  student,
  notes,
  callSessions = [],
  onBack,
  onEditStudent,
  onDeleteStudent,
  onAddNote,
  onEditNote,
  onDeleteNote,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Age calculation if birthDate is provided
  const calculateAge = (bDateStr?: string) => {
    if (!bDateStr) return null;
    const bDate = new Date(bDateStr);
    if (isNaN(bDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - bDate.getFullYear();
    const m = today.getMonth() - bDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} yaşında` : null;
  };

  const ageText = calculateAge(student.birthDate);

  // Filter notes
  const filteredNotes = selectedCategory === 'all'
    ? notes
    : notes.filter((n) => n.category === selectedCategory);

  // Extract weekly call history for this student
  const studentCallHistory = useMemo(() => {
    const list: Array<{
      sessionId: string;
      date: string;
      called: boolean;
      calledAt?: string;
      notes?: string;
      excluded: boolean;
    }> = [];

    for (const session of callSessions) {
      const item = session.items.find((i) => i.studentId === student.id);
      if (item) {
        list.push({
          sessionId: session.id,
          date: session.weekDate,
          called: item.called,
          calledAt: item.calledAt,
          notes: item.notes,
          excluded: item.excluded,
        });
      }
    }

    // Sort newest date first
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [callSessions, student.id]);

  const handleDeleteStudentConfirm = () => {
    if (
      window.confirm(
        `"${student.name}" adlı öğrenciyi ve bu öğrenciye ait tüm ${notes.length} adet notu silmek istediğinize emin misiniz?`
      )
    ) {
      onDeleteStudent(student.id);
    }
  };

  const handleDeleteNoteConfirm = (note: StudentNote) => {
    if (window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
      onDeleteNote(note.id);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top Bar with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Öğrenci Listesine Dön</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEditStudent(student)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1 transition"
            title="Öğrenci Bilgilerini Düzenle"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Düzenle</span>
          </button>
          <button
            onClick={handleDeleteStudentConfirm}
            className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium flex items-center gap-1 transition"
            title="Öğrenciyi Sil"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Sil</span>
          </button>
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-teal-700/20 flex-shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
                  {student.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {student.group}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                {student.birthDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{student.birthDate} {ageText && `(${ageText})`}</span>
                  </span>
                )}
                <span>• {notes.length} Kayıtlı Not</span>
              </div>
            </div>
          </div>

          {/* Veli Hızlı Arama Butonu */}
          {student.parentPhone && (
            <div className="flex items-center gap-2 sm:self-center">
              <a
                href={`tel:${student.parentPhone.replace(/\s+/g, '')}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>Veliyi Ara ({student.parentName || 'Veli'})</span>
              </a>
            </div>
          )}
        </div>

        {/* Veli Bilgi Satırı */}
        {(student.parentName || student.parentPhone) && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 dark:text-slate-300">
            {student.parentName && (
              <div>
                <span className="text-slate-400">Veli: </span>
                <span className="font-medium">{student.parentName}</span>
              </div>
            )}
            {student.parentPhone && (
              <div>
                <span className="text-slate-400">Telefon: </span>
                <a
                  href={`tel:${student.parentPhone.replace(/\s+/g, '')}`}
                  className="font-medium text-teal-600 dark:text-teal-400 underline underline-offset-2"
                >
                  {student.parentPhone}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Alerji & Sağlık Uyarısı Vurgu Kutusu */}
        {student.healthAlert && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-800 dark:text-rose-300">
                Sağlık & Alerji Uyarısı
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-200/90 mt-0.5 leading-relaxed font-medium">
                {student.healthAlert}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* HAFTALIK VELİ ARAMA GEÇMİŞİ (Dedicated Parent Call History for this student) */}
      {studentCallHistory.length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Veli Arama Geçmişi ({studentCallHistory.length} Hafta)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Haftalık aramalarda veliyle yapılan görüşmeler
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {studentCallHistory.map((item) => (
              <div
                key={item.sessionId}
                className={`p-3 rounded-2xl border text-xs ${
                  item.excluded
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                    : item.called
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                    : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.excluded ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                        O Hafta Muaf
                      </span>
                    ) : item.called ? (
                      <span className="flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>Arandı {item.calledAt && `(${item.calledAt})`}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Aranamadı</span>
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-xs font-medium">{item.date}</span>
                </div>

                {item.notes && (
                  <p className="mt-1.5 text-slate-700 dark:text-slate-300 italic flex items-start gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>"{item.notes}"</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Öğrenci Not Akışı ({filteredNotes.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tarihli gözlemler, davranış ve veli görüşmeleri
          </p>
        </div>
        <button
          onClick={() => onAddNote(student.id)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Not Ekle</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition touch-manipulation ${
            selectedCategory === 'all'
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          Tümü ({notes.length})
        </button>

        {(Object.keys(NOTE_CATEGORIES) as NoteCategory[]).map((catKey) => {
          const meta = NOTE_CATEGORIES[catKey];
          const count = notes.filter((n) => n.category === catKey).length;
          const isSelected = selectedCategory === catKey;

          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition touch-manipulation ${
                isSelected
                  ? `${meta.badgeBg} ${meta.badgeText} border border-teal-500 font-semibold shadow-sm`
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {meta.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Notes Timeline List */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {selectedCategory === 'all'
              ? 'Bu öğrenci için henüz not eklenmemiş.'
              : 'Seçili kategoride henüz not bulunmuyor.'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Gelişim ve gözlemleri kaydetmek için yukarıdaki "+ Not Ekle" butonuna dokunun.
          </p>
          <button
            onClick={() => onAddNote(student.id)}
            className="mt-4 px-4 py-2 rounded-2xl bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition"
          >
            Hemen Not Yaz
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const meta = getCategoryMeta(note.category || 'diger');

            return (
              <div
                key={note.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700 space-y-3"
              >
                {/* Note Header: Category badge + Date + Edit/Delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{note.date} {note.time && `• ${note.time}`}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditNote(note)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Notu Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNoteConfirm(note)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Notu Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Note Title if present */}
                {note.title && (
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    {note.title}
                  </h4>
                )}

                {/* Note Content */}
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>

                {/* Attached Photo Thumbnail */}
                {note.photoUrl && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setActivePhotoUrl(note.photoUrl || null)}
                      className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-w-xs group cursor-pointer block text-left"
                    >
                      <img
                        src={note.photoUrl}
                        alt="Not Görseli"
                        className="w-full h-36 object-cover group-hover:scale-102 transition duration-200"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium">
                        Büyütmek için dokunun
                      </div>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox photo modal */}
      <PhotoLightboxModal
        photoUrl={activePhotoUrl}
        onClose={() => setActivePhotoUrl(null)}
        title={`${student.name} - Not Fotoğrafı`}
      />
    </div>
  );
};
