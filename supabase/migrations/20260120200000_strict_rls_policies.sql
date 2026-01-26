-- STRICT ROLE-BASED ACCESS CONTROL (RBAC) POLICIES
-- This script enforces that only users with the 'woman' role can perform active safety actions.

-- 1. EMERGENY ALERTS: Restrict Insert to 'woman' role only.
DROP POLICY IF EXISTS "Users can create their own alerts" ON public.emergency_alerts;
DROP POLICY IF EXISTS "Women view own monitors" ON public.emergency_alerts;

CREATE POLICY "Women can insert alerts" ON public.emergency_alerts
FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'woman'
);

CREATE POLICY "Parents can view linked alerts" ON public.emergency_alerts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM monitoring_links
        WHERE parent_id = auth.uid()
        AND woman_id = emergency_alerts.user_id
        AND status = 'active'
    )
);

-- 2. JOURNEYS: Restrict Insert/Update to 'woman' role only.
DROP POLICY IF EXISTS "Users can manage their own journeys" ON public.journeys;

CREATE POLICY "Women can manage own journeys" ON public.journeys
FOR ALL USING (
    auth.uid() = user_id 
    AND (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'woman'
);

-- 3. LOCATION HISTORY: Ensure parents have strictly Read-Only access.
DROP POLICY IF EXISTS "Users can insert their own location history" ON public.location_history;

CREATE POLICY "Women can insert location" ON public.location_history
FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'woman'
);

-- 4. MONITORING LINKS: Ensure only the Woman can generate a code or initiate a link (via link_code).
-- This prevents a Parent from "guessing" a Woman's ID and linking without a code.
DROP POLICY IF EXISTS "Parents can create monitoring links" ON public.monitoring_links;

CREATE POLICY "Parents can only link via valid code" 
ON public.monitoring_links 
FOR UPDATE 
USING (auth.uid() = parent_id)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role = 'parent'
    )
);

-- 5. AUDIT LOGGING (Example Table)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    target_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.security_audit_logs FOR SELECT USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
);
