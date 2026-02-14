'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginScreen from '@/components/LoginScreen';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/calendar');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-heal-bg">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-heal-primary tracking-[0.2em] mb-2">
            HEAL
          </h1>
          <p className="text-xs tracking-[0.3em] text-heal-accent font-medium uppercase mb-8">
            Pilates Studio
          </p>
          <div className="spinner mx-auto" />
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Will redirect
  }

  return <LoginScreen />;
}
