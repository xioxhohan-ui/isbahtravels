-- =========================================================
-- ISBAH TRAVELS SECURE DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- =========================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. PROFILES TABLE (Extends auth.users)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  display_name TEXT,
  photo_url TEXT,
  gender TEXT,
  present_address TEXT,
  permanent_address TEXT,
  marital_status TEXT,
  date_of_birth DATE,
  passport_country TEXT,
  passport_number TEXT,
  passport_number_iv TEXT,
  passport_expiry DATE,
  national_id TEXT,
  national_id_iv TEXT,
  nationality TEXT,
  emergency_contact TEXT,
  religion TEXT,
  language_preference TEXT DEFAULT 'en',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to create profile automatically on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, photo_url, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =========================================================
-- 2. FLIGHTS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.flights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_type TEXT NOT NULL CHECK (trip_type IN ('oneway', 'roundtrip', 'multicity')),
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  airline TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  class TEXT NOT NULL DEFAULT 'economy' CHECK (class IN ('economy', 'business')),
  available_seats INTEGER NOT NULL DEFAULT 50,
  max_travelers INTEGER NOT NULL DEFAULT 9,
  stops INTEGER DEFAULT 0,
  logo_url TEXT,
  admin_created UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 3. HOTELS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT,
  address TEXT NOT NULL,
  images TEXT[] DEFAULT ARRAY[]::text[],
  star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
  description TEXT,
  facilities JSONB DEFAULT '{}'::jsonb,
  policies JSONB DEFAULT '{}'::jsonb,
  discount NUMERIC(5, 2) DEFAULT 0.0,
  min_price NUMERIC(12, 2) DEFAULT 0,
  rooms_count INTEGER DEFAULT 0,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  nearby JSONB DEFAULT '[]'::jsonb,
  admin_created UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 4. ROOMS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,
  price_per_night NUMERIC(12, 2) NOT NULL,
  available_count INTEGER NOT NULL DEFAULT 1,
  max_adults INTEGER NOT NULL DEFAULT 2,
  max_children INTEGER NOT NULL DEFAULT 1,
  features TEXT[] DEFAULT ARRAY[]::text[],
  images TEXT[] DEFAULT ARRAY[]::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 5. HOTEL REVIEWS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.hotel_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 6. TOURS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 1,
  price_per_person NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  overview TEXT,
  description TEXT,
  inclusions TEXT[] DEFAULT ARRAY[]::text[],
  exclusions TEXT[] DEFAULT ARRAY[]::text[],
  requirements TEXT[] DEFAULT ARRAY[]::text[],
  travel_tips TEXT[] DEFAULT ARRAY[]::text[],
  itinerary JSONB DEFAULT '[]'::jsonb,
  images TEXT[] DEFAULT ARRAY[]::text[],
  attractions TEXT[] DEFAULT ARRAY[]::text[],
  activities TEXT[] DEFAULT ARRAY[]::text[],
  pickup_locations TEXT[] DEFAULT ARRAY[]::text[],
  availability_dates JSONB DEFAULT '[]'::jsonb,
  max_group_size INTEGER DEFAULT 20,
  min_age INTEGER DEFAULT 0,
  cancellation_policy TEXT,
  refund_policy TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  category TEXT CHECK (category IN ('Domestic', 'International', 'Umrah', 'Honeymoon', 'Adventure')),
  rating NUMERIC(3, 2) DEFAULT 4.9,
  reviews_count INTEGER DEFAULT 0,
  discount NUMERIC(5, 2) DEFAULT 0.0,
  admin_created UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 7. TOUR REVIEWS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.tour_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 8. VISAS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.visas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country TEXT NOT NULL,
  visa_type TEXT NOT NULL,
  processing_time TEXT NOT NULL,
  fee NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  add_on_services TEXT[] DEFAULT ARRAY[]::text[],
  important_notes TEXT,
  documents_required JSONB DEFAULT '{}'::jsonb,
  contact_info JSONB DEFAULT '{}'::jsonb,
  admin_created UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 9. BOOKINGS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('flight', 'hotel', 'tour', 'visa')),
  reference_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_price NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_details JSONB DEFAULT '{}'::jsonb,
  booking_status TEXT NOT NULL DEFAULT 'pending' CHECK (booking_status IN ('confirmed', 'cancelled', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 10. VISA INQUIRIES TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.visa_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  preferred_date DATE,
  additional_requirements TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 11. TOUR INQUIRIES TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.tour_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  preferred_date DATE,
  additional_requirements TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 12. SAVED ITEMS (FAVORITES) TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.saved_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('hotel', 'tour', 'flight')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entity_type, entity_id)
);

