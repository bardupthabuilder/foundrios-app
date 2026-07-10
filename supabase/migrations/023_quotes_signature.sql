-- Migration 023: Add signature and payment structure fields to quotes table
-- Adds: Digitale handtekening tracking + betalingsstructuur (termijnen)
-- Purpose: Enable client signing via public link + payment milestone configuration

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS sign_token uuid UNIQUE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS signed_at timestamptz;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS signature_name text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS signature_ip text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS advance_pct integer;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS milestone_pct integer;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS final_pct integer;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_note text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS parent_quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON COLUMN quotes.sign_token IS 'Publieke token voor signing URL - geen auth vereist';
COMMENT ON COLUMN quotes.signed_at IS 'Wanneer ondertekend door klant';
COMMENT ON COLUMN quotes.signature_name IS 'Naam ondertekende persoon';
COMMENT ON COLUMN quotes.signature_ip IS 'IP-adres van ondertekening (bewijs)';
COMMENT ON COLUMN quotes.advance_pct IS 'Aanbetaling % (bijv. 30)';
COMMENT ON COLUMN quotes.milestone_pct IS 'Tussentijdse betaling % (bijv. 40)';
COMMENT ON COLUMN quotes.final_pct IS 'Eindbetaling % (auto: 100-advance-milestone)';
COMMENT ON COLUMN quotes.payment_note IS 'Aanvullende betalingstekst';
COMMENT ON COLUMN quotes.parent_quote_id IS 'Voor meerwerk: koppeling naar originele offerte';
