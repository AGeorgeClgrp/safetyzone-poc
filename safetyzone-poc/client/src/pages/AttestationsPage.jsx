import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';

function getAttestationStatus(escalation) {
  if (!escalation || !escalation.pssmAttestation) return null;
  const att = escalation.pssmAttestation;
  if (att.ackTimestamp) return 'acknowledged';
  if (new Date(att.deadline) < new Date()) return 'overdue';
  return 'pending';
}

const STATUS_CONFIG = {
  acknowledged: {
    label: 'Acknowledged',
    class: 'bg-green-100 text-green-700 border border-green-200',
  },
  pending: {
    label: 'Pending',
    class: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  },
  overdue: {
    label: 'OVERDUE',
    class: 'bg-red-100 text-red-700 border border-red-300 font-bold',
  },
};

const SEVERITY_STYLES = {
  serious: 'bg-red-100 text-red-700',
  moderate: 'bg-orange-100 text-orange-700',
  minor: 'bg-yellow-100 text-yellow-700',
  near_miss: 'bg-blue-100 text-blue-700',
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

export default function AttestationsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const { data } = await apiClient.get('/events');
      const escalated = data.filter((e) => e.status === 'escalated' && e.escalation);
      setEvents(escalated);
    } catch {
      setError('Failed to load attestation records.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">PSSM Attestations</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          CMS PSSM Domain 1 — Escalation and Acknowledgment Records
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-slate-400 text-sm">Loading attestations...</div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <p className="text-slate-500 text-sm font-medium">No escalations recorded yet.</p>
            <p className="text-slate-400 text-xs mt-1">
              PSSM attestation records will appear here after events are escalated.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Event ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Event Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Escalated At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    PSSM Deadline
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Acknowledged At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, idx) => {
                  const status = getAttestationStatus(event.escalation);
                  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                  const sevClass = SEVERITY_STYLES[event.severity] || 'bg-slate-100 text-slate-600';
                  const att = event.escalation.pssmAttestation;

                  return (
                    <tr
                      key={event.id}
                      className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {event.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 text-xs">
                        {event.type}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${sevClass}`}
                        >
                          {event.severity.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(event.escalation.escalatedAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {att ? formatDate(att.deadline) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {att && att.ackTimestamp ? formatDate(att.ackTimestamp) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${cfg.class}`}>
                          {cfg.label}
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
  );
}
