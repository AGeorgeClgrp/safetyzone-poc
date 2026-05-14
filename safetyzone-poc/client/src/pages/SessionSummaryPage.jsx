import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

const DISPOSITION_CONFIG = {
  close: { label: 'Closed', color: 'bg-green-500' },
  monitor: { label: 'Monitoring', color: 'bg-cyan-500' },
  escalate: { label: 'Escalated', color: 'bg-red-500' },
  route_investigation: { label: 'Under Investigation', color: 'bg-amber-500' },
};

export default function SessionSummaryPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

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

  function handleDownload() {
    alert('PDF export coming soon.');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-400 text-sm">Loading summary...</div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error || 'No summary available.'}
        </div>
      </div>
    );
  }

  const totalDispositions = Object.values(summary.dispositions).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Session Summary</h1>
        <p className="text-sm text-slate-500 mt-0.5">Review of current triage session activity</p>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-center">
          <div className="text-3xl font-bold text-indigo-600">{summary.totalReviewed}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Events Reviewed</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{summary.escalationsCount}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Escalations</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-center">
          <div className="text-3xl font-bold text-amber-600">
            {summary.openAcknowledgments.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Open Acks</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-center">
          <div
            className={`text-3xl font-bold ${
              summary.overduePssm.length > 0 ? 'text-red-700' : 'text-green-600'
            }`}
          >
            {summary.overduePssm.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Overdue PSSM</div>
        </div>
      </div>

      {/* Dispositions breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
          Dispositions Breakdown
        </h2>
        {totalDispositions === 0 ? (
          <p className="text-sm text-slate-500">No dispositions have been set yet.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(DISPOSITION_CONFIG).map(([key, cfg]) => {
              const count = summary.dispositions[key] || 0;
              const pct = totalDispositions > 0 ? Math.round((count / totalDispositions) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{cfg.label}</span>
                    <span className="text-slate-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cfg.color} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Open acknowledgments */}
      {summary.openAcknowledgments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-4">
          <h2 className="text-sm font-semibold text-amber-800 mb-3 uppercase tracking-wide">
            Open Acknowledgments
          </h2>
          <ul className="space-y-2">
            {summary.openAcknowledgments.map((item) => (
              <li key={item.eventId} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-amber-900">{item.eventType}</span>
                  <span className="text-amber-700 text-xs ml-2 font-mono">
                    {item.eventId.slice(0, 8)}…
                  </span>
                </div>
                <div className="text-xs text-amber-700">
                  Deadline: {new Date(item.deadline).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Overdue PSSM */}
      {summary.overduePssm.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-5 mb-4">
          <h2 className="text-sm font-semibold text-red-800 mb-3 uppercase tracking-wide">
            Overdue PSSM Attestations
          </h2>
          <ul className="space-y-2">
            {summary.overduePssm.map((item) => (
              <li key={item.eventId} className="text-sm text-red-900">
                <span className="font-medium">{item.eventType}</span>
                <span className="text-red-700 text-xs ml-2">
                  — Deadline was {new Date(item.deadline).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PSSM link */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-900">PSSM Attestations</p>
          <p className="text-xs text-indigo-600">
            View all escalation and attestation records
          </p>
        </div>
        <Link
          to="/attestations"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          View Attestations
        </Link>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/queue')}
          className="flex-1 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Return to Queue
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Download Report
        </button>
      </div>
    </div>
  );
}
