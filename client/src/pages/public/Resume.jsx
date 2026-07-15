import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Printer, Mail, MapPin } from 'lucide-react';
import { Github, Linkedin } from '../../components/ui/Icon.jsx';
import { usePortfolioData } from '../../hooks/usePortfolioData.js';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { Button } from '../../components/ui/Button.jsx';

export const ResumePage = () => {
  const { data: profile } = usePortfolioData({ type: 'profile', delayMs: 100 });

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <title>{`${profile?.name || 'Yash Jhai'} | Resume & Curriculum Vitae`}</title>
      <meta name="description" content="View or download the verified product management and systems engineering resume of Yash Jhai." />
      <meta property="og:title" content="Resume | Yash Jhai Portfolio" />

      {/* Action Bar */}
      <Section className="py-6 border-b border-border/60 bg-muted/30 print:hidden">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">Curriculum Vitae / Resume</h1>
              <p className="text-xs text-muted-foreground">Formatted for recruiter scannability and 1-click PDF download.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={handlePrint} className="shadow-sm">
                <Printer className="mr-2 w-4 h-4" /> Print / Save as PDF
              </Button>
              <Button variant="outline" size="sm" asChild>
                <NavLink to="/contact">Let&apos;s Connect</NavLink>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Printable Resume Document Container */}
      <Section className="py-12 print:py-0 print:m-0">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto rounded-2xl border border-border bg-card p-8 sm:p-12 shadow-md space-y-10 print:border-none print:shadow-none print:p-0 print:max-w-none"
          >
            {/* Header / Contact Strip */}
            <div className="border-b border-border pb-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {profile?.name || 'Yash Jhai'}
                </h2>
                <span className="font-heading text-lg font-bold text-primary">
                  {profile?.role || 'Senior Staff Product / Program Manager'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> {profile?.location || 'San Francisco, CA / Remote'}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-primary" /> {profile?.email || 'yash.jhai@example.com'}
                </span>
                <a
                  href={profile?.linkedin || 'https://linkedin.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground underline underline-offset-2"
                >
                  <Linkedin className="w-3.5 h-3.5 text-primary" /> LinkedIn Profile
                </a>
                <a
                  href={profile?.github || 'https://github.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground underline underline-offset-2"
                >
                  <Github className="w-3.5 h-3.5 text-primary" /> GitHub Repo
                </a>
              </div>

              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed pt-2">
                {profile?.bio}
              </p>
            </div>

            {/* Experience Section */}
            <div className="space-y-6">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2">
                Professional Experience
              </h3>

              <div className="space-y-8">
                {/* Role 1 */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <h4 className="font-heading font-bold text-base text-foreground">
                      Senior Staff Product / Program Manager — Enterprise Cloud Platform
                    </h4>
                    <span className="text-xs font-mono font-semibold text-muted-foreground">2023 – Present</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    <li>Led 0-to-1 product definition and cross-functional program execution for autonomous cloud cost governance control plane across 40 engineering squads, driving <strong className="text-foreground">$4.2M in annualized savings</strong>.</li>
                    <li>Architected and launched AI-powered technical onboarding co-pilot indexing 4M lines of internal code, reducing new hire time-to-first-commit by <strong className="text-foreground">84% (from 22 days to 3.5 days)</strong>.</li>
                    <li>Orchestrated zero-downtime Envoy/Istio service mesh migration across 140 microservices ahead of schedule with literally zero customer-facing downtime and <strong className="text-foreground">42ms latency reduction</strong>.</li>
                  </ul>
                </div>

                {/* Role 2 */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <h4 className="font-heading font-bold text-base text-foreground">
                      Lead Technical Product Manager — Developer Infrastructure
                    </h4>
                    <span className="text-xs font-mono font-semibold text-muted-foreground">2021 – 2023</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    <li>Owned core API Gateway and developer experience roadmap handling 50,000 requests/sec across multi-region clusters.</li>
                    <li>Shipped self-service scoped API key lifecycle management system required for Tier-1 SOC2 and ISO 27001 compliance sign-off.</li>
                    <li>Established GitOps declarative routing CRDs that increased squad self-service deployment velocity by <strong className="text-foreground">1,200%</strong>.</li>
                  </ul>
                </div>

                {/* Role 3 */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <h4 className="font-heading font-bold text-base text-foreground">
                      Senior Distributed Systems Engineer — Core Backend
                    </h4>
                    <span className="text-xs font-mono font-semibold text-muted-foreground">2018 – 2021</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    <li>Engineered high-concurrency backend services using Golang and Node.js with strict P99 latency SLA targets.</li>
                    <li>Created eBPF-based OpenTelemetry metrics pipelines and managed multi-cluster Kubernetes resource federation.</li>
                  </ul>
                </div>

                {/* Role 4 */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <h4 className="font-heading font-bold text-base text-foreground">
                      Software Systems Engineer
                    </h4>
                    <span className="text-xs font-mono font-semibold text-muted-foreground">2016 – 2018</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    <li>Built real-time data ingestion pipelines and automated CI/CD deployment infrastructure using Python, Docker, and AWS.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Core Competencies */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2">
                Core Competencies &amp; Technologies
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <strong className="text-foreground block mb-1">Product Leadership &amp; TPM:</strong>
                  <p className="text-muted-foreground leading-relaxed">0-to-1 Product Strategy, PRD Authoring, Cross-Squad Governance, FinOps Modeling, Customer Discovery, OKRs, Zero-Downtime Migration Execution.</p>
                </div>
                <div>
                  <strong className="text-foreground block mb-1">Architecture &amp; Stack:</strong>
                  <p className="text-muted-foreground leading-relaxed">MERN (MongoDB, Express, React 19, Node.js), TypeScript, Go, Kubernetes, Envoy/Istio Service Mesh, eBPF, OpenTelemetry, AWS/GCP FinOps.</p>
                </div>
              </div>
            </div>

            {/* Education & Credentials */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2">
                Education &amp; Certifications
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-sm">
                <div>
                  <strong className="text-foreground">B.S. in Computer Science &amp; Systems Engineering</strong>
                  <span className="block text-muted-foreground">University Honors — Specialization in Distributed Operating Systems</span>
                </div>
                <span className="font-mono text-muted-foreground font-semibold">2012 – 2016</span>
              </div>
            </div>

            {/* Print Footer Note */}
            <div className="pt-6 border-t border-border/40 text-center text-xs text-muted-foreground print:pt-4">
              <p>References and verified code repositories available upon request &bull; <NavLink to="/" className="underline">portfolio.yashjhai.com</NavLink></p>
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  );
};
