-- FoundriOS Database Schema
-- Migratie 001: Basistabellen

-- Zorg dat UUID extension beschikbaar is
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TENANTS (bedrijven / klanten van FoundriOS)
-- ============================================================
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  subscription_status text NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
  trial_ends_at timestamptz DEFAULT now() + interval '14 days',
  mollie_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TENANT_USERS (koppeling gebruikers aan tenants)
-- ============================================================
CREATE TABLE tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner'
    CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- ============================================================
-- LEADS
-- ============================================================
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  source text NOT NULL
    CHECK (source IN ('whatsapp', 'meta_lead_ads', 'form', 'email', 'manual')),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'hot', 'warm', 'cold', 'won', 'lost')),
  ai_score integer CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_label text CHECK (ai_label IN ('hot', 'warm', 'cold')),
  ai_summary text,
  budget_estimate text,
  urgency text CHECK (urgency IN ('low', 'medium', 'high')),
  intent text,
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Automatisch updated_at bijwerken
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- LEAD_MESSAGES (berichten per lead)
-- ============================================================
CREATE TABLE lead_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'email', 'manual', 'system')),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- LEAD_EVENTS (audit trail)
-- ============================================================
CREATE TABLE lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INTEGRATIONS (per tenant)
-- ============================================================
CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('whatsapp', 'meta_lead_ads', 'google_calendar')),
  config jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, type)
);

-- ============================================================
-- TELEMETRY_EVENTS
-- ============================================================
CREATE TABLE telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  event_name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes voor performance
CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_leads_status ON leads(tenant_id, status);
CREATE INDEX idx_leads_created_at ON leads(tenant_id, created_at DESC);
CREATE INDEX idx_lead_messages_lead_id ON lead_messages(lead_id);
CREATE INDEX idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_telemetry_tenant_id ON telemetry_events(tenant_id, created_at DESC);
