-- Create user_role type if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('woman', 'parent', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'woman',
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'woman')
  );
  RETURN NEW;
END;
$$;

-- Create monitoring_links table
CREATE TABLE IF NOT EXISTS public.monitoring_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    woman_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'active', 'revoked')) DEFAULT 'pending',
    link_code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(parent_id, woman_id)
);

-- Enable RLS
ALTER TABLE public.monitoring_links ENABLE ROW LEVEL SECURITY;

-- Policies for monitoring_links
CREATE POLICY "Women can view their own monitors"
ON public.monitoring_links FOR SELECT
USING (auth.uid() = woman_id);

CREATE POLICY "Parents can view their own monitoring links"
ON public.monitoring_links FOR SELECT
USING (auth.uid() = parent_id);

CREATE POLICY "Women can update their own monitoring links"
ON public.monitoring_links FOR UPDATE
USING (auth.uid() = woman_id);

CREATE POLICY "Parents can create monitoring links"
ON public.monitoring_links FOR INSERT
WITH CHECK (auth.uid() = parent_id);

-- Update RLS for location_history to allow parents
CREATE POLICY "Parents can view linked location history"
ON public.location_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM monitoring_links
        WHERE parent_id = auth.uid()
        AND woman_id = location_history.user_id
        AND status = 'active'
    )
);

-- Update RLS for emergency_alerts to allow parents
CREATE POLICY "Parents can view linked emergency alerts"
ON public.emergency_alerts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM monitoring_links
        WHERE parent_id = auth.uid()
        AND woman_id = emergency_alerts.user_id
        AND status = 'active'
    )
);

-- Function to handle link code generation (simplified for now)
CREATE OR REPLACE FUNCTION generate_link_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.link_code := floor(random() * (999999 - 100000 + 1) + 100000)::text;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for link code
DROP TRIGGER IF EXISTS tr_generate_link_code ON monitoring_links;
CREATE TRIGGER tr_generate_link_code
BEFORE INSERT ON monitoring_links
FOR EACH ROW
WHEN (NEW.link_code IS NULL)
EXECUTE FUNCTION generate_link_code();