-- =========================================================
-- 13. AUDIT LOGS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB DEFAULT '{}'::jsonb,
  new_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 14. USER 2FA TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.user_2fa (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  backup_codes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- INDEXES FOR OPTIMAL PERFORMANCE & SECURITY
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_hotels_city ON public.hotels(city);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON public.rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tours_location ON public.tours(location);
CREATE INDEX IF NOT EXISTS idx_visas_country ON public.visas(country);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_saved_items_user ON public.saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_reviews_hotel ON public.hotel_reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_tour ON public.tour_reviews(tour_id);
CREATE INDEX IF NOT EXISTS idx_flights_segments ON public.flights USING gin (segments);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON public.user_2fa(enabled);

-- =========================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- PROFILES
DROP POLICY IF EXISTS "Public / Users can read profiles" ON public.profiles;
CREATE POLICY "Public / Users can read profiles" ON public.profiles FOR SELECT USING ( (select auth.uid()) = id OR public.is_admin() );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ( (select auth.uid()) = id OR public.is_admin() ) WITH CHECK ( (select auth.uid()) = id OR public.is_admin() );

-- FLIGHTS (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public read flights" ON public.flights;
CREATE POLICY "Public read flights" ON public.flights FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins insert flights" ON public.flights;
CREATE POLICY "Admins insert flights" ON public.flights FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update flights" ON public.flights;
CREATE POLICY "Admins update flights" ON public.flights FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete flights" ON public.flights;
CREATE POLICY "Admins delete flights" ON public.flights FOR DELETE USING (public.is_admin());

-- HOTELS (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public read hotels" ON public.hotels;
CREATE POLICY "Public read hotels" ON public.hotels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins insert hotels" ON public.hotels;
CREATE POLICY "Admins insert hotels" ON public.hotels FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update hotels" ON public.hotels;
CREATE POLICY "Admins update hotels" ON public.hotels FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete hotels" ON public.hotels;
CREATE POLICY "Admins delete hotels" ON public.hotels FOR DELETE USING (public.is_admin());

-- ROOMS (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public read rooms" ON public.rooms;
CREATE POLICY "Public read rooms" ON public.rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins insert rooms" ON public.rooms;
CREATE POLICY "Admins insert rooms" ON public.rooms FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update rooms" ON public.rooms;
CREATE POLICY "Admins update rooms" ON public.rooms FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete rooms" ON public.rooms;
CREATE POLICY "Admins delete rooms" ON public.rooms FOR DELETE USING (public.is_admin());

-- TOURS (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public read tours" ON public.tours;
CREATE POLICY "Public read tours" ON public.tours FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins insert tours" ON public.tours;
CREATE POLICY "Admins insert tours" ON public.tours FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update tours" ON public.tours;
CREATE POLICY "Admins update tours" ON public.tours FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete tours" ON public.tours;
CREATE POLICY "Admins delete tours" ON public.tours FOR DELETE USING (public.is_admin());

-- VISAS (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public read visas" ON public.visas;
CREATE POLICY "Public read visas" ON public.visas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins insert visas" ON public.visas;
CREATE POLICY "Admins insert visas" ON public.visas FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update visas" ON public.visas;
CREATE POLICY "Admins update visas" ON public.visas FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete visas" ON public.visas;
CREATE POLICY "Admins delete visas" ON public.visas FOR DELETE USING (public.is_admin());

-- HOTEL REVIEWS (Public Read, Auth Users Insert, Own User/Admin Update/Delete)
DROP POLICY IF EXISTS "Public read hotel_reviews" ON public.hotel_reviews;
CREATE POLICY "Public read hotel_reviews" ON public.hotel_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users insert hotel_reviews" ON public.hotel_reviews;
CREATE POLICY "Auth users insert hotel_reviews" ON public.hotel_reviews FOR INSERT TO authenticated WITH CHECK ( (select auth.uid()) = user_id );

DROP POLICY IF EXISTS "Users/Admins update hotel_reviews" ON public.hotel_reviews;
CREATE POLICY "Users/Admins update hotel_reviews" ON public.hotel_reviews FOR UPDATE USING ( (select auth.uid()) = user_id OR public.is_admin() ) WITH CHECK ( (select auth.uid()) = user_id OR public.is_admin() );

DROP POLICY IF EXISTS "Users/Admins delete hotel_reviews" ON public.hotel_reviews;
CREATE POLICY "Users/Admins delete hotel_reviews" ON public.hotel_reviews FOR DELETE USING ( (select auth.uid()) = user_id OR public.is_admin() );

-- TOUR REVIEWS (Public Read, Auth Users Insert, Own User/Admin Update/Delete)
DROP POLICY IF EXISTS "Public read tour_reviews" ON public.tour_reviews;
CREATE POLICY "Public read tour_reviews" ON public.tour_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users insert tour_reviews" ON public.tour_reviews;
CREATE POLICY "Auth users insert tour_reviews" ON public.tour_reviews FOR INSERT TO authenticated WITH CHECK ( (select auth.uid()) = user_id );

DROP POLICY IF EXISTS "Users/Admins update tour_reviews" ON public.tour_reviews;
CREATE POLICY "Users/Admins update tour_reviews" ON public.tour_reviews FOR UPDATE USING ( (select auth.uid()) = user_id OR public.is_admin() ) WITH CHECK ( (select auth.uid()) = user_id OR public.is_admin() );

DROP POLICY IF EXISTS "Users/Admins delete tour_reviews" ON public.tour_reviews;
CREATE POLICY "Users/Admins delete tour_reviews" ON public.tour_reviews FOR DELETE USING ( (select auth.uid()) = user_id OR public.is_admin() );

-- BOOKINGS (Own User / Admin)
DROP POLICY IF EXISTS "Read own bookings or admin" ON public.bookings;
CREATE POLICY "Read own bookings or admin" ON public.bookings FOR SELECT USING ( (select auth.uid()) = user_id OR public.is_admin() );

DROP POLICY IF EXISTS "Insert own bookings or admin" ON public.bookings;
CREATE POLICY "Insert own bookings or admin" ON public.bookings FOR INSERT WITH CHECK ( (select auth.uid()) = user_id OR public.is_admin() );

DROP POLICY IF EXISTS "Update own bookings or admin" ON public.bookings;
CREATE POLICY "Update own bookings or admin" ON public.bookings FOR UPDATE USING ( (select auth.uid()) = user_id OR public.is_admin() ) WITH CHECK ( (select auth.uid()) = user_id OR public.is_admin() );

DROP POLICY IF EXISTS "Delete bookings admin" ON public.bookings;
CREATE POLICY "Delete bookings admin" ON public.bookings FOR DELETE USING ( public.is_admin() );

-- VISA INQUIRIES & TOUR INQUIRIES (Public Insert, Admin/Owner Read/Update)
DROP POLICY IF EXISTS "Public insert visa_inquiries" ON public.visa_inquiries;
CREATE POLICY "Public insert visa_inquiries" ON public.visa_inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin view visa_inquiries" ON public.visa_inquiries;
CREATE POLICY "Admin view visa_inquiries" ON public.visa_inquiries FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin update visa_inquiries" ON public.visa_inquiries;
CREATE POLICY "Admin update visa_inquiries" ON public.visa_inquiries FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public insert tour_inquiries" ON public.tour_inquiries;
CREATE POLICY "Public insert tour_inquiries" ON public.tour_inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin view tour_inquiries" ON public.tour_inquiries;
CREATE POLICY "Admin view tour_inquiries" ON public.tour_inquiries FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin update tour_inquiries" ON public.tour_inquiries;
CREATE POLICY "Admin update tour_inquiries" ON public.tour_inquiries FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SAVED ITEMS (FAVORITES)
DROP POLICY IF EXISTS "Read own saved items" ON public.saved_items;
CREATE POLICY "Read own saved items" ON public.saved_items FOR SELECT USING ( (select auth.uid()) = user_id );

DROP POLICY IF EXISTS "Insert own saved items" ON public.saved_items;
CREATE POLICY "Insert own saved items" ON public.saved_items FOR INSERT WITH CHECK ( (select auth.uid()) = user_id );

DROP POLICY IF EXISTS "Delete own saved items" ON public.saved_items;
CREATE POLICY "Delete own saved items" ON public.saved_items FOR DELETE USING ( (select auth.uid()) = user_id );

-- AUDIT LOGS
DROP POLICY IF EXISTS "Admins select audit_logs" ON public.audit_logs;
CREATE POLICY "Admins select audit_logs" ON public.audit_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins insert audit_logs" ON public.audit_logs;
CREATE POLICY "Admins insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin());

-- USER 2FA
DROP POLICY IF EXISTS "Users manage own 2FA" ON public.user_2fa;
CREATE POLICY "Users manage own 2FA" ON public.user_2fa FOR ALL USING ( (select auth.uid()) = user_id OR public.is_admin() );
