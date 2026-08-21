-- FoundriOS — Migratie 042
-- Eén factuur per offerte: DB-laag backstop tegen dubbele facturen.
--
-- ACHTERGROND
-- `POST /api/quotes/[id]/convert` had geen check op een reeds bestaande factuur en
-- geen unieke constraint hield dit tegen. Een dubbele klik, een herhaald verzoek,
-- of twee open tabbladen kon een tweede factuur met een nieuw volgnummer en
-- gedupliceerde regels aanmaken voor dezelfde offerte. De API-route is inmiddels
-- gefixt (geeft de bestaande factuur terug in plaats van een nieuwe aan te maken),
-- maar zonder een constraint op databaseniveau blijft dit alleen door de app
-- afgedwongen — bijvoorbeeld niet bij een race condition of een toekomstige route
-- die dezelfde fout herhaalt.
--
-- Bestaande dubbele facturen worden NIET verwijderd (geen informatieverlies) —
-- alleen de koppeling (`quote_id`) van de nieuwste dubbelingen wordt losgemaakt,
-- zodat de oudste (eerst aangemaakte) factuur de koppeling met de offerte behoudt
-- en de rest als losstaande factuur bestaat.

-- ============================================================
-- 1. BESTAANDE DUBBELINGEN ONTKOPPELEN
-- Per (tenant_id, quote_id)-combinatie: houd de oudste factuur gekoppeld,
-- maak quote_id leeg bij de rest.
-- ============================================================
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, quote_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM invoices
  WHERE quote_id IS NOT NULL
)
UPDATE invoices
SET quote_id = NULL
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- ============================================================
-- 2. UNIEKE PARTIELE INDEX
-- Alleen afgedwongen waar quote_id niet NULL is — losse/handmatige facturen
-- zonder bronofferte blijven onbeperkt mogelijk.
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS invoices_quote_id_unique
  ON invoices (tenant_id, quote_id)
  WHERE quote_id IS NOT NULL;
