import React from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, Linkedin, Github, FileText, Globe } from 'lucide-react';
import { Container } from '../layout/Container.jsx';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-border bg-background w-full border-t py-12 transition-colors md:py-16">
      <Container>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Col 1: Identity & Positioning */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="font-heading text-foreground text-lg font-bold tracking-tight">
              Yash Jhai
            </h3>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              Senior Product Manager &amp; Builder. Specializing in technical 0-to-1 product
              strategy, scalable platform architectures, and data-driven execution.
            </p>
            <div className="text-muted-foreground flex items-center gap-2 pt-1 font-mono text-xs">
              <Globe className="text-primary h-4 w-4" />
              <span>Available globally &amp; open to senior product leadership discussions</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-foreground text-sm font-semibold uppercase tracking-wider">
              Explore
            </h4>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <NavLink to="/work" className="hover:text-primary transition-colors">
                  Case Studies
                </NavLink>
              </li>
              <li>
                <NavLink to="/thinking" className="hover:text-primary transition-colors">
                  Product Thinking
                </NavLink>
              </li>
              <li>
                <NavLink to="/prds" className="hover:text-primary transition-colors">
                  PRD Library
                </NavLink>
              </li>
              <li>
                <NavLink to="/about" className="hover:text-primary transition-colors">
                  About &amp; Principles
                </NavLink>
              </li>
              <li>
                <NavLink to="/resume" className="hover:text-primary transition-colors">
                  Interactive Resume
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Connect */}
          <div className="space-y-3">
            <h4 className="text-foreground text-sm font-semibold uppercase tracking-wider">
              Connect
            </h4>
            <ul className="text-muted-foreground space-y-2.5 text-sm">
              <li>
                <a
                  href="mailto:yash@example.com"
                  className="hover:text-primary inline-flex items-center gap-2 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email directly</span>
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary inline-flex items-center gap-2 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn profile</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary inline-flex items-center gap-2 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub repository</span>
                </a>
              </li>
              <li>
                <NavLink
                  to="/resume"
                  className="hover:text-primary inline-flex items-center gap-2 font-medium transition-colors"
                >
                  <FileText className="text-primary h-4 w-4" />
                  <span>Download CV / Resume</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-border/60 text-muted-foreground mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-xs sm:flex-row">
          <p>© {currentYear} Yash Jhai. Built with MERN Stack, React 19 &amp; Tailwind CSS.</p>
          <div className="flex items-center gap-4">
            <NavLink to="/contact" className="hover:text-foreground transition-colors">
              Contact
            </NavLink>
            <span>•</span>
            <NavLink to="/login" className="hover:text-foreground transition-colors">
              Owner Console
            </NavLink>
          </div>
        </div>
      </Container>
    </footer>
  );
};
