-- Migration: Update Quote Agent status from 'concept' to 'in_build'
-- Sprint 2 Task 2.1.1: Quote Agent implementation begins

UPDATE fw_agents_catalog
SET status = 'in_build'
WHERE slug = 'quote' AND status = 'concept';

-- Verify update
SELECT id, slug, name, status FROM fw_agents_catalog WHERE slug = 'quote';
