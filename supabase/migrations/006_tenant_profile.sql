-- FoundriOS Migratie 006: Uitgebreid bedrijfsprofiel op tenants
-- Onboarding velden + profiel velden voor settings

-- Onboarding (verplicht bij setup)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS niche text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_phone text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Profiel (optioneel, in te vullen via settings)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS services text[];
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS avg_project_value text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS team_size integer;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url text;

-- Socials (voeden het content systeem)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS social_linkedin text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS social_instagram text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS social_facebook text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS social_google_business text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS social_tiktok text;

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- updated_at trigger
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
