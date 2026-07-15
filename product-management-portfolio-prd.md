# Product / Program Management Portfolio — Product Requirements Document

**Version:** 1.0  
**Status:** Build-ready specification  
**Owner:** You  
**Primary goal:** Help a hiring manager quickly trust that an engineering-background candidate can think, communicate, and deliver like a Product or Program Manager.

---

## 1. Product summary

Build a polished personal portfolio that turns product work into evidence. It should present PRDs, shipped projects, product teardowns, feature proposals (for example, a WhatsApp improvement), and your thinking process—not simply a list of skills.

The public site is fast, editorial, interactive, and easy to scan. A private admin area lets only you create, edit, publish, schedule, or hide portfolio content without code changes.

### Product promise

> “I translate technical possibilities into clear customer value, aligned execution, and measurable outcomes.”

### Primary calls to action

1. **View case studies** — for recruiters/hiring managers.
2. **Read product thinking** — for deeper evaluators.
3. **Download resume** — for an application-ready record.
4. **Contact me** — email and LinkedIn; optional meeting link.

---

## 2. Users and jobs to be done

| User                          | Their need                                   | Website response                                                  |
| ----------------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| Recruiter                     | Assess fit in under two minutes              | Strong hero, role positioning, skills, selected work, resume CTA  |
| Product leader / interviewer  | Evaluate product judgement and communication | Structured case studies, PRDs, trade-offs, metrics, decisions     |
| Engineering leader            | Validate technical credibility and execution | Architecture context, delivery constraints, shipped links, GitHub |
| Peer / potential collaborator | Understand what you care about               | About story, working style, contact path                          |
| You (admin)                   | Add work without redeploying code            | Secure admin dashboard, draft/publish workflow, media upload      |

### Success criteria

- A visitor can understand your target role and strongest evidence in **30 seconds**.
- A recruiter can find your resume/contact details from every page in **one click**.
- You can publish a new case study in **under 15 minutes** once its assets are ready.
- The site works well on mobile, keyboard navigation, and slow networks.
- Unauthenticated visitors cannot access any admin route, draft, or upload function.

---

## 3. Scope

### MVP (launch first)

- Responsive public portfolio and SEO metadata.
- Home, Work, Case Study, Product Thinking, About, Contact, and Resume pages.
- Content types: case study, product teardown, feature proposal, PRD artifact, project link.
- Searchable/filterable work index.
- Passwordless/private admin sign-in and content CRUD.
- Draft, published, and archived states; preview before publish.
- Image/PDF upload, external links, analytics, contact form, privacy-safe spam controls.

### Later releases

- Reading-time and saved/favourite articles.
- Newsletter (only after you consistently publish).
- Embedded interactive prototypes, Figma embeds, and video walkthroughs.
- Case-study “compare decisions” interactions and downloadable one-page summaries.
- AI-assisted draft outlines in the private admin—never auto-published.

### Explicitly out of scope for v1

- Public user accounts, comments, social feed, job board, payments, or a complex CMS marketplace.
- A public API.
- A bespoke analytics dashboard; use provider dashboards initially.

---

## 4. Information architecture

```text
Public
├── /                         Home
├── /work                     All case studies & shipped projects
│   └── /work/[slug]          Individual case study
├── /thinking                 Product teardowns & feature proposals
│   └── /thinking/[slug]      Individual article
├── /prds                     PRD library (optional public index)
│   └── /prds/[slug]          Read/download PRD
├── /about                    Story, principles, skills, timeline
├── /resume                   Browser-friendly resume + PDF download
└── /contact                  Contact form and direct links

Private
├── /admin                    Dashboard
├── /admin/work               Manage case studies
├── /admin/thinking           Manage articles
├── /admin/prds               Manage PRDs/files
├── /admin/media              Manage uploads
└── /admin/settings           Profile, navigation, site settings
```

### Navigation

- Desktop: sticky top navigation with **Work**, **Product Thinking**, **About**, plus a primary **Let’s talk** button.
- Mobile: compact header with an accessible menu; the resume/contact CTA remains visible after opening the menu.
- Use a footer with email, LinkedIn, GitHub, resume, location/time-zone, and copyright.
- Home section anchors are allowed, but every major item must also have a stable, shareable route.

