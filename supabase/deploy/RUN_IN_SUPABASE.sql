-- ==========================================================================
-- FoundriOS — Deploy-script
--
-- Plakken in: Supabase -> SQL Editor -> New query -> Run
-- Bevat migraties 006b, 008b, 022b, 037 en 038 in de juiste volgorde.
--
-- Idempotent: opnieuw draaien is veilig. Bestaande tabellen en data blijven staan.
-- De SQL Editor draait dit als een transactie: gaat er iets mis, dan wordt alles
-- teruggedraaid en verandert er niets.
--
-- LET OP: migratie 022b zet Row Level Security aan op quotes, invoices en
-- work_orders. Draai dit eerst op staging.
-- ==========================================================================


-- ##########################################################################
-- ### STAP 0 — Hulpfuncties
-- ###
-- ### Deze twee functies komen uit migratie 001 en 002. De live database is
-- ### deels buiten de migratiehistorie om gebouwd, dus ze ontbreken mogelijk.
-- ### Alle RLS-policies en updated_at-triggers hieronder hebben ze nodig.
-- ### CREATE OR REPLACE: bestaan ze al, dan verandert er niets.
-- ##########################################################################

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

-- Een gebruiker kan bij meerdere bedrijven horen. Zonder ORDER BY mag Postgres
-- willekeurig een rij kiezen, en dan wijkt de beveiliging af van wat de app denkt.
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid AS $fn$
  SELECT tenant_id
  FROM tenant_users
  WHERE user_id = auth.uid()
  ORDER BY is_active DESC NULLS LAST, created_at ASC
  LIMIT 1;
$fn$ LANGUAGE SQL SECURITY DEFINER STABLE;


-- ##########################################################################
-- ### 006b_companies.sql
-- ##########################################################################

-- FoundriOS — Migratie 006b
-- Minimale `companies`-tabel zodat migratie 007 kan draaien.
--
-- ACHTERGROND
-- 007_morning_brief_decisions.sql maakt morning_briefs / decisions /
-- decision_patterns met `company_id uuid REFERENCES companies(id)`, maar geen
-- enkele migratie maakt `companies` aan. Op een verse database faalde 007 dus.
--
-- In de live database bestaat `companies` al (buiten de migratiehistorie om
-- aangemaakt, samen met de rest van het company_id-schema). Daarom is dit
-- CREATE TABLE IF NOT EXISTS: op productie een no-op, op een verse database
-- precies genoeg om de foreign keys van 007 te laten resolven.
--
-- LET OP: FoundriOS draait operationeel op `tenant_id`/`tenants`. Deze tabel is
-- alleen een anker voor de morning-brief-tabellen. Zolang die op company_id
-- staan en de app op tenant_id, blijft dit een losse tak van het schema.

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Onbekend',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE companies IS
  'Legacy company_id-schema. De app gebruikt tenants; deze tabel bestaat om de FKs van migratie 007 te laten resolven.';


-- ##########################################################################
-- ### 008b_maintenance_contracts.sql
-- ##########################################################################

-- FoundriOS — Migratie 008b
-- Onderhoudscontracten (terugkerende omzet).
--
-- ACHTERGROND
-- 009_pipeline_retention.sql doet `ALTER TABLE maintenance_contracts ADD COLUMN ...`
-- maar geen enkele migratie maakte de tabel aan. Op een verse database faalde 009.
--
-- Deze migratie draait vóór 009 (lexicografisch: 008_ < 008b < 009) en maakt
-- alleen de basiskolommen. De kolommen die 009 toevoegt (contract_start,
-- contract_end, visit_count, mrr_cents, notes, price_per_visit_cents) blijven
-- bewust dáár staan, zodat de historie klopt.
--
-- Idempotent: bestaande databases blijven ongemoeid.

CREATE TABLE IF NOT EXISTS maintenance_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  frequency text NOT NULL DEFAULT 'quarterly'
    CHECK (frequency IN ('monthly', 'quarterly', 'biannual', 'annual')),
  price_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'stopped')),
  next_visit date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bestaat de tabel al (buiten de migratiehistorie om aangemaakt), dan sloeg de
-- CREATE hierboven zichzelf over en kan hij kolommen missen. De index en de
-- policy hieronder klappen dan op een kolom die er niet is. Deze ALTERs vullen
-- aan wat ontbreekt en zijn een no-op op een verse database.
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS tenant_id   uuid;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS client_id   uuid;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS project_id  uuid;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS title       text;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS frequency   text DEFAULT 'quarterly';
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS price_cents integer DEFAULT 0;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS status      text DEFAULT 'active';
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS next_visit  date;
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now();
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'maintenance_contracts_updated_at') THEN
    CREATE TRIGGER maintenance_contracts_updated_at BEFORE UPDATE ON maintenance_contracts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_maintenance_tenant     ON maintenance_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_visit ON maintenance_contracts(next_visit);

