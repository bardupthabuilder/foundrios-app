-- FoundriOS — Migratie 008b
-- Onderhoudscontracten (terugkerende omzet).
--
-- ACHTERGROND
-- 009_pipeline_retention.sql doet `ALTER TABLE maintenance_contracts ADD COLUMN ...`
-- maar geen enkele migratie maakte de tabel aan. Op een verse database faalde 009.
--
-- Deze migratie draait vóór 009 (lexicografisch: 008_ < 008b < 009) en maakt
-- alleen de basiskolommen. De kolommen die 009 toevoegt (contract_start,
-- contract_end, visit_count, mrr_cents, notes, price_per_visit_cents) blijven
-- bewust dáár staan, zodat de historie klopt.
--
-- Idempotent: bestaande databases blijven ongemoeid.

CREATE TABLE IF NOT EXISTS maintenance_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  frequency text NOT NULL DEFAULT 'quarterly'
    CHECK (frequency IN ('monthly', 'quarterly', 'biannual', 'annual')),
  price_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'stopped')),
  next_visit date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bestaat de tabel al (buiten de migratiehistorie om aangemaakt), dan sloeg de
-- CREATE hierboven zichzelf over en kan hij kolommen missen. De index en de
-- policy hieronder klappen dan op een kolom die er niet is. Deze ALTERs vullen
-- aan wat ontbreekt en zijn een no-op op een verse database.
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS tenant_id   uuid;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS client_id   uuid;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS project_id  uuid;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS title       text;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS frequency   text DEFAULT 'quarterly';
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS price_cents integer DEFAULT 0;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS status      text DEFAULT 'active';
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS next_visit  date;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now();
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'maintenance_contracts_updated_at') THEN
    CREATE TRIGGER maintenance_contracts_updated_at BEFORE UPDATE ON maintenance_contracts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_maintenance_tenant     ON maintenance_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_visit ON maintenance_contracts(next_visit);

ALTER TABLE maintenance_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON maintenance_contracts;
CREATE POLICY tenant_isolation ON maintenance_contracts
  FOR ALL USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

COMMENT ON TABLE maintenance_contracts IS 'Terugkerend onderhoud — bron van MRR';
