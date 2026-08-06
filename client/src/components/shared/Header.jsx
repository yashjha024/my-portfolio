import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { MobileMenu } from './MobileMenu.jsx';
import { cn } from '../../utils/cn.js';
import { usePortfolioData } from '../../hooks/usePortfolioData.js';

export const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/work', label: 'Work' },
  { to: '/thinking', label: 'Product Thinking' },
  { to: '/prds', label: 'PRDs' },
  { to: '/about', label: 'About' },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: profile } = usePortfolioData({ type: 'profile' });

  const dynamicNavLinks = [
    { to: '/', label: 'Home' },
    { to: '/work', label: profile?.navLabels?.work || 'Work' },
    { to: '/thinking', label: profile?.navLabels?.thinking || 'Product Thinking' },
    { to: '/prds', label: profile?.navLabels?.prds || 'PRDs' },
    { to: '/about', label: profile?.navLabels?.about || 'About' },
  ];

  return (
    <header className="pointer-events-none sticky top-4 z-50 w-full px-4 transition-all duration-200 sm:top-6 sm:px-6">
      <div className="border-border bg-card shadow-soft pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-6 rounded-full border px-6 py-3">
        {/* Brand Name */}
        <NavLink
          to="/"
          className="font-heading text-foreground shrink-0 text-lg font-extrabold tracking-tight transition-opacity hover:opacity-80"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span>{profile?.name || 'Yash Jha'}</span>
        </NavLink>

        {/* Centered Desktop Navigation */}
        <nav
          className="hidden items-center justify-center gap-1.5 md:flex"
          aria-label="Desktop Navigation"
        >
          {dynamicNavLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-secondary text-foreground border-border shadow-subtle border font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side: Resume button */}
        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <Button
            asChild
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90 shadow-subtle rounded-full px-5 font-semibold"
          >
            <NavLink to={profile?.resumeUrl || '/resume'}>Resume</NavLink>
          </Button>
        </div>

        {/* Mobile Toggle Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? (
              <X className="text-foreground h-5 w-5" />
            ) : (
              <Menu className="text-foreground h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={dynamicNavLinks}
      />
    </header>
  );
};
