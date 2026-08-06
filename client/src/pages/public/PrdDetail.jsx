import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, CheckCircle, ShieldAlert, ExternalLink } from 'lucide-react';
import { usePortfolioData, toPrdDto } from '../../hooks/usePortfolioData.js';
import api from '../../services/api.js';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table.jsx';
import { DetailPageSkeleton } from '../../components/ui/Skeleton.jsx';
import { SEO } from '../../components/shared/SEO.jsx';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav.jsx';
import { calculateReadingTime } from '../../utils/calculateReadingTime.js';

export const PrdDetailPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const previewToken = searchParams.get('preview_token');
  const { data: prds, loading: listLoading } = usePortfolioData({ type: 'prds', delayMs: 350 });

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
      .get(`/prds/slug/${slug}?preview_token=${encodeURIComponent(previewToken)}`)
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setPreviewItem(toPrdDto(res.data.data));
        }
      })
      .catch((err) => {
        setPreviewError(err.response?.data?.error || 'Unauthorized or expired preview token');
      })
      .finally(() => {
        setPreviewLoading(false);
      });
  }, [slug, previewToken]);

  const prd = previewToken ? previewItem : prds?.find((item) => item.slug === slug);
  const loading = previewToken ? previewLoading : listLoading;

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!prd) {
    return (
      <Section className="py-24 text-center">
        <Container>
          <div className="max-w-md mx-auto space-y-4">
            <h1 className="font-heading text-3xl font-bold text-foreground">
              {previewError ? 'Preview Unauthorized' : 'PRD Specification Not Found'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {previewError || (
                <>
                  We couldn&apos;t find the specification matching slug <code className="font-mono bg-muted px-2 py-0.5 rounded">{slug}</code>.
                </>
              )}
            </p>
            <Button asChild>
              <NavLink to="/prds">
                <ArrowLeft className="mr-2 w-4 h-4" /> Return to PRD Specifications
              </NavLink>
            </Button>
          </div>
        </Container>
      </Section>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const sections = prd.sections && typeof prd.sections === 'object' && !Array.isArray(prd.sections) ? prd.sections : {};
  const requirements = Array.isArray(sections.requirements) ? sections.requirements : [];
  const goals = Array.isArray(sections.goals) ? sections.goals : [];
  const nonGoals = Array.isArray(sections.nonGoals) ? sections.nonGoals : [];
  const metrics = Array.isArray(sections.metrics) ? sections.metrics : [];
  const releaseGates = Array.isArray(sections.releaseGates) ? sections.releaseGates : [];
  const allSectionsText = `${prd.context || ''} ${JSON.stringify(sections)}`;
  const computedReadingTime = calculateReadingTime(allSectionsText).text;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'PRDs & Specifications', url: '/prds' },
    { name: prd.title, url: `/prds/${prd.slug}` },
  ];

  return (
    <>
      {previewToken && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-center text-xs font-medium text-amber-500 flex items-center justify-center gap-2 print:hidden">
          <span>⚠️ Preview Mode — Viewing draft / private specification (Owner Only)</span>
        </div>
      )}
      <SEO
        title={prd.title}
        description={prd.context?.substring(0, 160)}
        type="prd"
        publishedTime={prd.updatedAt || prd.createdAt}
        breadcrumbs={breadcrumbs}
      />

      {/* Header */}
      <Section className="pt-20 pb-24 md:pt-28 md:pb-36 border-b border-border bg-background print:bg-white print:border-none">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="max-w-4xl space-y-5"
          >
            <div className="flex items-center justify-between gap-4 print:hidden">
              <BreadcrumbNav items={breadcrumbs} />
              <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5 font-semibold shrink-0">
                <Printer className="w-4 h-4" /> Print / Save PDF
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant={prd.stage === 'Approved' ? 'success' : 'default'} className="uppercase font-mono text-xs">
                Status: {prd.stage}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                Visibility: {prd.visibility}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">&bull; {computedReadingTime}</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
              {prd.title}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {prd.context}
            </p>

            {prd.relatedCaseStudy && (
              <div className="p-4 rounded-xl bg-muted/60 border border-border flex items-center justify-between text-xs sm:text-sm print:hidden">
                <span className="text-muted-foreground font-medium">
                  Related Case Study: <strong className="text-foreground">{prd.relatedCaseStudy?.replace(/-/g, ' ')}</strong>
                </span>
                <Button variant="link" size="sm" asChild className="p-0 h-auto font-semibold">
                  <NavLink to={`/work/${prd.relatedCaseStudy}`}>
                    View Case Study <ExternalLink className="ml-1 w-3.5 h-3.5" />
                  </NavLink>
                </Button>
              </div>
            )}
          </motion.div>
        </Container>
      </Section>

      {/* Main PRD Sections */}
      <Section className="pb-24 print:py-8">
        <Container>
          <div className="max-w-4xl mx-auto space-y-16">
            {/* 1. Problem Statement */}
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
                Section 01. Problem Statement &amp; Context
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Why Are We Building This?
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {sections.problem || 'No problem statement provided.'}
              </p>
            </div>

            {/* 2. Goals & Non-Goals */}
            <div className="space-y-6 border-t border-border/60 pt-10">
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
                Section 02. Scope Boundary
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Goals &amp; Explicit Non-Goals
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-card border border-border shadow-subtle space-y-3">
                  <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-success" /> Primary Goals
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-muted-foreground">
                    {goals.map((g, idx) => (
                      <li key={idx} className="leading-relaxed">{g}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border shadow-subtle space-y-3">
                  <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-destructive" /> Explicit Non-Goals
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-muted-foreground">
                    {nonGoals.map((ng, idx) => (
                      <li key={idx} className="leading-relaxed">{ng}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. Detailed Requirements Table */}
            <div className="space-y-6 border-t border-border/60 pt-10">
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
                Section 03. Engineering Requirements
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Functional &amp; Non-Functional Requirements
              </h2>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Req ID</TableHead>
                    <TableHead className="w-24">Priority</TableHead>
                    <TableHead className="w-64">Requirement Name</TableHead>
                    <TableHead>Technical Specification &amp; Acceptance Criteria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((req, index) => (
                    <TableRow key={req.id || index}>
                      <TableCell className="font-mono font-bold text-primary text-xs">{req.id || `REQ-${index + 1}`}</TableCell>
                      <TableCell>
                        <Badge
                          variant={req.priority === 'P0' ? 'destructive' : req.priority === 'P1' ? 'warning' : 'secondary'}
                          className="text-[10px] font-mono uppercase"
                        >
                          {req.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground text-xs sm:text-sm">{req.name || req.title || 'Requirement'}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {req.desc || req.userStory || 'No specification provided.'}
                        {Array.isArray(req.acceptanceCriteria) && req.acceptanceCriteria.length > 0 && (
                          <ul className="mt-2 list-disc space-y-1 pl-4">{req.acceptanceCriteria.map((criterion, criterionIndex) => <li key={criterionIndex}>{criterion}</li>)}</ul>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 4. Success Metrics */}
            <div className="space-y-6 border-t border-border/60 pt-10">
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
                Section 04. Verification &amp; Telemetry
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Success Metrics &amp; SLO Targets
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {metrics.map((m, idx) => (
                  <div key={idx} className="p-5 rounded-xl bg-card border border-border space-y-1 shadow-subtle">
                    <span className="block font-heading font-bold text-base text-foreground">{m.name}</span>
                    <span className="text-xs font-mono text-primary font-semibold block">{m.target}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Release Gates */}
            <div className="space-y-6 border-t border-border/60 pt-10">
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
                Section 05. Go / No-Go Criteria
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Mandatory Launch Gates
              </h2>

              <div className="p-6 rounded-xl bg-muted/40 border border-border space-y-3">
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground font-medium">
                  {releaseGates.map((gate, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{typeof gate === 'string' ? gate : <><strong>{gate.name || 'Release gate'}{gate.status ? ` — ${gate.status}` : ''}</strong>{gate.criteria ? `: ${gate.criteria}` : ''}</>}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Print Note CTA */}
            <div className="pt-12 text-center print:hidden">
              <Button size="lg" onClick={handlePrint} className="shadow-subtle">
                <Printer className="mr-2 w-4 h-4" /> Print or Download PDF Spec
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
};
