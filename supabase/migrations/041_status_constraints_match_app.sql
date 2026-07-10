-- FoundriOS — Migratie 041
-- Statuswaarden in de database gelijktrekken met wat de app gebruikt.
--
-- ACHTERGROND
-- `work_orders` had een oude CHECK-constraint die 'concept' verbood. Omdat de
-- tabel al bestond, sloeg de CREATE TABLE van migratie 022b zichzelf over en kwam
-- de juiste constraint er nooit. Elke poging om een werkbon aan te maken gaf een
-- 500-fout: "violates check constraint work_orders_status_check".
--
-- Daarnaast staat er data met verouderde waarden:
--   quotes   : 'geaccepteerd'  → de app kent alleen 'akkoord'
--   invoices : 'verstuurd'     → de app kent alleen 'sent'
-- Die records vielen buiten elk filter en waren dus onzichtbaar in de app.
--
-- VOLGORDE IS ESSENTIEEL
-- Eerst de oude constraints weg, dán de data omzetten, dán de nieuwe constraints.
-- Andersom blokkeert de oude regel juist de update die haar overbodig moet maken:
-- 'akkoord' schrijven terwijl de oude constraint alleen 'geaccepteerd' toestaat
-- levert meteen een check-violation op.

-- ============================================================
-- 1. OUDE CHECK-CONSTRAINTS OP `status` VERWIJDEREN
--
-- De namen verschillen per database, dus zoeken we ze op via de kolom waar ze
-- naar verwijzen in plaats van te gokken.
-- ============================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass::text AS tabel, c.conname AS naam
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = ANY (c.conkey)
    WHERE c.contype = 'c'
      AND a.attname = 'status'
      AND c.conrelid::regclass::text IN ('work_orders', 'quotes', 'invoices')
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.tabel, r.naam);
    RAISE NOTICE 'Oude constraint verwijderd: %.%', r.tabel, r.naam;
  END LOOP;
END $$;

-- ============================================================
-- 2. DATA NORMALISEREN
-- Nu er geen constraint meer in de weg staat, mag dit.
-- ============================================================
UPDATE quotes   SET status = 'akkoord'   WHERE status = 'geaccepteerd';
UPDATE quotes   SET status = 'afgewezen' WHERE status IN ('geweigerd', 'rejected');
UPDATE invoices SET status = 'sent'      WHERE status IN ('verstuurd', 'openstaand', 'pending');
UPDATE invoices SET status = 'paid'      WHERE status IN ('betaald');
UPDATE invoices SET status = 'draft'     WHERE status IN ('concept');

-- Oude werkbonstatussen naar het model van de app.
UPDATE work_orders SET status = 'concept'      WHERE status IN ('open', 'draft', 'nieuw');
UPDATE work_orders SET status = 'actief'       WHERE status IN ('bezig', 'in_progress', 'onderweg');
UPDATE work_orders SET status = 'afgerond'     WHERE status IN ('completed', 'klaar');
UPDATE work_orders SET status = 'gefactureerd' WHERE status IN ('invoiced');

-- ============================================================
-- 3. DE JUISTE CONSTRAINTS INSTALLEREN
--
-- Deze lijsten komen letterlijk uit de Zod-schema's van de API:
--   app/api/work-orders/[id]/route.ts
--   app/api/quotes/[id]/route.ts
--   app/api/invoices/[id]/route.ts
--
-- Blijft er onverwachte data over, dan faalt het toevoegen. Dat is bewust: liever
-- nu een duidelijke fout dan later een record dat de app niet kan tonen.
-- ============================================================
ALTER TABLE work_orders
  ADD CONSTRAINT work_orders_status_check
  CHECK (status IN ('concept', 'actief', 'afgerond', 'gefactureerd'));

ALTER TABLE quotes
  ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('concept', 'verstuurd', 'akkoord', 'afgewezen', 'verlopen'));

ALTER TABLE invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'));

-- ============================================================
-- 4. STANDAARDWAARDEN
-- Een insert zonder status moet in het juiste beginpunt landen.
-- ============================================================
ALTER TABLE work_orders ALTER COLUMN status SET DEFAULT 'concept';
ALTER TABLE quotes      ALTER COLUMN status SET DEFAULT 'concept';
ALTER TABLE invoices    ALTER COLUMN status SET DEFAULT 'draft';
