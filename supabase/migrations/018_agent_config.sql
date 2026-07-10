-- ============================================================
-- 018_agent_config — Foundri Workforce Agent Configuration
-- ============================================================

CREATE TABLE IF NOT EXISTS fw_agent_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fw_tenants(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES fw_agents_catalog(id) ON DELETE RESTRICT,
  niche_override text,
  services_override jsonb,
  tone_override text CHECK (tone_override IN ('formal', 'casual', 'direct', 'friendly')),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_fw_agent_config_tenant ON fw_agent_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fw_agent_config_agent ON fw_agent_config(agent_id);
CREATE INDEX IF NOT EXISTS idx_fw_agent_config_tenant_agent ON fw_agent_config(tenant_id, agent_id);

-- ============================================================
-- Updated_at trigger
-- ============================================================

DO $$ BEGIN
  CREATE TRIGGER fw_agent_config_updated BEFORE UPDATE ON fw_agent_config
    FOR EACH ROW EXECUTE FUNCTION fw_update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE fw_agent_config ENABLE ROW LEVEL SECURITY;

-- SELECT: user can see config for agents of their tenant
CREATE POLICY fw_agent_config_select ON fw_agent_config
  FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

-- INSERT: user can create config for agents of their tenant
CREATE POLICY fw_agent_config_insert ON fw_agent_config
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

-- UPDATE: user can modify config for agents of their tenant
CREATE POLICY fw_agent_config_update ON fw_agent_config
  FOR UPDATE TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

-- DELETE: user can remove config for agents of their tenant
CREATE POLICY fw_agent_config_delete ON fw_agent_config
  FOR DELETE TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

-- ============================================================
-- Changelog
-- ============================================================

-- 2026-04-25: Initial creation — fw_agent_config for niche/services/tone overrides + RLS isolation
