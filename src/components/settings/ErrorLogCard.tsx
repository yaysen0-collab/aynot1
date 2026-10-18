import { useCallback, useState } from 'react';
import { Bug, ChevronDown, ChevronUp, Copy, Check, RefreshCw, Trash2, FlaskConical } from 'lucide-react';
import { auth } from '../../db/firebase';
import { clearErrors, fetchRecentErrors, writeTestError, ErrorRecord } from '../../services/errorLogService';

const SOURCE_LABELS: Record<string, string> = {
  render: 'Ekran çizimi',
  window: 'Beklenmeyen hata',
  promise: 'Arka plan işlemi',
  test: 'Deneme',
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function recordToText(r: ErrorRecord): string {
  const lines = [
    `${formatDate(r.createdAt)} [${r.source}] ${r.message}`,
    `Derleme: ${r.build} | ${r.standalone ? 'ana ekran uygulaması' : 'tarayıcı'} | ${r.online ? 'çevrimiçi' : 'çevrimdışı'} | ${r.page}`,
  ];
  if (r.stack) lines.push(r.stack.split('\n').slice(0, 5).join('\n'));
  if (r.componentStack) lines.push(r.componentStack.split('\n').slice(0, 5).join('\n'));
  return lines.join('\n');
}

/** Ayarlar ekranı: uygulamanın kaydettiği hataları gösterir, kopyalar, temizler. */
export function ErrorLogCard() {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<ErrorRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const uid = auth.currentUser?.uid;

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setMessage(null);
    try {
      setRecords(await fetchRecentErrors(uid));
    } catch {
      setMessage('Kayıtlar yüklenemedi. İnternet bağlantını kontrol et.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && records === null) void load();
  };

  const handleCopy = async () => {
    if (!records || records.length === 0) return;
    try {
      await navigator.clipboard.writeText(records.map(recordToText).join('\n\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage('Kopyalanamadı. Bir kaydın üstüne dokunup ekran görüntüsü alabilirsin.');
    }
  };

  const handleClear = async () => {
    if (!uid) return;
    try {
      await clearErrors(uid);
      setRecords([]);
      setMessage('Kayıtlar temizlendi.');
    } catch {
      setMessage('Temizlenemedi. İnternet bağlantını kontrol et.');
    }
  };

  const handleTest = async () => {
    if (!uid) return;
    try {
      await writeTestError(uid);
      await load();
      setMessage('Deneme kaydı eklendi. Hata kaydı çalışıyor.');
    } catch {
      setMessage('Deneme kaydı yazılamadı. İnternet bağlantını veya Firestore kurallarını kontrol et.');
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 text-slate-800 dark:text-slate-100 text-xs font-bold"
      >
        <span className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-teal-600" />
          Hata kayıtları
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Uygulamada bir hata olursa burada görünür. Not, öğrenci adı gibi içerik kaydedilmez; yalnızca hata mesajı ve
            cihaz bilgisi tutulur.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!records || records.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Kopyalandı' : 'Tümünü kopyala'}
            </button>
            <button
              type="button"
              onClick={handleTest}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Deneme kaydı
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!records || records.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 active:bg-rose-50 dark:active:bg-rose-950/40 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Temizle
            </button>
          </div>

          {message && <p className="text-xs text-slate-600 dark:text-slate-400">{message}</p>}

          {!uid && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Hata kayıtlarını görmek için giriş yapmalısın.</p>
          )}

          {uid && records !== null && records.length === 0 && !loading && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Kayıtlı hata yok.</p>
          )}

          {records && records.length > 0 && (
            <ul className="space-y-2">
              {records.map((r) => {
                const isExpanded = expandedId === r.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="w-full text-left rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{formatDate(r.createdAt)}</span>
                        <span>{SOURCE_LABELS[r.source] ?? r.source}</span>
                      </div>
                      <p
                        className={`mt-0.5 text-xs text-slate-800 dark:text-slate-200 break-words ${
                          isExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {r.message}
                      </p>
                      {isExpanded && (
                        <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-slate-600 dark:text-slate-400">
                          {recordToText(r)}
                        </pre>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
