-- Migration 036: Playbook audience model + per-tenant grants
--
-- Drie audience-types voor system-wide playbooks (tenant_id IS NULL):
--   - internal:  alleen superadmin (jij/team) ziet 'm. Voor delivery SOPs.
--   - tier:      alle tenants met minstens min_tier zien 'm automatisch.
--   - granted:   alleen tenants in tenant_playbook_grants zien 'm.

-- Helper: heeft de huidige user toegang via tier?
CREATE OR REPLACE FUNCTION tenant_has_tier(required_tier text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenants t
    INNER JOIN tenant_users tu ON tu.tenant_id = t.id
    WHERE tu.user_id = auth.uid()
    AND CASE required_tier
      WHEN 'free' THEN true
      WHEN 'pro' THEN t.plan IN ('pro','scale')
      WHEN 'scale' THEN t.plan = 'scale'
      ELSE false
    END
  );
$$;

ALTER TABLE playbooks ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'internal'
  CHECK (audience IN ('internal','tier','granted'));

CREATE INDEX IF NOT EXISTS idx_playbooks_audience ON playbooks(audience) WHERE tenant_id IS NULL;

CREATE TABLE IF NOT EXISTS tenant_playbook_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  playbook_id uuid NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by_user_id uuid,
  UNIQUE(tenant_id, playbook_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_playbook_grants_tenant ON tenant_playbook_grants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_playbook_grants_playbook ON tenant_playbook_grants(playbook_id);

ALTER TABLE tenant_playbook_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_playbook_grants_select ON tenant_playbook_grants
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin());

CREATE POLICY tenant_playbook_grants_modify ON tenant_playbook_grants
  FOR ALL TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Nieuwe audience-aware SELECT policy op playbooks
DROP POLICY IF EXISTS playbooks_select ON playbooks;

CREATE POLICY playbooks_select ON playbooks
  FOR SELECT TO authenticated
  USING (
    (tenant_id = get_user_tenant_id())
    OR (tenant_id IS NULL AND audience = 'internal' AND is_superadmin())
    OR (tenant_id IS NULL AND audience = 'tier' AND tenant_has_tier(min_tier))
    OR (tenant_id IS NULL AND audience = 'granted' AND EXISTS (
      SELECT 1 FROM tenant_playbook_grants g
      WHERE g.playbook_id = playbooks.id
      AND g.tenant_id = get_user_tenant_id()
    ))
  );

COMMENT ON COLUMN playbooks.audience IS 'internal=alleen superadmin · tier=alle tenants >= min_tier · granted=alleen tenants in tenant_playbook_grants';
COMMENT ON TABLE tenant_playbook_grants IS 'Expliciete toegang tot specifieke (audience=granted) playbooks per tenant. Door superadmin beheerd.';
