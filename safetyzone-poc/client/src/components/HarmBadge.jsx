import React from 'react';

const HARM_LABELS = {
  A: 'A — No Error',
  B: 'B — No Harm',
  C: 'C — Monitoring',
  D: 'D — Intervention',
  E: 'E — Temp Harm',
  F: 'F — Hospitalization',
  G: 'G — Permanent Harm',
  H: 'H — Near Death',
  I: 'I — Death',
};

const HARM_COLORS = {
  A: 'bg-slate-100 text-slate-600',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-yellow-200 text-yellow-800',
  E: 'bg-orange-100 text-orange-700',
  F: 'bg-orange-200 text-orange-800',
  G: 'bg-red-200 text-red-800',
  H: 'bg-red-600 text-white',
  I: 'bg-red-900 text-white',
};

export default function HarmBadge({ level }) {
  if (!level) return null;
  const label = HARM_LABELS[level] || `Level ${level}`;
  const color = HARM_COLORS[level] || 'bg-slate-100 text-slate-600';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      NCC MERP {label}
    </span>
  );
}
