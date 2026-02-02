-- ==========================================
-- SETUP DATABASE APLIKASI GURU (MINIMAL FIX)
-- Jalankan script ini di Supabase SQL Editor
-- ==========================================

-- 1. Buat Tabel app_data jika belum ada
CREATE TABLE IF NOT EXISTS public.app_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

-- 3. Hapus Policy lama agar tidak bentrok
DROP POLICY IF EXISTS "Enable read for everyone" ON public.app_data;
DROP POLICY IF EXISTS "Enable all access for anon" ON public.app_data;

-- 4. Buat Policy baru (Akses Penuh untuk Anonim)
CREATE POLICY "Enable all access for anon" 
ON public.app_data 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- 5. Berikan izin akses
GRANT ALL ON public.app_data TO anon;
GRANT ALL ON public.app_data TO authenticated;
GRANT ALL ON public.app_data TO service_role;
