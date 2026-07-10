-- ============================================================
-- 017_tenant_agents — Foundri Workforce Agent Activation
-- ============================================================

CREATE TABLE IF NOT EXISTS fw_tenant_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fw_tenants(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES fw_agents_catalog(id) ON DELETE RESTRICT,
  active boolean NOT NULL DEFAULT false,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_fw_tenant_agents_tenant ON fw_tenant_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fw_tenant_agents_agent ON fw_tenant_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_fw_tenant_agents_active ON fw_tenant_agents(tenant_id, active);

-- ============================================================
-- Updated_at trigger
-- ============================================================

DO $$ BEGIN
  CREATE TRIGGER fw_tenant_agents_updated BEFORE UPDATE ON fw_tenant_agents
    FOR EACH ROW EXECUTE FUNCTION fw_update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE fw_tenant_agents ENABLE ROW LEVEL SECURITY;

-- SELECT: user can see agents activated for their tenant
CREATE POLICY fw_tenant_agents_select ON fw_tenant_agents
  FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

-- INSERT: user can activate agents for their tenant
CREATE POLICY fw_tenant_agents_insert ON fw_tenant_agents
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

-- UPDATE: user can update agent activation status for their tenant
CREATE POLICY fw_tenant_agents_update ON fw_tenant_agents
  FOR UPDATE TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

-- DELETE: user can deactivate agents for their tenant
CREATE POLICY fw_tenant_agents_delete ON fw_tenant_agents
  FOR DELETE TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

-- ============================================================
-- Changelog
-- ============================================================

-- 2026-04-25: Initial creation — fw_tenant_agents tracking + RLS isolation
