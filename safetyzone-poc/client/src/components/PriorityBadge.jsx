import React from 'react';

export default function PriorityBadge({ score }) {
  let colorClass = '';
  if (score >= 80) {
    colorClass = 'bg-red-600 text-white';
  } else if (score >= 60) {
    colorClass = 'bg-orange-500 text-white';
  } else if (score >= 40) {
    colorClass = 'bg-yellow-400 text-slate-900';
  } else {
    colorClass = 'bg-green-500 text-white';
  }

  return (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${colorClass}`}>
      {score}
    </span>
  );
}
