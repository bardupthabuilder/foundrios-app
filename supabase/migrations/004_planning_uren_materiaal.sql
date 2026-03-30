-- FoundriOS / Vakbedrijf OS — Migratie 004
-- Werkplanning, urenregistratie en materiaalverbruik

-- ============================================================
-- PLANNING_ENTRIES (werkplanning — wie werkt waar welke dag)
-- ============================================================
CREATE TABLE planning_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  planned_date date NOT NULL,
  start_time time,
  end_time time,
  planned_hours numeric(4,1) DEFAULT 8,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TIME_ENTRIES (urenregistratie — werkelijk gemaakte uren)
-- ============================================================
CREATE TABLE time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  hours numeric(4,1) NOT NULL CHECK (hours > 0 AND hours <= 24),
  start_time time,
  end_time time,
  description text,
  is_billable boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'ingevoerd'
    CHECK (status IN ('ingevoerd', 'goedgekeurd', 'afgekeurd')),
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- MATERIAL_ENTRIES (materiaalverbruik per project)
-- ============================================================
CREATE TABLE material_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id),
  entry_date date NOT NULL,
  description text NOT NULL,
  quantity numeric(8,2) NOT NULL DEFAULT 1,
  unit text DEFAULT 'stuk',
  unit_price_cents integer,
  total_cents integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
