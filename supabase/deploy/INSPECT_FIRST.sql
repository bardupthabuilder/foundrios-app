-- FoundriOS — Inspectie
--
-- Draai dit in Supabase → SQL Editor vóór het deploy-script.
-- Het verandert niets; het laat alleen zien hoe je database er nu uitziet.
--
-- De live database is deels buiten de migratiehistorie om gebouwd, dus tabellen
-- kunnen bestaan met andere kolommen dan de migraties verwachten. Dat is precies
-- wat de fout "column next_visit does not exist" veroorzaakte.

-- 1. Welke kerntabellen bestaan al?
SELECT
  t.name AS tabel,
  CASE WHEN to_regclass('public.' || t.name) IS NULL THEN 'ONTBREEKT' ELSE 'bestaat' END AS status
FROM (VALUES
  ('tenants'), ('tenant_users'), ('leads'), ('clients'), ('employees'), ('projects'),
  ('quotes'), ('quote_items'), ('invoices'), ('invoice_items'),
  ('work_orders'), ('work_order_hours'), ('work_order_materials'),
  ('maintenance_contracts'), ('campaigns'), ('project_tasks'),
  ('automation_rules'), ('automation_log'), ('notifications')
) AS t(name)
ORDER BY 2, 1;

-- 2. Bestaan de hulpfuncties die alle RLS-policies nodig hebben?
SELECT
  f.name AS functie,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = f.name AND n.nspname = 'public'
  ) THEN 'bestaat' ELSE 'ONTBREEKT' END AS status
FROM (VALUES ('get_user_tenant_id'), ('update_updated_at')) AS f(name);

-- 3. Hoe ziet maintenance_contracts er nu echt uit?
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'maintenance_contracts'
ORDER BY ordinal_position;

-- 4. En quotes / invoices / work_orders?
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('quotes', 'invoices', 'work_orders')
ORDER BY table_name, ordinal_position;
