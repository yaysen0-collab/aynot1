import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { UpdateBanner } from './components/common/UpdateBanner';
import { reloadOnceForUpdate } from './utils/reloadGuard';
import './index.css';

// Yeni sürüm yayınlanınca eski JS parçaları silinir; yüklenemeyen parça olursa sayfayı bir kez yenile.
// (Yenileme yapılamıyorsa hata yukarı iletilir ve ErrorBoundary ekranı gösterir.)
window.addEventListener('vite:preloadError', (event: Event) => {
  if (reloadOnceForUpdate()) event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <UpdateBanner />
  </>
);
