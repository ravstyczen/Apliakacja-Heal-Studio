# HEAL Pilates Studio - Instrukcja dla instruktora

---

## Spis tresci

1. [Logowanie do aplikacji](#1-logowanie-do-aplikacji)
2. [Nawigacja w aplikacji](#2-nawigacja-w-aplikacji)
3. [Kalendarz - przegladanie sesji](#3-kalendarz---przegladanie-sesji)
4. [Dodawanie nowej sesji](#4-dodawanie-nowej-sesji)
5. [Edytowanie i usuwanie sesji](#5-edytowanie-i-usuwanie-sesji)
6. [Sesje cykliczne](#6-sesje-cykliczne)
7. [Otwarte sesje - publikacja linku do zapisu](#7-otwarte-sesje---publikacja-linku-do-zapisu)
8. [Zarzadzanie klientami](#8-zarzadzanie-klientami)

---

## 1. Logowanie do aplikacji

Po otwarciu aplikacji zobaczysz ekran logowania:

```
┌─────────────────────────────┐
│                             │
│           H E A L           │
│       PILATES STUDIO        │
│                             │
│      ─────── ● ───────      │
│                             │
│   ┌───────────────────────┐ │
│   │                       │ │
│   │        Witaj          │ │
│   │  Zaloguj sie kontem   │ │
│   │  Google aby           │ │
│   │  kontynuowac          │ │
│   │                       │ │
│   │ ┌───────────────────┐ │ │
│   │ │ G  Zaloguj sie    │ │ │
│   │ │    przez Google    │ │ │
│   │ └───────────────────┘ │ │
│   └───────────────────────┘ │
│                             │
│  Dostep tylko dla           │
│  instruktorow studia        │
└─────────────────────────────┘
```

### Krok po kroku:

**1.** Kliknij przycisk **"Zaloguj sie przez Google"**.

**2.** Otworzy sie okno logowania Google. Wybierz swoje konto Google (to, ktore zostalo przypisane przez administratora studia).

**3.** Poniewaz aplikacja nie przeszla jeszcze procesu weryfikacji Google, zobaczysz ekran ostrzezenia:

```
┌──────────────────────────────────┐
│                                  │
│    Google hasn't verified        │
│    this app                      │
│                                  │
│    The app is requesting         │
│    access to sensitive info      │
│    in your Google Account.       │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Back to safety            │  │
│  └────────────────────────────┘  │
│                                  │
│        ▼ Advanced                │
│                                  │
└──────────────────────────────────┘
```

> **WAZNE:** Kliknij **"Advanced"** (Zaawansowane) na dole strony.

**4.** Po kliknieciu "Advanced" pojawi sie dodatkowa opcja:

```
┌──────────────────────────────────┐
│                                  │
│    Google hasn't verified        │
│    this app                      │
│         ...                      │
│                                  │
│        ▼ Advanced                │
│                                  │
│  This app isn't verified by      │
│  Google yet. Only proceed if     │
│  you know and trust the          │
│  developer.                      │
│                                  │
│  Go to heal-studio (unsafe) ──> │
│                                  │
└──────────────────────────────────┘
```

> Kliknij link **"Go to heal-studio (unsafe)"** aby kontynuowac. Jest to bezpieczne - ostrzezenie pojawia sie tylko dlatego, ze aplikacja nie przeszla jeszcze formalnego procesu weryfikacji Google.

**5.** Na nastepnym ekranie Google zapyta o uprawnienia. Kliknij **"Continue"** (Kontynuuj) aby zezwolic aplikacji na dostep do kalendarza Google i arkuszy.

**6.** Po pomyslnym zalogowaniu zostaniesz przekierowana/y do widoku kalendarza.

---

## 2. Nawigacja w aplikacji

Po zalogowaniu widoczny jest gorny pasek z logo oraz dolna nawigacja:

```
┌──────────────────────────────────┐
│  HEAL  Pilates Studio    (AP)   │
│                          Wyloguj │
├──────────────────────────────────┤
│                                  │
│                                  │
│        [ TRESC ZAKLADKI ]        │
│                                  │
│                                  │
├──────────────────────────────────┤
│  📅          👥         📊  ⚙️   │
│ Kalendarz  Klienci  Rozlicz. Instr.│
│    ●                             │
└──────────────────────────────────┘
```

### Zakladki w dolnej nawigacji:

| Ikona | Nazwa | Opis |
|-------|-------|------|
| Kalendarz | **Kalendarz** | Widok tygodniowy z sesjami |
| Osoby | **Klienci** | Lista klientow studia |
| Wykres | **Rozliczenia** | Podsumowanie finansowe (tylko admin) |
| Zebatka | **Instruktorzy** | Ustawienia instruktorow (tylko admin) |

**Wylogowanie:** Kliknij **"Wyloguj"** w prawym gornym rogu.

---

## 3. Kalendarz - przegladanie sesji

Zakladka Kalendarz pokazuje tygodniowy widok z godzinami 8:00-20:00:

```
┌──────────────────────────────────┐
│  Luty 2026                [Dzis] │
│  [<]  [>]                        │
│                                  │
│  ● Agnieszka ● Rafal            │
│  ● Ola       ● Ania             │
├──────────────────────────────────┤
│      Pon  Wt  Sr  Czw  Pt  Sb Nd│
│       3    4   5    6   7   8  9 │
│ 8:00 ┌──┐                       │
│      │S │                        │
│      │Ola│                       │
│      └──┘                        │
│ 9:00      ┌──┐                   │
│           │D │  ┌──┐             │
│           │Ag│  │S🌐│            │
│           └──┘  │Ola│            │
│                 └──┘             │
│10:00                             │
│  ...                             │
│                                  │
│                          [ + ]   │
└──────────────────────────────────┘
```

### Elementy kalendarza:

- **Nawigacja tygodnia:** Strzalki `[<]` i `[>]` przesuwaja widok o tydzien. Przycisk **"Dzis"** wraca do biezacego tygodnia.
- **Legenda instruktorow:** Kolorowe kropki z imionami instruktorow pomagaja identyfikowac sesje.
- **Kafelki sesji:** Kazda sesja wyswietla:
  - **Litera typu:** `S` = Solo, `D` = Duo, `T` = Trio
  - **Ikona globu** 🌐 = sesja otwarta (z linkiem do zapisu online)
  - **Imie instruktora**
  - **Imiona klientow** (jesli przypisani)

---

## 4. Dodawanie nowej sesji

### Metoda 1: Kliknij puste pole w kalendarzu
Kliknij na dowolna wolna kratke w siatce kalendarza - data i godzina zostana uzupelnione automatycznie.

### Metoda 2: Przycisk "+"
Kliknij zielony przycisk **[+]** w prawym dolnym rogu ekranu.

Otworzy sie panel tworzenia sesji:

```
┌──────────────────────────────────┐
│          ────────                │
│                                  │
│  Nowa sesja                      │
│                                  │
│  RODZAJ SESJI                    │
│  ┌────────┬────────┬────────┐    │
│  │  Solo  │  Duo   │  Trio  │    │
│  │ (aktyw)│        │        │    │
│  └────────┴────────┴────────┘    │
│                                  │
│  DATA                            │
│  ┌──────────────────────────┐    │
│  │  2026-02-15              │    │
│  └──────────────────────────┘    │
│                                  │
│  GODZINA                         │
│  ┌──────────────────────────┐    │
│  │  09:00 - 10:00        ▼  │    │
│  └──────────────────────────┘    │
│                                  │
│  INSTRUKTOR                      │
│  ┌──────────────────────────┐    │
│  │  (A) Agnieszka Puchalska│    │
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │  (O) Ola Scibor     ✓   │    │
│  └──────────────────────────┘    │
│                                  │
│  KLIENCI (0/1)                   │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐    │
│  │   + Dodaj klienta        │    │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘    │
│                                  │
│  SESJA CYKLICZNA         [ ○ ]   │
│                                  │
│  OTWARTA SESJA           [ ○ ]   │
│                                  │
│  ┌──────────────────────────┐    │
│  │      Dodaj sesje         │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

### Krok po kroku:

**1. Wybierz rodzaj sesji** - kliknij `Solo` (1 klient), `Duo` (2 klientow) lub `Trio` (3 klientow).

**2. Ustaw date** - wpisz lub wybierz z kalendarza.

**3. Wybierz godzine** - rozwin liste i wybierz przedzial czasowy (np. `09:00 - 10:00`).

**4. Wybierz instruktora** - kliknij na karcie instruktora. Jesli jestes zwyklym instruktorem, zobaczysz tylko siebie.

**5. Dodaj klientow** - kliknij **"+ Dodaj klienta"**, aby otworzyc liste klientow:

```
┌──────────────────────────────────┐
│  🔍 Szukaj klienta...   [+Nowy] │
├──────────────────────────────────┤
│  Anna Kowalska                   │
│  Jan Nowak                       │
│  Maria Wisniawska                │
│  ...                             │
└──────────────────────────────────┘
```

Wyszukaj klienta po imieniu lub nazwisku i kliknij na niego. Mozesz tez dodac nowego klienta przyciskiem **"+ Nowy"**.

**6. Kliknij "Dodaj sesje"** - sesja pojawi sie w kalendarzu.

---

## 5. Edytowanie i usuwanie sesji

### Edytowanie sesji

**1.** Kliknij na kafelek sesji w kalendarzu.

**2.** Otworzy sie ten sam panel co przy tworzeniu, ale z wypelnionymi danymi i naglowkiem **"Edytuj sesje"**.

**3.** Zmien potrzebne pola.

**4.** Kliknij **"Zapisz zmiany"**.

### Usuwanie sesji

**1.** Kliknij na kafelek sesji w kalendarzu.

**2.** W prawym gornym rogu panelu kliknij **"Usun"** (czerwony tekst):

```
┌──────────────────────────────────┐
│  Edytuj sesje              Usun  │
│                                  │
│  ...                             │
└──────────────────────────────────┘
```

**3.** Sesja zostanie natychmiast usunieta z kalendarza.

---

## 6. Sesje cykliczne

Sesje cykliczne automatycznie tworza kopie sesji co tydzien az do wybranej daty koncowej.

### Tworzenie sesji cyklicznej:

**1.** Podczas tworzenia sesji wlacz przelacznik **"Sesja cykliczna"**:

```
│  SESJA CYKLICZNA         [ ● ]   │
│                                  │
│  Powtarzaj co tydzien do:        │
│  ┌──────────────────────────┐    │
│  │  2026-06-30              │    │
│  └──────────────────────────┘    │
```

**2.** Ustaw date koncowa powtarzania.

**3.** Kliknij **"Dodaj sesje"** - sesja pojawi sie w kalendarzu na kazdym tygodniu az do daty koncowej.

### Edytowanie sesji cyklicznej:

Przy edycji sesji cyklicznej pojawi sie pytanie:

```
┌──────────────────────────────────┐
│  Modyfikacja sesji cyklicznej    │
│                                  │
│  Jak chcesz zastosowac zmiany?   │
│                                  │
│  ┌──────────────────────────┐    │
│  │  Tylko te sesje       ✓  │    │
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │  Te i wszystkie przyszle │    │
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │  Wszystkie sesje w serii │    │
│  └──────────────────────────┘    │
│                                  │
│  [ Anuluj ]      [ Zastosuj ]    │
└──────────────────────────────────┘
```

Opcje sa analogiczne przy usuwaniu sesji cyklicznej.

---

## 7. Otwarte sesje - publikacja linku do zapisu

Otwarta sesja pozwala udostepnic link do zapisu online - klienci sami moga sie zapisac bez koniecznosci kontaktu z instruktorem.

### Tworzenie otwartej sesji:

**1.** Podczas tworzenia lub edycji sesji wlacz przelacznik **"Otwarta sesja"**:

```
│  OTWARTA SESJA           [ ● ]   │
│                                  │
│  Link do zapisu online:          │
│  ┌──────────────────┬─────────┐  │
│  │ https://heal..../│ Kopiuj  │  │
│  │ book/a3f8b2c1e9d4│         │  │
│  └──────────────────┴─────────┘  │
```

**2.** Kliknij przycisk **"Kopiuj"** - link zostanie skopiowany do schowka. Przycisk zmieni sie na **"Skopiowano!"** na 2 sekundy.

**3.** Kliknij **"Dodaj sesje"** (lub **"Zapisz zmiany"** przy edycji).

**4.** W kalendarzu sesja otwarta bedzie oznaczona ikona globu 🌐 obok litery typu:

```
│  ┌──────┐  │
│  │ S 🌐 │  │  <-- Sesja otwarta Solo
│  │ Ola   │  │
│  └──────┘  │
```

### Udostepnianie linku:

Skopiowany link mozesz udostepnic klientom przez:
- Instagram Stories (np. jako QR kod lub naklejka z linkiem)
- WhatsApp / SMS
- E-mail
- Inne media spolecznosciowe

### Co widzi klient po otwarciu linku:

```
┌──────────────────────────────────┐
│           H E A L                │
│       PILATES STUDIO             │
│                                  │
│   ┌────────────────────────────┐ │
│   │  (O) Ola Scibor           │ │
│   │      Instruktor            │ │
│   │                            │ │
│   │  📅 poniedzialek, 15       │ │
│   │     lutego 2026             │ │
│   │  🕐 09:00 - 10:00          │ │
│   │  👥 Duo (0/2 miejsc)       │ │
│   │                            │ │
│   │  ┌──────────────────────┐  │ │
│   │  │ Zostalo 2 miejsc    │  │ │
│   │  └──────────────────────┘  │ │
│   ├────────────────────────────┤ │
│   │                            │ │
│   │  Zapisz sie na sesje       │ │
│   │                            │ │
│   │  Imie                      │ │
│   │  ┌────────────────────┐    │ │
│   │  │ Jan                │    │ │
│   │  └────────────────────┘    │ │
│   │  Nazwisko                  │ │
│   │  ┌────────────────────┐    │ │
│   │  │ Kowalski           │    │ │
│   │  └────────────────────┘    │ │
│   │  Adres e-mail              │ │
│   │  ┌────────────────────┐    │ │
│   │  │ jan@example.com    │    │ │
│   │  └────────────────────┘    │ │
│   │                            │ │
│   │  ┌────────────────────┐    │ │
│   │  │    Zapisz sie      │    │ │
│   │  └────────────────────┘    │ │
│   └────────────────────────────┘ │
└──────────────────────────────────┘
```

Po zapisaniu klient zobaczy potwierdzenie, a Ty zobaczysz zapisanych klientow w panelu edycji sesji.

### Przeglad zapisanych klientow:

Kliknij na otwarta sesje w kalendarzu. W sekcji **Klienci** zobaczysz liste osob, ktore sie zapisaly:

```
│  KLIENCI (1/2)                   │
│  ┌──────────────────────────┐    │
│  │  (JK) Jan Kowalski       │    │
│  │       jan@example.com    │    │
│  └──────────────────────────┘    │
│                                  │
│  Oczekiwanie na zapisy           │
│  (1 wolne)                       │
```

---

## 8. Zarzadzanie klientami

Przejdz do zakladki **"Klienci"** w dolnej nawigacji.

### Widok listy klientow:

```
┌──────────────────────────────────┐
│  Klienci               15 klientow│
│                                  │
│  🔍 Szukaj klienta...            │
│                                  │
│ [Wszyscy] [Zaakceptowali] [Oczek.]│
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────────┐  │
│  │ (AK) Anna Kowalska     ✓ 🗑│  │
│  │      +48 512 345 678       │  │
│  │      anna@email.com        │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ (JN) Jan Nowak          ⚠ 🗑│  │
│  │      +48 600 123 456       │  │
│  │      jan@email.com         │  │
│  └────────────────────────────┘  │
│                                  │
│  ...                             │
│                                  │
│                          [ + ]   │
└──────────────────────────────────┘
```

### Statusy klientow:

- ✅ **Zielony znacznik** - klient zaakceptowal regulamin
- ⚠️ **Pomaranczowy znacznik** - klient jeszcze nie zaakceptowal regulaminu

### Filtrowanie klientow:

Uzywaj przyciskow filtrowania:
- **Wszyscy** - wszyscy klienci
- **Zaakceptowali** - tylko klienci, ktorzy zaakceptowali regulamin
- **Oczekujacy** - klienci bez akceptacji regulaminu

### Dodawanie nowego klienta:

**1.** Kliknij zielony przycisk **[+]** w prawym dolnym rogu.

**2.** Wypelnij formularz:

```
┌──────────────────────────────────┐
│          ────────                │
│                                  │
│  Nowy klient                     │
│                                  │
│  IMIE *                          │
│  ┌──────────────────────────┐    │
│  │  Imie klienta            │    │
│  └──────────────────────────┘    │
│                                  │
│  NAZWISKO *                      │
│  ┌──────────────────────────┐    │
│  │  Nazwisko klienta        │    │
│  └──────────────────────────┘    │
│                                  │
│  TELEFON                         │
│  ┌──────────────────────────┐    │
│  │  +48 xxx xxx xxx         │    │
│  └──────────────────────────┘    │
│                                  │
│  E-MAIL                          │
│  ┌──────────────────────────┐    │
│  │  email@example.com       │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │      Dodaj klienta       │    │
│  └──────────────────────────┘    │
│                                  │
│  Po dodaniu klient otrzyma       │
│  e-mail z regulaminem            │
│  do akceptacji                   │
└──────────────────────────────────┘
```

**3.** Pola oznaczone **\*** sa wymagane (Imie i Nazwisko).

**4.** Kliknij **"Dodaj klienta"**. Klient pojawi sie na liscie, a na jego adres e-mail zostanie wyslany regulamin do akceptacji.

### Edytowanie klienta:

**1.** Kliknij na karte klienta na liscie.

**2.** Otworzy sie formularz z wypelnionymi danymi i naglowkiem **"Edytuj klienta"**.

**3.** Zmien potrzebne dane.

**4.** Kliknij **"Zapisz zmiany"**.

Na dole formularza edycji widoczny jest status regulaminu:

```
│  ┌──────────────────────────┐    │
│  │  ✓ Regulamin             │    │
│  │    zaakceptowany          │    │
│  │    Data: 2026-01-15       │    │
│  └──────────────────────────┘    │
```

### Usuwanie klienta:

**1.** Na karcie klienta kliknij czerwona ikone kosza 🗑️ po prawej stronie.

**2.** Potwierdz w oknie dialogowym: **"Czy na pewno chcesz usunac tego klienta?"**

**3.** Klient zostanie trwale usuniety.

---

## Najczesciej zadawane pytania

**P: Nie moge sie zalogowac - Google mowi ze aplikacja nie jest zweryfikowana.**
O: To normalne. Kliknij "Advanced", a nastepnie "Go to heal-studio (unsafe)". Aplikacja jest bezpieczna, ale nie przeszla jeszcze formalnej weryfikacji Google.

**P: Nie widze zakladek "Rozliczenia" i "Instruktorzy".**
O: Te zakladki sa widoczne tylko dla kont z rola Admin lub Wlasciciel.

**P: Nie moge dodac sesji bez przypisania klientow.**
O: Instruktorzy musza przypisac odpowiednia liczbe klientow (Solo = 1, Duo = 2, Trio = 3). Administratorzy moga tworzyc sesje bez klientow. Alternatywnie, wlacz opcje "Otwarta sesja", aby klienci sami mogli sie zapisac.

**P: Jak udostepnic link do otwartej sesji na Instagramie?**
O: Skopiuj link z panelu otwartej sesji, a nastepnie wklej go w naklejke z linkiem na Instagram Stories lub wygeneruj kod QR i dodaj go do relacji.

**P: Co sie dzieje gdy wszystkie miejsca na otwartej sesji sa zajete?**
O: Kolejni klienci otwierajacy link zobacza komunikat "Sesja jest juz pelna" i nie beda mogli sie zapisac.

---

*Heal Pilates Studio - ul. Stanislawa Kostki-Potockiego 2/1, 02-958 Warszawa*
