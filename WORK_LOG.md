# Deshi Diet Guide Work Log

## Project Credits

For a full breakdown of team members, roles, and project contributions, please see [CONTRIBUTIONS.md](./CONTRIBUTIONS.md).

## Backend Integration History

### 1. Project Inspection

I inspected the provided project zip:

```text
/home/tasin/project/Deshi Diet Guide (1).zip
```

I found that the project did not include a README file. The project is a TanStack Start + React + Supabase app with backend logic inside server functions.

Important backend-related files found:

- `src/server.ts`
- `src/start.ts`
- `src/routes/api/chat.ts`
- `src/lib/profile.functions.ts`
- `src/lib/meals.functions.ts`
- `src/lib/threads.functions.ts`
- `src/lib/foods.functions.ts`
- `src/lib/recommend.functions.ts`
- `src/lib/analyze-plate.functions.ts`
- `src/integrations/supabase/auth-middleware.ts`
- `src/integrations/supabase/client.server.ts`
- `supabase/migrations/*`

### 2. Local Project Setup

I extracted the zip into:

```text
/home/tasin/project/deshi-diet-guide
```

Then I installed dependencies using:

```bash
npm install
```

I also ran the frontend locally with:

```bash
npm run dev -- --host 0.0.0.0
```

The local frontend was available at:

```text
http://localhost:8080/
```

### 3. Frontend Preview Without Backend

Because Supabase email verification and backend setup were not completed yet, I added a temporary local demo mode so the dashboard can be previewed without real authentication.

Files changed/added:

- `src/lib/demo-session.ts`
- `src/routes/login.tsx`
- `src/routes/dashboard.tsx`
- `src/hooks/use-profile.tsx`

What was added:

- A `Preview without backend` button on the login page.
- Demo session handling using browser local storage.
- Demo profile data.
- Demo meal data.
- Dashboard access without Supabase email verification.
- Onboarding gate bypass for demo mode.

This is only for local preview. It should be removed or hidden before final production submission if demo mode is not allowed.

### 4. Backend Planning Document

I created a backend planning file:

```text
BACKEND_PLAN.md
```

This file explains:

- Supabase setup tasks
- Required migrations
- Required environment variables
- Auth setup
- Backend functions to test
- Food seeding
- Security notes
- Demo mode warning

### 5. CSRF Middleware Fix

When stopping the dev server, TanStack Start warned that server functions were not protected by CSRF middleware.

I fixed this in:

```text
src/start.ts
```

Added:

```ts
createCsrfMiddleware
```

Server functions are now protected with CSRF middleware.

### 6. Removed Lovable AI Dependency

The original project used Lovable AI Gateway through:

```text
LOVABLE_API_KEY
```

The user requested replacing Lovable with Gemini. I removed the Lovable AI path and changed the backend AI integration to use Google Gemini directly.

New required key:

```env
GEMINI_API_KEY=your_google_gemini_api_key
```

Files changed:

- `package.json`
- `package-lock.json`
- `src/lib/ai-gateway.server.ts`
- `src/routes/api/chat.ts`
- `src/lib/recommend.functions.ts`
- `src/lib/analyze-plate.functions.ts`
- `src/lib/foods.functions.ts`
- `src/components/PlateAnalyzer.tsx`
- `BACKEND_PLAN.md`

Installed package:

```bash
npm install @ai-sdk/google
```

### 7. Gemini AI Integration

The app now uses:

- `gemini-2.5-flash` for chat
- `gemini-2.5-flash` for meal plan generation
- `gemini-2.5-pro` for primary plate image analysis
- `gemini-2.5-flash` as fallback for plate image analysis
- `gemini-embedding-001` for food embeddings

The embedding output is reduced to 1536 dimensions to match the existing Supabase table schema:

```sql
embedding vector(1536)
```

### 8. Verification

After changes, I ran:

```bash
npm run typecheck
```

Result:

```text
Passed
```

### 9. Backend Audit and Cleanup

I performed a full backend audit covering every server function, migration, auth file, integration file, and configuration.

Audit confirmed that the following are complete and correctly implemented:

- All 8 Supabase migrations (profiles, meal_logs, chat_threads, chat_messages, foods, match_foods RPC, plate-photos bucket, vector extension, RLS policies)
- CSRF middleware in `src/start.ts`
- Auth flow (auth-attacher → auth-middleware → RLS-scoped Supabase client)
- All server functions (profile, meals, threads, foods, recommend, analyze-plate) use authenticated user context
- `SUPABASE_SERVICE_ROLE_KEY` only used server-side in `client.server.ts`
- `GEMINI_API_KEY` only used server-side in `ai-gateway.server.ts`
- Demo mode is client-only and does not interfere with real backend

Issues found and fixed:

1. Removed 4 old Lovable references from error messages:
   - `src/integrations/supabase/auth-middleware.ts` — changed `"Connect Supabase in Lovable Cloud"` to `"Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env"`
   - `src/integrations/supabase/client.server.ts` — changed `"Connect Supabase in Lovable Cloud"` to `"Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"`
   - `src/integrations/supabase/client.ts` — changed `"Connect Supabase in Lovable Cloud"` to `"Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env"`
   - `src/lib/analyze-plate.functions.ts` — changed `"please top up Lovable AI credits"` to `"Gemini API quota exhausted — check your Google AI billing"`

2. Fixed vague error message in `src/lib/recommend.functions.ts` — changed `"AI credits exhausted — please top up"` to `"Gemini API quota exhausted — check your Google AI billing"`

3. Added placeholder entries for `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` in `.env` with comments explaining where to get each key.

4. Removed unused `@ai-sdk/openai-compatible` dependency from `package.json` (leftover from old Lovable AI gateway, never imported in source code).

### 10. Verification After Audit

After all fixes, I ran:

```bash
npm install
npm run typecheck
npm run build
```

Results:

- `npm install` — clean install, removed 1 unused package, 0 vulnerabilities
- `npm run typecheck` — passed with zero errors
- `npm run build` — built successfully in 10.92s
- `grep -ri "lovable" src/` — zero Lovable references remaining in source code

## Current Backend Requirements

The backend still needs real Supabase setup.

Required `.env` values:

```env
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```

Required Supabase tasks:

- Run all migrations from `supabase/migrations`
- Configure Supabase Auth
- Disable email confirmation for local testing or manually confirm users
- Verify RLS policies
- Verify `plate-photos` storage bucket
- Verify `vector` extension
- Seed food data using `seedFoods`
- Test chat, profile, meals, plan generation, plate analysis, and food search

## Notes

This file is for tracking team work and responsibilities. It should be updated whenever new backend, frontend, database, or AI changes are made.
