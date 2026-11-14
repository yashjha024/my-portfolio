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
import {
  LENSES,
  decisionsForLens,
  hasInteractiveContent,
  normalizeDetails,
} from '../../utils/caseStudyDetails.js';
import {
  DecisionLog,
  EvidenceIndex,
  FeatureLedger,
  InvestigationWalkthrough,
  LensToggle,
  PipelineDiagram,
  PivotTimeline,
  StatusPill,
} from '../../components/caseStudy/InteractiveBlocks.jsx';

const LENS_CAPTIONS = {
  pm: 'Reading as a product manager: problem, decisions, trade-offs.',
  builder: 'Reading as a builder: architecture, build status, debugging.',
  all: 'Showing the full story.',
};

const hasText = (value) => typeof value === 'string' && value.trim() !== '';

/** PRD snapshot list items may be plain strings or { name, desc } objects. */
const toLines = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) => (typeof item === 'string' ? item : item?.name || item?.title || ''))
    .map((line) => String(line).trim())
    .filter(Boolean);

const BlockFrame = ({ children }) => (
  <div className="border-t border-border/60 pt-10">{children}</div>
);

const NarrativeBlock = ({ eyebrow, title, icon: Icon, children }) => (
  <div className="space-y-4 border-t border-border/60 pt-10">
    <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-wider">
      <Icon className="w-4 h-4" /> {eyebrow}
    </div>
    <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
    {children}
  </div>
);

