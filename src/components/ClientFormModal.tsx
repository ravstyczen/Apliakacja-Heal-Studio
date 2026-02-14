'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Client, Instructor, isOwnerOrAdmin } from '@/lib/types';

interface ClientFormModalProps {
  client?: Client;
  onClose: () => void;
  onSaved: (client: Client) => void;
}

export default function ClientFormModal({
  client: existingClient,
  onClose,
  onSaved,
}: ClientFormModalProps) {
  const { data: session } = useSession();
  const currentInstructor = (session as any)?.instructor as Instructor | null;
  const isAdmin = currentInstructor && isOwnerOrAdmin(currentInstructor.role);
  const isEdit = !!existingClient;

  const [firstName, setFirstName] = useState(existingClient?.firstName || '');
  const [lastName, setLastName] = useState(existingClient?.lastName || '');
  const [phone, setPhone] = useState(existingClient?.phone || '');
  const [email, setEmail] = useState(existingClient?.email || '');
  const [isOwnerClient, setIsOwnerClient] = useState(existingClient?.isOwnerClient || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Imię i nazwisko są wymagane');
      return;
    }

    setSaving(true);
    setError('');

    const clientData = {
      ...(existingClient ? { id: existingClient.id } : {}),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      isOwnerClient,
      regulationsAccepted: existingClient?.regulationsAccepted || false,
      regulationsAcceptedDate: existingClient?.regulationsAcceptedDate || null,
    };

    try {
      const res = await fetch('/api/clients', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (!res.ok) {
        throw new Error('Wystąpił błąd');
      }

      const savedClient = isEdit ? clientData as Client : await res.json();
      onSaved(savedClient);
    } catch (e: any) {
      setError(e.message || 'Wystąpił błąd');
    }
    setSaving(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[90] max-h-[85vh] max-h-[85dvh] overflow-y-auto animate-[slideUp_0.3s_ease]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold text-heal-dark mb-6">
            {isEdit ? 'Edytuj klienta' : 'Nowy klient'}
          </h3>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
                Imię *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Imię klienta"
                className="w-full bg-heal-light rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-heal-primary/30"
                autoFocus
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
                Nazwisko *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nazwisko klienta"
                className="w-full bg-heal-light rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-heal-primary/30"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
                Telefon
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+48 xxx xxx xxx"
                className="w-full bg-heal-light rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-heal-primary/30"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-heal-light rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-heal-primary/30"
              />
            </div>

            {/* Owner client checkbox - only for admins */}
            {isAdmin && (
              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-heal-dark">
                  Klient właściciela
                </label>
                <button
                  onClick={() => setIsOwnerClient(!isOwnerClient)}
                  className={`toggle ${isOwnerClient ? 'active' : ''}`}
                />
              </div>
            )}

            {/* Regulations status (read-only) */}
            {isEdit && existingClient && (
              <div className="bg-heal-light rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  {existingClient.regulationsAccepted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C3E2D" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D94A4A" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">
                    {existingClient.regulationsAccepted
                      ? 'Regulamin zaakceptowany'
                      : 'Regulamin niezaakceptowany'}
                  </span>
                </div>
                {existingClient.regulationsAcceptedDate && (
                  <p className="text-xs text-gray-400 ml-6">
                    Data: {existingClient.regulationsAcceptedDate}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full mt-6 flex items-center justify-center"
          >
            {saving ? (
              <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white" />
            ) : (
              isEdit ? 'Zapisz zmiany' : 'Dodaj klienta'
            )}
          </button>

          {!isEdit && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Po dodaniu klient otrzyma e-mail z regulaminem do akceptacji
            </p>
          )}
        </div>
      </div>
    </>
  );
}
