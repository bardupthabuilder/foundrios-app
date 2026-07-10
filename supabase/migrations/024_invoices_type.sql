-- Migration 024: Add invoice type and quote relation to invoices table
-- Adds: Invoice type tracking (regular/advance/milestone/final) + quote linkage
-- Purpose: Enable milestone invoicing from payment structure, track payment stage

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type text DEFAULT 'regular' CHECK (invoice_type IN ('regular', 'advance', 'milestone', 'final'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS related_quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON COLUMN invoices.invoice_type IS 'Type: regular | advance | milestone | final';
COMMENT ON COLUMN invoices.related_quote_id IS 'Voor termijnfacturen: koppeling naar offerte die betalingsstructuur definieerde';
