import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Terminal } from 'lucide-react';
import { usePortfolioData } from '../../hooks/usePortfolioData.js';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { Grid } from '../../components/layout/Grid.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { MarkdownProse } from '../../components/ui/MarkdownProse.jsx';
import { Timeline, TimelineItem, TimelineDot, TimelineContent } from '../../components/ui/Timeline.jsx';
import { SEO } from '../../components/shared/SEO.jsx';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav.jsx';

export const AboutPage = () => {
  const { data: about } = usePortfolioData({ type: 'about', delayMs: 350 });

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'About Me & Principles', url: '/about' },
  ];

  return (
    <>
      <SEO
        title="About Me & Career Journey"
        description="Learn about my career evolution from Senior Distributed Systems Engineer to Lead Product & Program Manager."
        type="website"
        breadcrumbs={breadcrumbs}
      />

      {/* Hero Section */}
      <Section className="pt-20 pb-24 md:pt-28 md:pb-36 border-b border-border bg-background">
        <Container>
          <div className="max-w-3xl space-y-4">
            <BreadcrumbNav items={breadcrumbs} />
            <Badge variant="outline" className="flex items-center gap-1.5 w-max">
              <Terminal className="w-3.5 h-3.5 text-primary" /> Engineering &amp; Product Narrative
            </Badge>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground leading-tight">
              About Me &amp; Principles
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              I translate complex technical infrastructure into high-leverage product value. Here is my story, my core decision-making frameworks, and the engineering foundation behind my product work.
            </p>
          </div>
        </Container>
      </Section>

      {/* Narrative & Story */}
      <Section className="py-16 sm:py-20 bg-background">
        <Container>
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              From Systems Engineer to Product Leader
            </h2>
            <MarkdownProse>
              {about?.story || 'I spent 8 years designing distributed systems before transitioning into technical product leadership.'}
            </MarkdownProse>
          </div>
        </Container>
      </Section>

      {/* Core Operating Principles */}
      <Section variant="muted" className="py-16 border-y border-border/60">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-2">
              Decision Frameworks
            </Badge>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Core Operating Principles
            </h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              How I lead cross-functional execution and avoid golden-cage platform pitfalls.
            </p>
          </div>

          <Grid cols={2} gap="md" className="max-w-4xl mx-auto">
            {about?.principles?.map((p, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-background border border-border/80 shadow-subtle space-y-2"
              >
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Principle 0{idx + 1}</span>
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">{p.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Career Progression Timeline */}
      <Section className="py-16 sm:py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="mb-10">
              <Badge variant="outline" className="mb-2">
                Career Track Record
              </Badge>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Experience Timeline
              </h2>
            </div>

            <Timeline>
              {about?.timeline?.map((item, idx) => (
                <TimelineItem key={idx}>
                  <TimelineDot active={idx === 0} />
                  <TimelineContent
                    date={item.date}
                    title={item.title}
                    description={item.description}
                  />
                </TimelineItem>
              ))}
            </Timeline>
          </div>
        </Container>
      </Section>

      {/* Education & Academic Foundation Section */}
      {about?.educations && about.educations.length > 0 && (
        <Section className="py-16 sm:py-20 border-t border-border/60 bg-background">
          <Container>
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <Badge variant="outline" className="mb-2">
                  Academic Background
                </Badge>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Education &amp; Credentials
                </h2>
              </div>

              <div className="space-y-6">
                {about.educations.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 rounded-2xl border border-border bg-card space-y-2 shadow-subtle"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-heading text-lg font-bold text-foreground">
                        {item.degree} {item.field_of_study ? `in ${item.field_of_study}` : ''}
                      </h3>
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.start_date ? `${item.start_date} – ` : ''}
                        {item.is_present ? 'Present' : item.end_date || ''}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-primary">{item.institution}</p>

                    {item.gpa && (
                      <p className="text-xs font-mono font-semibold text-emerald-600">
                        Academic Performance: {item.gpa}
                      </p>
                    )}

                    {item.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Skills & Domains Matrix */}
      <Section variant="muted" className="py-16 border-t border-border/60">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="mb-10 text-center">
              <Badge variant="outline" className="mb-2">
                Full-Stack Capabilities
              </Badge>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Skills &amp; Domain Matrix
              </h2>
            </div>

            <div className="space-y-8">
              {about?.skills &&
                Object.entries(about.skills).map(([category, skillsList]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="font-heading text-lg font-bold text-foreground border-b border-border/60 pb-2">
                      {category}
                    </h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {skillsList.map((skill) => (
                        <Chip key={skill} label={skill} selected={false} size="md" />
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-12 mt-12 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="font-heading font-bold text-foreground text-lg">Ready for an application-ready record?</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">Download or print my complete resume in one click.</p>
              </div>
              <Button asChild size="lg">
                <NavLink to="/resume">
                  View Full Resume <ArrowRight className="ml-2 w-4 h-4" />
                </NavLink>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
};
