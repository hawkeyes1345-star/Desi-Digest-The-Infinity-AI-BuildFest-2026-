# Desi Digest

**Desi Digest** is a culturally intelligent HealthTech web app for South Asian and Bangladeshi food nutrition tracking. It helps users analyze local meals, estimate calories and macros, track meal history, and understand nutrition risks through a safer, more visual experience.

The app is built around **Nanumoni**, a warm AI nutrition companion designed for everyday Desi meals like bhat, dal, mach, shak, ruti, bhorta, curry, and seasonal foods.

## Problem Statement

Most nutrition tools are optimized for Western food databases, packaged foods, and generic meal plans. That leaves many Bangladeshi and South Asian users with poor matches for local dishes, unclear portion estimates, and advice that does not reflect cultural food habits, budgets, family meals, or common health goals.

Desi Digest aims to make nutrition tracking more familiar, practical, and safer by combining local-food-aware analysis, visual meal logging, profile-aware targets, and clear disclaimers around health guidance.

## Key Features

- **Culturally aware nutrition tracking** for Bangladeshi and South Asian meals.
- **Manual meal logging** for calories, macros, fiber, water, sodium, sugar, and notes.
- **Photo-based plate analysis** with estimated food detection, nutrition summaries, and health scoring.
- **Dashboard overview** for daily totals, macro progress, hydration, streaks, and recent meals.
- **Meal and plate history** so users can review previous logs and photo analyses.
- **Profile-aware guidance** based on goals, activity level, dietary preference, allergies, budget, and health considerations.
- **Nanumoni AI chat** for friendly nutrition explanations over retrieved app data and safe fallback templates.
- **Supabase-backed persistence** for authentication, meal logs, profiles, chat threads, and plate photo storage.
- **Safer health messaging** that avoids diagnosis and encourages professional care for medical decisions.

## Tech Stack

- **Framework:** TanStack Start, TanStack Router
- **Frontend:** React, TypeScript
- **Styling:** Tailwind CSS v4, Shadcn/ui, Radix UI primitives
- **State and data:** TanStack Query, TanStack server functions
- **Backend and storage:** Supabase Auth, Postgres, Storage
- **AI:** Gemini via Vercel AI SDK (`ai`, `@ai-sdk/google`)
- **Charts and UI:** Recharts, Lucide React, Sonner
- **Build/deployment target:** Vite, Nitro, Cloudflare Workers/Vercel-style deployment
- **External nutrition/search APIs:** USDA FoodData Central, Edamam, openFDA, RxNorm, WHO ICD

## Local Setup

Prerequisites:

- Node.js 20+ recommended
- npm
- A Supabase project for auth, database, and storage
- API keys for the optional external services you plan to enable

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Fill in the required values in `.env`, then start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

If you are setting up a fresh Supabase project, review the migrations in `supabase/migrations` and apply them through your preferred Supabase workflow before testing authenticated meal logging, profiles, storage, or chat history.

## Environment Variables

Use `.env.example` as the source of truth for local configuration. Do not commit real API keys.

Core Supabase variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Gemini and AI behavior:

- `GEMINI_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `ENABLE_GEMINI_CHAT`
- `ENABLE_GEMINI_IMAGE`
- `ENABLE_GEMINI_FOOD_VISION`
- `ENABLE_GEMINI_NUTRITION_ANALYSIS`
- `MAX_GEMINI_CALLS_PER_DAY`
- `USE_TEMPLATE_FALLBACK`

External API integrations:

- `DATA_GOV_API_KEY`
- `USDA_FDC_BASE_URL`
- `OPENFDA_BASE_URL`
- `RXNORM_BASE_URL`
- `WHO_ICD_CLIENT_ID`
- `WHO_ICD_CLIENT_SECRET`
- `WHO_ICD_TOKEN_URL`
- `WHO_ICD_BASE_URL`
- `EDAMAM_APP_ID`
- `EDAMAM_APP_KEY`

Only `VITE_` variables should be treated as browser-safe. Backend secrets such as service role keys, Gemini keys, WHO ICD credentials, and Edamam keys must remain server-side.

## Available Scripts

```bash
npm run dev          # Start the local Vite dev server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run preview      # Preview the production build locally
npm run typecheck    # Run TypeScript without emitting files
npm run lint         # Run ESLint
npm run format       # Format files with Prettier
npm run start        # Start the built Nitro server
npm run check:apis   # Check configured external API health
```

## Project Structure

```text
src/routes/                 App routes, pages, and API endpoints
src/components/             Shared React components and Shadcn/ui components
src/lib/                    Server functions, nutrition logic, AI helpers, utilities
src/integrations/supabase/  Supabase clients, auth middleware, generated types
supabase/migrations/        Database migrations
public/                     Static assets and public media
scripts/                    Utility scripts and API checks
```

## Recent Improvements

- Fixed dashboard iron accumulation by reading iron from the meal analysis nutrition payload.
- Added a dashboard loading skeleton for a smoother authenticated loading state.
- Extracted `MacroRing` for reusable macro progress visualization.
- Extracted `LogMealDialog` for cleaner meal logging UI.
- Added `DashboardSkeleton` for dashboard-specific loading UX.
- Improved dashboard type safety and reduced component complexity.

## Demo and Presentation

Desi Digest is prepared as a hackathon-ready demo for **Infinity AI BuildFest 2026**. The presentation focus is on culturally intelligent nutrition tracking, safer AI health guidance, local meal analysis, and a practical product experience for Bangladeshi and South Asian users.

This repository does not claim hospital partnerships, medical certifications, regulatory approval, or clinical validation.

## Medical Disclaimer

Desi Digest provides general nutrition education and meal-tracking support. It is **not** a medical diagnosis tool, treatment plan, emergency service, or replacement for a licensed physician, registered dietitian, or qualified healthcare professional.

Users with diabetes, hypertension, pregnancy, kidney disease, eating disorders, allergies, or any serious medical condition should consult a qualified professional before making health decisions based on app output.

## Future Roadmap

- Expand local Bangladeshi and South Asian food coverage with stronger nutrition source labeling.
- Improve portion correction so users can adjust estimated grams, servings, and household measures.
- Add richer micronutrient trends for iron, vitamin A, zinc, sodium, and fiber.
- Strengthen offline and demo flows for events, classrooms, and low-connectivity environments.
- Add dietitian or reviewer workflows for safer expert-assisted recommendations.
- Improve accessibility, localization, Bangla/Banglish support, and mobile ergonomics.
- Harden deployment, monitoring, API quota handling, and error observability.

## Team and Contributions

Contributions are welcome through issues and pull requests. Useful contribution areas include nutrition data quality, localization, accessibility, UI polish, testing, Supabase integration, API reliability, and safer health communication.

When contributing, avoid adding unverified medical claims, fake partnerships, fake certifications, or real secrets. Keep user safety, cultural fit, and source transparency at the center of product decisions.
