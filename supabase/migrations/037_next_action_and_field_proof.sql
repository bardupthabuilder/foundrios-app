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
