-- 046_lead_sources_and_pipeline_stages.sql
-- Extra lead-bronnen (personal brand, Google organisch) + tenant-configureerbare
-- pipeline stages. Additief, geen data-verlies.

-- =========================================================================
-- 1. Extra lead-bronnen
-- =========================================================================

alter table leads drop constraint if exists leads_source_check;
alter table leads add constraint leads_source_check check (source in (
  'whatsapp','meta_lead_ads','form','email','manual',
  'facebook_organic','instagram_organic','facebook_ads','instagram_ads',
  'referral','bestaande_klant','personal_brand','google_organic','overig'
));

-- =========================================================================
-- 2. Tenant-configureerbare pipeline stages
-- =========================================================================
-- `key` is de stabiele identifier die in leads.stage wordt opgeslagen — die
-- verandert niet bij hernoemen. `kind` is het systeem-anker (open/qualified/
-- nurture/disqualified/closed) dat bepaalt hoe een stage zich gedraagt
-- (telt mee als open, telt als gekwalificeerd, sluit next_action, etc).
-- `label` en `sort_order` zijn volledig door de gebruiker te beheren.

create table if not exists pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  key text not null,
  label text not null,
  kind text not null check (kind in ('open','qualified','nurture','disqualified','closed')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, key)
);
create index if not exists idx_pipeline_stages_tenant on pipeline_stages(tenant_id, sort_order);
alter table pipeline_stages enable row level security;
drop policy if exists pipeline_stages_tenant_isolation on pipeline_stages;
create policy pipeline_stages_tenant_isolation on pipeline_stages
  for all using (tenant_id = get_user_tenant_id()) with check (tenant_id = get_user_tenant_id());

-- Seed de bestaande 8 default-stages voor elke tenant die al leads heeft,
-- zodat bestaande data meteen een kloppende stage-configuratie heeft.
-- Nieuwe tenants krijgen dit lazy bij de eerste keer dat /api/pipeline-stages
-- wordt aangeroepen (zie lib/pipeline-stages.ts).
insert into pipeline_stages (tenant_id, key, label, kind, sort_order)
select t.id, s.key, s.label, s.kind, s.sort_order
from tenants t
cross join (values
  ('nieuw', 'Nieuw', 'open', 0),
  ('contact_gelegd', 'Contact gelegd', 'open', 1),
  ('in_gesprek', 'In gesprek', 'open', 2),
  ('wacht_op_info', 'Wacht op info/foto''s', 'open', 3),
  ('gekwalificeerd', 'Gekwalificeerd', 'qualified', 4),
  ('niet_gekwalificeerd', 'Niet gekwalificeerd', 'disqualified', 5),
  ('nurture', 'Nurture', 'nurture', 6),
  ('gesloten', 'Gesloten', 'closed', 7)
) as s(key, label, kind, sort_order)
on conflict (tenant_id, key) do nothing;

-- leads.stage verwijst nu naar een per-tenant configureerbare pipeline_stages.key
-- i.p.v. een vaste enum — validatie gebeurt op API-niveau tegen die tabel.
alter table leads drop constraint if exists leads_stage_check;

-- =========================================================================
-- 3. Partners — wie doet de sales/prijs/afspraak
-- =========================================================================

alter table subcontractors add column if not exists handles_own_sales boolean not null default false;
alter table project_subcontractors add column if not exists handles_sales boolean;
