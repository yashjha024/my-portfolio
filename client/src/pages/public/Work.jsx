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

export const WorkIndexPage = () => {
  const { data, loading } = usePortfolioData({ delayMs: 350 });
  const { caseStudies } = data;

  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

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
    });
    return Array.from(tagSet);
  }, [caseStudies]);

  const filteredCaseStudies = useMemo(() => {
    if (!caseStudies) return [];
    return caseStudies.filter((cs) => {
      const matchesType = activeType === 'all' || cs.type === activeType;
      const matchesSearch =
        searchQuery === '' ||
        cs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.domain?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || cs.tags?.includes(selectedTag);

      return matchesType && matchesSearch && matchesTag;
    });
  }, [caseStudies, activeType, searchQuery, selectedTag]);

  return (
    <>
      <title>Case Studies &amp; Shipped Projects | Yash Jhai Portfolio</title>
      <meta name="description" content="Explore verified product case studies, 0-to-1 platform launches, and technical program migrations." />
      <meta property="og:title" content="Work & Case Studies | Yash Jhai Portfolio" />

      {/* Hero Header */}
      <Section className="pt-10 pb-12 md:pt-16 md:pb-16 border-b border-border/40 bg-gradient-to-b from-background to-muted/20">
        <Container>
          <div className="max-w-3xl space-y-4">
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
      <Section variant="muted" className="py-6 border-b border-border/60">
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

          {/* Skill / Domain Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/40">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Skills &amp; Domain Tags:</span>
            {availableTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={selectedTag === tag}
                onSelect={() => setSelectedTag(selectedTag === tag ? null : tag)}
                size="sm"
              />
            ))}
            {selectedTag && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTag(null)}
                className="text-[11px] h-6 px-2 text-destructive hover:text-destructive"
              >
                Clear tag
              </Button>
            )}
          </div>
        </Container>
      </Section>

      {/* Case Studies Grid */}
      <Section className="py-12 sm:py-16">
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
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
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
