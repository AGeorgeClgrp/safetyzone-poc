import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import EventCard from '../components/EventCard';

const SAVED_VIEWS = [
  { key: 'my_queue', label: 'My queue', severity: null, sentinelOnly: false },
  { key: 'high_severity', label: 'High severity', severity: 'serious', sentinelOnly: false },
  { key: 'sentinel', label: 'Sentinel review', severity: null, sentinelOnly: true },
  { key: 'near_miss', label: 'Near Miss', severity: 'near_miss', sentinelOnly: false },
];

const DAY_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
];

const SEVERITY_COUNT_COLORS = {
  serious: 'bg-red-100 text-red-700',
  moderate: 'bg-orange-100 text-orange-700',
  minor: 'bg-yellow-100 text-yellow-700',
  near_miss: 'bg-blue-100 text-blue-700',
};

// Events that arrived more than 12 hours ago and are still queued
function isAwaitingOver12h(event) {
  const diff = Date.now() - new Date(event.occurredAt).getTime();
  return event.status === 'queued' && diff > 12 * 3600000;
}

export default function TriageQueuePage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 50, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('my_queue');
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [showRec, setShowRec] = useState(true);

  const currentView = SAVED_VIEWS.find((v) => v.key === activeView) || SAVED_VIEWS[0];

  const loadEvents = useCallback(async (currentPage, currentDays, view) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: currentDays, page: currentPage, pageSize: 50 });
      if (view.severity) params.set('severity', view.severity);
      const { data } = await apiClient.get(`/events?${params}`);
      let evs = data.events;
      if (view.sentinelOnly) evs = evs.filter((e) => e.sentinel);
      setEvents(evs);
      setPagination(data.pagination);
      setError(null);
    } catch {
      setError('Failed to load events. Check your connection and refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    loadEvents(1, days, currentView);
  }, [activeView, days]);

  useEffect(() => {
    loadEvents(page, days, currentView);
  }, [page]);

  // Split into 3 sections (Prototype A)
  const sentinelEvents   = events.filter((e) => e.sentinel);
  const awaitingEvents   = events.filter((e) => !e.sentinel && isAwaitingOver12h(e));
  const todayEvents      = events.filter((e) => !e.sentinel && !isAwaitingOver12h(e));

  const counts = events.reduce((acc, e) => {
    acc[e.severity] = (acc[e.severity] || 0) + 1;
    return acc;
  }, {});

  const awaiting12hCount = events.filter(isAwaitingOver12h).length;

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBulkAction(action) {
    alert(`Bulk "${action}" on ${selected.size} events — would POST to /api/triage/bulk in production.`);
    setSelected(new Set());
  }

  async function handleEndSession() {
    try { await apiClient.post('/session/end', {}); } catch { /* non-fatal */ }
    navigate('/session-summary');
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Header — Prototype A style */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900">What needs your attention this morning.</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {todayStr} ·{' '}
              <span className="text-indigo-600 font-medium">{pagination.total.toLocaleString()} new</span>
              {awaiting12hCount > 0 && (
                <span className="text-amber-600 font-medium ml-1">· {awaiting12hCount} awaiting triage over 12h</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Days selector */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              {DAY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    days === opt.value ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Severity chips */}
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(counts).map(([sev, cnt]) => (
            <span key={sev} className={`px-2.5 py-1 rounded-full text-xs font-medium ${SEVERITY_COUNT_COLORS[sev] || 'bg-slate-100 text-slate-600'}`}>
              {cnt} {sev.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Morning recommendation card (Prototype A) */}
      {showRec && !loading && sentinelEvents.length > 0 && (
        <div className="mb-5 bg-indigo-50 border border-indigo-200 rounded-xl p-4 relative">
          <button onClick={() => setShowRec(false)} className="absolute top-3 right-3 text-indigo-300 hover:text-indigo-500 text-lg leading-none">×</button>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 bg-indigo-100 border border-indigo-200 rounded-full px-2.5 py-0.5">
              <span className="text-xs text-indigo-600 font-semibold">Suggested focus · this morning</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-16 bg-indigo-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '71%' }} />
              </div>
              <span className="text-xs text-indigo-500">71% · medium confidence</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-indigo-900 mb-1">
            {sentinelEvents.length} sentinel event{sentinelEvents.length > 1 ? 's' : ''} require immediate review
          </p>
          <p className="text-xs text-indigo-700 mb-3">
            {sentinelEvents.length > 1
              ? `${sentinelEvents.length} sentinel events detected this session, including "${sentinelEvents[0]?.type}" and "${sentinelEvents[1]?.type}". Joint Commission mandatory RCA timelines are active.`
              : `"${sentinelEvents[0]?.type}" on ${sentinelEvents[0]?.encounter?.unit} detected as a sentinel event. Joint Commission mandatory RCA within 45 days.`
            }
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/events/${sentinelEvents[0]?.id}`)}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Review individually
            </button>
            <button
              onClick={() => alert('Cluster view — available in production build.')}
              className="text-xs border border-indigo-300 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Open as cluster
            </button>
            <button
              onClick={() => alert('Confidence based on: sentinel flag weight (0.6), recency (0.2), cluster membership (0.2).')}
              className="text-xs text-indigo-500 hover:underline px-2"
            >
              Why this suggestion?
            </button>
          </div>
        </div>
      )}

      {/* Saved views row */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto">
        {SAVED_VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setActiveView(v.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeView === v.key ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {v.label}
          </button>
        ))}
        <button
          onClick={() => alert('New saved view — available in production build.')}
          className="px-3 py-1.5 rounded-lg text-sm text-slate-400 border border-dashed border-slate-300 hover:border-slate-400 whitespace-nowrap"
        >
          + New view
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 bg-indigo-700 text-white rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-md">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-2">
            {['Assign', 'Mark reviewed', 'Add tag'].map((action) => (
              <button
                key={action}
                onClick={() => handleBulkAction(action)}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-indigo-300 hover:text-white text-sm">
            Clear
          </button>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading events from database…
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      ) : events.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-slate-500 text-sm">No events found for this view and time range.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 pb-24">
          {/* Section 1: Sentinel review */}
          {sentinelEvents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🔥</span>
                <span className="text-sm font-bold text-red-700 uppercase tracking-wide">Sentinel review</span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{sentinelEvents.length} · auto-routed</span>
              </div>
              <div className="space-y-2">
                {sentinelEvents.map((event) => (
                  <EventCard key={event.id} event={event} selected={selected.has(event.id)} onToggle={toggleSelect} />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Awaiting > 12h */}
          {awaitingEvents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">⏰</span>
                <span className="text-sm font-bold text-amber-700 uppercase tracking-wide">Awaiting triage &gt; 12h</span>
                <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{awaitingEvents.length}</span>
              </div>
              <div className="space-y-2">
                {awaitingEvents.map((event) => (
                  <EventCard key={event.id} event={event} selected={selected.has(event.id)} onToggle={toggleSelect} />
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Today */}
          {todayEvents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">·</span>
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">Today</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{todayEvents.length}</span>
              </div>
              <div className="space-y-2">
                {todayEvents.map((event) => (
                  <EventCard key={event.id} event={event} selected={selected.has(event.id)} onToggle={toggleSelect} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 py-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {pagination.pages} ({pagination.total.toLocaleString()} total)
          </span>
          <button
            disabled={page === pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}

      {/* Floating End Session */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleEndSession}
          className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg transition-colors flex items-center gap-2"
        >
          <span>⏹</span> End Session
        </button>
      </div>
    </div>
  );
}
