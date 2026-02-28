-- FoundriOS RLS Policies
-- Migratie 002: Row Level Security voor multi-tenant isolatie

-- ============================================================
-- HELPER FUNCTION: Haal tenant_id op voor ingelogde user
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id
  FROM tenant_users
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- RLS INSCHAKELEN OP ALLE TABELLEN
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TENANTS POLICIES
-- ============================================================

-- Gebruikers kunnen alleen hun eigen tenant zien
CREATE POLICY "tenants_select_own"
  ON tenants FOR SELECT
  USING (id = get_user_tenant_id());

-- Alleen de service role mag tenants aanmaken (via onboarding API)
-- Gebruikers mogen hun eigen tenant updaten (naam bijv.)
CREATE POLICY "tenants_update_own"
  ON tenants FOR UPDATE
  USING (id = get_user_tenant_id());

-- ============================================================
-- TENANT_USERS POLICIES
-- ============================================================

-- Gebruikers zien alleen de tenant_users rijen van hun eigen tenant
CREATE POLICY "tenant_users_select_own"
  ON tenant_users FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- ============================================================
-- LEADS POLICIES
-- ============================================================

CREATE POLICY "leads_select_own_tenant"
  ON leads FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "leads_insert_own_tenant"
  ON leads FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "leads_update_own_tenant"
  ON leads FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "leads_delete_own_tenant"
  ON leads FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================
-- LEAD_MESSAGES POLICIES
-- ============================================================

CREATE POLICY "lead_messages_select_own_tenant"
  ON lead_messages FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "lead_messages_insert_own_tenant"
  ON lead_messages FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ============================================================
-- LEAD_EVENTS POLICIES
-- ============================================================

CREATE POLICY "lead_events_select_own_tenant"
  ON lead_events FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "lead_events_insert_own_tenant"
  ON lead_events FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ============================================================
-- INTEGRATIONS POLICIES
-- ============================================================

CREATE POLICY "integrations_select_own_tenant"
  ON integrations FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "integrations_insert_own_tenant"
  ON integrations FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "integrations_update_own_tenant"
  ON integrations FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "integrations_delete_own_tenant"
  ON integrations FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================
-- TELEMETRY_EVENTS POLICIES
-- ============================================================

CREATE POLICY "telemetry_select_own_tenant"
  ON telemetry_events FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "telemetry_insert_own_tenant"
  ON telemetry_events FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());
