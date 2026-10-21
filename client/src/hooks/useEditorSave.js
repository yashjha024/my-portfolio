import { useEffect, useMemo, useRef, useState } from 'react';
import { createEditorSaveController, toIndicatorStatus } from '../utils/editorSaveController.js';

const INITIAL_STATE = { dirty: false, saving: false, error: null, lastSavedAt: null };

/**
 * React binding for the editor save controller. `persist`, `prepare` and `canAutosave` may change
 * every render; the controller always calls the latest versions, so timers never read stale state.
 * The controller is created on mount and disposed on unmount (cancelling any pending autosave).
 */
export const useEditorSave = ({ persist, prepare, canAutosave, delayMs = 3000 }) => {
  const latest = useRef({ persist, prepare, canAutosave });
  latest.current = { persist, prepare, canAutosave };

  const controllerRef = useRef(null);
  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => {
    const controller = createEditorSaveController({
      persist: (payload, meta) => latest.current.persist(payload, meta),
      prepare: (meta) => latest.current.prepare(meta),
      canAutosave: () => Boolean(latest.current.canAutosave?.()),
      onStateChange: setState,
      delayMs,
    });
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [delayMs]);

  const api = useMemo(
    () => ({
      markDirty: () => controllerRef.current?.markDirty(),
      markClean: (savedAt) => controllerRef.current?.markClean(savedAt),
      save: (options) =>
        controllerRef.current?.save(options) ??
        Promise.resolve({ ok: false, skipped: true, reason: 'not-ready' }),
      refreshAutosave: () => controllerRef.current?.refreshAutosave(),
    }),
    []
  );

  return { ...api, state, indicatorStatus: toIndicatorStatus(state) };
};
