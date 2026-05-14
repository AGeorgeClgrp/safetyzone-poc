import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import EventCard from '../components/EventCard';

const C = {
  pageBg:      '#F0F4F8',
  pageTitle:   '#0A1628',
  pageSub:     '#4A6080',
  countTxt:    '#1E5FAD',
  warnTxt:     '#92400E',
  cardBg:      '#FFFFFF',
  cardBorder:  '#CBD5E8',
  spinRing:    '#E3EEFF',
  spinHead:    '#1E5FAD',
  errorBg:     '#FFF0F0',
  errorBdr:    '#FECACA',
  errorTxt:    '#991B1B',
  recBg:       '#E3EEFF',
  recBdr:      '#CBD5E8',
  recTitle:    '#0A1628',
  recBody:     '#1B3A6B',
  recMeta:     '#4A6080',
  recBadgeBg:  '#DBEAFE',
  recBadgeTxt: '#1E5FAD',
  recBadgeBdr: '#CBD5E8',
  confBar:     '#1E5FAD',
  confTrack:   '#CBD5E8',
  sentBg:      '#FEE2E2',
  sentTxt:     '#991B1B',
  sentBadgeBg: '#FEE2E2',
  sentBadgeTxt:'#B91C1C',
  waitBg:      '#FEF3C7',
  waitTxt:     '#92400E',
  waitBadgeBg: '#FEF3C7',
  waitBadgeTxt:'#92400E',
  todayTxt:    '#4A6080',
  todayBadgeBg:'#EEF2F8',
  todayBadgeTxt:'#4A6080',
  bulkBg:      '#1B3A6B',
  bulkTxt:     '#FFFFFF',
  bulkBtnBg:   '#1E5FAD',
  bulkBtnHov:  '#1565C0',
  endBtnBg:    '#0A1628',
  endBtnHov:   '#1B3A6B',
  endBtnTxt:   '#FFFFFF',
  pagBtnBdr:   '#CBD5E8',
  pagBtnTxt:   '#4A6080',
};

const SEVERITY_COUNT_STYLES = {
  serious:   { bg: '#1B3A6B', txt: '#BAD4FF' },
  moderate:  { bg: '#1E5FAD', txt: '#FFFFFF' },
  minor:     { bg: '#E3EEFF', txt: '#1B3A6B' },
  near_miss: { bg: '#EEF2F8', txt: '#4A6080' },
};

const SAVED_VIEWS = [
  { key: 'my_queue',      label: 'My queue',       severity: null,        sentinelOnly: false },
  { key: 'high_severity', label: 'High severity',  severity: 'serious',   sentinelOnly: false },
  { key: 'sentinel',      label: 'Sentinel review', severity: null,       sentinelOnly: true  },
  { key: 'near_miss',     label: 'Near Miss',      severity: 'near_miss', sentinelOnly: false },
];

const DAY_OPTIONS = [
  { value: 7,  label: '7 days'  },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
];

function isAwaitingOver12h(event) {
  const diff = Date.now() - new Date(event.occurredAt).getTime();
  return event.status === 'queued' && diff > 12 * 3600000;
}

function SectionLabel({ icon, label, count, labelColor, badgeBg, badgeTxt }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 11, background: badgeBg, color: badgeTxt, padding: '2px 8px', borderRadius: 999 }}>
        {count}
      </span>
    </div>
  );
}

