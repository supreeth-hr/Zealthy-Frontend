# Zealthy Frontend

Cross-platform frontend for the Zealthy healthcare workflow, built with Expo + Expo Router.

This app supports:
- patient login and portal views
- admin dashboard and patient management
- appointments and prescriptions across admin and portal surfaces

---

## Tech Stack

- Expo SDK `54`
- Expo Router `6`
- React `19`
- React Native `0.81`
- React Native Web `0.21`
- TypeScript

---

## Project Root

The application root is this directory: `frontend/`.

Run all package commands from here (not from the parent folder):

```bash
npm install
npm run start
npm run ios
npm run android
npm run web
```

---

## Prerequisites

- Node.js `18+` (LTS recommended)
- npm `9+`
- Xcode + iOS simulator (for iOS development on macOS)
- Android Studio + emulator (for Android development)

---

## Environment Variables

1. Copy the example file:

```bash
cp .env.example .env
```

2. Set the API base URL:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Notes

- `EXPO_PUBLIC_*` values are bundled into the client and are safe for public runtime configuration.
- If `EXPO_PUBLIC_API_BASE_URL` is missing, the fallback is `http://localhost:3000`.
- Web, iOS simulator, Android emulator, and physical devices may require different hostnames/IPs.

---

## Running the App

### Start Expo Dev Server

```bash
npm run start
```

Then choose platform from the Expo terminal UI.

### Run specific platforms

```bash
npm run ios
npm run android
npm run web
```

---

## App Structure

### Routing (`app/`)

Expo Router uses file-based routing:

- `app/index.tsx` - login screen + entry to admin
- `app/admin/index.tsx` - admin dashboard and patient creation/list
- `app/admin/patients/[userId].tsx` - patient detail and account updates
- `app/admin/patients/[userId]/appointments.tsx` - patient appointments (schedule/providers tabs)
- `app/admin/patients/[userId]/prescriptions.tsx` - patient prescriptions (timeline/medications tabs)
- `app/portal/_layout.tsx` - tab layout for portal
- `app/portal/index.tsx` - portal home dashboard
- `app/portal/appointments.tsx` - portal appointments view
- `app/portal/prescriptions.tsx` - portal prescriptions view

### Application Code (`src/`)

- `src/auth/` - session context, login/logout state, persistence
- `src/services/api/` - domain API modules
- `src/services/client.ts` - fetch wrapper, headers, error handling
- `src/services/types.ts` and `src/services/api/types.ts` - shared types
- `src/components/` - reusable UI components (ex: tab switch row)
- `src/features/` - feature constants/config values
- `src/utils/` - date, format, and validation helpers
- `src/ui/` - shared styles and notification primitives

---

## Data and Auth Flow

1. User logs in from `app/index.tsx`.
2. Session is stored in AsyncStorage (`zealthy_session`) via `src/auth/session.tsx`.
3. API calls use `src/services/client.ts` with optional bearer token.
4. Screens fetch and render domain data (patients, appointments, prescriptions).

---

## UI and Feedback Conventions

- Shared styles are in `src/ui/styles.ts`.
- Cross-platform success messages use in-app notifications from:
  - `src/ui/notifications/NotificationsProvider.tsx`
- Cross-platform confirm dialogs use:
  - `src/ui/notifications/alert.ts`

These patterns avoid native/web mismatch for alert behavior.

---

## API Contract Assumptions

The app expects a backend with endpoints used by modules in `src/services/api/`.

Examples include:
- authentication/login
- admin patient CRUD + password updates
- admin appointment/prescription CRUD
- portal appointments/prescriptions for authenticated users

When backend responses change, update shared types in:
- `src/services/types.ts`
- `src/services/api/types.ts`

---

## TypeScript and Imports

Path aliases are configured in `tsconfig.json`:

- `@/*`
- `@/app/*`
- `@/src/*`

Use aliases for new code where practical to reduce fragile deep relative imports.

---

## Troubleshooting

### Web shows date one day behind

Use date-only formatting helpers from `src/utils/date.ts` (`formatDate`) for calendar dates like `YYYY-MM-DD` or UTC-midnight ISO values.

### API requests failing

- Verify `EXPO_PUBLIC_API_BASE_URL` in `.env`
- Ensure backend is reachable from the current platform
- Check backend CORS config for web

### Session issues

If stale login state appears, clear app storage and restart:
- uninstall/reinstall app (simulator/device), or
- clear browser storage for web

### Metro cache oddities

Restart with a clean cache:

```bash
npx expo start -c
```

---

## Development Guidelines

- Keep route files focused on orchestration/UI composition.
- Place reusable logic in `src/` modules.
- Reuse shared API types instead of redefining response shapes.
- Favor small utilities in `src/utils` for formatting/validation consistency.

