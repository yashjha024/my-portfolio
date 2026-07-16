import React from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, CheckCircle, Users, Sparkles, ShieldCheck, Layers, GitBranch, ArrowRight } from 'lucide-react';
import { usePortfolioData } from '../../hooks/usePortfolioData.js';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { MarkdownProse } from '../../components/ui/MarkdownProse.jsx';
import { DetailPageSkeleton } from '../../components/ui/Skeleton.jsx';
import { SEO } from '../../components/shared/SEO.jsx';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav.jsx';
import { calculateReadingTime } from '../../utils/calculateReadingTime.js';

export const ArticleDetailPage = () => {
  const { slug } = useParams();
  const { data: articles, loading } = usePortfolioData({ type: 'articles', delayMs: 350 });

  const art = articles?.find((item) => item.slug === slug);

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!art) {
    return (
      <Section className="py-24 text-center">
        <Container>
          <div className="max-w-md mx-auto space-y-4">
            <h1 className="font-heading text-3xl font-bold text-foreground">Article Not Found</h1>
            <p className="text-muted-foreground text-sm">
              We couldn&apos;t find the article with slug <code className="font-mono bg-muted px-2 py-0.5 rounded">{slug}</code>.
            </p>
            <Button asChild>
              <NavLink to="/thinking">
                <ArrowLeft className="mr-2 w-4 h-4" /> Return to Product Thinking
              </NavLink>
            </Button>
          </div>
        </Container>
      </Section>
    );
  }

  const hasStructuredTeardown = Boolean(art.currentExperience || art.targetAudience || art.proposedFeature || art.whyNow);
  const isTeardown = hasStructuredTeardown;
  const computedReadingTime = art.readingTime || calculateReadingTime(art.body || art.currentExperience || art.excerpt).text;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Product Thinking', url: '/thinking' },
    { name: art.title, url: `/thinking/${art.slug}` },
  ];

  return (
    <>
      <SEO
        title={art.title}
        description={art.excerpt}
        image={art.coverImage}
        type="article"
        publishedTime={art.publishedAt}
        breadcrumbs={breadcrumbs}
      />

      {/* Hero Section */}
      <Section className="pt-8 pb-12 md:pt-14 md:pb-16 border-b border-border/60 bg-gradient-to-b from-background via-background to-muted/20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl space-y-5"
          >
            <BreadcrumbNav items={breadcrumbs} />

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="default" className="uppercase font-mono text-xs">
                {art.type?.replace('_', ' ')}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">{computedReadingTime}</span>
              <span className="text-xs font-mono text-muted-foreground">&bull; Published {art.publishedAt || 'Recently'}</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
              {art.title}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              {art.excerpt}
            </p>

            {/* Disclaimer Banner per PRD Section 5 */}
            {art.disclaimer && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3 text-warning-foreground">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                  {art.disclaimer}
                </p>
              </div>
            )}
          </motion.div>
        </Container>
      </Section>

      {/* Cover Image */}
      {art.coverImage && (
        <div className="w-full max-w-5xl mx-auto px-4 -mt-6 sm:-mt-10 mb-12">
          <div className="rounded-2xl overflow-hidden border border-border shadow-xl bg-card max-h-[440px]">
            <img src={art.coverImage} alt={art.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <Section className="pb-24">
        <Container>
          <div className="max-w-3xl mx-auto space-y-12">
            {isTeardown ? (
              /* 8-Step Product Teardown Template per PRD Section 5 */
              <div className="space-y-16">
                {/* Step 1: Current Experience & Observed Problem */}
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
                    Step 01. Current Experience &amp; Observed Problem
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    The Coordination Chaos in Active Groups
                  </h2>
                  <MarkdownProse>{art.currentExperience}</MarkdownProse>
                </div>

                {/* Step 2: Target Audience & Evidence/Assumptions */}
                <div className="space-y-3 border-t border-border/60 pt-8">
                  <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Step 02. Target Audience &amp; Assumptions
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Group Organizers &amp; Community Leaders
                  </h2>
                  <MarkdownProse>{art.targetAudience}</MarkdownProse>
                </div>

                {/* Step 3: Proposed Feature & User Flow */}
                <div className="space-y-3 border-t border-border/60 pt-8">
                  <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Step 03. Proposed Feature &amp; User Flow
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Inline Smart Events Widget
                  </h2>
                  <MarkdownProse>{art.proposedFeature}</MarkdownProse>
                </div>

                {/* Step 4: Why Now / Business Rationale */}
                <div className="space-y-3 border-t border-border/60 pt-8">
                  <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
                    Step 04. Why Now / Business Rationale
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Defending Community Retention against Discord &amp; Telegram
                  </h2>
                  <MarkdownProse>{art.whyNow}</MarkdownProse>
                </div>

                {/* Step 5: Edge Cases, Privacy, & Adoption Risks */}
                <div className="space-y-3 border-t border-border/60 pt-8">
                  <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Step 05. Edge Cases, Privacy &amp; Risks
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Mitigating Notification Fatigue &amp; Privacy Leaks
                  </h2>
                  <MarkdownProse>{art.edgeCases}</MarkdownProse>
                </div>

                {/* Step 6: MVP versus Future Scope */}
                <div className="space-y-3 border-t border-border/60 pt-8">
                  <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Step 06. MVP versus Future Scope
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Phased Rollout Strategy
                  </h2>
                  <MarkdownProse>{art.mvpVsFuture}</MarkdownProse>
                </div>

                {/* Step 7: Success Metrics & Experiment Design */}
                <div className="space-y-4 border-t border-border/60 pt-8">
                  <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-success" /> Step 07. Success Metrics &amp; Experimentation
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Measuring Event Adoption &amp; RSVP Velocity
                  </h2>
                  <div className="p-5 rounded-xl bg-card border border-border space-y-2">
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground font-medium">
                      {art.successMetrics?.map((m, idx) => (
                        <li key={idx} className="leading-relaxed">
                          <span className="text-foreground">{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Step 8: Annotated Prototype / Journey Diagram */}
                {art.journeyFlow && (
                  <div className="space-y-4 border-t border-border/60 pt-8">
                    <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4" /> Step 08. User Journey Architecture Diagram
                    </span>
                    <h2 className="font-heading text-2xl font-bold text-foreground">
                      End-to-End Coordination Flow
                    </h2>
                    <div className="p-6 rounded-xl bg-muted font-mono text-xs sm:text-sm overflow-x-auto border border-border/80 whitespace-pre text-foreground leading-relaxed">
                      {art.journeyFlow}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Standard Essay / Markdown Body */
              <MarkdownProse>{art.body}</MarkdownProse>
            )}

            {/* Bottom Navigation & CTA */}
            <div className="p-8 rounded-2xl bg-muted/60 border border-border flex flex-col sm:flex-row items-center justify-between gap-6 mt-16">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Enjoyed this product breakdown?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Check out my verified case studies or review my engineering-ready PRDs.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <NavLink to="/work">View Case Studies <ArrowRight className="ml-2 w-4 h-4" /></NavLink>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <NavLink to="/prds">Read PRDs</NavLink>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
};
