import React, { useState } from 'react';
import { 
  X, 
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
import { ModalShell } from '../common/ModalShell';

interface ParentCallsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WeeklyCallSession | null;
  missedCalls: MissedCallInfo[];
  allSessions: WeeklyCallSession[];
  settings: ParentCallSettings;
  onUpdateSession: (updatedSession: WeeklyCallSession) => void;
  onOpenHistory: () => void;
  onNavigateToStudent: (studentId: string) => void;
}

export const ParentCallsModal: React.FC<ParentCallsModalProps> = ({
  isOpen,
  onClose,
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

  if (!isOpen || !session) return null;

  const dayName = DAY_NAMES_TR[session.dayOfWeek] || 'Cuma';

  const activeItems = session.items.filter((i) => !i.excluded);
  const calledItems = activeItems.filter((i) => i.called);
  const pendingItems = activeItems.filter((i) => !i.called);
  const excludedItems = session.items.filter((i) => i.excluded);

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
    <ModalShell onClose={onClose} maxWidthClass="max-w-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{dayName} Veli Aramaları</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    {session.weekDate}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Planlanan saat: {session.callTime || settings.callTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenHistory}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                title="Geçmiş haftaların aramalarını gör"
              >
                <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Geçmiş</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar & Stats */}
          <div className="mt-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-300">
                Arama Durumu: {calledItems.length} / {activeItems.length} Arandı
              </span>
              <span className="text-amber-600 dark:text-amber-400">%{progressPercent}</span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-teal-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-none pt-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Tümü ({session.items.length})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition ${
                activeFilter === 'pending'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Aranacaklar ({pendingItems.length})
            </button>
            <button
              onClick={() => setActiveFilter('called')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition ${
                activeFilter === 'called'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Arananlar ({calledItems.length})
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
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
                {missedCalls.map(({ item, sessionDate }) => (
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
                    className={`p-3.5 rounded-2xl border transition ${
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
                          disabled={item.excluded}
                          onClick={() => handleToggleCall(item.studentId, item.called)}
                          className={`mt-0.5 p-1 rounded-xl transition active:scale-90 touch-manipulation flex-shrink-0 ${
                            item.called
                              ? 'text-teal-600 dark:text-teal-400 hover:text-teal-700'
                              : 'text-slate-300 hover:text-slate-500 dark:text-slate-600'
                          }`}
                          title={item.called ? 'Arandı olarak işaretlendi (Geri almak için dokunun)' : 'Arandı olarak işaretle'}
                        >
                          {item.called ? (
                            <CheckCircle2 className="w-6 h-6 fill-teal-100 dark:fill-teal-950/80" />
                          ) : (
                            <Circle className="w-6 h-6" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => {
                                onClose();
                                onNavigateToStudent(item.studentId);
                              }}
                              className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 text-left truncate transition"
                            >
                              {item.studentName}
                            </button>

                            {item.called && item.calledAt && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{item.calledAt} arandı</span>
                              </span>
                            )}

                            {item.excluded && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                Bu hafta muaf
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="truncate">Veli: {item.parentName || 'Ad belirtilmemiş'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Actions: Phone Call & Exclude Button */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.parentPhone ? (
                          <a
                            href={`tel:${item.parentPhone.replace(/\s+/g, '')}`}
                            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-95"
                            title="Doğrudan Ara"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Ara</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No yok</span>
                        )}

                        <button
                          onClick={() => handleToggleExclude(item.studentId)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs"
                          title={item.excluded ? 'Listeye geri al' : 'Bu haftalık listeden çıkar'}
                        >
                          {item.excluded ? (
                            <UserPlus className="w-4 h-4 text-teal-600" />
                          ) : (
                            <UserMinus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Bottom: Notes area ("Velinin söyledikleri") */}
                    {!item.excluded && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {isEditingThis ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                Velinin Söyledikleri:
                              </span>
                              <VoiceInputButton
                                onInsertText={(text) => {
                                  setTempNotes((prev) => {
                                    const needSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
                                    return prev + (needSpace ? ' ' : '') + text;
                                  });
                                }}
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Velinin söyledikleri, aktarılan konular, evdeki durum... Sesle yazdırmak için mikrofona dokunabilirsiniz."
                              className="w-full p-2.5 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingNotesStudentId(null)}
                                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                              >
                                Vazgeç
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveNotes(item.studentId)}
                                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                              >
                                Notu Kaydet
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2 group">
                            {item.notes ? (
                              <p className="text-xs text-slate-600 dark:text-slate-300 italic flex items-start gap-1.5 leading-relaxed">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <span>"{item.notes}"</span>
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEditNotes(item)}
                                className="text-xs text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 font-medium transition"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Velinin söylediklerini not et...</span>
                              </button>
                            )}

                            {item.notes && (
                              <button
                                type="button"
                                onClick={() => handleStartEditNotes(item)}
                                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex-shrink-0"
                              >
                                Düzenle
                              </button>
                            )}
                          </div>
                        )}

                        {item.called && item.notes && (
                          <div className="mt-1 text-[10px] text-teal-600 dark:text-teal-400/80 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Öğrencinin not akışına "Veli Görüşmesi" olarak otomatik işlendi.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {calledItems.length} tamamlandı, {pendingItems.length} bekliyor
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition"
          >
            Kapat
          </button>
        </div>
    </ModalShell>
  );
};
