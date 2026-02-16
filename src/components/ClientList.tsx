'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Client, Instructor, isOwnerOrAdmin } from '@/lib/types';
import ClientFormModal from './ClientFormModal';

export default function ClientList() {
  const { data: session } = useSession();
  const instructor = (session as any)?.instructor as Instructor | null;
  const isAdmin = instructor && isOwnerOrAdmin(instructor.role);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [filter, setFilter] = useState<'all' | 'accepted' | 'pending'>('all');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (e) {
      console.error('Failed to fetch clients:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter((c) => {
    const matchesSearch = `${c.firstName} ${c.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase());

    if (filter === 'accepted') return matchesSearch && c.regulationsAccepted;
    if (filter === 'pending') return matchesSearch && !c.regulationsAccepted;
    return matchesSearch;
  });

  const handleDelete = async (clientId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego klienta?')) return;

    try {
      await fetch(`/api/clients?clientId=${clientId}`, { method: 'DELETE' });
      setClients(clients.filter((c) => c.id !== clientId));
    } catch (e) {
      console.error('Failed to delete client:', e);
    }
  };

  const handleSaved = (client: Client) => {
    if (editClient) {
      setClients(clients.map((c) => (c.id === client.id ? client : c)));
    } else {
      setClients([...clients, client]);
    }
    setShowForm(false);
    setEditClient(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-heal-bg z-10 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-heal-dark">
            Klienci
          </h2>
          <span className="text-sm text-gray-400">
            {clients.length} {clients.length === 1 ? 'klient' : 'klientów'}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
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
            className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-heal-primary/30"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { id: 'all' as const, label: 'Wszyscy' },
            { id: 'accepted' as const, label: 'Zaakceptowali' },
            { id: 'pending' as const, label: 'Oczekujący' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.id
                  ? 'bg-heal-primary text-white'
                  : 'bg-white text-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client list */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm mb-4">
              {search ? 'Nie znaleziono klientów' : 'Brak klientów'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => {
                  setEditClient(client);
                  setShowForm(true);
                }}
                className="bg-white rounded-xl p-4 shadow-sm active:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-heal-primary/10 flex items-center justify-center text-heal-primary font-semibold text-sm shrink-0">
                    {client.firstName.charAt(0)}
                    {client.lastName.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-heal-dark">
                        {client.firstName} {client.lastName}
                      </span>
                      {client.isOwnerClient && isAdmin && (
                        <span className="text-[10px] bg-heal-accent/20 text-heal-accent px-1.5 py-0.5 rounded-full font-medium">
                          VIP
                        </span>
                      )}
                    </div>

                    {client.phone && (
                      <p className="text-xs text-gray-400 mt-0.5">{client.phone}</p>
                    )}
                    {client.email && (
                      <p className="text-xs text-gray-400">{client.email}</p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {client.regulationsAccepted ? (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(client.id);
                      }}
                      className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 active:bg-red-200 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={() => {
          setEditClient(null);
          setShowForm(true);
        }}
        className="fixed bottom-20 right-4 w-14 h-14 bg-heal-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Form Modal */}
      {showForm && (
        <ClientFormModal
          client={editClient || undefined}
          onClose={() => {
            setShowForm(false);
            setEditClient(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
