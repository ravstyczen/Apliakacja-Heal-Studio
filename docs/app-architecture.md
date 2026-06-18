# HEAL Pilates Studio - Complete Application Architecture

## PROJECT OVERVIEW

Full-stack Next.js 14 web application for managing a Pilates studio: sessions, clients, settlements, and instructor management. Mobile-first SPA designed for studio staff. Uses Google Calendar as the session source of truth, Google Sheets for client/instructor/settlement data, Google OAuth for authentication, and Nodemailer for transactional emails.

**Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, NextAuth.js, Google APIs (Calendar + Sheets), Nodemailer

---

## 1. FEATURES AND USER FLOWS

### 1.1 Authentication & Authorization
- **Provider**: Google OAuth 2.0 (email-based)
- **Session Strategy**: JWT with refresh token handling
- **Max Session Age**: 30 days
- **Access Control**: Role-based (owner, admin, instructor)
- **Instructor Lookup**: Via email in hardcoded defaults + Google Sheets (Instruktorzy sheet)

**User Roles**:
- **Owner** (Agnieszka Puchalska): Full access to all features
- **Admin** (Rafal Styczen): Full access to all features
- **Instructor**: Limited to viewing own data

| Feature | Owner/Admin | Instructor |
|---------|-------------|-----------|
| Calendar (view all sessions) | Yes | Yes |
| Create sessions without clients | Yes | No (unless open session) |
| View all clients | Yes | Yes |
| View all settlements | Yes | Own only |
| Manage instructor pricing | Yes | No |

### 1.2 Session Management (Calendar View)
- **Time Grid**: 8:00 - 20:00 (13 hourly slots)
- **View**: Weekly calendar (Mon-Sun)
- **Session Types**: Solo (1 client), Duo (2 clients), Trio (3 clients)
- **Features**:
  - Create new sessions (click empty slot or + button)
  - Edit sessions (click existing session)
  - Delete sessions (with confirm dialog)
  - Recurring sessions (weekly, set end date via RRULE)
  - Edit modes for recurring: single, future, all
  - Open sessions (public booking links)
  - Client assignment modal
  - Week navigation (prev/next/today + swipe gestures)
  - 15-second background polling for real-time updates
  - Visibility change refresh (when switching apps/tabs)
  - Visual indicators: purple arrows for recurring, green globe for open sessions
  - Instructor color-coded session cards

### 1.3 Session Pricing
- **Dynamic**: Based on instructor.pricing config stored in Instruktorzy sheet
- **Types**: Solo, Duo, Trio
- **Price vs Share**: Price = full session cost; Share = instructor's portion
- Default pricing examples:
  - Agnieszka (owner): Solo 260/260, Duo 360/360, Trio 450/450 (keeps 100%)
  - Ola: Solo 260/120, Duo 360/150, Trio 450/190
  - Ania: Solo 260/160, Duo 360/210, Trio 450/250

### 1.4 Client Management
- **Fields**: ID, first name, last name, phone, email, isOwnerClient flag, regulationsAccepted, regulationsAcceptedDate
- **Phone Formatting**: Auto-formats Polish numbers (+48 xxx yyy zzz)
- **Search**: Full-name based filtering with Polish collation
- **Filters**: All, accepted regulations, pending
- **Regulations Email**: Auto-sent to new clients with acceptance link
- **Real-time Polling**: 15-second background sync + visibilitychange listener

### 1.5 Regulations Acceptance
1. Client created -> regulations email sent with unique link
2. Client clicks link (`/api/regulations/accept?clientId=ID`) - public, no auth
3. Client status updated (regulationsAccepted=true, date set)
4. Confirmation email sent to owner

### 1.6 Open Sessions & Public Booking
- **Booking Token**: 12-char random UUID, generated client-side
- **Public URL**: `/book/{token}` (no authentication required)
- **Max Slots**: Based on SessionType (Solo=1, Duo=2, Trio=3)
- **Signup Flow**:
  1. Public form: first name, last name, email
  2. Duplicate check (email uniqueness per session)
  3. Capacity check (returns 409 when full)
  4. Stored in Rezerwacje sheet as JSON signups
  5. Calendar event description updated with all names
  6. Confirmation email sent to user

### 1.7 Settlements & Billing
- **Source of Truth**: Google Calendar events (not incremental writes)
- **Sync Process**: Manual "Przelicz" button or auto-on SettlementView mount
  1. Read all calendar events (6 months past + 3 months future)
  2. Load instructor pricing from Instruktorzy sheet
  3. Clear Sesje sheet completely
  4. Write fresh settlements with current pricing
