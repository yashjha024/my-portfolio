import React from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, FileText, Lock } from 'lucide-react';
import { Github, Linkedin } from '../ui/Icon.jsx';
import { Container } from '../layout/Container.jsx';
import { Button } from '../ui/Button.jsx';
import { usePortfolioData } from '../../hooks/usePortfolioData.js';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { data: profile } = usePortfolioData({ type: 'profile' });

  return (
    <footer className="border-border bg-secondary w-full border-t py-12 transition-colors sm:py-16">
      <Container>
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          {/* Identity: Name & Role */}
          <div className="space-y-1.5">
            <h3 className="font-heading text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
              {profile?.name || 'Yash Jha'}
            </h3>
            <p className="text-muted-foreground text-sm font-medium sm:text-base">
              {profile?.role || 'Product Professional & AI/ML Engineer'}
            </p>
          </div>

          {/* Actions: Social Links, Email, Resume */}
          <div className="flex flex-wrap items-center gap-3">
            {profile?.email && (
              <a
                href={`mailto:${profile.email}`}
                className="border-border bg-card text-foreground shadow-subtle hover:bg-background inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors sm:text-sm"
              >
                <Mail className="text-muted-foreground h-4 w-4 shrink-0" />
                <span>Email</span>
              </a>
            )}

            {profile?.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border bg-card text-foreground shadow-subtle hover:bg-background inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors sm:text-sm"
              >
                <Linkedin className="text-muted-foreground h-4 w-4 shrink-0" />
                <span>LinkedIn</span>
              </a>
            )}

            {profile?.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border bg-card text-foreground shadow-subtle hover:bg-background inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors sm:text-sm"
              >
                <Github className="text-muted-foreground h-4 w-4 shrink-0" />
                <span>GitHub</span>
              </a>
            )}

            <Button
              asChild
              size="sm"
              className="bg-foreground text-background hover:bg-foreground/90 shadow-subtle rounded-full px-5 py-5 text-xs font-bold sm:text-sm"
            >
              <NavLink to={profile?.resumeUrl || '/resume'}>
                <FileText className="mr-1.5 h-4 w-4" /> Resume
              </NavLink>
            </Button>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Discreet Admin Access */}
        <div className="border-border/80 text-muted-foreground mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 font-mono text-xs sm:flex-row">
          <p>
            {profile?.copyright ||
              `© ${currentYear} ${profile?.name || 'Yash Jha'}. All rights reserved.`}
          </p>
          <div className="flex items-center gap-4">
            <span>Designed with intentional simplicity &amp; editorial focus.</span>
            <span>•</span>
            <NavLink
              to="/login"
              className="hover:text-foreground inline-flex items-center gap-1.5 opacity-60 transition-colors hover:opacity-100"
              title="Owner CMS Command Center"
            >
              <Lock className="h-3 w-3" />
              <span>Admin Login</span>
            </NavLink>
          </div>
        </div>
      </Container>
    </footer>
  );
};
