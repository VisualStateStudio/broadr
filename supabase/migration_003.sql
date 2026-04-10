-- Migration 003: add meta_campaign_id to campaigns
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS meta_campaign_id text UNIQUE;
