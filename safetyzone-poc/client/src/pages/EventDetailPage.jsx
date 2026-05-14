import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import ClassificationPanel from '../components/ClassificationPanel';
import DispositionPanel from '../components/DispositionPanel';
import HarmBadge from '../components/HarmBadge';
import PriorityBadge from '../components/PriorityBadge';

const STATUS_LABELS = {
  queued: 'Queued',
  in_review: 'In Review',
  classified: 'Classified',
  closed: 'Closed',
  monitoring: 'Monitoring',
  escalated: 'Escalated',
  under_investigation: 'Under Investigation',
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

const SOURCE_STYLES = {
  'IHI GTT': 'bg-indigo-100 text-indigo-700',
  'CMS HAC': 'bg-teal-100 text-teal-700',
  'NQF SRE': 'bg-violet-100 text-violet-700',
  'Joint Commission': 'bg-amber-100 text-amber-700',
  'TJC Sentinel': 'bg-red-100 text-red-700',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acking, setAcking] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  async function loadEvent() {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/events/${id}`);
      setEvent(data);
      setError(null);
    } catch (err) {
      setError('Failed to load event.');
    } finally {
      setLoading(false);
    }
  }

  function handleUpdate(updated) {
    setEvent(updated);
  }

  async function handleAcknowledge() {
    setAcking(true);
    try {
      const { data } = await apiClient.post(`/events/${id}/acknowledge`, {});
      setEvent(data);
    } catch {
      // ignore for POC
    } finally {
      setAcking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-400 text-sm">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error || 'Event not found.'}
        </div>
        <button
          onClick={() => navigate('/queue')}
          className="mt-4 text-sm text-indigo-600 hover:underline"
        >
          ← Back to Queue
        </button>
      </div>
    );
  }

  const statusClass = STATUS_STYLES[event.status] || 'bg-slate-100 text-slate-600';
  const statusLabel = STATUS_LABELS[event.status] || event.status;
  const sourceLabel = event.triggerSource || event.sourceSystem;
  const sourceClass = SOURCE_STYLES[sourceLabel] || 'bg-slate-100 text-slate-600';

  const showClassification = !event.classification;
  const showDisposition = event.classification && !event.triageDecision;
  const showReadonly = event.classification && event.triageDecision;

  const deadlineInfo =
    event.escalation && event.escalation.pssmAttestation
      ? timeUntilDeadline(event.escalation.pssmAttestation.deadline)
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/queue')}
        className="text-sm text-indigo-600 hover:underline mb-4 inline-flex items-center gap-1"
      >
        ← Back to Queue
      </button>

      {/* Page header */}
      <div className="flex items-start gap-4 mb-6">
        <PriorityBadge score={event.priorityScore} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-bold text-slate-900">{event.type}</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${sourceClass}`}>
              {sourceLabel}
            </span>
            {event.sentinel && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">SENTINEL</span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <HarmBadge level={event.harmLevel} />
            <span className="text-xs text-slate-500">
              Occurred: {formatDate(event.occurredAt)}
            </span>
            <span className="text-xs text-slate-500">
              Reported: {formatDate(event.reportedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Narrative */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
              Event Narrative
            </h2>
            <p className="text-sm text-slate-800 leading-relaxed">{event.narrative}</p>
          </div>

          {/* Patient demographics */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
              Patient Demographics
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-slate-500 text-xs">MRN</dt>
                <dd className="font-mono font-medium text-slate-900">{event.patient.mrn}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Name</dt>
                <dd className="font-medium text-slate-900">{event.patient.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Age</dt>
                <dd className="text-slate-900">{event.patient.age ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Sex</dt>
                <dd className="text-slate-900">{event.patient.sex}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Race</dt>
                <dd className="text-slate-900">{event.patient.race || '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500 text-xs">Facility</dt>
                <dd className="text-slate-900">{event.patient.facility}</dd>
              </div>
            </dl>
          </div>

          {/* Encounter */}
          {event.encounter && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                Encounter Context
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-slate-500 text-xs">Encounter ID</dt>
                  <dd className="font-mono text-xs text-slate-900">{event.encounter.id}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Unit / Location</dt>
                  <dd className="text-slate-900">{event.encounter.unit}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Trigger ID</dt>
                  <dd className="font-mono text-xs text-slate-900">{event.triggerId}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">CF Code</dt>
                  <dd className="text-slate-900">{event.cfCode}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Contributing factors from DB */}
          {event.contributingFactors && event.contributingFactors.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                Contributing Factors
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {event.contributingFactors.map((f) => (
                  <span key={f} className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs rounded">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended follow-up from DB */}
          {event.recommendedFollowUp && event.recommendedFollowUp.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                Recommended Follow-Up
              </h2>
              <ul className="space-y-1">
                {event.recommendedFollowUp.map((r) => (
                  <li key={r} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">›</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Classification panel */}
          {showClassification && (
            <ClassificationPanel event={event} onUpdate={handleUpdate} />
          )}

          {/* Disposition panel */}
          {showDisposition && (
            <DispositionPanel event={event} onUpdate={handleUpdate} />
          )}

          {/* Read-only summary */}
          {showReadonly && (
            <>
              {/* Classification summary */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Classification
                </h2>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-slate-500 text-xs">Event Type</dt>
                    <dd className="font-medium text-slate-900">{event.classification.eventType}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs">Harm Level</dt>
                    <dd>
                      <HarmBadge level={event.classification.harmLevel} />
                    </dd>
                  </div>
                  {event.classification.contributingFactors &&
                    event.classification.contributingFactors.length > 0 && (
                      <div>
                        <dt className="text-slate-500 text-xs mb-1">Contributing Factors</dt>
                        <dd className="flex flex-wrap gap-1">
                          {event.classification.contributingFactors.map((f) => (
                            <span
                              key={f}
                              className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                            >
                              {f}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                  <div>
                    <dt className="text-slate-500 text-xs">Classified At</dt>
                    <dd className="text-slate-600 text-xs">{formatDate(event.classification.classifiedAt)}</dd>
                  </div>
                </dl>
              </div>

              {/* Disposition summary */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Disposition
                </h2>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-slate-500 text-xs">Decision</dt>
                    <dd className="font-medium text-slate-900 capitalize">
                      {event.triageDecision.disposition.replace('_', ' ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs">Rationale</dt>
                    <dd className="text-slate-800">{event.triageDecision.rationale}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs">Decided At</dt>
                    <dd className="text-slate-600 text-xs">{formatDate(event.triageDecision.decidedAt)}</dd>
                  </div>
                </dl>
              </div>
            </>
          )}

          {/* Escalation details */}
          {event.status === 'escalated' && event.escalation && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-red-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                <span>⚠️</span>
                PSSM Escalation
              </h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-red-600 text-xs">Escalated At</dt>
                  <dd className="text-red-900 font-medium">
                    {formatDate(event.escalation.escalatedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-red-600 text-xs">Channel</dt>
                  <dd className="text-red-900">{event.escalation.channel}</dd>
                </div>
                <div>
                  <dt className="text-red-600 text-xs">Recipients</dt>
                  <dd className="space-y-0.5">
                    {event.escalation.recipients.map((r, i) => (
                      <div key={i} className="text-red-800 text-xs">
                        {r.name} ({r.role})
                      </div>
                    ))}
                  </dd>
                </div>

                {event.escalation.pssmAttestation && (
                  <>
                    <div>
                      <dt className="text-red-600 text-xs">PSSM Deadline</dt>
                      <dd className="flex items-center gap-2">
                        <span className="text-red-900 font-medium text-xs">
                          {formatDate(event.escalation.pssmAttestation.deadline)}
                        </span>
                        {deadlineInfo && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              deadlineInfo.overdue
                                ? 'bg-red-600 text-white'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {deadlineInfo.label}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-red-600 text-xs">Attestation Status</dt>
                      <dd>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            event.escalation.pssmAttestation.status === 'acknowledged'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {event.escalation.pssmAttestation.status === 'acknowledged'
                            ? 'Acknowledged'
                            : 'Pending Acknowledgment'}
                        </span>
                      </dd>
                    </div>
                  </>
                )}
              </dl>

              {event.escalation.pssmAttestation &&
                !event.escalation.pssmAttestation.ackTimestamp && (
                  <button
                    onClick={handleAcknowledge}
                    disabled={acking}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {acking ? 'Processing...' : 'Acknowledge Escalation'}
                  </button>
                )}

              {event.escalation.pssmAttestation &&
                event.escalation.pssmAttestation.ackTimestamp && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    Acknowledged at {formatDate(event.escalation.pssmAttestation.ackTimestamp)}
                    {event.escalation.pssmAttestation.ackedBy && (
                      <span className="ml-1">by {event.escalation.pssmAttestation.ackedBy}</span>
                    )}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