export default function TriageQueuePage() {
  const navigate = useNavigate();
  const [events, setEvents]         = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 50, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeView, setActiveView] = useState('my_queue');
  const [days, setDays]             = useState(30);
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(new Set());
  const [showRec, setShowRec]       = useState(true);
  const [endHov, setEndHov]         = useState(false);

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

  useEffect(() => { setPage(1); loadEvents(1, days, currentView); }, [activeView, days]);
  useEffect(() => { loadEvents(page, days, currentView); }, [page]);

  const sentinelEvents = events.filter((e) => e.sentinel);
  const awaitingEvents = events.filter((e) => !e.sentinel && isAwaitingOver12h(e));
  const todayEvents    = events.filter((e) => !e.sentinel && !isAwaitingOver12h(e));
  const counts         = events.reduce((acc, e) => { acc[e.severity] = (acc[e.severity] || 0) + 1; return acc; }, {});
  const awaiting12hCount = events.filter(isAwaitingOver12h).length;

  function toggleSelect(id) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function handleBulkAction(action) {
    alert(`Bulk "${action}" on ${selected.size} events — would POST to /api/triage/bulk in production.`);
    setSelected(new Set());
  }
  async function handleEndSession() {
    try { await apiClient.post('/session/end', {}); } catch { /* non-fatal */ }
    navigate('/session-summary');
  }

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.pageBg, padding: '24px 24px 96px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: C.pageTitle, margin: '0 0 4px' }}>
                What needs your attention this morning.
              </h1>
              <p style={{ fontSize: 12, color: C.pageSub, margin: 0 }}>
                {todayStr}
                {' · '}
                <span style={{ color: C.countTxt, fontWeight: 600 }}>{pagination.total.toLocaleString()} new</span>
                {awaiting12hCount > 0 && (
                  <span style={{ color: C.warnTxt, fontWeight: 600, marginLeft: 4 }}>
                    · {awaiting12hCount} awaiting triage over 12h
                  </span>
                )}
              </p>
            </div>

            {/* Days selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 4, boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
              {DAY_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setDays(opt.value)}
                  style={{
                    padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer',
                    background: days === opt.value ? '#0A1628' : 'transparent',
                    color: days === opt.value ? '#FFFFFF' : '#4A6080',
                    transition: 'background 0.15s',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {Object.entries(counts).map(([sev, cnt]) => {
              const s = SEVERITY_COUNT_STYLES[sev] || { bg: '#EEF2F8', txt: '#4A6080' };
              return (
                <span key={sev} style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: s.bg, color: s.txt }}>
                  {cnt} {sev.replace('_', ' ')}
                </span>
              );
            })}
          </div>
        </div>

        {/* Morning recommendation */}
        {showRec && !loading && sentinelEvents.length > 0 && (
          <div style={{ marginBottom: 20, background: C.recBg, border: `1px solid ${C.recBdr}`, borderRadius: 12, padding: 16, position: 'relative' }}>
            <button onClick={() => setShowRec(false)}
              style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#7A92B0', lineHeight: 1 }}>
              ×
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.recBadgeBg, border: `1px solid ${C.recBadgeBdr}`, borderRadius: 999, padding: '2px 10px' }}>
                <span style={{ fontSize: 11, color: C.recBadgeTxt, fontWeight: 600 }}>Suggested focus · this morning</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ height: 6, width: 64, background: C.confTrack, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '71%', background: C.confBar, borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 11, color: C.recMeta }}>71% · medium confidence</span>
              </div>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.recTitle, margin: '0 0 4px' }}>
              {sentinelEvents.length} sentinel event{sentinelEvents.length > 1 ? 's' : ''} require immediate review
            </p>
            <p style={{ fontSize: 12, color: C.recBody, margin: '0 0 12px' }}>
              {sentinelEvents.length > 1
                ? `${sentinelEvents.length} sentinel events detected this session, including "${sentinelEvents[0]?.type}" and "${sentinelEvents[1]?.type}". Joint Commission mandatory RCA timelines are active.`
                : `"${sentinelEvents[0]?.type}" on ${sentinelEvents[0]?.encounter?.unit} detected as a sentinel event. Joint Commission mandatory RCA within 45 days.`}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate(`/events/${sentinelEvents[0]?.id}`)}
                style={{ fontSize: 12, background: '#1E5FAD', color: '#FFFFFF', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}>
                Review individually
              </button>
              <button onClick={() => alert('Cluster view — available in production build.')}
                style={{ fontSize: 12, background: 'transparent', color: '#1E5FAD', border: `1px solid ${C.recBdr}`, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}>
                Open as cluster
              </button>
              <button onClick={() => alert('Confidence based on: sentinel flag weight (0.6), recency (0.2), cluster membership (0.2).')}
                style={{ fontSize: 12, background: 'none', color: C.recMeta, border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Why this suggestion?
              </button>
            </div>
          </div>
        )}

        {/* Saved views */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
          {SAVED_VIEWS.map((v) => (
            <button key={v.key} onClick={() => setActiveView(v.key)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: activeView === v.key ? '#1E5FAD' : C.cardBg,
                color: activeView === v.key ? '#FFFFFF' : '#4A6080',
                boxShadow: activeView === v.key ? 'none' : `0 0 0 1px ${C.cardBorder}`,
                transition: 'background 0.15s',
              }}>
              {v.label}
            </button>
          ))}
          <button onClick={() => alert('New saved view — available in production build.')}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, color: '#7A92B0', background: 'transparent', border: `1px dashed ${C.cardBorder}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + New view
          </button>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div style={{ marginBottom: 12, background: C.bulkBg, color: C.bulkTxt, borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 12px rgba(10,22,40,0.25)' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.size} selected</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              {['Assign', 'Mark reviewed', 'Add tag'].map((action) => (
                <button key={action} onClick={() => handleBulkAction(action)}
                  style={{ fontSize: 11, background: C.bulkBtnBg, color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: 7, cursor: 'pointer' }}>
                  {action}
                </button>
              ))}
            </div>
            <button onClick={() => setSelected(new Set())}
              style={{ marginLeft: 'auto', fontSize: 12, background: 'none', border: 'none', color: '#BAD4FF', cursor: 'pointer' }}>
              Clear
            </button>
          </div>
        )}

        {/* Events list */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
            <div style={{ width: 32, height: 32, border: `4px solid ${C.spinRing}`, borderTopColor: C.spinHead, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ padding: '12px 16px', background: C.errorBg, border: `1px solid ${C.errorBdr}`, borderRadius: 8, fontSize: 12, color: C.errorTxt }}>
            {error}
          </div>
        ) : events.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
              <p style={{ fontSize: 13, color: '#4A6080', margin: 0 }}>No events found for this view and time range.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {sentinelEvents.length > 0 && (
              <div>
                <SectionLabel icon="🔥" label="Sentinel review" count={`${sentinelEvents.length} · auto-routed`}
                  labelColor={C.sentTxt} badgeBg={C.sentBadgeBg} badgeTxt={C.sentBadgeTxt} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sentinelEvents.map((e) => <EventCard key={e.id} event={e} selected={selected.has(e.id)} onToggle={toggleSelect} />)}
                </div>
              </div>
            )}

            {awaitingEvents.length > 0 && (
              <div>
                <SectionLabel icon="⏰" label="Awaiting triage > 12h" count={awaitingEvents.length}
                  labelColor={C.waitTxt} badgeBg={C.waitBadgeBg} badgeTxt={C.waitBadgeTxt} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {awaitingEvents.map((e) => <EventCard key={e.id} event={e} selected={selected.has(e.id)} onToggle={toggleSelect} />)}
                </div>
              </div>
            )}

            {todayEvents.length > 0 && (
              <div>
                <SectionLabel icon="·" label="Today" count={todayEvents.length}
                  labelColor={C.todayTxt} badgeBg={C.todayBadgeBg} badgeTxt={C.todayBadgeTxt} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {todayEvents.map((e) => <EventCard key={e.id} event={e} selected={selected.has(e.id)} onToggle={toggleSelect} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 0' }}>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              style={{ padding: '6px 14px', fontSize: 12, borderRadius: 7, border: `1px solid ${C.pagBtnBdr}`, color: C.pagBtnTxt, background: C.cardBg, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
              ← Prev
            </button>
            <span style={{ fontSize: 12, color: C.pageSub }}>
              Page {page} of {pagination.pages} ({pagination.total.toLocaleString()} total)
            </span>
            <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)}
              style={{ padding: '6px 14px', fontSize: 12, borderRadius: 7, border: `1px solid ${C.pagBtnBdr}`, color: C.pagBtnTxt, background: C.cardBg, cursor: page === pagination.pages ? 'not-allowed' : 'pointer', opacity: page === pagination.pages ? 0.4 : 1 }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Floating End Session */}
      <div style={{ position: 'fixed', bottom: 24, right: 24 }}>
        <button
          onClick={handleEndSession}
          onMouseEnter={() => setEndHov(true)}
          onMouseLeave={() => setEndHov(false)}
          style={{
            background: endHov ? C.endBtnHov : C.endBtnBg,
            color: C.endBtnTxt, border: 'none',
            fontSize: 13, fontWeight: 600,
            padding: '12px 20px', borderRadius: 12,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(10,22,40,0.35)',
            transition: 'background 0.15s',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
          <span>⏹</span> End Session
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
