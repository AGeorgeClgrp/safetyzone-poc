import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

// ── Tokens ────────────────────────────────────────────────────────────────────
const P = {
  immediate: { label: 'Immediate', strip: 'bg-red-500',    badge: 'bg-red-50 text-red-700 ring-1 ring-red-200',       dot: 'bg-red-500',    num: 'text-red-500',    section: 'IMMEDIATE' },
  high:      { label: 'High',      strip: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200', dot: 'bg-orange-400', num: 'text-orange-500', section: 'HIGH · 24H' },
  medium:    { label: 'Medium',    strip: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',   dot: 'bg-amber-400',  num: 'text-amber-500',  section: 'MEDIUM · 72H' },
  routine:   { label: 'Routine',   strip: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',  dot: 'bg-slate-400',  num: 'text-slate-400',  section: 'ROUTINE' },
};

const SEV = {
  severe:   'bg-red-50 text-red-700 ring-1 ring-red-200',
  moderate: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  mild:     'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  no_harm:  'bg-sky-50 text-sky-600 ring-1 ring-sky-200',
  death:    'bg-slate-900 text-white',
};

const RATING_CLS = { poor: 'bg-red-600 text-white', fair: 'bg-amber-500 text-white', good: 'bg-emerald-600 text-white' };

function ago(iso) {
  const h = Math.floor((Date.now() - new Date(iso)) / 3600000);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

function clip(t = '', n = 48) { return t.length > n ? t.slice(0, n) + '…' : t; }

function Spin({ cls = 'h-4 w-4' }) {
  return (
    <svg className={`animate-spin ${cls}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function FileIcon({ cls = 'w-3.5 h-3.5' }) {
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
      <div className="flex-1 bg-black/25" onClick={onClose} />
      <div className="w-[520px] bg-white shadow-2xl flex flex-col border-l border-slate-200">
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Active Policy</p>
            <p className="text-sm font-medium text-slate-800">Fall Prevention Policy — FP-001</p>
            <p className="text-xs text-slate-400 mt-0.5">Effective 02/02/2026 · Rev. 1</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none mt-1">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <pre className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">{text}</pre>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400">Applied automatically during agent triage to identify compliance gaps.</p>
        </div>
      </div>
    </div>
  );
}

// ── Policy alignment section ──────────────────────────────────────────────────
function PolicyGapSection({ data }) {
  if (!data?.gaps?.length) return null;
  const rating = data.coverage_rating || 'fair';
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3.5 border-b border-slate-100 bg-slate-50">
        <FileIcon cls="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Policy Gap Analysis — FP-001</span>
      </div>
      <div className="px-6 py-4 border-b border-slate-100">
        <span className={`text-xs font-medium px-2.5 py-1 rounded capitalize ${RATING_CLS[rating]}`}>
          Policy coverage: {rating}
        </span>
        {data.coverage_summary && (
          <p className="text-xs text-slate-500 leading-relaxed mt-2">{data.coverage_summary}</p>
        )}
      </div>
      <div className="px-6 py-2 border-b border-slate-100 bg-slate-50">
        <span className="text-xs text-slate-400 uppercase tracking-widest font-medium">Event-Level Gaps ({data.gaps.length})</span>
      </div>
      <div className="divide-y divide-slate-100">
        {data.gaps.map((g, i) => (
          <div key={i} className="px-6 py-4">
            <p className="font-mono text-xs text-slate-400 mb-0.5">{g.event_id}</p>
            <p className="text-sm font-medium text-slate-800 mb-2">{g.event_type}</p>
            {g.compliance_type === 'non_compliance'
              ? <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-red-700 text-white uppercase tracking-wide mb-2">Non-Compliance</span>
              : <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide mb-2">⚠ Missing Policy</span>
            }
            {g.policy_section && (
              <p className="text-xs text-teal-600 mb-1.5"><FileIcon cls="w-3 h-3 inline mr-1" />{g.policy_section}</p>
            )}
            <p className="text-xs text-slate-600 leading-relaxed mb-2">{g.gap}</p>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <span className="text-amber-500 text-xs mt-0.5 flex-shrink-0">💡</span>
              <p className="text-xs text-slate-700 leading-relaxed">{g.suggestion}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 5-P status badge ─────────────────────────────────────────────────────────
function PsBadge({ status }) {
  if (status === 'failed')    return <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-700 text-white uppercase tracking-wide">Failed</span>;
  if (status === 'compliant') return <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-600 text-white uppercase tracking-wide">Compliant</span>;
  return <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-500 uppercase tracking-wide">Unknown</span>;
}

// ── Fall 5-Ps per-event (used in CaseFilePanel) ───────────────────────────────
function FallPsCard({ psData }) {
  if (!psData) return null;
  const Ps = [
    { key: 'pain',          label: 'P — Pain',           icon: '🔴' },
    { key: 'personal_needs',label: 'P — Personal Needs', icon: '🚽' },
    { key: 'position',      label: 'P — Position',       icon: '🛏' },
    { key: 'placement',     label: 'P — Placement',      icon: '📞' },
    { key: 'prevent_falls', label: 'P — Prevent Falls',  icon: '⚠️' },
  ];
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3.5 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">5-P Rounding Analysis — FP-001 §5.2</span>
      </div>
      <div className="divide-y divide-slate-100">
        {Ps.map(({ key, label, icon }) => {
          const d = psData[key];
          if (!d) return null;
          return (
            <div key={key} className={`px-6 py-4 ${d.status === 'failed' ? 'bg-red-50/40' : ''}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">{icon} {label}</span>
                <PsBadge status={d.status} />
              </div>
              {d.finding && <p className="text-xs text-slate-600 leading-relaxed">{d.finding}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Fall Analysis batch section (used in BriefingPanel) ───────────────────────
function FallAnalysisSection({ data }) {
  const [tab, setTab] = useState('overview');
  if (!data || !data.fall_event_ids?.length) return null;

  const failedPs = (data.five_ps_analysis || []).flatMap((e) =>
    ['pain','personal_needs','position','placement','prevent_falls']
      .filter((k) => e[k]?.status === 'failed')
      .map((k) => k)
  );
  const psFailCounts = failedPs.reduce((acc, k) => { acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const psLabels = { pain: 'Pain', personal_needs: 'Personal Needs', position: 'Position', placement: 'Placement', prevent_falls: 'Prevent Falls' };

  const tabs = [
    { id: 'overview',    label: 'Overview' },
    { id: 'universal',   label: `Universal Precautions (${data.universal_precautions_failures?.length || 0})` },
    { id: 'five_ps',     label: `5-P Analysis (${data.five_ps_analysis?.length || 0} events)` },
    { id: 'actions',     label: `Action Plans (${data.action_plans?.length || 0})` },
    { id: 'rca',         label: `RCA Elements (${data.rca_required_elements?.length || 0})` },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-3.5 border-b border-slate-100 bg-indigo-50">
        <span className="text-indigo-500 text-sm">⚠</span>
        <span className="text-xs font-medium text-indigo-700 uppercase tracking-widest">Fall Event Deep Analysis — FP-001</span>
        <span className="ml-auto text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded font-medium">{data.fall_event_ids.length} fall{data.fall_event_ids.length !== 1 ? 's' : ''} detected</span>
      </div>

      {/* Pattern summary */}
      {data.pattern_summary && (
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-xs text-slate-500 leading-relaxed">{data.pattern_summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.fall_event_ids.map((id) => (
              <span key={id} className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">{id}</span>
            ))}
          </div>
        </div>
      )}

      {/* 5-P failure heatmap */}
      {Object.keys(psFailCounts).length > 0 && (
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-medium">5-P Failure Summary</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(psFailCounts).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
              <span key={k} className="text-xs px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium">
                {psLabels[k]} <span className="text-red-400">({n})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
              tab === t.id ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-6 py-4">

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-3">
            {(data.five_ps_analysis || []).map((ev) => {
              const failed = ['pain','personal_needs','position','placement','prevent_falls'].filter((k) => ev[k]?.status === 'failed');
              return (
                <div key={ev.event_id} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-slate-400">{ev.event_id}</span>
                    {failed.length > 0 && (
                      <span className="text-xs font-medium text-red-600">{failed.length} P{failed.length !== 1 ? 's' : ''} failed</span>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {['pain','personal_needs','position','placement','prevent_falls'].map((k) => (
                      <span key={k} className={`text-xs px-2 py-0.5 rounded font-medium ${
                        ev[k]?.status === 'failed'    ? 'bg-red-100 text-red-700 border border-red-200' :
                        ev[k]?.status === 'compliant' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>{psLabels[k]}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Universal precautions */}
        {tab === 'universal' && (
          <div className="space-y-4">
            {(data.universal_precautions_failures || []).length === 0
              ? <p className="text-xs text-slate-400 text-center py-4">No universal precaution failures identified.</p>
              : (data.universal_precautions_failures || []).map((f, i) => (
                <div key={i} className="border border-red-100 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-4 py-2.5 flex items-center gap-2">
                    <span className="text-xs font-medium text-red-700 uppercase tracking-wide">Non-Compliance</span>
                    <span className="font-mono text-xs text-slate-400 ml-auto">{f.event_id}</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-xs font-medium text-slate-700">§5.1 — {f.precaution}</p>
                    <p className="text-xs text-slate-500 leading-relaxed"><span className="font-medium text-slate-600">Evidence: </span>{f.evidence}</p>
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <span className="text-amber-500 text-xs mt-0.5 flex-shrink-0">💡</span>
                      <p className="text-xs text-slate-700 leading-relaxed">{f.failure_mode}</p>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* 5-P per event */}
        {tab === 'five_ps' && (
          <div className="space-y-6">
            {(data.five_ps_analysis || []).map((ev) => (
              <div key={ev.event_id}>
                <p className="font-mono text-xs text-slate-400 mb-2">{ev.event_id}</p>
                <FallPsCard psData={ev} />
              </div>
            ))}
          </div>
        )}

        {/* Action plans */}
        {tab === 'actions' && (
          <div className="space-y-3">
            {(data.action_plans || []).map((a, i) => {
              const priCls = { immediate: 'bg-red-600 text-white', short_term: 'bg-amber-500 text-white', ongoing: 'bg-slate-200 text-slate-600' };
              const priLabel = { immediate: 'Immediate', short_term: 'Short Term', ongoing: 'Ongoing' };
              return (
                <div key={i} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase tracking-wide ${priCls[a.priority] || 'bg-slate-200 text-slate-600'}`}>
                      {priLabel[a.priority] || a.priority}
                    </span>
                    {a.owner && <span className="text-xs text-slate-400">Owner: <span className="font-medium text-slate-600">{a.owner}</span></span>}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed mb-1.5">{a.action}</p>
                  {a.metric && (
                    <p className="text-xs text-slate-400"><span className="font-medium text-slate-500">Metric:</span> {a.metric}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* RCA elements */}
        {tab === 'rca' && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs font-medium text-red-700 mb-1">RCA Scope — Fall Events</p>
              <p className="text-xs text-red-600 leading-relaxed">The following elements must be explicitly addressed in any Root Cause Analysis conducted for the fall events identified in this batch.</p>
            </div>
            {(data.rca_required_elements || []).map((el, i) => (
              <div key={i} className="border border-slate-100 rounded-xl p-4">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 mb-0.5">{el.element}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{el.rationale}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Left panel event list ─────────────────────────────────────────────────────
function QueuePanel({ batch, triageResult, selectedId, onSelect, onShowBriefing }) {
  const qMap = triageResult
    ? Object.fromEntries((triageResult.queue || []).map((q) => [q.event_id, q]))
    : {};

  if (!batch.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-xs text-slate-300 text-center leading-relaxed">Run the agent<br />to load events</p>
      </div>
    );
  }

  if (!triageResult) {
    return (
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {batch.map((ev) => <EventRow key={ev.id} ev={ev} selected={selectedId === ev.id} onSelect={onSelect} />)}
      </div>
    );
  }

  const grouped = { immediate: [], high: [], medium: [], routine: [] };
  batch.forEach((ev) => {
    const p = qMap[ev.id]?.priority || 'routine';
    if (grouped[p]) grouped[p].push({ ...ev, _liner: qMap[ev.id]?.one_liner });
  });

  return (
    <div className="flex-1 overflow-y-auto">
      {['immediate', 'high', 'medium', 'routine'].map((pri) => {
        const evs = grouped[pri];
        if (!evs.length) return null;
        const cfg = P[pri];
        return (
          <div key={pri}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border-y border-slate-100 sticky top-0 z-10">
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              <span className="text-xs font-medium text-slate-400 tracking-widest uppercase">{cfg.section}</span>
            </div>
            {evs.map((ev) => <EventRow key={ev.id} ev={ev} selected={selectedId === ev.id} onSelect={onSelect} snippet={ev._liner} />)}
          </div>
        );
      })}
    </div>
  );
}

function EventRow({ ev, selected, onSelect, snippet: snip }) {
  return (
    <button
      onClick={() => onSelect(ev.id)}
      className={`w-full text-left px-3 py-2.5 border-l-2 transition-colors ${
        selected ? 'bg-teal-50 border-l-teal-500' : ev.sentinel ? 'border-l-red-400 hover:bg-slate-50' : 'border-l-transparent hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span className="font-mono text-xs text-slate-400 truncate">{ev.id}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {ev.sentinel && <span className="text-xs text-red-500 font-medium">SEN</span>}
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${SEV[ev.severity] || 'bg-slate-100 text-slate-500'}`}>{ev.severity}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-slate-800 leading-snug truncate">{ev.type}</p>
      <p className="text-xs text-slate-400 mt-0.5 truncate">{ev.unit} · {ago(ev.occurredAt)}{snip ? ` · ${clip(snip)}` : ''}</p>
    </button>
  );
}

// ── Welcome ───────────────────────────────────────────────────────────────────
function WelcomePanel({ onRun, policyLoaded }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-white p-12">
      <div className="max-w-lg w-full">
        <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mb-6">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-slate-900 mb-1">Virtual Risk Manager</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          AI-powered triage across your highest-priority safety events — prioritized queue, pattern detection, regulatory flags, and RCA case files in under 90 seconds.
        </p>
        {policyLoaded && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 mb-6">
            <FileIcon cls="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700"><span className="font-medium">Fall Prevention Policy FP-001</span> loaded — policy alignment included in analysis</p>
          </div>
        )}
        <div className="border border-slate-100 rounded-xl overflow-hidden mb-6 bg-slate-50">
          {[
            ['Retrieves', 'Top 20 events by severity and sentinel status'],
            ['Prioritizes', 'Immediate / High / Medium / Routine work queue'],
            ['Detects', 'Cross-event patterns and contributing factor clusters'],
            ['Flags', 'Regulatory obligations with citations and deadlines'],
            ['Builds', 'Case files with RCA guidance for the top 3 events'],
            ...(policyLoaded ? [
      ['Compares', 'Fall events against Policy FP-001 for compliance gaps'],
      ['Analyzes', '5-P rounding failures and universal precaution gaps per fall'],
      ['Generates', 'Action plans and RCA required elements for fall pattern'],
    ] : []),
          ].map(([lbl, txt], i) => (
            <div key={lbl} className={`px-5 py-3 flex gap-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
              <span className="text-xs font-medium text-teal-600 w-20 flex-shrink-0">{lbl}</span>
              <span className="text-xs text-slate-500">{txt}</span>
            </div>
          ))}
        </div>
        <button onClick={onRun} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-xl transition-colors text-sm">
          Run Triage Agent
        </button>
        <p className="mt-3 text-center text-xs text-slate-400">Powered by Claude · AI-generated · review before acting</p>
      </div>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────
function LoadingPanel({ count, policyLoaded }) {
  const [step, setStep] = useState(0);
  const steps = [
    'Fetching events from database',
    'Reading clinical narratives',
    'Identifying contributing factors',
    'Detecting cross-event patterns',
    'Assigning priority levels',
    'Checking regulatory obligations',
    ...(policyLoaded ? [
      'Comparing events against Fall Prevention Policy FP-001',
      'Mapping 5-P rounding failures per fall event',
      'Building action plans and RCA required elements',
    ] : []),
    'Building case files',
  ];
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 2500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex-1 flex items-center justify-center bg-white p-12">
      <div className="max-w-xs w-full text-center">
        <div className="w-10 h-10 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin mx-auto mb-6" />
        <p className="text-sm font-medium text-slate-800 mb-1">{count ? `Analyzing ${count} events` : 'Loading events…'}</p>
        <p className="text-xs text-slate-400 mb-8">Usually 60–90 seconds</p>
        <div className="space-y-3 text-left">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 text-xs ${i < step ? 'text-teal-600' : i === step ? 'text-slate-700' : 'text-slate-300'}`}>
              <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${i < step ? 'bg-teal-600 border-teal-600' : i === step ? 'border-teal-500' : 'border-slate-200'}`}>
                {i < step && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 6l3 3 5-5" /></svg>}
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

// ── Briefing ──────────────────────────────────────────────────────────────────
function BriefingPanel({ result, onRun }) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="p-6 space-y-5">

        {/* Summary */}
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">◆</span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Agent Briefing</span>
            </div>
            <button onClick={onRun} className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Re-run
            </button>
          </div>
          <p className="text-lg font-medium text-slate-900 leading-snug">{result.summary}</p>
        </div>

        {/* Priority counts */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { k: 'immediate', label: 'Immediate', sub: '' },
            { k: 'high',      label: 'High',      sub: '/ 24h' },
            { k: 'medium',    label: 'Medium',     sub: '/ 72h' },
            { k: 'routine',   label: 'Routine',    sub: '' },
          ].map(({ k, label, sub }) => (
            <div key={k} className="bg-white rounded-xl border border-slate-200 px-5 py-5 text-center">
              <p className={`text-4xl font-light ${P[k].num}`}>{result.counts?.[k] ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1.5">{label}{sub && <span className="text-slate-300"> {sub}</span>}</p>
            </div>
          ))}
        </div>

        {/* Policy gap */}
        <PolicyGapSection data={result.policy_alignment} />

        {/* Fall deep analysis */}
        <FallAnalysisSection data={result.fall_analysis} />

        {/* Regulatory flags */}
        {result.regulatory_flags?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-3.5 border-b border-slate-100 bg-slate-50">
              <span className="text-red-400 text-xs">⚠</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Regulatory Obligations</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {result.regulatory_flags.map((rf, i) => (
                <li key={i} className="px-6 py-3 flex items-start gap-3">
                  <span className="text-red-400 mt-0.5 flex-shrink-0 text-xs">•</span>
                  <p className="text-xs text-slate-700 leading-relaxed"><span className="font-mono font-medium text-slate-500">{rf.event_id}</span> — {rf.flag}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hint */}
        <div className="bg-teal-50 border border-teal-100 rounded-xl px-6 py-4">
          <p className="text-xs font-medium text-teal-700 mb-1">Select any event in the queue for the full case file</p>
          <p className="text-xs text-teal-600 leading-relaxed">
            Pre-built investigation files for the top 3 critical events — narrative analysis, interview guides, RCA recommendations. All events support <span className="font-medium">Ask the Agent</span>.
          </p>
        </div>

      </div>
    </div>
  );
}

// ── Case file ─────────────────────────────────────────────────────────────────
function CaseFilePanel({ event, triageResult, runId, policyAlignment, fallPsData }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer]     = useState('');
  const [asking, setAsking]     = useState(false);

  const qEntry  = triageResult?.queue?.find((q) => q.event_id === event.id);
  const caseFile = triageResult?.top_3?.find((t) => t.event_id === event.id);
  const regFlag  = triageResult?.regulatory_flags?.find((rf) => rf.event_id === event.id);
  const pri      = qEntry?.priority || 'routine';
  const cfg      = P[pri];

  async function ask() {
    if (!question.trim()) return;
    setAsking(true); setAnswer('');
    try {
      const { data } = await apiClient.post('/vrm/ask', { runId, eventId: event.id, question, event, triageAnalysis: caseFile || qEntry });
      setAnswer(data.answer);
    } catch { setAnswer('Unable to get a response. Please try again.'); }
    finally { setAsking(false); }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">

      {/* Header */}
      <div className={`h-1 ${cfg.strip}`} />
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="font-mono text-xs text-slate-400">{event.id}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${SEV[event.severity] || 'bg-slate-100 text-slate-500'}`}>{event.severity}</span>
          {event.sentinel && <span className="text-xs font-medium text-red-600 tracking-wide">SENTINEL</span>}
        </div>
        <h2 className="text-lg font-medium text-slate-900 mb-0.5">{event.type}</h2>
        <p className="text-xs text-slate-400">{event.unit} · {ago(event.occurredAt)} · {event.triggerSource}</p>
        {qEntry?.one_liner && (
          <p className="mt-2.5 text-sm text-slate-600 italic border-l-2 border-slate-200 pl-3 leading-relaxed">{qEntry.one_liner}</p>
        )}
      </div>

      <div className="p-6 space-y-4">

        {/* Narrative */}
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Clinical Narrative</p>
          <p className="text-sm text-slate-700 leading-relaxed">{event.narrative}</p>
        </div>

        {/* Contributing factors */}
        {event.contributingFactors?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 px-6 py-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Contributing Factors</p>
            <div className="flex flex-wrap gap-2">
              {event.contributingFactors.map((f) => (
                <span key={f} className="text-xs px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg font-medium">{f}</span>
              ))}
            </div>
          </div>
        )}

        {caseFile ? (
          <>
            {/* Agent analysis */}
            <div className="bg-teal-50 rounded-xl border border-teal-200 px-6 py-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded bg-teal-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-teal-800 uppercase tracking-wide">Agent Analysis</span>
                <span className="text-xs text-teal-400 ml-auto">AI-generated · review before acting</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">{caseFile.narrative_analysis}</p>
              {caseFile.contributing_factors_extracted?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {caseFile.contributing_factors_extracted.map((f) => (
                    <span key={f} className="text-xs px-2 py-0.5 bg-teal-100 border border-teal-200 text-teal-800 rounded-lg">{f}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {caseFile.recommended_actions?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 px-6 py-5">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Recommended Actions</p>
                <ol className="space-y-3">
                  {caseFile.recommended_actions.map((a, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-600 text-white text-xs font-medium flex items-center justify-center mt-0.5">{i + 1}</span>
                      <p className="text-sm text-slate-700 leading-relaxed">{a}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Interviews */}
            {caseFile.interview_targets?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 px-6 py-5">
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

            {/* RCA */}
            <div className={`rounded-xl border px-6 py-4 flex items-start gap-3 ${caseFile.rca_warranted ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <span className={`text-xs font-medium px-2.5 py-1 rounded flex-shrink-0 mt-0.5 ${caseFile.rca_warranted ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                {caseFile.rca_warranted ? 'RCA Required' : 'RCA Not Required'}
              </span>
              <p className="text-sm text-slate-700 leading-relaxed">{caseFile.rca_rationale}</p>
            </div>

            {/* Reg obligations */}
            {(caseFile.regulatory_obligations || regFlag?.flag) && (
              <div className="bg-white rounded-xl border border-amber-200 px-6 py-5">
                <p className="text-xs font-medium text-amber-600 uppercase tracking-widest mb-3">Regulatory Obligations</p>
                <p className="text-sm text-slate-700 leading-relaxed">{caseFile.regulatory_obligations || regFlag?.flag}</p>
              </div>
            )}
          </>
        ) : qEntry && (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 px-6 py-8 text-center">
            <p className="text-sm font-medium text-slate-400 mb-1">No pre-built case file</p>
            <p className="text-xs text-slate-400">Not in the top 3. Use Ask the Agent below for a detailed analysis.</p>
          </div>
        )}

        {/* 5-P per-event fall analysis */}
        {fallPsData && <FallPsCard psData={fallPsData} />}

        {/* Policy gap — per event */}
        {policyAlignment && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-3.5 border-b border-slate-100 bg-slate-50">
              <FileIcon cls="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Policy Gap — FP-001</span>
            </div>
            <div className="px-6 py-4">
              {policyAlignment.compliance_type === 'non_compliance'
                ? <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-red-700 text-white uppercase tracking-wide mb-3">Non-Compliance</span>
                : <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide mb-3">⚠ Missing Policy</span>
              }
              {policyAlignment.policy_section && (
                <p className="text-xs text-teal-600 mb-2"><FileIcon cls="w-3 h-3 inline mr-1" />{policyAlignment.policy_section}</p>
              )}
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{policyAlignment.gap}</p>
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <span className="text-amber-500 text-xs mt-0.5 flex-shrink-0">💡</span>
                <p className="text-xs text-slate-700 leading-relaxed">{policyAlignment.suggestion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Ask the agent */}
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Ask the Agent</p>
          <div className="flex gap-2">
            <input
              type="text" value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask()}
              placeholder="e.g. What FMEA categories apply here?"
              className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder-slate-300 bg-slate-50"
            />
            <button
              onClick={ask} disabled={asking || !question.trim()}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              {asking ? <Spin /> : 'Ask'}
            </button>
          </div>
          {answer && (
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-teal-600 uppercase tracking-wide mb-2">Agent Response</p>
              <p className="text-sm text-slate-700 leading-relaxed">{answer}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function VrmPage() {
  const [batch, setBatch]               = useState([]);
  const [mode, setMode]                 = useState('pre-run');
  const [triageResult, setTriageResult] = useState(null);
  const [runId, setRunId]               = useState(null);
  const [runError, setRunError]         = useState(null);
  const [selectedId, setSelectedId]     = useState(null);
  const [showPolicy, setShowPolicy]     = useState(false);
  const [policyText, setPolicyText]     = useState('');

  useEffect(() => {
    apiClient.get('/policy').then(({ data }) => setPolicyText(data.content)).catch(() => {});
  }, []);

  async function runAgent() {
    setMode('running'); setRunError(null); setSelectedId(null); setBatch([]);
    try {
      const { data: bd } = await apiClient.get('/vrm/batch');
      setBatch(bd.events);
      if (!bd.events.length) { setRunError('No events found.'); setMode('pre-run'); return; }
      const { data } = await apiClient.post('/vrm/triage/run', { events: bd.events, batchId: bd.batchId });
      setTriageResult(data);
      setRunId(data.runId);
      setMode('briefing');
    } catch (err) {
      setRunError(err.response?.data?.error || 'Agent failed. Please try again.');
      setMode('pre-run');
    }
  }

  const selectedEvent    = selectedId ? batch.find((e) => e.id === selectedId) : null;
  const eventPolicyGap   = selectedEvent ? triageResult?.policy_alignment?.gaps?.find((g) => g.event_id === selectedEvent.id) : null;
  const eventFallPs      = selectedEvent ? triageResult?.fall_analysis?.five_ps_analysis?.find((f) => f.event_id === selectedEvent.id) : null;
  const policyLoaded     = !!policyText;
  const immCount         = triageResult?.counts?.immediate ?? 0;
  const hiCount          = triageResult?.counts?.high ?? 0;
  const gapCount         = triageResult?.policy_alignment?.gaps?.length ?? 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Virtual Risk Manager</p>
            <p className="text-xs text-slate-400">Morning Triage · SafetyZone</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {runError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">{runError}</p>}
          {policyLoaded && (
            <button onClick={() => setShowPolicy(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
              <FileIcon cls="w-3.5 h-3.5 text-blue-500" />
              Fall Prevention Policy
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">Live · SafetyZone DB</span>
          </div>
          {mode === 'running' ? (
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg text-slate-500 text-xs">
              <Spin cls="h-3.5 w-3.5 text-teal-600" /> Analyzing…
            </div>
          ) : (
            <button onClick={runAgent}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
              <span className="text-slate-400">♦</span>
              {mode === 'briefing' ? 'Re-run agent' : 'Run triage agent'}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left — event queue */}
        <div className="w-64 flex-shrink-0 border-r border-slate-200 flex flex-col bg-white">
          <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <p className="text-xs font-medium text-slate-700">
              {mode === 'briefing' ? 'Event queue — submitted batch' : 'Event queue'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'briefing'
                ? <>{batch.length} events{immCount > 0 && <> · <span className="text-red-500 font-medium">{immCount} immediate</span></>}{hiCount > 0 && <> · <span className="text-orange-400 font-medium">{hiCount} high</span></>}</>
                : 'Run agent to load'}
            </p>
          </div>
          {triageResult?.pattern_alerts?.length > 0 && (
            <div className="px-3 py-2 border-b border-amber-100 bg-amber-50 flex-shrink-0 flex items-start gap-1.5">
              <span className="text-amber-500 text-xs mt-px flex-shrink-0">▲</span>
              <p className="text-xs text-amber-800 leading-snug">
                {triageResult.pattern_alerts.map((p, i) => (
                  <span key={i}>{i > 0 && <span className="text-amber-300 mx-1">·</span>}{p}</span>
                ))}
              </p>
            </div>
          )}
          {policyLoaded && gapCount > 0 && (
            <button onClick={() => setSelectedId(null)}
              className="px-3 py-2 border-b border-blue-100 bg-blue-50 flex-shrink-0 flex items-center gap-1.5 w-full hover:bg-blue-100 transition-colors">
              <FileIcon cls="w-3 h-3 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-700 font-medium">{gapCount} policy gap{gapCount !== 1 ? 's' : ''} — FP-001</p>
              <span className="ml-auto text-blue-400 text-xs">→</span>
            </button>
          )}
          <QueuePanel
            batch={batch} triageResult={triageResult}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
          />
        </div>

        {/* Right — content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {mode === 'pre-run'  && <WelcomePanel onRun={runAgent} policyLoaded={policyLoaded} />}
          {mode === 'running'  && <LoadingPanel count={batch.length} policyLoaded={policyLoaded} />}
          {mode === 'briefing' && !selectedEvent && <BriefingPanel result={triageResult} onRun={runAgent} />}
          {mode === 'briefing' && selectedEvent  && <CaseFilePanel event={selectedEvent} triageResult={triageResult} runId={runId} policyAlignment={eventPolicyGap} fallPsData={eventFallPs} />}
        </div>

      </div>

      {showPolicy && policyText && <PolicySlideOver text={policyText} onClose={() => setShowPolicy(false)} />}
    </div>
  );
}
