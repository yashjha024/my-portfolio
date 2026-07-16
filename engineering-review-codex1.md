# Production Audit & Engineering Review

**Repository reviewed:** `C:\Users\yashj\OneDrive\Desktop\Product Portfolio`  
**Source of truth:** `product-management-portfolio-prd.md`  
**Review mode:** Read-only audit; no repository changes applied.

## Executive decision

**Do not approve for production.** The implementation has a broad public/admin surface, but it currently has a critical authorization flaw, public exposure paths for private PRDs/media, broken seeded PRD/article rendering, an unprovisioned storage path, and a mock-data fallback that can present fabricated portfolio evidence during outages.

The highest-risk remediation order is: authorization and RLS, public visibility boundaries, storage/upload correctness, canonical content contracts, then validation and release testing.

## Validation performed

- Read the full repository structure, client/server source, Supabase migration/seed, environment examples, deployment config, and README.
- `npm run lint` **failed**: 8 errors and 32 warnings.
- `npm run build` could not complete in this OneDrive-backed workspace: Vite/esbuild returned `Access is denied` while resolving the reparse-pointed `client/vite.config.js` and parent directory. This is an environment-limited build result, not proof of a source compile failure.
- `npm audit --omit=dev --audit-level=high` could not query the npm advisory endpoint because network access was unavailable.
- No unit, integration, or E2E test files were found; no CI workflow was found.

## Critical findings

### C-01 — Any authenticated Supabase user is granted admin/editor access

**Description:** `setSession` assigns every non-owner email the `editor` role, and `verifyOwner` explicitly allows both `owner` and `editor`. Magic-link and Google sign-in are not restricted to an invitation or owner allowlist. `verifyAuth` also defaults an authenticated user with no profile to `editor`.

**Why it matters:** Any person who can authenticate can create, edit, publish, archive, delete content, change settings, and manage media. This directly violates the PRD requirement that only the owner can administer v1 content.

**Recommended fix:** Enforce an explicit owner identity/profile lookup server-side before issuing an admin session. Deny unknown users; do not auto-create `editor` users. If editor support is later required, add invitations, least-privilege route checks, and tests for anonymous, non-admin, editor, and owner identities.

**Files:** `server/src/controllers/auth.controller.js:78-99`, `server/src/middleware/auth.middleware.js:57-64`, `server/src/middleware/admin.middleware.js:5-15`, `client/src/context/AuthContext.jsx`.

**Effort:** 1–2 days plus authorization integration tests.

### C-02 — Private and unlisted PRDs can be fetched by slug

**Description:** `getPrdBySlug` filters only `status = published`; it does not require `visibility = public`. The dynamic sitemap also includes every published PRD regardless of visibility. The API uses a service-role client, so database RLS cannot compensate for the missing controller predicate.

**Why it matters:** A private or unlisted artifact becomes readable to anyone who guesses or receives its slug, violating the PRD confidentiality requirement.

**Recommended fix:** Require both `status = published` and `visibility = public` on every public PRD list/detail/feed/sitemap query. Add regression tests for public, unlisted, private, draft, scheduled, and archived records.

**Files:** `server/src/controllers/prd.controller.js:4-47`, `server/src/controllers/seo.controller.js:13-15`, `supabase/migrations/20260715000001_initial_schema.sql:327-334`.

**Effort:** 0.5–1 day.

### C-03 — Seeded PRD data crashes the public detail route

**Description:** The database seed stores `sections` as an object, but `PrdDetail.jsx` assumes it is an array and calls `.map()` before rendering. It also renders `releaseGates` objects directly and reads `req.desc`, while the seed uses `acceptanceCriteria`. The admin editor converts a seeded object to an empty array, so saving an existing PRD can erase its structured content.

**Why it matters:** A normal seeded public PRD can throw during render and trip the global error boundary. The admin editor can silently destroy requirements, metrics, and release gates.

**Recommended fix:** Define one versioned JSON contract (or normalized tables), migrate seed data and editor state to it, guard all optional shapes, render acceptance criteria explicitly, and add fixture-based page tests.

