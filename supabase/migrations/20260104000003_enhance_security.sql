-- Enhance profiles table with security fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'helper', 'moderator', 'admin')),
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS security_questions JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Create security_logs table
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB,
  ip_address TEXT,
  device_fingerprint TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for security_logs
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);

-- Create sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  ip_address TEXT,
  device_fingerprint TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Enable RLS on new tables
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Security logs policies
CREATE POLICY "Users can view their own security logs" 
ON public.security_logs FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can create security logs" 
ON public.security_logs FOR INSERT 
WITH CHECK (true);

-- User sessions policies
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.user_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- Function to check and lock account after failed attempts
CREATE OR REPLACE FUNCTION public.check_account_lock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.failed_login_attempts >= 5 THEN
    NEW.account_locked_until := now() + INTERVAL '30 minutes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for account locking
CREATE TRIGGER check_account_lock_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (NEW.failed_login_attempts >= 5 AND OLD.failed_login_attempts < 5)
EXECUTE FUNCTION public.check_account_lock();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

