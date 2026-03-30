-- FoundriOS / Vakbedrijf OS — Migratie 003
-- Klanten, medewerkers en projecten

-- ============================================================
-- CLIENTS (klanten / opdrachtgevers)
-- ============================================================
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  address text,
  city text,
  notes text,
  lead_id uuid REFERENCES leads(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- EMPLOYEES (medewerkers / monteurs)
-- ============================================================
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  phone text,
  email text,
  role text NOT NULL DEFAULT 'monteur'
    CHECK (role IN ('eigenaar', 'voorman', 'monteur', 'leerling', 'zzp')),
  color text NOT NULL DEFAULT '#6366f1',
  hourly_cost_cents integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PROJECTS (projecten / opdrachten)
-- ============================================================
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  lead_id uuid REFERENCES leads(id),
  name text NOT NULL,
  description text,
  address text,
  city text,
  status text NOT NULL DEFAULT 'gepland'
    CHECK (status IN ('gepland', 'actief', 'pauze', 'opgeleverd', 'gefactureerd', 'gearchiveerd')),
  project_type text DEFAULT 'vakwerk'
    CHECK (project_type IN ('vakwerk', 'onderhoud', 'advies', 'service')),
  start_date date,
  end_date date,
  budget_cents integer,
  hourly_rate_cents integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
