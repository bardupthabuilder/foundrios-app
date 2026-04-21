-- ============================================================
-- Foundri Workforce — Tabellen in gedeeld Supabase project
-- ============================================================

-- Workforce Tenants
CREATE TABLE IF NOT EXISTS fw_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  niche text,
  region text,
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Workforce Tenant Users (koppeling auth.users → fw_tenants)
CREATE TABLE IF NOT EXISTS fw_tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fw_tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Workforce Leads
CREATE TABLE IF NOT EXISTS fw_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fw_tenants(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'qualified', 'conversation', 'booking', 'booked', 'rejected', 'reactivation')),
  qualification text CHECK (qualification IN ('hot', 'warm', 'cold', 'reject')),
  source text,
  raw_data jsonb,
  name text,
  email text,
  phone text,
  company text,
  service text,
  region text,
  budget text,
  urgency text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Workforce Agent Runs
CREATE TABLE IF NOT EXISTS fw_agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fw_tenants(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES fw_leads(id) ON DELETE SET NULL,
  agent_name text NOT NULL,
  agent_version text NOT NULL DEFAULT 'v1',
  input jsonb NOT NULL DEFAULT '{}',
  output jsonb,
  tools_called jsonb NOT NULL DEFAULT '[]',
  tokens_input integer,
  tokens_output integer,
  model text,
  duration_ms integer,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'error', 'fallback')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Workforce Knowledge Base
CREATE TABLE IF NOT EXISTS fw_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fw_tenants(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('services', 'regions', 'pricing', 'faq', 'company_info')),
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Workforce Conversations
CREATE TABLE IF NOT EXISTS fw_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fw_tenants(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES fw_leads(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'escalated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_fw_tenant_users_user ON fw_tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_fw_tenant_users_tenant ON fw_tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fw_leads_tenant ON fw_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fw_leads_status ON fw_leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fw_leads_created ON fw_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fw_agent_runs_tenant ON fw_agent_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fw_agent_runs_lead ON fw_agent_runs(lead_id);
CREATE INDEX IF NOT EXISTS idx_fw_agent_runs_created ON fw_agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fw_knowledge_tenant_cat ON fw_knowledge(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_fw_conversations_lead ON fw_conversations(lead_id);

-- ============================================================
-- Updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION fw_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER fw_leads_updated BEFORE UPDATE ON fw_leads
    FOR EACH ROW EXECUTE FUNCTION fw_update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER fw_knowledge_updated BEFORE UPDATE ON fw_knowledge
    FOR EACH ROW EXECUTE FUNCTION fw_update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER fw_conversations_updated BEFORE UPDATE ON fw_conversations
    FOR EACH ROW EXECUTE FUNCTION fw_update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE fw_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE fw_tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fw_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE fw_agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fw_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE fw_conversations ENABLE ROW LEVEL SECURITY;

-- Service role bypast RLS. Voor anon/authenticated users:
CREATE POLICY fw_tenant_users_select ON fw_tenant_users
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY fw_tenants_select ON fw_tenants
  FOR SELECT TO authenticated USING (
    id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY fw_leads_select ON fw_leads
  FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY fw_agent_runs_select ON fw_agent_runs
  FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY fw_knowledge_select ON fw_knowledge
  FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY fw_knowledge_insert ON fw_knowledge
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY fw_knowledge_delete ON fw_knowledge
  FOR DELETE TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY fw_conversations_select ON fw_conversations
  FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );
