-- FoundriOS Migration 011: Admin, Tier Gating, Onboarding

-- Superadmin flag
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS is_superadmin boolean DEFAULT false;

-- Feature flags per tenant
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  tier_required text NOT NULL DEFAULT 'free' CHECK (tier_required IN ('free', 'pro', 'scale')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, feature)
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feature_flags_tenant" ON feature_flags FOR ALL USING (tenant_id = get_user_tenant_id());

-- Plan tracking op tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'scale'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_started_at timestamptz;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

-- Onboarding progress
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_dismissed boolean DEFAULT false;

-- Cron execution log
CREATE TABLE IF NOT EXISTS cron_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'running')),
  details jsonb DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant ON feature_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cron_log_job ON cron_log(job_name, started_at DESC);
