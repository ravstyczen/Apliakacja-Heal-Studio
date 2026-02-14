'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { format, subMonths, addMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  MonthlySettlement,
  Settlement,
  Instructor,
  isOwnerOrAdmin,
} from '@/lib/types';
import { DEFAULT_INSTRUCTORS } from '@/lib/instructors-data';

export default function SettlementView() {
  const { data: session } = useSession();
  const instructor = (session as any)?.instructor as Instructor | null;
  const isAdmin = instructor && isOwnerOrAdmin(instructor.role);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlySettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | ''>('');
  const [expandedInstructor, setExpandedInstructor] = useState<string | null>(null);

  const monthStr = format(currentMonth, 'yyyy-MM');

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/settlements?view=monthly&month=${monthStr}`;
      if (selectedInstructorId) {
        url += `&instructorId=${selectedInstructorId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMonthlyData(data);
      }
    } catch (e) {
      console.error('Failed to fetch settlements:', e);
    }
    setLoading(false);
  }, [monthStr, selectedInstructorId]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const navigateMonth = (direction: number) => {
    setCurrentMonth((prev) =>
      direction > 0 ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const getInstructorColor = (id: string) => {
    return DEFAULT_INSTRUCTORS.find((i) => i.id === id)?.color || '#999';
  };

  const totalHours = monthlyData.reduce((sum, m) => sum + m.totalHours, 0);
  const totalPrice = monthlyData.reduce((sum, m) => sum + m.totalPrice, 0);
  const totalShare = monthlyData.reduce((sum, m) => sum + m.totalShare, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-heal-bg z-10 px-4 pt-4 pb-3">
        <h2 className="font-display text-xl font-semibold text-heal-dark mb-4">
          Rozliczenia
        </h2>

        {/* Month navigation */}
        <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm mb-3">
          <button
            onClick={() => navigateMonth(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-heal-light"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-heal-dark capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: pl })}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-heal-light"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Instructor filter - only for admins */}
        {isAdmin && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedInstructorId('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedInstructorId === ''
                  ? 'bg-heal-primary text-white'
                  : 'bg-white text-gray-500'
              }`}
            >
              Wszyscy
            </button>
            {DEFAULT_INSTRUCTORS.map((instr) => (
              <button
                key={instr.id}
                onClick={() => setSelectedInstructorId(instr.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedInstructorId === instr.id
                    ? 'bg-heal-primary text-white'
                    : 'bg-white text-gray-500'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: instr.color }}
                />
                {instr.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : monthlyData.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">
              Brak rozliczeń w tym miesiącu
            </p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-xs text-gray-400 mb-1">Godziny</p>
                <p className="text-lg font-bold text-heal-dark">{totalHours}</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-xs text-gray-400 mb-1">Przychód</p>
                <p className="text-lg font-bold text-heal-dark">
                  {totalPrice.toLocaleString()} zł
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-xs text-gray-400 mb-1">Udziały</p>
                <p className="text-lg font-bold text-heal-dark">
                  {totalShare.toLocaleString()} zł
                </p>
              </div>
            </div>

            {/* Per-instructor breakdown */}
            <div className="space-y-3">
              {monthlyData.map((ms) => (
                <div key={ms.instructorId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Instructor header */}
                  <button
                    onClick={() =>
                      setExpandedInstructor(
                        expandedInstructor === ms.instructorId
                          ? null
                          : ms.instructorId
                      )
                    }
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: getInstructorColor(ms.instructorId) }}
                    >
                      {ms.instructorName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-heal-dark">
                        {ms.instructorName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {ms.totalHours} godz. | {ms.totalPrice} zł | Udział: {ms.totalShare} zł
                      </p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                      className={`transition-transform ${
                        expandedInstructor === ms.instructorId ? 'rotate-180' : ''
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Session details */}
                  {expandedInstructor === ms.instructorId && (
                    <div className="border-t border-heal-light px-4 pb-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400">
                            <th className="py-2 text-left font-medium">Data</th>
                            <th className="py-2 text-left font-medium">Rodzaj</th>
                            <th className="py-2 text-right font-medium">Cena</th>
                            <th className="py-2 text-right font-medium">Udział</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ms.sessions.map((s, idx) => (
                            <tr key={idx} className="border-t border-heal-light/50">
                              <td className="py-2 text-heal-dark">{s.date}</td>
                              <td className="py-2 text-heal-dark">{s.sessionType}</td>
                              <td className="py-2 text-right text-heal-dark">
                                {s.price} zł
                              </td>
                              <td className="py-2 text-right text-heal-dark">
                                {s.instructorShare} zł
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-heal-light font-semibold">
                            <td className="py-2" colSpan={2}>
                              Razem
                            </td>
                            <td className="py-2 text-right">{ms.totalPrice} zł</td>
                            <td className="py-2 text-right">{ms.totalShare} zł</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
