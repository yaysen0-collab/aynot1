import React, { useState } from 'react';
import { AynotLogo } from '../common/AynotLogo';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  getAuthErrorMessage
} from '../../services/authService';
import { Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, GraduationCap } from 'lucide-react';
import { readStoredCommonExam, daysUntilDate, formatDaysLabel } from '../../utils/commonExam';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  // Üniversite sınavlarına kalan gün (bu cihazda daha önce ortak sınav tarihi girildiyse)
  const [storedExam] = useState(() => readStoredCommonExam());
  const examDaysLeft = storedExam ? daysUntilDate(storedExam.date) : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password reset modal state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        const msg = getAuthErrorMessage(err?.code || '');
        if (msg) setErrorMessage(msg);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMessage('Lütfen adınızı veya takma adınızı girin.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
        setSuccessMessage('Hesabınız başarıyla oluşturuldu!');
      }
    } catch (err: any) {
      setErrorMessage(getAuthErrorMessage(err?.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetStatus({ type: 'error', message: 'Lütfen e-posta adresinizi girin.' });
      return;
    }
    setIsResetLoading(true);
    setResetStatus(null);
    try {
      await resetPassword(resetEmail);
      setResetStatus({
        type: 'success',
        message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.'
      });
    } catch (err: any) {
      setResetStatus({ type: 'error', message: getAuthErrorMessage(err?.code || '') });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 transition-colors duration-200">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <AynotLogo size="lg" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Aynot<span className="text-sky-500">.</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            Kişisel takip, okul notları ve çalışma asistanınız.
          </p>
          {examDaysLeft !== null && examDaysLeft >= 0 && (
            <div className="mt-1 inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-200 text-sm font-bold">
              <GraduationCap className="w-4 h-4" />
              <span>{formatDaysLabel(examDaysLeft)}</span>
            </div>
          )}
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-6">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] transition-all text-sm font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Google ile devam et</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            <span className="absolute px-3 bg-white dark:bg-slate-900 text-xs text-slate-400 font-medium">
              veya e-posta ile
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ad Soyad
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız veya takma adınız"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                E-posta Adresi
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@posta.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Şifre
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsResetOpen(true);
                      setResetStatus(null);
                    }}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                  >
                    Şifremi unuttum
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-sm font-semibold shadow-md shadow-teal-600/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info footer */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>Verileriniz güvenle bulutta yedeklenir ve tüm cihazlarınızda eşitlenir.</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Şifremi Unuttum
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Hesabınıza bağlı e-posta adresinizi girin. Size bir şifre sıfırlama bağlantısı göndereceğiz.
            </p>

            {resetStatus && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
                  resetStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                }`}
              >
                {resetStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                )}
                <span>{resetStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="ornek@posta.com"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={isResetLoading}
                  className="flex-1 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                >
                  {isResetLoading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