ALTER TABLE maintenance_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON maintenance_contracts;
CREATE POLICY tenant_isolation ON maintenance_contracts
  FOR ALL USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

COMMENT ON TABLE maintenance_contracts IS 'Terugkerend onderhoud — bron van MRR';


-- ##########################################################################
-- ### 022b_core_business_tables.sql
-- ##########################################################################

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


-- ##########################################################################
-- ### 037_next_action_and_field_proof.sql
-- ##########################################################################

-- FoundriOS — Migratie 037
-- "Elke aanvraag en elke offerte heeft een volgende actie met een datum."
--
-- De kennisbank (031) schrijft dit al voor als harde regel, maar het datamodel
-- kende alleen `followed_up_at` — verleden tijd. Er was geen enkel veld dat een
-- belofte naar de toekomst vastlegt, dus niets kon omvallen zonder dat iemand
-- het zag. Deze migratie voegt die belofte toe, plus het veldbewijs (handtekening
-- en foto's) waarop de werkbon-module leunt.

-- ============================================================
-- VOLGENDE ACTIE
-- ============================================================
ALTER TABLE leads  ADD COLUMN IF NOT EXISTS next_action    text;
ALTER TABLE leads  ADD COLUMN IF NOT EXISTS next_action_at timestamptz;

-- Offertes hebben één impliciete volgende actie: opvolgen vóór ze verlopen.
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS follow_up_at   timestamptz;

-- Alleen open records hoeven een volgende actie te hebben; de index dient de
-- "Vandaag"-query, die filtert op achterstallige acties.
CREATE INDEX IF NOT EXISTS idx_leads_next_action_at
  ON leads(tenant_id, next_action_at)
  WHERE next_action_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_follow_up_at
  ON quotes(tenant_id, follow_up_at)
  WHERE follow_up_at IS NOT NULL;

COMMENT ON COLUMN leads.next_action_at IS 'Wanneer moet er iets gebeuren. Een open aanvraag zonder deze datum is de enige echte fout in het systeem.';
COMMENT ON COLUMN quotes.follow_up_at  IS 'Wanneer deze offerte nagebeld wordt. Verstuurd zonder opvolgdatum = verloren omzet.';

-- ============================================================
-- WERKBON: ECHT BEWIJS VAN GELEVERD WERK
-- signature_data bevat een getekende handtekening als PNG data-URL.
-- signed_by (bestaand) blijft de getypte naam.
-- ============================================================
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS signature_data text;

CREATE TABLE IF NOT EXISTS work_order_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wo_photos_wo ON work_order_photos(work_order_id);

ALTER TABLE work_order_photos ENABLE ROW LEVEL SECURITY;

-- Geen tenant_id op de kindtabel; isolatie loopt via de werkbon.
DROP POLICY IF EXISTS tenant_isolation ON work_order_photos;
CREATE POLICY tenant_isolation ON work_order_photos
  FOR ALL USING (EXISTS (
    SELECT 1 FROM work_orders w
    WHERE w.id = work_order_photos.work_order_id AND w.tenant_id = get_user_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM work_orders w
    WHERE w.id = work_order_photos.work_order_id AND w.tenant_id = get_user_tenant_id()
  ));

-- ============================================================
-- ONDERHOUD: BEZOEK AFGEROND
-- visit_count bestond (009) maar werd nergens opgehoogd; last_visit ontbrak.
-- ============================================================
ALTER TABLE maintenance_contracts ADD COLUMN IF NOT EXISTS last_visit date;

-- ============================================================
-- OPSLAG VOOR WERKBONFOTO'S
-- Privé bucket. Toegang loopt via signed URLs vanuit de server.
--
-- `storage.objects` is in Supabase eigendom van supabase_storage_admin. Afhankelijk
-- van de rol waarmee je dit script draait kun je daar geen policy op zetten. Dat mag
-- de rest van de migratie niet laten terugdraaien: het hele blok vangt daarom een
-- rechtenfout af en waarschuwt alleen. Zet de bucket en policies in dat geval via
-- Dashboard → Storage aan (bucket 'werkbon-fotos', privé).
-- ============================================================
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('werkbon-fotos', 'werkbon-fotos', false)
  ON CONFLICT (id) DO NOTHING;

  -- Het eerste padsegment is de tenant_id, zodat een tenant nooit bij de foto's
  -- van een ander kan. Bijvoorbeeld: <tenant_id>/<work_order_id>/<uuid>.jpg
  DROP POLICY IF EXISTS "werkbon fotos tenant read"   ON storage.objects;
  DROP POLICY IF EXISTS "werkbon fotos tenant write"  ON storage.objects;
  DROP POLICY IF EXISTS "werkbon fotos tenant delete" ON storage.objects;

  CREATE POLICY "werkbon fotos tenant read" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'werkbon-fotos'
      AND (storage.foldername(name))[1] = get_user_tenant_id()::text
    );

  CREATE POLICY "werkbon fotos tenant write" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'werkbon-fotos'
      AND (storage.foldername(name))[1] = get_user_tenant_id()::text
    );

  CREATE POLICY "werkbon fotos tenant delete" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'werkbon-fotos'
      AND (storage.foldername(name))[1] = get_user_tenant_id()::text
    );
