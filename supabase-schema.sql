-- ============================================================
-- HARI DEV - Supabase Database Schema
-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com)
-- ============================================================

-- 1. TABEL PROFILES (menyambung ke auth.users via trigger)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone_number TEXT,
  birth_date TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL LANDING PAGE CONTENT (single-row CMS)
CREATE TABLE IF NOT EXISTS landing_page_content (
  id INTEGER PRIMARY KEY DEFAULT 1,
  badge_text TEXT DEFAULT '⚡ AI-Powered Innovation',
  title_line1 TEXT DEFAULT 'Build Your Digital',
  title_line2 TEXT DEFAULT 'Vision, Instantly',
  description TEXT DEFAULT 'Describe your dream website - AI handles the rest'
);

-- 3. TABEL PORTFOLIOS
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT DEFAULT 'from-blue-500/20',
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Published', 'Draft')),
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO landing_page_content (id, badge_text, title_line1, title_line2, description)
VALUES (1, '⚡ AI-Powered Innovation', 'Build Your Digital', 'Vision, Instantly', 'Describe your dream website and AI handles the rest')
ON CONFLICT (id) DO NOTHING;

INSERT INTO portfolios (title, type, color, status) VALUES
  ('NexaBank', 'Fintech', 'from-blue-500/20', 'Published'),
  ('BloomSpace', 'E-Commerce', 'from-rose-500/20', 'Published'),
  ('DataForge', 'Analytics', 'from-amber-500/20', 'Published')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TRIGGER: auto-buat profile saat user sign up
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number, birth_date, status, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'birth_date',
    'pending',
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- --- PROFILES ---
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can update profiles"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- --- LANDING PAGE CONTENT ---
CREATE POLICY "Public can view landing content"
  ON landing_page_content FOR SELECT
  USING (true);

CREATE POLICY "Admin can update landing content"
  ON landing_page_content FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can insert landing content"
  ON landing_page_content FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- --- PORTFOLIOS ---
CREATE POLICY "Public can view published portfolios"
  ON portfolios FOR SELECT
  USING (status = 'Published' OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can insert portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can update portfolios"
  ON portfolios FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can delete portfolios"
  ON portfolios FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- SET ADMIN (Jalankan setelah bikin user pertama)
-- Ganti 'admin@email.com' dengan email admin Anda
-- ============================================================
-- UPDATE profiles SET role = 'admin', status = 'approved' WHERE email = 'admin@email.com';
