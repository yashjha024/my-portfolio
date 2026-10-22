import test from 'node:test';
import assert from 'node:assert';
import {
  createEditorSaveController,
  toIndicatorStatus,
} from '../src/utils/editorSaveController.js';
import { buildCaseStudyPayload } from '../src/utils/editorPayload.js';

// --- helpers ----------------------------------------------------------------
const createFakeTimers = () => {
  let now = 0;
  let seq = 0;
  const tasks = new Map();
  return {
    setTimeout(fn, ms) {
      seq += 1;
      tasks.set(seq, { fn, at: now + ms });
      return seq;
    },
    clearTimeout(id) {
      tasks.delete(id);
    },
    advance(ms) {
      now += ms;
      for (const [id, task] of [...tasks].sort((a, b) => a[1].at - b[1].at)) {
        if (task.at <= now) {
          tasks.delete(id);
          task.fn();
        }
      }
    },
    get pending() {
      return tasks.size;
    },
  };
};

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const flush = async () => {
  for (let i = 0; i < 10; i += 1) await new Promise((resolve) => setImmediate(resolve));
};

/**
 * Simulated editor: a case-study form whose confirmed status gates autosave, a server that
 * records every write, and per-call control over when each request resolves.
 */
const createHarness = ({ status = 'draft', autoResolve = true } = {}) => {
  const timers = createFakeTimers();
  const editor = {
    form: {
      title: 'Case study title',
      slug: 'case-study-title',
      summary: 'A summary long enough to pass validation.',
      type: 'product_case_study',
      status,
      year: '',
    },
  };
  const server = { status, calls: [], pending: [] };

  const controller = createEditorSaveController({
    timers,
    delayMs: 3000,
    prepare: ({ status: nextStatus }) =>
      buildCaseStudyPayload(editor.form, {}, { status: nextStatus }),
    canAutosave: () => editor.form.status === 'draft',
    persist: (payload, meta) => {
      const call = { payload, meta, settled: false };
      server.calls.push(call);
      const apply = () => {
        if (payload.status) server.status = payload.status;
        call.settled = true;
        return { ...payload, status: server.status };
      };
      if (autoResolve) return Promise.resolve(apply());
      const d = deferred();
      server.pending.push({
        resolve: () => d.resolve(apply()),
        reject: (err) => {
          call.settled = true;
          d.reject(err);
        },
      });
      return d.promise;
    },
  });

  // Mirrors the editor pages: after a successful explicit save, adopt the server status
  const save = async (options) => {
    const outcome = await controller.save(options);
    if (outcome.ok && outcome.result?.status)
      editor.form = { ...editor.form, status: outcome.result.status };
    controller.refreshAutosave();
    return outcome;
  };
  const edit = (patch) => {
    editor.form = { ...editor.form, ...patch };
    controller.markDirty();
  };

  return { timers, editor, server, controller, save, edit };
};

// --- tests ------------------------------------------------------------------
test('loading an existing item never triggers a write', { timeout: 2000 }, async () => {
  const h = createHarness();
  h.controller.markClean('2026-10-01T00:00:00.000Z');
  h.timers.advance(10_000);
  await flush();
  assert.strictEqual(h.server.calls.length, 0);
  assert.strictEqual(h.timers.pending, 0);
  assert.strictEqual(toIndicatorStatus(h.controller.getState()), 'saved');
});

test('publish then keep editing: autosave never unpublishes', { timeout: 2000 }, async () => {
  const h = createHarness();
  h.edit({ title: 'Edited before publish' }); // autosave timer now pending
  assert.strictEqual(h.timers.pending, 1);

  const outcome = await h.save({ status: 'published' });
  assert.ok(outcome.ok);
  assert.strictEqual(h.timers.pending, 0, 'publish cancels the pending autosave timer');
  assert.strictEqual(h.editor.form.status, 'published', 'local status synced from the server');

  h.edit({ title: 'Edited after publish' });
  h.timers.advance(10_000);
  await flush();

  assert.strictEqual(h.server.calls.length, 1, 'only the publish request was sent');
  assert.strictEqual(h.server.status, 'published');
  assert.ok(h.server.calls.every((c) => c.payload.status !== 'draft'));
  assert.strictEqual(toIndicatorStatus(h.controller.getState()), 'unsaved');
});

test('autosave payloads never carry a status field', { timeout: 2000 }, async () => {
  const h = createHarness();
  h.edit({ title: 'Autosaved title' });
  h.timers.advance(3000);
  await flush();
  assert.strictEqual(h.server.calls.length, 1);
  assert.strictEqual(h.server.calls[0].meta.kind, 'autosave');
  assert.ok(!('status' in h.server.calls[0].payload));
  assert.strictEqual(toIndicatorStatus(h.controller.getState()), 'saved');
});

test('an in-flight autosave cannot overwrite a newer manual save', { timeout: 2000 }, async () => {
  const h = createHarness({ autoResolve: false });
  h.edit({ title: 'Autosave version' });
  h.timers.advance(3000); // autosave request is now in flight
  await flush();
  assert.strictEqual(h.server.calls.length, 1);

  h.edit({ title: 'Manual version' });
  const manual = h.save({ status: 'published' });
  await flush();
  assert.strictEqual(h.server.calls.length, 1, 'manual save waits for the in-flight request');

  h.server.pending[0].resolve(); // the older autosave lands first
  await flush();
  assert.strictEqual(h.server.calls.length, 2);
  assert.strictEqual(h.server.calls[1].payload.title, 'Manual version');
  h.server.pending[1].resolve();
  await manual;

  assert.strictEqual(h.server.status, 'published');
  assert.deepStrictEqual(
    h.server.calls.map((c) => c.meta.kind),
    ['autosave', 'manual'],
    'requests are serialized in click order'
  );
});

