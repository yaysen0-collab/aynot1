import React, { useEffect, useState } from 'react';

// Tüm açılır pencerelerin ortak iskeleti.
// Telefonda alttan açılan tam genişlikte sayfa, geniş ekranda ortada kutu.
// İçerik (başlık, form, düğmeler) children ile verilir.

interface ModalShellProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Geniş ekrandaki en fazla genişlik (Tailwind sınıfı) */
  maxWidthClass?: string;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  onClose,
  children,
  maxWidthClass = 'max-w-lg',
}) => {
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);

  // Klavye açılınca pencereyi görünen alana uydur (iPhone Safari; NoteEditorShell ile aynı yöntem)
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

  // Pencere açıkken arkadaki sayfa kaymasın; kapanınca eski haline dön
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  // Esc tuşu kapatır (bilgisayarda)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-x-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-slate-900/60 backdrop-blur-sm"
      style={{
        top: viewport ? `${viewport.top}px` : 0,
        height: viewport ? `${viewport.height}px` : '100dvh',
      }}
      // Sadece koyu arka plana dokunulursa kapanır, pencerenin içine dokunmak kapatmaz
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${maxWidthClass} max-h-[92%] md:max-h-[90%] flex flex-col overflow-hidden bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)] md:pb-0`}
      >
        {/* Telefonda "alt sayfa" tutamacı */}
        <div className="md:hidden flex justify-center pt-2 pb-1 flex-shrink-0" aria-hidden="true">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        {children}
      </div>
    </div>
  );
};
