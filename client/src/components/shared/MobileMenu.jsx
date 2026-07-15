import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button.jsx';
import { cn } from '../../utils/cn.js';

export const MobileMenu = ({ isOpen, onClose, navLinks }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="bg-background/80 fixed inset-0 z-40 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
          <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="border-border bg-background fixed inset-x-0 top-[65px] z-50 border-b px-6 py-6 shadow-xl md:hidden"
            aria-label="Mobile Navigation Menu"
          >
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[44px] items-center rounded-lg px-3 py-3 text-base font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-muted'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="border-border flex flex-col gap-3 border-t pt-4 sm:flex-row">
                <Button
                  variant="outline"
                  asChild
                  className="min-h-[44px] w-full justify-center"
                  onClick={onClose}
                >
                  <NavLink to="/resume">Resume</NavLink>
                </Button>
                <Button
                  variant="default"
                  asChild
                  className="min-h-[44px] w-full justify-center"
                  onClick={onClose}
                >
                  <NavLink to="/contact">Let&apos;s talk</NavLink>
                </Button>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
};
