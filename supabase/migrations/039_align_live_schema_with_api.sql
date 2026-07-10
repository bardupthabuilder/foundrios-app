-- FoundriOS — Migratie 039
-- De live database gelijktrekken met wat de API daadwerkelijk schrijft en leest.
--
-- ACHTERGROND
-- Inspectie van de live database liet zien dat `work_orders` de kolommen `title`,
-- `description`, `date` en `client_id` mist. De werkbon-API schrijft die alle vier,
-- en de lijst sorteert op `date`. De werkbonnen-module kon daar dus nooit werken.
--
-- Belangrijker nog: PostgREST kan `select('*, clients(...)')` alleen oplossen als er
-- een FOREIGN KEY ligt tussen de tabellen. Een kale uuid-kolom is niet genoeg.
-- Migratie 022b voegde wel kolommen toe, maar geen foreign keys. Deze migratie doet
-- beide, en is idempotent: bestaat een kolom of key al, dan gebeurt er niets.

-- ============================================================
-- HULPFUNCTIE: foreign key toevoegen als hij nog niet bestaat
-- ============================================================
CREATE OR REPLACE FUNCTION fos_add_fk(
  p_table text, p_column text, p_ref_table text, p_on_delete text DEFAULT 'SET NULL'
) RETURNS void AS $fk$
DECLARE
  v_name text := format('%s_%s_fkey', p_table, p_column);
BEGIN
  -- Alleen als beide tabellen en de kolom bestaan, en er nog geen FK op ligt.
  IF to_regclass('public.' || p_table) IS NULL
     OR to_regclass('public.' || p_ref_table) IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_column
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = ('public.' || p_table)::regclass
      AND c.contype = 'f'
      AND a.attname = p_column
  ) THEN
    RETURN;
  END IF;

  EXECUTE format(
    'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(id) ON DELETE %s',
    p_table, v_name, p_column, p_ref_table, p_on_delete
  );
EXCEPTION
  -- Bestaande rijen kunnen naar een verwijderd record wijzen. Dan liever een
  -- waarschuwing dan de hele migratie laten terugdraaien.
  WHEN foreign_key_violation THEN
    RAISE WARNING 'FK %.% -> % overgeslagen: er staan rijen met een ongeldige verwijzing.', p_table, p_column, p_ref_table;
  WHEN duplicate_object THEN
    NULL;
END;
$fk$ LANGUAGE plpgsql;

-- ============================================================
-- WORK ORDERS — ontbrekende kolommen
-- ============================================================
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS client_id   uuid;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS title       text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS date        date DEFAULT CURRENT_DATE;

-- Bestaande werkbonnen hebben nog geen titel of datum. Zonder datum verdwijnen ze
-- uit de lijst, want die sorteert erop.
UPDATE work_orders
   SET date = created_at::date
 WHERE date IS NULL;

UPDATE work_orders
   SET title = COALESCE(work_order_number, 'Werkbon')
 WHERE title IS NULL OR title = '';

-- ============================================================
-- REGELTABELLEN — kolommen die de API schrijft
-- ============================================================
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS quote_id         uuid;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS description      text;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS quantity         numeric(10,2) DEFAULT 1;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS unit             text DEFAULT 'stuk';
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS unit_price_cents integer DEFAULT 0;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS total_cents      integer DEFAULT 0;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS sort_order       integer DEFAULT 0;

ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS invoice_id       uuid;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS description      text;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS quantity         numeric(10,2) DEFAULT 1;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit             text DEFAULT 'stuk';
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit_price_cents integer DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS total_cents      integer DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS sort_order       integer DEFAULT 0;

ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS work_order_id     uuid;
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS employee_id       uuid;
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS employee_name     text;
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS hours             numeric(6,2);
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS hourly_rate_cents integer DEFAULT 0;
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS total_cents       integer DEFAULT 0;
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS description       text;
ALTER TABLE work_order_hours ADD COLUMN IF NOT EXISTS sort_order        integer DEFAULT 0;

ALTER TABLE work_order_materials ADD COLUMN IF NOT EXISTS work_order_id    uuid;
ALTER TABLE work_order_materials ADD COLUMN IF NOT EXISTS description     text;
ALTER TABLE work_order_materials ADD COLUMN IF NOT EXISTS quantity        numeric(10,2) DEFAULT 1;
ALTER TABLE work_order_materials ADD COLUMN IF NOT EXISTS unit            text DEFAULT 'stuk';
ALTER TABLE work_order_materials ADD COLUMN IF NOT EXISTS unit_price_cents integer DEFAULT 0;
ALTER TABLE work_order_materials ADD COLUMN IF NOT EXISTS total_cents     integer DEFAULT 0;
ALTER TABLE work_order_materials ADD COLUMN IF NOT EXISTS sort_order      integer DEFAULT 0;

-- ============================================================
-- FOREIGN KEYS
-- Zonder deze kan PostgREST `clients(...)` en `projects(...)` niet embedden en
-- geeft de API "Could not find a relationship between X and Y".
-- ============================================================
SELECT fos_add_fk('quotes',      'tenant_id',  'tenants',  'CASCADE');
SELECT fos_add_fk('quotes',      'client_id',  'clients');
SELECT fos_add_fk('quotes',      'project_id', 'projects');

SELECT fos_add_fk('invoices',    'tenant_id',  'tenants',  'CASCADE');
SELECT fos_add_fk('invoices',    'client_id',  'clients');
SELECT fos_add_fk('invoices',    'project_id', 'projects');
SELECT fos_add_fk('invoices',    'quote_id',   'quotes');

SELECT fos_add_fk('work_orders', 'tenant_id',  'tenants',  'CASCADE');
SELECT fos_add_fk('work_orders', 'client_id',  'clients');
SELECT fos_add_fk('work_orders', 'project_id', 'projects', 'CASCADE');

SELECT fos_add_fk('quote_items',          'quote_id',      'quotes',      'CASCADE');
SELECT fos_add_fk('invoice_items',        'invoice_id',    'invoices',    'CASCADE');
SELECT fos_add_fk('work_order_hours',     'work_order_id', 'work_orders', 'CASCADE');
SELECT fos_add_fk('work_order_hours',     'employee_id',   'employees');
SELECT fos_add_fk('work_order_materials', 'work_order_id', 'work_orders', 'CASCADE');

SELECT fos_add_fk('project_tasks', 'tenant_id',  'tenants',  'CASCADE');
SELECT fos_add_fk('project_tasks', 'project_id', 'projects', 'CASCADE');

SELECT fos_add_fk('campaigns', 'tenant_id',  'tenants',  'CASCADE');
SELECT fos_add_fk('campaigns', 'project_id', 'projects');

SELECT fos_add_fk('maintenance_contracts', 'tenant_id',  'tenants',  'CASCADE');
SELECT fos_add_fk('maintenance_contracts', 'client_id',  'clients');
SELECT fos_add_fk('maintenance_contracts', 'project_id', 'projects');

-- ============================================================
-- INDEXEN die 022b niet kon zetten omdat de kolom nog ontbrak
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_work_orders_client ON work_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_date   ON work_orders(date);

DROP FUNCTION IF EXISTS fos_add_fk(text, text, text, text);
