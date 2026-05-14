import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';

const C = {
  pageBg:      '#F0F4F8',
  cardBg:      '#FFFFFF',
  cardBorder:  '#CBD5E8',
  theadBg:     '#EEF2F8',
  theadTxt:    '#7A92B0',
  rowAlt:      '#F7F9FC',
  rowEven:     '#FFFFFF',
  rowBorder:   '#EEF2F8',
  cellMeta:    '#7A92B0',
  cellPrimary: '#0A1628',
  cellBody:    '#4A6080',
  cellMono:    '#4A6080',
  pageTitle:   '#0A1628',
  pageSub:     '#4A6080',
  filterLabel: '#4A6080',
  filterBdr:   '#CBD5E8',
  filterFocus: '#1E5FAD',
  countTxt:    '#7A92B0',
  emptyTxt:    '#7A92B0',
  spinRing:    '#E3EEFF',
  spinHead:    '#1E5FAD',
  errorBg:     '#FFF0F0',
  errorBdr:    '#FECACA',
  errorTxt:    '#991B1B',
};

// All action badge colors → blue palette
const ACTION_STYLES = {
  event_opened:             { bg: '#EEF2F8', txt: '#4A6080' },
  event_classified:         { bg: '#E3EEFF', txt: '#1B3A6B' },
  disposition_set:          { bg: '#DBEAFE', txt: '#1E5FAD' },
  event_escalated:          { bg: '#1B3A6B', txt: '#BAD4FF' },
  escalation_acknowledged:  { bg: '#E3EEFF', txt: '#283593' },
  session_start:            { bg: '#EEF2F8', txt: '#01579B' },
  session_end:              { bg: '#EEF2F8', txt: '#01579B' },
  vrm_triage_run:           { bg: '#E3EEFF', txt: '#1E5FAD' },
  vrm_ask:                  { bg: '#DBEAFE', txt: '#0277BD' },
};

const ACTION_LABELS = {
  event_opened:             'Opened Event',
  event_classified:         'Classified Event',
  disposition_set:          'Set Disposition',
  event_escalated:          'Escalated Event',
  escalation_acknowledged:  'Acknowledged Escalation',
  session_start:            'Session Started',
  session_end:              'Session Ended',
  vrm_triage_run:           'VRM Triage Run',
  vrm_ask:                  'VRM Ask',
};

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function AuditLogPage() {
  const [log, setLog]               = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => { loadAudit(); }, []);

  async function loadAudit() {
    try {
      const { data } = await apiClient.get('/audit');
      setLog(data);
    } catch {
      setError('Failed to load audit log.');
    } finally {
      setLoading(false);
    }
  }

  const allActions = ['all', ...Object.keys(ACTION_LABELS)];
  const filtered = actionFilter === 'all' ? log : log.filter((e) => e.action === actionFilter);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.pageBg, padding: '24px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.pageTitle, margin: '0 0 4px' }}>Audit Log</h1>
          <p style={{ fontSize: 12, color: C.pageSub, margin: 0 }}>
            Complete record of all actions taken in this session
          </p>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: C.filterLabel }}>Filter by action:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              border: `1px solid ${C.filterBdr}`, borderRadius: 7,
              padding: '5px 10px', fontSize: 12, color: C.cellBody,
              background: C.cardBg, outline: 'none', cursor: 'pointer',
            }}
          >
            {allActions.map((action) => (
              <option key={action} value={action}>
                {action === 'all' ? 'All Actions' : ACTION_LABELS[action] || action}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: C.countTxt }}>{filtered.length} entries</span>
        </div>

        {/* States */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 36, height: 36, border: `4px solid ${C.spinRing}`,
              borderTopColor: C.spinHead, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ padding: '12px 16px', background: C.errorBg, border: `1px solid ${C.errorBdr}`,
            borderRadius: 8, fontSize: 12, color: C.errorTxt }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <p style={{ fontSize: 12, color: C.emptyTxt, margin: 0 }}>No audit entries yet. Start reviewing events.</p>
            </div>
          </div>
        ) : (
          <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`,
            borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.theadBg }}>
                    {['Timestamp','User','Action','Resource','Detail'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left',
                        fontSize: 10, fontWeight: 600, color: C.theadTxt,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        borderBottom: `1px solid ${C.cardBorder}` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry, idx) => {
                    const actionLabel = ACTION_LABELS[entry.action] || entry.action;
                    const sty = ACTION_STYLES[entry.action] || { bg: C.theadBg, txt: C.cellBody };
                    return (
                      <tr key={entry.id || idx}
                        style={{ background: idx % 2 === 0 ? C.rowEven : C.rowAlt,
                          borderBottom: `1px solid ${C.rowBorder}` }}>
                        <td style={{ padding: '10px 16px', color: C.cellMeta, whiteSpace: 'nowrap' }}>
                          {formatDate(entry.timestamp)}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ fontWeight: 600, color: C.cellPrimary }}>{entry.userName}</div>
                          <div style={{ color: C.cellMeta, marginTop: 1 }}>{entry.userRole}</div>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 4, fontWeight: 600,
                            fontSize: 10, background: sty.bg, color: sty.txt }}>
                            {actionLabel}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', color: C.cellBody }}>
                          {entry.resourceType}
                          {entry.resourceRef && (
                            <div style={{ fontFamily: 'monospace', color: C.cellMeta, marginTop: 1 }}>
                              {entry.resourceRef.slice(0, 8)}…
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 16px', color: C.cellBody, maxWidth: 320 }}>
                          {entry.detail || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
