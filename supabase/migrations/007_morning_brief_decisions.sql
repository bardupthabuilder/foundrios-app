-- ============================================================
-- Morning Brief + Decision Engine tables (BardOS)
-- ============================================================

-- Morning Briefs: generated daily snapshots
CREATE TABLE IF NOT EXISTS morning_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  brief_date date NOT NULL DEFAULT CURRENT_DATE,
  summary text,
  priorities jsonb DEFAULT '[]',
  alerts jsonb DEFAULT '[]',
  kpi_snapshot jsonb DEFAULT '{}',
  pipeline_snapshot jsonb DEFAULT '{}',
  ai_recommendations jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, brief_date)
);

-- Decisions: every decision logged for pattern learning
CREATE TABLE IF NOT EXISTS decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category text NOT NULL, -- ads, leads, creative, outreach, pricing, priority, other
  context text NOT NULL,
  options jsonb DEFAULT '[]',
  chosen_option text NOT NULL,
  reasoning text,
  outcome text, -- filled in later
  outcome_score smallint, -- 1-5, filled in later
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Decision patterns: AI-extracted patterns after enough data
CREATE TABLE IF NOT EXISTS decision_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category text NOT NULL,
  pattern_description text NOT NULL,
  confidence real DEFAULT 0,
  decision_count int DEFAULT 0,
  avg_outcome_score real,
  example_ids uuid[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE morning_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "morning_briefs_tenant" ON morning_briefs
  FOR ALL USING (company_id = get_user_tenant_id());

CREATE POLICY "decisions_tenant" ON decisions
  FOR ALL USING (company_id = get_user_tenant_id());

CREATE POLICY "decision_patterns_tenant" ON decision_patterns
  FOR ALL USING (company_id = get_user_tenant_id());

-- Indexes
CREATE INDEX idx_decisions_category ON decisions(company_id, category);
CREATE INDEX idx_decisions_created ON decisions(company_id, created_at DESC);
CREATE INDEX idx_morning_briefs_date ON morning_briefs(company_id, brief_date DESC);
CREATE INDEX idx_decision_patterns_category ON decision_patterns(company_id, category);
