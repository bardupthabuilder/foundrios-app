-- Migration 026: sign_token default + backfill
-- Garandeer dat elke offerte een sign_token heeft voor de publieke acceptpagina

-- Backfill bestaande rijen die nog geen token hebben
UPDATE quotes SET sign_token = gen_random_uuid() WHERE sign_token IS NULL;

-- Zorg dat toekomstige inserts automatisch een token krijgen
ALTER TABLE quotes ALTER COLUMN sign_token SET DEFAULT gen_random_uuid();
ALTER TABLE quotes ALTER COLUMN sign_token SET NOT NULL;

-- Bestaande UNIQUE constraint blijft staan (migration 023)
CREATE INDEX IF NOT EXISTS idx_quotes_sign_token ON quotes(sign_token);

COMMENT ON COLUMN quotes.sign_token IS 'Publieke acceptatie-token (uniek, auto-generated). URL: /q/[sign_token]';
