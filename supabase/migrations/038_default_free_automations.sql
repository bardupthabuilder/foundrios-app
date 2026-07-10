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
