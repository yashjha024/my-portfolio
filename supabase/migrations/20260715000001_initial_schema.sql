-- ============================================================================
-- PRODUCT MANAGEMENT PORTFOLIO PLATFORM — SUPABASE POSTGRESQL SCHEMA
-- Migration: 20260715000001_initial_schema.sql
-- Description: Complete production-grade relational database DDL with strict 
--              constraints, custom enums, GIN indexes, auto-updating triggers, 
--              and Row-Level Security (RLS) policies per PRD Section 6 & 7.
-- ============================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CUSTOM ENUMERATIONS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE case_study_type AS ENUM ('shipped_project', 'product_case_study', 'program_case_study');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE article_type AS ENUM ('teardown', 'feature_proposal', 'essay');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prd_stage AS ENUM ('In Development', 'Approved', 'Archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prd_visibility AS ENUM ('public', 'unlisted', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('image', 'pdf', 'document');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_status AS ENUM ('new', 'read', 'replied', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'editor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- Table: users (Linked with Supabase auth.users or standalone owner account)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    full_name TEXT NOT NULL CHECK (char_length(full_name) >= 2),
    role user_role NOT NULL DEFAULT 'owner',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: site_settings (Singleton configuration table enforced via id = 1 check)
CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    profile_photo_url TEXT,
    headline TEXT,
    biography TEXT,
    email TEXT CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    resume_url TEXT,
    social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
    navigation_labels JSONB NOT NULL DEFAULT '{}'::jsonb,
    consent_text TEXT,
    footer_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: case_studies (Main portfolio work items)
CREATE TABLE IF NOT EXISTS case_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) BETWEEN 3 AND 120),
    title TEXT NOT NULL CHECK (char_length(title) >= 3),
    summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 10 AND 600),
    type case_study_type NOT NULL,
    status content_status NOT NULL DEFAULT 'draft',
    featured BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    role TEXT,
    timeline TEXT,
    team TEXT,
    domain TEXT,
    problem TEXT,
    approach TEXT,
    outcome TEXT,
    metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
    tools TEXT[] NOT NULL DEFAULT '{}',
    tags TEXT[] NOT NULL DEFAULT '{}',
    cover_image TEXT,
    gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
    live_url TEXT,
    repo_url TEXT,
    prototype_url TEXT,
    prd_url TEXT,
    seo_title TEXT,
    seo_description TEXT,
    og_image TEXT,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: thinking_articles (Product teardowns, feature proposals, essays)
CREATE TABLE IF NOT EXISTS thinking_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) BETWEEN 3 AND 120),
    title TEXT NOT NULL CHECK (char_length(title) >= 3),
    type article_type NOT NULL,
    excerpt TEXT NOT NULL CHECK (char_length(excerpt) BETWEEN 10 AND 600),
    body TEXT NOT NULL,
    cover_image TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    status content_status NOT NULL DEFAULT 'draft',
    reading_time TEXT,
    disclaimer TEXT,
    related_work JSONB NOT NULL DEFAULT '[]'::jsonb,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: prds (Product requirement documents library)
CREATE TABLE IF NOT EXISTS prds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) BETWEEN 3 AND 120),
    title TEXT NOT NULL CHECK (char_length(title) >= 3),
    stage prd_stage NOT NULL DEFAULT 'In Development',
    visibility prd_visibility NOT NULL DEFAULT 'public',
    context TEXT NOT NULL,
    sections JSONB NOT NULL DEFAULT '{}'::jsonb,
    pdf_url TEXT,
    related_case_study_id UUID REFERENCES case_studies(id) ON DELETE SET NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status content_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: media (Asset library for images, diagrams, PDFs)
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    storage_path TEXT NOT NULL,
    type media_type NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    width INT CHECK (width IS NULL OR width > 0),
    height INT CHECK (height IS NULL OR height > 0),
    alt_text TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: contact_messages (Inquiries submitted via contact form)
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) >= 2),
    email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    subject TEXT NOT NULL DEFAULT 'General Inquiry',
    message TEXT NOT NULL CHECK (char_length(message) >= 10),
    status message_status NOT NULL DEFAULT 'new',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. AUTOMATED TIMESTAMP TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON site_settings;
CREATE TRIGGER trg_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_case_studies_updated_at ON case_studies;
CREATE TRIGGER trg_case_studies_updated_at
    BEFORE UPDATE ON case_studies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_thinking_articles_updated_at ON thinking_articles;
CREATE TRIGGER trg_thinking_articles_updated_at
    BEFORE UPDATE ON thinking_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_prds_updated_at ON prds;
