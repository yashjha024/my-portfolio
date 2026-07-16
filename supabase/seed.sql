-- ============================================================================
-- PRODUCT MANAGEMENT PORTFOLIO PLATFORM — SUPABASE SEED SCRIPT
-- Script: seed.sql
-- Description: Rich production-ready seed data covering users, site_settings,
--              case_studies, thinking_articles, and prds per PRD Section 6.
-- ============================================================================

-- 1. SEED OWNER USER ACCOUNT
INSERT INTO users (id, email, full_name, role, avatar_url)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'yashjha024@gmail.com',
    'Yash Jha',
    'owner',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url;

-- 2. SEED SITE SETTINGS (SINGLETON ID = 1)
INSERT INTO site_settings (
    id,
    profile_photo_url,
    headline,
    biography,
    email,
    resume_url,
    social_links,
    navigation_labels,
    consent_text,
    footer_details,
    updated_by
)
VALUES (
    1,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    'Product Professional & AI/ML Engineer',
    'Product professional with experience taking digital products from requirement gathering to launch, with hands-on exposure to workflow design, feature scoping, and product analytics. B.Tech in Artificial Intelligence and Machine Learning at Birla Institute of Technology, Mesra (2022–2026).',
    'yashjha024@gmail.com',
    '/resume',
    '{"github": "https://github.com/yashjha024", "linkedin": "https://linkedin.com/in/yashjha024", "twitter": "https://twitter.com/yashjha024"}'::jsonb,
    '{"work": "Work", "thinking": "Product Thinking", "prds": "PRD Library", "about": "About", "resume": "Resume", "contact": "Let''s talk"}'::jsonb,
    'By submitting this contact form, you consent to having your inquiry processed safely in accordance with our privacy practices.',
    '{"location": "Delhi, IN (IST / UTC+5:30)", "status": "Available for select product management and AI/ML engineering opportunities", "copyright": "© 2026 Yash Jha. All rights reserved."}'::jsonb,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO UPDATE SET
    profile_photo_url = EXCLUDED.profile_photo_url,
    headline = EXCLUDED.headline,
    biography = EXCLUDED.biography,
    email = EXCLUDED.email,
    resume_url = EXCLUDED.resume_url,
    social_links = EXCLUDED.social_links,
    navigation_labels = EXCLUDED.navigation_labels,
    updated_by = EXCLUDED.updated_by;

-- 3. SEED CASE STUDIES
INSERT INTO case_studies (
    id,
    slug,
    title,
    summary,
    type,
    status,
    featured,
    sort_order,
    role,
    timeline,
    team,
    domain,
    problem,
    approach,
    outcome,
    metrics,
    tools,
    tags,
    cover_image,
    gallery,
    live_url,
    repo_url,
    author_id,
    published_at
)
VALUES
-- Case Study 1
(
    '11111111-1111-1111-1111-111111111111',
    'kubernetes-cost-governance-platform',
    'Autonomous Kubernetes Cost Governance & Telemetry Control Plane',
    'Architected and led a 0-to-1 enterprise FinOps control plane attributing multi-tenant Kubernetes cluster overhead to specific business units via eBPF telemetry, saving $4.2M annually.',
    'shipped_project',
    'published',
    true,
    1,
    'Lead Technical Product Manager',
    '9 months (Q1 - Q3 2025)',
    '4 Backend Engineers, 2 DevOps/SREs, 1 Product Designer, 1 FinOps Analyst',
    'Enterprise DevOps & Cloud FinOps',
    'Our high-growth SaaS organization ran 14 multi-tenant Kubernetes clusters across AWS and GCP, costing over $14M annually. However, because multiple engineering teams shared the same namespaces and nodes, standard cloud billing reports provided zero visibility into service-level attribution. Teams operated with "infinite compute" mentalities, leading to severe resource overprovisioning (CPU utilization averaged just 18%). When finance mandated a 25% cloud spend reduction during an economic downturn, engineering leadership lacked actionable data to right-size workloads without risking production availability.',
    'We designed an autonomous cloud cost governance control plane. Phase 1 involved building eBPF-based metrics telemetry to accurately attribute shared cluster overhead to specific tenant tags. Phase 2 delivered a self-service developer portal providing daily cost forecasts right inside GitHub PR checks. Phase 3 introduced automated right-sizing recommendations that applied safe, non-breaking vertical pod autoscaling during off-peak windows.',
    'The platform delivered $4.2M in annualized cloud infrastructure savings within 6 months of rollout, exceeding our 25% reduction mandate by $700k. Average Kubernetes cluster CPU utilization increased from 18% to 62% with zero production P0 incidents triggered by resource limits. More importantly, we shifted engineering culture from reactive budget freezes to proactive, cost-aware architecture.',
    '[{"label": "Annualized Cloud Savings", "value": "$4.2M", "change": "+34% vs target", "description": "Direct reduction in AWS/GCP infrastructure spend within 6 months of rollout.", "qualifier": "actual"}, {"label": "Cluster CPU Utilization", "value": "62%", "change": "+44 pts", "description": "Increased from baseline 18% through automated eBPF vertical pod right-sizing.", "qualifier": "actual"}, {"label": "PR Cost Check Adoption", "value": "94%", "change": "0 to 94%", "description": "Percentage of active microservices integrating cost forecast PR co-pilot.", "qualifier": "actual"}]'::jsonb,
    ARRAY['Kubernetes', 'eBPF', 'Go', 'React', 'Prometheus', 'AWS EKS', 'GCP GKE', 'FinOps'],
    ARRAY['FinOps', 'Kubernetes', 'DevOps', 'Cloud Infrastructure', 'Enterprise'],
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop',
    '[{"url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop", "caption": "Real-time cost telemetry dashboard showing namespace-level financial attribution."}, {"url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop", "caption": "GitHub PR Co-pilot intercepting resource spikes before merge."}]'::jsonb,
    'https://github.com/yashjhai',
    'https://github.com/yashjhai',
    '00000000-0000-0000-0000-000000000001',
    '2025-09-15 10:00:00+00'
),
-- Case Study 2
(
    '22222222-2222-2222-2222-222222222222',
    'ai-powered-developer-onboarding',
    'AI-Powered Developer Onboarding & Context Engine',
    'Designed a semantic search and automated code-walkthrough engine that cut new engineer onboarding time from 3 weeks to 3 days across a 400-person engineering org.',
    'product_case_study',
    'published',
    true,
    2,
    'Principal Product Manager',
    '6 months (Q3 - Q4 2024)',
    '3 ML Engineers, 2 Full-Stack Engineers, 1 Developer Advocate',
    'Developer Productivity & AI/ML',
    'As our engineering department scaled from 150 to 400+ developers, new hire onboarding became a major bottleneck. Internal surveys revealed that new engineers spent an average of 14 business days simply figuring out service boundaries, local development prerequisites, and historical architecture decisions buried across 1,200 stale Confluence pages and undocumented Slack threads. Senior staff engineers were losing up to 30% of their weekly capacity answering repetitive tribal-knowledge questions.',
    'We treated internal developer productivity as a core product. We built a RAG (Retrieval-Augmented Generation) context engine that continuously indexed Git repositories, PR discussions, and architectural decision records (ADRs). We deployed an IDE plugin and Slack co-pilot where engineers could ask complex contextual queries ("Why does OrderService use Kafka instead of SQS for payment events?") and receive verified answers with clickable line-number citations.',
    'Time-to-first-merged-PR dropped from 14 business days to 3.2 days across all new cohorts. Senior engineer interruptions decreased by 42%, restoring approximately 1,800 engineering hours per month to core roadmap delivery. Internal Developer Satisfaction (DevSat) scores jumped from 3.1/5 to 4.7/5 within two quarters.',
    '[{"label": "Time-to-First PR", "value": "3.2 days", "change": "-77%", "description": "Reduction from baseline 14 days across all newly hired engineers.", "qualifier": "actual"}, {"label": "Senior Staff Capacity Restored", "value": "1,800 hrs/mo", "change": "+42%", "description": "Reduction in repetitive Slack mentions and onboarding walkthrough syncs.", "qualifier": "actual"}, {"label": "DevSat Score", "value": "4.7 / 5.0", "change": "+1.6 pts", "description": "Internal developer satisfaction survey rating for onboarding experience.", "qualifier": "actual"}]'::jsonb,
    ARRAY['Python', 'LangChain', 'Pinecone Vector DB', 'OpenAI GPT-4', 'React', 'VS Code API'],
    ARRAY['AI/ML', 'Developer Productivity', 'RAG', 'Internal Platforms', 'GenAI'],
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
    '[]'::jsonb,
    'https://github.com/yashjhai',
    'https://github.com/yashjhai',
    '00000000-0000-0000-0000-000000000001',
    '2024-11-20 10:00:00+00'
),
-- Case Study 3
(
    '33333333-3333-3333-3333-333333333333',
    'enterprise-api-gateway-migration',
    'Zero-Downtime Enterprise API Gateway & Mesh Migration',
    'Led the program management and technical strategy for migrating 140+ critical microservices from legacy Kong to Envoy/Istio service mesh with zero customer downtime.',
    'program_case_study',
    'published',
    false,
    3,
    'Staff Program & Product Manager',
    '12 months (2023 - 2024)',
    '8 Platform Engineers, 14 Squad Tech Leads, Security Architecture Team',
    'Platform Engineering & Program Management',
    'Our legacy API gateway architecture suffered from cascading timeouts during peak traffic surges, causing three P0 outages in 2023 that cost over $450,000 in SLA penalties. Moreover, central gateway plugins created a monolithic bottleneck where adding a simple rate-limiting rule required a full cluster redeploy.',
    'Formulated a multi-phase program strategy across 14 independent engineering squads. We established dual-routing canary infrastructure with automated traffic shadowing to validate Envoy performance under live load. We built automated migration scripts and pre-flight validation gates that allowed individual squads to migrate their routes self-service.',
    'Successfully migrated 142 microservices handling 45,000 requests per second with zero customer-facing errors or downtime during cutover windows. P99 API latency improved by 28ms across the board, and our platform availability reached 99.998% over the subsequent 12 months.',
    '[{"label": "Migration Downtime", "value": "0.00 sec", "change": "100% clean", "description": "Zero dropped requests during 142 service cutovers via canary shadowing.", "qualifier": "actual"}, {"label": "P99 Latency Improvement", "value": "28 ms", "change": "-32%", "description": "Reduction in edge proxy processing overhead during peak traffic.", "qualifier": "actual"}, {"label": "SLA Availability", "value": "99.998%", "change": "+0.048 pts", "description": "Sustained uptime over the 12 months following complete migration.", "qualifier": "actual"}]'::jsonb,
    ARRAY['Envoy', 'Istio', 'Kong', 'Kubernetes', 'Terraform', 'Datadog'],
    ARRAY['Platform Engineering', 'Program Management', 'Distributed Systems', 'SRE', 'Security'],
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1200&auto=format&fit=crop',
    '[]'::jsonb,
    'https://github.com/yashjhai',
    'https://github.com/yashjhai',
    '00000000-0000-0000-0000-000000000001',
    '2024-06-10 10:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    status = EXCLUDED.status,
    featured = EXCLUDED.featured,
    metrics = EXCLUDED.metrics,
    tools = EXCLUDED.tools,
    tags = EXCLUDED.tags;

-- 4. SEED THINKING ARTICLES
INSERT INTO thinking_articles (
    id,
    slug,
    title,
    type,
    excerpt,
    body,
    cover_image,
    tags,
    status,
    reading_time,
    disclaimer,
    author_id,
    published_at
)
VALUES
-- Article 1
(
    '44444444-4444-4444-4444-444444444444',
    'improving-whatsapp-group-event-coordination',
    'Product Teardown: Improving WhatsApp Group Event & RSVPs Without the "Golden Cage" Trap',
    'teardown',
    'A deep-dive product teardown and feature proposal addressing the friction of informal group coordination in WhatsApp, featuring user journeys, edge cases, and an experiment design.',
    '### 1. Current Experience & Observed Problem
WhatsApp is the de facto communication backbone for billions of users worldwide, serving as the primary hub for friend groups, family gatherings, community leagues, and informal professional networks. Yet, despite handling billions of group messages daily, organizing a simple social gathering—such as a birthday dinner or soccer match—is plagued by friction.

Currently, group event planning inside WhatsApp relies on unstructured text strings, informal polls, or third-party links (partiful, Google Forms, Luma). When a user asks "Who can make it Saturday at 7 PM?", the group timeline rapidly fragments into a chaotic stream of emojis, side conversations, and delayed replies. The organizer is forced to manually tally RSVPs across dozens of messages while important logistical details (time, location, dress code) get buried under subsequent chat noise.

### 2. Target Audience & Evidence / Assumptions
We segment the core opportunity across two distinct user personas:

* **The Social Organizer (Primary):** Proactive group admins or active members who frequently plan dinners, sports practices, and study sessions. They feel high administrative fatigue and anxiety around attendance tracking.
* **The Busy Participant (Secondary):** Passive group members who want to quickly RSVP without typing long responses or leaving the WhatsApp interface to authenticate on a web tool.

**Key Assumptions & Evidence:**
* *Assumption 1:* Users strongly prefer native in-app coordination over copying/pasting external registration links that break flow and require secondary sign-ins.
* *Assumption 2:* Existing WhatsApp Polls are insufficient for event coordination because they lack date/calendar context, reminder notifications, and location card integration.

### 3. Proposed Feature & User Flow ("WhatsApp Gather")
We propose **WhatsApp Gather**, a lightweight, native event object embedded directly within group chats.

**Step-by-Step User Flow:**
1. **Creation:** From the attachment drawer inside any group chat, a user taps the new **Event** icon alongside Polls and Documents.
2. **Configuration:** The organizer inputs three essential fields: *Title*, *Date/Time*, and *Location* (integrated with WhatsApp''s existing location picker). Optional toggle for *Plus-One RSVPs*.
3. **Inline Card Display:** The event appears in the chat feed as a distinct, high-contrast interactive card displaying live counters: **Going (8)**, **Maybe (2)**, **Can''t Make It (3)**.
4. **One-Tap RSVP:** Members tap their status directly on the card. The card updates dynamically without generating new chat bubbles.
5. **Automated Reminders:** 24 hours and 2 hours before the event, WhatsApp sends a system-level reminder toast only to users who RSVP''d "Going" or "Maybe," eliminating spam for non-attendees.

### 4. Why Now / Business Rationale
While Meta does not directly monetize WhatsApp messaging via consumer ads, defensive retention and utility expansion are critical strategic imperatives:

* **Defending Group Chat Engagement:** Specialized platforms like Partiful, Luma, and Discord are actively siphoning high-value social group activity away from WhatsApp by offering superior event ergonomics.
* **Strengthening SMB & Community Lock-In:** Native events create structured metadata that can later power local business interactions (e.g., reserving a table directly through a WhatsApp Business merchant account connected to the event card).

### 5. Edge Cases, Privacy & Adoption Risks
* **Privacy & Forwarding:** If an event card is forwarded to another group or individual, does the recipient gain access to the original RSVP list? *Decision:* Forwarded event cards strip attendee names by default unless the organizer explicitly checks "Public Event."
* **Spam & Notification Fatigue:** In large 500-person community groups, frequent event creation could overwhelm users. *Mitigation:* Only group admins can create Event cards if the group setting restricted message creation, and reminders only ping RSVP participants.

### 6. MVP vs. Future Scope
| Phase | Target Deliverables |
| :--- | :--- |
| **MVP (V1)** | Inline Event card creation (Title, Time, Location), 3-state RSVP buttons (`Going`, `Maybe`, `No`), auto-pinned to group header until expiration. |
| **V2 (Growth)** | Automatic Google/Apple Calendar sync (`.ics` export), automated push reminders at 24h and 2h pre-event. |
| **V3 (Monetization)** | WhatsApp Pay integration for ticketed community workshops or splitting group restaurant deposits directly on the RSVP card. |

### 7. Success Metrics & Experiment Design
We propose a 4-week randomized A/B rollout across 5% of active WhatsApp groups (approx. 10M groups across diverse geographies like Brazil, India, and UK).

* **Primary North Star Metric:** **Event Completion Rate** (Percentage of created Event cards that achieve >= 3 "Going" RSVPs and reach their scheduled start time without cancellation).
* **Secondary Guardrail Metric:** **Group Daily Active Messages (DAM)** to ensure event cards do not cannibalize organic conversational text replies.
* **Adoption Metric:** **RSVP Conversion Velocity** (Median time taken for group members to respond to an Event card compared to a standard WhatsApp Poll).',
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1200&auto=format&fit=crop',
    ARRAY['Product Teardown', 'Consumer Social', 'UX Strategy', 'WhatsApp', 'Growth'],
    'published',
    '6 min read',
    'Independent product concept & teardown — not affiliated with or endorsed by WhatsApp Inc. or Meta Platforms.',
    '00000000-0000-0000-0000-000000000001',
    '2025-08-10 10:00:00+00'
),
-- Article 2
(
    '55555555-5555-5555-5555-555555555555',
    'why-internal-developer-platforms-fail',
    'Why Internal Developer Platforms (IDPs) Fail: The "Golden Cage" Trap vs. Golden Paths',
    'essay',
    'An analysis of why platform engineering initiatives often stumble when they prioritize rigid abstraction over developer autonomy, and how to design APIs developers actually want to use.',
    'When organizations scale past 200 engineers, leadership almost inevitably mandates the creation of an Internal Developer Platform (IDP). The promise is intoxicating: standardize deployments, enforce security baselines automatically, and liberate application teams from infrastructure toil.

Yet, nearly half of first-generation platform initiatives fail to achieve meaningful adoption. Instead of accelerating delivery, they become bottlenecks that engineers actively circumvent. Why? Because platform teams frequently fall into the **"Golden Cage" trap**.

### The Golden Cage vs. The Golden Path
A Golden Cage occurs when a platform team wraps Kubernetes, AWS, and CI/CD inside a rigid, bespoke web UI or YAML DSL, and then mandates its use across the entire organization. When a product team needs a slightly non-standard Redis configuration or a custom eBPF sidecar, the cage denies them. They are forced to file JIRA tickets against the platform team, recreating the exact IT silo the IDP was meant to eliminate.

In contrast, a **Golden Path** is an opinionated, highly paved route built on top of thick APIs and thin interfaces. It provides self-service defaults that are so fast and reliable that 90% of teams voluntarily choose them. But crucially, if a specialized squad needs to step off the path to directly configure raw Terraform or Kubernetes resources, they can do so safely using clear breakout contracts without breaking organizational compliance.',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop',
    ARRAY['Platform Engineering', 'Developer Experience', 'Product Strategy', 'DevOps', 'System Architecture'],
    'published',
    '5 min read',
    NULL,
    '00000000-0000-0000-0000-000000000001',
    '2025-04-18 10:00:00+00'
),
-- Article 3
(
    '66666666-6666-6666-6666-666666666666',
    'data-driven-prioritization-in-high-uncertainty-environments',
    'Data-Driven Prioritization in High-Uncertainty Environments: Beyond RICE and WSJF',
    'essay',
    'Traditional scoring frameworks break down when entering zero-to-one problem spaces. Here is how high-performing technical PMs balance quantitative telemetry with qualitative conviction.',
    'In mature optimization domains, prioritization frameworks like RICE (Reach, Impact, Confidence, Effort) and WSJF (Weighted Shortest Job First) provide valuable objective structure. But when building 0-to-1 platform infrastructure or AI systems, strictly mathematical scoring models often lead product managers astray.

### The Illusion of False Precision
When assigning a "Confidence" score of 80% to a feature whose underlying technical feasibility has never been proven at scale, you are not being data-driven—you are indulging in false precision. In high-uncertainty technical environments, the highest priority is not shipping the feature with the highest projected reach; it is systematically retiring your highest-impact risks first.

### The Risk-Retirement Matrix
Instead of static spreadsheets, Staff Technical PMs evaluate roadmap items across three dynamic risk vectors:
1. **Technical Feasibility Risk:** Can our current architecture or latency budget support this without P0 regressions?
2. **Adoption Friction Risk:** Does this require developers or customers to alter their core daily workflow?
3. **Unit Economics Risk:** What is the compute/LLM token cost per query at 100x our current volume?',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=1200&auto=format&fit=crop',
    ARRAY['Product Leadership', 'Roadmapping', '0-to-1', 'Decision Making', 'Staff PM'],
    'published',
    '7 min read',
    NULL,
    '00000000-0000-0000-0000-000000000001',
    '2025-01-22 10:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    body = EXCLUDED.body,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags;

-- 5. SEED PRD LIBRARY
INSERT INTO prds (
    id,
    slug,
    title,
    stage,
    visibility,
    context,
    sections,
    pdf_url,
    related_case_study_id,
    author_id,
    status
)
VALUES
-- PRD 1
(
    '77777777-7777-7777-7777-777777777777',
    'real-time-anomaly-detection-pipeline',
    'PRD: Real-Time Telemetry Anomaly Detection & Auto-Remediation Pipeline',
    'Approved',
    'public',
    'Our cloud infrastructure monitoring currently alerts SREs only after static thresholds (e.g., CPU > 85% for 5 minutes) are breached. In high-throughput microservices, static thresholds cause severe alert fatigue during predictable traffic surges and fail to catch subtle memory leaks during low-traffic windows. We require an adaptive, machine-learning-based anomaly detection pipeline that learns seasonal traffic patterns and automatically triggers safe remediation actions.',
    '{"problem": "Static monitoring thresholds generate 340+ false-positive pages per week across our 14 squad SRE rotations while missing early-warning indicators of cascading memory exhaustion.", "goals": ["Reduce false-positive SRE paging alerts by at least 60% within 90 days of rollout.", "Detect anomalous memory/latency trends 12 minutes faster than static P0 threshold alarms.", "Enable automated non-destructive remediation (vertical pod autoscaling or canary rollback) for verified anomalies with > 95% confidence."], "nonGoals": ["Replacing Grafana/Datadog dashboards for human ad-hoc debugging.", "Automating destructive database failovers without manual SRE approval confirmation."], "requirements": [{"id": "REQ-01", "name": "Streaming Telemetry Ingestion", "priority": "P0", "userStory": "As the platform telemetry engine, I need to ingest 150,000 metrics per second from Prometheus/OpenTelemetry firehoses with < 500ms processing latency.", "acceptanceCriteria": ["Must ingest via Kafka partitioning with zero dropped samples under 200k req/sec burst load.", "Memory overhead must not exceed 4GB per ingestion worker node."]}, {"id": "REQ-02", "name": "Seasonal Baseline ML Model", "priority": "P0", "userStory": "As an SRE, I want the anomaly engine to automatically learn 7-day cyclical traffic patterns so that normal Monday morning traffic spikes do not trigger alerts.", "acceptanceCriteria": ["Model must recalculate hourly rolling quantiles (P95/P99) automatically.", "Must support manual holiday/event override exclusion windows."]}, {"id": "REQ-03", "name": "Safe Automated Remediation Webhooks", "priority": "P1", "userStory": "As a Service Owner, I want the anomaly engine to trigger an automated pod restart if a memory leak anomaly is confirmed for > 3 minutes.", "acceptanceCriteria": ["Remediation webhook must verify pod health checks before taking action.", "Must post audit log card directly to squad Slack channel within 5 seconds of execution."]}], "metrics": [{"name": "False-Positive Paging Rate", "target": "-60% reduction in off-hours SRE alerts"}, {"name": "Mean Time to Detection (MTTD)", "target": "< 90 seconds from anomalous spike initiation"}, {"name": "Auto-Remediation Success Rate", "target": "> 98% clean recovery without human intervention"}], "releaseGates": [{"name": "Canary Shadow Testing", "status": "Passed", "criteria": "Run in shadow mode alongside static alerts for 14 days with zero false negatives."}, {"name": "Security & RBAC Review", "status": "Passed", "criteria": "Remediation webhooks authenticated via mTLS with least-privilege Kubernetes roles."}]}'::jsonb,
    '/docs/real-time-anomaly-detection-prd.pdf',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'published'
),
-- PRD 2
(
    '88888888-8888-8888-8888-888888888888',
    'self-service-api-key-lifecycle-management',
    'PRD: Self-Service Enterprise API Key & Service Account Lifecycle Management',
    'Approved',
    'public',
    'Enterprise customers need secure, programmatic access to our platform APIs using granular scoped tokens, automated rotation workflows, and immediate revocation controls without contacting customer support.',
    '{"problem": "Customers currently generate a single master API key with unrestricted read/write permissions across all account workspaces. If a developer accidentally leaks this key into a public GitHub repository, the entire enterprise account is compromised.", "goals": ["Enable self-service creation of fine-grained, role-scoped API tokens with custom expiration policies.", "Provide automatic GitHub Secret Scanning partner integration to instantly revoke leaked keys within 60 seconds.", "Eliminate 100% of customer support tickets related to manual API key rotation and permission adjustments."], "nonGoals": ["Building a full consumer OAuth 2.0 identity provider for third-party marketplace apps."], "requirements": [{"id": "REQ-101", "name": "Granular Scope Selection Matrix", "priority": "P0", "userStory": "As an organization admin, I want to restrict an API key to strictly read-only access for a specific billing namespace.", "acceptanceCriteria": ["UI must display checkbox matrix for resource permissions (`read`, `write`, `delete`).", "Enforced at API gateway proxy layer via JWT claims check inside 5ms."]}, {"id": "REQ-102", "name": "Automated Key Expiry & Expiry Warnings", "priority": "P0", "userStory": "As a security compliance officer, I want all service account keys to expire after 90 days by default with automated email warnings at 14, 7, and 1 day pre-expiry.", "acceptanceCriteria": ["System must block creation of non-expiring keys for SOC2 compliance tier accounts.", "Must send automated webhook/email notification with one-click rotation link."]}], "metrics": [{"name": "Zero Leak Compromises", "target": "100% containment of leaked keys via automatic GitHub Secret Scanning partner integration"}], "releaseGates": [{"name": "Penetration Testing", "status": "Passed", "criteria": "Third-party security audit verifying no scope escalation vulnerabilities."}]}'::jsonb,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    context = EXCLUDED.context,
    sections = EXCLUDED.sections,
    status = EXCLUDED.status;
