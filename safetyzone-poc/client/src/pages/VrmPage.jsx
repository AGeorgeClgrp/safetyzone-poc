import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIORITY = {
  immediate: {
    label: 'Immediate', sla: '24H REVIEW',
    strip: 'bg-red-600', border: 'border-l-red-500',
    badge: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    dot: 'bg-red-500', num: 'text-red-600', ring: 'border-red-200',
    sectionLabel: 'IMMEDIATE',
  },
  high: {
    label: 'High', sla: '24H REVIEW',
    strip: 'bg-orange-500', border: 'border-l-orange-400',
    badge: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    dot: 'bg-orange-400', num: 'text-orange-600', ring: 'border-orange-200',
    sectionLabel: 'HIGH — 24H REVIEW',
  },
  medium: {
    label: 'Medium', sla: '72H REVIEW',
    strip: 'bg-amber-400', border: 'border-l-amber-400',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    dot: 'bg-amber-400', num: 'text-amber-600', ring: 'border-amber-200',
    sectionLabel: 'MEDIUM — 72H REVIEW',
  },
  routine: {
    label: 'Routine', sla: 'WEEKLY',
    strip: 'bg-slate-400', border: 'border-l-slate-300',
    badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    dot: 'bg-slate-400', num: 'text-slate-500', ring: 'border-slate-200',
    sectionLabel: 'ROUTINE',
  },
};

const SEV_PILL = {
  severe:   'bg-red-50 text-red-700 ring-1 ring-red-200',
  moderate: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  mild:     'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  no_harm:  'bg-sky-50 text-sky-600 ring-1 ring-sky-200',
  death:    'bg-gray-900 text-white',
};

