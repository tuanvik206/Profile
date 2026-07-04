-- ============================================================
-- MIGRATION: Visitor Tracking System
-- Run this script in your Supabase Dashboard -> SQL Editor
-- ============================================================

-- Create visitor_logs table
CREATE TABLE IF NOT EXISTS public.visitor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now(),
    ip TEXT,
    city TEXT,
    country TEXT,
    country_code TEXT,
    user_agent TEXT,
    referrer TEXT,
    path TEXT,
    screen_width INTEGER,
    screen_height INTEGER
);

-- Add index on session_id and last_active_at for fast queries
CREATE INDEX IF NOT EXISTS visitor_logs_session_id_idx ON public.visitor_logs(session_id);
CREATE INDEX IF NOT EXISTS visitor_logs_last_active_at_idx ON public.visitor_logs(last_active_at);

-- Enable RLS
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public insert" ON public.visitor_logs;
DROP POLICY IF EXISTS "Allow public update" ON public.visitor_logs;
DROP POLICY IF EXISTS "Allow admin select" ON public.visitor_logs;
DROP POLICY IF EXISTS "Allow admin delete" ON public.visitor_logs;

-- Policies:
-- 1. Anyone (public) can insert new log entries when visiting the site
CREATE POLICY "Allow public insert" ON public.visitor_logs
    FOR INSERT 
    WITH CHECK (true);

-- 2. Anyone (public) can update the last_active_at column for heartbeats
CREATE POLICY "Allow public update" ON public.visitor_logs
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- 3. Only logged in Admin (authenticated) can select visitor logs
CREATE POLICY "Allow admin select" ON public.visitor_logs
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 4. Only logged in Admin (authenticated) can delete visitor logs (e.g. clear logs)
CREATE POLICY "Allow admin delete" ON public.visitor_logs
    FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Database Function (RPC) to retrieve visitor stats safely (without exposing IPs to public users)
CREATE OR REPLACE FUNCTION public.get_visitor_stats()
RETURNS TABLE (online_count BIGINT, total_views BIGINT, total_visitors BIGINT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_online BIGINT;
    v_views BIGINT;
    v_visitors BIGINT;
BEGIN
    -- Active users count (distinct session_ids active in the last 35 seconds)
    SELECT COUNT(DISTINCT session_id) INTO v_online
    FROM public.visitor_logs
    WHERE last_active_at > (now() - interval '35 seconds');

    -- Total page views (total rows in table)
    SELECT COUNT(*) INTO v_views
    FROM public.visitor_logs;

    -- Total unique visitors (distinct session_ids)
    SELECT COUNT(DISTINCT session_id) INTO v_visitors
    FROM public.visitor_logs;

    RETURN QUERY SELECT v_online, v_views, v_visitors;
END;
$$;
