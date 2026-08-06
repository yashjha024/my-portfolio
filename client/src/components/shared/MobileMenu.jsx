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
            className="bg-foreground/10 fixed inset-0 z-40 md:hidden"
            aria-hidden="true"
          />
          <motion.nav
            ref={menuRef}
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="border-border bg-card shadow-soft fixed inset-x-4 top-[76px] z-50 rounded-2xl border p-6 sm:inset-x-6 md:hidden"
            aria-label="Mobile Navigation Menu"
            aria-modal="true"
            role="dialog"
          >
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[44px] items-center rounded-xl px-4 py-3 text-base font-medium transition-colors',
                      isActive
                        ? 'bg-secondary text-foreground border-border border font-bold'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="border-border flex flex-col gap-3 border-t pt-4 sm:flex-row">
                <Button
                  asChild
                  className="bg-foreground text-background hover:bg-foreground/90 min-h-[44px] w-full justify-center rounded-xl font-semibold"
                  onClick={onClose}
                >
                  <NavLink to="/resume">Resume</NavLink>
                </Button>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
};
