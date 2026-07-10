-- Migration 025: Quote events audit trail
-- Logt elke status-overgang en interactie op een offerte (sent, viewed, signed, expired, rejected)

CREATE TABLE IF NOT EXISTS quote_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('sent', 'viewed', 'signed', 'expired', 'rejected', 'reminded')),
  actor_name text,
  ip text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quote_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY quote_events_tenant_select ON quote_events
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id());

-- Inserts gebeuren via service_role (public sign route + cron). Geen client insert policy.

CREATE INDEX IF NOT EXISTS idx_quote_events_quote ON quote_events(quote_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_events_tenant ON quote_events(tenant_id, created_at DESC);

COMMENT ON TABLE quote_events IS 'Audit trail per offerte: sent / viewed / signed / expired / rejected / reminded';
