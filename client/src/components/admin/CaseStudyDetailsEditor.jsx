import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, FileJson } from 'lucide-react';
import {
  DETAILS_TEMPLATE,
  countVerifyMarkers,
  normalizeDetails,
  summarizeDetails,
} from '../../utils/caseStudyDetails.js';

const pretty = (value) => JSON.stringify(value ?? {}, null, 2);

/**
 * JSON editor for `case_studies.details`. While the text is invalid JSON the raw string is passed
 * up, so the payload builder refuses to save it (same contract as the PRD snapshot field).
 */
export const CaseStudyDetailsEditor = ({ value, onChange }) => {
  const [text, setText] = useState(() => (typeof value === 'string' ? value : pretty(value)));
  const [parseError, setParseError] = useState(null);

  // Re-sync when the record loads (value changes from outside while the text is still valid)
  useEffect(() => {
    if (typeof value === 'string') return;
    setText((current) => {
      try {
        if (JSON.stringify(JSON.parse(current)) === JSON.stringify(value ?? {})) return current;
      } catch {
        return current;
      }
      return pretty(value);
    });
  }, [value]);

  const parsed =
    typeof value === 'object' && value !== null && !Array.isArray(value) ? value : null;
  const summary = useMemo(
    () => (parsed ? summarizeDetails(normalizeDetails(parsed)) : ''),
    [parsed]
  );
  const verifyCount = parsed ? countVerifyMarkers(parsed) : 0;

  const handleText = (next) => {
    setText(next);
    try {
      const obj = JSON.parse(next || '{}');
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        setParseError('Top level must be a JSON object { ... }.');
        onChange(next);
        return;
      }
      setParseError(null);
      onChange(obj);
    } catch (err) {
      setParseError(err.message);
      onChange(next);
    }
  };

  const insertTemplate = () => {
    if (parsed && Object.keys(parsed).length > 0) {
      if (!window.confirm('Replace the current interactive details with the starter template?'))
        return;
    }
    handleText(pretty(DETAILS_TEMPLATE));
  };

  return (
    <div className="border-border bg-card space-y-4 rounded-2xl border p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-foreground font-mono text-sm uppercase tracking-wider">
            Interactive blocks (JSON)
          </h3>
          <p className="text-muted-foreground mt-1 max-w-2xl text-xs">
            Powers the PM / Builder lens toggle, feature status ledger, pipeline diagram, decision
            log, investigation walkthrough, pivot timeline and evidence index. Leave a block out and
            it simply does not render. Status values: implemented, partial, prototype, planned,
            proposed, unverified, deprecated. Decision lens: pm, builder or both.
          </p>
        </div>
        <button
          type="button"
          onClick={insertTemplate}
          className="bg-secondary text-foreground flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium"
        >
          <FileJson className="text-primary h-4 w-4" /> Insert starter template
        </button>
      </div>

      <textarea
        rows={24}
        spellCheck={false}
        value={text}
        onChange={(e) => handleText(e.target.value)}
        aria-label="Interactive details JSON"
        className="border-border bg-background focus:border-primary/40 text-foreground w-full rounded-xl border px-4 py-3 font-mono text-xs focus:outline-none"
      />

      {parseError ? (
        <p className="flex items-center gap-2 text-xs text-rose-500">
          <AlertCircle className="h-4 w-4 shrink-0" /> Invalid JSON: {parseError}. Saving is blocked
          until this is fixed.
        </p>
      ) : (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
          {summary || 'Valid. No interactive blocks yet.'}
        </p>
      )}

      {verifyCount > 0 && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {verifyCount} [VERIFY] marker{verifyCount === 1 ? '' : 's'} left. Replace them with
          confirmed facts before publishing.
        </p>
      )}
    </div>
  );
};
