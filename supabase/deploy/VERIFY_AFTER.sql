-- FoundriOS — Verificatie
--
-- Draai dit in Supabase → SQL Editor. Verandert niets.
-- Eén enkele query, zodat de editor ALLE uitkomsten in één tabel toont.
--
-- Sorteert de problemen bovenaan. Zie je alleen 'OK'-regels, dan staat alles goed.

WITH kolom_check AS (
  SELECT
    'kolom' AS soort,
    t.tabel || '.' || t.kolom AS wat,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = t.tabel AND c.column_name = t.kolom
    ) THEN 'OK' ELSE 'ONTBREEKT' END AS status
  FROM (VALUES
    ('work_orders','title'), ('work_orders','description'),
    ('work_orders','date'),  ('work_orders','client_id'),
    ('work_orders','signature_data'),
    ('quote_items','quote_id'),           ('quote_items','total_cents'),
    ('invoice_items','invoice_id'),       ('invoice_items','total_cents'),
    ('work_order_hours','work_order_id'), ('work_order_hours','hours'),
    ('work_order_materials','work_order_id'),
    ('leads','next_action'),  ('leads','next_action_at'),
    ('quotes','follow_up_at'),
    ('maintenance_contracts','next_visit'), ('maintenance_contracts','last_visit'),
    ('clients','company_name'), ('employees','full_name'), ('employees','hourly_cost_cents')
  ) AS t(tabel, kolom)
),
fk_check AS (
  SELECT
    'foreign key' AS soort,
    f.tabel || '.' || f.kolom AS wat,
    CASE
      WHEN to_regclass('public.' || f.tabel) IS NULL THEN 'TABEL ONTBREEKT'
      WHEN EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
        WHERE c.conrelid = ('public.' || f.tabel)::regclass
          AND c.contype = 'f' AND a.attname = f.kolom
      ) THEN 'OK' ELSE 'GEEN FOREIGN KEY' END AS status
  FROM (VALUES
    ('work_orders','client_id'), ('work_orders','project_id'),
    ('quotes','client_id'),      ('quotes','project_id'),
    ('invoices','client_id'),    ('invoices','project_id'),
    ('quote_items','quote_id'),  ('invoice_items','invoice_id'),
    ('work_order_hours','work_order_id'), ('work_order_materials','work_order_id')
  ) AS f(tabel, kolom)
),
tabel_check AS (
  SELECT
    'tabel' AS soort,
    t.naam AS wat,
    CASE WHEN to_regclass('public.' || t.naam) IS NULL THEN 'ONTBREEKT' ELSE 'OK' END AS status
  FROM (VALUES
    ('quotes'), ('quote_items'), ('invoices'), ('invoice_items'),
    ('work_orders'), ('work_order_hours'), ('work_order_materials'), ('work_order_photos'),
    ('maintenance_contracts'), ('campaigns'), ('project_tasks'),
    ('automation_rules'), ('automation_log'), ('notifications')
  ) AS t(naam)
),
functie_check AS (
  SELECT
    'functie' AS soort,
    f.naam AS wat,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = f.naam AND n.nspname = 'public'
    ) THEN 'OK' ELSE 'ONTBREEKT' END AS status
  FROM (VALUES ('get_user_tenant_id'), ('update_updated_at')) AS f(naam)
),
data_check AS (
  SELECT 'data' AS soort, 'werkbonnen zonder datum' AS wat,
         CASE WHEN count(*) = 0 THEN 'OK' ELSE count(*)::text || ' RIJEN' END AS status
  FROM work_orders w WHERE w.date IS NULL
  UNION ALL
  SELECT 'data', 'werkbonnen zonder titel',
         CASE WHEN count(*) = 0 THEN 'OK' ELSE count(*)::text || ' RIJEN' END
  FROM work_orders w WHERE w.title IS NULL OR w.title = ''
)
-- Het aantal gratis automatiseringsregels staat bewust NIET in deze query:
-- Postgres controleert tabelnamen bij het parsen, dus een verwijzing naar
-- automation_rules laat de hele query klappen als die tabel niet bestaat.
-- De regel 'tabel | automation_rules' hieronder vertelt of hij er is.
SELECT soort, wat, status
FROM (
  SELECT * FROM tabel_check
  UNION ALL SELECT * FROM functie_check
  UNION ALL SELECT * FROM kolom_check
  UNION ALL SELECT * FROM fk_check
  UNION ALL SELECT * FROM data_check
) alles
-- Problemen bovenaan.
ORDER BY (status = 'OK'), soort, wat;
