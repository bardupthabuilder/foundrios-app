-- FoundriOS — Migratie 040
-- `get_user_tenant_id()` moet hetzelfde bedrijf kiezen als de app.
--
-- ACHTERGROND
-- Een gebruiker kan bij meerdere bedrijven horen; welke actief is staat in
-- `tenant_users.is_active` (gezet door /api/tenants/switch).
--
-- De oude functie deed `... WHERE user_id = auth.uid() LIMIT 1` zonder ORDER BY.
-- Postgres mag dan willekeurig een rij teruggeven. Elke RLS-policy in dit schema
-- leunt op deze functie. Kwam er een ander bedrijf uit dan waar de app in stond,
-- dan zag de gebruiker overal lege lijsten — zonder enige foutmelding.
--
-- Nu kiest hij expliciet de actieve tenant, en valt alleen terug op een andere
-- als er geen enkele actief staat (bijvoorbeeld bij een oud account).

CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id
  FROM tenant_users
  WHERE user_id = auth.uid()
  ORDER BY is_active DESC NULLS LAST, created_at ASC
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_tenant_id() IS
  'Actieve tenant van de ingelogde gebruiker. Basis voor alle RLS-policies. Volgt tenant_users.is_active.';

-- Zonder een actieve rij valt zowel de app als deze functie terug op "de eerste".
-- Dat kan per query verschillen als er geen ORDER BY was. Zet daarom voor elke
-- gebruiker zonder actieve tenant het oudste lidmaatschap op actief.
UPDATE tenant_users tu
   SET is_active = true
 WHERE tu.id = (
   SELECT t2.id
   FROM tenant_users t2
   WHERE t2.user_id = tu.user_id
   ORDER BY t2.created_at ASC
   LIMIT 1
 )
 AND NOT EXISTS (
   SELECT 1 FROM tenant_users t3
   WHERE t3.user_id = tu.user_id AND t3.is_active IS TRUE
 );