- **View**: Monthly aggregation by instructor with drill-down
- **Totals**: hours, price, instructor share
- **Access**: Admins see all; instructors see own only

### 1.8 Recurring Sessions
- **Frequency**: Weekly only (FREQ=WEEKLY;UNTIL=date)
- **Edit Modes**:
  - **single**: Only this instance (exception in Google Calendar)
  - **future**: This + all subsequent (splits the recurring series)
  - **all**: Entire series (modifies base event)
- **Extended Properties**: Metadata stored in BOTH shared AND private properties for recurring event compatibility

---

## 2. ALL API ENDPOINTS

### 2.1 Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js Google OAuth handler

### 2.2 Sessions (Calendar)
- `GET /api/sessions?timeMin=ISO&timeMax=ISO` - Fetch calendar events with instructor resolution + booking signups
- `POST /api/sessions` - Create session (calendar event + optional booking record)
  - Body: `{ date, startTime, endTime, type, instructorId, instructorName, clientIds, clientNames, isRecurring, recurringEndDate, isOpenSession, bookingToken }`
- `PUT /api/sessions` - Update session with editMode support
  - Body: `{ eventId, ...sessionData, editMode: 'single'|'future'|'all' }`
- `DELETE /api/sessions?eventId=ID&editMode=MODE&date=DATE&instructorId=ID&sessionType=TYPE&startTime=TIME`

### 2.3 Clients
- `GET /api/clients` - All clients (no filtering)
- `POST /api/clients` - Create client + send regulations email
  - Body: `{ firstName, lastName, phone, email, isOwnerClient }`
- `PUT /api/clients` - Update client
  - Body: full Client object with id
- `DELETE /api/clients?clientId=ID`

### 2.4 Instructors
- `GET /api/instructors` - All instructors (auto-syncs defaults to sheet)
- `PUT /api/instructors` - Update instructors (admin only)
  - Body: `{ instructors: Instructor[] }`

### 2.5 Settlements
- `GET /api/settlements?view=monthly&month=YYYY-MM&instructorId=ID`
- `POST /api/settlements/sync` - Rebuild settlements from calendar

### 2.6 Public Endpoints (no auth)
- `GET /api/regulations/accept?clientId=ID` - Returns HTML acceptance page
- `GET /api/book/[token]` - Booking info (date, times, type, instructor, slots, signups)
- `POST /api/book/[token]` - Submit booking signup
  - Body: `{ firstName, lastName, email }`

---

## 3. DATA MODEL

### 3.1 TypeScript Types

```typescript
type InstructorRole = 'owner' | 'admin' | 'instructor';
type SessionType = 'Solo' | 'Duo' | 'Trio';
type RecurringEditMode = 'single' | 'future' | 'all';

const SESSION_CLIENT_LIMITS: Record<SessionType, number> = {
  Solo: 1, Duo: 2, Trio: 3
};

interface Instructor {
  id: string;
  name: string;
  email: string;
  color: string;           // hex #RRGGBB
  colorName: string;       // Polish name (zolty, czarny, etc)
  role: InstructorRole;
  pricing: {
    solo: { price: number; share: number };
    duo: { price: number; share: number };
    trio: { price: number; share: number };
  };
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isOwnerClient: boolean;
  regulationsAccepted: boolean;
  regulationsAcceptedDate: string | null;  // ISO date
}

interface Session {
  id: string;
  calendarEventId: string;
  date: string;                          // YYYY-MM-DD
  startTime: string;                     // HH:mm
  endTime: string;                       // HH:mm
  type: SessionType;
  instructorId: string;
  instructorName: string;
  instructorColor?: string;
  clientIds: string[];
  clientNames: string[];
  isRecurring: boolean;
  recurringGroupId: string | null;
  recurringEndDate: string | null;
  isOpenSession: boolean;
  bookingToken: string | null;
  bookingSignups?: Array<{
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

interface Settlement {
  id: string;
  date: string;             // YYYY-MM-DD
  time: string;             // HH:mm
  sessionType: SessionType;
  instructorId: string;
  instructorName: string;
  clientNames: string[];
  price: number;
  instructorShare: number;
}

interface MonthlySettlement {
  month: string;            // YYYY-MM
  instructorId: string;
  instructorName: string;
  totalHours: number;
  totalPrice: number;
  totalShare: number;
  sessions: Settlement[];
}
```

