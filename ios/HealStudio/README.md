# HEAL Pilates Studio - iOS App

Native SwiftUI iPhone app for the HEAL Pilates Studio management system.

## Architecture

This is a **pure client app** that communicates with the existing Next.js backend API. All business logic (Google Calendar integration, Google Sheets operations, email sending) remains on the server side. The iOS app authenticates via Google Sign-In and passes the ID token as a Bearer token to the API.

## Requirements

- Xcode 15.0+
- iOS 17.0+
- Swift 5.9+

## Setup

### 1. Create Xcode Project

1. Open Xcode > File > New > Project > iOS App
2. Product Name: `HealStudio`
3. Organization Identifier: `com.healpilates`
4. Interface: SwiftUI, Language: Swift
5. Replace the auto-generated files with the files in this directory

### 2. Add Google Sign-In SDK

1. File > Add Package Dependencies
2. URL: `https://github.com/google/GoogleSignIn-iOS`
3. Add `GoogleSignIn` and `GoogleSignInSwift` to your target

### 3. Configure Google Sign-In

1. Go to [Google Cloud Console](https://console.cloud.google.com/) > APIs & Credentials
2. Create a new OAuth 2.0 Client ID of type **iOS**
3. Use the same Google Cloud project as the web app
4. Bundle ID: `com.healpilates.HealStudio`
5. Download `GoogleService-Info.plist` and add it to the Xcode project
6. In Info.plist, add the reversed client ID as a URL scheme:
   - URL Schemes: `com.googleusercontent.apps.YOUR_CLIENT_ID`

### 4. Configure API Base URL

Edit `Services/APIClient.swift` and set the correct URLs:
- Debug: `http://localhost:3000` (for local development)
- Release: Your production Next.js app URL

### 5. Backend Configuration

The Next.js backend needs a small update to accept Bearer tokens from the iOS app.
The file `src/lib/auth-mobile.ts` has been added to handle this. Each API route needs
to use `getAuthenticatedInstructor()` instead of (or alongside) `getServerSession()`.

## Features

- Google Sign-In authentication
- Weekly calendar view with session management
- Session creation/editing with recurring support
- Client management with search and filters
- Settlement/billing view with monthly breakdown
- Instructor pricing management (admin only)
- 15-second background polling for real-time sync
- Swipe gestures for week navigation
- Open session booking links

## Project Structure

```
HealStudio/
  App/           - App entry point and root views
  Models/        - Data models (Codable structs)
  Services/      - Networking layer (APIClient + per-resource APIs)
  ViewModels/    - MVVM view models (@Observable)
  Views/
    Auth/        - Login and unauthorized screens
    Calendar/    - Calendar grid, session modal, client picker
    Clients/     - Client list, form, row views
    Settlements/ - Settlement view and instructor cards
    Instructors/ - Instructor settings and pricing
    Shared/      - Colors, spinner, tab bar
```
