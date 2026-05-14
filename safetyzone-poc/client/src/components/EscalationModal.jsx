import React, { useState } from 'react';
import apiClient from '../api/client';

const DEFAULT_RECIPIENTS = [
  { name: 'Dr. Sarah Mitchell', role: 'CMO', email: 'smitchell@hospital.org', checked: true },
  { name: 'Michael Torres', role: 'CNO', email: 'mtorres@hospital.org', checked: true },
  { name: 'Board Safety Committee', role: 'Board', email: 'boardsafety@hospital.org', checked: true },
];

function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      added++;
    }
  }
  return result;
}

export default function EscalationModal({ event, onClose, onEscalated }) {
  const [recipients, setRecipients] = useState(DEFAULT_RECIPIENTS);
  const [channel, setChannel] = useState('Email');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const deadline = addBusinessDays(new Date(), 3);
  const deadlineStr = deadline.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  function toggleRecipient(index) {
    setRecipients((prev) =>
      prev.map((r, i) => (i === index ? { ...r, checked: !r.checked } : r))
    );
  }

  async function handleSend() {
    const selected = recipients.filter((r) => r.checked).map(({ checked, ...r }) => r);
    if (selected.length === 0) {
      setError('Please select at least one recipient.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await apiClient.post(`/events/${event.id}/escalate`, {
        recipients: selected,
        channel,
      });
      onEscalated(data);
      onClose();
    } catch (err) {
      setError('Failed to send escalation. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              CMS PSSM Domain 1 Escalation
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Warning banner */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800 font-medium">
              This action notifies C-suite and board. A PSSM attestation record will be created.
            </p>
          </div>

          {/* PSSM deadline */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">3-business-day PSSM deadline:</span>{' '}
              {deadlineStr}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notification Recipients
            </label>
            <div className="space-y-2 border border-slate-200 rounded-md p-3 bg-slate-50">
              {recipients.map((r, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={r.checked}
                    onChange={() => toggleRecipient(i)}
                    className="h-4 w-4 text-indigo-600 border-slate-300 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-900">{r.name}</span>
                    <span className="text-xs text-slate-500 ml-1">({r.role})</span>
                    <div className="text-xs text-slate-400">{r.email}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Channel */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notification Channel
            </label>
            <div className="flex gap-3">
              {['Email', 'Secure Message'].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
                    channel === ch
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 text-sm font-medium py-2 px-4 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={saving}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
          >
            {saving ? 'Sending...' : 'Send Escalation'}
          </button>
        </div>
      </div>
    </div>
  );
}
