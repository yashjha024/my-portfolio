-- ============================================================================
-- PRODUCT MANAGEMENT PORTFOLIO PLATFORM — SUPABASE POSTGRESQL SCHEMA
-- Migration: 20260719000005_experience_and_education.sql
-- Description: Creates experiences and educations tables for CMS-backed 
--              career timeline and educational history per PRD specs.
-- ============================================================================

-- 1. TABLES DEFINITION

CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(title) >= 2),
    organization TEXT NOT NULL CHECK (char_length(organization) >= 2),
    employment_type TEXT DEFAULT 'Full-time',
    location TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT DEFAULT 'Present',
    is_present BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    impact_metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
    logo_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    status content_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS educations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution TEXT NOT NULL CHECK (char_length(institution) >= 2),
    degree TEXT NOT NULL CHECK (char_length(degree) >= 2),
    field_of_study TEXT,
    location TEXT,
    start_date TEXT,
    end_date TEXT,
    is_present BOOLEAN NOT NULL DEFAULT false,
    gpa TEXT,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    status content_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. AUTOMATED TIMESTAMP TRIGGERS

DROP TRIGGER IF EXISTS trg_experiences_updated_at ON experiences;
CREATE TRIGGER trg_experiences_updated_at
    BEFORE UPDATE ON experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_educations_updated_at ON educations;
CREATE TRIGGER trg_educations_updated_at
    BEFORE UPDATE ON educations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. INDEXES

CREATE INDEX IF NOT EXISTS idx_experiences_status_sort ON experiences(status, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_educations_status_sort ON educations(status, sort_order ASC);

-- 4. ROW-LEVEL SECURITY (RLS) POLICIES

ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE educations ENABLE ROW LEVEL SECURITY;

-- Policies: experiences
DROP POLICY IF EXISTS "Public can view published experiences or admin view all" ON experiences;
CREATE POLICY "Public can view published experiences or admin view all" ON experiences
    FOR SELECT USING (is_admin() OR status = 'published');

DROP POLICY IF EXISTS "Admins can manage experiences" ON experiences;
CREATE POLICY "Admins can manage experiences" ON experiences
    FOR ALL USING (is_admin());

-- Policies: educations
DROP POLICY IF EXISTS "Public can view published educations or admin view all" ON educations;
CREATE POLICY "Public can view published educations or admin view all" ON educations
    FOR SELECT USING (is_admin() OR status = 'published');

DROP POLICY IF EXISTS "Admins can manage educations" ON educations;
CREATE POLICY "Admins can manage educations" ON educations
    FOR ALL USING (is_admin());

-- 5. INITIAL SEED DATA POPULATION (Preserving mockData.js content)

INSERT INTO experiences (title, organization, employment_type, location, start_date, end_date, is_present, description, sort_order, status)
VALUES 
(
  'Product Intern',
  'Istockly (Remote/BLR)',
  'Internship',
  'Remote / Bengaluru, IN',
  'Dec 2025',
  'Present',
  true,
  'Owned delivery of a production LMS for financial education across 4 core workflows (course management, onboarding, progress tracking, certification). Designed experiences for learners & admins reducing operational friction by ~20%, and developed analytics visibility across 4 key KPIs cutting manual reporting effort by ~25%.',
  1,
  'published'
),
(
  'Project Intern',
  'Diptech Technologies (Patna, BR)',
  'Internship',
  'Patna, BR',
  'June 2025',
  'Dec 2025',
  false,
  'Owned workflow definition for an industrial commerce platform covering 5 core journeys (discovery, ordering, partial payments, loan support, after-sales). Enabled Razorpay partial payments and auto-generated loan quotations reducing manual documentation effort by 20–25%. Integrated technician appointment booking.',
  2,
  'published'
),
(
  'Research Intern',
  'National Institute of Technology (NIT), Patna',
  'Internship',
  'Patna, BR',
  'May 2025',
  'July 2025',
  false,
  'Extended a CVPR 2024 few-shot learning pipeline from 1 dataset family to 2 medical imaging domains, supporting cross-domain experimentation and model evaluation.',
  3,
  'published'
),
(
  'Placement Coordinator',
  'Training & Placement Cell, BIT Mesra',
  'Leadership',
  'Ranchi, JH',
  'March 2025',
  'Present',
  true,
  'Managed placement workflows between students and recruiters, aligning scheduling, communication, and logistics across multiple stakeholders while supporting interview readiness.',
  4,
  'published'
)
ON CONFLICT DO NOTHING;

INSERT INTO educations (institution, degree, field_of_study, location, start_date, end_date, is_present, gpa, description, sort_order, status)
VALUES 
(
  'Birla Institute of Technology (BIT), Mesra',
  'B.Tech',
  'Artificial Intelligence & Machine Learning',
  'Ranchi, JH',
  'Nov 2022',
  'June 2026',
  false,
  '8.2 / 10',
  'Coursework: Statistics, Analysis of Algorithms, Data Structures, Machine Learning, Deep Learning. Certifications: Google Advanced Data Analytics (May 2024), Google Business Intelligence (June 2024).',
  1,
  'published'
)
ON CONFLICT DO NOTHING;