---

## 5. Public experience and UI/UX direction

### Visual personality

Modern, calm, and product-led—not a developer-template portfolio. Think “well-edited product memo” mixed with a premium editorial website:

- **Layout:** generous white/near-black space, 12-column desktop grid, intentional asymmetry only for emphasis.
- **Typography:** a crisp sans-serif for interface text (e.g., Inter/Geist) and optionally a characterful display face only for hero statements. Keep body text highly readable.
- **Colour:** neutral base with one restrained accent colour. Use the accent for status, highlights, and interactive states—not for large decorative gradients.
- **Motion:** subtle hover elevation, staggered reveal on first view, and an optional progress indicator on long case studies. Respect `prefers-reduced-motion`.
- **Imagery:** product screenshots, diagrams, lightweight before/after comparisons, and thumbnails—not generic stock photos.
- **Tone:** direct, curious, evidence-based. Avoid inflated adjectives such as “revolutionary.”

### Home page blocks, in order

1. **Hero:** name, desired role (“Aspiring Product / Program Manager with an engineering foundation”), 1–2 sentence value proposition, CTAs.
2. **Proof strip:** 3 concise proof points (e.g., projects shipped, domains explored, systems/processes improved). Only use verified numbers.
3. **Selected work:** 3–4 featured case-study cards.
4. **How I work:** Discover → Define → Deliver → Learn, with one sentence each.
5. **Product thinking:** latest teardown/feature-proposal cards.
6. **Engineering-to-product narrative:** a short transition story; link to About.
7. **Final CTA:** “Building something useful? Let’s talk.”

### Work index

- Grid/list toggle is optional; use a responsive card grid by default.
- Filters: **Type** (Shipped Project, Product Case Study, Program), **Domain**, **Skill** (Discovery, PRD, Analytics, Delivery), and **Year**.
- Each card includes type, title, one-line problem, role, outcome, tags, and visual thumbnail.
- Do not hide key information behind hover-only effects.

### Case study page template

1. Hero: title, product/domain, role, timeline, collaborators, scope, external live link.
2. **The opportunity:** user/problem and why it mattered.
3. **My role & constraints:** exactly what you owned; show uncertainty honestly.
4. **Research / inputs:** interviews, desk research, data, assumptions (with source labels).
5. **Problem framing:** persona, journey, pain point, and “How might we…” statement.
6. **Options & decision:** 2–3 options, trade-offs, selection rationale.
7. **PRD snapshot:** goal, non-goals, key requirements, success metrics.
8. **Delivery:** roadmap, dependencies, risks, launch plan, or architecture context.
9. **Outcome & learning:** results, what changed, what you would do differently. Use “expected impact” rather than fake results for conceptual work.
10. Links: prototype, deployed product, GitHub, full PRD; related work; contact CTA.

### Product Thinking template

Use this for teardowns and feature proposals such as “Improving WhatsApp group-event coordination.” Clearly label it as **Independent product concept — not affiliated with WhatsApp/Meta**.

1. Current experience and observed problem.
2. Target audience and evidence/assumptions.
3. Proposed feature and user flow.
4. Why now / business rationale.
5. Edge cases, privacy, misuse, and adoption risks.
6. MVP versus future scope.
7. Success metrics and experiment design.
8. A small annotated prototype or journey diagram.

### Accessibility and quality bar

- Meet WCAG 2.2 AA where practical: semantic landmarks, visible focus, contrast, alt text, form labels, keyboard navigation.
- Tap targets at least 44×44px on touch interfaces.
- No critical content or navigation available only through animation/hover.
- Aim for excellent Core Web Vitals: pre-sized images, modern image formats, minimal client JavaScript, font loading strategy.

---

## 6. Content model

All editable content must live in the database/CMS, except stable presentation components.

### CaseStudy

