-- Create location_history table for tracking user locations
CREATE TABLE IF NOT EXISTS public.location_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_location_history_user_id ON public.location_history(user_id);
CREATE INDEX IF NOT EXISTS idx_location_history_created_at ON public.location_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own location history" 
ON public.location_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location history" 
ON public.location_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own location history" 
ON public.location_history FOR DELETE 
USING (auth.uid() = user_id);

