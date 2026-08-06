import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Filter } from 'lucide-react';
import { usePortfolioData } from '../../hooks/usePortfolioData.js';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { Grid } from '../../components/layout/Grid.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { InteractiveCard, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card.jsx';
import { CaseStudyCardSkeleton } from '../../components/ui/Skeleton.jsx';
import { SEO } from '../../components/shared/SEO.jsx';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav.jsx';

export const WorkIndexPage = () => {
  const { data, loading } = usePortfolioData({ delayMs: 350 });
  const { caseStudies } = data;

  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const filterTypes = [
    { id: 'all', label: 'All Work' },
    { id: 'shipped_project', label: 'Shipped Projects' },
    { id: 'product_case_study', label: 'Product Case Studies' },
    { id: 'program_case_study', label: 'Program Case Studies' },
  ];

  const availableTags = useMemo(() => {
    if (!caseStudies) return [];
    const tagSet = new Set();
    caseStudies.forEach((cs) => {
      cs.tags?.forEach((tag) => tagSet.add(tag));
      cs.skills?.forEach((skill) => tagSet.add(skill));
    });
    return Array.from(tagSet);
  }, [caseStudies]);

  const availableDomains = useMemo(() => {
    if (!caseStudies) return [];
    const domainSet = new Set();
    caseStudies.forEach((cs) => {
      if (cs.domain) domainSet.add(cs.domain);
    });
    return Array.from(domainSet);
  }, [caseStudies]);

  const availableYears = useMemo(() => {
    if (!caseStudies) return [];
    const yearSet = new Set();
    caseStudies.forEach((cs) => {
      if (cs.year) yearSet.add(String(cs.year));
    });
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [caseStudies]);

  const filteredCaseStudies = useMemo(() => {
    if (!caseStudies) return [];
    return caseStudies.filter((cs) => {
      const matchesType = activeType === 'all' || cs.type === activeType;
      const matchesSearch =
        searchQuery === '' ||
        cs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag =
        !selectedTag || cs.tags?.includes(selectedTag) || cs.skills?.includes(selectedTag);
      const matchesDomain = !selectedDomain || cs.domain === selectedDomain;
      const matchesYear = !selectedYear || String(cs.year) === selectedYear;

      return matchesType && matchesSearch && matchesTag && matchesDomain && matchesYear;
    });
  }, [caseStudies, activeType, searchQuery, selectedTag, selectedDomain, selectedYear]);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Work / Case Studies', url: '/work' },
  ];

  return (
    <>
      <SEO
        title="Case Studies & Shipped Projects"
        description="Explore verified product case studies, 0-to-1 platform launches, and technical program migrations with explicit problem framing and metrics."
        type="website"
        breadcrumbs={breadcrumbs}
      />

      {/* Hero Header */}
      <Section className="pt-20 pb-24 md:pt-28 md:pb-36 border-b border-border bg-background">
        <Container>
          <div className="max-w-3xl space-y-4">
            <BreadcrumbNav items={breadcrumbs} />
            <Badge variant="outline">Case Studies &amp; Evidence</Badge>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground leading-tight">
              Evidence Over Opinion
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Every project here includes explicit problem framing, technical constraints, verified metrics, and exact links to live code or comprehensive PRD artifacts.
            </p>
          </div>
        </Container>
      </Section>

      {/* Filter Bar & Search */}
      <Section variant="muted" className="py-10 border-b border-border">
        <Container>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Type Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-muted-foreground mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {filterTypes.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeType === tab.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveType(tab.id)}
                  className="rounded-full text-xs"
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search domain, title, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm bg-background rounded-full"
                aria-label="Search case studies"
              />
            </div>
          </div>

          {/* Year and Domain Filters */}
          {(availableYears.length > 0 || availableDomains.length > 0) && (
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border/40">
              {availableYears.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Year:</span>
                  {availableYears.map((yr) => (
                    <Chip
                      key={yr}
                      label={yr}
                      selected={selectedYear === yr}
                      onSelect={() => setSelectedYear(selectedYear === yr ? null : yr)}
                      size="sm"
                    />
                  ))}
                </div>
              )}
              {availableDomains.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground ml-2">Domain:</span>
                  {availableDomains.map((dom) => (
                    <Chip
                      key={dom}
                      label={dom}
                      selected={selectedDomain === dom}
                      onSelect={() => setSelectedDomain(selectedDomain === dom ? null : dom)}
                      size="sm"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skill / Tag Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/40">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Skills &amp; Tags:</span>
            {availableTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={selectedTag === tag}
                onSelect={() => setSelectedTag(selectedTag === tag ? null : tag)}
                size="sm"
              />
            ))}
            {(selectedTag || selectedDomain || selectedYear) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTag(null);
                  setSelectedDomain(null);
                  setSelectedYear(null);
                }}
                className="text-[11px] h-6 px-2 text-destructive hover:text-destructive"
              >
                Clear all filters
              </Button>
            )}
          </div>
        </Container>
      </Section>

      {/* Case Studies Grid */}
      <Section className="bg-background">
        <Container>
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">
              Showing <span className="text-foreground font-bold">{loading ? '...' : filteredCaseStudies.length}</span> case {filteredCaseStudies.length === 1 ? 'study' : 'studies'}
            </span>
          </div>

          {loading ? (
            <Grid cols={3} gap="lg">
              <CaseStudyCardSkeleton />
              <CaseStudyCardSkeleton />
              <CaseStudyCardSkeleton />
            </Grid>
          ) : filteredCaseStudies.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card/50 p-8 max-w-lg mx-auto">
              <p className="font-heading text-lg font-bold text-foreground mb-1">No case studies matched your filter</p>
              <p className="text-sm text-muted-foreground mb-6">
                Try clearing your search term or selecting &ldquo;All Work&rdquo; from the filter tabs.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveType('all');
                  setSearchQuery('');
                  setSelectedTag(null);
                }}
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            <Grid cols={3} gap="lg">
              {filteredCaseStudies.map((cs, idx) => (
                <motion.div
                  key={cs.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                >
                  <NavLink to={`/work/${cs.slug}`} className="block h-full focus-visible:outline-none">
                    <InteractiveCard className="h-full flex flex-col justify-between">
                      <div>
                        {cs.coverImage && (
                          <div className="w-full h-48 overflow-hidden bg-muted border-b border-border">
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
                          <CardTitle className="text-xl leading-snug">{cs.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4 space-y-3">
                          <CardDescription className="line-clamp-3 text-xs sm:text-sm">
                            {cs.summary}
                          </CardDescription>

                          {/* Key Metrics Highlight */}
                          {cs.metrics && cs.metrics.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                              {cs.metrics.slice(0, 2).map((m, i) => (
                                <div key={i} className="bg-muted/40 p-2 rounded">
                                  <span className="block font-heading font-bold text-sm text-foreground">
                                    {m.value}
                                  </span>
                                  <span className="block text-[10px] text-muted-foreground truncate">{m.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </div>

                      <div className="p-6 pt-0 mt-auto border-t border-border/60 flex items-center justify-between text-xs pt-4">
                        <div className="flex flex-wrap gap-1">
                          {cs.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium text-[11px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="font-semibold text-primary flex items-center gap-1 group-hover:underline">
                          Read Case Study <ArrowRight className="w-3.5 h-3.5" />
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
