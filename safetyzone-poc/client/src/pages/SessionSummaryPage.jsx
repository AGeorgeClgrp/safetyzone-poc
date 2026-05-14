import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

const C = {
  pageBg:       '#F0F4F8',
  cardBg:       '#FFFFFF',
  cardBorder:   '#CBD5E8',
  cardHeaderBg: '#EEF2F8',
  pageTitle:    '#0A1628',
  pageSub:      '#4A6080',
  cardTitle:    '#0A1628',
  cardBody:     '#4A6080',
  kpiLabel:     '#7A92B0',
  statA:        '#1E5FAD',
  statB:        '#1565C0',
  statC:        '#0288D1',
  barTrack:     '#EEF2F8',
  alertInfoBg:  '#EEF2F8',
  alertInfoBdr: '#CBD5E8',
  alertInfoTit: '#0A1628',
  alertInfoTxt: '#4A6080',
  alertWarnBg:  '#E3EEFF',
  alertWarnBdr: '#B8D0F8',
  alertWarnTit: '#1B3A6B',
  alertWarnTxt: '#4A6080',
  alertErrBg:   '#FEE2E2',
  alertErrBdr:  '#FECACA',
  alertErrTit:  '#991B1B',
  alertErrTxt:  '#B91C1C',
  btnPrimBg:    '#1E5FAD',
  btnPrimHov:   '#1565C0',
  btnPrimTxt:   '#FFFFFF',
  btnSecBg:     '#FFFFFF',
  btnSecBdr:    '#CBD5E8',
  btnSecTxt:    '#4A6080',
  btnSecHov:    '#EEF2F8',
  spinRing:     '#E3EEFF',
  spinHead:     '#1E5FAD',
  errorBg:      '#FFF0F0',
  errorBdr:     '#FECACA',
  errorTxt:     '#991B1B',
};

// Blue shades for disposition bars
const DISPOSITION_CONFIG = {
  close:              { label: 'Closed',              color: '#1E5FAD' },
  monitor:            { label: 'Monitoring',           color: '#0288D1' },
  escalate:           { label: 'Escalated',            color: '#1565C0' },
  route_investigation:{ label: 'Under Investigation',  color: '#0277BD' },
};

