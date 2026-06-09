# Desi Digest

**Desi Digest** is a culturally intelligent HealthTech web app built for South Asian and Bangladeshi food nutrition tracking. We noticed that most nutrition tools are heavily biased toward Western diets and packaged foods, leaving our users guessing the nutritional value of *bhat, dal, mach, shak,* and *vorta*. 

Desi Digest solves this by offering a deeply familiar, practical, and highly visual experience, powered by **Nanumoni**—our warm, AI-driven nutrition companion.

---

## 🌟 What We've Built (Key Features)

We’ve packed Desi Digest with features designed specifically for the South Asian lifestyle, balancing cutting-edge AI with strict health-safety guardrails:

*   **Culturally Aware Nutrition Tracking:** A localized database and parser that understands Banglish (e.g., estimating macros accurately for a typed meal like "gorur mangsho dim vat").
*   **Photo-Based Plate Analyzer:** Snap a picture of your plate, and Nanumoni will estimate the ingredients, portion sizes, and give you a health score along with actionable feedback.
*   **Smart Health Nudges:** Highly personalized, culturally relevant daily nudges (available in both Bangla and English). The system detects missing fiber, low hydration, or imbalanced rice portions from your logs and offers friendly, non-medical advice.
*   **Raw Food Basket Bridge:** Turn your nutrition advice directly into a practical shopping list for your local *kacha bazar*. It's a smart, zero-checkout bridge to help you gather healthy ingredients.
*   **Shops Near You (Local Discovery):** A privacy-first local discovery map that connects you to nearby public markets, wholesale *arots*, and grocery stores using Google Maps, helping you source fresh, healthy food.
*   **Nanumoni AI Chat:** A conversational assistant that explains nutrition, retrieves your meal data, and offers healthy recipe ideas without ever making unsafe medical claims.
*   **Dashboard & Progress Tracking:** Beautiful macro rings (Calories, Protein, Fiber, Water), daily streaks, and recent meal histories.
*   **Shareable PDF Doctor Reports:** Instantly generate and export your 7-day nutrition summary as a PDF, or share a quick text summary directly via WhatsApp with your doctor or family.
*   **Judge Demo Mode:** A seamless, offline-safe demo experience that allows users to test the app's full capabilities without needing a database login or API keys.

---

## 🚀 The Tech Stack

Desi Digest is engineered for performance, safety, and scale:

- **Framework:** TanStack Start & TanStack Router
- **Frontend UI:** React, TypeScript, Tailwind CSS v4, Shadcn/ui, Radix UI
- **Backend & Database:** Supabase (Auth, Postgres, Storage, RLS)
- **AI & Integrations:** Vercel AI SDK (`ai`, `@ai-sdk/google`) powered by Gemini
- **Data Fetching:** TanStack Query & Server Functions
- **Charts & Feedback:** Recharts, Lucide React, Sonner
- **Build/Deploy:** Vite, Nitro (Cloudflare Workers/Vercel)

---

## 📖 Documentation

Dive deeper into the features, architecture, and design decisions by visiting our [Documentation](/docs) directly within the application.

---

## 👨‍💻 Team & Contributions

This project was brought to life for the **Infinity AI BuildFest 2026** by a dedicated team. 

*For a full breakdown of team contributions, please see our [CONTRIBUTIONS.md](./CONTRIBUTIONS.md).*

### Special Shoutout: Tasfiq Tasin (Technical Lead & Full-Stack AI Engineer)
Tasfiq was the driving force behind the core architecture, backend systems, and the complex AI/database integrations that make Desi Digest smart and reliable. 

**Key contributions by Tasfiq include:**
- Architecting the **Supabase backend**, including Auth, Database schemas, and Storage integrations.
- Building the **Gemini AI model integration**, handling everything from food knowledge retrieval to embeddings and strict AI safety routing.
- Developing the **Plate Analyzer** for photo-based nutrition estimations.
- Engineering the **Smart Health Nudge System**, including robust deterministic fallbacks, curated local image mappings, and multi-language support.
- Creating the **"Shops Near You"** local discovery bridge and the **"Raw Food Basket"** feature using privacy-first, zero-checkout Google Maps integrations.
- Implementing the sophisticated **Banglish manual meal parser** to ensure typed local meals correctly estimate macros without relying on external APIs.
- Managing deployment, Vercel/Supabase production fixes, and ensuring a flawless, regression-free codebase.

---

## 🛠 Local Setup

**Prerequisites:** Node.js 20+, npm, and a Supabase project.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the example environment file and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   *(Note: Never commit your real API keys! Keep server secrets like `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` hidden from the browser).*

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## ⚠️ Medical Disclaimer

Desi Digest provides general nutrition education and meal-tracking support. It is **not** a medical diagnosis tool, treatment plan, or replacement for a licensed physician or registered dietitian. Users with specific medical conditions should consult a qualified professional before making health decisions.