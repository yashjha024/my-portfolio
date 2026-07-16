export const profileData = {
  name: 'Yash Jha',
  role: 'Product Professional & AI/ML Engineer',
  elevatorPitch:
    'Product professional with experience taking digital products from requirement gathering to launch, with hands-on exposure to workflow design, feature scoping, and product analytics.',
  bio: 'B.Tech in Artificial Intelligence and Machine Learning at Birla Institute of Technology, Mesra (2022–2026). Comfortable working at the intersection of business needs and technical execution, with a proven track record of delivering live platforms in learning (Istockly), industrial commerce (Diptech Technologies), and cross-domain AI research pipelines (NIT Patna).',
  email: 'yashjha024@gmail.com',
  phone: '+91-7759831707',
  linkedin: 'https://linkedin.com/in/yashjha024',
  github: 'https://github.com/yashjha024',
  location: 'Delhi, IN / Remote',
  proofPoints: [
    {
      metric: '20–25% Cut',
      label: 'Operational Friction',
      description:
        'Reduced workflow clarity friction & manual documentation effort across production LMS and industrial commerce platforms.',
    },
    {
      metric: '5 Core Journeys',
      label: 'Platform Workflow',
      description:
        'Owned end-to-end workflow definition covering discovery, ordering, partial payments, loans, and after-sales service.',
    },
    {
      metric: '4 Key KPIs',
      label: 'Analytics Visibility',
      description:
        'Architected real-time dashboard visibility cutting manual reporting effort by 25% and accelerating pricing decisions.',
    },
  ],
};

