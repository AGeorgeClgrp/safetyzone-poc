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
  serious: 'bg-red-100 text-red-700 border border-red-200',
  moderate: 'bg-orange-100 text-orange-700 border border-orange-200',
  minor: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  near_miss: 'bg-blue-100 text-blue-700 border border-blue-200',
};

const SEVERITY_LABELS = {
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
  near_miss: 'Near Miss',
};

const STATUS_STYLES = {
  queued: 'bg-slate-200 text-slate-700',
  in_review: 'bg-indigo-100 text-indigo-700',
  classified: 'bg-purple-100 text-purple-700',
  closed: 'bg-green-100 text-green-700',
  monitoring: 'bg-cyan-100 text-cyan-700',
  escalated: 'bg-red-100 text-red-700',
  under_investigation: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS = {
  queued: 'Queued',
  in_review: 'In Review',
  classified: 'Classified',
  closed: 'Closed',
  monitoring: 'Monitoring',
  escalated: 'Escalated',
  under_investigation: 'Under Investigation',
};

const SOURCE_STYLES = {
  'IHI GTT': 'bg-indigo-50 text-indigo-600',
  'CMS HAC': 'bg-teal-50 text-teal-600',
  'NQF SRE': 'bg-violet-50 text-violet-600',
  'Joint Commission': 'bg-amber-50 text-amber-600',
  'TJC Sentinel': 'bg-red-50 text-red-600',
};

export default function EventCard({ event, selected = false, onToggle }) {
  const navigate = useNavigate();

  const severityClass = SEVERITY_STYLES[event.severity] || 'bg-slate-100 text-slate-600';
  const severityLabel = SEVERITY_LABELS[event.severity] || event.severity;
  const statusClass = STATUS_STYLES[event.status] || 'bg-slate-100 text-slate-600';
  const statusLabel = STATUS_LABELS[event.status] || event.status;
  const sourceLabel = event.triggerSource || event.sourceSystem;
  const sourceClass = SOURCE_STYLES[sourceLabel] || 'bg-slate-50 text-slate-600';

  return (
    <div
      onClick={() => navigate(`/events/${event.id}`)}
      className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-all ${
        selected ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'
      }`}
    >
      <div className="flex items-start gap-4">
        {onToggle && (
          <input
            type="checkbox"
            checked={selected}
            onClick={(e) => { e.stopPropagation(); onToggle(event.id); }}
            onChange={() => {}}
            className="mt-0.5 flex-shrink-0 accent-indigo-600"
          />
        )}
        <div className="flex-shrink-0">
          <PriorityBadge score={event.priorityScore} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-slate-900 truncate">{event.type}</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${sourceClass}`}>
              {sourceLabel}
            </span>
            {event.sentinel && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">SENTINEL</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-2">
            MRN: <span className="font-mono">{event.patient.mrn}</span>
            {event.patient.facility && (
              <span className="ml-2 text-slate-400">· {event.patient.facility}</span>
            )}
            {event.encounter && (
              <span className="ml-2 text-slate-400">· {event.encounter.unit}</span>
            )}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityClass}`}>
              {severityLabel}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
            {event.harmLevel && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                Harm {event.harmLevel}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-xs text-slate-400">{timeAgo(event.occurredAt)}</span>
        </div>
      </div>
    </div>
  );
}
