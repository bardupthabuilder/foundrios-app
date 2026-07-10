-- Migration 032: Playbook Library
-- Kern van het uitvoerplatform: bewezen SOPs/flows/prompts uit GM agency-praktijk,
-- toegankelijk binnen FoundriOS per tier.
--
-- Drie soorten records:
--   - tenant_id IS NULL: system-wide playbook (door superadmin beheerd), zichtbaar voor alle tenants binnen hun tier
--   - tenant_id IS NOT NULL: tenant-eigen playbook (custom variant of self-authored)

-- Helper function: superadmin check (DRY)
CREATE OR REPLACE FUNCTION is_superadmin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_users
    WHERE user_id = auth.uid() AND is_superadmin = true
  );
$$;

-- Categorieën (lookup table; seedable en uitbreidbaar)
CREATE TABLE IF NOT EXISTS playbook_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed categorieën conform plan
INSERT INTO playbook_categories (slug, label, sort_order) VALUES
  ('aanvragen', 'Aanvragen', 10),
  ('opvolging', 'Opvolging', 20),
  ('kwalificatie', 'Kwalificatie', 30),
  ('planning', 'Planning', 40),
  ('offertes', 'Offertes', 50),
  ('onderhoudscontracten', 'Onderhoudscontracten', 60),
  ('content', 'Content', 70),
  ('meta-ads', 'Meta Ads', 80),
  ('growzy-setup', 'Growzy Setup', 90),
  ('creatives', 'Creatives', 100),
  ('copy', 'Copy', 110),
  ('rapportage', 'Rapportage', 120),
  ('reviews', 'Reviews & Referrals', 130),
  ('klantcommunicatie', 'Klantcommunicatie', 140),
  ('projectdocumentatie', 'Projectdocumentatie', 150),
  ('sales', 'Sales', 160),
  ('retentie', 'Retentie', 170),
  ('partner', 'Partner & Leadverdeling', 180),
  ('outreach-hooks', 'Outreach — Hooks', 190),
  ('outreach-angles', 'Outreach — Angles', 200),
  ('outreach-signals', 'Outreach — Signalen', 210),
  ('sales-bezwaren', 'Sales — Bezwaren', 220),
  ('content-topics', 'Content — Topics', 230),
  ('delivery', 'Delivery', 240),
  ('governance', 'Governance & Rules', 250)
ON CONFLICT (slug) DO NOTHING;

-- Playbooks
CREATE TABLE IF NOT EXISTS playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = system-wide
  category_slug text NOT NULL REFERENCES playbook_categories(slug),
  subcategory text,
  slug text NOT NULL,
  title text NOT NULL,
  purpose text,
  when_to_use text,
  steps jsonb NOT NULL DEFAULT '[]',
  prompts jsonb NOT NULL DEFAULT '[]',
  checklist jsonb NOT NULL DEFAULT '[]',
  output_example text,
  tools_required text[] NOT NULL DEFAULT '{}',
  min_tier text NOT NULL DEFAULT 'free' CHECK (min_tier IN ('free', 'pro', 'scale')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('concept', 'active', 'proven', 'improve')),
  source_path text,  -- pad in .claude/ waar dit playbook vandaan kwam (voor seed-idempotency)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug),
  UNIQUE(source_path)
);

CREATE INDEX IF NOT EXISTS idx_playbooks_category ON playbooks(category_slug, status);
CREATE INDEX IF NOT EXISTS idx_playbooks_tenant ON playbooks(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_playbooks_system ON playbooks(category_slug, min_tier) WHERE tenant_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_playbooks_min_tier ON playbooks(min_tier);

ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;

-- SELECT: system-wide records zichtbaar voor alle authenticated users; eigen tenant records ook
CREATE POLICY playbooks_select ON playbooks
  FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR tenant_id = get_user_tenant_id());

-- INSERT/UPDATE/DELETE: tenant-eigen records door tenant; system-wide alleen door superadmin
CREATE POLICY playbooks_insert ON playbooks
  FOR INSERT TO authenticated
  WITH CHECK (
    (tenant_id = get_user_tenant_id())
    OR (tenant_id IS NULL AND is_superadmin())
  );

CREATE POLICY playbooks_update ON playbooks
  FOR UPDATE TO authenticated
  USING (
    (tenant_id = get_user_tenant_id())
    OR (tenant_id IS NULL AND is_superadmin())
  )
  WITH CHECK (
    (tenant_id = get_user_tenant_id())
    OR (tenant_id IS NULL AND is_superadmin())
  );

CREATE POLICY playbooks_delete ON playbooks
  FOR DELETE TO authenticated
  USING (
    (tenant_id = get_user_tenant_id())
    OR (tenant_id IS NULL AND is_superadmin())
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_playbooks_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS playbooks_updated ON playbooks;
CREATE TRIGGER playbooks_updated BEFORE UPDATE ON playbooks
  FOR EACH ROW EXECUTE FUNCTION update_playbooks_updated_at();

-- Playbook usage (analytics-ready, optioneel ingevuld door UI)
CREATE TABLE IF NOT EXISTS playbook_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  playbook_id uuid NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  feedback text
);

CREATE INDEX IF NOT EXISTS idx_playbook_usage_tenant ON playbook_usage(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_playbook_usage_playbook ON playbook_usage(playbook_id);

ALTER TABLE playbook_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY playbook_usage_tenant ON playbook_usage
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

COMMENT ON TABLE playbooks IS 'Bewezen flows/SOPs/prompts uit GM agency-praktijk. NULL tenant_id = system-wide (door superadmin beheerd).';
COMMENT ON COLUMN playbooks.steps IS 'jsonb array: [{ "title": "...", "description": "...", "tools": ["..."] }, ...]';
COMMENT ON COLUMN playbooks.prompts IS 'jsonb array: [{ "label": "...", "prompt": "...", "model": "claude|gpt|gemini" }, ...]';
COMMENT ON COLUMN playbooks.min_tier IS 'Minimum FoundriOS tier vereist om de volledige inhoud te zien.';
COMMENT ON COLUMN playbooks.source_path IS 'Voor seed-script idempotency: relatief pad in .claude/ van bronbestand.';
