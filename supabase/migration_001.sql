-- migration_001.sql
-- Initial schema: clients, campaigns, campaign_performance, creative_assets

-- ─── CLIENTS ──────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  industry     text,
  logo_url     text,
  website      text,
  notes        text,
  is_agency    boolean NOT NULL DEFAULT false,  -- true = this is your own agency
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read clients"  ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients" ON clients FOR UPDATE TO authenticated USING (true);

-- Insert your agency as the first client
INSERT INTO clients (name, industry, is_agency) VALUES ('My Agency', 'Content & Marketing', true);

-- ─── CAMPAIGNS ────────────────────────────────────────────────────────────────
CREATE TABLE campaigns (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name           text NOT NULL,
  platform       text NOT NULL CHECK (platform IN ('meta', 'google', 'both')),
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'draft', 'completed')),
  objective      text,
  daily_budget   numeric(10,2),
  total_budget   numeric(10,2),
  spend_to_date  numeric(10,2) NOT NULL DEFAULT 0,
  start_date     date,
  end_date       date,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read campaigns"   ON campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert campaigns" ON campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update campaigns" ON campaigns FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete campaigns" ON campaigns FOR DELETE TO authenticated USING (true);

-- ─── CAMPAIGN PERFORMANCE ─────────────────────────────────────────────────────
CREATE TABLE campaign_performance (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date          date NOT NULL,
  spend         numeric(10,2) NOT NULL DEFAULT 0,
  impressions   integer NOT NULL DEFAULT 0,
  clicks        integer NOT NULL DEFAULT 0,
  conversions   integer NOT NULL DEFAULT 0,
  revenue       numeric(10,2) NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, date)
);

ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read performance"   ON campaign_performance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert performance" ON campaign_performance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update performance" ON campaign_performance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete performance" ON campaign_performance FOR DELETE TO authenticated USING (true);

-- ─── CREATIVE ASSETS ──────────────────────────────────────────────────────────
CREATE TABLE creative_assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id  uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  name         text NOT NULL,
  type         text NOT NULL CHECK (type IN ('photo', 'video')),
  file_url     text,
  thumbnail_url text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE creative_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read assets"   ON creative_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert assets" ON creative_assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update assets" ON creative_assets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete assets" ON creative_assets FOR DELETE TO authenticated USING (true);
