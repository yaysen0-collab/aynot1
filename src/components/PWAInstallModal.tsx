import React from 'react';
import { X, Smartphone, Share, PlusSquare, CheckCircle, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Ana Ekrana Ekleme Rehberi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uygulama gibi tam ekran kullanın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              Uygulama Zaten Yüklü!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Aynot. bağımsız uygulama (PWA) olarak başarıyla çalışıyor.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {/* Direct browser button if Chrome/Android supported */}
            {isInstallable && (
              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-center space-y-2">
                <p className="text-xs text-teal-800 dark:text-teal-200 font-medium">
                  Tarayıcınız tek tıkla yüklemeyi destekliyor:
                </p>
                <button
                  onClick={async () => {
                    await install();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Şimdi Yükle (Ana Ekrana Ekle)</span>
                </button>
              </div>
            )}

            {/* iOS Safari Steps */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>🍎 iPhone / iPad (Safari) İçin:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <li>
                  Safari tarayıcısının altındaki <strong className="inline-flex items-center gap-1 font-semibold text-teal-600"><Share className="w-3.5 h-3.5" /> Paylaş</strong> simgesine dokunun.
                </li>
                <li>
                  Aşağı kaydırarak <strong className="inline-flex items-center gap-1 font-semibold text-teal-600"><PlusSquare className="w-3.5 h-3.5" /> Ana Ekrana Ekle</strong> seçeneğine tıklayın.
                </li>
                <li>
                  Sağ üstteki <strong>"Ekle"</strong> butonuna basın. Uygulama ana ekranınıza simge olarak yerleşecektir.
                </li>
              </ol>
            </div>

            {/* Android Chrome Steps */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>🤖 Android (Chrome / Edge / Samsung) İçin:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <li>
                  Tarayıcının sağ üst köşesindeki <strong>üç nokta (⋮)</strong> menüsüne dokunun.
                </li>
                <li>
                  <strong>"Uygulamayı yükle"</strong> veya <strong>"Ana ekrana ekle"</strong> seçeneğini seçin.
                </li>
                <li>
                  Onaylayın. İnternetiniz olmasa dahi tıpkı marketten inmiş gibi çalışacaktır.
                </li>
              </ol>
            </div>
          </div>
        )}

        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Anladım, Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
