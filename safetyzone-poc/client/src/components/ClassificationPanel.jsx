import React, { useState } from 'react';
import apiClient from '../api/client';

const EVENT_TYPES = [
  'Medication Error',
  'Fall',
  'Near Miss — Wrong Patient',
  'Pressure Injury',
  'Diagnostic Delay',
  'Communication Failure',
  'Equipment Failure',
  'Elopement',
  'Surgical Complication',
  'Restraint Violation',
  'Specimen Error',
];

const HARM_LEVELS = [
  { value: 'A', label: 'A — No Error' },
  { value: 'B', label: 'B — Error, no harm' },
  { value: 'C', label: 'C — Error, increased monitoring required' },
  { value: 'D', label: 'D — Error, required intervention' },
  { value: 'E', label: 'E — Temporary harm requiring treatment' },
  { value: 'F', label: 'F — Temporary harm requiring hospitalization' },
  { value: 'G', label: 'G — Permanent harm' },
  { value: 'H', label: 'H — Near-death event' },
  { value: 'I', label: 'I — Death' },
];

const CONTRIBUTING_FACTORS = [
  'Communication',
  'Training/Competency',
  'Environment/Equipment',
  'Protocol Deviation',
  'Staffing/Fatigue',
  'Documentation',
  'Handoff Failure',
];

export default function ClassificationPanel({ event, onUpdate }) {
  const [eventType, setEventType] = useState(event.type || '');
  const [harmLevel, setHarmLevel] = useState(event.harmLevel || '');
  const [factors, setFactors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function toggleFactor(factor) {
    setFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    );
  }

  async function handleSave() {
    if (!eventType || !harmLevel) {
      setError('Please select an Event Type and Harm Level.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await apiClient.patch(`/events/${event.id}/classify`, {
        eventType,
        harmLevel,
        contributingFactors: factors,
      });
      onUpdate(data);
    } catch (err) {
      setError('Failed to save classification. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
      <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <span className="text-indigo-600">📋</span>
        Event Classification
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Event Type <span className="text-red-500">*</span>
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Select event type --</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Harm Level */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            NCC MERP Harm Level <span className="text-red-500">*</span>
          </label>
          <select
            value={harmLevel}
            onChange={(e) => setHarmLevel(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Select harm level --</option>
            {HARM_LEVELS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        {/* Contributing Factors */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Contributing Factors (select all that apply)
          </label>
          <div className="grid grid-cols-1 gap-2">
            {CONTRIBUTING_FACTORS.map((factor) => (
              <label key={factor} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={factors.includes(factor)}
                  onChange={() => toggleFactor(factor)}
                  className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">{factor}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
        >
          {saving ? 'Saving...' : 'Save Classification'}
        </button>
      </div>
    </div>
  );
}
