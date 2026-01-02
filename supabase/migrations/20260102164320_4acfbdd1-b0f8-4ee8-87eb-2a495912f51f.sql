-- Create journeys table for tracking user journeys
CREATE TABLE public.journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  destination TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_arrival TIMESTAMP WITH TIME ZONE NOT NULL,
  check_in_interval INTEGER NOT NULL DEFAULT 15, -- minutes
  last_check_in TIMESTAMP WITH TIME ZONE,
  next_check_in TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, alert
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own journeys" 
ON public.journeys FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journeys" 
ON public.journeys FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journeys" 
ON public.journeys FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journeys" 
ON public.journeys FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_journeys_updated_at
BEFORE UPDATE ON public.journeys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();