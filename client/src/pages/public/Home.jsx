import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Sparkles, Code, BarChart3, Layers } from 'lucide-react';
import { usePortfolioData } from '../../hooks/usePortfolioData.js';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { Grid } from '../../components/layout/Grid.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { InteractiveCard, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card.jsx';
import { CaseStudyCardSkeleton, ArticleCardSkeleton } from '../../components/ui/Skeleton.jsx';
import { SEO } from '../../components/shared/SEO.jsx';

export const Home = () => {
  const { data, loading } = usePortfolioData({ delayMs: 350 });
  const { profile, caseStudies, articles } = data;

  const howIWorkSteps = [
    {
      title: 'Discover & Scoping',
      icon: <Sparkles className="w-5 h-5 text-primary" />,
      desc: 'Conduct structured requirement gathering, user interviews, and workflow analysis to validate value before execution.',
    },
    {
      title: 'Define & Process Map',
      icon: <FileText className="w-5 h-5 text-primary" />,
      desc: 'Author crisp As-Is/To-Be process flows, BRDs, and user stories that establish clear trade-offs and success metrics.',
    },
    {
      title: 'Deliver & Collaborate',
      icon: <Layers className="w-5 h-5 text-primary" />,
      desc: 'Orchestrate cross-functional execution across specialized engineering and design teams using Agile/Scrum best practices.',
    },
    {
      title: 'Measure & Analytics',
      icon: <BarChart3 className="w-5 h-5 text-primary" />,
      desc: 'Instrument real-time KPI visibility and data analytics from day one to cut manual reporting effort and refine the product.',
    },
  ];

  return (
    <>
      {/* Universal SEO & Structured Data */}
      <SEO
        title={`${profile?.name || 'Yash Jha'} | Product & AI/ML Engineering Portfolio`}
        description={profile?.elevatorPitch || 'Product Professional & AI/ML Engineer Portfolio'}
        type="website"
      />

      {/* Block 1: Redesigned Hero Section */}
      <Section className="pt-24 pb-32 sm:pt-32 sm:pb-40 md:pt-40 md:pb-48 border-b border-border bg-background">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Bold Headline & Bio */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="lg:col-span-7 space-y-8"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 font-mono text-xs font-semibold text-foreground shadow-subtle">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  Open to Product &amp; Technical Roles
                </span>
                <span className="inline-flex items-center rounded-full bg-secondary border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
                  AI/ML + Product Leadership
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.06]">
                  {profile?.name || 'Yash Jha'}
                </h1>
                <p className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-foreground/80 tracking-tight leading-snug">
                  {profile?.role || 'Product Professional & AI/ML Engineer'}
                </p>
              </div>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl font-normal">
                {profile?.elevatorPitch || profile?.bio || 'Bridges computational rigor with customer empathy, transforming ambiguous user problems into structured, high-ROI product systems.'}
              </p>

              {/* Improved CTA Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="rounded-2xl bg-foreground text-background hover:bg-foreground/90 px-8 py-6 text-base font-bold shadow-soft transition-transform active:scale-[0.98]">
                  <NavLink to="/work">
                    Explore Case Studies <ArrowRight className="ml-2 w-5 h-5" />
                  </NavLink>
                </Button>
                <Button variant="outline" size="lg" asChild className="rounded-2xl border border-border bg-card hover:bg-secondary px-8 py-6 text-base font-bold shadow-subtle transition-transform active:scale-[0.98]">
                  <NavLink to="/resume">
                    Interactive Resume
                  </NavLink>
                </Button>
                <Button variant="ghost" size="lg" asChild className="rounded-2xl px-6 py-6 text-base font-semibold text-muted-foreground hover:text-foreground">
                  <NavLink to="/contact">Let&apos;s Talk →</NavLink>
                </Button>
              </div>
            </motion.div>

            {/* Right Column: Clean Executive Product Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
              className="lg:col-span-5"
            >
              <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-soft space-y-8 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-border pb-6">
                  <div className="space-y-1">
                    <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Execution Focus</span>
                    <h3 className="font-heading text-xl font-bold text-foreground">End-to-End Systems</h3>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-secondary border border-border flex items-center justify-center font-bold font-mono text-foreground">
                    PM
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs text-muted-foreground">
                      <span>Requirement to PRD</span>
                      <span className="text-foreground font-semibold">100% Verified</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-foreground rounded-full w-full transition-all duration-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="rounded-2xl bg-secondary/70 border border-border/80 p-4 space-y-1">
                      <span className="font-mono text-[11px] text-muted-foreground">Production Impact</span>
                      <p className="font-heading text-xl font-extrabold text-foreground">40%+ Velocity</p>
                    </div>
                    <div className="rounded-2xl bg-secondary/70 border border-border/80 p-4 space-y-1">
                      <span className="font-mono text-[11px] text-muted-foreground">Domain Mastery</span>
                      <p className="font-heading text-xl font-extrabold text-foreground">AI / B2B SaaS</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>Structured workflows</span>
                  <NavLink to="/thinking" className="text-foreground underline underline-offset-4 hover:opacity-80">
                    Read Product Teardowns →
                  </NavLink>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Block 2: Proof Strip (Verified Metrics) */}
      <Section variant="muted" className="py-16 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {profile?.proofPoints?.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.18, delay: idx * 0.05 }}
                className="flex flex-col space-y-1 p-5 rounded-2xl bg-card border border-border shadow-subtle"
              >
                <span className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {item.metric}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">{item.label}</span>
                <p className="text-sm text-muted-foreground pt-1 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Block 3: Featured Work Grid */}
      <Section className="bg-background">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <Badge variant="outline" className="mb-2">
                Selected Case Studies
              </Badge>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Featured Work
              </h2>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm sm:text-base">
                Deep-dive product case studies featuring problem discovery, technical constraints, PRD snapshots, and verified business outcomes.
              </p>
            </div>
            <Button variant="link" asChild className="p-0 h-auto font-semibold self-start sm:self-end">
              <NavLink to="/work">
                View All Case Studies <ArrowRight className="ml-1 w-4 h-4" />
              </NavLink>
            </Button>
          </div>

          <Grid cols={3} gap="lg">
            {loading ? (
              <>
                <CaseStudyCardSkeleton />
                <CaseStudyCardSkeleton />
                <CaseStudyCardSkeleton />
              </>
            ) : (
              caseStudies?.slice(0, 3).map((cs) => (
                <NavLink key={cs.id} to={`/work/${cs.slug}`} className="block focus-visible:outline-none">
                  <InteractiveCard className="h-full flex flex-col justify-between">
                    <div>
                      {cs.coverImage && (
                        <div className="w-full h-44 overflow-hidden bg-muted border-b border-border">
                          <img
                            src={cs.coverImage}
                            alt={cs.title}
                            className="w-full h-full object-cover transition-opacity duration-200 hover:opacity-95"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                            {cs.type?.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">{cs.timeline}</span>
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{cs.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <CardDescription className="line-clamp-3 text-xs sm:text-sm">
                          {cs.summary}
                        </CardDescription>
                      </CardContent>
                    </div>

                    <div className="p-6 pt-0 mt-auto border-t border-border/60 flex items-center justify-between text-xs pt-4">
                      <div className="flex flex-wrap gap-1.5">
                        {cs.tags?.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium text-[11px]">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="font-semibold text-primary flex items-center gap-1 group-hover:underline">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </InteractiveCard>
                </NavLink>
              ))
            )}
          </Grid>
        </Container>
      </Section>

      {/* Block 4: Experience (Narrative & Workflow) */}
      <Section variant="muted">
        <Container>
          <div className="max-w-4xl mx-auto rounded-2xl bg-card p-8 sm:p-12 border border-border shadow-soft mb-16">
            <Badge variant="default" className="mb-4">
              Experience &amp; Background
            </Badge>
            <h3 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4">
              Why an AI/ML Foundation Makes Me a Better Product Professional
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
              When stakeholders talk to product professionals who don&apos;t understand workflows, data analytics, or modern AI architectures, execution bottlenecks immediately. Having hands-on exposure across requirement gathering, process mapping, and building live platforms in learning and commerce environments alongside a B.Tech in AI &amp; ML, I bridge the technical and strategic gap effortlessly. I translate complex workflows into shipped product features.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <NavLink to="/about">
                  Read My Full Story &amp; Principles <ArrowRight className="ml-2 w-4 h-4" />
                </NavLink>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <NavLink to="/prds">Review My PRD Library</NavLink>
              </Button>
            </div>
          </div>

          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="outline" className="mb-2">
              Operating Philosophy
            </Badge>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How I Work: Discover → Define → Deliver → Measure
            </h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              A disciplined, evidence-based workflow crafted at the intersection of business needs and technical execution.
            </p>
          </div>

          <Grid cols={4} gap="md">
            {howIWorkSteps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="relative rounded-2xl border border-border bg-card p-6 shadow-subtle flex flex-col space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                  {step.icon}
                </div>
                <span className="text-xs font-mono font-bold text-primary tracking-wider uppercase">
                  Step 0{idx + 1}
                </span>
                <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Block 5: Case Studies Architecture & Navigation */}
      <Section className="bg-background">
        <Container>
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <Badge variant="outline">Comprehensive Case Studies &amp; PRDs</Badge>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Explore Complete Product Specifications &amp; Architectural Teardowns
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Review end-to-end PRDs with user stories, acceptance criteria, wireframe flows, and exact technical trade-offs structured for engineering handoff.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Button asChild size="lg" className="font-semibold shadow-subtle">
                <NavLink to="/work">
                  All Case Studies <ArrowRight className="ml-2 w-4 h-4" />
                </NavLink>
              </Button>
              <Button asChild variant="outline" size="lg">
                <NavLink to="/prds">Browse PRD Library</NavLink>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Block 6: Product Thinking */}
      <Section variant="muted">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <Badge variant="outline" className="mb-2">
                Teardowns &amp; Essays
              </Badge>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Product Thinking
              </h2>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm sm:text-base">
                Independent product concepts, deep architectural teardowns, and essays on platform strategy and decision frameworks.
              </p>
            </div>
            <Button variant="link" asChild className="p-0 h-auto font-semibold self-start sm:self-end">
              <NavLink to="/thinking">
                Explore All Articles <ArrowRight className="ml-1 w-4 h-4" />
              </NavLink>
            </Button>
          </div>

          <Grid cols={2} gap="lg">
            {loading ? (
              <>
                <ArticleCardSkeleton />
                <ArticleCardSkeleton />
              </>
            ) : (
              articles?.slice(0, 2).map((art) => (
                <NavLink key={art.id} to={`/thinking/${art.slug}`} className="block focus-visible:outline-none">
                  <InteractiveCard className="h-full flex flex-col justify-between">
                    <div>
                      {art.coverImage && (
                        <div className="w-full h-48 overflow-hidden bg-muted border-b border-border">
                          <img
                            src={art.coverImage}
                            alt={art.title}
                            className="w-full h-full object-cover transition-opacity duration-200 hover:opacity-95"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px] font-mono uppercase">
                            {art.type?.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">{art.readingTime}</span>
                        </div>
                        <CardTitle className="text-xl line-clamp-2">{art.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <CardDescription className="line-clamp-3 text-xs sm:text-sm">
                          {art.excerpt}
                        </CardDescription>
                      </CardContent>
                    </div>
                    <div className="p-6 pt-0 mt-auto border-t border-border/60 flex items-center justify-between text-xs pt-4">
                      <div className="flex flex-wrap gap-1">
                        {art.tags?.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium text-[11px]">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="font-semibold text-primary flex items-center gap-1">
                        Read Article <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </InteractiveCard>
                </NavLink>
              ))
            )}
          </Grid>
        </Container>
      </Section>

      {/* Block 7: Final CTA leading to Footer */}
      <Section className="bg-background text-center">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
              Open for Opportunities
            </Badge>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Building something useful? Let&apos;s talk.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Whether you are hiring for a Product Intern, Associate Product Manager, or exploring technical workflow design, I would love to connect.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button size="lg" asChild className="px-8 shadow-subtle">
                <NavLink to="/contact">
                  Send a Direct Message <ArrowRight className="ml-2 w-4 h-4" />
                </NavLink>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="https://linkedin.com/in/yashjha024" target="_blank" rel="noopener noreferrer">
                  Connect on LinkedIn
                </a>
              </Button>
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  );
};
