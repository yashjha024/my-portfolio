import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button.jsx';
import { cn } from '../../utils/cn.js';

export const MobileMenu = ({ isOpen, onClose, navLinks }) => {
  const menuRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const firstFocusable = menuRef.current?.querySelector('a, button');
    firstFocusable?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !menuRef.current) return;
      const focusables = [...menuRef.current.querySelectorAll('a, button:not([disabled])')];
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="bg-background/80 pointer-events-auto fixed inset-0 z-40 backdrop-blur-md md:hidden"
            aria-hidden="true"
          />
          <motion.nav
            ref={menuRef}
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="border-border bg-card pointer-events-auto fixed inset-x-4 top-[72px] z-50 rounded-2xl border p-5 shadow-xl sm:inset-x-6 sm:top-[84px] md:hidden"
            aria-label="Mobile Navigation Menu"
            aria-modal="true"
            role="dialog"
          >
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[48px] items-center rounded-xl px-4 py-3 text-base font-semibold transition-all duration-150',
                      isActive
                        ? 'border-border bg-secondary text-foreground shadow-subtle border font-extrabold'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="border-border mt-2 flex flex-col gap-2.5 border-t pt-4 sm:flex-row">
                <Button
                  asChild
                  className="bg-foreground text-background shadow-soft hover:bg-foreground/90 min-h-[48px] w-full justify-center rounded-xl font-bold"
                  onClick={onClose}
                >
                  <NavLink to="/resume">View Resume</NavLink>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="min-h-[48px] w-full justify-center rounded-xl font-bold"
                  onClick={onClose}
                >
                  <NavLink to="/contact">Let&apos;s Talk</NavLink>
                </Button>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
};
