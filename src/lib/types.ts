export type InstructorRole = 'owner' | 'admin' | 'instructor';

export type SessionType = 'Solo' | 'Duo' | 'Trio';

export const SESSION_CLIENT_LIMITS: Record<SessionType, number> = {
  Solo: 1,
  Duo: 2,
  Trio: 3,
};

export interface InstructorPricing {
  solo: { price: number; share: number };
  duo: { price: number; share: number };
  trio: { price: number; share: number };
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  color: string;
  colorName: string;
  role: InstructorRole;
  pricing: InstructorPricing;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isOwnerClient: boolean;
  regulationsAccepted: boolean;
  regulationsAcceptedDate: string | null;
}

export interface Session {
  id: string;
  calendarEventId: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: SessionType;
  instructorId: string;
  instructorName: string;
  clientIds: string[];
  clientNames: string[];
  isRecurring: boolean;
  recurringGroupId: string | null;
  recurringEndDate: string | null; // ISO date string
  isOpenSession: boolean;
  bookingToken: string | null;
}

export interface Settlement {
  id: string;
  date: string;
  time: string; // HH:mm
  sessionType: SessionType;
  instructorId: string;
  instructorName: string;
  clientNames: string[];
  price: number;
  instructorShare: number;
}

export interface MonthlySettlement {
  month: string; // YYYY-MM
  instructorId: string;
  instructorName: string;
  totalHours: number;
  totalPrice: number;
  totalShare: number;
  sessions: Settlement[];
}

export type RecurringEditMode = 'single' | 'future' | 'all';

export function isOwnerOrAdmin(role: InstructorRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function getCalendarEventTitle(type: SessionType, instructorFirstName: string): string {
  return `[${type.toUpperCase()}] - ${instructorFirstName}`;
}

export function getSessionPrice(pricing: InstructorPricing, type: SessionType): number {
  return pricing[type.toLowerCase() as keyof InstructorPricing].price;
}

export function getSessionShare(pricing: InstructorPricing, type: SessionType): number {
  return pricing[type.toLowerCase() as keyof InstructorPricing].share;
}
