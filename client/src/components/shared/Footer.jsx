import React from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, FileText, ArrowUp } from 'lucide-react';
import { Github, Linkedin } from '../ui/Icon.jsx';
import { Container } from '../layout/Container.jsx';
import { usePortfolioData } from '../../hooks/usePortfolioData.js';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { data: profile } = usePortfolioData({ type: 'profile' });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-border bg-secondary w-full border-t py-12 transition-colors sm:py-16">
      <Container>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
          {/* Col 1: Identity & Positioning (Spans 6 cols on desktop) */}
          <div className="space-y-4 md:col-span-6">
            <div className="space-y-1">
              <h3 className="font-heading text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
                {profile?.name || 'Yash Jha'}
              </h3>
              <p className="text-muted-foreground font-mono text-xs font-semibold uppercase tracking-wider">
                Product • AI • Technology
              </p>
            </div>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed sm:text-base">
              I build products at the intersection of user problems, technology, and execution.
            </p>
          </div>

          {/* Col 2: Explore Navigation (Spans 3 cols on desktop) */}
          <div className="space-y-3 md:col-span-3">
            <h4 className="text-foreground font-mono text-xs font-bold uppercase tracking-wider">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <NavLink
                  to="/work"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Work
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/thinking"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Thinking
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/prds"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  PRDs
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/about"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Col 3: Connect Links (Spans 3 cols on desktop) */}
          <div className="space-y-3 md:col-span-3">
            <h4 className="text-foreground font-mono text-xs font-bold uppercase tracking-wider">
              Connect
            </h4>
            <ul className="space-y-2.5 text-sm">
              {profile?.email && (
                <li>
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>Email</span>
                  </a>
                </li>
              )}
              {profile?.linkedin && (
                <li>
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
                  >
                    <Linkedin className="h-4 w-4 shrink-0" />
                    <span>LinkedIn</span>
                  </a>
                </li>
              )}
              {profile?.github && (
                <li>
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
                  >
                    <Github className="h-4 w-4 shrink-0" />
                    <span>GitHub</span>
                  </a>
                </li>
              )}
              <li>
                <NavLink
                  to={profile?.resumeUrl || '/resume'}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 font-medium transition-colors"
                >
                  <FileText className="text-primary h-4 w-4 shrink-0" />
                  <span>Resume</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="border-border/80 text-muted-foreground mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 font-mono text-xs sm:flex-row">
          <p>© {currentYear} Yash Jha</p>
          <button
            type="button"
            onClick={scrollToTop}
            className="hover:text-foreground focus:ring-primary inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors focus:outline-none focus:ring-1"
            aria-label="Back to top of page"
          >
            <span>Back to top</span>
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </Container>
    </footer>
  );
};
