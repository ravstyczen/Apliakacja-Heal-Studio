'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Instructor, isOwnerOrAdmin } from '@/lib/types';
import { DEFAULT_INSTRUCTORS } from '@/lib/instructors-data';

export default function InstructorSettings() {
  const { data: session } = useSession();
  const currentInstructor = (session as any)?.instructor as Instructor | null;

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/instructors');
      if (res.ok) {
        const data = await res.json();
        setInstructors(data);
      }
    } catch (e) {
      // Fallback to defaults
      setInstructors(DEFAULT_INSTRUCTORS);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  if (!currentInstructor || !isOwnerOrAdmin(currentInstructor.role)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">Brak dostępu</p>
      </div>
    );
  }

  const updatePricing = (
    instructorId: string,
    type: 'solo' | 'duo' | 'trio',
    field: 'price' | 'share',
    value: number
  ) => {
    setInstructors((prev) =>
      prev.map((i) => {
        if (i.id !== instructorId) return i;
        return {
          ...i,
          pricing: {
            ...i.pricing,
            [type]: {
              ...i.pricing[type],
              [field]: value,
            },
          },
        };
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/instructors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructors }),
      });
      if (res.ok) {
        setMessage('Zapisano pomyślnie');
        setEditingId(null);
      } else {
        setMessage('Wystąpił błąd');
      }
    } catch {
      setMessage('Wystąpił błąd');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-heal-bg z-10 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-xl font-semibold text-heal-dark">
            Instruktorzy
          </h2>
          {editingId && (
            <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-2 px-4">
              {saving ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          )}
        </div>
        {message && (
          <div className={`text-sm p-2 rounded-lg text-center ${
            message.includes('błąd') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Instructor list */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          <div className="space-y-4">
            {instructors.map((instr) => (
              <div key={instr.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Instructor header */}
                <div className="p-4 flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: instr.color }}
                  >
                    {instr.name.split(' ').map((n) => n.charAt(0)).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-heal-dark">
                      {instr.name}
                    </p>
                    <p className="text-xs text-gray-400">{instr.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          instr.role === 'owner'
                            ? 'bg-amber-100 text-amber-700'
                            : instr.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {instr.role === 'owner'
                          ? 'Właściciel'
                          : instr.role === 'admin'
                          ? 'Admin'
                          : 'Instruktor'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Kolor: {instr.colorName}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setEditingId(editingId === instr.id ? null : instr.id)
                    }
                    className="text-heal-primary text-xs font-medium"
                  >
                    {editingId === instr.id ? 'Zwiń' : 'Edytuj'}
                  </button>
                </div>

                {/* Pricing table */}
                <div className={`border-t border-heal-light ${editingId === instr.id ? '' : ''}`}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-heal-bg">
                        <th className="py-2 px-4 text-left font-medium text-gray-500">
                          Rodzaj
                        </th>
                        <th className="py-2 px-3 text-right font-medium text-gray-500">
                          Cena (zł)
                        </th>
                        <th className="py-2 px-4 text-right font-medium text-gray-500">
                          Udział (zł)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['solo', 'duo', 'trio'] as const).map((type) => (
                        <tr key={type} className="border-t border-heal-light/50">
                          <td className="py-2.5 px-4 font-medium text-heal-dark uppercase">
                            {type}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {editingId === instr.id ? (
                              <input
                                type="number"
                                value={instr.pricing[type].price}
                                onChange={(e) =>
                                  updatePricing(instr.id, type, 'price', Number(e.target.value))
                                }
                                className="w-20 bg-heal-light rounded-lg px-2 py-1.5 text-right text-xs outline-none focus:ring-2 focus:ring-heal-primary/30"
                              />
                            ) : (
                              <span className="text-heal-dark">
                                {instr.pricing[type].price}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {editingId === instr.id ? (
                              <input
                                type="number"
                                value={instr.pricing[type].share}
                                onChange={(e) =>
                                  updatePricing(instr.id, type, 'share', Number(e.target.value))
                                }
                                className="w-20 bg-heal-light rounded-lg px-2 py-1.5 text-right text-xs outline-none focus:ring-2 focus:ring-heal-primary/30"
                              />
                            ) : (
                              <span className="text-heal-dark">
                                {instr.pricing[type].share}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
