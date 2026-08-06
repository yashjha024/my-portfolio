-- ============================================================================
-- Security & Storage Hardening Migration (Codex Audit Fixes)
-- Provisions portfolio-media storage bucket & restricts RLS across sensitive tables
-- ============================================================================

-- 1. Ensure `portfolio-media` storage bucket exists with size limit & allowed MIME types (for public assets)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'portfolio-media',
    'portfolio-media',
    true,
    10485760, -- 10 MB limit per PRD/audit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
    ];

-- 2. Ensure `portfolio-media-private` storage bucket exists (for non-public assets)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'portfolio-media-private',
    'portfolio-media-private',
    false,
    10485760,
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
    ];

-- 3. Storage Object RLS Policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view portfolio media assets" ON storage.objects;
CREATE POLICY "Public can view portfolio media assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'portfolio-media' OR (bucket_id = 'portfolio-media-private' AND (auth.role() = 'service_role' OR is_admin())));

DROP POLICY IF EXISTS "Admins can upload portfolio media assets" ON storage.objects;
CREATE POLICY "Admins can upload portfolio media assets" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id IN ('portfolio-media', 'portfolio-media-private') AND (auth.role() = 'service_role' OR is_admin()));

DROP POLICY IF EXISTS "Admins can update portfolio media assets" ON storage.objects;
CREATE POLICY "Admins can update portfolio media assets" ON storage.objects
    FOR UPDATE USING (bucket_id IN ('portfolio-media', 'portfolio-media-private') AND (auth.role() = 'service_role' OR is_admin()));

DROP POLICY IF EXISTS "Admins can delete portfolio media assets" ON storage.objects;
CREATE POLICY "Admins can delete portfolio media assets" ON storage.objects
    FOR DELETE USING (bucket_id IN ('portfolio-media', 'portfolio-media-private') AND (auth.role() = 'service_role' OR is_admin()));
