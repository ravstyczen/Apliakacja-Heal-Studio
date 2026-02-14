'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Instructor } from '@/lib/types';
import Navigation from '@/components/Navigation';
import CalendarView from '@/components/CalendarView';
import ClientList from '@/components/ClientList';
import SettlementView from '@/components/SettlementView';
import InstructorSettings from '@/components/InstructorSettings';

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('calendar');
  const instructor = (session as any)?.instructor as Instructor | null;

  if (status === 'loading') {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-heal-bg">
        <div className="spinner" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.replace('/');
    return null;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-heal-bg flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-heal-bg border-b border-heal-light">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-lg font-bold text-heal-primary tracking-[0.15em]">
              HEAL
            </h1>
            <span className="text-[9px] tracking-[0.2em] text-heal-accent font-medium uppercase">
              Pilates Studio
            </span>
          </div>
          <div className="flex items-center gap-3">
            {instructor && (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: instructor.color }}
                >
                  {instructor.name.split(' ').map((n) => n.charAt(0)).join('')}
                </div>
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-xs text-gray-400 font-medium"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        <div className={activeTab === 'calendar' ? 'h-full' : 'hidden'}>
          <CalendarView />
        </div>
        <div className={activeTab === 'clients' ? 'h-full' : 'hidden'}>
          <ClientList />
        </div>
        <div className={activeTab === 'settlements' ? 'h-full' : 'hidden'}>
          <SettlementView />
        </div>
        <div className={activeTab === 'instructors' ? 'h-full' : 'hidden'}>
          <InstructorSettings />
        </div>
      </main>

      {/* Bottom navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
