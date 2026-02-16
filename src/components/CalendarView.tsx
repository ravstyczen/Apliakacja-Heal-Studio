'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Session as SessionType, Instructor } from '@/lib/types';
import { DEFAULT_INSTRUCTORS } from '@/lib/instructors-data';
import SessionModal from './SessionModal';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 - 20:00

export default function CalendarView() {
  const { data: session } = useSession();
  const instructor = (session as any)?.instructor as Instructor | null;

  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; hour: number } | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const timeMin = format(weekStart, 'yyyy-MM-dd');
      const timeMax = format(addDays(weekStart, 7), 'yyyy-MM-dd');
      const res = await fetch(`/api/sessions?timeMin=${timeMin}&timeMax=${timeMax}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
    setLoading(false);
  }, [weekStart]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const navigateWeek = (direction: number) => {
    setWeekStart((prev) => addDays(prev, direction * 7));
  };

  const goToToday = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const getSessionsForSlot = (date: Date, hour: number): SessionType[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter((s) => {
      const sessionHour = parseInt(s.startTime.split(':')[0]);
      return s.date === dateStr && sessionHour === hour;
    });
  };

  const getInstructorColor = (instructorId: string): string => {
    const instr = DEFAULT_INSTRUCTORS.find((i) => i.id === instructorId);
    return instr?.color || '#999';
  };

  const handleSlotClick = (date: Date, hour: number) => {
    setSelectedSlot({
      date: format(date, 'yyyy-MM-dd'),
      hour,
    });
    setSelectedSession(null);
    setShowModal(true);
  };

  const handleSessionClick = (session: SessionType, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSession(session);
    setSelectedSlot(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSession(null);
    setSelectedSlot(null);
  };

  const handleSessionSaved = () => {
    handleModalClose();
    fetchSessions();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with week navigation */}
      <div className="sticky top-0 bg-heal-bg z-20 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-semibold text-heal-dark">
            {format(weekStart, 'MMMM yyyy', { locale: pl })}
          </h2>
          <button
            onClick={goToToday}
            className="text-xs font-medium text-heal-primary bg-heal-primary/10 px-3 py-1.5 rounded-full"
          >
            Dziś
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigateWeek(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Instructor legend */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {DEFAULT_INSTRUCTORS.map((instr) => (
            <div key={instr.id} className="flex items-center gap-1.5 shrink-0">
              <div
                className="instructor-dot"
                style={{ backgroundColor: instr.color }}
              />
              <span className="text-[10px] text-gray-500 font-medium">
                {instr.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly calendar grid */}
      <div className="flex-1 overflow-auto px-2 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          <div className="min-w-[600px]">
            {/* Day headers */}
            <div className="grid sticky top-0 bg-heal-bg z-10" style={{ gridTemplateColumns: '40px repeat(7, 1fr)' }}>
              <div />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`text-center py-2 ${
                    isToday(day) ? 'text-heal-primary' : 'text-gray-500'
                  }`}
                >
                  <div className="text-[10px] font-medium uppercase">
                    {format(day, 'EEE', { locale: pl })}
                  </div>
                  <div className={`text-sm font-semibold ${
                    isToday(day)
                      ? 'bg-heal-primary text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto'
                      : ''
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time grid rows */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid border-t border-heal-light/50"
                style={{ gridTemplateColumns: '40px repeat(7, 1fr)' }}
              >
                {/* Time label */}
                <div className="text-[10px] text-gray-400 font-medium pt-1 pr-1 text-right">
                  {`${hour}:00`}
                </div>

                {/* Day cells */}
                {weekDays.map((day) => {
                  const slotSessions = getSessionsForSlot(day, hour);
                  return (
                    <div
                      key={day.toISOString()}
                      className="border-l border-heal-light/50 min-h-[56px] p-0.5 cursor-pointer hover:bg-heal-primary/5 transition-colors"
                      onClick={() => handleSlotClick(day, hour)}
                    >
                      {slotSessions.map((s) => (
                        <div
                          key={s.id}
                          onClick={(e) => handleSessionClick(s, e)}
                          className="rounded-md p-1 mb-0.5 cursor-pointer"
                          style={{
                            backgroundColor: `${getInstructorColor(s.instructorId)}15`,
                            borderLeft: `2px solid ${getInstructorColor(s.instructorId)}`,
                            color: getInstructorColor(s.instructorId),
                          }}
                        >
                          <div className="font-semibold text-[9px] leading-tight">
                            {s.type.charAt(0)}
                          </div>
                          <div className="text-[8px] opacity-80 truncate leading-tight">
                            {s.instructorName?.split(' ')[0]}
                          </div>
                          {Array.isArray(s.clientNames) && s.clientNames.length > 0 && (
                            <div className="text-[7px] opacity-60 leading-tight">
                              {s.clientNames.map((name, i) => (
                                <div key={i} className="truncate">{name}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating add button */}
      <button
        onClick={() => {
          setSelectedSlot({
            date: format(new Date(), 'yyyy-MM-dd'),
            hour: 8,
          });
          setSelectedSession(null);
          setShowModal(true);
        }}
        className="fixed bottom-20 right-4 w-14 h-14 bg-heal-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Session Modal */}
      {showModal && (
        <SessionModal
          session={selectedSession}
          defaultDate={selectedSlot?.date}
          defaultHour={selectedSlot?.hour}
          onClose={handleModalClose}
          onSaved={handleSessionSaved}
        />
      )}
    </div>
  );
}