| Field                                  | Notes                                                         |
| -------------------------------------- | ------------------------------------------------------------- |
| title, slug, summary                   | Title, URL-safe identifier, 140–180-character elevator pitch  |
| type                                   | `shipped_project`, `product_case_study`, `program_case_study` |
| status                                 | `draft`, `scheduled`, `published`, `archived`                 |
| featured, sortOrder                    | Home-page control                                             |
| role, timeline, team, domain           | Metadata shown near the hero                                  |
| problem, approach, outcome             | Markdown/rich-text sections                                   |
| metrics                                | Label, value, qualifier (`actual`, `estimated`, `learning`)   |
| tools, tags                            | Filters and credibility                                       |
| coverImage, gallery                    | Optimised media references with alt text                      |
| liveUrl, repoUrl, prototypeUrl, prdUrl | Validated external links                                      |
| seoTitle, seoDescription, ogImage      | Defaults generated from content, editable                     |

### Article / product thinking

`title`, `slug`, `type` (`teardown`, `feature_proposal`, `essay`), `excerpt`, `body`, `coverImage`, `tags`, `status`, `publishedAt`, `readingTime`, `disclaimer`, `relatedWork`.

### PRD artifact

`title`, `slug`, `context`, `stage`, `visibility` (`public`, `unlisted`, `private`), structured PRD fields, optional PDF, related case study, status. Use unlisted/private for sensitive work; never publish confidential employer material.

### Site settings

Profile photo, headline, biography, email, social links, resume file, navigation labels, consent text, and footer details.

### Editorial rules

- Identify conceptual work and assumptions plainly.
- Remove customer names, internal screenshots, credentials, API keys, and confidential metrics.
- For every result, state source and measurement window—or label it a hypothesis.
- Always include alt text and a one-line caption/source for meaningful visuals.

---

## 7. Recommended technical architecture

This is the best balance of modern UI, full-stack capability, low maintenance, and learning value:

| Layer            | Recommendation                                   | Why                                                                |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| App              | **Next.js + TypeScript**                         | One codebase for public pages, admin, APIs/server actions, and SEO |
| UI               | Tailwind CSS + a small accessible component set  | Fast custom design without a heavy visual builder                  |
| Database         | Supabase Postgres                                | Managed relational data, authentication, row-level security        |
| File storage     | Supabase Storage                                 | Images/PDFs alongside database access policies                     |
| Authentication   | Supabase Auth, Google/GitHub OAuth or magic link | Private admin without storing passwords yourself                   |
| Validation       | Zod                                              | Validate all server and form inputs                                |
| ORM/query layer  | Supabase server client or Drizzle                | Type-safe access patterns                                          |
| Hosting          | Vercel                                           | Simple Next.js deployment, previews, edge/CDN delivery             |
| Email            | Resend (or comparable transactional provider)    | Contact-form delivery without exposing your mailbox                |
| Analytics        | Privacy-focused analytics or Vercel Analytics    | Understand interest without adding ad-tech bloat                   |
| Error monitoring | Sentry (optional at MVP)                         | Catch runtime failures after launch                                |

### Why not start with a traditional MERN stack?

You _can_, but React + Express + MongoDB creates two deployable applications and more operations work. For a solo portfolio, Next.js provides the React experience plus backend routes in one secure application. It still demonstrates full-stack thinking. Use a separate API only if a future requirement genuinely needs it.

### High-level data flow

```text
Visitor → CDN-hosted public Next.js pages → server-side data read → Supabase Postgres/Storage
Admin → authenticated /admin UI → server action/API → validation → authorization → database/storage
Contact form → validated server route → rate limit + spam check → email provider → your inbox
```

---

## 8. Developer/admin access design

Interpret “developer access” as a **private owner console**, not a public developer portal.

### Access roles

| Role                    | Who                  | Permissions                                               |
| ----------------------- | -------------------- | --------------------------------------------------------- |
| Visitor                 | Everyone             | Read published public content only                        |
| Owner/Admin             | You                  | Full content/media/settings control, publish/unpublish    |
| Editor (optional later) | Trusted collaborator | Create/edit drafts; cannot alter settings or invite users |

For v1, create only your owner account. Adding multiple roles before you need them increases security risk and complexity.

### Admin features

- Dashboard: content counts, draft reminders, recent activity, quick-create buttons.
- Editor: autosave draft, validation checklist, live preview, publish/schedule/unpublish.
- Media: drag/drop upload, crop/alt text, delete unused media only after confirmation.
- Content table: filters by type/status; duplicate an existing case study as a template.
- Activity log: who changed what, when (important if you add an editor).
- Settings: social links, resume PDF, email destination, feature flags.

