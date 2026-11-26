import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Store, User } from 'lucide-react';
import { ENDPOINT_CONFIG } from '../config/endpoint';
import { ApiError, loginPreviewSupervisor, loginWithAccount } from '../services/api';
import type { SessionInfo } from '../types/store';

interface LoginViewProps {
  onLoginSuccess: (session: SessionInfo) => void;
  sessionNotice?: string | null;
}

export function LoginView({ onLoginSuccess, sessionNotice }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewLoadingKey, setPreviewLoadingKey] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMessage('Username dan password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginWithAccount(trimmedUser, password);
      if (!result.token || !result.supervisor || !result.username) {
        setErrorMessage('Respons autentikasi dari server tidak lengkap.');
        return;
      }
      onLoginSuccess({
        token: result.token,
        supervisor: result.supervisor,
        username: result.username,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal melakukan login. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePreviewSignIn(supervisorName: string) {
    setErrorMessage(null);
    setPreviewLoadingKey(supervisorName);
    try {
      const result = await loginPreviewSupervisor(supervisorName);
      if (!result.token || !result.supervisor || !result.username) {
        setErrorMessage('Gagal memulai sesi pratinjau.');
        return;
      }
      onLoginSuccess({
        token: result.token,
        supervisor: result.supervisor,
        username: result.username,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal masuk ke mode pratinjau lokal.');
      }
    } finally {
      setPreviewLoadingKey(null);
    }
  }

  const busy = isSubmitting || previewLoadingKey !== null;

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#F0F8FF] flex items-center justify-center px-4 py-8 sm:px-6">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-28 h-80 w-80 text-blue-200/60 sm:h-[28rem] sm:w-[28rem]"
        viewBox="0 0 400 400"
        fill="none"
      >
        <path d="M400 0v400H0c94-43 161-89 183-169C211 129 287 39 400 0Z" fill="currentColor" />
        <path d="M400 80c-90 28-139 92-165 170-20 60-69 105-151 150h316V80Z" fill="white" fillOpacity=".55" />
      </svg>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -left-32 h-80 w-80 rotate-180 text-blue-200/50 sm:h-[28rem] sm:w-[28rem]"
        viewBox="0 0 400 400"
        fill="none"
      >
        <path d="M400 0v400H0c94-43 161-89 183-169C211 129 287 39 400 0Z" fill="currentColor" />
        <path d="M400 80c-90 28-139 92-165 170-20 60-69 105-151 150h316V80Z" fill="white" fillOpacity=".55" />
      </svg>

      <main className="relative z-10 w-full max-w-md">
          <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-[0_20px_60px_-24px_rgba(30,64,175,0.22)] sm:p-9">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Store className="h-7 w-7" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#1E293B] sm:text-2xl">
                Store Location Validation
              </h1>
            </div>

            {sessionNotice && (
              <div
                role="status"
                className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900"
              >
                {sessionNotice}
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-semibold text-[#1E293B]">
                  Username
                </label>
                <div className="relative">
                  <User
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={busy}
                    placeholder="Masukkan username"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-base text-[#1E293B] placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#1E293B]">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                    placeholder="Masukkan password"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-base text-[#1E293B] placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    disabled={busy}
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {ENDPOINT_CONFIG.isLocalPreview && (
              <div className="mt-6 pt-5 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Akun Demo
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handlePreviewSignIn('Budi Santoso')}
                    className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shadow-2xs"
                  >
                    <span className="block text-sm font-bold text-slate-900">
                      {previewLoadingKey === 'Budi Santoso' ? 'Memuat...' : 'Budi Santoso'}
                    </span>
                    <span className="block text-xs text-slate-600">Supervisor · Jakarta</span>
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handlePreviewSignIn('Siti Rahayu')}
                    className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shadow-2xs"
                  >
                    <span className="block text-sm font-bold text-slate-900">
                      {previewLoadingKey === 'Siti Rahayu' ? 'Memuat...' : 'Siti Rahayu'}
                    </span>
                    <span className="block text-xs text-slate-600">Supervisor · Bandung</span>
                  </button>
                </div>
              </div>
            )}
          </div>
      </main>
    </div>
  );
}
