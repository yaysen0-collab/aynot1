import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Service worker'ı kaydeder ve yeni sürüm hazır olunca küçük bir bildirim gösterir.
 * Yeni sürüm "Güncelle"ye basılana kadar beklemede kalır; böylece açık sayfanın kullandığı
 * eski dosyalar arka planda silinmez (beyaz ekranın asıl nedeni buydu) ve yazmakta olduğun
 * bir not da habersizce yenilenmez.
 * iPhone'da ana ekran uygulaması kapanmak yerine arka planda bekler; bu yüzden uygulamaya
 * her dönüşte ve 30 dakikada bir yeni sürüm olup olmadığı kontrol edilir.
 */
export function UpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updating, setUpdating] = useState(false);
  const updateRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    let registration: ServiceWorkerRegistration | undefined;
    const checkForUpdate = () => {
      registration?.update().catch(() => {});
    };

    updateRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(_swUrl, reg) {
        registration = reg;
      },
      onRegisterError(err) {
        console.warn('Service worker kaydedilemedi:', err);
      },
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    const timer = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(timer);
    };
  }, []);

  if (!needRefresh) return null;

  const handleUpdate = () => {
    setUpdating(true);
    // Yeni service worker devralınca sayfa kendiliğinden yenilenir; olmazsa 4 sn sonra elle yenile.
    updateRef.current?.(true).catch(() => {});
    window.setTimeout(() => window.location.reload(), 4000);
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pointer-events-none">
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm text-white shadow-lg"
      >
        <span className="font-medium">Yeni sürüm hazır</span>
        <button
          type="button"
          onClick={handleUpdate}
          disabled={updating}
          className="rounded-lg bg-white/20 px-3 py-1 font-semibold active:bg-white/30 disabled:opacity-70"
        >
          {updating ? 'Güncelleniyor...' : 'Güncelle'}
        </button>
      </div>
    </div>
  );
}
