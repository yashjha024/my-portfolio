import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Filter, BookOpen } from 'lucide-react';
import { usePortfolioData } from '../../hooks/usePortfolioData.js';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { Grid } from '../../components/layout/Grid.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { InteractiveCard, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card.jsx';
import { ArticleCardSkeleton } from '../../components/ui/Skeleton.jsx';
import { SEO } from '../../components/shared/SEO.jsx';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav.jsx';

export const ThinkingIndexPage = () => {
  const { data, loading } = usePortfolioData({ delayMs: 350 });
  const { articles } = data;

  const [activeType, setActiveType] = useState('all');

  const filterTabs = [
    { id: 'all', label: 'All Articles' },
    { id: 'teardown', label: 'Product Teardowns' },
    { id: 'feature_proposal', label: 'Feature Proposals' },
    { id: 'essay', label: 'Essays & Strategy' },
  ];

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    return articles.filter((art) => {
      if (activeType === 'all') return true;
      return art.type === activeType || art.tags?.map((t) => t.toLowerCase()).includes(activeType.replace('_', ' '));
    });
  }, [articles, activeType]);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Product Thinking', url: '/thinking' },
  ];

  return (
    <>
      <SEO
        title="Product Thinking, Teardowns & Strategy"
        description="Explore architectural teardowns, feature proposals, and platform engineering strategy essays on developer experience and 0-to-1 execution."
        type="website"
        breadcrumbs={breadcrumbs}
      />

      {/* Header */}
      <Section className="pt-10 pb-12 md:pt-16 md:pb-16 border-b border-border/40 bg-gradient-to-b from-background to-muted/20">
        <Container>
          <div className="max-w-3xl space-y-4">
            <BreadcrumbNav items={breadcrumbs} />
            <Badge variant="outline" className="flex items-center gap-1.5 w-max">
              <BookOpen className="w-3.5 h-3.5 text-primary" /> Product Teardowns &amp; Strategy Essays
            </Badge>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground leading-tight">
              Product Thinking
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Writing is thinking. Here are my detailed architectural teardowns (such as improving WhatsApp group coordination) along with strategy essays on developer experience, platform economics, and 0-to-1 execution.
            </p>
          </div>
        </Container>
      </Section>

      {/* Filter Tabs */}
      <Section variant="muted" className="py-6 border-b border-border/60">
        <Container>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-muted-foreground mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            {filterTabs.map((tab) => (
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
        </Container>
      </Section>

      {/* Articles Grid */}
      <Section className="py-12 sm:py-16">
        <Container>
          {loading ? (
            <Grid cols={2} gap="lg">
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
            </Grid>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card/50 p-8 max-w-lg mx-auto">
              <p className="font-heading text-lg font-bold text-foreground mb-1">No articles found for this category</p>
              <p className="text-sm text-muted-foreground mb-6">
                Try selecting another category or viewing &ldquo;All Articles&rdquo;.
              </p>
              <Button variant="outline" size="sm" onClick={() => setActiveType('all')}>
                View All Articles
              </Button>
            </div>
          ) : (
            <Grid cols={2} gap="lg">
              {filteredArticles.map((art, idx) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                >
                  <NavLink to={`/thinking/${art.slug}`} className="block h-full focus-visible:outline-none">
                    <InteractiveCard className="h-full flex flex-col justify-between">
                      <div>
                        {art.coverImage && (
                          <div className="w-full h-52 overflow-hidden bg-muted border-b border-border">
                            <img
                              src={art.coverImage}
                              alt={art.title}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <Badge variant="outline" className="text-[10px] font-mono uppercase">
                              {art.type?.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">{art.readingTime}</span>
                          </div>
                          <CardTitle className="text-xl leading-snug">{art.title}</CardTitle>
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
                        <span className="font-semibold text-primary flex items-center gap-1 group-hover:underline">
                          Read Article <ArrowRight className="w-3.5 h-3.5" />
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
