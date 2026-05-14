import React, { useState } from 'react';
import apiClient from '../api/client';
import EscalationModal from './EscalationModal';

const DISPOSITIONS = [
  {
    value: 'close',
    label: 'Close',
    description: 'No further action required',
    icon: '✓',
    color: 'border-green-500 bg-green-50 text-green-700',
    activeColor: 'border-green-500 bg-green-600 text-white',
  },
  {
    value: 'monitor',
    label: 'Monitor',
    description: 'Flag for follow-up review',
    icon: '👁',
    color: 'border-blue-400 bg-blue-50 text-blue-700',
    activeColor: 'border-blue-500 bg-blue-600 text-white',
  },
  {
    value: 'escalate',
    label: 'Escalate',
    description: 'Serious event — notify leadership',
    icon: '⚠',
    color: 'border-red-400 bg-red-50 text-red-700',
    activeColor: 'border-red-500 bg-red-600 text-white',
  },
  {
    value: 'route_investigation',
    label: 'Route to Investigation',
    description: 'Initiate RCA process',
    icon: '🔍',
    color: 'border-orange-400 bg-orange-50 text-orange-700',
    activeColor: 'border-orange-500 bg-orange-600 text-white',
  },
];

export default function DispositionPanel({ event, onUpdate }) {
  const [selected, setSelected] = useState('');
  const [rationale, setRationale] = useState('');
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleSelect(value) {
    setSelected(value);
    if (value === 'escalate') {
      setShowEscalationModal(true);
    }
  }

  async function handleSave() {
    if (!selected) {
      setError('Please choose a disposition.');
      return;
    }
    if (!rationale.trim()) {
      setError('Please provide a rationale.');
      return;
    }
    if (selected === 'escalate') {
      setShowEscalationModal(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await apiClient.post(`/events/${event.id}/disposition`, {
        disposition: selected,
        rationale: rationale.trim(),
      });
      onUpdate(data);
    } catch (err) {
      setError('Failed to save disposition. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleEscalated(updatedEvent) {
    onUpdate(updatedEvent);
  }

  return (
    <>
      {showEscalationModal && (
        <EscalationModal
          event={event}
          onClose={() => setShowEscalationModal(false)}
          onEscalated={handleEscalated}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-indigo-600">📤</span>
          Triage Disposition
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          {DISPOSITIONS.map((d) => {
            const isActive = selected === d.value;
            return (
              <button
                key={d.value}
                onClick={() => handleSelect(d.value)}
                className={`flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left ${
                  isActive ? d.activeColor : `${d.color} hover:opacity-80`
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{d.icon}</span>
                  <span className="text-sm font-semibold">{d.label}</span>
                </div>
                <span className={`text-xs ${isActive ? 'opacity-90' : 'opacity-70'}`}>
                  {d.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Rationale <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={3}
            placeholder="Document your clinical reasoning for this disposition..."
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || selected === 'escalate'}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
        >
          {saving ? 'Saving...' : selected === 'escalate' ? 'Use Escalation Modal above' : 'Save Disposition'}
        </button>
      </div>
    </>
  );
}
