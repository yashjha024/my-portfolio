-- Canonical content, scheduling, and media metadata contracts.

ALTER TABLE case_studies
  ADD COLUMN IF NOT EXISTS role_constraints TEXT,
  ADD COLUMN IF NOT EXISTS research_inputs TEXT,
  ADD COLUMN IF NOT EXISTS problem_framing TEXT,
  ADD COLUMN IF NOT EXISTS options_decision TEXT,
  ADD COLUMN IF NOT EXISTS options_tradeoffs TEXT,
  ADD COLUMN IF NOT EXISTS prd_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS delivery TEXT,
  ADD COLUMN IF NOT EXISTS outcome_learning TEXT,
  ADD COLUMN IF NOT EXISTS year INT CHECK (year BETWEEN 1900 AND 2200),
  ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_work JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

ALTER TABLE thinking_articles
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

ALTER TABLE prds
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

ALTER TABLE media
  ADD COLUMN IF NOT EXISTS folder TEXT NOT NULL DEFAULT 'general' CHECK (folder ~ '^[a-z0-9-]+$'),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_case_studies_year ON case_studies(year);
CREATE INDEX IF NOT EXISTS idx_case_studies_skills ON case_studies USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_case_studies_scheduled_at ON case_studies(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_thinking_articles_scheduled_at ON thinking_articles(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_prds_scheduled_at ON prds(scheduled_at) WHERE status = 'scheduled';

-- The API writes with a service key; browser clients can only discover explicitly public assets.
DROP POLICY IF EXISTS "Public can view non-private media assets" ON media;
CREATE POLICY "Public can view explicitly public media assets" ON media
  FOR SELECT USING (is_admin() OR is_public = true);

