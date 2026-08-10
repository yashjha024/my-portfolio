import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Briefcase,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  MessageSquare,
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, isOwner, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="border-primary/20 border-t-primary h-8 w-8 animate-spin rounded-full border-2" />
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
            Verifying Admin Session...
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated or not owner/editor, display forbidden or login prompt
  if (!user || !isOwner) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
        <div className="border-border bg-card shadow-soft w-full max-w-md rounded-2xl border p-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-foreground mb-2 text-xl font-bold">Access Restricted</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            You must be logged in with an <span className="text-primary font-semibold">Owner</span>{' '}
            or <span className="text-primary font-semibold">Editor</span> account to access the
            Admin CMS.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
            >
              Sign In to Admin
            </button>
            <a
              href="/"
              className="bg-secondary border-border text-foreground hover:bg-secondary/80 flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
            >
              <span>Public Site</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Case Studies', path: '/admin/work', icon: Briefcase },
    { name: 'Thinking Articles', path: '/admin/thinking', icon: BookOpen },
    { name: 'PRD Library', path: '/admin/prds', icon: FileText },
    { name: 'Media Library', path: '/admin/media', icon: ImageIcon },
    { name: 'Inquiries & Inbox', path: '/admin/messages', icon: MessageSquare },
    { name: 'Site Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground flex min-h-screen flex-col md:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="border-border bg-card sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r md:flex">
        <div className="border-border flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground shadow-subtle flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold">
              CMS
            </div>
            <div>
              <span className="text-foreground block text-sm font-semibold tracking-tight">
                Portfolio Admin
              </span>
              <span className="text-success block font-mono text-[10px] font-medium uppercase tracking-wider">
                Production Level
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <div className="text-muted-foreground px-3 py-2 font-mono text-[10px] uppercase tracking-wider">
            CMS Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-subtle font-semibold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="border-border bg-card border-t p-4">
          <div className="border-border bg-secondary/50 mb-3 flex items-center gap-3 rounded-xl border p-2">
            <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {user.email?.[0]?.toUpperCase() || 'E'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-xs font-medium">
                {user.full_name || user.email}
              </p>
              <span className="text-success inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase">
                <UserCheck className="h-2.5 w-2.5" />
                {user.role || 'Owner'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary border-border text-foreground hover:bg-secondary/80 flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors"
              title="View Public Website"
            >
              <span>Live Site</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-2 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-500/20"
              title="Sign Out"
            >
              <LogOut className="h-3 w-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <header className="border-border bg-card sticky top-0 z-50 flex items-center justify-between border-b p-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold">
            CMS
          </div>
          <span className="text-foreground text-sm font-semibold">Portfolio Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg p-2 transition-colors"
          aria-label="Toggle Mobile Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="bg-background fixed inset-0 z-40 flex flex-col pt-16 md:hidden">
          <div className="border-border bg-card border-b p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {user.email?.[0]?.toUpperCase() || 'E'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-semibold">
                  {user.full_name || user.email}
                </p>
                <span className="text-success inline-flex items-center gap-1 font-mono text-xs font-medium uppercase">
                  <UserCheck className="h-3 w-3" />
                  {user.role || 'Owner'}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-40" />
                </NavLink>
              );
            })}
          </nav>

          <div className="border-border bg-card flex gap-2 border-t p-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary border-border text-foreground flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-center text-sm font-medium"
            >
              <span>Live Site</span>
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-3 text-sm font-medium text-rose-500"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="bg-background min-w-0 flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
