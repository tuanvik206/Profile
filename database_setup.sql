-- ============================================================
-- SQL Setup Script: Profile & Visitor Tracking Database
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create site_info table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_info (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL DEFAULT 'ANH TUẤN',
    avatar_url TEXT,
    project_name TEXT DEFAULT 'Dự Án Cá Nhân',
    project_link TEXT,
    education_school TEXT DEFAULT 'ICTU',
    education_logo TEXT,
    education_desc TEXT,
    education_major TEXT DEFAULT 'Công Nghệ Thông Tin',
    education_years TEXT DEFAULT '2024 - 2028',
    education_school_en TEXT,
    education_major_en TEXT,
    education_years_en TEXT,
    education_desc_en TEXT,
    facebook_url TEXT DEFAULT '#',
    instagram_url TEXT DEFAULT '#',
    github_url TEXT DEFAULT '#',
    email TEXT DEFAULT 'mailto:tuanaraoo@gmail.com',
    linkedin_url TEXT,
    twitter_url TEXT,
    youtube_url TEXT,
    tiktok_url TEXT,
    dribbble_url TEXT,
    behance_url TEXT,
    twitch_url TEXT,
    discord_url TEXT,
    est_year TEXT DEFAULT '2026',
    coordinates TEXT DEFAULT '14.0583° N, 108.2772° E',
    location_text TEXT DEFAULT 'VIỆT NAM'
);

-- Enable RLS for site_info
ALTER TABLE public.site_info ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read site_info" ON public.site_info;
DROP POLICY IF EXISTS "Allow admin update site_info" ON public.site_info;
DROP POLICY IF EXISTS "Allow admin insert site_info" ON public.site_info;
DROP POLICY IF EXISTS "Allow admin delete site_info" ON public.site_info;

-- Policies for site_info:
-- 1. Public can read site info
CREATE POLICY "Allow public read site_info" ON public.site_info
    FOR SELECT USING (true);

-- 2. Authenticated admin can insert
CREATE POLICY "Allow admin insert site_info" ON public.site_info
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Authenticated admin can update
CREATE POLICY "Allow admin update site_info" ON public.site_info
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Insert initial sample row if table is empty
INSERT INTO public.site_info (name, avatar_url, project_link)
SELECT 'ANH TUẤN', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564', 'https://tradiemlms.click/'
WHERE NOT EXISTS (SELECT 1 FROM public.site_info);


-- ------------------------------------------------------------
-- 2. Create visitor_logs table
-- ------------------------------------------------------------
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS visitor_logs_session_id_idx ON public.visitor_logs(session_id);
CREATE INDEX IF NOT EXISTS visitor_logs_last_active_at_idx ON public.visitor_logs(last_active_at);

-- Enable RLS for visitor_logs
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public insert visitor_logs" ON public.visitor_logs;
DROP POLICY IF EXISTS "Allow public update visitor_logs" ON public.visitor_logs;
DROP POLICY IF EXISTS "Allow admin select visitor_logs" ON public.visitor_logs;
DROP POLICY IF EXISTS "Allow admin delete visitor_logs" ON public.visitor_logs;

-- Policies for visitor_logs:
-- 1. Anyone (public) can insert new log entries when visiting
CREATE POLICY "Allow public insert visitor_logs" ON public.visitor_logs
    FOR INSERT WITH CHECK (true);

-- 2. Anyone (public) can update the last_active_at column for heartbeats
CREATE POLICY "Allow public update visitor_logs" ON public.visitor_logs
    FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Only logged in Admin (authenticated) can select visitor logs
CREATE POLICY "Allow admin select visitor_logs" ON public.visitor_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Only logged in Admin (authenticated) can delete visitor logs (e.g. clear logs)
CREATE POLICY "Allow admin delete visitor_logs" ON public.visitor_logs
    FOR DELETE USING (auth.role() = 'authenticated');


-- ------------------------------------------------------------
-- 3. Create helper function (RPC) to retrieve visitor stats
-- ------------------------------------------------------------
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
