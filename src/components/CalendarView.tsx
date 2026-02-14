'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Session as SessionType, Instructor, isOwnerOrAdmin } from '@/lib/types';
import { DEFAULT_INSTRUCTORS } from '@/lib/instructors-data';
import SessionModal from './SessionModal';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 - 20:00

export default function CalendarView() {
  const { data: session } = useSession();
  const instructor = (session as any)?.instructor as Instructor | null;

  const [selectedDate, setSelectedDate] = useState(new Date());
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
    const today = new Date();
    setSelectedDate(today);
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
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
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 flex gap-1">
            {weekDays.map((day) => (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex-1 flex flex-col items-center py-1.5 rounded-xl transition-colors ${
                  isSameDay(day, selectedDate)
                    ? 'bg-heal-primary text-white'
                    : isToday(day)
                    ? 'bg-heal-primary/10 text-heal-primary'
                    : 'text-gray-500'
                }`}
              >
                <span className="text-[10px] font-medium uppercase">
                  {format(day, 'EEE', { locale: pl })}
                </span>
                <span className={`text-sm font-semibold ${
                  isSameDay(day, selectedDate) ? 'text-white' : ''
                }`}>
                  {format(day, 'd')}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigateWeek(1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm"
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

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          <div className="relative">
            {HOURS.map((hour) => {
              const slotSessions = getSessionsForSlot(selectedDate, hour);
              return (
                <div
                  key={hour}
                  className="time-slot flex"
                  onClick={() => handleSlotClick(selectedDate, hour)}
                >
                  {/* Time label */}
                  <div className="w-14 shrink-0 text-xs text-gray-400 font-medium pt-1 pr-2 text-right">
                    {`${hour}:00`}
                  </div>

                  {/* Session area */}
                  <div className="flex-1 border-l border-heal-light pl-2 min-h-[64px] flex flex-wrap gap-1 py-1">
                    {slotSessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={(e) => handleSessionClick(s, e)}
                        className="session-card flex-1 min-w-[80px]"
                        style={{
                          backgroundColor: `${getInstructorColor(s.instructorId)}15`,
                          borderLeft: `3px solid ${getInstructorColor(s.instructorId)}`,
                          color: getInstructorColor(s.instructorId),
                        }}
                      >
                        <div className="font-semibold text-[11px]">
                          [{s.type.toUpperCase()}]
                        </div>
                        <div className="text-[10px] opacity-80 truncate">
                          {s.instructorName?.split(' ')[0]}
                        </div>
                        {s.clientNames.length > 0 && (
                          <div className="text-[9px] opacity-60 truncate mt-0.5">
                            {s.clientNames.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}

                    {slotSessions.length === 0 && (
                      <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-30 transition-opacity">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating add button */}
      <button
        onClick={() => {
          setSelectedSlot({
            date: format(selectedDate, 'yyyy-MM-dd'),
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
