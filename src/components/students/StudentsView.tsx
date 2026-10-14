import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  AlertTriangle, 
  ChevronRight, 
  Phone, 
  FileText, 
  Filter,
  Users,
  X
} from 'lucide-react';
import { Student, StudentNote } from '../../types';
import { normalizeTurkish } from '../../services/searchService';

interface StudentsViewProps {
  students: Student[];
  studentNotes: StudentNote[];
  onSelectStudent: (studentId: string) => void;
  onAddNewStudent: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  studentNotes,
  onSelectStudent,
  onAddNewStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Extract unique sorted groups
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) {
      if (s.group && s.group.trim()) set.add(s.group.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [students]);

  // Notes count map
  const noteCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of studentNotes) {
      if (n.studentId) {
        map.set(n.studentId, (map.get(n.studentId) || 0) + 1);
      }
    }
    return map;
  }, [studentNotes]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    const normQ = normalizeTurkish(searchQuery);

    return students.filter((s) => {
      // Group filter
      if (selectedGroup !== 'all' && s.group !== selectedGroup) {
        return false;
      }

      // Query filter
      if (normQ) {
        const normName = normalizeTurkish(s.name);
        const normParent = normalizeTurkish(s.parentName || '');
        const normHealth = normalizeTurkish(s.healthAlert || '');
        const normGrp = normalizeTurkish(s.group);

        return (
          normName.includes(normQ) ||
          normParent.includes(normQ) ||
          normHealth.includes(normQ) ||
          normGrp.includes(normQ)
        );
      }

      return true;
    });
  }, [students, selectedGroup, searchQuery]);

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top Header & Add Student */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>Öğrenci Listesi</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {students.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sınıflarınız ve kayıtlı öğrenciler
          </p>
        </div>

        <button
          onClick={onAddNewStudent}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Öğrenci Ekle</span>
        </button>
      </div>

      {/* In-List Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Öğrenci adı, veli veya alerji ara..."
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

      {/* Sınıf / Grup Filtreleme Çipleri */}
      {availableGroups.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setSelectedGroup('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition touch-manipulation ${
              selectedGroup === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Tüm Sınıflar ({students.length})
          </button>

          {availableGroups.map((grp) => {
            const count = students.filter((s) => s.group === grp).length;
            const isSelected = selectedGroup === grp;

            return (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition touch-manipulation ${
                  isSelected
                    ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950 font-semibold shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {grp} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
          <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {searchQuery || selectedGroup !== 'all'
              ? 'Arama kriterlerine uygun öğrenci bulunamadı.'
              : 'Henüz öğrenci eklenmemiş.'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
            {searchQuery || selectedGroup !== 'all'
              ? 'Filtreleri temizleyerek tekrar deneyebilirsiniz.'
              : 'Öğrencilerinizi kaydetmeye hemen başlayın; notlar ve sağlık durumlarını kolayca takip edin.'}
          </p>
          <button
            onClick={onAddNewStudent}
            className="mt-4 px-4 py-2 rounded-2xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition"
          >
            İlk Öğrenciyi Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredStudents.map((student) => {
            const hasAlert = !!(student.healthAlert && student.healthAlert.trim() !== '');
            const notesCount = noteCounts.get(student.id) || 0;

            return (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student.id)}
                className={`p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border transition cursor-pointer select-none group active:scale-[0.99] touch-manipulation shadow-xs hover:shadow-sm ${
                  hasAlert
                    ? 'border-rose-200/90 dark:border-rose-900/60 hover:border-rose-400 dark:hover:border-rose-700'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-teal-400 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl font-bold text-sm flex items-center justify-center flex-shrink-0 transition ${
                        hasAlert
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                          : 'bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300'
                      }`}
                    >
                      {student.name.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {student.name}
                        </h3>

                        {/* Kırmızı Alerji / Sağlık Uyarısı İşareti */}
                        {hasAlert && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-500 text-white shadow-xs"
                            title={`Alerji/Sağlık: ${student.healthAlert}`}
                          >
                            <AlertTriangle className="w-3 h-3 fill-white/20" />
                            <span>Sağlık Uyarısı</span>
                          </span>
                        )}
                      </div>

                      {/* Veli Adı ve Telefonu */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                        <span className="truncate">
                          Veli: {student.parentName || 'Belirtilmedi'}
                        </span>
                        {student.parentPhone && (
                          <>
                            <span>•</span>
                            <a
                              href={`tel:${student.parentPhone.replace(/\s+/g, '')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-teal-600 dark:text-teal-400 hover:underline font-medium truncate"
                            >
                              {student.parentPhone}
                            </a>
                          </>
                        )}
                      </div>

                      {/* Alerji/Sağlık Metni Kırmızı İşaretle */}
                      {hasAlert && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse" />
                          <span>{student.healthAlert}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Notes count & Arrow */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <FileText className="w-3 h-3" />
                      <span>{notesCount}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
