import React, { useState, useEffect, useRef } from 'react';
import { X, Lightbulb, Mic, MicOff, Sparkles, ArrowRight } from 'lucide-react';
import { ProjectIdea, IdeaType } from '../../types';
import { IDEA_TYPE_MAP } from '../../utils/ideaUtils';

interface QuickIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (idea: Partial<ProjectIdea>, openDetail?: boolean) => Promise<void>;
  voiceNotesEnabled?: boolean;
}

export const QuickIdeaModal: React.FC<QuickIdeaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  voiceNotesEnabled = true,
}) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [type, setType] = useState<IdeaType>('saas');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTarget, setRecordingTarget] = useState<'title' | 'summary'>('title');
  const [saving, setSaving] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSummary('');
      setType('saas');
      setIsRecording(false);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Voice typing setup
  const isSpeechSupported = 
    typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startVoiceInput = (target: 'title' | 'summary') => {
    if (!isSpeechSupported || !voiceNotesEnabled) return;

    try {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingTarget(target);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (target === 'title') {
          setTitle((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } else {
          setSummary((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSave = async (openDetail = false) => {
    if (!title.trim() || saving) return;
    try {
      setSaving(true);
      await onSave(
        {
          title: title.trim(),
          summary: summary.trim() || undefined,
          type,
          status: 'fikir',
          isStarred: false,
          tags: [],
          links: [],
          notes: [],
          todos: [],
          prompts: [],
        },
        openDetail
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-sm">
              <Lightbulb className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hızlı Fikir Ekle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aklına gelen projeyi hemen kaydet, detayları sonra doldur
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Fikir Başlığı */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Fikir / Proje Başlığı <span className="text-rose-500">*</span>
              </label>
              {isSpeechSupported && voiceNotesEnabled && (
                <button
                  type="button"
                  onClick={() => isRecording && recordingTarget === 'title' ? stopVoiceInput() : startVoiceInput('title')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                    isRecording && recordingTarget === 'title'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 animate-pulse'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {isRecording && recordingTarget === 'title' ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Dinliyor...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Sesle Yaz</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave(false);
                }
              }}
              placeholder="Örn: AI Destekli Müşteri Destek Asistanı (SaaS)"
              className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
            />
          </div>

          {/* Tür Seçimi */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Proje Türü
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {(Object.keys(IDEA_TYPE_MAP) as IdeaType[]).map((tKey) => {
                const meta = IDEA_TYPE_MAP[tKey];
                const isSelected = type === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setType(tKey)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tek Cümlelik Özet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Tek Cümlelik Özet <span className="text-slate-400 font-normal">(İsteğe bağlı)</span>
              </label>
              {isSpeechSupported && voiceNotesEnabled && (
                <button
                  type="button"
                  onClick={() => isRecording && recordingTarget === 'summary' ? stopVoiceInput() : startVoiceInput('summary')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                    isRecording && recordingTarget === 'summary'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 animate-pulse'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {isRecording && recordingTarget === 'summary' ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Dinliyor...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Sesle Yaz</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Örn: Küçük e-ticaret sitelerinin WhatsApp mesajlarını otomatikleştiren mikro-SaaS botu."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition text-center"
          >
            İptal
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              disabled={!title.trim() || saving}
              onClick={() => handleSave(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>Detaylı Aç</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={!title.trim() || saving}
              onClick={() => handleSave(false)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{saving ? 'Kaydediliyor...' : 'Hızlı Kaydet'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
