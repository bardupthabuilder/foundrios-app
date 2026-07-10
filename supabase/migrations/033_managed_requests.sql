-- Migration 033: Managed-by-GM Aanvraagflow
-- In-app upsell: "Wil je dat wij dit voor je uitvoeren?" → aanvraag → superadmin queue → kwalificatie.

CREATE TABLE IF NOT EXISTS managed_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'qualified', 'rejected', 'scheduled', 'won', 'lost')),
  preferred_package text NOT NULL DEFAULT 'unsure' CHECK (preferred_package IN ('light', 'core', 'premium', 'unsure')),

  -- Bedrijfsinfo
  bedrijfsnaam text NOT NULL,
  vakgebied text,
  regio text,
  website text,
  socials jsonb DEFAULT '{}',

  -- Cijfers
  omzet_maand_eur integer,                  -- maandomzet in hele euro's
  gemiddelde_projectwaarde_eur integer,
  aantal_medewerkers integer,
  capaciteit_extra_werk text,               -- "ja, 2-3 projecten/mnd", "nee", etc

  -- Huidige situatie
  huidige_leadbronnen text[] NOT NULL DEFAULT '{}',
  grootste_probleem text,
  gewenste_groei text,
  budget_bereidheid text,

  -- Admin-side
  internal_notes text,
  assigned_to uuid,                         -- user_id van GM team-lid
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_managed_requests_tenant ON managed_requests(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_managed_requests_status ON managed_requests(status, created_at DESC);

ALTER TABLE managed_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: eigen tenant ziet eigen aanvragen; superadmin ziet alles
CREATE POLICY managed_requests_select ON managed_requests
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin());

-- INSERT: alleen voor eigen tenant
CREATE POLICY managed_requests_insert ON managed_requests
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id());

-- UPDATE: tenant mag eigen aanvraag editen (zolang status='new'); superadmin altijd
CREATE POLICY managed_requests_update ON managed_requests
  FOR UPDATE TO authenticated
  USING (
    (tenant_id = get_user_tenant_id() AND status = 'new')
    OR is_superadmin()
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id() OR is_superadmin()
  );

-- DELETE: alleen superadmin
CREATE POLICY managed_requests_delete ON managed_requests
  FOR DELETE TO authenticated
  USING (is_superadmin());

-- updated_at trigger (hergebruik patroon)
CREATE OR REPLACE FUNCTION update_managed_requests_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS managed_requests_updated ON managed_requests;
CREATE TRIGGER managed_requests_updated BEFORE UPDATE ON managed_requests
  FOR EACH ROW EXECUTE FUNCTION update_managed_requests_updated_at();

COMMENT ON TABLE managed_requests IS 'Aanvragen voor Done-For-You uitvoering door Groeneveld Media. Self-serve form → superadmin review queue.';
COMMENT ON COLUMN managed_requests.status IS 'new → reviewing → qualified|rejected → scheduled → won|lost';
COMMENT ON COLUMN managed_requests.preferred_package IS 'light=€980/3mnd · core=€2497/6mnd · premium=€4997/12mnd · unsure';
