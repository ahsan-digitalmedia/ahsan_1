-- Migration: Automation for app_data table
-- Description: Adds auto-updating for updated_at and implements an audit logging system.

---------------------------------------------------------
-- 1. AUTO UPDATED_AT TRIGGER
---------------------------------------------------------

-- Create the function to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the app_data table
-- Note: Re-runnable script (checks if trigger exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at') THEN
        CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.app_data
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;


---------------------------------------------------------
-- 2. AUDIT LOGGING SYSTEM
---------------------------------------------------------

-- Create the audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL, -- Flexible type
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If the table existed with UUID, change it to TEXT
DO $$ 
BEGIN 
    ALTER TABLE public.audit_logs ALTER COLUMN record_id TYPE TEXT;
EXCEPTION 
    WHEN others THEN NULL; 
END $$;

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow the system/trigger to insert into audit_logs
-- Since the trigger is SECURITY DEFINER, we don't necessarily need a public policy,
-- but adding one for safety if you want to see them.
CREATE POLICY "Enable insert for everyone (via trigger)" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for authenticated users" ON public.audit_logs FOR SELECT TO authenticated USING (true);

-- Create the audit function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data)
        VALUES (TG_TABLE_NAME, OLD.id::text, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data)
        VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the app_data table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_app_data_changes') THEN
        CREATE TRIGGER audit_app_data_changes
        AFTER INSERT OR UPDATE OR DELETE ON public.app_data
        FOR EACH ROW
        EXECUTE FUNCTION public.process_audit_log();
    END IF;
END $$;
