// Sayfa yüklemesi sırasında "eski sürüm" kaynaklı hataları (silinmiş JS parçaları) algılar ve
// sonsuz yenileme döngüsüne girmeden sayfayı en fazla bir kez otomatik yeniler.

const RELOAD_KEY = 'aynot_auto_reload_at';
const RELOAD_WINDOW_MS = 20_000;

const CHUNK_ERROR_PATTERN =
  /dynamically imported module|importing a module script failed|error loading dynamically|ChunkLoadError|Loading chunk|Loading CSS chunk|Unable to preload CSS|not a valid JavaScript MIME type/i;

/** Hata, yeni sürüm yayınlandığı için bir JS/CSS parçasının yüklenememesinden mi kaynaklanıyor? */
export function isChunkLoadError(err: unknown): boolean {
  const e = err as { name?: unknown; message?: unknown } | null | undefined;
  const text = `${e?.name ?? ''} ${e?.message ?? err ?? ''}`;
  return CHUNK_ERROR_PATTERN.test(text);
}

/**
 * Sayfayı yeniler. Son 20 saniye içinde zaten otomatik yenileme yapıldıysa (veya sessionStorage
 * kullanılamıyorsa) hiçbir şey yapmaz ve false döner; böylece yenileme döngüsü oluşmaz.
 */
export function reloadOnceForUpdate(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** Service worker kayıtlarını ve önbellekleri siler, sonra sayfayı yeniler. Kullanıcı verisine dokunmaz. */
export async function clearCachesAndReload(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (err) {
    console.warn('Önbellek temizlenemedi:', err);
  }
  window.location.reload();
}
