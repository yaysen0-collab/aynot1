import React from 'react';
import { clearCachesAndReload, isChunkLoadError, reloadOnceForUpdate } from '../../utils/reloadGuard';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  /** Eski sürüm kaynaklı hata: sayfa otomatik yenileniyor, hata ekranı gösterilmez. */
  reloading: boolean;
}

/**
 * Çizim sırasında yakalanmayan her hatada ekranın bomboş (beyaz) kalmasını engeller.
 * Yeni sürüm yayınlanınca silinen JS parçaları (lazy sekmeler) yüzünden oluşan hatalarda
 * sayfayı bir kez otomatik yeniler; diğer hatalarda "Yenile" düğmeli bir ekran gösterir.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, reloading: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
      reloading: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uygulama hatası:', error, info.componentStack);
    if (isChunkLoadError(error) && !reloadOnceForUpdate()) {
      // Yakın zamanda zaten yenilendi: döngüye girmemek için hata ekranını göster.
      this.setState({ reloading: false });
    }
  }

  render() {
    const { error, reloading } = this.state;
    if (!error) return this.props.children;

    if (reloading) {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
          <div className="w-6 h-6 rounded-full border-2 border-teal-600 border-t-transparent animate-spin mb-3" />
          <p className="text-sm font-medium">Yeni sürüme geçiliyor...</p>
        </div>
      );
    }

    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-10 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-center">
        <h1 className="text-2xl font-bold mb-5">Aynot.</h1>
        <p className="text-base font-semibold mb-1">Sayfa yüklenemedi</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
          Bir hata oluştu. Verilerin silinmedi. Yenilemek genellikle sorunu çözer.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full max-w-xs rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white active:bg-teal-700"
        >
          Yenile
        </button>
        <button
          type="button"
          onClick={() => {
            void clearCachesAndReload();
          }}
          className="mt-3 w-full max-w-xs rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800"
        >
          Önbelleği temizle ve yenile
        </button>

        <details className="mt-6 w-full max-w-xs text-left">
          <summary className="cursor-pointer text-center text-xs text-slate-500 dark:text-slate-400">
            Hata ayrıntısı
          </summary>
          <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-200/70 dark:bg-slate-800 p-3 text-xs text-slate-700 dark:text-slate-300">
            {error.name}: {error.message}
          </pre>
        </details>
      </div>
    );
  }
}