### Secure cloud setup

1. Create a Supabase project; configure OAuth/magic-link redirects only for your production and local URLs.
2. Add yourself as `admin` in a protected `profiles` table linked to Supabase Auth user ID.
3. Protect `/admin/**` in server-side middleware and re-check authorization in every write action.
4. Apply Row Level Security (RLS): public can read only `published` rows; only admins can create/update/delete; storage uploads require admin role.
5. Store secrets (database keys, email API key, CAPTCHA secret) only in Vercel/Supabase environment variables—never in source code or `NEXT_PUBLIC_*` variables.
6. Deploy production from `main`; use Vercel preview deployments for pull requests. Never use the production database for experimental schema changes without a migration/backup.

---

## 9. Security, privacy, and reliability requirements

### Mandatory controls

- Server-side authorization for every content mutation; hiding an admin button is not security.
- RLS enabled on every public database table and storage bucket; test with an anonymous user.
- Allowlist image upload types/size; generate safe filenames; block executable/SVG uploads unless sanitised.
- Validate inputs with schemas; encode/render rich text safely to prevent XSS.
- Rate-limit contact form and login-sensitive routes; add honeypot or Turnstile/CAPTCHA to contact form.
- Use HTTPS-only deployment, secure cookies, CSRF-aware server patterns, security headers, and least-privilege service keys.
- Do not use a service-role database key in browser code. Keep it limited to trusted server-only operations.
- Log authentication/admin failures without recording email body, tokens, or other sensitive content.
- Add a privacy page explaining analytics, contact-form data, and retention.

### Content and professional safety

- Do not publish any proprietary work without written permission.
- Anonymise user research and company data; redact screenshots.
- Place brand/trademark disclaimers on third-party product concepts.
- Maintain backups: database backups plus a monthly export of CMS content/media inventory.

---

## 10. Suggested app folder structure

```text
portfolio/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── work/page.tsx
│   │   ├── work/[slug]/page.tsx
│   │   ├── thinking/page.tsx
│   │   ├── thinking/[slug]/page.tsx
│   │   ├── prds/[slug]/page.tsx
│   │   ├── about/page.tsx
│   │   ├── resume/page.tsx
│   │   └── contact/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── work/[id]/page.tsx
│   │   ├── thinking/[id]/page.tsx
│   │   ├── prds/[id]/page.tsx
│   │   ├── media/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── contact/route.ts
│   │   └── health/route.ts
│   ├── layout.tsx
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── public/             # Hero, cards, filters, prose blocks
│   ├── admin/              # Editor, table, media picker
│   ├── ui/                 # Buttons, inputs, dialogs, primitives
│   └── shared/             # Header, footer, analytics
├── content/                # Optional seed/demo content only
├── lib/
│   ├── auth.ts
│   ├── supabase/
│   ├── queries/
│   ├── actions/
│   ├── validation/
│   ├── security/
│   └── utils.ts
├── types/
├── public/
│   ├── resume/
│   └── images/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── middleware.ts
├── .env.example
└── README.md
```

**Convention:** Keep database queries and mutations out of visual components. Components receive typed data; server actions/routes own validation and authorization. This makes the project easier to reason about and present in interviews.

---

## 11. Delivery phases

### Phase 0 — Positioning and content inventory (2–3 days)

- Choose target headline: Product Manager, Program Manager, or a precise hybrid.
- Create an inventory of 3–5 strongest projects and 2 product-thinking pieces.
- For each, capture problem, role, evidence, outcome, assets, public permissions, and links.
- Choose domain, personal email, LinkedIn/GitHub URLs, resume PDF, and a professional headshot (optional).

**Exit condition:** approved navigation, visual direction, and content backlog.

### Phase 1 — Foundation and design system (3–5 days)

- Initialise Next.js/TypeScript, linting, formatting, test setup, deployment preview.
- Build responsive shell, tokens, typography, buttons, cards, and accessible navigation.
- Build static versions of Home, Work index, Case Study, Thinking, About, Contact, Resume.

**Exit condition:** polished static site runs on desktop and mobile with placeholder data.

### Phase 2 — Content and public launch candidate (4–7 days)