export const caseStudies = [
  {
    id: 'cs-1',
    slug: 'kubernetes-cost-governance-platform',
    title: 'Autonomous Cloud FinOps & Kubernetes Cost Governance Platform',
    summary:
      'Engineered and launched an automated cost attribution and anomaly governance platform that reduced enterprise AWS/GCP spend by $4.2M annually without engineering velocity drag.',
    type: 'shipped_project',
    status: 'published',
    featured: true,
    sortOrder: 1,
    domain: 'Cloud FinOps / Platform Eng',
    role: 'Lead Product Manager & Principal Architect',
    timeline: 'Q1 2024 - Q3 2024 (7 months)',
    team: '4 Backend Eng, 2 Frontend Eng, 1 FinOps Analyst, 1 Product Designer',
    problem:
      'Our high-growth SaaS platform was scaling its multi-region Kubernetes clusters by 300% year-over-year. Unallocated container spend grew to $14M/year, with over 45% of cluster compute sitting idle due to over-provisioned CPU limits and orphaned staging namespaces. Engineering teams lacked real-time visibility into their namespace costs, and finance had zero levers to enforce budget boundaries without causing production outages.',
    approach:
      'We designed an autonomous cloud cost governance control plane. Phase 1 involved building eBPF-based metrics telemetry to accurately attribute shared cluster overhead to specific tenant tags. Phase 2 delivered a self-service developer portal providing daily cost forecasts right inside GitHub PR checks. Phase 3 introduced automated right-sizing recommendations that applied safe, non-breaking vertical pod autoscaling during off-peak windows.',
    outcome:
      'Within 90 days of general availability across 40 engineering squads, annualized cloud spend fell by $4.2M (a 30% reduction). Moreover, developer confidence scores increased by 65% because cost attribution was surfaced transparently during code review rather than as end-of-quarter reprimands.',
    metrics: [
      { label: 'Annual Cloud Savings', value: '$4.2M', qualifier: 'actual' },
      { label: 'Idle Compute Reduction', value: '38%', qualifier: 'actual' },
      { label: 'PR Cost Check Adoption', value: '94%', qualifier: 'actual' },
    ],
    tools: ['Kubernetes', 'Go', 'Prometheus/OpenTelemetry', 'React 19', 'eBPF', 'AWS FinOps'],
    tags: ['Platform Engineering', 'FinOps', 'Kubernetes', '0-to-1 Launch'],
    coverImage:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    liveUrl: 'https://github.com/yashjha024',
    repoUrl: 'https://github.com/yashjha024',
    prdUrl: '/prds/real-time-anomaly-detection-pipeline',
    opportunity:
      'Cloud compute represents our second-highest COGS line item after payroll. By treating infrastructure efficiency as a first-class developer experience rather than a top-down finance mandate, we unlocked millions in runway while accelerating engineering hygiene.',
    roleConstraints:
      'I owned the end-to-end product strategy, financial modeling, technical architecture evaluation, and cross-functional go-to-market. Key constraints included zero tolerance for production latency degradation and strict GDPR data boundary enforcement across US and EU data centers.',
    researchInputs:
      'Conducted 28 structured interviews with engineering directors and site reliability leads. Key finding: 82% of engineers wanted to optimize their containers but had no easy way to test CPU throttling risks before deploying to staging.',
    problemFraming:
      'How might we provide software engineers with high-confidence, automated container right-sizing recommendations directly in their git workflow, so that cost governance happens continuously rather than reactively?',
    optionsDecision:
      'We evaluated three options: (1) Vendor SaaS integration (rejected: $350k/yr licensing and rigid RBAC); (2) Manual monthly spreadsheet audits (rejected: high friction, stale data); (3) Custom eBPF telemetry + GitHub check co-pilot (selected: high accuracy, zero developer friction, complete IP ownership).',
    prdSnapshot: {
      goal: 'Automate container cost attribution and right-sizing without impacting 99.99% service SLOs.',
      nonGoals: [
        'Automating spot-instance evictions for stateful databases',
        'Multi-cloud billing negotiation',
      ],
      requirements: [
        'Real-time cost per request attribution via OpenTelemetry trace headers',
        'Automated PR comments showing estimated monthly delta for modified deployment YAMLs',
        '1-click rollback dashboard for any vertical pod autoscaler adjustment',
      ],
      successMetrics: [
        '$3M+ annualized savings within 6 months',
        'Zero P0/P1 incidents triggered by right-sizing actions',
      ],
    },
    delivery:
      'Delivered in 3 strict milestone sprints using trunk-based development. Milestone 1 focused on read-only telemetry and dashboard accuracy validation. Milestone 2 enabled PR check notifications in advisory mode. Milestone 3 unlocked autonomous right-sizing for staging environments, followed by production rollout.',
    outcomeLearning:
      'The biggest lesson was that engineers are natural optimizers when given immediate feedback loops. We underestimated how competitive teams would become about improving their squad efficiency scores on the public engineering leaderboard.',
  },
  {
    id: 'cs-2',
    slug: 'ai-powered-developer-onboarding',
    title: 'AI-Powered Technical Onboarding Co-Pilot for Enterprise Engineering',
    summary:
      'Created an internal context-aware AI assistant that indexed 4 million lines of legacy code and internal docs, reducing new hire time-to-first-commit from 22 days to 3.5 days.',
    type: 'product_case_study',
    status: 'published',
    featured: true,
    sortOrder: 2,
    domain: 'Developer Productivity / AI',
    role: 'Principal Product Manager',
    timeline: 'Q4 2024 - Q1 2025 (4 months)',
    team: '3 Applied AI Eng, 2 Full-Stack Eng, 1 Developer Advocate',
    problem:
      'As our engineering organization expanded across four global time zones, new hires experienced severe onboarding friction. The average time-to-first-meaningful-commit was 22 days. Senior staff engineers were losing an estimated 15 hours per month answering repetitive architectural questions in Slack threads that were never indexed into our central knowledge base.',
    approach:
      'We architected an internal RAG (Retrieval-Augmented Generation) co-pilot integrated into Slack and IDE extensions. We established automated vector embedding pipelines across 40 microservice repositories, architectural RFCs, and incident post-mortems. We implemented strict permission boundaries so engineers could only query repositories they had explicit read access to per Okta groups.',
    outcome:
      'Time-to-first-commit dropped by 84% to just 3.5 days. Senior engineer interruption hours decreased by 60%, recovering over 1,200 productive engineering hours every month across the org.',
    metrics: [
      { label: 'Time-to-First-Commit', value: '3.5 Days', qualifier: 'actual' },
      { label: 'Senior Eng Hours Saved', value: '1,200/mo', qualifier: 'actual' },
      { label: 'Query Accuracy Score', value: '91.4%', qualifier: 'actual' },
    ],
    tools: [
      'Python',
      'LangChain',
      'Pinecone Vector DB',
      'TypeScript',
      'React 19',
      'OpenAI Enterprise',
    ],
    tags: ['AI/ML Product', 'Developer Experience', 'RAG Architecture', 'Enterprise Security'],
    coverImage:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    liveUrl: 'https://github.com/yashjha024',
    repoUrl: 'https://github.com/yashjha024',
    opportunity:
      'Every week a new engineer spends waiting for environment setup or architecture context costs the company ~$4,000 in unrecovered velocity and degrades employee early-tenure satisfaction.',
    roleConstraints:
      'Owned product vision, AI accuracy benchmarking, security governance, and internal developer advocacy. Primary constraint: Zero proprietary source code could be transmitted outside our private VPC or used for third-party foundation model training.',
    researchInputs:
      'Analyzed 4,500 historical onboarding Slack threads and shadow-monitored 12 new engineering hires during their first two weeks.',
    problemFraming:
      'How might we give every newly onboarded software engineer a private, 24/7 senior architect co-pilot that instantly explains repository dependencies and local setup quirks with verifiable citations?',
    optionsDecision:
      'Evaluated: (1) Standard Confluence wiki cleanup (rejected: low adherence, immediately gets outdated); (2) Off-the-shelf external AI coding assistant (rejected: security constraints on proprietary core algorithms); (3) Custom internal RAG pipeline with Okta RBAC (selected: complete data sovereignty and precise domain citations).',
    prdSnapshot: {
      goal: 'Enable any new hire to resolve local dev environment setup and make their first pull request within 96 hours of laptop assignment.',
      nonGoals: ['Automated code generation for complex distributed consensus algorithms'],
      requirements: [
        'Automatic nightly re-indexing of all main branch commits and updated RFC markdown documents',
        'Strict citation links pointing to the exact file and line number for every generated explanation',
        'Feedback thumbs-up/down loop to continuously prune hallucinated or outdated technical answers',
      ],
      successMetrics: [
        'Time to first PR < 4 days',
        'Monthly active usage > 85% among all engineering squads',
      ],
    },
    delivery:
      'Shipped alpha to 20 pilot engineers in 5 weeks. Iterated based on citation relevance tuning and expanded to all 450+ engineers in month 3.',
    outcomeLearning:
      'Quality of citations matters far more than conversational eloquence. Engineers immediately lose trust if a model generates plausible-sounding but deprecated API syntax without exact file pointers.',
  },
  {
    id: 'cs-3',
    slug: 'enterprise-api-gateway-migration',
    title: 'Zero-Downtime API Gateway & Service Mesh Migration for 140 Services',
    summary:
      'Orchestrated a mission-critical program migration from legacy monolithic routing to a high-throughput Envoy service mesh, eliminating cascading outages and cutting P99 latency by 42ms.',
    type: 'program_case_study',
    status: 'published',
    featured: true,
    sortOrder: 3,
    domain: 'Platform Infrastructure / TPM',
    role: 'Lead Technical Program Manager',
    timeline: 'Q2 2023 - Q4 2023 (9 months)',
    team: '6 Platform Eng, 14 Squad Tech Leads, 2 SRE Managers',
    problem:
      'Our legacy NGINX API gateway had reached its concurrent connection limits during peak Black Friday traffic spikes, causing two major P0 cascading outages that cost $850k in SLA penalty credits. Moreover, adding a new routing rule or authentication middleware required a synchronized global monolith deployment that took 4 hours and blocked all feature releases.',
    approach:
      'Designed a phased, zero-downtime migration program moving all 140 production services to a decentralized Envoy and Istio service mesh. We instituted automated shadow traffic mirroring where 100% of live production traffic was duplicated to the new mesh in real time to verify byte-for-byte response parity and latency behavior before shifting DNS weights.',
    outcome:
      'Completed the 140-service migration 3 weeks ahead of schedule with literally zero minutes of customer-facing downtime. P99 routing latency dropped by 42ms, and routing deployment velocity increased by 1,200% via declarative GitOps CRDs.',
    metrics: [
      { label: 'Customer Downtime', value: '0 Mins', qualifier: 'actual' },
      { label: 'P99 Latency Improvement', value: '-42 ms', qualifier: 'actual' },
      { label: 'SLA Penalties Avoided', value: '$850k/yr', qualifier: 'actual' },
    ],
    tools: ['Envoy', 'Istio', 'Kubernetes', 'Terraform', 'Datadog', 'GitOps'],
    tags: [
      'Technical Program Management',
      'Service Mesh',
      'Zero-Downtime Migration',
      'High Reliability',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    liveUrl: 'https://github.com/yashjha024',
    repoUrl: 'https://github.com/yashjha024',
    opportunity:
      'Eliminating single-point-of-failure routing bottlenecks was mandatory to support international multi-region expansion and pass Tier-1 financial compliance audits.',
    roleConstraints:
      'Managed cross-squad program governance across 14 independent engineering teams while maintaining 100% feature delivery commitments on the core roadmap.',
    researchInputs:
      'Conducted exhaustive failure mode and effects analysis (FMEA) across all 140 upstream dependency graphs.',
    problemFraming:
      'How might we safely migrate 10,000 requests/sec of production API traffic across 140 services without requiring coordinated downtime windows or code freezes across product teams?',
    optionsDecision:
      'Selected gradual canary traffic shifting (1% -> 10% -> 50% -> 100%) paired with automated rollback triggers if 5xx error rates exceeded 0.01% over a 60-second sliding window.',
    prdSnapshot: {
      goal: 'Migrate 100% of production ingress and service-to-service routing to Envoy mesh with zero customer downtime.',
      nonGoals: [
        'Rewriting backend application business logic from Node to Go during the migration',
      ],
      requirements: [
        'Automated shadow traffic diffing engine to verify response payload identity across gateways',
        'Self-service GitOps CRD workflow allowing squad leads to manage circuit breakers autonomously',
      ],
      successMetrics: [
        'Zero P0 incidents during cutover',
        'P99 latency < 15ms across all internal hops',
      ],
    },
    delivery:
      'Executed across 4 programmatic waves sorted by service criticality and traffic volume, starting with Tier-3 analytical pipelines and concluding with Tier-1 payment checkout services.',
    outcomeLearning:
      'Program management at scale is 20% technical orchestration and 80% communication empathy. Creating self-serve verification dashboards for individual tech leads was the single most impactful lever for building cross-team alignment.',
  },
];

export const articles = [
  {
    id: 'art-1',
    slug: 'improving-whatsapp-group-event-coordination',
    title: 'Product Teardown: Improving WhatsApp Group-Event Coordination & Scheduling',
    type: 'teardown',
    status: 'published',
    readingTime: '8 min read',
    publishedAt: '2025-01-14',
    tags: ['Product Teardown', 'UX Strategy', 'Consumer Social', 'Feature Proposal'],
    excerpt:
      'An independent product teardown and feature proposal analyzing how WhatsApp can eliminate group-chat coordination chaos with lightweight inline polling and calendar synchronization.',
    coverImage:
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80',
    disclaimer:
      'Independent product concept & architectural teardown — not affiliated with WhatsApp or Meta.',
    currentExperience:
      'In active WhatsApp groups of 10+ participants (such as recreational sports leagues, family reunions, or engineering study groups), organizing a simple dinner or weekend hike turns into endless, chaotic message scrolling. Members reply with "+1", "Can we do 7pm instead?", or separate side threads, burying important location details and RSVP counts under dozens of unrelated memes or notifications.',
    targetAudience:
      'Primary Persona: Group Organizers and active community members who coordinate recurring physical or virtual gatherings across diverse schedules without wanting to force participants to download a secondary scheduling app like Partiful or Calendly.',
    proposedFeature:
      'We propose "Inline Smart Events": a native, lightweight event card embedded directly into the WhatsApp group chat stream. When a user types an event trigger or selects "Create Event" from the attachment sheet, an interactive card renders showing: (1) Date/Time with one-click "Add to Calendar"; (2) Real-time RSVP chips (Going / Maybe / Can\'t); (3) An expandable thread specifically for logistical Q&A that keeps the main chat stream clean.',
    whyNow:
      'With WhatsApp expanding heavily into Community Communities and Channels, users increasingly rely on WhatsApp as their primary civic and group operating system. However, competitor platforms like Telegram and Discord have superior structured widgets. Introducing native event coordination strengthens retention and prevents group migration to niche scheduling utilities.',
    edgeCases:
      "Key considerations: (1) Privacy: RSVPs should respect user online/last-seen privacy settings; (2) Notification Fatigue: RSVP status changes should update the inline card silently without firing push notifications to all 50 group members; (3) Timezone Handling: Event cards must auto-convert display times based on each participant's local device timezone.",
    mvpVsFuture:
      'MVP Scope: Create Event card, 3 RSVP states, automatic timezone conversion, and silent count updates. Future Phase: Automated reminder ping 2 hours before the event to "Going" attendees only, and optional location sharing expiration attached directly to the event lifecycle.',
    successMetrics: [
      'Adoption Rate: % of active groups (>10 members) creating at least 1 event per month (Target: >15%)',
      'RSVP Completion Velocity: Median time for an event to reach 80% participant response vs unstructured text replies',
      'Group Retention: 30-day retention lift for groups utilizing structured events vs control cohorts',
    ],
    journeyFlow: `
Organizer taps '+' -> Selects 'Event' -> Inputs Title, Time & Location
                                                |
                                                v
Embeds Interactive Event Card in Chat -> Participants click 'Going' / 'Maybe'
                                                |
                                                v
Card updates live RSVP count silently -> Tapping card opens Logistical Q&A Drawer
    `,
  },
  {
    id: 'art-2',
    slug: 'why-internal-developer-platforms-fail',
    title: 'Why Internal Developer Platforms (IDPs) Fail: The Cognitive Load Fallacy',
    type: 'essay',
    status: 'published',
    readingTime: '6 min read',
    publishedAt: '2024-11-20',
    tags: [
      'Platform Engineering',
      'Product Strategy',
      'Developer Experience',
      'Technical Architecture',
    ],
    excerpt:
      'Many engineering organizations spend millions building internal developer platforms that engineers actively circumvent. Here is how product managers can avoid the Golden Cage trap by focusing on modular composability.',
    coverImage:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    body: `
### The Golden Cage Dilemma

In the quest for engineering efficiency and cloud cost governance, organizations frequently build sprawling Internal Developer Platforms (IDPs). The pitch to executive leadership is intoxicating: *"If we build a unified portal where developers click a button to provision databases, CI/CD pipelines, and Kubernetes namespaces, our delivery velocity will double."*

Yet eighteen months later, the platform team finds themselves managing an expensive internal ticketing system wrapped in a brittle React UI. Feature squads are actively building workaround scripts or deploying unauthorized cloud resources using personal API keys. Why does this happen?

### 1. Building a Mandate Instead of a Product

The foundational sin of most IDPs is treating internal developers as captive users rather than voluntary customers. When an external product fails to solve a user's problem, the user churns. When an internal platform fails to solve an engineer's problem, the organization institutes an architectural mandate forcing adoption.

When adoption is enforced by policy rather than utility, the feedback loop breaks. The platform team stops measuring Net Promoter Score (NPS) and starts measuring compliance percentage.

### 2. The Abstraction Leak

Software engineers are hired to solve complex, novel domain problems. When an IDP wraps AWS Terraform modules in an overly simplistic YAML wrapper, it works great for the 80% happy path (\`hello-world\` stateless web servers). But the moment a senior engineer needs to configure custom TCP keep-alive timeouts or attach specialized GPU node selectors, the abstraction breaks down.

If the platform does not allow **escape hatches**, the developer must file a Jira ticket with the platform team and wait two weeks for a schema update. The tool that was meant to accelerate velocity has become a central blocking dependency.

### 3. The Product-Led Platform Framework

To build an internal platform that engineers genuinely love, technical product managers must apply three operating rules:

* **Thick APIs, Thin UI:** Invest 80% of platform engineering effort into clean, composable CLI tools, GitOps CRDs, and well-documented REST/gRPC APIs. The web UI should simply be one consumer of those APIs, not the sole interface.
* **Paved Roads, Not High Walls:** Make the golden path so effortless and secure that 95% of engineers choose it voluntarily. But explicitly permit senior engineers to step off the paved road if they accept full on-call operational responsibility for their custom infrastructure.
* **Treat Documentation as Code:** Every platform component must ship with verifiable, copy-pasteable examples and automated integration tests. Deprecating an internal API requires the same deprecation notices and migration assistance as an enterprise B2B SaaS product.
    `,
  },
  {
    id: 'art-3',
    slug: 'data-driven-prioritization-in-high-uncertainty-environments',
    title: 'Data-Driven Product Prioritization in High-Uncertainty 0-to-1 Environments',
    type: 'essay',
    status: 'published',
    readingTime: '5 min read',
    publishedAt: '2024-09-08',
    tags: ['Product Management', 'Decision Frameworks', 'Metrics', '0-to-1 Execution'],
    excerpt:
      'How to balance quantitative telemetry, qualitative customer discovery, and engineering intuition when building new product categories where historical benchmark data does not exist.',
    coverImage:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    body: `
### When RICE and WSJF Break Down

Standard product prioritization frameworks like RICE (Reach, Impact, Confidence, Effort) are exceptionally effective for optimizing mature products with stable conversion funnels and large historical datasets. If you have 500,000 daily active users, estimating the exact basis point lift of moving a checkout CTA is straightforward.

However, when leading **0-to-1 product initiatives**—such as launching a new AI developer co-pilot or creating an autonomous cloud governance control plane—standard quantitative scoring formulas collapse into arbitrary guesswork. If \`Reach\` is uncertain and \`Confidence\` is subjective, multiplying them together simply produces pseudoscientific noise.

### The Uncertainty Matrix: De-risking Four Critical Vectors

When building zero-to-one, effective product managers shift their mental model from *score-maximizing* to *risk-minimizing*. Every major epic is evaluated across four existential uncertainty vectors:

1. **Value Risk:** Will customers actually buy this or choose to use it over their current Excel spreadsheet workaround?
2. **Usability Risk:** Can our target personas figure out how to operate the workflow without a 40-page user manual?
3. **Feasibility Risk:** Can our engineering team build this within our current latency, compute, and security boundaries?
4. **Viability Risk:** Does this solution align with our gross margin targets, legal constraints, and brand reputation?

### Execution Principles for High Uncertainty

* **Time-Boxed Prototyping over Comprehensive PRDs:** Instead of writing a 30-page requirements specification based on unverified assumptions, write a 2-page framing memo and give two senior engineers 5 days to build an ugly, end-to-end technical spike.
* **Instrument Everything from Day One:** Never launch an MVP without structured OpenTelemetry telemetry and user action tracking. In 0-to-1 work, your first launch is an experiment designed to generate your baseline dataset.
* **Separation of Discovery and Delivery Tracks:** Keep 30% of your engineering and design capacity permanently allocated to rapid customer discovery experiments, while 70% executes on the high-confidence core infrastructure roadmap.
    `,
  },
];

export const prds = [
  {
    id: 'prd-1',
    slug: 'real-time-anomaly-detection-pipeline',
    title: 'PRD: Real-Time Telemetry Anomaly Detection & Self-Healing Pipeline',
    stage: 'In Development',
    visibility: 'public',
    context:
      'As our cloud infrastructure scales to handle 50,000 requests/second, manual SRE investigation of latency anomalies takes an average of 42 minutes MTTR. We need an automated pipeline that detects statistical outliers in metric streams within 15 seconds and triggers automated canary rollback or circuit breaking.',
    relatedCaseStudy: 'kubernetes-cost-governance-platform',
    sections: {
      problem:
        'SRE teams currently rely on static threshold alerts (e.g., `CPU > 90% for 5 mins`). In distributed microservices, severe customer impact often occurs during subtle P99 latency spikes (`P99 > 850ms`) where average CPU remains normal at 40%. Static alerts cause either excessive false-positive page fatigue or miss critical cascading degradations until customer support tickets surge.',
      goals: [
        'Detect P99 latency anomalies across any service endpoint within 15 seconds of onset using dynamic Z-score and seasonal baseline algorithms',
        'Automatically trigger webhook notifications to Kubernetes rollout controllers to freeze canary promotions upon anomaly verification',
        'Reduce overall incident MTTR from 42 minutes to under 3 minutes for routing and deployment-induced regressions',
      ],
      nonGoals: [
        'Automated modification or rollback of stateful database migration scripts during active traffic',
        'Replacing PagerDuty or existing SRE on-call rotation schedules',
      ],
      requirements: [
        {
          id: 'REQ-101',
          name: 'OpenTelemetry Header Ingestion',
          priority: 'P0',
          desc: 'Ingest up to 100,000 metrics data points/sec via gRPC collector with sub-5ms ingestion latency.',
        },
        {
          id: 'REQ-102',
          name: 'Dynamic Seasonal Z-Score Evaluation',
          priority: 'P0',
          desc: 'Calculate rolling 7-day baseline windows to account for normal daily and weekend traffic cycles automatically.',
        },
        {
          id: 'REQ-103',
          name: 'Automated Canary Rollback Trigger',
          priority: 'P1',
          desc: 'Issue secure TLS webhook payload to Argo Rollouts controller when anomaly score exceeds 4.5 sigma for >30s.',
        },
        {
          id: 'REQ-104',
          name: 'Self-Service Exception Whitelisting',
          priority: 'P2',
          desc: 'Provide UI dashboard allowing service owners to mute anomaly detection during scheduled load-testing windows.',
        },
      ],
      metrics: [
        {
          name: 'Detection Latency',
          target: '< 15 seconds from metric anomaly onset to event dispatch',
        },
        {
          name: 'False Positive Rate',
          target: '< 0.5% of total triggered alerts over a 30-day window',
        },
        {
          name: 'Canary Rollback Success',
          target: '99.9% automated rollback execution without human intervention',
        },
      ],
      releaseGates: [
        'Load testing validation at 150,000 data points/sec with zero dropped metric frames',
        'Passed security review for webhook TLS mutual authentication (mTLS) with Kubernetes API server',
        'Completed chaos engineering simulation verifying correct rollback triggers during injected network packet loss',
      ],
    },
  },
  {
    id: 'prd-2',
    slug: 'self-service-api-key-lifecycle-management',
    title: 'PRD: Enterprise Self-Service API Key & Scoped Token Lifecycle Management',
    stage: 'Approved',
    visibility: 'public',
    context:
      'To pass SOC2 Type II and ISO 27001 enterprise compliance audits, our B2B platform must eliminate long-lived, un-scoped API keys. We must ship a developer-facing portal allowing customer administrators to generate fine-grained, expiring API keys with granular IP whitelisting and automated rotation capabilities.',
    relatedCaseStudy: 'ai-powered-developer-onboarding',
    sections: {
      problem:
        'Customers currently generate a single master API key with unrestricted read/write permissions across all account workspaces. If a developer accidentally leaks this key into a public GitHub repository, the entire enterprise account is compromised. Furthermore, rotating keys requires manual downtime coordination and customer support intervention.',
      goals: [
        'Allow enterprise org admins to generate up to 50 active API keys with fine-grained REST endpoint scopes (`read:billing`, `write:deployments`)',
        'Implement mandatory key expiration policies (30, 60, 90, or 365 days) with automated email and webhook rotation warnings 14 days prior to expiry',
        'Support CIDR IP address whitelisting per API key to restrict API access strictly to customer corporate VPN gateways',
      ],
      nonGoals: ['Deprecating OAuth 2.0 user login flows for interactive web console sessions'],
      requirements: [
        {
          id: 'KEY-001',
          name: 'SHA-256 Hashed Key Storage',
          priority: 'P0',
          desc: 'Plaintext API keys (`sk_live_...`) are shown exactly once at creation and stored exclusively as salted SHA-256 hashes in PostgreSQL.',
        },
        {
          id: 'KEY-002',
          name: 'Granular Scope Enforcement Middleware',
          priority: 'P0',
          desc: 'Express middleware verifies token scopes against requested route definitions in < 2ms using Redis caching.',
        },
        {
          id: 'KEY-003',
          name: 'Dual-Key Grace Period Rotation',
          priority: 'P1',
          desc: 'Enable two active keys simultaneously for up to 7 days during rotation cycles to guarantee zero customer downtime.',
        },
      ],
      metrics: [
        {
          name: 'Scoped Key Adoption',
          target: '80% of enterprise customers migrate from master keys within 90 days',
        },
        {
          name: 'API Auth Middleware Latency',
          target: 'P99 authorization verification latency < 3ms',
        },
        {
          name: 'Zero Leak Compromises',
          target:
            '100% containment of leaked keys via automatic GitHub Secret Scanning partner integration',
        },
      ],
      releaseGates: [
        'Third-party penetration test clearance verifying zero timing attacks or hash collision vulnerabilities',
        'SOC2 auditor sign-off on dual-key rotation workflow and immutable audit log generation',
      ],
    },
  },
];

export const aboutData = {
  story: `
Product professional with experience taking digital products from requirement gathering to launch, with hands-on exposure to workflow design, feature scoping, and product analytics. Comfortable working at the intersection of business needs and technical execution, with a proven track record of contributing to live platforms in learning and commerce environments.

I am pursuing my **B.Tech in Artificial Intelligence and Machine Learning** at **Birla Institute of Technology (BIT), Mesra** (Nov 2022 – June 2026), grounding my product leadership in rigorous technical coursework including **Statistics, Analysis of Algorithms, Data Structures, Machine Learning, and Deep Learning**.

My experience spans taking 0-to-1 workflows into live production:
* At **Istockly** (Remote/BLR), I owned the delivery of a production Learning Management System (LMS) for financial education, translating business needs into 4 core workflows across course management, learner onboarding, progress tracking, and certification—reducing operational friction by **20%** and cutting manual reporting effort by **25%** across 4 key KPIs.
* At **Diptech Technologies** (Patna, BR), I defined workflows for an industrial commerce platform covering 5 core journeys: discovery, ordering, partial payments, loan support, and after-sales service. I enabled high-value purchase workflows via **Razorpay-based partial payments** and auto-generated loan quotations, reducing manual documentation effort by **20–25%**.
* At **NIT Patna**, I extended a **CVPR 2024** few-shot learning medical imaging pipeline across cross-domain environments.
* At **Campus-Connect** (Project), I owned the product design and user flows for a student-faculty dashboard platform with role-based profile management and achievement tracking.
  `,
  principles: [
    {
      title: 'Workflow Clarity & Scoping',
      description:
        'Translate ambiguous business requirements into structured As-Is/To-Be process mapping, BRD documentation, and clean user stories.',
    },
    {
      title: 'Analytics & Measurable Impact',
      description:
        'Every feature launch must be backed by quantifiable KPI tracking, from learner onboarding conversions to high-value purchase documentation savings.',
    },
    {
      title: 'Intersection of Product & AI/ML',
      description:
        'Combine strong product instinct with deep technical familiarity across Python, React, Node.js, MongoDB, LangChain, RAG, and LLM pipelines.',
    },
    {
      title: 'Stakeholder & Operational Excellence',
      description:
        'Standardize stakeholder-driven feature execution and maintain secure access controls across customer, brand, and administrative roles.',
    },
  ],
  timeline: [
    {
      date: 'Dec 2025 - Present',
      title: 'Product Intern — Istockly (Remote/BLR)',
      description:
        'Owned delivery of a production LMS for financial education across 4 core workflows (course management, onboarding, progress tracking, certification). Designed experiences for learners & admins reducing operational friction by ~20%, and developed analytics visibility across 4 key KPIs cutting manual reporting effort by ~25%.',
    },
    {
      date: 'June 2025 - Dec 2025',
      title: 'Project Intern — Diptech Technologies (Patna, BR)',
      description:
        'Owned workflow definition for an industrial commerce platform covering 5 core journeys (discovery, ordering, partial payments, loan support, after-sales). Enabled Razorpay partial payments and auto-generated loan quotations reducing manual documentation effort by 20–25%. Integrated technician appointment booking.',
    },
    {
      date: 'May 2025 - July 2025',
      title: 'Research Intern — National Institute of Technology (NIT), Patna',
      description:
        'Extended a CVPR 2024 few-shot learning pipeline from 1 dataset family to 2 medical imaging domains, supporting cross-domain experimentation and model evaluation.',
    },
    {
      date: 'March 2025 - Present',
      title: 'Placement Coordinator — Training & Placement Cell, BIT Mesra',
      description:
        'Managed placement workflows between students and recruiters, aligning scheduling, communication, and logistics across multiple stakeholders while supporting interview readiness.',
    },
    {
      date: 'Nov 2022 - June 2026',
      title: 'B.Tech in Artificial Intelligence & Machine Learning — BIT Mesra',
      description:
        'Coursework: Statistics, Analysis of Algorithms, Data Structures, Machine Learning, Deep Learning. Certifications: Google Advanced Data Analytics (May 2024), Google Business Intelligence (June 2024).',
    },
  ],
  skills: {
    'Analytics & BI': [
      'SQL & PostgreSQL',
      'Microsoft Excel & Google Sheets',
      'Power BI & Tableau',
      'KPI Tracking & Funnel Analysis',
      'Data Visualization & Reporting',
    ],
    'Product Methods & Agile': [
      'Requirements Gathering & Scoping',
      'Process Mapping (As-Is / To-Be)',
      'BRD Documentation & User Stories',
      'UAT & Agile / Scrum Ceremonies',
      'Role-Based Workflow Design',
      'Troubleshooting & FMEA',
    ],
    'Product & Collaboration Tools': [
      'Figma UX / UI Design',
      'Jira & Trello Agile Management',
      'Notion & Google Workspace',
      'Git & GitHub Version Control',
      'Razorpay Payment Integration',
      'n8n Workflow Automation',
    ],
    'Technical Familiarity & AI/ML': [
      'JavaScript, Python, React.js & Node.js',
      'MongoDB & PostgreSQL Databases',
      'REST APIs & Microservice Interop',
      'LangChain, RAG & LLM Pipelines',
      'Deep Learning & Few-Shot AI Models',
    ],
  },
};
