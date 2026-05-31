# Backend Plan

## Goal

Make the Deshi Digest backend work with Supabase auth, database tables, row-level security, storage, Gemini AI chat, food search, plate analysis, and meal/profile persistence.

## 1. Supabase Project Setup

Create or use the connected Supabase project from `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Run every migration in `supabase/migrations` in timestamp order.

Required database objects:

- `profiles`
- `meal_logs`
- `chat_threads`
- `chat_messages`
- `foods`
- `match_foods(...)` RPC
- `plate-photos` storage bucket
- `vector` extension

## 2. Environment Variables

The frontend keys are already present, but backend features also need:

```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in browser code. It is only used by server-side files such as `src/integrations/supabase/client.server.ts`.

## 3. Auth Setup

For local development, disable email confirmation in Supabase Auth settings or manually confirm test users from the Supabase dashboard.

Production behavior can keep email confirmation enabled.

Backend auth flow:

- Browser signs in through Supabase.
- Supabase stores the session in local storage.
- `src/integrations/supabase/auth-attacher.ts` attaches the bearer token to server function requests.
- `src/integrations/supabase/auth-middleware.ts` validates the token and exposes `supabase`, `userId`, and claims to server functions.

## 4. Backend Surfaces To Test

Profile:

- `getMyProfile`
- `upsertMyProfile`
- `setAlternativeMode`

Meals:

- `logMeal`
- `deleteMeal`
- `listRecentMeals`
- `listPlateHistory`

Chat:

- `listThreads`
- `createThread`
- `deleteThread`
- `getThreadMessages`
- `/api/chat`

AI and food:

- `generatePlan`
- `analyzePlate`
- `seedFoods`
- `searchFoods`

## 5. Food Seeding

Food data lives in:

```text
src/lib/foods-dataset.ts
```

The seeding function is:

```text
src/lib/foods.functions.ts -> seedFoods
```

It requires:

- Supabase migrations applied
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `vector` extension enabled

## 6. Security

CSRF middleware has been added in `src/start.ts` for TanStack Start server functions.

RLS policies are already defined in migrations. Verify users can only read/write their own:

- profile
- meals
- chat threads
- chat messages
- plate photos

## 7. Demo Mode Note

Local frontend preview mode was added so pages can be shown before backend completion:

- `src/lib/demo-session.ts`
- `Preview without backend` button in `src/routes/login.tsx`
- demo handling in `src/routes/dashboard.tsx`
- demo handling in `src/hooks/use-profile.tsx`

Remove or hide demo mode before final production submission unless demo access is allowed.
