-- FoundriOS — Migratie 043
-- Onderaannemers/zzp'ers als eigen, generieke entiteit.
--
-- ACHTERGROND
-- Er bestond geen tenant-agnostische onderaannemerstabel. `employees.role = 'zzp'`
-- behandelt een zzp'er identiek aan een medewerker (geen bedrijfsnaam, geen KvK, geen
-- eigen kostenafspraak per klus). Migratie 034 (`partner_profiles`/`lead_assignments`)
-- lost een ander probleem op — leads delen tussen tenants — en is daarvoor niet
-- herbruikbaar.
--
-- LET OP — naamgeving: de tabelnaam `partners` is al in gebruik door een bestaand,
-- Groeneveld-Tuinen-specifiek schema (`partners` + `partner_payments` + `jobs`, bediend
-- via `gt_partner_roster_view`) dat een ander concept modelleert (het pay-per-lead
-- partnernetwerk), niet onderaannemers op een klus. Om elke verwarring en elk
-- kolomconflict met die live tabel te vermijden, heten de nieuwe generieke tabellen
-- hier `subcontractors` / `project_subcontractors`. De bestaande `partners`-tabel en
-- alles wat er live op draait (GtPartnerRoster, gt_partner_roster_view) blijft
-- volledig ongemoeid.
--
-- Deze migratie voegt een echte, generieke onderaannemersroster toe: aanmaken,
-- koppelen aan een project (optioneel een specifiek werkpakket/werkbon), en per
-- koppeling de afgesproken vs. werkelijke kosten bijhouden — de basis voor een
-- deterministische (niet-AI) performance-score per onderaannemer.

-- ============================================================
-- SUBCONTRACTORS
-- ============================================================
CREATE TABLE subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  kvk_number text,
  vat_number text,
  specialization text,
  region text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'inactive')),
  pricing_model text
    CHECK (pricing_model IN ('hourly', 'daily', 'fixed', 'other')),
  default_rate_cents integer,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER subcontractors_updated_at
  BEFORE UPDATE ON subcontractors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PROJECT_SUBCONTRACTORS (koppeling + kostenregistratie per klus)
-- ============================================================
CREATE TABLE project_subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  subcontractor_id uuid NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  -- Optioneel: koppel aan een specifiek werkpakket (werkbon) i.p.v. het hele project.
  work_order_id uuid REFERENCES work_orders(id) ON DELETE SET NULL,
  work_package text,
  agreed_cost_cents integer,
  actual_cost_cents integer,
  paid_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  planned_end_date date,
  completed_at timestamptz,
  -- Wordt serverside gezet bij afronden (completed_at vs. planned_end_date) — geen los
  -- invoerveld dat kan afwijken van de werkelijke datums.
  on_time boolean,
  issue_count integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER project_subcontractors_updated_at
  BEFORE UPDATE ON project_subcontractors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_subcontractors_tenant ON subcontractors(tenant_id) WHERE status != 'inactive';
CREATE INDEX idx_project_subcontractors_tenant ON project_subcontractors(tenant_id);
CREATE INDEX idx_project_subcontractors_project ON project_subcontractors(project_id);
CREATE INDEX idx_project_subcontractors_subcontractor ON project_subcontractors(subcontractor_id);
CREATE INDEX idx_project_subcontractors_work_order ON project_subcontractors(work_order_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_subcontractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subcontractors_select_own_tenant"
  ON subcontractors FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "subcontractors_insert_own_tenant"
  ON subcontractors FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "subcontractors_update_own_tenant"
  ON subcontractors FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "subcontractors_delete_own_tenant"
  ON subcontractors FOR DELETE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "project_subcontractors_select_own_tenant"
  ON project_subcontractors FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "project_subcontractors_insert_own_tenant"
  ON project_subcontractors FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "project_subcontractors_update_own_tenant"
  ON project_subcontractors FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "project_subcontractors_delete_own_tenant"
  ON project_subcontractors FOR DELETE
  USING (tenant_id = get_user_tenant_id());
