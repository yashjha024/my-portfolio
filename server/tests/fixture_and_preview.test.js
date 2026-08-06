import test from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import {
  generatePreviewToken,
  verifyPreviewToken,
  prdSchema,
  caseStudySchema,
  articleSchema,
} from '../src/utils/validation.utils.js';

test('Signed preview token generation and verification for draft assets', () => {
  const itemPrd = { id: 'prd-uuid-123', slug: 'next-gen-analytics-prd' };
  const itemWork = { id: 'work-uuid-456', slug: 'enterprise-billing-redesign' };
  const itemArticle = { id: 'article-uuid-789', slug: 'why-product-ops-matter' };

  // 1. Generate valid tokens
  const tokenPrd = generatePreviewToken(itemPrd, 'prd');
  const tokenWork = generatePreviewToken(itemWork, 'work');
  const tokenArticle = generatePreviewToken(itemArticle, 'article');

  assert.ok(
    typeof tokenPrd === 'string' && tokenPrd.split('.').length === 3,
    'Token should be a valid JWT string'
  );

  // 2. Verify tokens against correct slug and type
  assert.strictEqual(
    verifyPreviewToken(tokenPrd, itemPrd.slug, 'prd'),
    true,
    'PRD token must pass verification'
  );
  assert.strictEqual(
    verifyPreviewToken(tokenWork, itemWork.slug, 'work'),
    true,
    'Work token must pass verification'
  );
  assert.strictEqual(
    verifyPreviewToken(tokenArticle, itemArticle.slug, 'article'),
    true,
    'Article token must pass verification'
  );

  // 3. Verify cross-type rejection (e.g., using a PRD token to view a case study)
  assert.strictEqual(
    verifyPreviewToken(tokenPrd, itemPrd.slug, 'work'),
    false,
    'PRD token must be rejected when accessing work'
  );

  // 4. Verify slug mismatch rejection
  assert.strictEqual(
    verifyPreviewToken(tokenPrd, 'wrong-slug', 'prd'),
    false,
    'PRD token must be rejected for different slug'
  );

  // 5. Verify tampered token rejection
  const tamperedToken = tokenPrd + 'xyz';
  assert.strictEqual(
    verifyPreviewToken(tamperedToken, itemPrd.slug, 'prd'),
    false,
    'Tampered token must be rejected'
  );

  // 6. Verify expired token rejection
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
  const expiredToken = jwt.sign(
    { id: itemPrd.id, slug: itemPrd.slug, type: 'prd', purpose: 'draft_preview' },
    secret,
    { expiresIn: '-1s' }
  );
  assert.strictEqual(
    verifyPreviewToken(expiredToken, itemPrd.slug, 'prd'),
    false,
    'Expired token must be rejected'
  );
});

test('PRD schema validation with seeded and custom section structures', () => {
  // 1. Valid canonical PRD object matching strict schema
  const validPrd = {
    title: 'Advanced AI Assistant PRD',
    slug: 'advanced-ai-assistant-prd',
    context: 'A comprehensive PRD for our new AI feature providing deep IDE assistance.',
    stage: 'Approved',
    visibility: 'public',
    sections: {
      problem_statement: 'Users need faster code assistance in real-time.',
      proposed_solution: 'Embed an LLM assistant directly in the IDE workspace.',
      user_stories: [
        {
          id: 'us-1',
          role: 'Developer',
          goal: 'generate unit tests automatically',
          acceptance_criteria: 'Must run in under 5s',
        },
      ],
      success_metrics: [
        {
          id: 'sm-1',
          name: 'Task Completion Speed',
          target: '30% faster',
          tracking_method: 'IDE telemetry',
        },
      ],
      technical_considerations: 'Requires WebSocket proxy for real-time streaming.',
    },
  };

  const resultValid = prdSchema.safeParse(validPrd);
  assert.strictEqual(resultValid.success, true, 'Canonical PRD schema validation must succeed');

  // 2. PRD object with unlisted or private visibility and array sections
  const privatePrd = {
    ...validPrd,
    visibility: 'private',
    sections: [{ id: 'overview', title: 'Overview', content: 'Internal specification.' }],
  };
  assert.strictEqual(
    prdSchema.safeParse(privatePrd).success,
    true,
    'Private visibility and array sections must be valid'
  );

  const unlistedPrd = { ...validPrd, visibility: 'unlisted' };
  assert.strictEqual(
    prdSchema.safeParse(unlistedPrd).success,
    true,
    'Unlisted visibility must be valid in schema'
  );

  // 3. Invalid visibility rejection
  const invalidVisibilityPrd = { ...validPrd, visibility: 'classified' };
  assert.strictEqual(
    prdSchema.safeParse(invalidVisibilityPrd).success,
    false,
    'Invalid visibility value must be rejected'
  );
});

test('Case study and article schema validation with structured teardown fields', () => {
  // 1. Case study validation with structured teardown / case study fields
  const validCaseStudy = {
    title: 'Fintech Mobile App Overhaul',
    slug: 'fintech-mobile-app-overhaul',
    summary: 'Complete redesign of transaction flow.',
    type: 'product_case_study',
    problem: 'Users abandoned checkout at step 3 due to confusing UI.',
    approach: 'Simplified 1-click biometric checkout.',
    outcome: 'Increased conversion by 42%.',
    role: 'Lead Product Manager',
    timeline: '6 months',
    domain: 'Fintech / Mobile',
    metrics: [
      { label: 'Conversion Rate', value: '+42%' },
      { label: 'CSAT', value: '4.8 / 5.0' },
    ],
    gallery: [
      {
        title: 'User Journey Map',
        type: 'image',
        url: 'https://res.cloudinary.com/demo/image/upload/v1/journey.png',
      },
    ],
    status: 'published',
    tags: ['UX', 'Fintech', 'Mobile'],
  };

  const caseStudyRes = caseStudySchema.safeParse(validCaseStudy);
  assert.strictEqual(
    caseStudyRes.success,
    true,
    'Case study with gallery and metrics must be valid'
  );

  // 2. Thinking article validation (e.g. teardown article)
  const validArticle = {
    title: 'Product Teardown: Spotify Discovery',
    slug: 'product-teardown-spotify-discovery',
    excerpt: 'Analyzing the recommendation engine loop across mobile and desktop.',
    body: '# Spotify Teardown\nAn in-depth look into collaborative filtering and daily mix generation...',
    type: 'teardown',
    reading_time: '7 min read',
    status: 'published',
    tags: ['Teardown', 'Algorithms'],
  };

  const articleRes = articleSchema.safeParse(validArticle);
  assert.strictEqual(articleRes.success, true, 'Article schema validation must succeed');
});
