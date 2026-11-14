import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  ExternalLink,
  GitBranch,
  Search,
} from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { MarkdownProse } from '../ui/MarkdownProse.jsx';
import { Timeline, TimelineItem, TimelineDot, TimelineContent } from '../ui/Timeline.jsx';
import { STATUS_STAGES } from '../../utils/caseStudyDetails.js';
import { cn } from '../../utils/cn.js';

const TONE_TO_VARIANT = {
  success: 'success',
  warning: 'warning',
  info: 'info',
  danger: 'destructive',
  muted: 'outline',
};

/** Status chip for a feature, stage or the whole project. */
export const StatusPill = ({ stage, label, className }) => {
  const meta = STATUS_STAGES[stage] || STATUS_STAGES.unverified;
  return (
    <Badge
      variant={TONE_TO_VARIANT[meta.tone]}
      className={cn('whitespace-nowrap px-2 py-0 text-[10px] font-semibold', className)}
    >
      {label || meta.label}
    </Badge>
  );
};

/** Shared heading used by every block so the page keeps one visual rhythm. */
export const BlockHeading = ({ eyebrow, title, icon: Icon }) => (
  <div className="space-y-2">
    {eyebrow && (
      <div className="text-primary flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
        {Icon && <Icon className="h-4 w-4" aria-hidden="true" />} {eyebrow}
      </div>
    )}
    <h2 className="font-heading text-foreground text-2xl font-bold sm:text-3xl">{title}</h2>
  </div>
);

const LENS_OPTIONS = [
  { id: 'pm', label: 'PM lens', hint: 'Problem, decisions, trade-offs' },
  { id: 'builder', label: 'Builder lens', hint: 'Architecture, build status, debugging' },
  { id: 'all', label: 'Full story', hint: 'Everything' },
];

