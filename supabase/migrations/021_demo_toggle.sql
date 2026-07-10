-- FoundriOS Migration 021: Demo Toggle
-- Sales-call ready demo modus zonder echte klantdata te exposeren.
-- Strategie: is_demo flag op 5 tabellen + tenant_users.demo_mode_active toggle.
-- RLS: RESTRICTIVE policies bovenop bestaande tenant policies.

-- ============================================================
-- KOLOMMEN: is_demo flag op 5 zichtbare tabellen
-- ============================================================
ALTER TABLE leads               ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE clients             ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE projects            ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE revenue_snapshots   ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE notifications       ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- ============================================================
-- TOGGLE STATE: per-user demo mode flag op tenant_users
-- ============================================================
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS demo_mode_active boolean NOT NULL DEFAULT false;

-- ============================================================
-- HELPER: is_demo_mode_active() voor RLS
-- Returns true als de huidige user demo mode aan heeft staan
-- ============================================================
CREATE OR REPLACE FUNCTION is_demo_mode_active()
RETURNS boolean AS $$
  SELECT COALESCE(demo_mode_active, false)
  FROM tenant_users
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- INDEXES: composite voor snelle filter-queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_tenant_demo             ON leads(tenant_id, is_demo);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_demo           ON clients(tenant_id, is_demo);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_demo          ON projects(tenant_id, is_demo);
CREATE INDEX IF NOT EXISTS idx_revenue_snapshots_tenant_demo ON revenue_snapshots(tenant_id, is_demo);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_demo    ON notifications(tenant_id, is_demo);

-- ============================================================
-- RLS: RESTRICTIVE policies (PG15+, AND-combined met bestaande)
-- ============================================================

-- LEADS
CREATE POLICY "leads_demo_select" ON leads
  AS RESTRICTIVE FOR SELECT
  USING (is_demo = is_demo_mode_active());

CREATE POLICY "leads_demo_block_insert" ON leads
  AS RESTRICTIVE FOR INSERT
  WITH CHECK (is_demo_mode_active() = false);

CREATE POLICY "leads_demo_block_update" ON leads
  AS RESTRICTIVE FOR UPDATE
  USING (is_demo_mode_active() = false);

CREATE POLICY "leads_demo_block_delete" ON leads
  AS RESTRICTIVE FOR DELETE
  USING (is_demo_mode_active() = false);

-- CLIENTS
CREATE POLICY "clients_demo_select" ON clients
  AS RESTRICTIVE FOR SELECT
  USING (is_demo = is_demo_mode_active());

CREATE POLICY "clients_demo_block_insert" ON clients
  AS RESTRICTIVE FOR INSERT
  WITH CHECK (is_demo_mode_active() = false);

CREATE POLICY "clients_demo_block_update" ON clients
  AS RESTRICTIVE FOR UPDATE
  USING (is_demo_mode_active() = false);

CREATE POLICY "clients_demo_block_delete" ON clients
  AS RESTRICTIVE FOR DELETE
  USING (is_demo_mode_active() = false);

-- PROJECTS
CREATE POLICY "projects_demo_select" ON projects
  AS RESTRICTIVE FOR SELECT
  USING (is_demo = is_demo_mode_active());

CREATE POLICY "projects_demo_block_insert" ON projects
  AS RESTRICTIVE FOR INSERT
  WITH CHECK (is_demo_mode_active() = false);

CREATE POLICY "projects_demo_block_update" ON projects
  AS RESTRICTIVE FOR UPDATE
  USING (is_demo_mode_active() = false);

CREATE POLICY "projects_demo_block_delete" ON projects
  AS RESTRICTIVE FOR DELETE
  USING (is_demo_mode_active() = false);

-- REVENUE_SNAPSHOTS
CREATE POLICY "revenue_snapshots_demo_select" ON revenue_snapshots
  AS RESTRICTIVE FOR SELECT
  USING (is_demo = is_demo_mode_active());

CREATE POLICY "revenue_snapshots_demo_block_insert" ON revenue_snapshots
  AS RESTRICTIVE FOR INSERT
  WITH CHECK (is_demo_mode_active() = false);

CREATE POLICY "revenue_snapshots_demo_block_update" ON revenue_snapshots
  AS RESTRICTIVE FOR UPDATE
  USING (is_demo_mode_active() = false);

CREATE POLICY "revenue_snapshots_demo_block_delete" ON revenue_snapshots
  AS RESTRICTIVE FOR DELETE
  USING (is_demo_mode_active() = false);

-- NOTIFICATIONS
CREATE POLICY "notifications_demo_select" ON notifications
  AS RESTRICTIVE FOR SELECT
  USING (is_demo = is_demo_mode_active());

CREATE POLICY "notifications_demo_block_insert" ON notifications
  AS RESTRICTIVE FOR INSERT
  WITH CHECK (is_demo_mode_active() = false);

CREATE POLICY "notifications_demo_block_update" ON notifications
  AS RESTRICTIVE FOR UPDATE
  USING (is_demo_mode_active() = false);

CREATE POLICY "notifications_demo_block_delete" ON notifications
  AS RESTRICTIVE FOR DELETE
  USING (is_demo_mode_active() = false);

-- ============================================================
-- RPC: toggle_demo_mode() — admin-only, flips current user state
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_demo_mode(new_state boolean)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Check admin role
  SELECT role INTO user_role
  FROM tenant_users
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF user_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Demo mode is alleen voor admins beschikbaar';
  END IF;

  UPDATE tenant_users
  SET demo_mode_active = new_state
  WHERE user_id = auth.uid();

  RETURN new_state;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
