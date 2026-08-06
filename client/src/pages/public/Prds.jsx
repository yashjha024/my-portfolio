import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, CheckCircle, ShieldAlert } from 'lucide-react';
import { usePortfolioData } from '../../hooks/usePortfolioData.js';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { Grid } from '../../components/layout/Grid.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { InteractiveCard, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card.jsx';
import { PrdCardSkeleton } from '../../components/ui/Skeleton.jsx';
import { SEO } from '../../components/shared/SEO.jsx';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav.jsx';

export const PrdsIndexPage = () => {
  const { data: prds, loading } = usePortfolioData({ type: 'prds', delayMs: 350 });

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'PRDs & Specifications', url: '/prds' },
  ];

  return (
    <>
      <SEO
        title="PRD Library & Specifications"
        description="Explore complete, engineering-ready Product Requirements Documents showing structured trade-offs, non-goals, P0/P1 requirements, and verifiable release gates."
        type="website"
        breadcrumbs={breadcrumbs}
      />

      {/* Header */}
      <Section className="pt-20 pb-24 md:pt-28 md:pb-36 border-b border-border bg-background">
        <Container>
          <div className="max-w-3xl space-y-4">
            <BreadcrumbNav items={breadcrumbs} />
            <Badge variant="outline" className="flex items-center gap-1.5 w-max">
              <FileText className="w-3.5 h-3.5 text-primary" /> Engineering-Ready Specifications
            </Badge>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground leading-tight">
              PRD Library
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Product Requirements Documents should never be fluffy wishlists. These public PRDs demonstrate how I structure technical goals, explicit non-goals, strict P0/P1 requirements, and verifiable release gates.
            </p>
          </div>
        </Container>
      </Section>

      {/* PRDs Grid */}
      <Section className="bg-background">
        <Container>
          {loading ? (
            <Grid cols={2} gap="lg">
              <PrdCardSkeleton />
              <PrdCardSkeleton />
            </Grid>
          ) : prds?.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card/50 p-8 max-w-lg mx-auto">
              <p className="font-heading text-lg font-bold text-foreground mb-1">No public PRDs available</p>
              <p className="text-sm text-muted-foreground">Check back soon for new published specifications.</p>
            </div>
          ) : (
            <Grid cols={2} gap="lg">
              {prds.map((prd, idx) => (
                <motion.div
                  key={prd.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                >
                  <NavLink to={`/prds/${prd.slug}`} className="block h-full focus-visible:outline-none">
                    <InteractiveCard className="h-full flex flex-col justify-between p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={prd.stage === 'Approved' ? 'success' : 'default'} className="text-[10px] uppercase font-mono">
                            Stage: {prd.stage}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">Public Artifact</span>
                        </div>

                        <CardHeader className="p-0">
                          <CardTitle className="text-xl leading-snug">{prd.title}</CardTitle>
                        </CardHeader>

                        <CardContent className="p-0 space-y-4">
                          <CardDescription className="line-clamp-3 text-xs sm:text-sm">
                            {prd.context}
                          </CardDescription>

                          <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-foreground font-medium">
                              <CheckCircle className="w-3.5 h-3.5 text-success" />
                              <span>{prd.sections?.requirements?.length || 4} Specific Req IDs</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-foreground font-medium">
                              <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
                              <span>{prd.sections?.nonGoals?.length || 2} Explicit Non-Goals</span>
                            </div>
                          </div>
                        </CardContent>
                      </div>

                      <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-mono">ID: {prd.slug.slice(0, 16)}...</span>
                        <span className="font-semibold text-primary flex items-center gap-1 group-hover:underline">
                          Read Full Specification <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </InteractiveCard>
                  </NavLink>
                </motion.div>
              ))}
            </Grid>
          )}
        </Container>
      </Section>
    </>
  );
};