/** Segmented control switching between the PM, Builder and full reading of a case study. */
export const LensToggle = ({ lens, onChange }) => (
  <div
    role="tablist"
    aria-label="Choose how to read this case study"
    className="border-border bg-muted/60 inline-flex flex-wrap gap-1 rounded-xl border p-1"
  >
    {LENS_OPTIONS.map((option) => {
      const active = lens === option.id;
      return (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={active}
          title={option.hint}
          onClick={() => onChange(option.id)}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            active
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

/** Filterable list of features, each tagged with its honest build status. */
export const FeatureLedger = ({ features }) => {
  const [filter, setFilter] = useState('all');
  const counts = useMemo(() => {
    const map = {};
    for (const f of features) map[f.status] = (map[f.status] || 0) + 1;
    return map;
  }, [features]);
  const stagesPresent = Object.keys(STATUS_STAGES).filter((key) => counts[key]);
  const visible = filter === 'all' ? features : features.filter((f) => f.status === filter);

  return (
    <div className="space-y-5">
      <BlockHeading
        eyebrow="Feature status ledger"
        title="What is built, and what is not"
        icon={CheckCircle2}
      />
      <p className="text-muted-foreground text-sm">
        Every feature is labelled with its real state. Filter to see only what is implemented.
      </p>
      {stagesPresent.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter features by status">
          {[
            { key: 'all', label: `All (${features.length})` },
            ...stagesPresent.map((key) => ({
              key,
              label: `${STATUS_STAGES[key].label} (${counts[key]})`,
            })),
          ].map((chip) => (
            <button
              key={chip.key}
              type="button"
              aria-pressed={filter === chip.key}
              onClick={() => setFilter(chip.key)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filter === chip.key
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
      <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {visible.map((feature) => (
          <li
            key={feature.name}
            className="bg-card flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <p className="text-foreground font-semibold">{feature.name}</p>
              {feature.purpose && (
                <p className="text-muted-foreground text-sm">{feature.purpose}</p>
              )}
              {feature.note && (
                <p className="text-muted-foreground font-mono text-xs">{feature.note}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {feature.evidenceUrl && (
                <a
                  href={feature.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
                >
                  Evidence <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
              <StatusPill stage={feature.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Horizontal (stacked on mobile) pipeline; clicking a stage opens its detail panel. */
export const PipelineDiagram = ({ pipeline }) => {
  const [active, setActive] = useState(0);
  const current = pipeline.stages[active];

  return (
    <div className="space-y-5">
      <BlockHeading
        eyebrow="System walkthrough"
        title={pipeline.title || 'How it works'}
        icon={GitBranch}
      />
      {pipeline.intro && <p className="text-muted-foreground text-sm">{pipeline.intro}</p>}
      <ol className="flex flex-col gap-2 md:flex-row md:items-stretch" aria-label="Pipeline stages">
        {pipeline.stages.map((item, idx) => {
          const selected = idx === active;
          return (
            <li key={item.name} className="flex min-w-0 flex-1 items-stretch gap-2">
              <button
                type="button"
                onClick={() => setActive(idx)}
                aria-pressed={selected}
                className={cn(
                  'h-full w-full min-w-0 rounded-xl border p-3 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <span className="text-muted-foreground block font-mono text-[10px]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="text-foreground block text-sm font-semibold">{item.name}</span>
                <span className="mt-1.5 block">
                  <StatusPill stage={item.status} />
                </span>
              </button>
              {idx < pipeline.stages.length - 1 && (
                <ArrowRight
                  className="text-muted-foreground hidden h-4 w-4 shrink-0 self-center md:block"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
      <div className="border-border bg-muted/40 rounded-xl border p-5" aria-live="polite">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-foreground font-semibold">{current.name}</h3>
          <StatusPill stage={current.status} />
        </div>
        {current.summary && <p className="text-foreground mt-2 text-sm">{current.summary}</p>}
        {current.detail && (
          <div className="mt-3">
            <MarkdownProse>{current.detail}</MarkdownProse>
          </div>
        )}
      </div>
    </div>
  );
};

/** Expandable decision cards: context, options, choice, rationale and the cost of the choice. */
export const DecisionLog = ({ decisions }) => {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-5">
      <BlockHeading
        eyebrow="Decision log"
        title="Choices I made, and what they cost"
        icon={GitBranch}
      />
      <div className="space-y-3">
        {decisions.map((decision, idx) => {
          const expanded = open === idx;
          const panelId = `decision-panel-${idx}`;
          return (
            <div
              key={decision.title}
              className="border-border bg-card overflow-hidden rounded-xl border"
            >
              <button
                type="button"
                onClick={() => setOpen(expanded ? -1 : idx)}
                aria-expanded={expanded}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span className="text-foreground font-semibold">{decision.title}</span>
                <ChevronDown
                  className={cn(
                    'text-muted-foreground h-4 w-4 shrink-0 transition-transform',
                    expanded && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </button>
              {expanded && (
                <div id={panelId} className="border-border space-y-4 border-t p-4 text-sm">
                  {decision.context && <p className="text-muted-foreground">{decision.context}</p>}
                  {decision.options.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2 font-mono text-[11px] uppercase tracking-wider">
                        Options considered
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {decision.options.map((option) => (
                          <li
                            key={option}
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-xs',
                              decision.choice && option === decision.choice
                                ? 'border-success/40 bg-success/10 text-foreground font-semibold'
                                : 'border-border text-muted-foreground'
                            )}
                          >
                            {option}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <dl className="grid gap-3 sm:grid-cols-3">
                    {decision.choice && (
                      <div>
                        <dt className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
                          Chose
                        </dt>
                        <dd className="text-foreground mt-1">{decision.choice}</dd>
                      </div>
                    )}
                    {decision.rationale && (
                      <div>
                        <dt className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
                          Why
                        </dt>
                        <dd className="text-foreground mt-1">{decision.rationale}</dd>
                      </div>
                    )}
                    {decision.tradeoff && (
                      <div>
                        <dt className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
                          Trade-off
                        </dt>
                        <dd className="text-foreground mt-1">{decision.tradeoff}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Step-through debugging story: symptom → each finding → root cause → resolution. */
export const InvestigationWalkthrough = ({ investigation }) => {
  const total = investigation.steps.length;
  // index 0..total-1 are steps; total means the conclusion card
  const [index, setIndex] = useState(0);
  const atConclusion = index >= total;
  const step = investigation.steps[index];

  return (
    <div className="space-y-5">
      <BlockHeading
        eyebrow="Investigation"
        title={investigation.title || 'Finding the root cause'}
        icon={Search}
      />
      {investigation.symptom && (
        <div className="border-warning/30 bg-warning/10 rounded-xl border p-4 text-sm">
          <span className="text-foreground font-semibold">Symptom: </span>
          <span className="text-foreground">{investigation.symptom}</span>
        </div>
      )}
      {total > 0 && (
        <>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: total + 1 }).map((_, i) => (
              <span
                key={i}
                className={cn('h-1.5 flex-1 rounded-full', i <= index ? 'bg-primary' : 'bg-muted')}
              />
            ))}
          </div>
          <div
            className="border-border bg-card min-h-[140px] rounded-xl border p-5"
            aria-live="polite"
          >
            {atConclusion ? (
              <div className="space-y-3 text-sm">
                {investigation.rootCause && (
                  <p>
                    <span className="text-foreground font-semibold">Root cause: </span>
                    <span className="text-foreground">{investigation.rootCause}</span>
                  </p>
                )}
                {investigation.resolution && (
                  <p>
                    <span className="text-foreground font-semibold">Resolution: </span>
                    <span className="text-muted-foreground">{investigation.resolution}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
                  Step {index + 1} of {total}
                </p>
                <h3 className="text-foreground font-semibold">{step.title}</h3>
                {step.finding && <p className="text-muted-foreground text-sm">{step.finding}</p>}
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="border-border text-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(total, i + 1))}
              disabled={atConclusion}
              className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            >
              {index === total - 1 ? 'Show root cause' : 'Next step'}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/** Pivots and milestones, reusing the shared Timeline primitives. */
export const PivotTimeline = ({ timeline }) => (
  <div className="space-y-5">
    <BlockHeading eyebrow="How it evolved" title="Pivots and milestones" icon={CircleDashed} />
    <Timeline>
      {timeline.map((item, idx) => (
        <TimelineItem key={`${item.label}-${idx}`}>
          <TimelineDot active={idx === timeline.length - 1} />
          <TimelineContent title={item.label} date={item.date} description={item.description} />
        </TimelineItem>
      ))}
    </Timeline>
  </div>
);

/** Claim → source table so a reader can check what backs each statement. */
export const EvidenceIndex = ({ evidence }) => (
  <div className="space-y-5">
    <BlockHeading eyebrow="Evidence index" title="What backs these claims" icon={CheckCircle2} />
    <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
      {evidence.map((item, idx) => (
        <li
          key={`${item.claim}-${idx}`}
          className="bg-card flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="text-foreground">{item.claim}</span>
          <span className="flex shrink-0 items-center gap-3">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                {item.source || 'Source'} <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : (
              item.source && <span className="text-muted-foreground text-xs">{item.source}</span>
            )}
            <StatusPill
              stage={item.verified ? 'implemented' : 'unverified'}
              label={item.verified ? 'Verified' : 'Not yet verified'}
            />
          </span>
        </li>
      ))}
    </ul>
  </div>
);