test(
  'an autosave queued behind a write is dropped when a manual save follows',
  { timeout: 2000 },
  async () => {
    const h = createHarness({ autoResolve: false });
    const first = h.save(); // plain manual save in flight
    await flush();
    h.edit({ title: 'Typed while saving' });
    h.timers.advance(3000); // autosave fires and queues behind the first save
    await flush();
    const second = h.save({ status: 'published' }); // supersedes the queued autosave
    h.server.pending[0].resolve();
    await flush();
    h.server.pending[1].resolve();
    await Promise.all([first, second]);
    await flush();

    assert.deepStrictEqual(
      h.server.calls.map((c) => c.meta.kind),
      ['manual', 'manual'],
      'the stale autosave never reached the server'
    );
    assert.strictEqual(h.server.status, 'published');
  }
);

test(
  'plain Save on a published item preserves status; Save Draft sends draft explicitly',
  { timeout: 2000 },
  async () => {
    const h = createHarness({ status: 'published' });
    h.edit({ title: 'Typo fix on a live case study' });
    h.timers.advance(10_000);
    await flush();
    assert.strictEqual(h.server.calls.length, 0, 'published items are not autosaved');

    await h.save();
    assert.strictEqual(h.server.calls.length, 1);
    assert.ok(!('status' in h.server.calls[0].payload), 'plain Save sends no status');
    assert.strictEqual(h.server.status, 'published');
    assert.strictEqual(toIndicatorStatus(h.controller.getState()), 'saved');

    await h.save({ status: 'draft' });
    assert.strictEqual(h.server.calls[1].payload.status, 'draft');
    assert.strictEqual(h.server.status, 'draft');
    assert.strictEqual(h.editor.form.status, 'draft');
  }
);

test('a failed save is reported as an error and stays unsaved', { timeout: 2000 }, async () => {
  const h = createHarness({ autoResolve: false });
  h.edit({ title: 'Will fail' });
  const pending = h.save();
  await flush();
  h.server.pending[0].reject(new Error('Network down'));
  const outcome = await pending;

  assert.strictEqual(outcome.ok, false);
  const state = h.controller.getState();
  assert.strictEqual(state.dirty, true);
  assert.strictEqual(state.error.message, 'Network down');
  assert.strictEqual(toIndicatorStatus(state), 'error');
});

test(
  'validation failures block manual saves and skip autosaves without writing',
  { timeout: 2000 },
  async () => {
    const h = createHarness();
    h.edit({ title: 'ab' }); // too short
    h.timers.advance(3000);
    await flush();
    assert.strictEqual(h.server.calls.length, 0);
    assert.strictEqual(toIndicatorStatus(h.controller.getState()), 'unsaved');

    const outcome = await h.save();
    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(outcome.validation, true);
    assert.match(h.controller.getState().error.message, /at least 3 characters/);
    assert.strictEqual(h.server.calls.length, 0);
  }
);

test('disposing (unmount) cancels pending autosave timers', { timeout: 2000 }, async () => {
  const h = createHarness();
  h.edit({ title: 'Unsaved at unmount' });
  assert.strictEqual(h.timers.pending, 1);
  h.controller.dispose();
  assert.strictEqual(h.timers.pending, 0);
  h.timers.advance(10_000);
  await flush();
  assert.strictEqual(h.server.calls.length, 0);
});

test(
  'edits typed while a save is in flight stay unsaved, then autosave',
  { timeout: 2000 },
  async () => {
    const h = createHarness({ autoResolve: false });
    h.edit({ title: 'First version' });
    const pending = h.save();
    await flush();
    h.edit({ title: 'Typed during the request' });
    h.server.pending[0].resolve();
    await pending;

    assert.strictEqual(h.controller.getState().dirty, true, 'newer edit is not reported as saved');
    assert.strictEqual(toIndicatorStatus(h.controller.getState()), 'unsaved');

    h.timers.advance(3000);
    await flush();
    assert.strictEqual(h.server.calls.length, 2);
    assert.strictEqual(h.server.calls[1].payload.title, 'Typed during the request');
    h.server.pending[1].resolve();
    await flush();
    assert.strictEqual(toIndicatorStatus(h.controller.getState()), 'saved');
  }
);

test(
  'starting a manual save immediately cancels the pending autosave timer',
  { timeout: 2000 },
  async () => {
    const h = createHarness({ autoResolve: false });
    h.edit({ title: 'Pending autosave' });
    assert.strictEqual(h.timers.pending, 1);
    const pending = h.save({ status: 'published' });
    assert.strictEqual(h.timers.pending, 0, 'timer cleared before the request resolves');
    await flush();
    h.server.pending[0].resolve();
    await pending;
  }
);

test('autosave re-checks eligibility when its timer fires', { timeout: 2000 }, async () => {
  const h = createHarness();
  h.edit({ title: 'Scheduled while draft' });
  // Status changes without a refresh (e.g. server result applied elsewhere) before the timer fires
  h.editor.form = { ...h.editor.form, status: 'published' };
  h.timers.advance(3000);
  await flush();
  assert.strictEqual(h.server.calls.length, 0);
});
