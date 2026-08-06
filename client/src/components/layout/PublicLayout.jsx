import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../shared/Header.jsx';
import { Footer } from '../shared/Footer.jsx';

export const PublicLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Global Keyboard Shortcut: Ctrl + Shift + A (or Cmd + Shift + A) jumps to Admin Login
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        navigate('/login');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col transition-colors">
      {/* Skip to Main Content Link for Accessibility */}
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="w-full flex-1" role="main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
