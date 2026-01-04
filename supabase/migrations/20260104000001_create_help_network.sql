-- Create help_requests table for Women-to-Women Help Network
CREATE TABLE IF NOT EXISTS public.help_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('emergency', 'urgent', 'support', 'companion')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  helper_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create helpers table for women offering help
CREATE TABLE IF NOT EXISTS public.helpers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  available BOOLEAN DEFAULT true,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  rating DECIMAL(3,2) DEFAULT 0.0,
  help_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create help_responses table to track who offered help
CREATE TABLE IF NOT EXISTS public.help_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  help_request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES public.helpers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON public.help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON public.help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_location ON public.help_requests(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_helpers_user_id ON public.helpers(user_id);
CREATE INDEX IF NOT EXISTS idx_helpers_available ON public.helpers(available);
CREATE INDEX IF NOT EXISTS idx_helpers_location ON public.helpers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_help_responses_request_id ON public.help_responses(help_request_id);
CREATE INDEX IF NOT EXISTS idx_help_responses_helper_id ON public.help_responses(helper_id);

-- Enable RLS
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_responses ENABLE ROW LEVEL SECURITY;

-- Help Requests Policies
CREATE POLICY "Users can view all active help requests" 
ON public.help_requests FOR SELECT 
USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can create their own help requests" 
ON public.help_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own help requests" 
ON public.help_requests FOR UPDATE 
USING (auth.uid() = user_id);

-- Helpers Policies
CREATE POLICY "Users can view available helpers" 
ON public.helpers FOR SELECT 
USING (available = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own helper profile" 
ON public.helpers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own helper profile" 
ON public.helpers FOR UPDATE 
USING (auth.uid() = user_id);

-- Help Responses Policies
CREATE POLICY "Users can view responses to their requests" 
ON public.help_responses FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.help_requests 
    WHERE help_requests.id = help_responses.help_request_id 
    AND help_requests.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.helpers 
    WHERE helpers.id = help_responses.helper_id 
    AND helpers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create help responses" 
ON public.help_responses FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.helpers 
    WHERE helpers.id = help_responses.helper_id 
    AND helpers.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_help_requests_updated_at
BEFORE UPDATE ON public.help_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_helpers_updated_at
BEFORE UPDATE ON public.helpers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

