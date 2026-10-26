CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  phone_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year_of_manufacture integer NOT NULL,
  body_type text NOT NULL,
  transmission text NOT NULL DEFAULT 'Automatic',
  fuel_type text NOT NULL DEFAULT 'Petrol',
  mileage_km integer NOT NULL,
  price_kes numeric(14,2) NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_status_created ON public.listings (status, created_at DESC);
CREATE INDEX idx_listings_make ON public.listings (make);
CREATE INDEX idx_inquiries_listing ON public.inquiries (listing_id);

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;

GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT SELECT ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles are readable by all" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "active listings readable by all" ON public.listings
  FOR SELECT TO anon, authenticated USING (status = 'active' OR auth.uid() = seller_id);
CREATE POLICY "sellers insert own listings" ON public.listings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "sellers update own listings" ON public.listings
  FOR UPDATE TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "sellers delete own listings" ON public.listings
  FOR DELETE TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "anyone can send an inquiry" ON public.inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "sellers read inquiries on own listings" ON public.inquiries
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.seller_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "sellers upload own photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "sellers manage own photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "sellers delete own photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
