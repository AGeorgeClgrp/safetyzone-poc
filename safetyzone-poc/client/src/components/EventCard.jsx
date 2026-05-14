import React from 'react';
import { useNavigate } from 'react-router-dom';
import PriorityBadge from './PriorityBadge';

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SEVERITY_STYLES = {
  serious:   { bg: '#1B3A6B', txt: '#BAD4FF', bdr: '#1E5FAD' },
  moderate:  { bg: '#1E5FAD', txt: '#FFFFFF',  bdr: '#1565C0' },
  minor:     { bg: '#E3EEFF', txt: '#1B3A6B',  bdr: '#CBD5E8' },
  near_miss: { bg: '#EEF2F8', txt: '#4A6080',  bdr: '#CBD5E8' },
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

const SOURCE_STYLES = {
  'IHI GTT':          { bg: '#E3EEFF', txt: '#1B3A6B' },
  'CMS HAC':          { bg: '#E3EEFF', txt: '#0288D1' },
  'NQF SRE':          { bg: '#E3EEFF', txt: '#1565C0' },
  'Joint Commission': { bg: '#DBEAFE', txt: '#0277BD' },
  'TJC Sentinel':     { bg: '#FEE2E2', txt: '#991B1B' },
};

const SEVERITY_LABELS = {
  serious: 'Serious', moderate: 'Moderate', minor: 'Minor', near_miss: 'Near Miss',
};
const STATUS_LABELS = {
  queued: 'Queued', in_review: 'In Review', classified: 'Classified',
  closed: 'Closed', monitoring: 'Monitoring', escalated: 'Escalated',
  under_investigation: 'Under Investigation',
};

export default function EventCard({ event, selected = false, onToggle }) {
  const navigate = useNavigate();
  const sourceLabel = event.triggerSource || event.sourceSystem;
  const sevSty = SEVERITY_STYLES[event.severity] || { bg: '#EEF2F8', txt: '#4A6080', bdr: '#CBD5E8' };
  const stsSty = STATUS_STYLES[event.status]    || { bg: '#EEF2F8', txt: '#4A6080' };
  const srcSty = SOURCE_STYLES[sourceLabel]     || { bg: '#EEF2F8', txt: '#4A6080' };

  return (
    <div
      onClick={() => navigate(`/events/${event.id}`)}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = '#1E5FAD'; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = '#CBD5E8'; }}
      style={{
        background: selected ? '#EEF2F8' : '#FFFFFF',
        border: `1px solid ${selected ? '#1E5FAD' : '#CBD5E8'}`,
        borderRadius: 10,
        padding: 16,
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(10,22,40,0.06)',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {onToggle && (
          <input
            type="checkbox"
            checked={selected}
            onClick={(e) => { e.stopPropagation(); onToggle(event.id); }}
            onChange={() => {}}
            style={{ marginTop: 2, flexShrink: 0 }}
          />
        )}
        <div style={{ flexShrink: 0 }}>
          <PriorityBadge score={event.priorityScore} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0A1628', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.type}
            </h3>
            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: srcSty.bg, color: srcSty.txt }}>
              {sourceLabel}
            </span>
            {event.sentinel && (
              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#991B1B', color: '#FFFFFF' }}>
                SENTINEL
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: '#7A92B0', marginBottom: 8 }}>
            MRN: <span style={{ fontFamily: 'monospace' }}>{event.patient.mrn}</span>
            {event.patient.facility && <span style={{ marginLeft: 8 }}>· {event.patient.facility}</span>}
            {event.encounter && <span style={{ marginLeft: 8 }}>· {event.encounter.unit}</span>}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: sevSty.bg, color: sevSty.txt, border: `1px solid ${sevSty.bdr}` }}>
              {SEVERITY_LABELS[event.severity] || event.severity}
            </span>
            <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: stsSty.bg, color: stsSty.txt }}>
              {STATUS_LABELS[event.status] || event.status}
            </span>
            {event.harmLevel && (
              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: '#EEF2F8', color: '#4A6080' }}>
                Harm {event.harmLevel}
              </span>
            )}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <span style={{ fontSize: 11, color: '#7A92B0' }}>{timeAgo(event.occurredAt)}</span>
        </div>
      </div>
    </div>
  );
}