CREATE TRIGGER trg_prds_updated_at
    BEFORE UPDATE ON prds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. HIGH-PERFORMANCE INDEXES
-- ============================================================================

-- Lookup & slug indexes
CREATE INDEX IF NOT EXISTS idx_case_studies_slug ON case_studies(slug);
CREATE INDEX IF NOT EXISTS idx_thinking_articles_slug ON thinking_articles(slug);
CREATE INDEX IF NOT EXISTS idx_prds_slug ON prds(slug);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Filtering and sorting indexes
CREATE INDEX IF NOT EXISTS idx_case_studies_status_featured ON case_studies(status, featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_thinking_articles_status_published ON thinking_articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_prds_visibility_status ON prds(visibility, status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created ON contact_messages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_type_created ON media(type, created_at DESC);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_case_studies_author_id ON case_studies(author_id);
CREATE INDEX IF NOT EXISTS idx_thinking_articles_author_id ON thinking_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_prds_author_id ON prds(author_id);
CREATE INDEX IF NOT EXISTS idx_prds_related_case_study_id ON prds(related_case_study_id);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);

-- GIN indexes for array and JSONB queries
CREATE INDEX IF NOT EXISTS idx_case_studies_tags ON case_studies USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_case_studies_tools ON case_studies USING GIN(tools);
CREATE INDEX IF NOT EXISTS idx_case_studies_metrics ON case_studies USING GIN(metrics);
CREATE INDEX IF NOT EXISTS idx_thinking_articles_tags ON thinking_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prds_sections ON prds USING GIN(sections);

-- ============================================================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Helper function: check if authenticated user is admin/owner
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'owner'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE thinking_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prds ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policies: users
DROP POLICY IF EXISTS "Public can view user profiles" ON users;
DROP POLICY IF EXISTS "Users can view own profile or admin view all" ON users;
CREATE POLICY "Users can view own profile or admin view all" ON users
    FOR SELECT USING (is_admin() OR id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage user profiles" ON users;
CREATE POLICY "Admins can manage user profiles" ON users
    FOR ALL USING (is_admin() OR id = auth.uid());

-- Policies: site_settings
DROP POLICY IF EXISTS "Public can view site settings" ON site_settings;
CREATE POLICY "Public can view site settings" ON site_settings
    FOR SELECT USING (id = 1);

DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings" ON site_settings
    FOR ALL USING (is_admin());

-- Policies: case_studies
DROP POLICY IF EXISTS "Public can view published case studies" ON case_studies;
CREATE POLICY "Public can view published case studies" ON case_studies
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage all case studies" ON case_studies;
CREATE POLICY "Admins can manage all case studies" ON case_studies
    FOR ALL USING (is_admin());

-- Policies: thinking_articles
DROP POLICY IF EXISTS "Public can view published thinking articles" ON thinking_articles;
CREATE POLICY "Public can view published thinking articles" ON thinking_articles
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage all thinking articles" ON thinking_articles;
CREATE POLICY "Admins can manage all thinking articles" ON thinking_articles
    FOR ALL USING (is_admin());

-- Policies: prds
DROP POLICY IF EXISTS "Public can view published and public prds" ON prds;
CREATE POLICY "Public can view published and public prds" ON prds
    FOR SELECT USING (status = 'published' AND visibility = 'public');

DROP POLICY IF EXISTS "Admins can manage all prds" ON prds;
CREATE POLICY "Admins can manage all prds" ON prds
    FOR ALL USING (is_admin());

-- Policies: media
DROP POLICY IF EXISTS "Public can view media assets" ON media;
DROP POLICY IF EXISTS "Public can view non-private media assets" ON media;
CREATE POLICY "Public can view non-private media assets" ON media
    FOR SELECT USING (is_admin() OR (folder IS DISTINCT FROM 'private' AND folder IS DISTINCT FROM 'confidential'));

DROP POLICY IF EXISTS "Admins can manage media assets" ON media;
CREATE POLICY "Admins can manage media assets" ON media
    FOR ALL USING (is_admin());

-- Policies: contact_messages
DROP POLICY IF EXISTS "Public can submit contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Service role can submit contact messages" ON contact_messages;
CREATE POLICY "Service role can submit contact messages" ON contact_messages
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR is_admin());

DROP POLICY IF EXISTS "Admins can view and manage contact messages" ON contact_messages;
CREATE POLICY "Admins can view and manage contact messages" ON contact_messages
    FOR ALL USING (is_admin());
