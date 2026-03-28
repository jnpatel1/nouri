-- ============================================================
-- Nouri Database Schema
-- Supabase Postgres with Row Level Security
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users with fitness-specific data
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  age INTEGER CHECK (age >= 13 AND age <= 120),
  sex TEXT CHECK (sex IN ('male', 'female')),
  height_cm NUMERIC(5,1) CHECK (height_cm > 0 AND height_cm < 300),
  weight_kg NUMERIC(5,1) CHECK (weight_kg > 0 AND weight_kg < 500),
  activity_level TEXT CHECK (activity_level IN (
    'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'
  )),
  goal TEXT CHECK (goal IN (
    'lose_fast', 'lose', 'lose_slow', 'maintain', 'gain_slow', 'gain'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FOOD ITEMS
-- Community food database with verification
-- ============================================================
CREATE TABLE public.food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  serving_size NUMERIC(8,2) NOT NULL,
  serving_unit TEXT NOT NULL DEFAULT 'g',
  calories NUMERIC(8,1) NOT NULL,
  protein NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat NUMERIC(6,1) NOT NULL DEFAULT 0,
  fiber NUMERIC(6,1) DEFAULT 0,
  sugar NUMERIC(6,1) DEFAULT 0,
  sodium NUMERIC(8,1) DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'community' CHECK (source IN (
    'openfoodfacts', 'community', 'personal', 'ai_recognized'
  )),
  verification_score INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_food_items_name ON public.food_items USING gin(to_tsvector('english', name));
CREATE INDEX idx_food_items_barcode ON public.food_items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_food_items_source ON public.food_items(source);

-- ============================================================
-- FOOD LOG ENTRIES
-- Core tracking table
-- ============================================================
CREATE TABLE public.food_log_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES public.food_items(id),
  custom_name TEXT,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  servings NUMERIC(6,2) NOT NULL DEFAULT 1,
  calories NUMERIC(8,1) NOT NULL,
  protein NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat NUMERIC(6,1) NOT NULL DEFAULT 0,
  fiber NUMERIC(6,1) DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_food_log_user_date ON public.food_log_entries(user_id, date);
CREATE INDEX idx_food_log_date ON public.food_log_entries(date);

-- ============================================================
-- FOOD VERIFICATIONS
-- Community upvote/dispute system
-- ============================================================
CREATE TABLE public.food_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_item_id UUID NOT NULL REFERENCES public.food_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('confirm', 'dispute')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(food_item_id, user_id)
);

-- Auto-update verification score
CREATE OR REPLACE FUNCTION public.update_verification_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.food_items
  SET
    verification_score = (
      SELECT COALESCE(
        ROUND(
          COUNT(*) FILTER (WHERE vote = 'confirm')::NUMERIC /
          NULLIF(COUNT(*), 0) * 100
        ), 0
      )
      FROM public.food_verifications
      WHERE food_item_id = COALESCE(NEW.food_item_id, OLD.food_item_id)
    ),
    verified = (
      SELECT COUNT(*) FILTER (WHERE vote = 'confirm') >= 3
      FROM public.food_verifications
      WHERE food_item_id = COALESCE(NEW.food_item_id, OLD.food_item_id)
    )
  WHERE id = COALESCE(NEW.food_item_id, OLD.food_item_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_verification_change
  AFTER INSERT OR UPDATE OR DELETE ON public.food_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_verification_score();

-- ============================================================
-- WEIGHT LOG
-- For adaptive TDEE calculation
-- ============================================================
CREATE TABLE public.weight_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,1) NOT NULL CHECK (weight_kg > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_weight_log_user_date ON public.weight_log(user_id, date);

-- ============================================================
-- WATER LOG
-- ============================================================
CREATE TABLE public.water_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_water_log_user_date ON public.water_log(user_id, date);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_log ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/write their own
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Food items: everyone can read, authenticated users can insert
CREATE POLICY "Anyone can view food items" ON public.food_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can add food items" ON public.food_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Food log: users can only access their own entries
CREATE POLICY "Users can view own food log" ON public.food_log_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own food log" ON public.food_log_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own food log" ON public.food_log_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own food log" ON public.food_log_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Verifications: users can view all, manage their own
CREATE POLICY "Anyone can view verifications" ON public.food_verifications
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add verifications" ON public.food_verifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own verifications" ON public.food_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Weight log: private to user
CREATE POLICY "Users can view own weight log" ON public.weight_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight log" ON public.weight_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weight log" ON public.weight_log
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weight log" ON public.weight_log
  FOR DELETE USING (auth.uid() = user_id);

-- Water log: private to user
CREATE POLICY "Users can view own water log" ON public.water_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own water log" ON public.water_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own water log" ON public.water_log
  FOR DELETE USING (auth.uid() = user_id);
