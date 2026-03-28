# Nouri -- AI-Powered Nutrition Tracker

A modern, minimal fitness tracker with AI food recognition via Gemini Vision, community food database, adaptive macro calculations, and OpenFoodFacts integration.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Edge Functions + Storage + RLS)
- **AI**: Gemini 2.0 Flash (photo recognition, voice parsing)
- **Food Data**: OpenFoodFacts API (open source, barcode support) + community DB
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Features

- Google OAuth + email/password authentication
- AI photo food recognition (Gemini Vision -- snap a photo, get macros)
- Voice food logging (Web Speech API + Gemini parsing)
- OpenFoodFacts search (millions of products, barcode support)
- Community food database with verification system
- Daily macro dashboard with animated progress rings
- TDEE calculator (Mifflin-St Jeor, research-backed protein scaling)
- Weight tracking with exponential moving average trend line
- Water tracking
- Weekly macro trend bar charts
- Streak system with milestones
- Daily macro adherence score
- System theme auto-detection (dark/light)
- Responsive, mobile-first design
- Row Level Security on all tables

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd nouri
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your actual keys (see below)

# 3. Run locally
npm run dev
```

The app runs in demo mode if Supabase isn't configured.

## Environment Variables

Create a `.env` file at the project root:

```env
# Supabase -- get from your project dashboard > Settings > API
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key

# Gemini -- get free at https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your-gemini-api-key

# OpenFoodFacts (no key needed)
VITE_OPENFOODFACTS_API=https://world.openfoodfacts.org/api/v2
```

## Supabase Setup

1. Create a project at supabase.com
2. Go to SQL Editor, paste the contents of `supabase/migrations/001_initial_schema.sql`, run it
3. Go to Authentication > Providers > Google, enable it with your Google OAuth credentials
4. Copy your project URL and publishable key into `.env`

## Vercel Deployment

1. Push this repo to GitHub
2. Go to vercel.com > Add New Project > Import your repo
3. Framework: Vite (auto-detected)
4. Add these Environment Variables in Vercel dashboard:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your publishable key |
| `VITE_GEMINI_API_KEY` | Your Gemini API key |
| `VITE_OPENFOODFACTS_API` | `https://world.openfoodfacts.org/api/v2` |

5. Click Deploy. Done.

The `vercel.json` is already configured with SPA rewrites and asset caching.

## Edge Functions (Optional Server-Side AI)

The AI features work client-side by default (calls Gemini directly from browser). For production, you can route through Supabase Edge Functions to keep API keys server-side:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GEMINI_API_KEY=your-gemini-key
supabase functions deploy recognize-food
supabase functions deploy parse-voice-log
```

## Architecture

```
nouri/
  src/
    components/
      CalorieBar.tsx        # Main calorie progress bar
      MacroRing.tsx          # Circular macro progress rings
      MealSection.tsx        # Meal group with food entries
      FoodSearchModal.tsx    # Search (local + OpenFoodFacts)
      CameraCapture.tsx      # AI photo recognition UI
      VoiceLogger.tsx        # Voice logging with Speech API
      WaterTracker.tsx       # Water intake tracker
      WeightTracker.tsx      # Weight log + EMA trend chart
      MacroTrends.tsx        # Weekly bar chart trends
      StreakBadge.tsx         # Streak counter with milestones
      NavBar.tsx             # Header with date navigation
    contexts/
      AuthContext.tsx         # Auth state + Supabase
      FoodContext.tsx         # Food data, logging, search
      ThemeContext.tsx        # Dark/light theme
    pages/
      LoginPage.tsx           # OAuth + email auth
      OnboardingPage.tsx      # Profile setup + TDEE calc
      DashboardPage.tsx       # Main daily view
    lib/
      supabase.ts             # Supabase client
      tdee.ts                 # TDEE calculation engine
      gemini.ts               # Gemini AI service
      openfoodfacts.ts        # OpenFoodFacts API
    types/
      index.ts                # TypeScript definitions
  supabase/
    migrations/               # Database schema SQL
    functions/                 # Edge Functions (Gemini)
  vercel.json                  # Vercel deployment config
```

## TDEE Calculation

Mifflin-St Jeor (most validated):
- Male: BMR = (10 x weight_kg) + (6.25 x height_cm) - (5 x age) + 5
- Female: BMR = (10 x weight_kg) + (6.25 x height_cm) - (5 x age) - 161

Protein scaling (Schoenfeld & Aragon, 2018):
- Deficit: 2.0g/kg (muscle preservation)
- Maintenance: 1.8g/kg
- Surplus: 1.6g/kg

## License

MIT
