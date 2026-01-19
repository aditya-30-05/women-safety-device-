-- Create unsafe_zones table
CREATE TABLE IF NOT EXISTS public.unsafe_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius INTEGER NOT NULL DEFAULT 500, -- in meters
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  report_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unsafe_zones ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read unsafe zones
CREATE POLICY "Anyone can view unsafe zones" 
ON public.unsafe_zones FOR SELECT 
USING (true);

-- Allow authenticated users to report/insert (if needed, but for now just admin/manual)
CREATE POLICY "Authenticated users can insert unsafe zones" 
ON public.unsafe_zones FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_unsafe_zones_lat_lng ON public.unsafe_zones(lat, lng);
