-- 045_leads_intake_fields.sql
-- Aanvraag-intake velden die in de spec staan maar nog ontbraken: locatie,
-- dienst, omschrijving, notities. Additief, geen data-verlies.

alter table leads add column if not exists city text;
alter table leads add column if not exists service text;
alter table leads add column if not exists description text;
alter table leads add column if not exists notes text;
