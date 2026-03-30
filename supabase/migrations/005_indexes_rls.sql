-- FoundriOS / Vakbedrijf OS — Migratie 005
-- Indexes en RLS policies voor alle nieuwe tabellen

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_lead ON clients(lead_id);

CREATE INDEX idx_employees_tenant ON employees(tenant_id) WHERE is_active = true;
CREATE INDEX idx_employees_user ON employees(user_id);

CREATE INDEX idx_projects_tenant ON projects(tenant_id, status);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_lead ON projects(lead_id);

CREATE INDEX idx_planning_tenant_date ON planning_entries(tenant_id, planned_date);
CREATE INDEX idx_planning_employee_date ON planning_entries(employee_id, planned_date);
CREATE INDEX idx_planning_project ON planning_entries(project_id);

CREATE INDEX idx_time_entries_tenant_date ON time_entries(tenant_id, entry_date);
CREATE INDEX idx_time_entries_employee_date ON time_entries(employee_id, entry_date);
CREATE INDEX idx_time_entries_project ON time_entries(project_id, entry_date);

CREATE INDEX idx_material_entries_project ON material_entries(project_id, entry_date);
CREATE INDEX idx_material_entries_tenant ON material_entries(tenant_id);

-- ============================================================
-- RLS INSCHAKELEN
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CLIENTS POLICIES
-- ============================================================
CREATE POLICY "clients_select_own_tenant"
  ON clients FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "clients_insert_own_tenant"
  ON clients FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "clients_update_own_tenant"
  ON clients FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "clients_delete_own_tenant"
  ON clients FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================
-- EMPLOYEES POLICIES
-- ============================================================
CREATE POLICY "employees_select_own_tenant"
  ON employees FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "employees_insert_own_tenant"
  ON employees FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "employees_update_own_tenant"
  ON employees FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "employees_delete_own_tenant"
  ON employees FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================
-- PROJECTS POLICIES
-- ============================================================
CREATE POLICY "projects_select_own_tenant"
  ON projects FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "projects_insert_own_tenant"
  ON projects FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "projects_update_own_tenant"
  ON projects FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "projects_delete_own_tenant"
  ON projects FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================
-- PLANNING_ENTRIES POLICIES
-- ============================================================
CREATE POLICY "planning_entries_select_own_tenant"
  ON planning_entries FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "planning_entries_insert_own_tenant"
  ON planning_entries FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "planning_entries_update_own_tenant"
  ON planning_entries FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "planning_entries_delete_own_tenant"
  ON planning_entries FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================
-- TIME_ENTRIES POLICIES
-- ============================================================
CREATE POLICY "time_entries_select_own_tenant"
  ON time_entries FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "time_entries_insert_own_tenant"
  ON time_entries FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "time_entries_update_own_tenant"
  ON time_entries FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "time_entries_delete_own_tenant"
  ON time_entries FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================
-- MATERIAL_ENTRIES POLICIES
-- ============================================================
CREATE POLICY "material_entries_select_own_tenant"
  ON material_entries FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "material_entries_insert_own_tenant"
  ON material_entries FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "material_entries_update_own_tenant"
  ON material_entries FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "material_entries_delete_own_tenant"
  ON material_entries FOR DELETE
  USING (tenant_id = get_user_tenant_id());