**Files:** `client/src/pages/public/PrdDetail.jsx:50,189-203,238-243`, `client/src/pages/admin/EditPrd.jsx:42,69-72`, `supabase/seed.sql:336-350`.

**Effort:** 1–2 days including data migration/tests.

### C-04 — Seeded teardown articles render empty sections instead of their body

**Description:** The schema stores an article `body`, but `ArticleDetail.jsx` treats every `type = teardown` item as a structured teardown and reads fields such as `currentExperience`, `targetAudience`, `proposedFeature`, and `whyNow`, none of which exist in the schema or seed. The stored markdown body is not rendered in that branch.

**Why it matters:** The flagship WhatsApp teardown appears as a page of empty “No content provided” sections rather than the authored article, failing a core product-thinking requirement.

**Recommended fix:** Either render `body` as the canonical article content or add/migrate the structured fields; do not infer a structured UI solely from `type`.

**Files:** `client/src/pages/public/ArticleDetail.jsx:46-47,119-225`, `supabase/migrations/20260715000001_initial_schema.sql:130-149`, `supabase/seed.sql:179-307`.

**Effort:** 1 day.

### C-05 — Media storage is not provisioned and upload errors are ignored

**Description:** The migration creates a `media` table but no `portfolio-media` Storage bucket or Storage RLS policies. The route uses unrestricted `multer.memoryStorage()`; the configured Cloudinary storage module is unused. `uploadMedia` logs a Supabase upload error and continues inserting a database row pointing at a potentially nonexistent object.

**Why it matters:** A fresh environment cannot reliably upload assets; malformed or oversized uploads can consume server memory; failed uploads create broken public records and orphaned objects.

**Recommended fix:** Provision the bucket and policies in migrations, use one storage provider consistently, enforce server-side size/type/content sniffing and safe filenames, reject on upload failure, and make storage+DB writes compensating/transactional.

**Files:** `server/src/routes/media.routes.js:11-14`, `server/src/controllers/media.controller.js:89-127`, `server/src/config/cloudinary.js`, `supabase/migrations/20260715000001_initial_schema.sql`.

**Effort:** 1–2 days.

### C-06 — Public pages silently substitute fabricated mock content

**Description:** `usePortfolioData` falls back to `client/src/data/mockData.js` whenever an API response is empty or unavailable. The mock content contains high-impact claims such as multi-million-dollar savings, enterprise counts, and “actual” metrics.

**Why it matters:** During an outage, misconfiguration, or an empty production database, recruiters see content that may not be the owner’s current or verified portfolio. This violates the PRD’s evidence and verified-number rules and makes failures look like successful content delivery.

**Recommended fix:** Fail closed with an explicit unavailable/empty state in production. Keep demo fixtures behind a development-only flag and never use them as a production fallback.

**Files:** `client/src/hooks/usePortfolioData.js:3,33-86,107-110`, `client/src/data/mockData.js`.

**Effort:** 0.5–1 day.

## High findings

### H-01 — Service-role client falls back to a public anon key

`server/src/config/supabase.js:7` and `server/src/config/env.js:26` accept `SUPABASE_ANON_KEY`/`VITE_SUPABASE_ANON_KEY` when the service key is missing. Required production secrets are not enforced. This can produce inconsistent RLS behavior and makes privileged server operations depend on a public credential. Fail startup for missing server secrets and keep server/client configuration separate.

**Effort:** 0.5 day.

### H-02 — RLS exposes all user profiles and media metadata

The `users` policy permits public `SELECT` on every row, including email and role. The `media` policy permits public `SELECT` on every asset, while `getPublicUrl` produces public Storage URLs. This conflicts with private media and least-privilege requirements. Restrict columns/rows, make private storage private, and expose only explicitly public assets.

**Files:** `supabase/migrations/20260715000001_initial_schema.sql:291-299,336-343`.

**Effort:** 1 day plus anonymous-RLS tests.

### H-03 — Public direct Supabase inserts bypass contact API controls

The `contact_messages` RLS policy allows anonymous inserts. An attacker can use the exposed anon key to bypass the Express Zod validation, honeypot, and rate limiter. Route writes through a controlled server function or add strict database constraints and a separate protected ingestion path.

