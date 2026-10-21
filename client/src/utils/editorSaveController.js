/**
 * Framework-free save coordinator shared by the CMS editors.
 *
 * Guarantees:
 * - Every write (autosave or manual) runs through one serial queue, so a slower earlier request can
 *   never land after a later one.
 * - A manual save cancels the pending autosave timer and invalidates autosaves that are already
 *   queued, so they are skipped instead of overwriting the manual result.
 * - Autosave runs only while `canAutosave()` is true (checked when scheduling, when the timer fires,
 *   and again right before the request is sent).
 * - Edits are tracked by revision: content is only reported as saved once a request that included
 *   the latest revision succeeds, and failed requests leave the editor dirty with an error.
 *
 * @param {Object} options
 * @param {(payload: Object, meta: { kind: 'autosave'|'manual', status?: string }) => Promise<any>} options.persist
 *   Performs the write and resolves with the server record; must reject on failure.
 * @param {(meta: { kind: 'autosave'|'manual', status?: string }) => { payload?: Object, error?: string }} options.prepare
 *   Builds the payload from the latest editor state, or returns a validation error.
 * @param {() => boolean} [options.canAutosave]
 * @param {(state: SaveState) => void} [options.onStateChange]
 * @param {number} [options.delayMs]
 * @param {{ setTimeout: Function, clearTimeout: Function }} [options.timers]
 */
export const createEditorSaveController = ({
  persist,
  prepare,
  canAutosave = () => false,
  onStateChange = () => {},
  delayMs = 3000,
  timers = { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout },
}) => {
  let revision = 0;
  let savedRevision = 0;
  let manualEpoch = 0;
  let pending = 0;
  let timer = null;
  let lastError = null;
  let lastSavedAt = null;
  let disposed = false;
  let queueTail = Promise.resolve();

  const getState = () => ({
    dirty: revision !== savedRevision,
    saving: pending > 0,
    error: lastError,
    lastSavedAt,
  });
  const emit = () => {
    if (!disposed) onStateChange(getState());
  };

  const enqueue = (task) => {
    const run = queueTail.then(task, task);
    queueTail = run.catch(() => {});
    return run;
  };

  const cancelAutosave = () => {
    if (timer !== null) {
      timers.clearTimeout(timer);
      timer = null;
    }
  };

  const write = async (payload, meta, capturedRevision) => {
    pending += 1;
    emit();
    try {
      const result = await persist(payload, meta);
      savedRevision = Math.max(savedRevision, capturedRevision);
      lastError = null;
      lastSavedAt = new Date().toISOString();
      return { ok: true, result };
    } catch (error) {
      lastError = error;
      return { ok: false, error };
    } finally {
      pending -= 1;
      emit();
    }
  };

  const runAutosave = () => {
    if (disposed || !canAutosave() || revision === savedRevision) return Promise.resolve(null);
    const epoch = manualEpoch;
    const capturedRevision = revision;
    const prepared = prepare({ kind: 'autosave' });
    // Incomplete drafts (e.g. title too short, invalid JSON) stay dirty without an error banner
    if (prepared.error)
      return Promise.resolve({ ok: false, skipped: true, reason: prepared.error });

    return enqueue(() => {
      if (disposed || epoch !== manualEpoch || !canAutosave()) {
        return { ok: false, skipped: true, reason: 'superseded' };
      }
      return write(prepared.payload, { kind: 'autosave' }, capturedRevision);
    });
  };

  const scheduleAutosave = () => {
    cancelAutosave();
    if (disposed || !canAutosave()) return;
    timer = timers.setTimeout(() => {
      timer = null;
      runAutosave();
    }, delayMs);
  };

  return {
    /** Record a user edit; schedules an autosave when allowed. */
    markDirty() {
      if (disposed) return;
      revision += 1;
      lastError = null;
      scheduleAutosave();
      emit();
    },

    /** Mark the current content as the saved baseline (e.g. after loading from the server). */
    markClean(savedAt = null) {
      cancelAutosave();
      savedRevision = revision;
      lastError = null;
      lastSavedAt = savedAt;
      emit();
    },

    /**
     * Explicit save. `status` is forwarded to `prepare`/`persist` only when the caller asks for a
     * status change (Save Draft / Publish / Archive); a plain Save passes none.
     */
    save({ status } = {}) {
      if (disposed) return Promise.resolve({ ok: false, skipped: true, reason: 'disposed' });
      cancelAutosave();
      manualEpoch += 1;
      const capturedRevision = revision;
      const meta = status ? { kind: 'manual', status } : { kind: 'manual' };
      const prepared = prepare(meta);
      if (prepared.error) {
        lastError = new Error(prepared.error);
        emit();
        return Promise.resolve({ ok: false, validation: true, error: lastError });
      }
      return enqueue(async () => {
        const outcome = await write(prepared.payload, meta, capturedRevision);
        // Edits typed while the request was in flight still need saving
        if (revision !== savedRevision) scheduleAutosave();
        return outcome;
      });
    },

    /** Re-evaluate autosave eligibility (call after the confirmed status changes). */
    refreshAutosave() {
      if (revision !== savedRevision) scheduleAutosave();
      else cancelAutosave();
    },

    getState,

    /** Stop all timers and ignore late results (call on unmount). */
    dispose() {
      cancelAutosave();
      disposed = true;
    },
  };
};

/** Map controller state to the AutosaveIndicator status vocabulary. */
export const toIndicatorStatus = (state) => {
  if (state.saving) return 'saving';
  if (state.error) return 'error';
  if (state.dirty) return 'unsaved';
  return 'saved';
};
