# Zealthy Frontend

Frontend for a healthcare portal built with Expo Router.

## Project Root

The canonical app root is `frontend/`.

Run all package manager commands from this directory:

- `npm install`
- `npm run start`
- `npm run ios`
- `npm run android`

The parent `Zealthy_Frontend/` directory may contain extra local tooling artifacts, but app development and dependency management should be done from `frontend/`.

## Environment Variables

Copy `.env.example` to `.env` and set runtime values as needed.

Current API base URL key:

- `EXPO_PUBLIC_API_BASE_URL`

## Architecture Conventions

- Keep route files in `app/` focused on orchestration and composition.
- Put reusable logic and UI in `src/`:
  - `src/services/api/*` for domain-specific API modules.
  - `src/services/client.ts` for shared request handling.
  - `src/components/*` for shared presentational components.
  - `src/utils/*` for reusable formatting/validation helpers.
  - `src/features/*` for domain-level constants/configuration.
- Prefer shared API response types from `src/services/api/types.ts` instead of re-declaring inline route types.

## TypeScript Path Aliases

Path aliases are configured in `tsconfig.json`:

- `@/*`
- `@/app/*`
- `@/src/*`

Use aliases for new code to avoid brittle deep relative imports.
