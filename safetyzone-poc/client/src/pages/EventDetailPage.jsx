import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import ClassificationPanel from '../components/ClassificationPanel';
import DispositionPanel from '../components/DispositionPanel';
import HarmBadge from '../components/HarmBadge';
import PriorityBadge from '../components/PriorityBadge';

const C = {
  pageBg:      '#F0F4F8',
  cardBg:      '#FFFFFF',
  cardBorder:  '#CBD5E8',
  cardTitle:   '#0A1628',
  cardBody:    '#4A6080',
  cardMeta:    '#7A92B0',
  sectionHdr:  '#4A6080',
  linkTxt:     '#1E5FAD',
  spinRing:    '#E3EEFF',
  spinHead:    '#1E5FAD',
  errorBg:     '#FFF0F0',
  errorBdr:    '#FECACA',
  errorTxt:    '#991B1B',
  escalBg:     '#FFF0F0',
  escalBdr:    '#FECACA',
  escalTitle:  '#991B1B',
  escalLabel:  '#B91C1C',
  escalBody:   '#7F1D1D',
  ackBg:       '#DCFCE7',
  ackBdr:      '#BBF7D0',
  ackTxt:      '#15803D',
};

const STATUS_STYLES = {
  queued:              { bg: '#EEF2F8', txt: '#4A6080' },
  in_review:           { bg: '#DBEAFE', txt: '#1E5FAD' },
  classified:          { bg: '#E3EEFF', txt: '#1B3A6B' },
  closed:              { bg: '#DCFCE7', txt: '#15803D' },
  monitoring:          { bg: '#E3EEFF', txt: '#0288D1' },
  escalated:           { bg: '#FEE2E2', txt: '#991B1B' },
  under_investigation: { bg: '#DBEAFE', txt: '#0277BD' },
};

const STATUS_LABELS = {
  queued: 'Queued', in_review: 'In Review', classified: 'Classified',
  closed: 'Closed', monitoring: 'Monitoring', escalated: 'Escalated',
  under_investigation: 'Under Investigation',
};

