-- migration_004.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY THIS EXISTS
-- ─────────────────────────────────────────────────────────────────────────────
-- Broadr is a single-operator marketing ops app with NO auth system. The app
-- talks to Supabase using the public anon key, so every request arrives as the
-- `anon` Postgres role — never `authenticated`.
--
-- migration_001.sql only granted policies to the `authenticated` role, which
-- meant every INSERT/UPDATE/DELETE from the app failed with:
--     "new row violates row-level security policy"
--
-- This migration mirrors those permissive policies onto the `anon` role on all
-- 4 tables. Because there is exactly one operator (the agency owner), `anon`
-- effectively IS the user — granting full CRUD to anon is the intended model.
--
-- If/when real auth is added, drop these anon policies and route through
-- `authenticated` instead.
--
-- Idempotent: safe to re-run — each CREATE POLICY is preceded by DROP IF EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── CLIENTS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can read clients"   ON clients;
DROP POLICY IF EXISTS "Anon can insert clients" ON clients;
DROP POLICY IF EXISTS "Anon can update clients" ON clients;
DROP POLICY IF EXISTS "Anon can delete clients" ON clients;

CREATE POLICY "Anon can read clients"   ON clients FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert clients" ON clients FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update clients" ON clients FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete clients" ON clients FOR DELETE TO anon USING (true);

-- ─── CAMPAIGNS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can read campaigns"   ON campaigns;
DROP POLICY IF EXISTS "Anon can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Anon can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Anon can delete campaigns" ON campaigns;

CREATE POLICY "Anon can read campaigns"   ON campaigns FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert campaigns" ON campaigns FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update campaigns" ON campaigns FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete campaigns" ON campaigns FOR DELETE TO anon USING (true);

-- ─── CAMPAIGN PERFORMANCE ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can read performance"   ON campaign_performance;
DROP POLICY IF EXISTS "Anon can insert performance" ON campaign_performance;
DROP POLICY IF EXISTS "Anon can update performance" ON campaign_performance;
DROP POLICY IF EXISTS "Anon can delete performance" ON campaign_performance;

CREATE POLICY "Anon can read performance"   ON campaign_performance FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert performance" ON campaign_performance FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update performance" ON campaign_performance FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete performance" ON campaign_performance FOR DELETE TO anon USING (true);

-- ─── CREATIVE ASSETS ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can read assets"   ON creative_assets;
DROP POLICY IF EXISTS "Anon can insert assets" ON creative_assets;
DROP POLICY IF EXISTS "Anon can update assets" ON creative_assets;
DROP POLICY IF EXISTS "Anon can delete assets" ON creative_assets;

CREATE POLICY "Anon can read assets"   ON creative_assets FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert assets" ON creative_assets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update assets" ON creative_assets FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete assets" ON creative_assets FOR DELETE TO anon USING (true);