EXCEPTION
  WHEN insufficient_privilege OR undefined_table THEN
    RAISE WARNING 'Storage-bucket/policies overgeslagen (geen rechten op storage.objects). Maak de privé bucket ''werkbon-fotos'' handmatig aan via Dashboard → Storage. Werkbonfoto''s werken pas daarna.';
END $$;


-- ##########################################################################
-- ### 038_default_free_automations.sql
-- ##########################################################################

-- FoundriOS — Migratie 038
-- Drie automatiseringen die iedereen gratis krijgt.
--
-- `automation_rules` heeft altijd al een `tier`-kolom gehad, maar er stond nooit
-- één regel in. De Automatisering-module was leeg en de engine voerde niets uit.
--
-- Deze drie regels dekken de drie plekken waar geld weglekt bij een vakbedrijf:
-- een aanvraag die blijft liggen, een offerte die niemand nabelt, en een factuur
-- die niet betaald wordt. Ze staan bewust op tier 'free': dit is precies de reden
-- dat iemand FoundriOS opent op maandagochtend.
--
-- De echte upsell naar Pro is niet "mag ik een melding krijgen", maar
-- "doet het systeem de opvolging zelf" (action_type 'email').
--
-- `automation_rules` en `automation_log` komen uit migratie 010. Bestaan ze niet,
-- dan slaat deze migratie zichzelf over met een waarschuwing in plaats van te
-- klappen — dan draait migratie 010 eerst.

DO $seed$
BEGIN
IF to_regclass('public.automation_rules') IS NULL THEN
  RAISE WARNING 'automation_rules bestaat niet — migratie 038 overgeslagen. Draai eerst 010_automations_revenue_intelligence.sql.';
  RETURN;
END IF;

INSERT INTO automation_rules (tenant_id, name, trigger_type, action_type, config, delay_hours, is_active, tier)
SELECT
  t.id,
  'Aanvraag blijft liggen',
  'lead_stale',
  'notification',
  jsonb_build_object(
    'title', 'Aanvraag wacht op reactie',
    'message', 'Deze aanvraag ligt er al 24 uur. Bel of app de klant.',
    'type', 'warning'
  ),
  24,
  true,
  'free'
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM automation_rules r
  WHERE r.tenant_id = t.id AND r.trigger_type = 'lead_stale'
);

INSERT INTO automation_rules (tenant_id, name, trigger_type, action_type, config, delay_hours, is_active, tier)
SELECT
  t.id,
  'Offerte niet opgevolgd',
  'quote_stale',
  'notification',
  jsonb_build_object(
    'title', 'Offerte wacht op antwoord',
    'message', 'Verstuurd, maar nog geen reactie. Bel de klant na.',
    'type', 'warning'
  ),
  48,
  true,
  'free'
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM automation_rules r
  WHERE r.tenant_id = t.id AND r.trigger_type = 'quote_stale'
);

INSERT INTO automation_rules (tenant_id, name, trigger_type, action_type, config, delay_hours, is_active, tier)
SELECT
  t.id,
  'Factuur te laat',
  'invoice_overdue',
  'notification',
  jsonb_build_object(
    'title', 'Factuur is vervallen',
    'message', 'De vervaldatum is voorbij. Stuur een herinnering.',
    'type', 'urgent'
  ),
  0,
  true,
  'free'
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM automation_rules r
  WHERE r.tenant_id = t.id AND r.trigger_type = 'invoice_overdue'
);

-- Dedup-sleutel van de engine: één keer vuren per regel per doel.
IF to_regclass('public.automation_log') IS NOT NULL THEN
  CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_log_rule_target
    ON automation_log(rule_id, target_id)
    WHERE rule_id IS NOT NULL;
END IF;

END $seed$;
