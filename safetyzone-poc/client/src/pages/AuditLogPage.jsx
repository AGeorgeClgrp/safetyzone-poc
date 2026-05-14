import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';

const ACTION_LABELS = {
  event_opened: 'Opened Event',
  event_classified: 'Classified Event',
  disposition_set: 'Set Disposition',
  event_escalated: 'Escalated Event',
  escalation_acknowledged: 'Acknowledged Escalation',
  session_start: 'Session Started',
  session_end: 'Session Ended',
};

const ACTION_COLORS = {
  event_opened: 'bg-slate-100 text-slate-700',
  event_classified: 'bg-purple-100 text-purple-700',
  disposition_set: 'bg-blue-100 text-blue-700',
  event_escalated: 'bg-red-100 text-red-700',
  escalation_acknowledged: 'bg-green-100 text-green-700',
  session_start: 'bg-indigo-100 text-indigo-700',
  session_end: 'bg-indigo-100 text-indigo-700',
};

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AuditLogPage() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    loadAudit();
  }, []);

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

  const filtered =
    actionFilter === 'all' ? log : log.filter((e) => e.action === actionFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Complete record of all actions taken in this session
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium text-slate-700">Filter by action:</label>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {allActions.map((action) => (
            <option key={action} value={action}>
              {action === 'all' ? 'All Actions' : ACTION_LABELS[action] || action}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{filtered.length} entries</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-slate-400 text-sm">Loading audit log...</div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-slate-500 text-sm">No audit entries yet. Start reviewing events.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, idx) => {
                  const actionLabel = ACTION_LABELS[entry.action] || entry.action;
                  const actionColor = ACTION_COLORS[entry.action] || 'bg-slate-100 text-slate-600';
                  return (
                    <tr
                      key={entry.id || idx}
                      className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 text-xs">{entry.userName}</div>
                        <div className="text-slate-400 text-xs">{entry.userRole}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${actionColor}`}
                        >
                          {actionLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {entry.resourceType}
                        {entry.resourceRef && (
                          <div className="font-mono text-xs text-slate-400 truncate max-w-xs">
                            {entry.resourceRef.slice(0, 8)}…
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-sm">
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
  );
}
