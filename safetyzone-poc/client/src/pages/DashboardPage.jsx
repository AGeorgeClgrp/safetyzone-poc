import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

// ── Module definitions ────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'queue',
    title: 'Patient Safety Events',
    description: 'Review, triage, assign, and manage open patient safety event reports.',
    href: '/queue',
    accent: 'border-blue-500',
    iconBg: 'bg-blue-50',
    badge: { label: 'REVIEWER', color: 'bg-emerald-100 text-emerald-700' },
    external: false,
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'vrm',
    title: 'Virtual Risk Manager',
    description: 'AI-powered triage agent for overnight event batch processing and analysis.',
    href: '/vrm',
    accent: 'border-indigo-500',
    iconBg: 'bg-indigo-50',
    badge: { label: 'AI', color: 'bg-blue-100 text-blue-700' },
    external: false,
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
      </svg>
    ),
  },
  {
    id: 'compliance',
    title: 'Compliance & Audit Readiness',
    description: 'Track regulatory deadlines, audit checklists, and submission status.',
    href: '/compliance',
    accent: 'border-purple-500',
    iconBg: 'bg-purple-50',
    badge: null,
    external: false,
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: 'audit',
    title: 'Audit Log',
    description: 'Full activity trail — every action, classification, and escalation recorded.',
    href: '/audit',
    accent: 'border-teal-500',
    iconBg: 'bg-teal-50',
    badge: null,
    external: false,
    icon: (
      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'attestations',
    title: 'Attestations',
    description: 'Staff attestation records, review confirmations, and sign-off tracking.',
    href: '/attestations',
    accent: 'border-emerald-500',
    iconBg: 'bg-emerald-50',
    badge: null,
    external: false,
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    id: 'session',
    title: 'Session Summary',
    description: 'End-of-session reports, handoff notes, and shift-level activity summaries.',
    href: '/session-summary',
    accent: 'border-slate-400',
    iconBg: 'bg-slate-50',
    badge: { label: 'ADMIN', color: 'bg-slate-200 text-slate-600' },
    external: false,
    icon: (
      <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, color }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-5 text-center">
      <div className={`text-3xl font-light ${color}`}>
        {value ?? '—'}
      </div>
      <div className="text-sm text-white/70 mt-1">{label}</div>
    </div>
  );
}

// ── Module card ───────────────────────────────────────────────────────────────
function ModuleCard({ mod }) {
  return (
    <Link
      to={mod.href}
      className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      <div className={`h-1 ${mod.accent.replace('border-', 'bg-')}`} />
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-lg ${mod.iconBg} flex items-center justify-center`}>
            {mod.icon}
          </div>
          <div className="flex items-center gap-1.5">
            {mod.badge && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${mod.badge.color}`}>
                {mod.badge.label}
              </span>
            )}
            {mod.external && (
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
          </div>
        </div>
        <h3 className="text-sm font-medium text-slate-900 mb-1.5">{mod.title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed flex-1">{mod.description}</p>
      </div>
      <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">{mod.external ? 'Open in new tab' : 'Open'}</span>
        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiClient.get('/events/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  function handleLogout() { logout(); navigate('/login'); }

  const firstName = user?.name?.split(' ')[0] || 'Welcome';

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top bar ── */}
      <div className="bg-indigo-900 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <div>
            <span className="text-white font-medium text-sm">SafetyZone</span>
            <span className="text-indigo-300 text-xs ml-2">Healthcare Risk Platform</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white text-sm font-medium leading-tight">{user?.name}</p>
            <p className="text-indigo-300 text-xs leading-tight">{user?.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.[0] || 'U'}
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-indigo-200 hover:text-white border border-indigo-600 hover:border-indigo-400 px-3 py-1.5 rounded transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-light text-white mb-2">{firstName}</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm text-white/70">{user?.role} · SafetyZone</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <StatCard
              value={stats ? stats.total.toLocaleString() : '…'}
              label="Total Incidents"
              color="text-blue-300"
            />
            <StatCard
              value={stats ? stats.withHarm.toLocaleString() : '…'}
              label="With Patient Harm"
              color="text-amber-300"
            />
            <StatCard
              value={stats ? stats.noHarm.toLocaleString() : '…'}
              label="No Harm / Near Miss"
              color="text-emerald-300"
            />
            <StatCard
              value={stats ? `${stats.safetyRate}%` : '…'}
              label="No-Harm Rate"
              color="text-purple-300"
            />
          </div>
        </div>
      </div>

      {/* ── Modules ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-base font-medium text-slate-800">Platform Modules</h2>
          <p className="text-sm text-slate-400 mt-0.5">{MODULES.length} modules available</p>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {MODULES.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>
      </div>

    </div>
  );
}
