# Heal Pilates Studio - System Rezerwacji

Aplikacja webowa do zarządzania rezerwacjami sesji w studiu Heal Pilates Studio w Warszawie.

## Funkcjonalności

### Kalendarz sesji
- Widok tygodniowy z slotami godzinowymi (8:00 - 20:00)
- Sesje oznaczone kolorami instruktorów
- Dodawanie sesji pojedynczych i cyklicznych (powtarzanych co tydzień)
- Modyfikacja sesji cyklicznych (pojedyncza, przyszłe lub wszystkie)
- Synchronizacja z Google Calendar

### Rodzaje sesji
- **Solo** - 1 klient, 1 godzina
- **Duo** - 2 klientów, 1 godzina
- **Trio** - 3 klientów, 1 godzina

### Instruktorzy
| Instruktor | Rola | Kolor | Solo (cena/udział) | Duo (cena/udział) | Trio (cena/udział) |
|---|---|---|---|---|---|
| Agnieszka Puchalska | Właściciel | Żółty | 260/260 | 360/360 | 450/450 |
| Rafał Styczeń | Admin | Czarny | 0/0 | 0/0 | 0/0 |
| Ola Ścibor | Instruktor | Niebieski | 260/120 | 360/150 | 450/190 |
| Ania Konieczny | Instruktor | Czerwony | 260/160 | 360/210 | 450/250 |

### Zarządzanie klientami
- Lista klientów z wyszukiwaniem i filtrami
- Automatyczne wysyłanie regulaminu do nowych klientów
- Akceptacja regulaminu przez link w e-mailu
- Klienci właściciela ukryci przed zwykłymi instruktorami

### Rozliczenia
- Automatyczne rozliczanie sesji po ich zakończeniu
- Widok miesięczny z podsumowaniem godzin, cen i udziałów
- Zwykli instruktorzy widzą tylko swoje rozliczenia
- Właściciel/Admin widzi rozliczenia wszystkich

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** - stylowanie mobile-first
- **NextAuth.js** - logowanie Google OAuth
- **Google Calendar API** - zarządzanie sesjami
- **Google Sheets API** - baza danych klientów i rozliczenia
- **Zustand** - zarządzanie stanem
- **Nodemailer** - wysyłanie e-maili z regulaminem

## Konfiguracja

### 1. Google Cloud Project

1. Utwórz projekt na [Google Cloud Console](https://console.cloud.google.com)
2. Włącz API:
   - Google Calendar API
   - Google Sheets API
   - Gmail API (opcjonalnie, do wysyłki maili)
3. Utwórz OAuth 2.0 credentials:
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. (Opcjonalnie) Utwórz Service Account do operacji serwerowych

### 2. Google Sheets

1. Utwórz nowy arkusz Google Sheets
2. Skopiuj ID arkusza z URL (część po `/d/` a przed `/edit`)
3. Udostępnij arkusz dla konta serwisowego (jeśli używasz)

### 3. Zmienne środowiskowe

Skopiuj `.env.example` do `.env.local` i uzupełnij:

```bash
cp .env.example .env.local
```

Wymagane zmienne:
- `GOOGLE_CLIENT_ID` - ID klienta OAuth
- `GOOGLE_CLIENT_SECRET` - Secret klienta OAuth
- `NEXTAUTH_SECRET` - losowy ciąg znaków (np. `openssl rand -base64 32`)
- `NEXTAUTH_URL` - URL aplikacji
- `GOOGLE_SHEETS_ID` - ID arkusza Google Sheets
- `GOOGLE_CALENDAR_ID` - ID kalendarza (domyślnie `primary`)
- `SMTP_USER` / `SMTP_PASSWORD` - dane do wysyłki maili

### 4. Uruchomienie

```bash
npm install
npm run dev
```

Aplikacja będzie dostępna pod `http://localhost:3000`.

### 5. Produkcja

```bash
npm run build
npm start
```

## Struktura projektu

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth endpoints
│   │   ├── sessions/              # CRUD sesji
│   │   ├── clients/               # CRUD klientów
│   │   ├── instructors/           # CRUD instruktorów
│   │   ├── settlements/           # Rozliczenia
│   │   └── regulations/accept/    # Akceptacja regulaminu
│   ├── calendar/                  # Główna strona z zakładkami
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Strona logowania
├── components/
│   ├── AuthProvider.tsx
│   ├── CalendarView.tsx           # Widok kalendarza
│   ├── ClientFormModal.tsx        # Formularz klienta
│   ├── ClientList.tsx             # Lista klientów
│   ├── ClientPickerModal.tsx      # Wybór klienta dla sesji
│   ├── InstructorSettings.tsx     # Ustawienia instruktorów
│   ├── LoginScreen.tsx            # Ekran logowania
│   ├── Navigation.tsx             # Dolna nawigacja
│   ├── SessionModal.tsx           # Formularz sesji
│   └── SettlementView.tsx         # Widok rozliczeń
├── lib/
│   ├── auth.ts                    # Konfiguracja NextAuth
│   ├── email.ts                   # Wysyłka maili
│   ├── google-calendar.ts        # Google Calendar API
│   ├── google-sheets.ts          # Google Sheets API
│   ├── instructors-data.ts       # Domyślne dane instruktorów
│   └── types.ts                   # Typy TypeScript
└── store/
    └── useStore.ts               # Zustand store
```

## Uprawnienia

| Funkcja | Właściciel/Admin | Instruktor |
|---|---|---|
| Kalendarz sesji | Pełny dostęp | Pełny dostęp |
| Dodawanie sesji bez klientów | Tak | Nie |
| Lista klientów | Wszyscy klienci | Bez klientów właściciela |
| Rozliczenia | Wszyscy instruktorzy | Tylko własne |
| Ustawienia instruktorów | Tak | Nie |
