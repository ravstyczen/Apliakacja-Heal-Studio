'use client';

import { useState } from 'react';
import { Client } from '@/lib/types';
import ClientFormModal from './ClientFormModal';

interface ClientPickerModalProps {
  clients: Client[];
  onSelect: (client: Client) => void;
  onClose: () => void;
  onClientCreated: (client: Client) => void;
}

export default function ClientPickerModal({
  clients,
  onSelect,
  onClose,
  onClientCreated,
}: ClientPickerModalProps) {
  const [search, setSearch] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);

  const filteredClients = clients.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  if (showNewClient) {
    return (
      <ClientFormModal
        onClose={() => setShowNewClient(false)}
        onSaved={(client) => {
          onClientCreated(client);
          setShowNewClient(false);
        }}
      />
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[70] max-h-[80vh] max-h-[80dvh] flex flex-col animate-[slideUp_0.3s_ease]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-6 pb-6 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-lg font-semibold text-heal-dark">
              Wybierz klienta
            </h3>
            <button
              onClick={() => setShowNewClient(true)}
              className="text-sm font-medium text-heal-primary"
            >
              + Nowy
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4 shrink-0">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Szukaj klienta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-heal-light rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-heal-primary/30"
              autoFocus
            />
          </div>

          {/* Client list */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-4">
                  {search ? 'Nie znaleziono klienta' : 'Brak klientów'}
                </p>
                <button
                  onClick={() => setShowNewClient(true)}
                  className="btn-primary text-sm"
                >
                  Dodaj nowego klienta
                </button>
              </div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => onSelect(client)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-heal-light transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-heal-primary/10 flex items-center justify-center text-heal-primary font-semibold text-sm">
                    {client.firstName.charAt(0)}
                    {client.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-heal-dark">
                      {client.firstName} {client.lastName}
                    </div>
                    {client.phone && (
                      <div className="text-xs text-gray-400">{client.phone}</div>
                    )}
                  </div>
                  {client.regulationsAccepted && (
                    <div className="ml-auto">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C3E2D" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
