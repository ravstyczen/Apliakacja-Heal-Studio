'use client';

import { useSession } from 'next-auth/react';
import { isOwnerOrAdmin, Instructor } from '@/lib/types';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { data: session } = useSession();
  const instructor = (session as any)?.instructor as Instructor | null;
  const showInstructors = instructor && isOwnerOrAdmin(instructor.role);

  const tabs = [
    { id: 'calendar', label: 'Kalendarz', icon: CalendarIcon },
    { id: 'clients', label: 'Klienci', icon: UsersIcon },
    { id: 'settlements', label: 'Rozliczenia', icon: ChartIcon },
    ...(showInstructors
      ? [{ id: 'instructors', label: 'Instruktorzy', icon: SettingsIcon }]
      : []),
  ];

  return (
    <nav className="bottom-nav">
      <div className="flex justify-around items-center px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[64px] ${
                isActive
                  ? 'text-heal-primary'
                  : 'text-gray-400'
              }`}
            >
              <Icon active={isActive} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-heal-primary' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {isActive && <div className="tab-dot" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#2C3E2D' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function UsersIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#2C3E2D' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#2C3E2D' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#2C3E2D' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
