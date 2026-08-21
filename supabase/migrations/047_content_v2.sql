-- 047_content_v2.sql
-- Content Module V1 + V2 in één stap.
--
-- BELANGRIJK: content_items en content_distributions bestaan NIET in de live
-- database, ondanks dat de bestaande app-code (app/dashboard/content/*,
-- app/api/content/*) en lib/types/database.types.ts ze als bestaand
-- veronderstellen — de module draait dus momenteel stuk in productie.
-- Deze migratie herstelt V1 (CREATE, schema exact zoals de bestaande code
-- verwacht) en voegt in dezelfde stap de V2-uitbreiding toe: Facebook/
-- Instagram x Zakelijk/Persoonlijk kanalen, wekelijkse handmatige KPI-invoer,
-- en lead->content attributie. Additief, geen data-verlies (er was toch
-- geen data — deze tabellen bestonden nooit).

-- =========================================================================
-- 0. V1 herstel — content_items
-- =========================================================================

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  title text not null,
  hook text,
  body text,
  cta text,
  script text,
  visual_type text,
  visual_prompt text,
  status text not null default 'ideeen'
    check (status in ('ideeen','te_maken','in_productie','klaar','gepubliceerd','herbruikbaar')),
  type text,
  content_template text,
  platforms text[],
  platform text,
  tags text[],
  scheduled_date date,
  published_date date,
  day_of_week integer,
  week_number text,
  angle text,
  primary_topic text,
  funnel_stage text,
  ai_generated boolean not null default false,
  batch_id uuid,
  hook_score integer,
  clarity_score integer,
  cta_strength integer,
  metrics jsonb,
  vakman_academy_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_content_items_tenant on content_items(tenant_id);
create index if not exists idx_content_items_tenant_status on content_items(tenant_id, status);
create index if not exists idx_content_items_batch on content_items(batch_id) where batch_id is not null;
alter table content_items enable row level security;
drop policy if exists content_items_tenant_isolation on content_items;
create policy content_items_tenant_isolation on content_items
  for all using (tenant_id = get_user_tenant_id()) with check (tenant_id = get_user_tenant_id());

-- =========================================================================
-- 0b. V1 herstel — content_distributions (direct met V2's profile_type kolom,
--     zodat we geen aparte ALTER-stap nodig hebben op een gloednieuwe tabel)
-- =========================================================================

create table if not exists content_distributions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  content_item_id uuid not null references content_items(id) on delete cascade,
  platform text not null,
  profile_type text check (profile_type in ('zakelijk','persoonlijk')),
  -- nullable: legacy/overige platforms (linkedin/tiktok/etc.) houden NULL;
  -- alle Facebook/Instagram rijen zetten dit altijd.
  status text not null default 'gepland',
  scheduled_at timestamptz,
  published_at timestamptz,
  post_url text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_content_distributions_tenant on content_distributions(tenant_id);
create index if not exists idx_content_distributions_item on content_distributions(content_item_id);
create unique index if not exists idx_content_distributions_item_channel
  on content_distributions(content_item_id, platform, coalesce(profile_type, ''));
alter table content_distributions enable row level security;
drop policy if exists content_distributions_tenant_isolation on content_distributions;
create policy content_distributions_tenant_isolation on content_distributions
  for all using (tenant_id = get_user_tenant_id()) with check (tenant_id = get_user_tenant_id());

-- =========================================================================
-- 1. V2 — Channel config (tenant-configureerbare 4-kanalen toggle)
-- =========================================================================

create table if not exists content_channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  platform text not null check (platform in ('facebook','instagram')),
  profile_type text not null check (profile_type in ('zakelijk','persoonlijk')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, platform, profile_type)
);
create index if not exists idx_content_channels_tenant on content_channels(tenant_id);
alter table content_channels enable row level security;
drop policy if exists content_channels_tenant_isolation on content_channels;
create policy content_channels_tenant_isolation on content_channels
  for all using (tenant_id = get_user_tenant_id()) with check (tenant_id = get_user_tenant_id());

-- Seed alle 4 kanalen enabled=true voor elke bestaande tenant.
insert into content_channels (tenant_id, platform, profile_type, enabled)
select t.id, p.platform, p.profile_type, true
from tenants t
cross join (values
  ('facebook','zakelijk'), ('facebook','persoonlijk'),
  ('instagram','zakelijk'), ('instagram','persoonlijk')
) as p(platform, profile_type)
on conflict (tenant_id, platform, profile_type) do nothing;

-- =========================================================================
-- 2. V2 — Wekelijkse handmatige KPI-invoer (posts/bereik/interacties/DM's)
-- =========================================================================
-- Gekwalificeerde aanvragen worden NIET hier opgeslagen — die komen live
-- uit de leads-tabel (zie sectie 3 + lib/pipeline-stages.ts kind='qualified').

create table if not exists content_weekly_metrics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  week_start_date date not null, -- maandag
  platform text not null check (platform in ('facebook','instagram')),
  profile_type text not null check (profile_type in ('zakelijk','persoonlijk')),
  posts_published integer not null default 0,
  reach integer not null default 0,
  interactions integer not null default 0,
  dms integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, week_start_date, platform, profile_type)
);
create index if not exists idx_content_weekly_metrics_tenant_week on content_weekly_metrics(tenant_id, week_start_date);
alter table content_weekly_metrics enable row level security;
drop policy if exists content_weekly_metrics_tenant_isolation on content_weekly_metrics;
create policy content_weekly_metrics_tenant_isolation on content_weekly_metrics
  for all using (tenant_id = get_user_tenant_id()) with check (tenant_id = get_user_tenant_id());

-- =========================================================================
-- 3. V2 — Lead -> content attributie
-- =========================================================================
-- Alleen relevant wanneer source IN ('facebook_organic','instagram_organic').
-- 'personal_brand' blijft een legacy catch-all, niet gekoppeld aan een kanaal.

alter table leads
  add column if not exists profile_type text check (profile_type in ('zakelijk','persoonlijk'));

create index if not exists idx_leads_source_profile_type
  on leads(tenant_id, source, profile_type) where profile_type is not null;
