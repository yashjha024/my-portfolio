import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Printer, Mail, MapPin, Phone, Award, BookOpen, Briefcase, Code, FolderGit2 } from 'lucide-react';
import { Github, Linkedin } from '../../components/ui/Icon.jsx';
import { usePortfolioData } from '../../hooks/usePortfolioData.js';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SEO } from '../../components/shared/SEO.jsx';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav.jsx';

export const ResumePage = () => {
  const { data: profile } = usePortfolioData({ type: 'profile', delayMs: 100 });

  const handlePrint = () => {
    if (profile?.resumeUrl && (profile.resumeUrl.includes('.pdf') || profile.resumeUrl.startsWith('http'))) {
      window.open(profile.resumeUrl, '_blank');
    } else {
      window.print();
    }
  };

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Resume & Curriculum Vitae', url: '/resume' },
  ];

  return (
    <>
      <SEO
        title="Resume & Curriculum Vitae"
        description="View or download the verified product management and AI/ML engineering resume of Yash Jha formatted for recruiter scannability."
        type="website"
        breadcrumbs={breadcrumbs}
      />

      {/* Action Bar */}
      <Section className="py-6 border-b border-border/60 bg-muted/30 print:hidden">
        <Container>
          <BreadcrumbNav items={breadcrumbs} />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">Curriculum Vitae / Resume</h1>
              <p className="text-xs text-muted-foreground">Formatted for recruiter scannability and 1-click PDF print/download.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {profile?.resumeUrl && (profile.resumeUrl.includes('.pdf') || profile.resumeUrl.startsWith('http')) ? (
                <Button size="sm" asChild className="shadow-sm">
                  <a href={profile.resumeUrl} download target="_blank" rel="noopener noreferrer">
                    Download PDF
                  </a>
                </Button>
              ) : (
                <Button size="sm" onClick={handlePrint} className="shadow-sm">
                  Download PDF
                </Button>
              )}
              <Button size="sm" onClick={handlePrint} variant="outline" className="shadow-sm">
                <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
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
                  {profile?.name || 'Yash Jha'}
                </h2>
                <span className="font-heading text-lg font-bold text-primary">
                  {profile?.role || 'Product Professional & AI/ML Engineer'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> {profile?.location || 'Delhi, IN'}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-primary" /> {profile?.email || 'yashjha024@gmail.com'}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-primary" /> {profile?.phone || '+91-7759831707'}
                </span>
                <a
                  href={profile?.linkedin || 'https://linkedin.com/in/yashjha024'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground underline underline-offset-2"
                >
                  <Linkedin className="w-3.5 h-3.5 text-primary" /> yashjha024
                </a>
                <a
                  href={profile?.github || 'https://github.com/yashjha024'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground underline underline-offset-2"
                >
                  <Github className="w-3.5 h-3.5 text-primary" /> yashjha024
                </a>
              </div>

              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed pt-2">
                {profile?.bio ||
                  'Product professional with experience taking digital products from requirement gathering to launch, with hands-on exposure to workflow design, feature scoping, and product analytics. Comfortable working at the intersection of business needs and technical execution, with a track record of contributing to live platforms in learning and commerce environments.'}
              </p>
            </div>

            {/* Education Section */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Education
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-sm">
                <div>
                  <strong className="text-foreground text-base">Birla Institute of Technology, Mesra</strong>
                  <span className="block text-foreground/90 font-medium italic">B.Tech in Artificial Intelligence and Machine Learning</span>
                  <span className="block text-muted-foreground pt-1">
                    <strong className="text-foreground/80">Coursework:</strong> Statistics, Analysis of Algorithms, Data Structures, Machine Learning, Deep Learning
                  </span>
                </div>
                <span className="font-mono text-muted-foreground font-semibold sm:text-right shrink-0">Nov 2022 – June 2026</span>
              </div>
            </div>

            {/* Experience Section */}
            <div className="space-y-6">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Experience
              </h3>

              <div className="space-y-8">
                {/* Role 1 */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-base text-foreground">Product Intern</h4>
                      <span className="text-sm font-semibold text-primary/90">Istockly</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-muted-foreground sm:text-right">Remote/BLR | Dec 2025 – Present</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    <li>Owned delivery of a production LMS for financial education, translating business needs into <strong className="text-foreground">4 core workflows</strong> across course management, learner onboarding, progress tracking, and certification.</li>
                    <li>Designed experiences for 2 user groups (learners and admins) improving workflow clarity and reducing operational friction by an estimated <strong className="text-foreground">20%</strong>.</li>
                    <li>Developed analytics visibility across <strong className="text-foreground">4 key KPIs</strong>, cutting manual reporting effort by an estimated <strong className="text-foreground">25%</strong> and enabling faster content and pricing decisions.</li>
                    <li>Standardized stakeholder-driven feature execution and secure access controls across 2 platform roles, improving consistency in administrative operations.</li>
                  </ul>
                </div>

                {/* Role 2 */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-base text-foreground">Project Intern</h4>
                      <span className="text-sm font-semibold text-primary/90">Diptech Technologies</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-muted-foreground sm:text-right">Patna, BR | June 2025 – Dec 2025</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    <li>Owned workflow definition for an industrial commerce platform, covering <strong className="text-foreground">5 core journeys</strong>: product discovery, ordering, partial payments, loan support, and after-sales service.</li>
                    <li>Structured platform operations for 3 user groups (customers, brands, and admins) streamlining product approvals, homepage visibility, and transaction oversight.</li>
                    <li>Enabled high-value purchase workflows through <strong className="text-foreground">Razorpay-based partial payments</strong> and auto-generated loan quotations, reducing manual documentation effort by an estimated <strong className="text-foreground">20–25%</strong>.</li>
                    <li>Extended the product beyond checkout by integrating technician appointment booking, improving continuity between purchase and after-sales support.</li>
                  </ul>
                </div>

                {/* Role 3 */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-base text-foreground">Research Intern</h4>
                      <span className="text-sm font-semibold text-primary/90">National Institute of Technology (NIT), Patna</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-muted-foreground sm:text-right">Patna, BR | May 2025 – July 2025</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    <li>Extended a <strong className="text-foreground">CVPR 2024 few-shot learning pipeline</strong> from 1 dataset family to 2 medical imaging domains, supporting cross-domain experimentation and model evaluation.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Projects Section */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4" /> Projects
              </h3>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <h4 className="font-heading font-bold text-base text-foreground">
                    Campus-Connect <a href="https://github.com/yashjha024/" target="_blank" rel="noopener noreferrer" className="text-xs font-mono font-normal text-primary underline ml-2">github.com/yashjha024/</a>
                  </h4>
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                  <li>Owned product design for a student-faculty dashboard platform, improving access to academic records, grades, and deadlines through role-based workflows.</li>
                  <li>Defined user flows for profile management, achievement tracking, and deadline visibility, translating student and faculty pain points into shipped product features.</li>
                  <li>Collaborated with backend teams to integrate secure APIs and dynamic forms, improving data accuracy and usability across the platform.</li>
                </ul>
              </div>
            </div>

            {/* Technologies Section */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2 flex items-center gap-2">
                <Code className="w-4 h-4" /> Technologies &amp; Skills
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <strong className="text-foreground block mb-1">Analytics &amp; BI:</strong>
                  <p className="text-muted-foreground leading-relaxed">SQL, PostgreSQL, Microsoft Excel, Google Sheets, Power BI, Tableau.</p>
                </div>
                <div>
                  <strong className="text-foreground block mb-1">Product &amp; Collaboration:</strong>
                  <p className="text-muted-foreground leading-relaxed">Figma, Jira, Notion, Git, GitHub, Google Workspace, Microsoft Office, Trello.</p>
                </div>
                <div>
                  <strong className="text-foreground block mb-1">Product Methods &amp; Agile:</strong>
                  <p className="text-muted-foreground leading-relaxed">Requirements Gathering, Process Mapping (As-Is/To-Be), BRD Documentation, User Story Writing, UAT, Agile/Scrum, Troubleshooting.</p>
                </div>
                <div>
                  <strong className="text-foreground block mb-1">Automation, AI &amp; Tech Stack:</strong>
                  <p className="text-muted-foreground leading-relaxed">n8n, REST APIs, Razorpay Integration, JavaScript, Python, React.js, Node.js, MongoDB, LangChain, RAG, LLMs.</p>
                </div>
              </div>
            </div>

            {/* Roles and Responsibilities Section */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Roles and Responsibilities
              </h3>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <h4 className="font-heading font-bold text-base text-foreground">
                    Training and Placement Cell — Placement Coordinator
                  </h4>
                  <span className="text-xs font-mono font-semibold text-muted-foreground sm:text-right">March 2025 – Present</span>
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                  <li>Managed placement workflows between students and recruiters, aligning scheduling, communication, and logistics across multiple stakeholders.</li>
                  <li>Supported interview readiness through mock interviews and preparation sessions while helping expand recruiter engagement and placement opportunities.</li>
                </ul>
              </div>
            </div>

            {/* Certifications Section */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2 flex items-center gap-2">
                <Award className="w-4 h-4" /> Certifications
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <div>
                    <strong className="text-foreground">Google Advanced Data Analytics</strong>
                    <span className="text-primary font-mono text-xs ml-2">[Verified Certificate]</span>
                  </div>
                  <span className="font-mono text-muted-foreground font-semibold sm:text-right">May 2024</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <div>
                    <strong className="text-foreground">Google Business Intelligence</strong>
                    <span className="text-primary font-mono text-xs ml-2">[Verified Certificate]</span>
                  </div>
                  <span className="font-mono text-muted-foreground font-semibold sm:text-right">June 2024</span>
                </div>
              </div>
            </div>

            {/* Print Footer Note */}
            <div className="pt-6 border-t border-border/40 text-center text-xs text-muted-foreground print:pt-4">
              <p>Yash Jha &bull; Delhi, IN &bull; yashjha024@gmail.com &bull; +91-7759831707 &bull; <NavLink to="/" className="underline">portfolio.yashjha024.com</NavLink></p>
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  );
};
