import React, { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, Loader2, AlertTriangle } from 'lucide-react';

/**
 * Tüm not yazma ekranları için ortak, iPhone "Notlar" tarzı tam ekran iskelet.
 * (Kişisel notlar kendi otomatik kayıtlı editörünü kullanır: notes/PersonalNoteModal.tsx)
 *
 * Bu iskelet "Bitti" ile kaydeder. Geri okuna basıldığında yazılmış ama kaydedilmemiş
 * değişiklik varsa "Kaydet / Kaydetme / Devam et" sorulur.
 */

/** Sayfa gibi yazdıkça uzayan gövde alanı. */
export const AutoGrowTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', value, ...rest }, ref) => {
    const inner = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = (el: HTMLTextAreaElement | null) => {
      inner.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    };

    useLayoutEffect(() => {
      const el = inner.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    return (
      <textarea
        ref={setRefs}
        value={value}
        className={`w-full bg-transparent border-0 outline-none focus:ring-0 resize-none overflow-hidden text-[17px] leading-[1.65] text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 min-h-[40vh] pt-2 ${className}`}
        {...rest}
      />
    );
  }
);
AutoGrowTextarea.displayName = 'AutoGrowTextarea';

/** Başlığın altındaki ayar satırlarını (etiket, tarih, öğrenci...) saran yumuşak kart. */
export const NoteMetaCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="my-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-200/80 dark:divide-slate-800">
    {children}
  </div>
);

export const NoteMetaRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center gap-3 px-3.5 py-2.5 min-h-[44px]">
    <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400 w-16 flex-shrink-0">{label}</span>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

/** Etiket seçici için yatay kayan çip satırı. */
export const NoteChipRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-0.5 px-0.5 py-0.5">{children}</div>
);

export const noteChipClass = (selected: boolean) =>
  `flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 border ${
    selected
      ? 'bg-teal-600 border-teal-600 text-white'
      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
  }`;

export const noteInputClass =
  'w-full bg-transparent border-0 outline-none focus:ring-0 text-[15px] text-slate-800 dark:text-slate-100 p-0';

interface NoteEditorShellProps {
  /** Geri okun yanındaki yazı (ör. "Okul", "Ders Notları") */
  backLabel: string;
  /** Başlığın üstündeki gri satır (tarih vb.) */
  dateText?: string;
  title: string;
  onTitleChange: (value: string) => void;
  titlePlaceholder?: string;
  /** Başlık alanında Enter'a basılınca çağrılır (genelde gövdeye odaklanır) */
  onTitleEnter?: () => void;
  /** "Bitti" düğmesinin solundaki ek düğmeler (ör. sesle yaz) */
  headerActions?: React.ReactNode;
  error?: string | null;
  isSaving: boolean;
  /** Kaydedilmemiş değişiklik var mı? */
  isDirty: boolean;
  /** Kaydetmek için zorunlu alanlar dolu mu? */
  canSave: boolean;
  onSave: () => void | Promise<void>;
  onClose: () => void;
  /** Boş alana dokunulunca çağrılır (gövdeye odaklanmak için) */
  onEmptyAreaClick?: () => void;
  autoFocusTitle?: boolean;
  children: React.ReactNode;
}

export const NoteEditorShell: React.FC<NoteEditorShellProps> = ({
  backLabel,
  dateText,
  title,
  onTitleChange,
  titlePlaceholder = 'Başlık',
  onTitleEnter,
  headerActions,
  error,
  isSaving,
  isDirty,
  canSave,
  onSave,
  onClose,
  onEmptyAreaClick,
  autoFocusTitle = false,
  children,
}) => {
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Klavye açılınca ekranı görünen alana uydur (iPhone Safari)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setViewport({ height: vv.height, top: vv.offsetTop });
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => {
    if (autoFocusTitle) {
      const t = setTimeout(() => titleRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [autoFocusTitle]);

  const handleBack = () => {
    if (isSaving) return;
    if (isDirty) setShowLeaveConfirm(true);
    else onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, isSaving, onClose]);

  return (
    <div
      className="fixed inset-x-0 z-50 flex flex-col bg-white dark:bg-slate-950 animate-in fade-in duration-150"
      style={{
        top: viewport ? `${viewport.top}px` : 0,
        height: viewport ? `${viewport.height}px` : '100dvh',
      }}
    >
      {/* Üst çubuk */}
      <div
        className="flex items-center justify-between gap-1 px-2 sm:px-4 border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)', paddingBottom: '0.5rem' }}
      >
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-0.5 pl-1 pr-2 py-1.5 rounded-xl text-teal-600 dark:text-teal-400 font-semibold text-[15px] active:opacity-60 transition"
        >
          <ChevronLeft className="w-6 h-6 -ml-1" />
          <span>{backLabel}</span>
        </button>

        <div className="flex items-center gap-0.5">
          {headerActions}
          <button
            type="button"
            onClick={() => onSave()}
            disabled={isSaving || !canSave}
            className="ml-1 px-3 py-1.5 rounded-xl text-[15px] font-bold text-teal-600 dark:text-teal-400 active:opacity-60 transition disabled:opacity-35 flex items-center gap-1.5"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Bitti</span>
          </button>
        </div>
      </div>

      {/* Kaydedilmemiş değişiklik uyarısı */}
      {showLeaveConfirm && (
        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">
            Değişiklikler kaydedilmedi.
          </span>
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowLeaveConfirm(false)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Devam et
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400"
            >
              Kaydetme
            </button>
            {canSave && (
              <button
                type="button"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  onSave();
                }}
                className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
              >
                Kaydet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hata */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Yazı alanı */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        onClick={(e) => {
          if (e.target === e.currentTarget) onEmptyAreaClick?.();
        }}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
      >
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-4 min-h-full flex flex-col">
          {dateText && (
            <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 mb-3">{dateText}</div>
          )}

          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onTitleEnter?.();
              }
            }}
            placeholder={titlePlaceholder}
            enterKeyHint="next"
            className="w-full bg-transparent border-0 outline-none focus:ring-0 text-[26px] sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 py-1"
          />

          {children}
        </div>
      </div>
    </div>
  );
};