**Files:** `supabase/migrations/20260715000001_initial_schema.sql:345-352`, `server/src/controllers/contact.controller.js`.

**Effort:** 1 day.

### H-04 — Contact submissions are stored but never delivered by email

`RESEND_API_KEY` is documented but unused. The controller only inserts into `contact_messages`; the UI claims submissions are delivered to a private inbox. Implement the provider call with retry/idempotency or change the UI copy and acceptance criteria.

**Files:** `server/src/controllers/contact.controller.js:24-61`, `server/.env.example`, `client/src/pages/public/Contact.jsx:211-215`.

**Effort:** 0.5–1 day.

### H-05 — Server-side input validation and bounds are missing

CRUD controllers spread `req.body` into database writes and do not use Zod schemas. Page/limit values and search strings are not bounded or normalized. This permits mass assignment, oversized queries, malformed PostgREST filters, and inconsistent records. Add per-resource schemas, URL/protocol validation, bounded pagination, and allowlisted update fields.

**Files:** `server/src/controllers/work.controller.js`, `thinking.controller.js`, `prd.controller.js`, `settings.controller.js`, `media.controller.js`.

**Effort:** 2–3 days.

### H-06 — Draft preview and scheduling are not implemented end-to-end

Editors expose a `scheduled` status but there is no `scheduled_at` field, scheduler, or publication transition. Preview links point to public published-only routes, so drafts are not previewable. Add signed owner-only preview tokens and a persisted schedule/worker, or remove the controls until implemented.

**Files:** `supabase/migrations/20260715000001_initial_schema.sql`, `server/src/controllers/*`, `client/src/pages/admin/EditWork.jsx:296-326`, `EditThinking.jsx:254-285`, `EditPrd.jsx:245-276`.

**Effort:** 2–3 days.

### H-07 — Database/API field names do not match public components

Live rows use snake_case (`cover_image`, `live_url`, `published_at`, `reading_time`, `pdf_url`), while public components read camelCase (`coverImage`, `liveUrl`, `publishedAt`, `readingTime`, `pdfUrl`). Live images, dates, links, and SEO values disappear; seeded detail content is materially degraded.

**Recommended fix:** Add a single typed/validated API DTO mapper or standardize naming at the API boundary.

**Files:** `client/src/hooks/usePortfolioData.js`, `client/src/pages/public/Home.jsx`, `Work.jsx`, `Thinking.jsx`, `CaseStudyDetail.jsx`, `ArticleDetail.jsx`, `PrdDetail.jsx`.

**Effort:** 1–2 days.

### H-08 — Case-study schema cannot represent the required case-study template

The PRD requires research inputs, role/constraints, problem framing, options/trade-offs, PRD snapshot, delivery, and outcome learning. The database only stores `problem`, `approach`, and `outcome`; the page fills missing sections with generic invented copy. Gallery records are never rendered.

**Effort:** 2–3 days for a canonical content contract and migration.

### H-09 — Admin settings writes fields the database does not have, and public chrome is hardcoded

The editor uses `bio` and `footer_text`, while the schema uses `biography` and `footer_details`. It also omits navigation labels. Header/Footer continue to hardcode identity, social links, location, copyright, and labels, so successful saves do not update the public site.

**Files:** `client/src/pages/admin/AdminSettings.jsx:26-40,49-63,100`, `supabase/migrations/20260715000001_initial_schema.sql:80-94`, `client/src/components/shared/Header.jsx`, `Footer.jsx`.

**Effort:** 1 day.

### H-10 — SEO feeds are broken and metadata is client-only

`seo.controller.js` queries nonexistent `thinking` and `excerpt` fields (the schema uses `thinking_articles` and `summary`). Errors are ignored, so articles/case studies disappear from dynamic feeds. The static sitemap is hardcoded and will go stale. Page metadata is injected after SPA JavaScript executes, which is unreliable for social crawlers.

**Effort:** 1–2 days for corrected queries, dynamic sitemap generation, and prerender/HTML metadata strategy.

