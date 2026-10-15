import React, { useState } from 'react';
import { 
  X, 
  History, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Phone 
} from 'lucide-react';
import { WeeklyCallSession } from '../../types';
import { DAY_NAMES_TR } from '../../utils/calendar';

interface ParentCallsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: WeeklyCallSession[];
  onSelectStudent?: (studentId: string) => void;
}

export const ParentCallsHistoryModal: React.FC<ParentCallsHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectStudent,
}) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Geçmiş Veli Aramaları
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Haftalık arama kayıtları ve alınan görüşme notları
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

        {/* Sessions list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold">Henüz geçmiş arama oturumu bulunmuyor.</p>
              <p className="text-xs mt-1">Cuma veli aramaları yapıldıkça geçmiş kayıtlar burada arşivlenecektir.</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isExpanded = expandedSessionId === session.id;
              const dayName = DAY_NAMES_TR[session.dayOfWeek] || 'Cuma';
              const activeItems = session.items.filter((i) => !i.excluded);
              const calledCount = activeItems.filter((i) => i.called).length;
              const uncalledCount = activeItems.filter((i) => !i.called).length;

              return (
                <div
                  key={session.id}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                >
                  {/* Summary bar */}
                  <button
                    onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                    className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <span>{session.weekDate} ({dayName})</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="text-teal-600 dark:text-teal-400 font-semibold">
                            ✓ {calledCount} Arandı
                          </span>
                          {uncalledCount > 0 && (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">
                              ✗ {uncalledCount} Aranmadı
                            </span>
                          )}
                          <span>• Toplam {session.items.length} Öğrenci</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expanded detail items */}
                  {isExpanded && (
                    <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-2 animate-in fade-in duration-150">
                      <div className="space-y-2">
                        {session.items.map((item) => (
                          <div
                            key={item.studentId}
                            className={`p-3 rounded-xl border text-xs ${
                              item.excluded
                                ? 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                                : item.called
                                ? 'bg-white dark:bg-slate-800/70 border-teal-200 dark:border-teal-900/60'
                                : 'bg-white dark:bg-slate-800/70 border-rose-200 dark:border-rose-900/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {item.excluded ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">Muaf</span>
                                ) : item.called ? (
                                  <span className="flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                                    <span>Arandı ({item.calledAt || 'Saat girilmedi'})</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-300">
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Aranamadı</span>
                                  </span>
                                )}

                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                  {item.studentName}
                                </span>
                              </div>

                              <span className="text-slate-400 text-[11px]">
                                {item.parentName || 'Veli'}
                              </span>
                            </div>

                            {/* Note preview */}
                            {item.notes && (
                              <div className="mt-2 p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs italic flex items-start gap-1.5 border border-amber-200/50 dark:border-amber-900/50">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <span>"{item.notes}"</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
