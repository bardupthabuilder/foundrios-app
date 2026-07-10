-- FoundriOS — Migratie 022b
-- Kernbedrijfstabellen: offertes, facturen, werkbonnen, onderhoud, projecttaken.
--
-- ACHTERGROND
-- Deze tabellen bestonden wel in de live database (aangemaakt buiten de migratie-
-- historie om) maar hadden nergens een CREATE TABLE. Daardoor faalden migraties
-- 023/024/025 op een verse database: die doen ALTER TABLE quotes/invoices op
-- tabellen die nog niet bestonden. Een nieuwe omgeving was dus niet op te zetten.
--
-- Deze migratie sluit dat gat en draait vóór 023 (lexicografisch: 022_ < 022b < 023).
-- Alles is idempotent (IF NOT EXISTS), dus bestaande databases blijven ongemoeid.
--
-- Kolommen die 023 en 024 later toevoegen (quotes.sign_token, quotes.advance_pct,
-- invoices.invoice_type, ...) staan hier bewust NIET in — die blijven van 023/024.

-- ============================================================
-- ONTBREKENDE KOLOMMEN OP BESTAANDE TABELLEN
-- De API's schrijven deze, maar migratie 003 kende ze niet.
-- ============================================================
ALTER TABLE clients   ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS full_name    text;

-- Backfill zodat bestaande rijen niet leeg renderen in de UI.
UPDATE clients   SET company_name = name WHERE company_name IS NULL;
UPDATE employees SET full_name    = name WHERE full_name    IS NULL;

-- ============================================================
-- QUOTES (offertes)
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  quote_number text,
  title text NOT NULL,
  description text,
  amount_excl_vat integer NOT NULL DEFAULT 0,
  amount_incl_vat integer NOT NULL DEFAULT 0,
  vat_pct numeric(5,2) NOT NULL DEFAULT 21,
  status text NOT NULL DEFAULT 'concept'
    CHECK (status IN ('concept', 'verstuurd', 'akkoord', 'afgewezen', 'verlopen')),
  valid_until date,
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'stuk',
  unit_price_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INVOICES (facturen)
-- 'cancelled' hoort in de CHECK: app/api/invoices/[id]/route.ts accepteert het.
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  invoice_number text,
  title text,
  client_name text,
  amount_excl_vat integer NOT NULL DEFAULT 0,
  amount_incl_vat integer,
  vat_pct numeric(5,2) NOT NULL DEFAULT 21,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date date DEFAULT CURRENT_DATE,
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'stuk',
  unit_price_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- WORK ORDERS (werkbonnen)
-- ============================================================
CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  work_order_number text,
  title text NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'concept'
    CHECK (status IN ('concept', 'actief', 'afgerond', 'gefactureerd')),
  signed_at timestamptz,
  signed_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_order_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  employee_name text,
  hours numeric(6,2) NOT NULL,
  hourly_rate_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_order_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'stuk',
  unit_price_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- maintenance_contracts staat in 008b (moet vóór 009 bestaan, die er kolommen aan toevoegt).

-- ============================================================
-- CAMPAIGNS (buurtacties, seizoensacties, upsell)
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  campaign_type text NOT NULL DEFAULT 'custom'
    CHECK (campaign_type IN ('burenactie', 'seizoensactie', 'upsell', 'referral', 'custom')),
  area text,
  discount_pct integer NOT NULL DEFAULT 0,
  valid_until date,
  message_template text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  leads_generated integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PROJECT TASKS (taken/checklist per project)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- KOLOM-AANVULLING OP AL BESTAANDE TABELLEN
--
-- Bestaat een tabel hierboven al (buiten de migratiehistorie om aangemaakt), dan
-- sloeg zijn CREATE TABLE IF NOT EXISTS zichzelf over. Mist die tabel dan een
-- kolom, dan klapt verderop de index of de RLS-policy erop. Deze ALTERs vullen
-- precies de kolommen aan waar indexen en policies van afhangen, plus de kolommen
-- die de API schrijft. Op een verse database is dit allemaal een no-op.
-- ============================================================
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tenant_id       uuid;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_id       uuid;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS project_id      uuid;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_number    text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS amount_excl_vat integer DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS amount_incl_vat integer DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS vat_pct         numeric(5,2) DEFAULT 21;

ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS quote_id    uuid;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS total_cents integer DEFAULT 0;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS sort_order  integer DEFAULT 0;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id       uuid;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id       uuid;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_id      uuid;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS quote_id        uuid;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number  text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_name     text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_excl_vat integer DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_incl_vat integer;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_pct         numeric(5,2) DEFAULT 21;

ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS invoice_id  uuid;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS total_cents integer DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS sort_order  integer DEFAULT 0;

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS tenant_id         uuid;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS client_id         uuid;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS project_id        uuid;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS work_order_number text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS signed_at         timestamptz;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS signed_by         text;

ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS work_order_id     uuid;
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS employee_id       uuid;
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS employee_name     text;
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS hourly_rate_cents integer DEFAULT 0;
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS total_cents       integer DEFAULT 0;
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS description       text;
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS sort_order        integer DEFAULT 0;