### H-11 — `Button` ignores `asChild`, creating nested interactive elements

`Button.jsx` always renders a `<button>` but dozens of pages pass `asChild` with a nested `<a>`/`NavLink`. This creates invalid nested controls and breaks keyboard semantics/focus behavior across primary CTAs and navigation.

**Files:** `client/src/components/ui/Button.jsx:34-45`, usages in `client/src/pages/**`, `Header.jsx`, `MobileMenu.jsx`.

**Effort:** 0.5–1 day plus accessibility regression checks.

### H-12 — Required privacy page and retention disclosure are missing

There is no `/privacy` route, privacy policy, retention period, or usable consent/analytics disclosure despite the PRD’s mandatory privacy requirement. Add the route, link it from the form/footer, document analytics/contact data and retention, and avoid storing unnecessary metadata.

**Effort:** 0.5–1 day (excluding legal review).

### H-13 — Public resume does not provide the configured PDF download

`resume_url` is loaded into profile state but never used by the Resume page; the only action is browser print/save. This fails the explicit resume PDF/download CTA requirement.

**Files:** `client/src/pages/public/Resume.jsx:13-49`, `client/src/hooks/usePortfolioData.js:58-60`.

**Effort:** 0.5 day.

### H-14 — Security headers and CSRF posture are incomplete

Helmet disables CSP, no HSTS is configured, and the app has no CSRF token/origin enforcement for cookie-authenticated mutations. `SameSite=lax` is weaker than the surrounding comments imply. Add a strict CSP compatible with the app, HSTS at the edge, origin checks/CSRF protection, and secret/config validation.

**Files:** `server/src/app.js:22-36`, `server/src/utils/token.utils.js:9-26`, `vercel.json`.

**Effort:** 1–2 days with deployment verification.

### H-15 — Client fallback marks any Supabase session as owner

`AuthContext` creates a fallback user with `role: 'owner'` whenever `/auth/me` fails. This exposes the admin UI to any authenticated user during API failures and undermines the server-side role model. Remove the privileged client fallback; render an auth-unavailable state instead.

**Files:** `client/src/context/AuthContext.jsx:11-43,104-126`.

**Effort:** 0.5 day.

## Medium findings

- **M-01 — No automated test coverage or authorization matrix.** No test files or CI workflows exist. Add unit, API/RLS integration, and browser tests for public visibility, role boundaries, upload validation, contact spam, and draft preview.
- **M-02 — Lint is red.** `npm run lint` reports 8 errors and 32 warnings, including unescaped JSX entities and many unused imports/variables. Treat lint as a merge gate.
- **M-03 — Runtime health endpoint is not a readiness check.** `/api/health` returns healthy without checking Supabase, Storage, or email dependencies. Add a separate liveness/readiness contract.
- **M-04 — Markdown links accept arbitrary protocols.** `MarkdownRenderer` writes parsed URLs directly to `href`/`src`; allow only `https`, `http`, and approved relative paths, or use a hardened markdown sanitizer.
- **M-05 — Form labels are not reliably associated.** `FormGroup` accepts `htmlFor`, but most callers omit it and the component does not derive it from the child input. This fails an important WCAG form-label check.
- **M-06 — Mobile menu lacks focus management.** No focus trap, Escape handling, `aria-modal`, or body-scroll lock is present.
- **M-07 — Image layout/performance safeguards are incomplete.** Remote images generally lack intrinsic width/height, modern-format negotiation, and a consistent loading strategy, increasing CLS and Core Web Vitals risk.
- **M-08 — Work filters do not implement the full PRD filter set.** Type and tag/search exist, but year and distinct skill/domain filters are not modeled; pagination is client-side over a fixed API fetch of 100 rows.
- **M-09 — Media “unused” detection and counts are incorrect.** It queries nonexistent tables/columns, performs post-pagination filtering, and reports pre-filter counts. Folder/unused pages can therefore be misleading.
- **M-10 — No activity/audit log.** Dashboard activity is derived from updated content rows and does not capture who changed what or when.
- **M-11 — Error responses can expose stack traces when `NODE_ENV` is not exactly production.** Production startup should fail closed on an unsafe environment and never return diagnostic stacks to clients.
- **M-12 — Contact response returns the inserted record.** The unauthenticated submitter receives database id, IP address, user agent, and timestamps; return only a generic acknowledgement.
- **M-13 — Architecture/documentation drift.** README/package metadata claim MongoDB/MERN/Cloudinary and dual JWTs, while the implementation uses Supabase Postgres/Auth/Storage and direct Supabase sessions. Dead Mongo model files, JWT env vars, and Cloudinary dependencies increase maintenance risk.
- **M-14 — Analytics is only optional GA or console logging.** There is no privacy-focused provider integration or consent-aware analytics behavior.
- **M-15 — Gallery, related work, captions, and visual sources are stored but not consistently rendered.** This weakens the editorial and evidence requirements.

