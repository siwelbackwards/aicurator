-- Create audit_logs table and helper function/policies

-- Table to store audit events
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_time timestamptz NOT NULL DEFAULT now(),
  actor_id uuid NULL,
  actor_email text NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  ip_address text NULL,
  user_agent text NULL
);

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail of key user/admin actions';

-- Make table append-only
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Deny updates/deletes via RLS (no policies for them)
CREATE POLICY "Audit logs insert readable by admin, self" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    -- Allow reading own entries or admins (role = admin in profiles)
    actor_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Allow inserts for authenticated" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Helper function for recording audit events
CREATE OR REPLACE FUNCTION public.record_audit_event(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS void AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.audit_logs (
    actor_id,
    actor_email,
    action,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    auth.uid(),
    v_email,
    p_action,
    p_resource_type,
    p_resource_id,
    COALESCE(p_metadata, '{}')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.record_audit_event IS 'Call from RLS-enabled contexts to record an audit log entry';



