import { useEffect, useRef } from 'react';

export const UNSAVED_CHANGES_MESSAGE =
  'You have unsaved changes. Leave this page and discard them?';

/**
 * Warn before losing unsaved editor changes.
 * - Browser refresh/close/external navigation: native `beforeunload` prompt.
 * - In-app links (react-router <Link>/<NavLink> render <a href>): a capture-phase click listener
 *   asks for confirmation before React Router handles the click.
 * The app uses <BrowserRouter> (not a data router), so `useBlocker` is unavailable; browser
 * back/forward buttons inside the SPA are therefore not intercepted.
 */
export const useUnsavedChangesGuard = (dirty, message = UNSAVED_CHANGES_MESSAGE) => {
  useEffect(() => {
    if (!dirty) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    const handleClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (
        !anchor ||
        (anchor.target && anchor.target !== '_self') ||
        anchor.hasAttribute('download')
      ) {
        return;
      }
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return; // beforeunload covers it
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      ) {
        return;
      }
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
  }, [dirty, message]);
};

/**
 * Ctrl/Cmd+S anywhere in the editor page runs a plain Save (status preserved).
 * MarkdownEditor handles the shortcut itself and calls preventDefault, so it is not saved twice.
 */
export const useSaveShortcut = (onSave) => {
  const latest = useRef(onSave);
  latest.current = onSave;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        latest.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
