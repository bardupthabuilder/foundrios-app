-- FoundriOS Migration 009: Pipeline stages, proces-checklist, onderhoud contracten, retentie

-- Pipeline stage op leads (gescheiden van AI label)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'nieuw'
  CHECK (pipeline_stage IN ('nieuw', 'gekwalificeerd', 'afspraak', 'offerte', 'opvolging', 'gewonnen', 'verloren'));

-- Proces-checklist timestamps op leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualified_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS appointment_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS quote_sent_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS followed_up_at timestamptz;

-- Onderhoud contracten uitbreiden
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS price_per_visit_cents integer;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS contract_start date;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS contract_end date;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS visit_count integer DEFAULT 0;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS mrr_cents integer;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS notes text;

-- Project retentie velden
ALTER TABLE projects ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS review_requested_at timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS review_received boolean DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS upsell_opportunity text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS upsell_status text DEFAULT 'none'
  CHECK (upsell_status IN ('none', 'identified', 'proposed', 'accepted', 'declined'));
