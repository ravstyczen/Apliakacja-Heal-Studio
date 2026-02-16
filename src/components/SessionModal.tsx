'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Session as SessionData,
  SessionType,
  Instructor,
  Client,
  isOwnerOrAdmin,
  SESSION_CLIENT_LIMITS,
  RecurringEditMode,
} from '@/lib/types';
import { DEFAULT_INSTRUCTORS } from '@/lib/instructors-data';
import ClientPickerModal from './ClientPickerModal';

interface SessionModalProps {
  session: SessionData | null;
  defaultDate?: string;
  defaultHour?: number;
  onClose: () => void;
  onSaved: () => void;
}

const SESSION_TYPES: SessionType[] = ['Solo', 'Duo', 'Trio'];

export default function SessionModal({
  session: existingSession,
  defaultDate,
  defaultHour,
  onClose,
  onSaved,
}: SessionModalProps) {
  const { data: authSession } = useSession();
  const currentInstructor = (authSession as any)?.instructor as Instructor | null;
  const isEdit = !!existingSession;

  const [type, setType] = useState<SessionType>(existingSession?.type || 'Solo');
  const [date, setDate] = useState(existingSession?.date || defaultDate || '');
  const [startHour, setStartHour] = useState(
    existingSession ? parseInt(existingSession.startTime.split(':')[0]) : defaultHour || 8
  );
  const [instructorId, setInstructorId] = useState(
    existingSession?.instructorId || currentInstructor?.id || ''
  );
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [isRecurring, setIsRecurring] = useState(existingSession?.isRecurring || false);
  const [recurringEndDate, setRecurringEndDate] = useState(existingSession?.recurringEndDate || '');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showRecurringEdit, setShowRecurringEdit] = useState(false);
  const [recurringEditMode, setRecurringEditMode] = useState<RecurringEditMode>('single');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (existingSession && clients.length > 0) {
      const matched = existingSession.clientIds
        .map((id) => clients.find((c) => c.id === id))
        .filter(Boolean) as Client[];
      setSelectedClients(matched);
    }
  }, [existingSession, clients]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (e) {
      console.error('Failed to fetch clients:', e);
    }
  };

  const maxClients = SESSION_CLIENT_LIMITS[type];

  const availableInstructors = currentInstructor && isOwnerOrAdmin(currentInstructor.role)
    ? DEFAULT_INSTRUCTORS
    : DEFAULT_INSTRUCTORS.filter((i) => i.id === currentInstructor?.id);

  const selectedInstructor = DEFAULT_INSTRUCTORS.find((i) => i.id === instructorId);

  const handleSave = async () => {
    setError('');

    // Validation
    if (!date) {
      setError('Wybierz datę sesji');
      return;
    }
    if (!instructorId) {
      setError('Wybierz instruktora');
      return;
    }

    // Regular instructors must assign clients
    if (currentInstructor && !isOwnerOrAdmin(currentInstructor.role)) {
      if (selectedClients.length !== maxClients) {
        setError(`Sesja ${type} wymaga ${maxClients} klient${maxClients > 1 ? 'ów' : 'a'}`);
        return;
      }
    }

    if (isRecurring && !recurringEndDate) {
      setError('Wybierz datę końcową dla sesji cyklicznej');
      return;
    }

    setSaving(true);

    const sessionData = {
      date,
      startTime: `${String(startHour).padStart(2, '0')}:00`,
      endTime: `${String(startHour + 1).padStart(2, '0')}:00`,
      type,
      instructorId,
      instructorName: selectedInstructor?.name || '',
      clientIds: selectedClients.map((c) => c.id),
      clientNames: selectedClients.map((c) => `${c.firstName} ${c.lastName}`),
      isRecurring,
      recurringGroupId: existingSession?.recurringGroupId || (isRecurring ? `recurring-${Date.now()}` : null),
      recurringEndDate: isRecurring ? recurringEndDate : null,
    };

    try {
      if (isEdit && existingSession) {
        if (existingSession.isRecurring) {
          setShowRecurringEdit(true);
          setSaving(false);
          return;
        }
        await fetch('/api/sessions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: existingSession.calendarEventId,
            ...sessionData,
          }),
        });
      } else {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData),
        });
      }
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Wystąpił błąd');
    }
    setSaving(false);
  };

  const handleRecurringEditConfirm = async () => {
    if (!existingSession) return;
    setSaving(true);

    const sessionData = {
      eventId: existingSession.calendarEventId,
      date,
      startTime: `${String(startHour).padStart(2, '0')}:00`,
      endTime: `${String(startHour + 1).padStart(2, '0')}:00`,
      type,
      instructorId,
      instructorName: selectedInstructor?.name || '',
      clientIds: selectedClients.map((c) => c.id),
      clientNames: selectedClients.map((c) => `${c.firstName} ${c.lastName}`),
      editMode: recurringEditMode,
    };

    try {
      await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Wystąpił błąd');
    }
    setSaving(false);
    setShowRecurringEdit(false);
  };

  const handleDelete = async () => {
    if (!existingSession) return;

    if (existingSession.isRecurring) {
      setShowRecurringEdit(true);
      return;
    }

    setDeleting(true);
    try {
      const deleteParams = new URLSearchParams({
        eventId: existingSession.calendarEventId,
        date: existingSession.date,
        instructorId: existingSession.instructorId,
        sessionType: existingSession.type,
      });
      await fetch(`/api/sessions?${deleteParams}`, {
        method: 'DELETE',
      });
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Wystąpił błąd');
    }
    setDeleting(false);
  };

  const handleDeleteRecurringConfirm = async () => {
    if (!existingSession) return;
    setDeleting(true);
    try {
      const deleteParams = new URLSearchParams({
        eventId: existingSession.calendarEventId,
        editMode: recurringEditMode,
        date: existingSession.date,
        instructorId: existingSession.instructorId,
        sessionType: existingSession.type,
      });
      await fetch(`/api/sessions?${deleteParams}`, { method: 'DELETE' });
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Wystąpił błąd');
    }
    setDeleting(false);
    setShowRecurringEdit(false);
  };

  const addClient = (client: Client) => {
    if (selectedClients.length < maxClients) {
      setSelectedClients([...selectedClients, client]);
    }
    setShowClientPicker(false);
  };

  const removeClient = (clientId: string) => {
    setSelectedClients(selectedClients.filter((c) => c.id !== clientId));
  };

  // Recurring edit mode dialog
  if (showRecurringEdit) {
    return (
      <>
        <div className="modal-backdrop" onClick={onClose} />
        <div className="modal-panel p-6">
          <h3 className="text-lg font-semibold text-heal-dark mb-4">
            Modyfikacja sesji cyklicznej
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Jak chcesz zastosować zmiany?
          </p>

          <div className="space-y-3 mb-6">
            {[
              { mode: 'single' as const, label: 'Tylko tę sesję' },
              { mode: 'future' as const, label: 'Tę i wszystkie przyszłe' },
              { mode: 'all' as const, label: 'Wszystkie sesje w serii' },
            ].map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setRecurringEditMode(mode)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  recurringEditMode === mode
                    ? 'border-heal-primary bg-heal-primary/5'
                    : 'border-heal-light'
                }`}
              >
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowRecurringEdit(false)}
              className="btn-secondary flex-1"
            >
              Anuluj
            </button>
            <button
              onClick={deleting ? handleDeleteRecurringConfirm : handleRecurringEditConfirm}
              className={`flex-1 ${deleting ? 'btn-danger' : 'btn-primary'}`}
              disabled={saving}
            >
              {deleting ? 'Usuń' : 'Zastosuj'}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-6 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-heal-dark">
              {isEdit ? 'Edytuj sesję' : 'Nowa sesja'}
            </h3>
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-500 text-sm font-medium"
              >
                {deleting ? 'Usuwanie...' : 'Usuń'}
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* Session type */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Rodzaj sesji
            </label>
            <div className="flex gap-2">
              {SESSION_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setType(t);
                    // Trim clients if needed
                    const limit = SESSION_CLIENT_LIMITS[t];
                    if (selectedClients.length > limit) {
                      setSelectedClients(selectedClients.slice(0, limit));
                    }
                  }}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors ${
                    type === t
                      ? 'bg-heal-primary text-white'
                      : 'bg-heal-light text-heal-dark'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-heal-light rounded-xl px-4 py-3 text-sm text-heal-dark outline-none focus:ring-2 focus:ring-heal-primary/30"
            />
          </div>

          {/* Time */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Godzina
            </label>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="w-full bg-heal-light rounded-xl px-4 py-3 text-sm text-heal-dark outline-none focus:ring-2 focus:ring-heal-primary/30"
            >
              {Array.from({ length: 13 }, (_, i) => i + 8).map((h) => (
                <option key={h} value={h}>
                  {`${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`}
                </option>
              ))}
            </select>
          </div>

          {/* Instructor */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Instruktor
            </label>
            <div className="space-y-2">
              {availableInstructors.map((instr) => (
                <button
                  key={instr.id}
                  onClick={() => setInstructorId(instr.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                    instructorId === instr.id
                      ? 'border-heal-primary bg-heal-primary/5'
                      : 'border-heal-light'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: instr.color }}
                  >
                    {instr.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{instr.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Clients */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Klienci ({selectedClients.length}/{maxClients})
            </label>
            <div className="space-y-2">
              {selectedClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between bg-heal-light rounded-xl px-4 py-3"
                >
                  <span className="text-sm font-medium">
                    {client.firstName} {client.lastName}
                  </span>
                  <button
                    onClick={() => removeClient(client.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}

              {selectedClients.length < maxClients && (
                <button
                  onClick={() => setShowClientPicker(true)}
                  className="w-full flex items-center justify-center gap-2 bg-heal-light rounded-xl px-4 py-3 text-sm text-gray-500 border-2 border-dashed border-gray-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Dodaj klienta
                </button>
              )}
            </div>
          </div>

          {/* Recurring */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Sesja cykliczna
              </label>
              <button
                onClick={() => setIsRecurring(!isRecurring)}
                className={`toggle ${isRecurring ? 'active' : ''}`}
              />
            </div>

            {isRecurring && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Powtarzaj co tydzień do:
                </label>
                <input
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                  min={date}
                  className="w-full bg-heal-light rounded-xl px-4 py-3 text-sm text-heal-dark outline-none focus:ring-2 focus:ring-heal-primary/30"
                />
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center"
          >
            {saving ? (
              <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white" />
            ) : (
              isEdit ? 'Zapisz zmiany' : 'Dodaj sesję'
            )}
          </button>
        </div>
      </div>

      {/* Client Picker */}
      {showClientPicker && (
        <ClientPickerModal
          clients={clients.filter(
            (c) => !selectedClients.some((sc) => sc.id === c.id)
          )}
          onSelect={addClient}
          onClose={() => setShowClientPicker(false)}
          onClientCreated={(newClient) => {
            setClients([...clients, newClient]);
            addClient(newClient);
          }}
        />
      )}
    </>
  );
}
