import { z } from 'zod';
import jwt from 'jsonwebtoken';

const text = (max = 10000) => z.string().trim().max(max).optional().nullable();
const url = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => value === '' || /^(https?:\/\/|\/)/i.test(value),
    'Only http(s) or relative URLs are allowed'
  )
  .optional()
  .nullable();
const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{3,120}$/, 'Invalid slug');
const status = z.enum(['draft', 'published', 'archived']);

export const caseStudySchema = z
  .object({
    slug: slug.optional(),
    title: z.string().trim().min(3).max(180).optional(),
    summary: z.string().trim().min(10).max(600).optional(),
    type: z.enum(['shipped_project', 'product_case_study', 'program_case_study']).optional(),
    status: status.optional(),
    featured: z.boolean().optional(),
    sort_order: z.coerce.number().int().min(-100000).max(100000).optional(),
    role: text(240),
    timeline: text(240),
    team: text(240),
    domain: text(120),
    problem: text(),
    approach: text(),
    outcome: text(),
    metrics: z.array(z.record(z.unknown())).max(50).optional(),
    tools: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    tags: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    cover_image: url,
    gallery: z.array(z.record(z.unknown())).max(100).optional(),
    live_url: url,
    repo_url: url,
    prototype_url: url,
    prd_url: url,
    seo_title: text(180),
    seo_description: text(320),
    og_image: url,
    research_inputs: text(),
    role_constraints: text(),
    problem_framing: text(),
    options_decision: text(),
    options_tradeoffs: text(),
    prd_snapshot: z.record(z.unknown()).optional(),
    delivery: text(),
    outcome_learning: text(),
    year: z.coerce.number().int().min(1900).max(2200).optional().nullable(),
    skills: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    related_work: z.array(z.record(z.unknown())).max(50).optional(),
  })
  .strict();

export const articleSchema = z
  .object({
    slug: slug.optional(),
    title: z.string().trim().min(3).max(180).optional(),
    type: z.enum(['teardown', 'feature_proposal', 'essay']).optional(),
    excerpt: z.string().trim().min(10).max(600).optional(),
    body: z.string().max(200000).optional(),
    cover_image: url,
    tags: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    status: status.optional(),
    reading_time: text(40),
    disclaimer: text(500),
    related_work: z.array(z.record(z.unknown())).max(50).optional(),
  })
  .strict();

export const prdSchema = z
  .object({
    slug: slug.optional(),
    title: z.string().trim().min(3).max(180).optional(),
    stage: z.enum(['In Development', 'Approved', 'Archived']).optional(),
    visibility: z.enum(['public', 'unlisted', 'private']).optional(),
    context: z.string().trim().min(10).max(20000).optional(),
    sections: z
      .record(z.unknown())
      .or(z.array(z.record(z.unknown())))
      .optional(),
    pdf_url: url,
    related_case_study_id: z.string().uuid().nullable().optional(),
    status: status.optional(),
  })
  .strict();

export const settingsSchema = z
  .object({
    profile_photo_url: url,
    headline: text(240),
    biography: text(),
    email: z.string().email().or(z.literal('')).nullable().optional(),
    resume_url: url,
    social_links: z.record(z.string().trim().max(2048)).optional(),
    navigation_labels: z.record(z.string().trim().min(1).max(80)).optional(),
    consent_text: text(1000),
    footer_details: z.record(z.unknown()).optional(),
  })
  .strict();

export const parseResource = (schema, body) => {
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  const error = new Error('Request validation failed');
  error.status = 400;
  error.code = 'VALIDATION_ERROR';
  error.details = result.error.flatten();
  throw error;
};

export const parsePagination = (query, defaultLimit = 20) => {
  const page = Math.min(Math.max(Number.parseInt(query?.page, 10) || 1, 1), 100000);
  const limit = Math.min(Math.max(Number.parseInt(query?.limit, 10) || defaultLimit, 1), 100);
  const q = typeof query?.q === 'string' ? query.q.trim().slice(0, 120) : '';
  return { page, limit, q, offset: (page - 1) * limit };
};

export const hasValidSignature = (file) => {
  const bytes = file?.buffer;
  if (!bytes?.length) return false;
  if (file.mimetype === 'image/jpeg')
    return bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (file.mimetype === 'image/png')
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimetype === 'image/webp')
    return (
      bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
    );
  if (file.mimetype === 'application/pdf') return bytes.subarray(0, 5).toString() === '%PDF-';
  return false;
};

export const generatePreviewToken = (item, type) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
  return jwt.sign(
    {
      id: item.id,
      slug: item.slug,
      type, // 'work' | 'article' | 'prd'
      purpose: 'draft_preview',
    },
    secret,
    { expiresIn: '1h' }
  );
};

export const verifyPreviewToken = (token, expectedSlug, expectedType) => {
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    const decoded = jwt.verify(token, secret);
    if (decoded.purpose !== 'draft_preview') return false;
    if (decoded.type !== expectedType) return false;
    if (decoded.slug !== expectedSlug && decoded.id !== expectedSlug) return false;
    return true;
  } catch {
    return false;
  }
};
