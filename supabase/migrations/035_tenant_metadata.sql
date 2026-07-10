-- Migration 035: Tenant Metadata & Audit Log
-- Admin-velden voor managed status, platform-case flag (Groeneveld Tuinen), account manager, audit trail.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_managed boolean NOT NULL DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS managed_package text CHECK (managed_package IN ('light', 'core', 'premium'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_platform_case boolean NOT NULL DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS internal_notes text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS account_manager_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_tenants_managed ON tenants(is_managed) WHERE is_managed = true;
CREATE INDEX IF NOT EXISTS idx_tenants_platform_case ON tenants(is_platform_case) WHERE is_platform_case = true;

-- Audit log voor kritieke acties (plan change, managed toggle, growth toggle)
CREATE TABLE IF NOT EXISTS tenant_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id uuid,
  action text NOT NULL,                  -- bv. 'plan_changed', 'managed_enabled', 'request_qualified'
  meta jsonb NOT NULL DEFAULT '{}',      -- bv. { "from": "free", "to": "pro" }
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_audit_log_tenant ON tenant_audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_audit_log_action ON tenant_audit_log(action, created_at DESC);

ALTER TABLE tenant_audit_log ENABLE ROW LEVEL SECURITY;

-- Tenant ziet eigen log; superadmin ziet alles
CREATE POLICY tenant_audit_log_select ON tenant_audit_log
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin());

-- Schrijven alleen via service role / superadmin (geen direct insert door tenant users)
CREATE POLICY tenant_audit_log_insert ON tenant_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (is_superadmin());

COMMENT ON COLUMN tenants.is_managed IS 'TRUE als Groeneveld Media de uitvoering doet (Managed Light/Core/Premium).';
COMMENT ON COLUMN tenants.is_platform_case IS 'TRUE voor speciale tenants zoals Groeneveld Tuinen — eigen leadhub / case study.';
COMMENT ON TABLE tenant_audit_log IS 'Audit trail voor kritieke admin-acties: plan upgrade, managed toggle, request kwalificatie.';
