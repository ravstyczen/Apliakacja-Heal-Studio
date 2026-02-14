'use client';

import { signIn } from 'next-auth/react';

export default function LoginScreen() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-heal-bg px-6">
      <div className="text-center w-full max-w-sm">
        {/* Logo */}
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-heal-primary tracking-[0.2em] mb-1">
            HEAL
          </h1>
          <p className="text-xs tracking-[0.3em] text-heal-accent font-medium uppercase">
            Pilates Studio
          </p>
        </div>

        {/* Decorative line */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-heal-light" />
          <div className="w-2 h-2 rounded-full bg-heal-accent" />
          <div className="flex-1 h-px bg-heal-light" />
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-heal-dark mb-2">
            Witaj
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Zaloguj się kontem Google aby kontynuować
          </p>

          <button
            onClick={() => signIn('google', { callbackUrl: '/calendar' })}
            className="w-full flex items-center justify-center gap-3 bg-heal-primary text-white py-3.5 px-6 rounded-xl font-medium text-sm hover:bg-opacity-90 active:scale-[0.98] transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Zaloguj się przez Google
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Dostęp tylko dla instruktorów studia
        </p>
      </div>
    </div>
  );
}
