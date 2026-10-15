import React, { useState } from 'react';
import { 
  Phone, 
  CheckCircle2, 
  Circle, 
  Clock, 
  UserMinus, 
  UserPlus, 
  AlertCircle, 
  History, 
  ChevronRight, 
  MessageSquare,
  Sparkles,
  Calendar,
  Filter
} from 'lucide-react';
import { Student, WeeklyCallSession, WeeklyCallItem, ParentCallSettings } from '../../types';
import { DAY_NAMES_TR } from '../../utils/calendar';
import { 
  toggleStudentCall, 
  updateStudentCallNotes, 
  toggleExcludeStudentFromSession, 
  MissedCallInfo 
} from '../../services/parentCallService';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface SchoolParentCallsViewProps {
  session: WeeklyCallSession | null;
  missedCalls: MissedCallInfo[];
  allSessions: WeeklyCallSession[];
  settings: ParentCallSettings;
  onUpdateSession: (updatedSession: WeeklyCallSession) => void;
  onOpenHistory: () => void;
  onNavigateToStudent: (studentId: string) => void;
}

export const SchoolParentCallsView: React.FC<SchoolParentCallsViewProps> = ({
  session,
  missedCalls,
  allSessions,
  settings,
  onUpdateSession,
  onOpenHistory,
  onNavigateToStudent,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'called'>('all');
  const [editingNotesStudentId, setEditingNotesStudentId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  if (!session) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
        <Phone className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Bu hafta için henüz veli arama oturumu oluşturulmamış.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Kayıtlı öğrenciler eklendiğinde haftalık arama listesi otomatik hazırlanır.
        </p>
      </div>
    );
  }

  const dayName = DAY_NAMES_TR[session.dayOfWeek] || 'Cuma';

  const activeItems = session.items.filter((i) => !i.excluded);
  const calledItems = activeItems.filter((i) => i.called);
  const pendingItems = activeItems.filter((i) => !i.called);

  const progressPercent = activeItems.length > 0 
    ? Math.round((calledItems.length / activeItems.length) * 100) 
    : 0;

  const handleToggleCall = async (studentId: string, currentState: boolean) => {
    const item = session.items.find((i) => i.studentId === studentId);
    const updated = await toggleStudentCall(session, studentId, !currentState, item?.notes);
    onUpdateSession(updated);
  };

  const handleToggleExclude = async (studentId: string) => {
    const updated = await toggleExcludeStudentFromSession(session, studentId);
    onUpdateSession(updated);
  };

  const handleStartEditNotes = (item: WeeklyCallItem) => {
    setEditingNotesStudentId(item.studentId);
    setTempNotes(item.notes || '');
  };

  const handleSaveNotes = async (studentId: string) => {
    const updated = await updateStudentCallNotes(session, studentId, tempNotes);
    onUpdateSession(updated);
    setEditingNotesStudentId(null);
  };

  const displayItems = session.items.filter((item) => {
    if (activeFilter === 'called') return item.called && !item.excluded;
    if (activeFilter === 'pending') return !item.called && !item.excluded;
    return true; // 'all'
  });

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>{dayName} Veli Aramaları</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-semibold">
              {session.weekDate}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Haftalık veli bilgilendirme ve görüşme takibi • Saat: {session.callTime || settings.callTime}
          </p>
        </div>

        <button
          onClick={onOpenHistory}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs transition active:scale-95"
          title="Geçmiş arama oturumlarını gör"
        >
          <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Geçmiş</span>
        </button>
      </div>

      {/* Progress Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-300">
            Arama Durumu: {calledItems.length} / {activeItems.length} Arandı
          </span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">%{progressPercent}</span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-teal-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition touch-manipulation ${
            activeFilter === 'all'
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Tümü ({session.items.length})
        </button>
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition touch-manipulation ${
            activeFilter === 'pending'
              ? 'bg-amber-600 text-white font-semibold shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Aranacaklar ({pendingItems.length})
        </button>
        <button
          onClick={() => setActiveFilter('called')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition touch-manipulation ${
            activeFilter === 'called'
              ? 'bg-teal-600 text-white font-semibold shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Arananlar ({calledItems.length})
        </button>
      </div>

      {/* SECTION 1: GEÇEN HAFTA ARANAMAYANLAR (Missed from last week) */}
      {missedCalls.length > 0 && activeFilter !== 'called' && (
        <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Geçen Hafta Aranamadı ({missedCalls.length} Veli)</span>
          </div>
          <p className="text-[11px] text-rose-700/90 dark:text-rose-300/80">
            Bu veliler önceki haftanın listesinde aranmamış olarak kaldı. Öncelikli olarak aramanız önerilir:
          </p>

          <div className="space-y-1.5 pt-1">
            {missedCalls.map(({ item }) => (
              <div
                key={`missed-${item.studentId}`}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/70 dark:border-rose-900/60 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {item.studentName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Veli: {item.parentName || 'Kayıtlı değil'} {item.parentPhone && `• ${item.parentPhone}`}
                  </div>
                </div>

                {item.parentPhone && (
                  <a
                    href={`tel:${item.parentPhone.replace(/\s+/g, '')}`}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Hemen Ara</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: BU HAFTANIN LİSTESİ */}
      <div className="space-y-2.5">
        {displayItems.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-xs">Bu filtreye uygun öğrenci bulunamadı.</p>
          </div>
        ) : (
          displayItems.map((item) => {
            const isEditingThis = editingNotesStudentId === item.studentId;

            return (
              <div
                key={item.studentId}
                className={`p-3.5 rounded-3xl border transition ${
                  item.excluded
                    ? 'bg-slate-100/60 dark:bg-slate-850/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                    : item.called
                    ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/80 dark:border-teal-900/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {/* Top Row: Checkbox, Name, Phone & Exclude action */}
                <div className="flex items-start justify-between gap-3">
                  {/* Checkbox & Student/Parent Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleCall(item.studentId, item.called)}
                      disabled={item.excluded}
                      className="mt-0.5 text-teal-600 dark:text-teal-400 focus:outline-none transition active:scale-90 flex-shrink-0 disabled:opacity-30"
                      title={item.called ? 'Arandı olarak işaretli' : 'Aranmadı olarak işaretle'}
                    >
                      {item.called ? (
                        <CheckCircle2 className="w-5 h-5 fill-teal-600 text-white dark:fill-teal-500 dark:text-slate-900" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-teal-500" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onNavigateToStudent(item.studentId)}
                          className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 text-left transition truncate"
                        >
                          {item.studentName}
                        </button>

                        {item.called && item.calledAt && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-semibold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {item.calledAt}
                          </span>
                        )}

                        {item.excluded && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Bu hafta muaf
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        Veli: {item.parentName || 'Kayıtlı değil'}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Phone Button & Exclude/Include */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.parentPhone && !item.excluded && (
                      <a
                        href={`tel:${item.parentPhone.replace(/\s+/g, '')}`}
                        onClick={() => {
                          if (!item.called) {
                            handleToggleCall(item.studentId, false);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                        title="Telefonla Ara"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ara</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleExclude(item.studentId)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title={item.excluded ? 'Listeye Geri Ekle' : 'Bu Haftalık Listeden Çıkar'}
                    >
                      {item.excluded ? (
                        <UserPlus className="w-4 h-4 text-teal-600" />
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Call Notes */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {isEditingThis ? (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-teal-600" />
                          <span>Görüşme Notu (Velinin söyledikleri):</span>
                        </span>

                        <VoiceInputButton
                          onInsertText={(text) => {
                            setTempNotes((prev) => (prev ? prev + ' ' + text : text));
                          }}
                          enabled={true}
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder="Örn: Anneyle görüşüldü; evde etkinlikleri düzenli yaptıklarını, ders motivasyonunun yüksek olduğunu belirtti..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                      />

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingNotesStudentId(null)}
                          className="px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          Vazgeç
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(item.studentId)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition"
                        >
                          Kaydet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      {item.notes ? (
                        <p
                          onClick={() => handleStartEditNotes(item)}
                          className="text-slate-600 dark:text-slate-300 italic cursor-pointer hover:underline truncate max-w-sm flex items-center gap-1"
                          title="Düzenlemek için tıklayın"
                        >
                          <MessageSquare className="w-3 h-3 text-teal-600 flex-shrink-0" />
                          <span>"{item.notes}"</span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEditNotes(item)}
                          className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 transition"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>+ Görüşme notu ekle</span>
                        </button>
                      )}

                      {item.notes && (
                        <button
                          type="button"
                          onClick={() => handleStartEditNotes(item)}
                          className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-medium"
                        >
                          Düzenle
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
