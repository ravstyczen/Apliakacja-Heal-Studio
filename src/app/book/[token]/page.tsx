'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface BookingInfo {
  date: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  instructorName: string;
  maxSlots: number;
  currentSignups: number;
  isFull: boolean;
}

export default function BookingPage() {
  const params = useParams();
  const token = params.token as string;

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/book/${token}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setBooking(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/book/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.full) {
          setBooking((prev) => prev ? { ...prev, isFull: true } : prev);
        }
        setError(data.error || 'Wystąpił błąd');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Wystąpił błąd połączenia');
    }

    setSubmitting(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#2C3E2D]/20 border-t-[#2C3E2D] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="font-serif text-3xl font-bold text-[#2C3E2D] tracking-[6px] mb-1">HEAL</div>
          <div className="text-[11px] tracking-[4px] text-[#B8A88A] mb-10">PILATES STUDIO</div>
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] mb-3">Nie znaleziono sesji</h1>
            <p className="text-sm text-gray-500">
              Link do zapisu jest nieprawidłowy lub sesja została usunięta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="font-serif text-3xl font-bold text-[#2C3E2D] tracking-[6px] mb-1">HEAL</div>
          <div className="text-[11px] tracking-[4px] text-[#B8A88A] mb-10">PILATES STUDIO</div>
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#2C3E2D] flex items-center justify-center mx-auto mb-6 text-white text-3xl">
              &#10003;
            </div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] mb-3">Zapisano!</h1>
            <p className="text-sm text-gray-500 mb-4">
              Potwierdzenie zapisu zostało wysłane na adres <strong>{email}</strong>.
            </p>
            <div className="bg-[#FAF9F7] rounded-xl p-4 text-left">
              <p className="text-xs text-gray-500 mb-1">{booking.sessionType}</p>
              <p className="text-sm font-semibold text-[#1A1A1A]">{formatDate(booking.date)}</p>
              <p className="text-sm text-gray-500">{booking.startTime} - {booking.endTime}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const spotsLeft = booking.maxSlots - booking.currentSignups;

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="font-serif text-3xl font-bold text-[#2C3E2D] tracking-[6px] mb-1">HEAL</div>
          <div className="text-[11px] tracking-[4px] text-[#B8A88A]">PILATES STUDIO</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Session info */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#2C3E2D] flex items-center justify-center text-white text-sm font-bold">
                {booking.instructorName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">{booking.instructorName}</p>
                <p className="text-xs text-gray-400">Instruktor</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-sm text-[#1A1A1A]">{formatDate(booking.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-sm text-[#1A1A1A]">{booking.startTime} - {booking.endTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="text-sm text-[#1A1A1A]">
                  {booking.sessionType} ({booking.currentSignups}/{booking.maxSlots} miejsc)
                </span>
              </div>
            </div>

            {!booking.isFull && spotsLeft > 0 && (
              <div className="mt-3 inline-block bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                {spotsLeft === 1 ? 'Zostało 1 miejsce' : `Zostało ${spotsLeft} miejsc`}
              </div>
            )}
          </div>

          {/* Signup form or full message */}
          {booking.isFull ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Sesja jest juz pelna</p>
              <p className="text-xs text-gray-500">
                Wszystkie miejsca zostaly zarezerwowane. Skontaktuj sie ze studiem aby umowic inny termin.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">Zapisz sie na sesje</h3>

              {error && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Imie</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-[#FAF9F7] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#2C3E2D]/30"
                  placeholder="Jan"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nazwisko</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-[#FAF9F7] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#2C3E2D]/30"
                  placeholder="Kowalski"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Adres e-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FAF9F7] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#2C3E2D]/30"
                  placeholder="jan@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#2C3E2D] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#3D5340] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? 'Zapisywanie...' : 'Zapisz sie'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Heal Pilates Studio &middot; ul. Stanislawa Kostki-Potockiego 2/1, 02-958 Warszawa
        </p>
      </div>
    </div>
  );
}