export const CaseStudyDetailPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const previewToken = searchParams.get('preview_token');
  const lensParam = searchParams.get('lens');
  const lensFromUrl = LENSES.includes(lensParam) ? lensParam : 'pm';
  const setLens = (next) => {
    const params = new URLSearchParams(searchParams);
    params.set('lens', next);
    setSearchParams(params, { replace: true, preventScrollReset: true });
  };
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
        <SEO title="Case Study Not Found" noindex />
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

  const details = normalizeDetails(cs.details);
  const interactive = hasInteractiveContent(details);
  // Without interactive blocks there is nothing to switch between, so show everything
  const lens = interactive ? lensFromUrl : 'all';
  const showPm = lens !== 'builder';
  const showBuilder = lens !== 'pm';
  const visibleDecisions = decisionsForLens(details.decisions, lens);
  const prdRequirements = toLines(cs.prdSnapshot?.requirements);
  const prdNonGoals = toLines(cs.prdSnapshot?.nonGoals);

  const heroFacts = [
    hasText(cs.role) && { label: 'Role', value: cs.role },
    hasText(cs.timeline) && { label: 'Timeline', value: cs.timeline },
    hasText(cs.team) && { label: 'Team & scope', value: cs.team },
    details.status && {
      label: 'Status',
      node: <StatusPill stage={details.status.stage} label={details.status.label} className="text-[11px]" />,
    },
  ].filter(Boolean);

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
        title={cs.seoTitle || cs.title}
        description={cs.seoDescription || cs.summary}
        image={cs.ogImage || cs.coverImage}
        imageAlt={cs.title}
        type="case_study"
        publishedTime={cs.publishedAt}
        modifiedTime={cs.updated_at}
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

            {/* Hero Metadata Strip: only fields that exist are shown; nothing is invented */}
            {heroFacts.length > 0 && (
              <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-4 text-xs sm:grid-cols-4 sm:text-sm">
                {heroFacts.map((fact) => (
                  <div key={fact.label}>
                    <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {fact.label}
                    </span>
                    {fact.node || <span className="font-medium text-foreground">{fact.value}</span>}
                  </div>
                ))}
              </div>
            )}

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
              {cs.prototypeUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={cs.prototypeUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 w-4 h-4" /> Prototype
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

      {/* Main content. Sections render only when they have real content. */}
      <Section className="pb-24">
        <Container>
          <div className="max-w-4xl mx-auto space-y-16">
            {interactive && (
              <div className="sticky top-[104px] z-20 -mx-2 flex flex-col gap-3 rounded-2xl bg-background/90 px-2 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <LensToggle lens={lens} onChange={setLens} />
                <p className="hidden text-xs text-muted-foreground sm:block">{LENS_CAPTIONS[lens]}</p>
              </div>
            )}

            {showPm && details.lenses.pm && lens !== 'all' && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <MarkdownProse>{details.lenses.pm}</MarkdownProse>
              </div>
            )}
            {showBuilder && details.lenses.builder && lens !== 'all' && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <MarkdownProse>{details.lenses.builder}</MarkdownProse>
              </div>
            )}

            {showPm && hasText(cs.opportunity || cs.problem) && (
              <NarrativeBlock eyebrow="The problem" title="Why this was worth working on" icon={CheckCircle}>
                <MarkdownProse>{cs.opportunity || cs.problem}</MarkdownProse>
              </NarrativeBlock>
            )}

            {showPm && hasText(cs.roleConstraints) && (
              <NarrativeBlock eyebrow="My role" title="What I owned and the constraints" icon={ShieldAlert}>
                <MarkdownProse>{cs.roleConstraints}</MarkdownProse>
              </NarrativeBlock>
            )}

            {showPm && hasText(cs.researchInputs) && (
              <NarrativeBlock eyebrow="Inputs" title="What informed the direction" icon={Users}>
                <MarkdownProse>{cs.researchInputs}</MarkdownProse>
              </NarrativeBlock>
            )}

            {showPm && hasText(cs.problemFraming) && (
              <NarrativeBlock eyebrow="Problem framing" title="The question I was answering" icon={Award}>
                <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-foreground font-medium italic text-lg leading-relaxed">
                  {cs.problemFraming}
                </div>
              </NarrativeBlock>
            )}

            {showBuilder && details.pipeline && (
              <BlockFrame>
                <PipelineDiagram pipeline={details.pipeline} />
              </BlockFrame>
            )}

            {showBuilder && details.features.length > 0 && (
              <BlockFrame>
                <FeatureLedger features={details.features} />
              </BlockFrame>
            )}

            {visibleDecisions.length > 0 && (
              <BlockFrame>
                <DecisionLog key={lens} decisions={visibleDecisions} />
              </BlockFrame>
            )}

            {showPm && details.decisions.length === 0 && hasText(cs.optionsDecision) && (
              <NarrativeBlock eyebrow="Options" title="Alternatives and trade-offs" icon={Layers}>
                <MarkdownProse>{cs.optionsDecision}</MarkdownProse>
              </NarrativeBlock>
            )}

            {showPm && (prdRequirements.length > 0 || prdNonGoals.length > 0) && (
              <NarrativeBlock eyebrow="PRD snapshot" title="Goals and explicit non-goals" icon={FileText}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {prdRequirements.length > 0 && (
                    <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3">
                      <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-success" /> Goals &amp; requirements
                      </h3>
                      <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                        {prdRequirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {prdNonGoals.length > 0 && (
                    <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3">
                      <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-destructive" /> Non-goals
                      </h3>
                      <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                        {prdNonGoals.map((ng, idx) => (
                          <li key={idx}>{ng}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </NarrativeBlock>
            )}

            {showBuilder && details.investigation && (
              <BlockFrame>
                <InvestigationWalkthrough investigation={details.investigation} />
              </BlockFrame>
            )}

            {showBuilder && hasText(cs.delivery || cs.approach) && (
              <NarrativeBlock eyebrow="Build" title="How it was built" icon={Layers}>
                <MarkdownProse>{cs.delivery || cs.approach}</MarkdownProse>
              </NarrativeBlock>
            )}

            {showPm && details.timeline.length > 0 && (
              <BlockFrame>
                <PivotTimeline timeline={details.timeline} />
              </BlockFrame>
            )}

            {hasText(cs.outcomeLearning || cs.outcome) && (
              <NarrativeBlock eyebrow="Outcome" title="Where it stands and what I learned" icon={Award}>
                <MarkdownProse>{cs.outcomeLearning || cs.outcome}</MarkdownProse>
              </NarrativeBlock>
            )}

            {details.evidence.length > 0 && (
              <BlockFrame>
                <EvidenceIndex evidence={details.evidence} />
              </BlockFrame>
            )}

            {/* Gallery with Captions */}
            {showBuilder && cs.gallery && cs.gallery.length > 0 && (
              <div className="space-y-6 border-t border-border/60 pt-10">
                <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" /> Screens &amp; artifacts
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                  What it looks like
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
                  <ExternalLink className="w-4 h-4" /> Related work
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                  Connected projects
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
                  Happy to walk through the decisions, the code, or what I would change next.
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