## Low findings

- Obsolete `X-XSS-Protection` header is configured in `vercel.json`.
- Numerous unused imports/dependencies and dead configuration paths remain.
- The default Open Graph image is generic Unsplash stock imagery rather than portfolio evidence.
- Source files and seed content contain widespread mojibake encoding (`â€”`, `â€™`, etc.), degrading the public copy and metadata.
- Cookie comments/documentation say 15-minute/dual JWT semantics while implementation uses Supabase session tokens and one-hour access-cookie max age.

## Scorecard

| Area                 |      Score | Rationale                                                                                                                                                            |
| -------------------- | ---------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture         |       4/10 | Clear client/API separation and sensible modules, but storage/auth/schema/documentation drift is substantial.                                                        |
| Code quality         |       4/10 | Reasonable component decomposition, but lint failures, mass assignment, dead code, and inconsistent contracts are release-blocking.                                  |
| Security             |       2/10 | Authentication is not owner-restricted; public RLS/media/contact policies and missing upload controls create material exposure.                                      |
| Performance          |       5/10 | Code splitting, caching, rate limiting, and indexes help; SPA SEO, image sizing, unbounded queries, and in-memory uploads hurt.                                      |
| Accessibility        |       5/10 | Skip link, focus styles, reduced-motion support, labels in some forms, and 44px icon buttons exist; nested buttons/links and incomplete form/menu semantics remain.  |
| Maintainability      |       3/10 | API DTO mismatch, duplicated hardcoded content, stale docs, and incompatible JSON shapes make changes risky.                                                         |
| PRD compliance       |       3/10 | Most route shells exist, but core acceptance criteria for owner-only admin, privacy, draft preview, scheduling, content fidelity, uploads, and resume download fail. |
| Production readiness | **25/100** | Security and correctness blockers must be resolved before launch.                                                                                                    |

## Prioritized implementation plan (approval required before fixes)

1. **Lock down identity and data boundaries:** enforce owner-only authorization; remove client owner fallback; require service-role configuration; fix public PRD visibility and users/media/contact RLS; add anonymous/non-admin/owner tests.
2. **Make storage safe and operational:** create bucket/policies in migration, choose Supabase Storage or Cloudinary, add server-side file limits/type checks, reject failed uploads, and clean up orphaned records.
3. **Unify content contracts:** choose canonical snake_case DTOs or client mappers; migrate PRD sections and article/case-study structures; fix seeded pages and prevent destructive editor conversions.
4. **Restore editorial workflows:** implement signed draft preview, persisted scheduling, publish/unpublish/archive rules, server validation, and allowlisted mutations.
5. **Repair public delivery:** remove production mock fallback, implement actual email delivery or correct copy, wire settings/resume/footer/navigation, add privacy page, and correct SEO feeds/sitemap/metadata.
6. **Fix interaction/accessibility defects:** implement `asChild` correctly or stop using it, associate labels, improve mobile menu focus handling, and verify keyboard/touch behavior.
7. **Raise release quality:** clear lint, add unit/integration/E2E coverage, add readiness checks and CI, run dependency audit with network access, and verify deployment/browser/mobile behavior.

**Final recommendation:** keep the merge blocked until C-01 through C-06 and H-01 through H-06 are remediated and covered by tests.