const SOURCE_STYLES = {
  'IHI GTT':          { bg: '#E3EEFF', txt: '#1B3A6B' },
  'CMS HAC':          { bg: '#E3EEFF', txt: '#0288D1' },
  'NQF SRE':          { bg: '#E3EEFF', txt: '#1565C0' },
  'Joint Commission': { bg: '#DBEAFE', txt: '#0277BD' },
  'TJC Sentinel':     { bg: '#FEE2E2', txt: '#991B1B' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeUntilDeadline(isoDeadline) {
  const diff = new Date(isoDeadline) - Date.now();
  if (diff <= 0) return { label: 'OVERDUE', overdue: true };
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return { label: `${hours}h remaining`, overdue: false };
  const days = Math.floor(hours / 24);
  return { label: `${days}d ${hours % 24}h remaining`, overdue: false };
}

function InfoCard({ title, children }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}>
      <h2 style={{ fontSize: 10, fontWeight: 600, color: C.sectionHdr, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acking, setAcking] = useState(false);

  useEffect(() => { loadEvent(); }, [id]);

  async function loadEvent() {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/events/${id}`);
      setEvent(data);
      setError(null);
    } catch {
      setError('Failed to load event.');
    } finally {
      setLoading(false);
    }
  }

  function handleUpdate(updated) { setEvent(updated); }

  async function handleAcknowledge() {
    setAcking(true);
    try {
      const { data } = await apiClient.post(`/events/${id}/acknowledge`, {});
      setEvent(data);
    } catch { /* ignore for POC */ }
    finally { setAcking(false); }
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.pageBg }}>
        <div style={{ width: 32, height: 32, border: `4px solid ${C.spinRing}`, borderTopColor: C.spinHead, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{ flex: 1, background: C.pageBg, padding: 24 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ padding: '12px 16px', background: C.errorBg, border: `1px solid ${C.errorBdr}`, borderRadius: 8, fontSize: 12, color: C.errorTxt }}>
            {error || 'Event not found.'}
          </div>
          <button onClick={() => navigate('/queue')}
            style={{ marginTop: 16, fontSize: 12, color: C.linkTxt, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            ← Back to Queue
          </button>
        </div>
      </div>
    );
  }

  const stsSty = STATUS_STYLES[event.status] || { bg: '#EEF2F8', txt: '#4A6080' };
  const srcLabel = event.triggerSource || event.sourceSystem;
  const srcSty = SOURCE_STYLES[srcLabel] || { bg: '#EEF2F8', txt: '#4A6080' };
  const showClassification = !event.classification;
  const showDisposition = event.classification && !event.triageDecision;
  const showReadonly = event.classification && event.triageDecision;
  const deadlineInfo = event.escalation?.pssmAttestation
    ? timeUntilDeadline(event.escalation.pssmAttestation.deadline) : null;

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.pageBg, padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <button onClick={() => navigate('/queue')}
          style={{ fontSize: 12, color: C.linkTxt, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          ← Back to Queue
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
          <PriorityBadge score={event.priorityScore} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: C.cardTitle, margin: 0 }}>{event.type}</h1>
              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: srcSty.bg, color: srcSty.txt }}>
                {srcLabel}
              </span>
              {event.sentinel && (
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#991B1B', color: '#FFFFFF' }}>
                  SENTINEL
                </span>
              )}
              <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: stsSty.bg, color: stsSty.txt }}>
                {STATUS_LABELS[event.status] || event.status}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <HarmBadge level={event.harmLevel} />
              <span style={{ fontSize: 11, color: C.cardMeta }}>Occurred: {formatDate(event.occurredAt)}</span>
              <span style={{ fontSize: 11, color: C.cardMeta }}>Reported: {formatDate(event.reportedAt)}</span>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <InfoCard title="Event Narrative">
              <p style={{ fontSize: 13, color: C.cardTitle, lineHeight: 1.6, margin: 0 }}>{event.narrative}</p>
            </InfoCard>

            <InfoCard title="Patient Demographics">
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                {[
                  { label: 'MRN',      value: event.patient.mrn,      mono: true },
                  { label: 'Name',     value: event.patient.name },
                  { label: 'Age',      value: event.patient.age ?? '—' },
                  { label: 'Sex',      value: event.patient.sex },
                  { label: 'Race',     value: event.patient.race || '—' },
                  { label: 'Facility', value: event.patient.facility, span: 2 },
                ].map((item) => (
                  <div key={item.label} style={item.span ? { gridColumn: `span ${item.span}` } : {}}>
                    <dt style={{ fontSize: 10, color: C.cardMeta, marginBottom: 2 }}>{item.label}</dt>
                    <dd style={{ fontSize: 12, fontWeight: 500, color: C.cardTitle, fontFamily: item.mono ? 'monospace' : undefined, margin: 0 }}>
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </InfoCard>

            {event.encounter && (
              <InfoCard title="Encounter Context">
                <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  {[
                    { label: 'Encounter ID', value: event.encounter.id,   mono: true },
                    { label: 'Unit / Location', value: event.encounter.unit },
                    { label: 'Trigger ID',   value: event.triggerId,      mono: true },
                    { label: 'CF Code',      value: event.cfCode },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt style={{ fontSize: 10, color: C.cardMeta, marginBottom: 2 }}>{item.label}</dt>
                      <dd style={{ fontSize: 12, fontWeight: 500, color: C.cardTitle, fontFamily: item.mono ? 'monospace' : undefined, margin: 0 }}>
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </InfoCard>
            )}

            {event.contributingFactors?.length > 0 && (
              <InfoCard title="Contributing Factors">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {event.contributingFactors.map((f) => (
                    <span key={f} style={{ padding: '3px 9px', background: '#E3EEFF', color: '#1B3A6B', border: '1px solid #CBD5E8', fontSize: 11, borderRadius: 4 }}>
                      {f}
                    </span>
                  ))}
                </div>
              </InfoCard>
            )}

            {event.recommendedFollowUp?.length > 0 && (
              <InfoCard title="Recommended Follow-Up">
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {event.recommendedFollowUp.map((r) => (
                    <li key={r} style={{ fontSize: 12, color: C.cardBody, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: C.linkTxt, marginTop: 1 }}>›</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </InfoCard>
            )}
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {showClassification && <ClassificationPanel event={event} onUpdate={handleUpdate} />}
            {showDisposition    && <DispositionPanel    event={event} onUpdate={handleUpdate} />}

            {showReadonly && (
              <>
                <InfoCard title="✓ Classification">
                  <dl style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <dt style={{ fontSize: 10, color: C.cardMeta, marginBottom: 2 }}>Event Type</dt>
                      <dd style={{ fontSize: 13, fontWeight: 500, color: C.cardTitle, margin: 0 }}>{event.classification.eventType}</dd>
                    </div>
                    <div>
                      <dt style={{ fontSize: 10, color: C.cardMeta, marginBottom: 4 }}>Harm Level</dt>
                      <dd style={{ margin: 0 }}><HarmBadge level={event.classification.harmLevel} /></dd>
                    </div>
                    {event.classification.contributingFactors?.length > 0 && (
                      <div>
                        <dt style={{ fontSize: 10, color: C.cardMeta, marginBottom: 4 }}>Contributing Factors</dt>
                        <dd style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {event.classification.contributingFactors.map((f) => (
                            <span key={f} style={{ padding: '2px 8px', background: '#E3EEFF', color: '#1B3A6B', fontSize: 11, borderRadius: 4 }}>
                              {f}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt style={{ fontSize: 10, color: C.cardMeta, marginBottom: 2 }}>Classified At</dt>
                      <dd style={{ fontSize: 11, color: C.cardMeta, margin: 0 }}>{formatDate(event.classification.classifiedAt)}</dd>
                    </div>
                  </dl>
                </InfoCard>

                <InfoCard title="✓ Disposition">
                  <dl style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <dt style={{ fontSize: 10, color: C.cardMeta, marginBottom: 2 }}>Decision</dt>
                      <dd style={{ fontSize: 13, fontWeight: 500, color: C.cardTitle, textTransform: 'capitalize', margin: 0 }}>
                        {event.triageDecision.disposition.replace('_', ' ')}
                      </dd>
                    </div>
                    <div>
                      <dt style={{ fontSize: 10, color: C.cardMeta, marginBottom: 2 }}>Rationale</dt>
                      <dd style={{ fontSize: 13, color: C.cardTitle, margin: 0 }}>{event.triageDecision.rationale}</dd>
                    </div>
                    <div>
                      <dt style={{ fontSize: 10, color: C.cardMeta, marginBottom: 2 }}>Decided At</dt>
                      <dd style={{ fontSize: 11, color: C.cardMeta, margin: 0 }}>{formatDate(event.triageDecision.decidedAt)}</dd>
                    </div>
                  </dl>
                </InfoCard>
              </>
            )}

            {event.status === 'escalated' && event.escalation && (
              <div style={{ background: C.escalBg, border: `1px solid ${C.escalBdr}`, borderRadius: 10, padding: 20 }}>
                <h2 style={{ fontSize: 10, fontWeight: 600, color: C.escalTitle, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ⚠️ PSSM Escalation
                </h2>
                <dl style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <dt style={{ fontSize: 10, color: C.escalLabel, marginBottom: 2 }}>Escalated At</dt>
                    <dd style={{ fontSize: 13, fontWeight: 500, color: C.escalBody, margin: 0 }}>{formatDate(event.escalation.escalatedAt)}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 10, color: C.escalLabel, marginBottom: 2 }}>Channel</dt>
                    <dd style={{ fontSize: 13, color: C.escalBody, margin: 0 }}>{event.escalation.channel}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 10, color: C.escalLabel, marginBottom: 4 }}>Recipients</dt>
                    <dd style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {event.escalation.recipients.map((r, i) => (
                        <div key={i} style={{ fontSize: 11, color: C.escalBody }}>{r.name} ({r.role})</div>
                      ))}
                    </dd>
                  </div>
                  {event.escalation.pssmAttestation && (
                    <>
                      <div>
                        <dt style={{ fontSize: 10, color: C.escalLabel, marginBottom: 2 }}>PSSM Deadline</dt>
                        <dd style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: C.escalBody }}>
                            {formatDate(event.escalation.pssmAttestation.deadline)}
                          </span>
                          {deadlineInfo && (
                            <span style={{
                              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                              background: deadlineInfo.overdue ? '#991B1B' : '#FEF3C7',
                              color: deadlineInfo.overdue ? '#FFFFFF' : '#92400E',
                            }}>
                              {deadlineInfo.label}
                            </span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt style={{ fontSize: 10, color: C.escalLabel, marginBottom: 4 }}>Attestation Status</dt>
                        <dd style={{ margin: 0 }}>
                          <span style={{
                            padding: '3px 9px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            background: event.escalation.pssmAttestation.status === 'acknowledged' ? '#DCFCE7' : '#FEF3C7',
                            color: event.escalation.pssmAttestation.status === 'acknowledged' ? '#15803D' : '#92400E',
                          }}>
                            {event.escalation.pssmAttestation.status === 'acknowledged' ? 'Acknowledged' : 'Pending Acknowledgment'}
                          </span>
                        </dd>
                      </div>
                    </>
                  )}
                </dl>

                {event.escalation.pssmAttestation && !event.escalation.pssmAttestation.ackTimestamp && (
                  <button
                    onClick={handleAcknowledge}
                    disabled={acking}
                    style={{
                      marginTop: 16, width: '100%', background: acking ? '#FECACA' : '#991B1B',
                      color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 600,
                      padding: '10px 16px', borderRadius: 8, cursor: acking ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    {acking ? 'Processing...' : 'Acknowledge Escalation'}
                  </button>
                )}

                {event.escalation.pssmAttestation?.ackTimestamp && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: C.ackBg, border: `1px solid ${C.ackBdr}`, borderRadius: 6, fontSize: 11, color: C.ackTxt }}>
                    Acknowledged at {formatDate(event.escalation.pssmAttestation.ackTimestamp)}
                    {event.escalation.pssmAttestation.ackedBy && (
                      <span style={{ marginLeft: 4 }}>by {event.escalation.pssmAttestation.ackedBy}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
