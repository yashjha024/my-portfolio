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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-500" />
          <p className="font-mono text-xs uppercase tracking-wider text-slate-400">
            Verifying Admin Session...
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated or not owner/editor, display forbidden or login prompt
  if (!user || !isOwner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">Access Restricted</h2>
          <p className="mb-6 text-sm text-slate-400">
            You must be logged in with an{' '}
            <span className="font-semibold text-indigo-400">Owner</span> or{' '}
            <span className="font-semibold text-indigo-400">Editor</span> account to access the
            Admin CMS.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Sign In to Admin
            </button>
            <a
              href="/"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
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
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white md:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 md:flex">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-600/20">
              CMS
            </div>
            <div>
              <span className="block text-sm font-semibold tracking-tight text-white">
                Portfolio Admin
              </span>
              <span className="block font-mono text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                Production Level
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
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
                  `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
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
        <div className="border-t border-slate-800 bg-slate-900/50 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/40 p-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
              {user.email?.[0]?.toUpperCase() || 'E'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {user.full_name || user.email}
              </p>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase text-emerald-400">
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
              className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700"
              title="View Public Website"
            >
              <span>Live Site</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-2 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
              title="Sign Out"
            >
              <LogOut className="h-3 w-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-900 p-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            CMS
          </div>
          <span className="text-sm font-semibold text-white">Portfolio Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 flex flex-col bg-slate-950/90 pt-16 backdrop-blur-xl md:hidden">
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
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
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
          <div className="flex gap-2 border-t border-slate-800 p-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-center text-sm font-medium"
            >
              <span>Live Site</span>
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={logout}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-3 text-sm font-medium text-rose-300"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
