-- ============================================================
-- 016_agent_catalog — Foundri Workforce Agent Catalog
-- ============================================================

CREATE TABLE IF NOT EXISTS fw_agents_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('basis', 'next_level', 'enterprise', 'upsell')),
  category text NOT NULL CHECK (category IN (
    'acquisition', 'retention', 'operations', 'finance', 'team', 'marketing', 'integration'
  )),
  pricing_monthly integer NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'concept' CHECK (status IN ('concept', 'in_build', 'active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_catalog_tier ON fw_agents_catalog(tier);
CREATE INDEX IF NOT EXISTS idx_agents_catalog_status ON fw_agents_catalog(status);
CREATE INDEX IF NOT EXISTS idx_agents_catalog_category ON fw_agents_catalog(category);

-- ============================================================
-- Seed data — Basis Tier (8 agents, inbegrepen)
-- ============================================================

INSERT INTO fw_agents_catalog (slug, name, description, tier, category, pricing_monthly, features, status)
VALUES
  ('lead-intake', 'Lead Intake Agent', 'Structureert inkomende leads (naam, bedrijf, dienst, budget, urgentie, regio)', 'basis', 'acquisition', 0,
   '["structuur inkomende leads", "multi-kanaal intake", "raw data opslag"]'::jsonb, 'active'),

  ('qualification', 'Qualification Agent', 'Scoort hot/warm/cold op basis van ICP + budget + urgentie', 'basis', 'acquisition', 0,
   '["ICP-matching", "budget-scoring", "urgentie-detectie", "niche-specifieke benchmarks"]'::jsonb, 'active'),

  ('conversation', 'Conversation Agent', 'Voert eerste gesprek via WhatsApp/SMS, beantwoordt vragen, wekt vertrouwen', 'basis', 'acquisition', 0,
   '["whatsapp-native", "vragen beantwoorden", "vertrouwen opbouwen", "escalatie naar eigenaar"]'::jsonb, 'in_build'),

  ('booking', 'Booking Agent', 'Boekt afspraak in agenda van eigenaar, stuurt bevestiging + reminders', 'basis', 'acquisition', 0,
   '["calendar integratie", "automatische reminders", "no-show preventie", "multi-language support"]'::jsonb, 'in_build'),

  ('reactivation', 'Reactivation Agent', 'Reactiveer leads die stil zijn gevallen (14d / 30d / 90d triggers)', 'basis', 'retention', 0,
   '["silence detection", "automated reactivation", "personalized outreach", "trigger-based"]'::jsonb, 'in_build'),

  ('quote', 'Quote Agent', 'Genereert gepersonaliseerde offerte-opzet op basis van dienst + budget', 'basis', 'retention', 0,
   '["offerte-generatie", "niche-specifieke pricing", "document upload", "approval flow"]'::jsonb, 'concept'),

  ('review', 'Review Agent', 'Vraagt review na projectafronding via WhatsApp, stuurt naar Google/Trustpilot', 'basis', 'retention', 0,
   '["review request automation", "multi-platform publishing", "sentiment tracking"]'::jsonb, 'concept'),

  ('invoice-reminder', 'Invoice Reminder Agent', 'Stuurt herinneringen voor onbetaalde facturen (dag 7, 14, 30)', 'basis', 'finance', 0,
   '["scheduled reminders", "escalation sequence", "multi-language templates"]'::jsonb, 'concept');

-- ============================================================
-- Seed data — Next Level Tier (8 agents, €197/mnd)
-- ============================================================

INSERT INTO fw_agents_catalog (slug, name, description, tier, category, pricing_monthly, features, status)
VALUES
  ('no-show-recovery', 'No-Show Recovery Agent', 'Detecteert no-show, belt direct na, plant direct opnieuw in', 'next_level', 'retention', 197,
   '["no-show detection", "immediate callback", "rebooking automation"]'::jsonb, 'concept'),

  ('project-update', 'Project Update Agent', 'Stuurt dagelijkse/wekelijkse statusupdate aan klant tijdens project', 'next_level', 'retention', 197,
   '["scheduled updates", "photo integration", "progress tracking"]'::jsonb, 'concept'),

  ('upsell', 'Upsell Agent', 'Detecteert upsell-kansen bij bestaande klanten (extra diensten, grotere scope)', 'next_level', 'retention', 197,
   '["behavior analysis", "automated suggestions", "pitch templates"]'::jsonb, 'concept'),

  ('referral', 'Referral Agent', 'Triggert referralverzoek bij klanten met bewezen resultaat (30-45 dgn)', 'next_level', 'acquisition', 197,
   '["trigger-based activation", "incentive tracking", "warm referral routing"]'::jsonb, 'concept'),

  ('capacity-planning', 'Capacity Planning Agent', 'Voorkomt overboeking, vult gaten in agenda, signaleert lege weken', 'next_level', 'operations', 197,
   '["calendar analysis", "gap filling", "capacity forecasting"]'::jsonb, 'concept'),

  ('complaint-resolution', 'Complaint Resolution Agent', 'Handelt klachten af, eskaleert indien nodig, houdt klant tevreden', 'next_level', 'retention', 197,
   '["complaint triage", "resolution workflow", "escalation routing"]'::jsonb, 'concept'),

  ('seasonal-campaign', 'Seasonal Campaign Agent', 'Maakt seizoenscampagnes (bijv. hovenierbedrijf: lente-aanbieding)', 'next_level', 'marketing', 197,
   '["niche-based seasonality", "campaign automation", "content generation"]'::jsonb, 'concept'),

  ('contract-renewal', 'Contract Renewal Agent', 'Beheert service-contracten, stuurt renewalverzoek 60 dagen van tevoren', 'next_level', 'retention', 197,
   '["contract tracking", "renewal automation", "churn prevention"]'::jsonb, 'concept');

-- ============================================================
-- Seed data — Enterprise Tier (8 agents, €997/mnd)
-- ============================================================

INSERT INTO fw_agents_catalog (slug, name, description, tier, category, pricing_monthly, features, status)
VALUES
  ('recruitment', 'Recruitment Agent', 'Screent sollicitanten, stelt interview-vragen per WhatsApp, kwalificeert', 'enterprise', 'team', 997,
   '["cv screening", "interview automation", "qualification scoring"]'::jsonb, 'concept'),

  ('onboarding', 'Employee Onboarding Agent', 'Stuurt onboardingdocumenten, vraagt info op, begeleidt eerste week', 'enterprise', 'team', 997,
   '["document distribution", "checklist automation", "progress tracking"]'::jsonb, 'concept'),

  ('performance-analytics', 'Performance Analytics Agent', 'Genereert wekelijks KPI-rapport voor eigenaar: leads, conversie, omzet, capaciteit', 'enterprise', 'operations', 997,
   '["kpi aggregation", "trend analysis", "automated reporting"]'::jsonb, 'concept'),

  ('multi-location', 'Multi-location Coordinator Agent', 'Coördineert meerdere vestigingen of regio''s, routeert leads naar juiste locatie', 'enterprise', 'operations', 997,
   '["location routing", "capacity balancing", "regional analytics"]'::jsonb, 'concept'),

  ('subcontractor', 'Subcontractor Management Agent', 'Beheert zzp''ers en subs: inplannen, briefen, nakijken, betalen', 'enterprise', 'operations', 997,
   '["scheduling", "briefing automation", "payment tracking"]'::jsonb, 'concept'),

  ('compliance', 'Compliance & Permits Agent', 'Houdt certificaten, vergunningen en verzekeringen bij (alert vóór verloopdatum)', 'enterprise', 'operations', 997,
   '["document tracking", "expiry alerts", "renewal automation"]'::jsonb, 'concept'),

  ('forecasting', 'Financial Forecasting Agent', 'Genereert omzetprognose op basis van pipeline-waarde en historische conversie', 'enterprise', 'finance', 997,
   '["pipeline analysis", "conversion modeling", "cash flow prediction"]'::jsonb, 'concept'),

  ('scheduling', 'Team Scheduling Agent', 'Plant roosters, houdt rekening met vakanties, stuurt diensten per WhatsApp', 'enterprise', 'team', 997,
   '["roster automation", "vacation tracking", "shift distribution"]'::jsonb, 'concept');

-- ============================================================
-- Seed data — Upsell Tier (10 standalone agents, 1-click activatie)
-- ============================================================

INSERT INTO fw_agents_catalog (slug, name, description, tier, category, pricing_monthly, features, status)
VALUES
  ('venture', 'Venture Agent', 'Analyseert nieuwe zakelijke kansen, marktonderzoek, concurrent-scan per niche', 'upsell', 'marketing', 197,
   '["market research", "competitor analysis", "opportunity spotting"]'::jsonb, 'concept'),

  ('webshop', 'Webshop Agent', 'Koppelt aan Shopify/WooCommerce, beheert orders, stuurt updates naar klanten', 'upsell', 'integration', 97,
   '["shopify integration", "order tracking", "customer updates"]'::jsonb, 'concept'),

  ('social-media', 'Social Media Agent', 'Maakt content voor Instagram/LinkedIn op basis van projectfoto''s, plant in', 'upsell', 'marketing', 147,
   '["content generation", "scheduling", "engagement tracking"]'::jsonb, 'concept'),

  ('google-ads', 'Google Ads Agent', 'Monitort campagnes, optimaliseert biedingen, rapporteert CPL wekelijks', 'upsell', 'marketing', 197,
   '["campaign monitoring", "bid optimization", "weekly reporting"]'::jsonb, 'concept'),

  ('seo-content', 'SEO Content Agent', 'Schrijft maandelijks SEO-artikel per subniche (hoveniersartikel, dakdekkersartikel)', 'upsell', 'marketing', 97,
   '["niche-specific content", "seo optimization", "monthly publishing"]'::jsonb, 'concept'),

  ('voice-inbound', 'Voice Agent (Inbound)', 'Neemt telefoon aan als medewerker: naam, vraag, terugbelafspraak ingepland', 'upsell', 'acquisition', 297,
   '["phone handling", "vapi/bland.ai integration", "call transcription"]'::jsonb, 'concept'),

  ('hr-recruitment', 'HR Recruitment Pipeline', 'Complete vacaturetekst → screening → sollicitatiegesprek → shortlist', 'upsell', 'team', 247,
   '["job description", "cv screening", "interview scheduling"]'::jsonb, 'concept'),

  ('whatsapp-broadcast', 'WhatsApp Broadcast Agent', 'Stuurt seizoensberichten / aanbiedingen aan klantdatabase, bijhoudt opt-outs', 'upsell', 'marketing', 97,
   '["broadcast scheduling", "opt-out tracking", "template library"]'::jsonb, 'concept'),

  ('insurance-claims', 'Insurance Claims Agent', 'Documenteert schades, maakt claimonderbouwing, communiceert met verzekeraar', 'upsell', 'operations', 147,
   '["damage documentation", "claim assembly", "insurer communication"]'::jsonb, 'concept'),

  ('accounting-bridge', 'Accounting Bridge Agent', 'Koppelt facturen aan Exact/Moneybird/Twinfield, verrijkt boekhouding automatisch', 'upsell', 'finance', 97,
   '["accounting integration", "invoice enrichment", "automated posting"]'::jsonb, 'concept');

-- ============================================================
-- Changelog
-- ============================================================

-- 2026-04-25: Initial creation with 24-agent catalog across 4 tiers
