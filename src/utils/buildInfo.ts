// vite.config.ts içindeki `define` ile derleme anında doldurulur.
declare const __BUILD_TIME__: string | undefined;

/** Telefonda çalışan JS'in ne zaman derlendiği (yerel saatle). Güncelleme geldi mi diye bakmak için. */
export function getBuildLabel(): string {
  try {
    if (typeof __BUILD_TIME__ === 'undefined' || !__BUILD_TIME__) return 'geliştirme';
    return new Date(__BUILD_TIME__).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'bilinmiyor';
  }
}
