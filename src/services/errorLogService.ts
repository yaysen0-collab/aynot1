import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDocs, limit, orderBy, query, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../db/firebase';
import { getBuildLabel } from '../utils/buildInfo';

// Hatalar users/{uid}/app_errors altına yazılır (mevcut Firestore kuralları buna zaten izin verir).
// Not içeriği, öğrenci adı vb. KAYDEDİLMEZ; yalnızca hata mesajı, yığın izi, sayfa ve cihaz bilgisi.
const COLLECTION = 'app_errors';
const MAX_PER_SESSION = 10;
const IGNORED_MESSAGES = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /auth\/popup-closed-by-user/i,
  /auth\/cancelled-popup-request/i,
];

export interface ErrorRecord {
  id: string;
  source: string;
  message: string;
  stack?: string;
  componentStack?: string;
  page: string;
  userAgent: string;
  build: string;
  online: boolean;
  standalone: boolean;
  createdAt: number;
}

const pending: ErrorRecord[] = [];
const seen = new Set<string>();
let sentCount = 0;
let started = false;

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) + '…' : value;
}

function isStandalone(): boolean {
  try {
    return Boolean((navigator as unknown as { standalone?: boolean }).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

function buildRecord(source: string, error: unknown, componentStack?: string): ErrorRecord {
  const e = error as { name?: unknown; message?: unknown; stack?: unknown } | null | undefined;
  const message = truncate(
    typeof e?.message === 'string' && e.message ? `${e.name ? e.name + ': ' : ''}${e.message}` : String(error),
    500
  );
  const record: ErrorRecord = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    source,
    message,
    page: truncate(window.location.pathname + window.location.hash, 200),
    userAgent: truncate(navigator.userAgent, 300),
    build: getBuildLabel(),
    online: navigator.onLine,
    standalone: isStandalone(),
    createdAt: Date.now(),
  };
  if (typeof e?.stack === 'string') record.stack = truncate(e.stack, 2000);
  if (componentStack) record.componentStack = truncate(componentStack, 1500);
  return record;
}

function write(uid: string, record: ErrorRecord): Promise<void> {
  return setDoc(doc(db, 'users', uid, COLLECTION, record.id), record).catch(() => {
    // Kayıt yazılamıyorsa (çevrimdışı, izin vb.) sessizce geç: hata kaydı asla uygulamayı bozmamalı.
  });
}

/** Hatayı kaydeder. Aynı hata tekrar etmez, oturum başına en fazla 10 kayıt yazılır. */
export function logError(source: string, error: unknown, componentStack?: string): void {
  try {
    const record = buildRecord(source, error, componentStack);
    if (IGNORED_MESSAGES.some((re) => re.test(record.message))) return;
    const key = `${source}|${record.message}`;
    if (seen.has(key) || sentCount >= MAX_PER_SESSION) return;
    seen.add(key);
    sentCount++;

    const user = auth.currentUser;
    if (user) {
      void write(user.uid, record);
    } else {
      pending.push(record); // Giriş yapılınca gönderilir
    }
  } catch {
    // yut
  }
}

/** Beyaz ekran dışındaki hataları (olay yöneticileri, async işlemler) de yakalar. main.tsx'ten bir kez çağrılır. */
export function initErrorLogging(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  window.addEventListener('error', (event) => {
    logError('window', event.error ?? event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    logError('promise', event.reason);
  });
  onAuthStateChanged(auth, (user) => {
    if (user && pending.length > 0) {
      pending.splice(0).forEach((record) => void write(user.uid, record));
    }
  });
}

/** Ayarlar ekranındaki "Deneme kaydı" düğmesi: kayıt hattının çalıştığını doğrular. */
export async function writeTestError(uid: string): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, COLLECTION, Date.now().toString(36) + 'test'),
    buildRecord('test', new Error('Deneme kaydı (gerçek bir hata değil)'))
  );
}

export async function fetchRecentErrors(uid: string, count = 20): Promise<ErrorRecord[]> {
  const snap = await getDocs(
    query(collection(db, 'users', uid, COLLECTION), orderBy('createdAt', 'desc'), limit(count))
  );
  return snap.docs.map((d) => d.data() as ErrorRecord);
}

export async function clearErrors(uid: string): Promise<void> {
  const snap = await getDocs(query(collection(db, 'users', uid, COLLECTION), limit(400)));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
