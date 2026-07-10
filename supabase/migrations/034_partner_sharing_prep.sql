-- Migration 034: Partner & Lead Sharing — SCHEMA ONLY
-- Voorbereiding voor Groeneveld Tuinen platform-case: leads verdelen naar betrouwbare partner-tenants.
-- Geen UI in MVP. Tabellen staan klaar zodat latere bouw geen migratie meer hoeft.

CREATE TABLE IF NOT EXISTS partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  services text[] NOT NULL DEFAULT '{}',           -- ['onderhoud','aanleg','renovatie','reinigen']
  regions text[] NOT NULL DEFAULT '{}',            -- ['Brabant','Limburg','Gelderland']
  min_project_value_eur integer,
  max_project_value_eur integer,
  capacity_status text NOT NULL DEFAULT 'available' CHECK (capacity_status IN ('available', 'full', 'paused')),
  quality_score integer NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_profiles_capacity ON partner_profiles(capacity_status);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_quality ON partner_profiles(quality_score DESC);

ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;

-- Eigen profiel zichtbaar; superadmin ziet alles
CREATE POLICY partner_profiles_select ON partner_profiles
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin());

CREATE POLICY partner_profiles_modify ON partner_profiles
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_superadmin());

-- Lead assignments (lead overgedragen van source_tenant naar target_tenant)
CREATE TABLE IF NOT EXISTS lead_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  target_tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  lead_id uuid,                                    -- optionele FK; intentionally niet enforced (lead kan in source CRM staan)
  regio text,
  lead_type text,
  budget_indication_eur integer,
  urgency text CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rejected', 'completed', 'cancelled')),
  commission_pct numeric(5,2),                     -- bv. 10.00 voor 10%
  commission_amount_eur numeric(10,2),
  feedback_quality integer CHECK (feedback_quality BETWEEN 1 AND 5),
  feedback_notes text,
  proposed_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_source ON lead_assignments(source_tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_target ON lead_assignments(target_tenant_id, status);

ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;

-- Source & target tenants zien hun eigen records; superadmin alles
CREATE POLICY lead_assignments_select ON lead_assignments
  FOR SELECT TO authenticated
  USING (
    source_tenant_id = get_user_tenant_id()
    OR target_tenant_id = get_user_tenant_id()
    OR is_superadmin()
  );

CREATE POLICY lead_assignments_modify ON lead_assignments
  FOR ALL TO authenticated
  USING (
    source_tenant_id = get_user_tenant_id()
    OR target_tenant_id = get_user_tenant_id()
    OR is_superadmin()
  )
  WITH CHECK (
    source_tenant_id = get_user_tenant_id()
    OR is_superadmin()
  );

COMMENT ON TABLE partner_profiles IS 'PREP — partner-tenants die leads kunnen ontvangen via lead_assignments. Geen UI in MVP.';
COMMENT ON TABLE lead_assignments IS 'PREP — lead overdracht van source-tenant (bv. Groeneveld Tuinen platform) naar target partner-tenant. Geen UI in MVP.';
