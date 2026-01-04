-- Create evidence_collection table for Silent Evidence Collection
CREATE TABLE IF NOT EXISTS public.evidence_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'audio', 'video', 'location', 'note')),
  data TEXT NOT NULL, -- Base64 encoded or JSON string
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  file_size INTEGER, -- in bytes
  duration INTEGER, -- in seconds (for audio/video)
  synced BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_evidence_collection_user_id ON public.evidence_collection(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_collection_type ON public.evidence_collection(type);
CREATE INDEX IF NOT EXISTS idx_evidence_collection_created_at ON public.evidence_collection(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_collection_synced ON public.evidence_collection(synced);

-- Enable RLS
ALTER TABLE public.evidence_collection ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own evidence" 
ON public.evidence_collection FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own evidence" 
ON public.evidence_collection FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evidence" 
ON public.evidence_collection FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evidence" 
ON public.evidence_collection FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_evidence_collection_updated_at
BEFORE UPDATE ON public.evidence_collection
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