- Add your first 3 strong case studies and 2 product-thinking posts.
- Add SEO metadata, sitemap, social previews, analytics, performance optimisations.
- QA copy, links, responsiveness, accessibility, and real devices.

**Exit condition:** a recruiter can assess you without admin functionality.

### Phase 3 — Secure admin (4–6 days)

- Set up Supabase schema, migrations, auth, RLS, protected storage, and owner role.
- Build admin CRUD, draft/publish, preview, upload, and content validation.
- Run authorization tests for anonymous, logged-in non-admin, and admin users.

**Exit condition:** only you can manage all live content safely.

### Phase 4 — Launch and learn (1–2 days, then ongoing)

- Configure custom domain, production environment variables, backups, error monitoring.
- Validate forms, analytics, social share image, 404/500 states, Lighthouse/accessibility.
- Share selectively; inspect which case studies get attention; improve the first screen and CTAs.

---

## 12. Acceptance criteria

### Public site

- All required routes render with valid titles, descriptions, canonical URLs, Open Graph image, sitemap and robots configuration.
- Visitors can browse and filter content without signing in.
- Published content is visible; drafts, scheduled items, private PRDs and private media return no data to visitors.
- Every case study exposes role, problem, approach, decisions, outcome/learning, and relevant links.
- Contact form validates input, provides accessible success/error feedback, and cannot be used for simple spam bursts.
- Website is responsive from 320px width upward and works by keyboard.

### Admin

- An anonymous visitor is redirected away from `/admin` and receives no admin data.
- An authenticated non-admin is denied all write/admin actions.
- Owner can create a draft, preview it, publish it, unpublish it, edit it, and archive it.
- All server mutations validate data and enforce admin permission server-side.
- Upload fails safely for disallowed file types/sizes; public assets are delivered only as intended.

### Launch quality

- No console errors, broken links, exposed secrets, placeholder copy, or missing alt text on meaningful images.
- At least two current browsers and an iOS/Android viewport are checked.
- A backup/restore procedure and `README` setup instructions exist.

---

## 13. Portfolio content starter backlog

Prioritise depth over quantity. Five honest, well-structured pieces outperform 15 shallow cards.

1. **Flagship shipped project:** your strongest deployed product; include a live link and technical/product role split.
2. **Engineering-to-PM case study:** show how you defined a problem, wrote requirements, coordinated delivery, and measured learning.
3. **Program management case study:** a cross-team initiative with timeline, dependencies, risks, cadence, and outcome.
4. **WhatsApp feature proposal:** choose one narrow problem (e.g., reducing group-message overload during event planning) and specify users, flows, abuse/privacy risks, metrics, MVP.
5. **Teardown:** improve one real product workflow; distinguish evidence from assumptions.
6. **PRD library:** one public, well-redacted PRD with scope, non-goals, requirements, launch plan, and metrics.

### A practical writing checklist for every piece

- What specific user/business problem exists?
- What did I personally own?
- What evidence informed the decision?
- What did we _not_ build, and why?
- What trade-off or risk did I manage?
- What changed, or how would I measure expected change?
- What did I learn?

---

## 14. Decisions to make before implementation

These do not block planning, but select them before Phase 1:

1. **Positioning:** lead as “Product Manager,” “Program Manager,” or “Technical Product / Program Manager.” My recommendation: **Technical Product / Program Manager** initially; it makes your engineering background an asset rather than something to hide.
2. **Content visibility:** which work is public, anonymised, unlisted, or omitted due to confidentiality.
3. **Admin identity provider:** Google sign-in is simplest if it is your personal site; magic link is a strong fallback.
4. **Visual brand:** dark editorial versus light editorial. Recommendation: light/neutral default with an optional dark mode later—the work remains easier to read and screenshot.
5. **Domain:** use `firstnamelastname.com` if available; avoid clever domains that are difficult to spell.

---

## 15. First implementation order

1. Write the first three case-study outlines in the template above.
2. Design and build the public static site with the exact final content.
3. Publish the public site and test it with two people who recruit/hire.
4. Add the admin system only after the public information architecture has proven useful.

That order prevents the common trap of building an impressive CMS for content that has not yet been shaped. Your differentiator is clear product judgement, not the number of technologies in the stack.
