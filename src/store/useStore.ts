import { create } from 'zustand';
import { Session, Client, Instructor, Settlement, MonthlySettlement } from '@/lib/types';

interface AppState {
  // Current user
  currentInstructor: Instructor | null;
  setCurrentInstructor: (instructor: Instructor | null) => void;

  // Sessions
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (session: Session) => void;
  removeSession: (id: string) => void;

  // Clients
  clients: Client[];
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  removeClient: (id: string) => void;

  // Instructors
  instructors: Instructor[];
  setInstructors: (instructors: Instructor[]) => void;
  updateInstructor: (instructor: Instructor) => void;

  // Settlements
  settlements: Settlement[];
  setSettlements: (settlements: Settlement[]) => void;
  monthlySettlements: MonthlySettlement[];
  setMonthlySettlements: (settlements: MonthlySettlement[]) => void;

  // UI State
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  currentInstructor: null,
  setCurrentInstructor: (instructor) => set({ currentInstructor: instructor }),

  sessions: [],
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
    })),
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
    })),

  clients: [],
  setClients: (clients) => set({ clients }),
  addClient: (client) =>
    set((state) => ({ clients: [...state.clients, client] })),
  updateClient: (client) =>
    set((state) => ({
      clients: state.clients.map((c) => (c.id === client.id ? client : c)),
    })),
  removeClient: (id) =>
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    })),

  instructors: [],
  setInstructors: (instructors) => set({ instructors }),
  updateInstructor: (instructor) =>
    set((state) => ({
      instructors: state.instructors.map((i) =>
        i.id === instructor.id ? instructor : i
      ),
    })),

  settlements: [],
  setSettlements: (settlements) => set({ settlements }),
  monthlySettlements: [],
  setMonthlySettlements: (settlements) =>
    set({ monthlySettlements: settlements }),

  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  activeTab: 'calendar',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
