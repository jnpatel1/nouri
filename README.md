# Nouri — AI-Powered Nutrition Tracker

A modern, minimal fitness and nutrition tracker with AI food recognition, community food database, and adaptive macro calculations.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Edge Functions + Storage)
- **AI**: Claude API via Edge Functions (photo recognition, voice parsing)
- **Food Data**: OpenFoodFacts API + community submissions
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Features

### MVP (Phase 1)
- [x] Google OAuth + email/password authentication
- [x] Daily macro dashboard with animated progress rings
- [x] TDEE calculator (Mifflin-St Jeor equation)
- [x] Smart macro splits (protein scaled to goal)
- [x] Food search with community database
- [x] AI photo food recognition (Claude Vision)
- [x] Meal categorization (breakfast/lunch/dinner/snack)
- [x] Water tracking
- [x] Daily macro score / gamification
- [x] System theme auto-detection (dark/light)
- [x] Responsive, mobile-first design
- [x] Community food verification system
- [x] Supabase RLS (Row Level Security) policies

### Phase 1.5 (Fast Follow)
- [ ] Barcode scanning (browser camera)
- [ ] Voice logging (Web Speech API + Claude)
- [ ] Weekly/monthly trend charts
- [ ] OpenFoodFacts API integration

### Phase 2
- [ ] Weight logging with EMA trend line
- [ ] Adaptive TDEE recalculation
- [ ] Recipe builder & meal templates
- [ ] Progress photos
- [ ] Google Calendar MCP integration
- [ ] Gmail MCP for weekly digests
- [ ] Streak system

### Phase 3 (Mobile)
- [ ] React Native app (shared Supabase backend)
- [ ] HealthKit / Google Fit integration
- [ ] Step counter, heart rate
- [ ] Push notifications

## Quick Start

### 1. Clone and install
```bash
git clone <repo>
cd nouri
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration: copy `supabase/migrations/001_initial_schema.sql` into the SQL Editor
3. Enable Google OAuth in Authentication > Providers
4. Copy your project URL and anon key

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 4. Deploy Edge Functions (for AI features)
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy recognize-food
supabase functions deploy parse-voice-log
```

### 5. Run locally
```bash
npm run dev
```

The app runs in **demo mode** if Supabase isn't configured, with sample data preloaded.

## Architecture

```
nouri/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── CalorieBar     # Main calorie progress bar
│   │   ├── MacroRing      # Circular macro progress
│   │   ├── MealSection    # Meal group with entries
│   │   ├── FoodSearchModal # Search, AI photo, voice
│   │   ├── WaterTracker   # Water intake tracker
│   │   └── NavBar         # Header with date nav
│   ├── contexts/          # React contexts
│   │   ├── AuthContext    # Auth state + Supabase
│   │   ├── FoodContext    # Food data + logging
│   │   └── ThemeContext   # Dark/light theme
│   ├── pages/             # Page components
│   │   ├── LoginPage      # OAuth + email auth
│   │   ├── OnboardingPage # Profile setup + TDEE
│   │   └── DashboardPage  # Main daily view
│   ├── lib/               # Utilities
│   │   ├── supabase.ts    # Supabase client
│   │   └── tdee.ts        # TDEE calculation engine
│   └── types/             # TypeScript definitions
├── supabase/
│   ├── migrations/        # Database schema
│   └── functions/         # Edge Functions
│       ├── recognize-food # AI photo recognition
│       └── parse-voice-log # Voice to food entries
└── README.md
```

## TDEE Calculation

Uses the **Mifflin-St Jeor equation** (most validated):
- Male: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
- Female: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161

Macro splits follow sports nutrition research:
- **Deficit**: 2.0g/kg protein (muscle preservation)
- **Maintenance**: 1.8g/kg protein
- **Surplus**: 1.6g/kg protein
- **Fat**: 28% of calories (min 0.5g/kg for hormonal health)
- **Carbs**: Remainder
- **Fiber**: 14g per 1000 kcal (IOM recommendation)

## Deployment

### Vercel
```bash
npm run build
# Deploy via Vercel CLI or connect GitHub repo
```

### Environment Variables (Vercel)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## License

MIT