### 3.2 Google Sheets Structure

**Sheet: "Klienci" (Columns A-H)**
| A: ID | B: Imie | C: Nazwisko | D: Telefon | E: E-mail | F: Klient wlasciciela | G: Regulamin zaakceptowany | H: Data akceptacji |

**Sheet: "Sesje" (Columns A-I)** - Settlement data, rebuilt on sync
| A: ID | B: Data | C: Godzina | D: Rodzaj sesji | E: ID Instruktora | F: Instruktor | G: Klienci | H: Cena | I: Udzial instruktora |

**Sheet: "Instruktorzy" (Columns A-L)**
| A: ID | B: Imie i Nazwisko | C: E-mail | D: Kolor | E: Nazwa koloru | F: Rola | G: Solo cena | H: Solo udzial | I: Duo cena | J: Duo udzial | K: Trio cena | L: Trio udzial |

**Sheet: "Rezerwacje" (Columns A-I)** - Open session bookings
| A: Token | B: CalendarEventId | C: Data | D: Godzina start | E: Godzina koniec | F: Rodzaj | G: Instruktor | H: Max miejsc | I: Zapisy (JSON array) |

### 3.3 Google Calendar Event Structure
- **Title**: `[TYPE] - FirstName` (e.g., `[SOLO] - Agnieszka`)
- **Description**: `Klienci: name1, name2, ...` (or booking signups list)
- **Timezone**: Europe/Warsaw
- **Extended Properties** (stored in both `shared` AND `private`):
  - `sessionType`: Solo/Duo/Trio
  - `instructorId`: instructor ID string
  - `instructorName`: full name
  - `instructorColor`: hex color
  - `clientIds`: comma-separated IDs
  - `clientNames`: comma-separated names
  - `isOpenSession`: "true"/"false"
  - `bookingToken`: token string (if open session)
- **Color**: Maps instructor color to Calendar color ID (5=yellow, 8=graphite, 9=blueberry, 11=tomato)
- **Recurrence**: `RRULE:FREQ=WEEKLY;UNTIL=YYYYMMDD`

---

## 4. GOOGLE INTEGRATIONS

### 4.1 Service Account
- Used for ALL Google API operations (both Calendar and Sheets)
- Scopes: `spreadsheets` + `calendar`
- Authentication via GoogleAuth with email + private key
- Service account must have access to both the calendar and spreadsheet

### 4.2 Google Calendar API
- CRUD operations on events (create, read, update, delete)
- Extended properties for metadata storage (shared + private)
- Recurring events via RRULE (FREQ=WEEKLY;UNTIL)
- Event listing with `singleEvents: true`, `showDeleted: false`
- Date extraction uses Warsaw timezone
- Title parsing fallback for instructor name: `parseInstructorFromTitle()` extracts from `[TYPE] - Name`

### 4.3 Google Sheets API
- Four sheets in one spreadsheet: Klienci, Sesje, Instruktorzy, Rezerwacje
- Operations: values.get(), values.append(), values.update(), batchUpdate(deleteDimension)
- Auto-initialization: sheets created with headers if missing
- Value input: USER_ENTERED

### 4.4 OAuth 2.0 (User Login Only)
- Scopes: `openid email profile` (no calendar/sheets scopes needed)
- Used only for user authentication, NOT for API operations
- Refresh token handling with auto-refresh when <60s to expiry

---

## 5. AUTHENTICATION FLOW

1. User visits `/` -> LoginScreen with "Zaloguj sie przez Google" button
2. Click -> `signIn('google', callbackUrl: '/calendar')`
3. Google OAuth consent screen
4. Callback -> NextAuth processes JWT
5. JWT callback: stores access/refresh tokens
6. Session callback: looks up instructor by email (hardcoded defaults + Instruktorzy sheet)
7. Session enriched with full Instructor object
8. Redirected to `/calendar`

**Authorization in API routes**: All routes call `getServerSession(authOptions)` and check instructor role.

---

## 6. UI COMPONENTS

### Layout & Navigation
- `layout.tsx` - Root layout with AuthProvider
- `calendar/page.tsx` - Main app with tab routing (calendar, clients, settlements, instructors)
- `Navigation.tsx` - Bottom navigation (4 tabs, conditional visibility based on role)
- `AuthProvider.tsx` - SessionProvider wrapper
- `LoginScreen.tsx` - Public landing page

