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
