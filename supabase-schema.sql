-- ============================================
-- HYROX COMMUNITY - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  country TEXT DEFAULT 'AR',
  city TEXT,
  bio TEXT,
  weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKOUT LOGS (historial - tu tabla actual)
-- ============================================
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  date DATE NOT NULL,
  time_seconds INTEGER NOT NULL,   -- siempre en segundos para ordenar/comparar
  feeling TEXT CHECK (feeling IN ('Excelente', 'Fuerte', 'Cansado', 'Agotado', 'Molestias')),
  notes TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PERSONAL BESTS por estación
-- ============================================
CREATE TABLE personal_bests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  station_id TEXT NOT NULL,        -- 'ex-run', 'ex-skierg', etc.
  station_name TEXT NOT NULL,
  value_seconds INTEGER,           -- para tiempo
  value_text TEXT,                 -- para distancia/reps si aplica
  achieved_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, station_id)      -- un PB por estación por usuario
);

-- ============================================
-- CUSTOM WORKOUT PLANS (tu planificador actual)
-- ============================================
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHALLENGES semanales
-- ============================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  station_id TEXT,
  target_value INTEGER,            -- en segundos o reps
  target_type TEXT CHECK (target_type IN ('time', 'reps', 'distance')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenge_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  value INTEGER NOT NULL,          -- resultado en segundos o reps
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- ============================================
-- SOCIAL: FOLLOWS
-- ============================================
CREATE TABLE follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- ============================================
-- SOCIAL: KUDOS (likes en workouts)
-- ============================================
CREATE TABLE kudos (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, log_id)
);

-- ============================================
-- VIEWS útiles
-- ============================================

-- Ranking global por tiempo total (Full Simulation)
CREATE OR REPLACE VIEW global_rankings AS
SELECT
  p.username,
  p.full_name,
  p.country,
  p.city,
  p.avatar_url,
  wl.time_seconds,
  wl.date,
  wl.id as log_id,
  ROW_NUMBER() OVER (ORDER BY wl.time_seconds ASC) as rank
FROM workout_logs wl
JOIN profiles p ON p.user_id = wl.user_id
WHERE wl.is_public = true
  AND LOWER(wl.plan_name) LIKE '%simulation%'
  OR LOWER(wl.plan_name) LIKE '%hyrox full%'
ORDER BY wl.time_seconds ASC;

-- Feed de actividad pública
CREATE OR REPLACE VIEW activity_feed AS
SELECT
  wl.id,
  wl.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  wl.plan_name,
  wl.time_seconds,
  wl.feeling,
  wl.notes,
  wl.date,
  wl.created_at,
  COUNT(k.user_id) as kudos_count
FROM workout_logs wl
JOIN profiles p ON p.user_id = wl.user_id
LEFT JOIN kudos k ON k.log_id = wl.id
WHERE wl.is_public = true
GROUP BY wl.id, p.username, p.full_name, p.avatar_url
ORDER BY wl.created_at DESC;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_bests ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;

-- Profiles: ver públicos, editar solo el propio
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "profiles_own_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Workout logs: ver públicos, CRUD propio
CREATE POLICY "logs_public_read" ON workout_logs FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "logs_own_insert" ON workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "logs_own_update" ON workout_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "logs_own_delete" ON workout_logs FOR DELETE USING (auth.uid() = user_id);

-- Personal bests: ver públicos, CRUD propio
CREATE POLICY "pb_public_read" ON personal_bests FOR SELECT USING (true);
CREATE POLICY "pb_own_write" ON personal_bests FOR ALL USING (auth.uid() = user_id);

-- Plans: privados por default, CRUD propio
CREATE POLICY "plans_read" ON workout_plans FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "plans_own_write" ON workout_plans FOR ALL USING (auth.uid() = user_id);

-- Challenges: todos pueden leer, usuarios autenticados pueden participar
CREATE POLICY "challenges_read" ON challenges FOR SELECT USING (true);
CREATE POLICY "entries_own" ON challenge_entries FOR ALL USING (auth.uid() = user_id);

-- Follows y kudos
CREATE POLICY "follows_read" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_own" ON follows FOR ALL USING (auth.uid() = follower_id);
CREATE POLICY "kudos_read" ON kudos FOR SELECT USING (true);
CREATE POLICY "kudos_own" ON kudos FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: auto-crear profile al registrarse
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED: Challenge de ejemplo
-- ============================================
INSERT INTO challenges (title, description, station_id, target_value, target_type, start_date, end_date)
VALUES (
  'Wall Ball Challenge — 100 reps',
  'Completá 100 Wall Balls en el menor tiempo posible. Registrá tu resultado antes del domingo.',
  'ex-wall-balls',
  360,
  'time',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days'
);
