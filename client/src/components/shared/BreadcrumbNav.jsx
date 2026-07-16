import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Accessible UI Breadcrumb Navigation component.
 * Adheres strictly to WCAG AA guidelines with aria-label, role, and aria-current attributes.
 */
export const BreadcrumbNav = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb navigation" className="py-3 font-mono text-xs text-slate-400">
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li className="flex items-center">
          <Link
            to="/"
            className="flex items-center gap-1 rounded px-1 text-slate-400 transition-colors hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Go to Home"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden="true" />
              {isLast || !item.url ? (
                <span
                  className="max-w-[240px] truncate font-bold text-slate-200 sm:max-w-xs"
                  aria-current="page"
                  title={item.name}
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.url}
                  className="max-w-[200px] truncate rounded px-1 text-slate-400 transition-colors hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  title={item.name}
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