ALTER TABLE work_order_materials ADD COLUMN IF NOT EXISTS work_order_id    uuid;
ALTER TABLE work_order_materials ADD COLUMN IF NOT EXISTS unit             text DEFAULT 'stuk';
ALTER TABLE work_order_materials ADD COLUMN IF NOT EXISTS unit_price_cents integer DEFAULT 0;
ALTER TABLE work_order_materials ADD COLUMN IF NOT EXISTS total_cents      integer DEFAULT 0;
ALTER TABLE work_order_materials ADD COLUMN IF NOT EXISTS sort_order       integer DEFAULT 0;

ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS tenant_id  uuid;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS done       boolean DEFAULT false;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- De updated_at-trigger hieronder schrijft naar deze kolom. Ontbreekt hij, dan
-- faalt niet de migratie maar elke latere UPDATE op die tabel.
ALTER TABLE quotes      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE invoices    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE campaigns   ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- TRIGGERS (updated_at)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'quotes_updated_at') THEN
    CREATE TRIGGER quotes_updated_at BEFORE UPDATE ON quotes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'invoices_updated_at') THEN
    CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'work_orders_updated_at') THEN
    CREATE TRIGGER work_orders_updated_at BEFORE UPDATE ON work_orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'campaigns_updated_at') THEN
    CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON campaigns
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ============================================================
-- INDEXEN
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_quotes_tenant            ON quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client            ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_project           ON quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote        ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant          ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client          ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project         ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice    ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant       ON work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_project      ON work_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_wo_hours_wo              ON work_order_hours(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_materials_wo          ON work_order_materials(work_order_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project    ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant         ON campaigns(tenant_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Tabellen met tenant_id: directe check.
-- Kindtabellen zonder tenant_id: check via de parent.
-- Zonder deze policies kon elke ingelogde gebruiker regels van een andere
-- tenant lezen of verwijderen op basis van alleen een UUID.
-- ============================================================
ALTER TABLE quotes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_hours     ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns            ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON quotes;
CREATE POLICY tenant_isolation ON quotes
  FOR ALL USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON invoices;
CREATE POLICY tenant_isolation ON invoices
  FOR ALL USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON work_orders;
CREATE POLICY tenant_isolation ON work_orders
  FOR ALL USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON project_tasks;
CREATE POLICY tenant_isolation ON project_tasks
  FOR ALL USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON campaigns;
CREATE POLICY tenant_isolation ON campaigns
  FOR ALL USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON quote_items;
CREATE POLICY tenant_isolation ON quote_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_items.quote_id AND q.tenant_id = get_user_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_items.quote_id AND q.tenant_id = get_user_tenant_id()
  ));

DROP POLICY IF EXISTS tenant_isolation ON invoice_items;
CREATE POLICY tenant_isolation ON invoice_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id AND i.tenant_id = get_user_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id AND i.tenant_id = get_user_tenant_id()
  ));

DROP POLICY IF EXISTS tenant_isolation ON work_order_hours;
CREATE POLICY tenant_isolation ON work_order_hours
  FOR ALL USING (EXISTS (
    SELECT 1 FROM work_orders w
    WHERE w.id = work_order_hours.work_order_id AND w.tenant_id = get_user_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM work_orders w
    WHERE w.id = work_order_hours.work_order_id AND w.tenant_id = get_user_tenant_id()
  ));

DROP POLICY IF EXISTS tenant_isolation ON work_order_materials;
CREATE POLICY tenant_isolation ON work_order_materials
  FOR ALL USING (EXISTS (
    SELECT 1 FROM work_orders w
    WHERE w.id = work_order_materials.work_order_id AND w.tenant_id = get_user_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM work_orders w
    WHERE w.id = work_order_materials.work_order_id AND w.tenant_id = get_user_tenant_id()
  ));

-- ============================================================
-- UNIEKE NUMMERS PER TENANT
-- De API leidt offerte-/factuurnummers af uit een live COUNT(*). Bij twee
-- gelijktijdige aanmaakacties levert dat hetzelfde nummer op. Deze constraints
-- maken die botsing zichtbaar (unique violation) in plaats van stil.
--
-- Op een bestaande database kunnen al duplicaten staan. De migratie mag daar
-- niet op klappen: dan blijft de index achterwege en logt Postgres een warning.
-- Ruim de duplicaten op en draai deze migratie opnieuw om hem alsnog te zetten.
-- ============================================================
DO $$
BEGIN
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_number_per_tenant
      ON quotes(tenant_id, quote_number) WHERE quote_number IS NOT NULL;
  EXCEPTION WHEN unique_violation THEN
    RAISE WARNING 'quotes: dubbele quote_number per tenant — unieke index overgeslagen';
  END;
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number_per_tenant
      ON invoices(tenant_id, invoice_number) WHERE invoice_number IS NOT NULL;
  EXCEPTION WHEN unique_violation THEN
    RAISE WARNING 'invoices: dubbele invoice_number per tenant — unieke index overgeslagen';
  END;
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_work_orders_number_per_tenant
      ON work_orders(tenant_id, work_order_number) WHERE work_order_number IS NOT NULL;
  EXCEPTION WHEN unique_violation THEN
    RAISE WARNING 'work_orders: dubbele work_order_number per tenant — unieke index overgeslagen';
  END;
END $$;

COMMENT ON TABLE quotes IS 'Offertes — kern van de money-flow: aanvraag → offerte → klus → factuur';
COMMENT ON TABLE work_orders IS 'Werkbonnen — bewijs van uitgevoerd werk, basis voor facturatie';
