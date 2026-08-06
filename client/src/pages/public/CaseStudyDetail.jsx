import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ExternalLink, FileText, CheckCircle, Clock, Users, ShieldAlert, Award, Layers } from 'lucide-react';
import { Github } from '../../components/ui/Icon.jsx';
import { usePortfolioData, toCaseStudyDto } from '../../hooks/usePortfolioData.js';
import api from '../../services/api.js';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { MarkdownProse } from '../../components/ui/MarkdownProse.jsx';
import { DetailPageSkeleton } from '../../components/ui/Skeleton.jsx';
import { SEO } from '../../components/shared/SEO.jsx';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav.jsx';
import { calculateReadingTime } from '../../utils/calculateReadingTime.js';

export const CaseStudyDetailPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const previewToken = searchParams.get('preview_token');
  const { data: caseStudies, loading: listLoading } = usePortfolioData({ type: 'caseStudies', delayMs: 350 });

  const [previewItem, setPreviewItem] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(Boolean(previewToken));

  useEffect(() => {
    if (!previewToken || !slug) {
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    api
      .get(`/work/slug/${slug}?preview_token=${encodeURIComponent(previewToken)}`)
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setPreviewItem(toCaseStudyDto(res.data.data));
        }
      })
      .catch((err) => {
        setPreviewError(err.response?.data?.error || 'Unauthorized or expired preview token');
      })
      .finally(() => {
        setPreviewLoading(false);
      });
  }, [slug, previewToken]);

  const cs = previewToken ? previewItem : caseStudies?.find((item) => item.slug === slug);
  const loading = previewToken ? previewLoading : listLoading;

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!cs) {
    return (
      <Section className="py-24 text-center">
        <Container>
          <div className="max-w-md mx-auto space-y-4">
            <h1 className="font-heading text-3xl font-bold text-foreground">
              {previewError ? 'Preview Unauthorized' : 'Case Study Not Found'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {previewError || (
                <>
                  We couldn&apos;t find the case study matching slug <code className="font-mono bg-muted px-2 py-0.5 rounded">{slug}</code>.
                </>
              )}
            </p>
            <Button asChild>
              <NavLink to="/work">
                <ArrowLeft className="mr-2 w-4 h-4" /> Return to Work Index
              </NavLink>
            </Button>
          </div>
        </Container>
      </Section>
    );
  }

  const computedReadingTime = cs.readingTime || calculateReadingTime((cs.problem || '') + ' ' + (cs.approach || '') + ' ' + (cs.outcome || '') + ' ' + (cs.summary || '')).text;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Work / Case Studies', url: '/work' },
    { name: cs.title, url: `/work/${cs.slug}` },
  ];

  return (
    <>
      {previewToken && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-center text-xs font-medium text-amber-300 flex items-center justify-center gap-2">
          <span>⚠️ Preview Mode — Viewing draft / unpublished content (Owner Only)</span>
        </div>
      )}
      <SEO
        title={cs.title}
        description={cs.summary}
        image={cs.coverImage}
        type="case_study"
        publishedTime={cs.publishedAt || cs.timeline}
        breadcrumbs={breadcrumbs}
      />

      {/* Section 1: Hero */}
      <Section className="pt-20 pb-24 md:pt-28 md:pb-36 border-b border-border bg-background">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="max-w-4xl space-y-5"
          >
            <BreadcrumbNav items={breadcrumbs} />

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="default" className="uppercase font-mono text-xs">
                {cs.type?.replace('_', ' ')}
              </Badge>
              {cs.domain && (
                <Badge variant="outline" className="text-xs">
                  {cs.domain}
                </Badge>
              )}
              <span className="text-xs font-mono text-muted-foreground">&bull; {computedReadingTime}</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
              {cs.title}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              {cs.summary}
            </p>

            {/* Hero Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/60 text-xs sm:text-sm">
              <div>
                <span className="block font-semibold text-muted-foreground uppercase text-[11px] tracking-wider mb-0.5">
                  Role
                </span>
                <span className="font-medium text-foreground">{cs.role || 'Lead Product Manager'}</span>
              </div>
              <div>
                <span className="block font-semibold text-muted-foreground uppercase text-[11px] tracking-wider mb-0.5">
                  Timeline
                </span>
                <span className="font-medium text-foreground">{cs.timeline || '6 Months'}</span>
              </div>
              <div>
                <span className="block font-semibold text-muted-foreground uppercase text-[11px] tracking-wider mb-0.5">
                  Team &amp; Scope
                </span>
                <span className="font-medium text-foreground">{cs.team || 'Cross-functional Squad'}</span>
              </div>
              <div>
                <span className="block font-semibold text-muted-foreground uppercase text-[11px] tracking-wider mb-0.5">
                  Status
                </span>
                <Badge variant="success" className="text-[10px] px-2 py-0">
                  Shipped &amp; Verified
                </Badge>
              </div>
            </div>

            {/* External Links */}
            <div className="flex flex-wrap gap-3 pt-2">
              {cs.liveUrl && (
                <Button variant="default" size="sm" asChild>
                  <a href={cs.liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 w-4 h-4" /> View Live Project
                  </a>
                </Button>
              )}
              {cs.repoUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={cs.repoUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 w-4 h-4" /> Source Code / Repo
                  </a>
                </Button>
              )}
              {cs.prdUrl && (
                <Button variant="secondary" size="sm" asChild>
                  <NavLink to={cs.prdUrl}>
                    <FileText className="mr-2 w-4 h-4" /> Full PRD Spec
                  </NavLink>
                </Button>
              )}
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* Cover Image Banner */}
      {cs.coverImage && (
        <div className="w-full max-w-6xl mx-auto px-4 -mt-6 sm:-mt-10 mb-12">
          <div className="rounded-2xl overflow-hidden border border-border shadow-soft bg-card max-h-[480px]">
            <img src={cs.coverImage} alt={cs.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Metrics Banner */}
      {cs.metrics && cs.metrics.length > 0 && (
        <Section variant="muted" className="py-10 border-y border-border mb-12">
          <Container>
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {cs.metrics.map((m, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-background border border-border/60 shadow-sm">
                  <span className="block font-heading text-3xl sm:text-4xl font-extrabold text-foreground">
                    {m.value}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">{m.label}</span>
                  {m.qualifier && (
                    <span className="block text-[10px] font-mono text-muted-foreground mt-0.5">
                      (Measurement: {m.qualifier})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Main 10-Section Content Area */}
      <Section className="pb-24">
        <Container>
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Section 2: The Opportunity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-wider">
                <CheckCircle className="w-4 h-4" /> 02. The Opportunity &amp; Why It Mattered
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Framing the Customer &amp; Business Value
              </h2>
              <MarkdownProse>
                {cs.opportunity || cs.problem}
              </MarkdownProse>
            </div>

            {/* Section 3: My Role & Constraints */}
            <div className="space-y-4 border-t border-border/60 pt-10">
              <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" /> 03. My Role &amp; Technical Constraints
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Ownership &amp; Boundary Conditions
              </h2>
              <MarkdownProse>
                {cs.roleConstraints || 'I owned the end-to-end product strategy, technical architecture evaluation, and cross-functional rollout across all internal engineering squads.'}
              </MarkdownProse>
            </div>

            {/* Section 4: Research / Inputs */}
            <div className="space-y-4 border-t border-border/60 pt-10">
              <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-wider">
                <Users className="w-4 h-4" /> 04. Research &amp; Inputs
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Discovery, Telemetry &amp; Customer Interviews
              </h2>
              <MarkdownProse>
                {cs.researchInputs || 'Conducted structured customer interviews and analyzed quantitative telemetry to isolate root causes of friction before designing solutions.'}
              </MarkdownProse>
            </div>

            {/* Section 5: Problem Framing */}
            <div className="space-y-4 border-t border-border/60 pt-10">
              <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-wider">
                <Award className="w-4 h-4" /> 05. Problem Framing &amp; &ldquo;How Might We&rdquo;
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Synthesizing the Core Challenge
              </h2>
              <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-foreground font-medium italic text-lg leading-relaxed">
                {cs.problemFraming || `How might we solve ${cs.title.toLowerCase()} safely and autonomously without introducing engineering velocity drag or production outages?`}
              </div>
            </div>

            {/* Section 6: Options & Decision */}
            <div className="space-y-4 border-t border-border/60 pt-10">
              <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-wider">
                <Layers className="w-4 h-4" /> 06. Options &amp; Architectural Trade-Offs
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Evaluating Alternatives &amp; Selection Rationale
              </h2>
              <MarkdownProse>
                {cs.optionsDecision || 'We evaluated off-the-shelf vendor solutions against custom internal tooling, explicitly weighing build-vs-buy tradeoffs, IP ownership, and developer experience.'}
              </MarkdownProse>
            </div>

            {/* Section 7: PRD Snapshot */}
            <div className="space-y-6 border-t border-border/60 pt-10">
              <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-wider">
                <FileText className="w-4 h-4" /> 07. PRD Snapshot
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Goals, Non-Goals &amp; Success Metrics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3">
                  <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-success" /> Primary Goals &amp; Requirements
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    {cs.prdSnapshot?.requirements?.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    )) || (
                      <>
                        <li>End-to-end telemetry and automated verification</li>
                        <li>Self-service developer console inside existing git workflows</li>
                        <li>Sub-5ms overhead across all internal service requests</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3">
                  <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-destructive" /> Explicit Non-Goals
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    {cs.prdSnapshot?.nonGoals?.map((ng, idx) => (
                      <li key={idx}>{ng}</li>
                    )) || (
                      <>
                        <li>Replacing core multi-cloud provider infrastructure contracts</li>
                        <li>Automating destructive stateful database migrations without human sign-off</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 8: Delivery */}
            <div className="space-y-4 border-t border-border/60 pt-10">
              <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-wider">
                <Layers className="w-4 h-4" /> 08. Delivery &amp; Execution Roadmap
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Execution Milestones &amp; Risk Mitigation
              </h2>
              <MarkdownProse>
                {cs.delivery || cs.approach}
              </MarkdownProse>
            </div>

            {/* Section 9: Outcome & Learning */}
            <div className="space-y-4 border-t border-border/60 pt-10">
              <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-wider">
                <Award className="w-4 h-4" /> 09. Outcome &amp; Post-Launch Learning
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Verified Impact &amp; What I Would Do Differently
              </h2>
              <MarkdownProse>
                {cs.outcomeLearning || cs.outcome}
              </MarkdownProse>
            </div>

            {/* Gallery with Captions */}
            {cs.gallery && cs.gallery.length > 0 && (
              <div className="space-y-6 border-t border-border/60 pt-10">
                <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" /> 10. Visual Evidence &amp; Artifact Gallery
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                  Product Artifacts &amp; Diagrams
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {cs.gallery.map((img, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden border border-border bg-card shadow-sm flex flex-col">
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        <img src={img.url || img.image || img} alt={img.caption || `Artifact ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                      {(img.caption || typeof img === 'string') && (
                        <div className="p-3 text-xs text-muted-foreground font-mono bg-muted/30 border-t border-border/40">
                          {img.caption || img}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Work */}
            {cs.relatedWork && cs.relatedWork.length > 0 && (
              <div className="space-y-4 border-t border-border/60 pt-10">
                <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-wider">
                  <ExternalLink className="w-4 h-4" /> 11. Related Work &amp; Precursors
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                  Connected Explorations &amp; Case Studies
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cs.relatedWork.map((rw, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
                      <h3 className="font-heading font-bold text-sm text-foreground mb-1">
                        {rw.url ? (
                          <NavLink to={rw.url} className="hover:text-primary transition-colors flex items-center justify-between">
                            <span>{rw.title || rw.name}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                          </NavLink>
                        ) : (
                          rw.title || rw.name
                        )}
                      </h3>
                      {rw.relationship && (
                        <p className="text-xs text-muted-foreground font-mono">{rw.relationship}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 12: Links & Contact CTA */}
            <div className="p-8 rounded-2xl bg-muted/60 border border-border flex flex-col sm:flex-row items-center justify-between gap-6 mt-16">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Interested in discussing this work?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Let&apos;s talk about how we can build high-impact product and platform architectures for your engineering organization.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <NavLink to="/contact">Contact Me</NavLink>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <NavLink to="/work">More Case Studies</NavLink>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
};