function StatCard({ value, label, valueColor }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`,
      borderRadius: 12, padding: '16px 20px', textAlign: 'center',
      boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.kpiLabel, marginTop: 5, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function PrimaryBtn({ onClick, children, hoverColor }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex: 1, background: hov ? (hoverColor || C.btnPrimHov) : C.btnPrimBg,
        color: C.btnPrimTxt, border: 'none', fontSize: 13, fontWeight: 600,
        padding: '10px 16px', borderRadius: 9, cursor: 'pointer', transition: 'background 0.15s' }}>
      {children}
    </button>
  );
}

function SecondaryBtn({ onClick, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex: 1, background: hov ? C.btnSecHov : C.btnSecBg,
        color: C.btnSecTxt, border: `1px solid ${C.btnSecBdr}`,
        fontSize: 13, fontWeight: 500, padding: '10px 16px',
        borderRadius: 9, cursor: 'pointer', transition: 'background 0.15s' }}>
      {children}
    </button>
  );
}

export default function SessionSummaryPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => { loadSummary(); }, []);

  async function loadSummary() {
    try {
      const { data } = await apiClient.get('/session/summary');
      setSummary(data);
    } catch {
      setError('Failed to load session summary.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.pageBg }}>
      <div style={{ width: 36, height: 36, border: `4px solid ${C.spinRing}`,
        borderTopColor: C.spinHead, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !summary) return (
    <div style={{ flex: 1, background: C.pageBg, padding: 24 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '12px 16px',
        background: C.errorBg, border: `1px solid ${C.errorBdr}`,
        borderRadius: 8, fontSize: 12, color: C.errorTxt }}>
        {error || 'No summary available.'}
      </div>
    </div>
  );

  const totalDispositions = Object.values(summary.dispositions).reduce((a, b) => a + b, 0);
  const overdueCount = summary.overduePssm.length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.pageBg, padding: 24 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.pageTitle, margin: '0 0 4px' }}>
            Session Summary
          </h1>
          <p style={{ fontSize: 12, color: C.pageSub, margin: 0 }}>
            Review of current triage session activity
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: 20 }}>
          <StatCard value={summary.totalReviewed}              label="Events Reviewed"  valueColor={C.statA} />
          <StatCard value={summary.escalationsCount}           label="Escalations"      valueColor={C.statB} />
          <StatCard value={summary.openAcknowledgments.length} label="Open Acks"        valueColor={C.statC} />
          <StatCard value={overdueCount} label="Overdue PSSM"
            valueColor={overdueCount > 0 ? '#991B1B' : C.statA} />
        </div>

        {/* Dispositions */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`,
          borderRadius: 12, padding: 20, marginBottom: 14,
          boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: C.kpiLabel,
            textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>
            Dispositions Breakdown
          </h2>
          {totalDispositions === 0 ? (
            <p style={{ fontSize: 12, color: C.cardBody }}>No dispositions have been set yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(DISPOSITION_CONFIG).map(([key, cfg]) => {
                const count = summary.dispositions[key] || 0;
                const pct = totalDispositions > 0 ? Math.round((count / totalDispositions) * 100) : 0;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      fontSize: 12, marginBottom: 5 }}>
                      <span style={{ fontWeight: 500, color: C.cardTitle }}>{cfg.label}</span>
                      <span style={{ color: C.cardBody }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: C.barTrack, borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: cfg.color,
                        borderRadius: 999, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Open acknowledgments */}
        {summary.openAcknowledgments.length > 0 && (
          <div style={{ background: C.alertWarnBg, border: `1px solid ${C.alertWarnBdr}`,
            borderRadius: 12, padding: 18, marginBottom: 14 }}>
            <h2 style={{ fontSize: 11, fontWeight: 600, color: C.alertWarnTit,
              textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
              Open Acknowledgments
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex',
              flexDirection: 'column', gap: 8 }}>
              {summary.openAcknowledgments.map((item) => (
                <li key={item.eventId} style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', fontSize: 12 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: C.alertWarnTit }}>{item.eventType}</span>
                    <span style={{ fontFamily: 'monospace', color: C.alertWarnTxt, marginLeft: 8, fontSize: 11 }}>
                      {item.eventId.slice(0, 8)}…
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: C.alertWarnTxt }}>
                    Deadline: {new Date(item.deadline).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Overdue PSSM */}
        {summary.overduePssm.length > 0 && (
          <div style={{ background: C.alertErrBg, border: `1px solid ${C.alertErrBdr}`,
            borderRadius: 12, padding: 18, marginBottom: 14 }}>
            <h2 style={{ fontSize: 11, fontWeight: 600, color: C.alertErrTit,
              textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
              Overdue PSSM Attestations
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex',
              flexDirection: 'column', gap: 8 }}>
              {summary.overduePssm.map((item) => (
                <li key={item.eventId} style={{ fontSize: 12, color: C.alertErrTxt }}>
                  <span style={{ fontWeight: 600 }}>{item.eventType}</span>
                  <span style={{ marginLeft: 8, fontSize: 11 }}>
                    — Deadline was {new Date(item.deadline).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* PSSM attestations link */}
        <div style={{ background: C.alertInfoBg, border: `1px solid ${C.alertInfoBdr}`,
          borderRadius: 12, padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.alertInfoTit, margin: '0 0 3px' }}>
              PSSM Attestations
            </p>
            <p style={{ fontSize: 11, color: C.alertInfoTxt, margin: 0 }}>
              View all escalation and attestation records
            </p>
          </div>
          <Link to="/attestations" style={{ textDecoration: 'none' }}>
            <button style={{ background: C.btnPrimBg, color: C.btnPrimTxt, border: 'none',
              fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
              View Attestations
            </button>
          </Link>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <SecondaryBtn onClick={() => navigate('/queue')}>Return to Queue</SecondaryBtn>
          <PrimaryBtn onClick={() => alert('PDF export coming soon.')}>Download Report</PrimaryBtn>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