### Calendar & Sessions
- `CalendarView.tsx` - Weekly grid (Mon-Sun, 8-20:00), session cards, polling, swipe gestures
- `SessionModal.tsx` - Create/edit/delete sessions with all options (type, instructor, clients, recurring, open)
- `ClientPickerModal.tsx` - Multi-select client list for session assignment

### Client Management
- `ClientList.tsx` - Searchable, filterable client list with CRUD
- `ClientFormModal.tsx` - Create/edit client form

### Settlements & Instructors
- `SettlementView.tsx` - Monthly view with sync, instructor filter, expandable details
- `InstructorSettings.tsx` - Admin-only pricing editor

### Public Pages
- `book/[token]/page.tsx` - Public booking form (no auth)
- `regulations/accept` - API route returns HTML acceptance page

---

## 7. CONFIGURATION

### Environment Variables
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=random-string
GOOGLE_SHEETS_ID=spreadsheet-id
GOOGLE_CALENDAR_ID=calendar-id (or "primary")
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-specific-password
APP_URL=https://your-domain.com
```

### Tailwind Theme Colors
```
heal-bg: '#FAF9F7'       (light beige background)
heal-primary: '#2C3E2D'  (dark green primary)
heal-accent: '#B8A88A'   (tan accent)
heal-light: '#E8E4DE'    (light gray)
heal-dark: '#1A1A1A'     (nearly black)
```

### Default Instructors (Seed Data)
```
agnieszka-puchalska | puchalskaagi@gmail.com | owner | yellow (#D4A843)
rafal-styczen | rafal.styczen@gmail.com | admin | black (#1A1A1A)
ola-scibor | aleksscibor@gmail.com | instructor | blue (#4A90D9)
ania-konieczny | aniakonieczny01@gmail.com | instructor | red (#D94A4A)
```

---

## 8. FILE STRUCTURE

```
src/
  app/
    api/
      auth/[...nextauth]/route.ts     # OAuth
      sessions/route.ts                # Calendar CRUD
      clients/route.ts                 # Clients CRUD
      instructors/route.ts             # Instructors CRUD
      settlements/route.ts             # Settlements GET
      settlements/sync/route.ts        # Manual sync
      regulations/accept/route.ts      # Public acceptance
      book/[token]/route.ts            # Public booking API
    calendar/page.tsx                  # Main app
    book/[token]/page.tsx              # Public booking UI
    layout.tsx                         # Root layout
    page.tsx                           # Auth redirect
    globals.css
  components/
    AuthProvider.tsx
    CalendarView.tsx
    SessionModal.tsx
    ClientPickerModal.tsx
    ClientList.tsx
    ClientFormModal.tsx
    SettlementView.tsx
    InstructorSettings.tsx
    Navigation.tsx
    LoginScreen.tsx
  lib/
    auth.ts                            # NextAuth config
    google-calendar.ts                 # Calendar API wrapper
    google-sheets.ts                   # Sheets API wrapper
    service-auth.ts                    # Service account auth
    email.ts                           # Nodemailer
    types.ts                           # TypeScript types
    instructors-data.ts                # Default instructors
    useInstructors.ts                  # Hook with caching
  store/
    useStore.ts                        # Zustand store (minimal use)
```

---

## 9. CRITICAL BUSINESS RULES

1. Sessions without clients only allowed for owners/admins or open sessions
2. Regular instructors see only their own settlements
3. Settlements are recalculated from calendar on sync (not incremental)
4. Extended properties stored in BOTH shared AND private for recurring compatibility
5. Instructor name resolved from extended properties with title-based fallback parsing
6. Phone numbers auto-format as Polish (+48 format)
7. Pricing is configurable per instructor per session type
8. Calendar is the single source of truth for session data
9. Google Sheet is the source of truth for clients, instructors, and bookings
10. All Google API operations use Service Account (not user OAuth tokens)

---

## 10. KNOWN LIMITATIONS

1. No session conflict detection (overlapping sessions allowed)
2. No payment processing (pricing tracked but not enforced)
3. Only weekly recurring pattern supported
4. Booking tokens not validated for uniqueness (collision extremely unlikely)
5. Pricing changes are not retroactive (settlements use current pricing at sync time)
6. Limited calendar colors (4 predefined instructor colors)
7. Polling-based sync (no WebSockets), 15-second intervals
8. No offline support
