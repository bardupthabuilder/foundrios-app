-- 044_lifecycle_v1.sql
-- V1 operating-system lifecycle: unified lead stage, pricing route, quote
-- cost/margin, project execution + aftercare fields, before/after photos,
-- expanded maintenance frequencies, client/lead source tracking.
-- Additive only — no columns dropped, no data destroyed.

-- =========================================================================
-- 1. LEADS — unified stage, pricing route, client/referral linkage
-- =========================================================================

alter table leads add column if not exists stage text;
alter table leads add column if not exists outcome text;
alter table leads add column if not exists pricing_route text;
alter table leads add column if not exists assessment_at timestamptz;
alter table leads add column if not exists budget_amount_cents bigint;
alter table leads add column if not exists expected_value_cents bigint;
alter table leads add column if not exists client_id uuid references clients(id) on delete set null;
alter table leads add column if not exists referral_client_id uuid references clients(id) on delete set null;

-- Backfill unified stage from the two legacy fields (status + pipeline_stage).
update leads set stage = case
  when pipeline_stage = 'gewonnen' or status = 'won' then 'gesloten'
  when pipeline_stage = 'verloren' or status = 'lost' then 'gesloten'
  when pipeline_stage = 'gekwalificeerd' then 'gekwalificeerd'
  when pipeline_stage = 'offerte' then 'gekwalificeerd'
  when pipeline_stage = 'afspraak' then 'in_gesprek'
  when pipeline_stage = 'opvolging' then 'in_gesprek'
  when status in ('hot','warm') then 'in_gesprek'
  when status = 'cold' then 'nurture'
  else 'nieuw'
end
where stage is null;

update leads set outcome = case
  when pipeline_stage = 'gewonnen' or status = 'won' then 'won'
  when pipeline_stage = 'verloren' or status = 'lost' then 'lost'
  else null
end
where outcome is null and (pipeline_stage in ('gewonnen','verloren') or status in ('won','lost'));

alter table leads alter column stage set default 'nieuw';
update leads set stage = 'nieuw' where stage is null;
alter table leads alter column stage set not null;

alter table leads drop constraint if exists leads_stage_check;
alter table leads add constraint leads_stage_check check (stage in (
  'nieuw','contact_gelegd','in_gesprek','wacht_op_info','gekwalificeerd',
  'niet_gekwalificeerd','nurture','gesloten'
));

alter table leads drop constraint if exists leads_outcome_check;
alter table leads add constraint leads_outcome_check check (outcome is null or outcome in ('won','lost'));

alter table leads drop constraint if exists leads_pricing_route_check;
alter table leads add constraint leads_pricing_route_check check (pricing_route is null or pricing_route in ('remote','assessment'));

-- Expand source enum: keep legacy values, add the requested attribution set.
alter table leads drop constraint if exists leads_source_check;
alter table leads add constraint leads_source_check check (source in (
  'whatsapp','meta_lead_ads','form','email','manual',
  'facebook_organic','instagram_organic','facebook_ads','instagram_ads',
  'referral','bestaande_klant','overig'
));

create index if not exists idx_leads_stage on leads(tenant_id, stage);
create index if not exists idx_leads_client_id on leads(client_id);

-- =========================================================================
-- 2. LEAD PHOTOS — attachments were entirely missing
-- =========================================================================

create table if not exists lead_photos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  storage_path text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_lead_photos_lead on lead_photos(lead_id);
alter table lead_photos enable row level security;
drop policy if exists lead_photos_tenant_isolation on lead_photos;
create policy lead_photos_tenant_isolation on lead_photos
  for all using (tenant_id = get_user_tenant_id()) with check (tenant_id = get_user_tenant_id());

insert into storage.buckets (id, name, public)
  values ('lead-fotos', 'lead-fotos', false)
  on conflict (id) do nothing;

-- =========================================================================
-- 3. QUOTES — cost/margin so the system can answer "is dit werk interessant"
-- =========================================================================

alter table quotes add column if not exists lead_id uuid references leads(id) on delete set null;
alter table quotes add column if not exists estimated_material_cost_cents bigint not null default 0;
alter table quotes add column if not exists estimated_partner_cost_cents bigint not null default 0;
alter table quotes add column if not exists estimated_other_cost_cents bigint not null default 0;
alter table quotes add column if not exists estimated_hours numeric not null default 0;
alter table quotes add column if not exists estimated_gross_profit_cents bigint not null default 0;
alter table quotes add column if not exists estimated_margin_pct numeric;

create index if not exists idx_quotes_lead_id on quotes(lead_id);

-- =========================================================================
-- 4. PROJECTS — execution fields + aftercare (actuals, review, referral)
-- =========================================================================

alter table projects add column if not exists assigned_employee_id uuid references employees(id) on delete set null;
alter table projects add column if not exists source text;
alter table projects add column if not exists estimated_cost_cents bigint;
alter table projects add column if not exists estimated_profit_cents bigint;

alter table projects drop constraint if exists projects_status_check;
alter table projects add constraint projects_status_check check (status in (
  'gepland','actief','pauze','geblokkeerd','opgeleverd','gefactureerd','gearchiveerd'
));

-- Actual results, captured at "klaar" (aftercare step A).
alter table projects add column if not exists actual_revenue_cents bigint;
alter table projects add column if not exists actual_hours numeric;
alter table projects add column if not exists actual_material_cost_cents bigint;
alter table projects add column if not exists actual_partner_cost_cents bigint;
alter table projects add column if not exists actual_other_cost_cents bigint;
alter table projects add column if not exists actual_profit_cents bigint;
alter table projects add column if not exists actual_margin_pct numeric;

-- Review (aftercare step C) — was boolean-only, spec needs a 4-state flow.
alter table projects add column if not exists review_status text;
alter table projects drop constraint if exists projects_review_status_check;
alter table projects add constraint projects_review_status_check check (review_status is null or review_status in (
  'nog_vragen','gevraagd','ontvangen','overgeslagen'
));
update projects set review_status = case
  when review_received = true then 'ontvangen'
  when review_requested_at is not null then 'gevraagd'
  else null
end
where review_status is null;

-- Referral (aftercare step F).
alter table projects add column if not exists referral_status text;
alter table projects drop constraint if exists projects_referral_status_check;
alter table projects add constraint projects_referral_status_check check (referral_status is null or referral_status in (
  'nog_vragen','gevraagd','ontvangen','overgeslagen'
));

create index if not exists idx_projects_assigned_employee on projects(assigned_employee_id);

-- =========================================================================
-- 5. WORK ORDERS — before/after photos, extra work
-- =========================================================================

alter table work_order_photos add column if not exists photo_type text;
alter table work_order_photos drop constraint if exists work_order_photos_photo_type_check;
alter table work_order_photos add constraint work_order_photos_photo_type_check check (photo_type is null or photo_type in ('before','after'));

alter table work_orders add column if not exists extra_work text;

-- =========================================================================
-- 6. MAINTENANCE CONTRACTS — herhaalwerk interval options from the spec
-- =========================================================================

alter table maintenance_contracts drop constraint if exists maintenance_contracts_frequency_check;
alter table maintenance_contracts add constraint maintenance_contracts_frequency_check check (frequency in (
  'monthly','quarterly','biannual','annual',
  'every_4_weeks','every_6_weeks','spring','autumn','custom'
));

-- =========================================================================
-- 7. CLIENTS — carry the originating lead source through for attribution
-- =========================================================================

alter table clients add column if not exists source text;
-- clients.lead_id already exists (migration 003) and links back to the originating lead.
