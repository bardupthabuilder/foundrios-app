-- Migration 029: Templates uitbreiden voor tenant-custom + variabelen + meer types
-- content jsonb shape: { "body": "...", "subject"?: "...", "variables": [{"name","label","default"?}] }

-- Voeg whatsapp/content/reel types toe
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_type_check;
ALTER TABLE templates ADD CONSTRAINT templates_type_check
  CHECK (type IN ('offerte', 'werkbon', 'email', 'whatsapp', 'campagne', 'sop', 'content', 'reel'));

-- Tenant scoping: NULL = system template (zichtbaar voor iedereen), niet-NULL = tenant-specifiek
ALTER TABLE templates ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_templates_tenant ON templates(tenant_id, type, status);
CREATE INDEX IF NOT EXISTS idx_templates_system ON templates(type, status) WHERE tenant_id IS NULL;

-- RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS templates_read ON templates;
CREATE POLICY templates_read ON templates
  FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS templates_write ON templates;
CREATE POLICY templates_write ON templates
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

COMMENT ON COLUMN templates.content IS 'jsonb: { body, subject?, variables: [{name,label,default?}] }';
COMMENT ON COLUMN templates.tenant_id IS 'NULL = system/foundri template (read-only). niet-NULL = custom van tenant.';