function timeAgo(iso) {
  const h = Math.floor((Date.now() - new Date(iso)) / 3600000);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

function snippet(text, len = 72) {
  if (!text) return '';
  return text.length > len ? text.slice(0, len) + '…' : text;
}

function Spinner({ cls = 'h-4 w-4' }) {
  return (
    <svg className={`animate-spin ${cls}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function DocIcon({ cls = 'w-3.5 h-3.5' }) {
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// ── Policy slide-over ─────────────────────────────────────────────────────────
function PolicySlideOver({ text, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[540px] bg-white shadow-2xl flex flex-col border-l border-slate-200">
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-0.5">Active Policy Document</p>
            <p className="text-sm font-medium text-slate-800">Fall Prevention Policy — FP-001</p>
            <p className="text-xs text-slate-500 mt-0.5">Effective 02/02/2026 · Rev. 1</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none mt-0.5 flex-shrink-0"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <pre className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">{text}</pre>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400">This policy is automatically applied during agent triage to identify compliance gaps.</p>
        </div>
      </div>
    </div>
  );
}

// ── Policy alignment section (used in BriefingPanel) ─────────────────────────
function PolicyAlignmentSection({ items }) {
  if (!items?.length) return null;
  return (
    <div className="bg-white rounded-lg border border-blue-100">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-blue-100">
        <DocIcon cls="w-3.5 h-3.5 text-blue-500" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
          Policy Alignment — Fall Prevention FP-001
        </span>
        <span className="ml-auto text-xs text-blue-500 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
          {items.length} gap{items.length !== 1 ? 's' : ''} identified
        </span>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((pa, i) => (
          <li key={i} className="px-5 py-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-medium text-slate-600">{pa.event_id}</span>
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                {pa.policy_section}
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-1.5 leading-relaxed">{pa.gap}</p>
            <p className="text-xs text-teal-700 font-medium leading-relaxed">→ {pa.suggestion}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Event queue (left pane) ───────────────────────────────────────────────────
function EventQueue({ batch, triageResult, selectedId, onSelect }) {
  if (!batch.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-xs text-slate-300 text-center leading-relaxed">
          Run the agent to load<br />the event queue
        </p>
      </div>
    );
  }

  const queueMap = triageResult
    ? Object.fromEntries((triageResult.queue || []).map((q) => [q.event_id, q]))
    : {};
  const grouped = { immediate: [], high: [], medium: [], routine: [] };
  batch.forEach((ev) => {
    const p = queueMap[ev.id]?.priority || (triageResult ? 'routine' : '_flat');
    if (grouped[p]) grouped[p].push({ ...ev, _oneLiner: queueMap[ev.id]?.one_liner });
    else grouped._flat = [...(grouped._flat || []), ev];
  });

  if (!triageResult) {
    return (
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {batch.map((ev) => (
          <EventCard key={ev.id} ev={ev} selected={selectedId === ev.id} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {Object.entries(grouped).map(([priority, evs]) => {
        if (!evs.length || priority === '_flat') return null;
        const cfg = PRIORITY[priority];
        return (
          <div key={priority}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border-y border-slate-100 sticky top-0 z-10">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <span className="text-xs font-medium text-slate-500 tracking-widest uppercase">{cfg.sectionLabel}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {evs.map((ev) => (
                <EventCard key={ev.id} ev={ev} selected={selectedId === ev.id} onSelect={onSelect} showSnippet={ev._oneLiner} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventCard({ ev, selected, onSelect, showSnippet }) {
  const sevPill = SEV_PILL[ev.severity] || 'bg-slate-100 text-slate-500';
  const snip = showSnippet || ev.narrative || '';
  return (
    <button
      onClick={() => onSelect(ev.id)}
      className={`w-full text-left px-3 py-2.5 transition-colors border-l-2 ${
        ev.sentinel ? 'border-l-red-500' : 'border-l-transparent'
      } ${selected ? 'bg-teal-50 border-l-teal-500' : 'bg-white hover:bg-slate-50'}`}
    >
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span className="font-mono text-xs text-slate-400 truncate">{ev.id}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {ev.sentinel && <span className="text-xs font-medium text-red-600">SEN</span>}
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${sevPill}`}>{ev.severity}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-slate-800 leading-snug">{ev.type}</p>
      <p className="text-xs text-slate-400 mt-0.5 leading-snug truncate">
        {ev.unit} · {timeAgo(ev.occurredAt)}
        {snip && <span> · {snippet(snip, 40)}</span>}
      </p>
    </button>
  );
}

// ── Welcome panel ─────────────────────────────────────────────────────────────
function WelcomePanel({ onRun, policyLoaded }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white px-12 py-10">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-medium text-slate-900">Virtual Risk Manager</h2>
            <p className="text-xs text-slate-500">AI-assisted patient safety triage</p>
          </div>
        </div>

        {policyLoaded && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 mb-5">
            <DocIcon cls="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <div>
              <span className="text-xs font-medium text-blue-700">Fall Prevention Policy FP-001 loaded</span>
              <span className="text-xs text-blue-500 ml-1">— triage will include policy alignment analysis</span>
            </div>
          </div>
        )}

        <p className="text-sm text-slate-600 mb-7 leading-relaxed">
          Analyzes your highest-priority safety events and delivers a prioritized queue,
          pattern alerts, regulatory obligations, and pre-built case files — in under 90 seconds.
        </p>

        <div className="border border-slate-200 rounded-lg overflow-hidden mb-7">
          {[
            ['Retrieves',   'Top 20 events ranked by severity and sentinel status'],
            ['Prioritizes', 'Immediate / High / Medium / Routine work queue'],
            ['Detects',     'Cross-event patterns and contributing factor clusters'],
            ['Flags',       'Regulatory reporting obligations with citations'],
            ['Builds',      'Case files with RCA guidance for the top 3 events'],
            ...(policyLoaded ? [['Compares', 'Events against Fall Prevention Policy FP-001']] : []),
          ].map(([lbl, txt], i) => (
            <div key={lbl} className={`px-4 py-3 flex items-baseline gap-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
              <span className="text-xs font-medium text-teal-600 w-20 flex-shrink-0">{lbl}</span>
              <span className="text-xs text-slate-600">{txt}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onRun}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-colors text-sm"
        >
          Run Triage Agent
        </button>
        <p className="mt-3 text-center text-xs text-slate-400">
          Powered by Claude · AI-generated · review before acting
        </p>
      </div>
    </div>
  );
}

// ── Loading panel ─────────────────────────────────────────────────────────────
function LoadingPanel({ count, policyLoaded }) {
  const [step, setStep] = useState(0);
  const steps = [
    'Fetching events from database',
    'Reading clinical narratives',
    'Identifying contributing factors',
    'Detecting cross-event patterns',
    'Assigning priority levels',
    'Checking regulatory obligations',
    ...(policyLoaded ? ['Comparing against Fall Prevention Policy FP-001'] : []),
    'Building case files',
  ];

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white p-10">
      <div className="max-w-xs w-full">
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-800 text-center mb-1">
          {count ? `Analyzing ${count} events` : 'Loading events from database…'}
        </p>
        <p className="text-xs text-slate-400 text-center mb-8">Usually takes 60–90 seconds</p>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 text-xs ${
              i < step ? 'text-teal-600' : i === step ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${
                i < step ? 'bg-teal-600 border-teal-600' : i === step ? 'border-teal-500' : 'border-slate-200'
              }`}>
                {i < step && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 6l3 3 5-5" />
                  </svg>
                )}
                {i === step && <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />}
              </div>
              <span className={i === step ? 'font-medium' : ''}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Briefing panel ────────────────────────────────────────────────────────────
function BriefingPanel({ result, onRun }) {
  const immCount = result.counts?.immediate ?? 0;
  const hiCount  = result.counts?.high ?? 0;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl px-8 py-7 space-y-7">

        {/* Agent briefing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-sm">◆</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Agent Briefing</span>
            </div>
            <button onClick={onRun} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
              ↺ Re-run
            </button>
          </div>
          <p className="text-base font-medium text-slate-800 leading-snug">{result.summary}</p>
        </div>

        {/* Priority stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { key: 'immediate', label: 'Immediate', sla: '',      cfg: PRIORITY.immediate },
            { key: 'high',      label: 'High',      sla: '/ 24h', cfg: PRIORITY.high },
            { key: 'medium',    label: 'Medium',    sla: '/ 72h', cfg: PRIORITY.medium },
            { key: 'routine',   label: 'Routine',   sla: '',      cfg: PRIORITY.routine },
          ].map(({ key, label, sla, cfg }) => (
            <div key={key} className="bg-white rounded-lg border border-slate-200 px-5 py-4 text-center">
              <p className={`text-4xl font-medium ${cfg.num}`}>{result.counts?.[key] ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1.5">{label}{sla && <span className="text-slate-400"> {sla}</span>}</p>
            </div>
          ))}
        </div>

        {/* Policy alignment */}
        <PolicyAlignmentSection items={result.policy_alignment} />

        {/* Regulatory flags */}
        {result.regulatory_flags?.length > 0 && (
          <div className="bg-white rounded-lg border border-red-100">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-red-100">
              <span className="text-red-500 text-xs">⚠</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Regulatory / External Reporting Obligations
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {result.regulatory_flags.map((rf, i) => (
                <li key={i} className="px-5 py-3 flex items-start gap-3">
                  <span className="text-red-400 mt-1 flex-shrink-0">•</span>
                  <div>
                    <span className="font-mono text-xs font-medium text-slate-600">{rf.event_id}</span>
                    <span className="text-xs text-slate-600"> — {rf.flag}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hint */}
        <div className="bg-teal-50 border border-teal-100 rounded-lg px-5 py-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-teal-500 text-sm">💡</span>
            <span className="text-xs font-medium text-teal-700 uppercase tracking-widest">
              Select any event in the queue for the full case file
            </span>
          </div>
          <p className="text-xs text-teal-700 leading-relaxed">
            The agent has pre-built investigation files for the top 3 most critical events — including
            narrative analysis, interview guides, and RCA recommendations. All events support the{' '}
            <span className="font-medium">Ask the Agent</span> feature for live Q&amp;A.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Case file panel ───────────────────────────────────────────────────────────
function CaseFilePanel({ event, triageResult, runId, policyAlignment }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer]     = useState('');
  const [asking, setAsking]     = useState(false);

  const queueEntry = triageResult?.queue?.find((q) => q.event_id === event.id);
  const caseFile   = triageResult?.top_3?.find((t) => t.event_id === event.id);
  const regFlag    = triageResult?.regulatory_flags?.find((rf) => rf.event_id === event.id);
  const priority   = queueEntry?.priority || 'routine';
  const cfg        = PRIORITY[priority];

  async function handleAsk() {
    if (!question.trim()) return;
    setAsking(true); setAnswer('');
    try {
      const { data } = await apiClient.post('/vrm/ask', {
        runId, eventId: event.id, question, event,
        triageAnalysis: caseFile || queueEntry,
      });
      setAnswer(data.answer);
    } catch { setAnswer('Unable to get a response. Please try again.'); }
    finally   { setAsking(false); }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className={`h-1 ${cfg.strip}`} />
        <div className="px-7 py-5">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-mono text-xs text-slate-400">{event.id}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${SEV_PILL[event.severity] || 'bg-slate-100 text-slate-500'}`}>
              {event.severity}
            </span>
            {event.sentinel && <span className="text-xs font-medium text-red-600 tracking-wide">SENTINEL</span>}
          </div>
          <h2 className="text-lg font-medium text-slate-900 mb-1">{event.type}</h2>
          <p className="text-xs text-slate-500">{event.unit} · {timeAgo(event.occurredAt)} · {event.triggerSource}</p>
          {queueEntry?.one_liner && (
            <p className="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-200 pl-3 leading-relaxed">
              {queueEntry.one_liner}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl px-7 py-6 space-y-5">

        {/* Clinical narrative */}
        <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Clinical Narrative</p>
          <p className="text-sm text-slate-700 leading-relaxed">{event.narrative}</p>
        </div>

        {/* Contributing factors */}
        {event.contributingFactors?.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Contributing Factors</p>
            <div className="flex flex-wrap gap-2">
              {event.contributingFactors.map((f) => (
                <span key={f} className="text-xs px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded font-medium">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {caseFile ? (
          <>
            {/* Agent analysis */}
            <div className="bg-teal-50 rounded-lg border border-teal-200 px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded bg-teal-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-teal-800 uppercase tracking-wide">Agent Analysis</span>
                <span className="text-xs text-teal-400 ml-1">· AI-generated, review before acting</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">{caseFile.narrative_analysis}</p>
              {caseFile.contributing_factors_extracted?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {caseFile.contributing_factors_extracted.map((f) => (
                    <span key={f} className="text-xs px-2 py-0.5 bg-teal-100 border border-teal-200 text-teal-800 rounded">{f}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended actions */}
            {caseFile.recommended_actions?.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Recommended Actions</p>
                <ol className="space-y-3">
                  {caseFile.recommended_actions.map((a, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-600 text-white text-xs font-medium flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed">{a}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Interview plan */}
            {caseFile.interview_targets?.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Interview Plan</p>
                <div className="divide-y divide-slate-100">
                  {caseFile.interview_targets.map((t, i) => (
                    <div key={i} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-sm font-medium text-slate-800">{t.role}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RCA verdict */}
            <div className={`rounded-lg border px-5 py-4 flex items-start gap-3 ${
              caseFile.rca_warranted ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className={`text-xs font-medium px-2.5 py-1 rounded flex-shrink-0 mt-0.5 ${
                caseFile.rca_warranted ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {caseFile.rca_warranted ? 'RCA Required' : 'RCA Not Required'}
              </span>
              <p className="text-sm text-slate-700 leading-relaxed">{caseFile.rca_rationale}</p>
            </div>

            {/* Regulatory obligations */}
            {(caseFile.regulatory_obligations || regFlag?.flag) && (
              <div className="bg-white rounded-lg border border-amber-200 px-5 py-4">
                <p className="text-xs font-medium text-amber-600 uppercase tracking-widest mb-3">Regulatory Obligations</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {caseFile.regulatory_obligations || regFlag?.flag}
                </p>
              </div>
            )}
          </>
        ) : queueEntry && (
          <div className="bg-white rounded-lg border border-dashed border-slate-300 px-5 py-6 text-center">
            <p className="text-sm font-medium text-slate-500 mb-1">No pre-built case file</p>
            <p className="text-xs text-slate-400">This event wasn't in the top 3. Use Ask the Agent below for a detailed analysis.</p>
          </div>
        )}

        {/* Policy alignment — per event */}
        {policyAlignment && (
          <div className="bg-white rounded-lg border border-blue-100 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <DocIcon cls="w-3.5 h-3.5 text-blue-500" />
              <p className="text-xs font-medium text-blue-600 uppercase tracking-widest">
                Policy Gap — FP-001 · {policyAlignment.policy_section}
              </p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-2">{policyAlignment.gap}</p>
            <p className="text-sm text-teal-700 font-medium leading-relaxed">→ {policyAlignment.suggestion}</p>
          </div>
        )}

        {/* Ask the agent */}
        <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Ask the Agent</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="e.g. What FMEA categories apply here?"
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder-slate-400 bg-slate-50"
            />
            <button
              onClick={handleAsk}
              disabled={asking || !question.trim()}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {asking ? <Spinner /> : 'Ask'}
            </button>
          </div>
          {answer && (
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-teal-600 uppercase tracking-wide mb-2">Agent Response</p>
              <p className="text-sm text-slate-700 leading-relaxed">{answer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VrmPage() {
  const [batch, setBatch]               = useState([]);
  const [batchMeta, setBatchMeta]       = useState(null);
  const [mode, setMode]                 = useState('pre-run');
  const [triageResult, setTriageResult] = useState(null);
  const [runId, setRunId]               = useState(null);
  const [runError, setRunError]         = useState(null);
  const [selectedId, setSelectedId]     = useState(null);
  const [showPolicy, setShowPolicy]     = useState(false);
  const [policyText, setPolicyText]     = useState('');

  useEffect(() => {
    apiClient.get('/policy')
      .then(({ data }) => setPolicyText(data.content))
      .catch(() => {});
  }, []);

  async function runAgent() {
    setMode('running'); setRunError(null); setSelectedId(null); setBatch([]);
    try {
      const { data: batchData } = await apiClient.get('/vrm/batch');
      setBatch(batchData.events);
      setBatchMeta(batchData);
      if (!batchData.events.length) {
        setRunError('No events found in the database.');
        setMode('pre-run'); return;
      }
      const { data } = await apiClient.post('/vrm/triage/run', {
        events: batchData.events, batchId: batchData.batchId,
      });
      setTriageResult(data);
      setRunId(data.runId);
      setMode('briefing');
    } catch (err) {
      setRunError(err.response?.data?.error || 'Agent failed. Please try again.');
      setMode('pre-run');
    }
  }

  const selectedEvent = selectedId ? batch.find((e) => e.id === selectedId) : null;
  const eventPolicyAlignment = selectedEvent
    ? triageResult?.policy_alignment?.find((pa) => pa.event_id === selectedEvent.id)
    : null;

  const immCount = triageResult?.counts?.immediate ?? 0;
  const hiCount  = triageResult?.counts?.high ?? 0;
  const policyLoaded = !!policyText;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-900 text-sm">RiskIQ</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600 text-sm">Virtual Risk Manager</span>
          <span className="ml-1 px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
            SafetyZone · Morning Triage
          </span>
        </div>
        <div className="flex items-center gap-3">
          {runError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">{runError}</p>
          )}

          {/* Policy button */}
          {policyLoaded && (
            <button
              onClick={() => setShowPolicy(true)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <DocIcon cls="w-3.5 h-3.5 text-blue-500" />
              Fall Prevention Policy
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-xs font-medium text-emerald-700">Live · SafetyZone DB</span>
          </div>
          {mode === 'running' ? (
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg text-slate-500 text-xs">
              <Spinner cls="h-3.5 w-3.5 text-teal-600" />
              Analyzing…
            </div>
          ) : (
            <button
              onClick={runAgent}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <span className="text-slate-400">♦</span>
              {mode === 'briefing' ? 'Re-run triage agent' : 'Run triage agent'}
            </button>
          )}
        </div>
      </div>

      {/* ── Two-pane body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left pane */}
        <div className="w-72 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-hidden bg-white">
          <div className="px-4 py-2.5 border-b border-slate-100 flex-shrink-0">
            <p className="text-xs font-medium text-slate-700">
              {mode === 'briefing' ? 'Event queue — submitted batch' : 'Event queue'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'briefing'
                ? <>{batch.length} events{immCount > 0 && <> · <span className="text-red-600 font-medium">{immCount} immediate</span></>}{hiCount > 0 && <> · <span className="text-orange-500 font-medium">{hiCount} high</span></>}</>
                : 'Run agent to load'}
            </p>
          </div>

          {/* Pattern detected */}
          {triageResult?.pattern_alerts?.length > 0 && (
            <div className="px-3 py-2 border-b border-amber-100 bg-amber-50 flex-shrink-0 flex items-start gap-1.5">
              <span className="text-amber-500 text-xs mt-px flex-shrink-0">▲</span>
              <p className="text-xs font-medium text-amber-800 leading-snug">
                {triageResult.pattern_alerts.map((p, i) => (
                  <span key={i}>{i > 0 && <span className="text-amber-300 mx-1">·</span>}{p}</span>
                ))}
              </p>
            </div>
          )}

          {/* Policy indicator in left pane */}
          {policyLoaded && triageResult?.policy_alignment?.length > 0 && (
            <button
              onClick={() => setSelectedId(null)}
              className="px-3 py-2 border-b border-blue-100 bg-blue-50 flex-shrink-0 flex items-center gap-1.5 w-full text-left hover:bg-blue-100 transition-colors"
            >
              <DocIcon cls="w-3 h-3 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-700 font-medium">
                {triageResult.policy_alignment.length} policy gap{triageResult.policy_alignment.length !== 1 ? 's' : ''} — FP-001
              </p>
              <span className="ml-auto text-blue-400 text-xs">→</span>
            </button>
          )}

          <EventQueue
            batch={batch}
            triageResult={triageResult}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
          />
        </div>

        {/* Right pane */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {mode === 'pre-run'  && <WelcomePanel onRun={runAgent} policyLoaded={policyLoaded} />}
          {mode === 'running'  && <LoadingPanel count={batch.length} policyLoaded={policyLoaded} />}
          {mode === 'briefing' && !selectedEvent && <BriefingPanel result={triageResult} onRun={runAgent} />}
          {mode === 'briefing' && selectedEvent  && (
            <CaseFilePanel
              event={selectedEvent}
              triageResult={triageResult}
              runId={runId}
              policyAlignment={eventPolicyAlignment}
            />
          )}
        </div>

      </div>

      {/* Policy slide-over */}
      {showPolicy && policyText && (
        <PolicySlideOver text={policyText} onClose={() => setShowPolicy(false)} />
      )}

    </div>
  );
}
