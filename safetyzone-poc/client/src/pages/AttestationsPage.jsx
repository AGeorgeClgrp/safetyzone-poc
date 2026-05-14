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
  pageTitle:   '#0A1628',
  pageSub:     '#4A6080',
  emptyTxt:    '#7A92B0',
  spinRing:    '#E3EEFF',
  spinHead:    '#1E5FAD',
  errorBg:     '#FFF0F0',
  errorBdr:    '#FECACA',
  errorTxt:    '#991B1B',
};

const STATUS_STYLES = {
  acknowledged: { bg: '#E3EEFF', txt: '#1B3A6B', bdr: '#CBD5E8', label: 'Acknowledged' },
  pending:      { bg: '#EEF2F8', txt: '#4A6080', bdr: '#CBD5E8', label: 'Pending' },
  overdue:      { bg: '#FEE2E2', txt: '#991B1B', bdr: '#FECACA', label: 'OVERDUE', bold: true },
};

const SEVERITY_STYLES = {
  serious:  { bg: '#1B3A6B', txt: '#BAD4FF' },
  moderate: { bg: '#1E5FAD', txt: '#FFFFFF' },
  minor:    { bg: '#E3EEFF', txt: '#1B3A6B' },
  near_miss:{ bg: '#EEF2F8', txt: '#4A6080' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getAttestationStatus(escalation) {
  if (!escalation?.pssmAttestation) return null;
  const att = escalation.pssmAttestation;
  if (att.ackTimestamp) return 'acknowledged';
  if (new Date(att.deadline) < new Date()) return 'overdue';
  return 'pending';
}

export default function AttestationsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    try {
      const { data } = await apiClient.get('/events');
      setEvents(data.filter((e) => e.status === 'escalated' && e.escalation));
    } catch {
      setError('Failed to load attestation records.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.pageBg, padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.pageTitle, margin: '0 0 4px' }}>
            PSSM Attestations
          </h1>
          <p style={{ fontSize: 12, color: C.pageSub, margin: 0 }}>
            CMS PSSM Domain 1 — Escalation and Acknowledgment Records
          </p>
        </div>

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
        ) : events.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🛡️</div>
              <p style={{ fontSize: 13, fontWeight: 500, color: C.cellBody, margin: '0 0 4px' }}>
                No escalations recorded yet.
              </p>
              <p style={{ fontSize: 11, color: C.emptyTxt, margin: 0 }}>
                PSSM attestation records will appear here after events are escalated.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`,
            borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.theadBg }}>
                    {['Event ID','Event Type','Severity','Escalated At','PSSM Deadline','Acknowledged At','Status'].map((h) => (
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
                  {events.map((event, idx) => {
                    const status = getAttestationStatus(event.escalation);
                    const styCfg = STATUS_STYLES[status] || STATUS_STYLES.pending;
                    const sevSty = SEVERITY_STYLES[event.severity] || { bg: C.theadBg, txt: C.cellBody };
                    const att = event.escalation.pssmAttestation;
                    return (
                      <tr key={event.id}
                        style={{ background: idx % 2 === 0 ? C.rowEven : C.rowAlt,
                          borderBottom: `1px solid ${C.rowBorder}` }}>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: C.cellMeta }}>
                          {event.id.slice(0, 8)}…
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: C.cellPrimary }}>
                          {event.type}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 10,
                            fontWeight: 600, background: sevSty.bg, color: sevSty.txt }}>
                            {event.severity.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', color: C.cellMeta, whiteSpace: 'nowrap' }}>
                          {formatDate(event.escalation.escalatedAt)}
                        </td>
                        <td style={{ padding: '10px 16px', color: C.cellMeta, whiteSpace: 'nowrap' }}>
                          {att ? formatDate(att.deadline) : '—'}
                        </td>
                        <td style={{ padding: '10px 16px', color: C.cellMeta, whiteSpace: 'nowrap' }}>
                          {att?.ackTimestamp ? formatDate(att.ackTimestamp) : '—'}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10,
                            fontWeight: styCfg.bold ? 700 : 500,
                            background: styCfg.bg, color: styCfg.txt,
                            border: `1px solid ${styCfg.bdr}` }}>
                            {styCfg.label}
                          </span>
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
