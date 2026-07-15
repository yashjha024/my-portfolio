import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { MobileMenu } from './MobileMenu.jsx';
import { cn } from '../../utils/cn.js';

export const navLinks = [
  { to: '/work', label: 'Work' },
  { to: '/thinking', label: 'Product Thinking' },
  { to: '/prds', label: 'PRDs' },
  { to: '/about', label: 'About' },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-border/80 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand / Role Positioning */}
        <NavLink
          to="/"
          className="font-heading text-foreground flex flex-col gap-1 text-lg font-bold tracking-tight transition-opacity hover:opacity-80 sm:flex-row sm:items-center"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span>Yash Jhai</span>
          <span className="text-muted-foreground hidden font-normal sm:inline-block">/</span>
          <span className="text-primary/80 dark:text-primary-foreground/80 text-xs font-medium sm:text-sm">
            Product Portfolio Platform
          </span>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex lg:gap-2" aria-label="Desktop Navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTAs + Theme Toggle */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Button variant="outline" size="sm" asChild>
            <NavLink to="/resume">Resume</NavLink>
          </Button>
          <Button variant="default" size="sm" asChild>
            <NavLink to="/contact">Let&apos;s talk</NavLink>
          </Button>
        </div>

        {/* Mobile Toggle Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? (
              <X className="text-foreground h-6 w-6" />
            ) : (
              <Menu className="text-foreground h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={navLinks}
      />
    </header>
  );
};
