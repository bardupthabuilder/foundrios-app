-- ============================================================
-- 020_quotes_table — Foundri Workforce Quote Storage
-- ============================================================

CREATE TABLE IF NOT EXISTS fw_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fw_tenants(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES fw_leads(id) ON DELETE SET NULL,
  quote_data jsonb NOT NULL,
  pdf_url text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fw_quotes_tenant ON fw_quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fw_quotes_prospect ON fw_quotes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_fw_quotes_status ON fw_quotes(tenant_id, status);

DO $$ BEGIN
  CREATE TRIGGER fw_quotes_updated BEFORE UPDATE ON fw_quotes
    FOR EACH ROW EXECUTE FUNCTION fw_update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE fw_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY fw_quotes_select ON fw_quotes
  FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY fw_quotes_insert ON fw_quotes
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY fw_quotes_update ON fw_quotes
  FOR UPDATE TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM fw_tenant_users WHERE user_id = auth.uid())
  );

-- ============================================================
-- Storage bucket: quotes (private, signed URLs)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quotes',
  'quotes',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: only users of the tenant that owns the quote can access it
-- Files are stored as {tenant_id}/{quote_id}.pdf
CREATE POLICY quotes_storage_select ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'quotes' AND
    (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM fw_tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY quotes_storage_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'quotes' AND
    (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM fw_tenant_users WHERE user_id = auth.uid()
    )
  );

-- Service role inserts (used by the quote agent running server-side)
CREATE POLICY quotes_storage_service_insert ON storage.objects
  FOR INSERT TO service_role WITH CHECK (bucket_id = 'quotes');

CREATE POLICY quotes_storage_service_select ON storage.objects
  FOR SELECT TO service_role USING (bucket_id = 'quotes');

-- ============================================================
-- Changelog
-- ============================================================

-- 2026-04-25: Initial creation — fw_quotes table + quotes storage bucket
