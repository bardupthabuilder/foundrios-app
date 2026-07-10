-- Migration 027: SOPs (Standard Operating Procedures) — tenant-editable
-- Aanvulling op shared_sops (read-only agency push). sops = eigenaar zelf bewerkt.

CREATE TABLE IF NOT EXISTS sops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'operations' CHECK (category IN ('operations', 'field_work', 'sales', 'admin')),
  description text,
  steps jsonb NOT NULL DEFAULT '[]',
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  source text NOT NULL DEFAULT 'tenant' CHECK (source IN ('tenant', 'foundri_seed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

CREATE POLICY sops_tenant_all ON sops
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE INDEX IF NOT EXISTS idx_sops_tenant_category ON sops(tenant_id, category, status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_sops_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sops_updated ON sops;
CREATE TRIGGER sops_updated BEFORE UPDATE ON sops
  FOR EACH ROW EXECUTE FUNCTION update_sops_updated_at();

COMMENT ON TABLE sops IS 'Standard Operating Procedures — editable per tenant. Seed van foundri standaards bij onboarding.';
COMMENT ON COLUMN sops.steps IS 'jsonb array: [{ "title": "Stap 1", "description": "...", "checklist": ["x","y"] }, ...]';
COMMENT ON COLUMN sops.source IS 'foundri_seed = uit standaardbibliotheek gekloond. tenant = zelf gemaakt.';
