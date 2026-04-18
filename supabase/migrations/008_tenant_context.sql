-- FoundriOS Migration 008: Context Layer + ontbrekende premium velden
-- Breidt het bedrijfsprofiel uit zodat het systeem het bedrijf echt kent

-- Context: projecttypes, werkuren, ideale klant, seizoenslogica
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS project_types text[];
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS min_project_value text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS work_days text[] DEFAULT ARRAY['ma','di','wo','do','vr'];
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS work_hours_start time DEFAULT '07:00';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS work_hours_end time DEFAULT '17:00';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tone_of_voice text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ideal_customer text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS seasonal_notes text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS maintenance_frequencies text[];

-- Premium positionering (UI bestond al, migratie ontbrak)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS premium_tagline text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS premium_guarantees text[];
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS premium_usp text[];
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_review_count integer;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_review_score numeric(2,1);
