-- Migration 022: Add company details fields to tenants table
-- Adds: IBAN, KvK number, VAT number, primary color, default payment days
-- Purpose: Enable branded, legally-complete PDFs and payment term configuration per tenant

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS iban text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS kvk_number text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS vat_number text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_color text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS default_payment_days integer DEFAULT 30;

-- Add comments for documentation
COMMENT ON COLUMN tenants.iban IS 'NL-rekeningnummer voor facturen';
COMMENT ON COLUMN tenants.kvk_number IS 'KvK-nummer (wettelijk verplicht op factuur)';
COMMENT ON COLUMN tenants.vat_number IS 'BTW-nummer';
COMMENT ON COLUMN tenants.primary_color IS 'HEX kleur voor branding (bijv. #2d6a2d)';
COMMENT ON COLUMN tenants.default_payment_days IS 'Standaard betaaltermijn in dagen';
