-- SOPs gedeeld door de leverende agency (bv. Groeneveld Media) met specifieke tenants
-- Geen edit-rechten voor de tenant — read-only handboek-content van de agency

CREATE TABLE IF NOT EXISTS shared_sops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identificatie van de oorspronkelijke SOP (in BardOS)
  source_sop_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'bardos',

  -- Inhoud
  title text NOT NULL,
  description text,
  task_type text,
  steps jsonb NOT NULL DEFAULT '[]',

  -- Metadata
  shared_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, source_sop_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_sops_tenant
  ON shared_sops(tenant_id, shared_at DESC);

ALTER TABLE shared_sops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants kunnen eigen shared_sops lezen"
  ON shared_sops FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE TRIGGER shared_sops_updated_at
  BEFORE UPDATE ON shared_sops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE shared_sops IS 'SOPs gedeeld door de agency (GM) met deze tenant. Read-only voor tenant.';
