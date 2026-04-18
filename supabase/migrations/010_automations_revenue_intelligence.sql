-- FoundriOS Migration 010: Automations, Notifications, Revenue Snapshots

-- Automation rules (configurable per tenant)
CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('lead_new', 'lead_stale', 'quote_stale', 'invoice_overdue', 'project_delivered', 'maintenance_due')),
  action_type text NOT NULL CHECK (action_type IN ('notification', 'email', 'status_change', 'task_create')),
  config jsonb NOT NULL DEFAULT '{}',
  delay_hours integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  tier text NOT NULL DEFAULT 'pro' CHECK (tier IN ('free', 'pro', 'scale')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_rules_tenant" ON automation_rules FOR ALL USING (tenant_id = get_user_tenant_id());

-- Automation execution log
CREATE TABLE IF NOT EXISTS automation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES automation_rules(id) ON DELETE SET NULL,
  trigger_type text NOT NULL,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  result text DEFAULT 'success' CHECK (result IN ('success', 'failed', 'skipped')),
  details jsonb DEFAULT '{}',
  executed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE automation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_log_tenant" ON automation_log FOR ALL USING (tenant_id = get_user_tenant_id());

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  message text,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent', 'success')),
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_tenant" ON notifications FOR ALL USING (tenant_id = get_user_tenant_id());

-- Revenue snapshots (daily for intelligence/trends)
CREATE TABLE IF NOT EXISTS revenue_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  revenue_cents bigint DEFAULT 0,
  outstanding_cents bigint DEFAULT 0,
  overdue_cents bigint DEFAULT 0,
  pipeline_cents bigint DEFAULT 0,
  mrr_cents bigint DEFAULT 0,
  lead_count integer DEFAULT 0,
  hot_lead_count integer DEFAULT 0,
  conversion_pct numeric(5,2) DEFAULT 0,
  avg_deal_value_cents bigint DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, snapshot_date)
);

ALTER TABLE revenue_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revenue_snapshots_tenant" ON revenue_snapshots FOR ALL USING (tenant_id = get_user_tenant_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant ON automation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_log_tenant ON automation_log(tenant_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_snapshots_tenant ON revenue_snapshots(tenant_id, snapshot_date DESC);
