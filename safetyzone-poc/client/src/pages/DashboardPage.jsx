import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

// ── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  pageBg:        '#F0F4F8',
  navy:          '#0A1628',
  heroGradient:  'linear-gradient(to right, #0A1628, #1B3A6B, #1E5FAD)',
  cardBg:        '#FFFFFF',
  cardBorder:    '#CBD5E8',
  cardBorderHov: '#1E5FAD',
  cardTitle:     '#0A1628',
  cardBody:      '#4A6080',
  cardFooterBg:  '#EEF2F8',
  cardFooterTxt: '#7A92B0',
  badgeBg:       '#E3EEFF',
  badgeTxt:      '#1B3A6B',
  statA:         '#BAD4FF',
  statB:         '#90CAF9',
  onlineDot:     '#00E5C3',
  signOutBorder: '#1E5FAD',
  signOutTxt:    '#93B8E8',
  platformTxt:   'rgba(255,255,255,0.55)',
  statCardBg:    'rgba(255,255,255,0.12)',
  statCardBdr:   'rgba(255,255,255,0.10)',
  statLabel:     'rgba(255,255,255,0.50)',
  roleTxt:       'rgba(186,212,255,0.80)',
  avatarBg:      'rgba(30,95,173,0.55)',
  avatarBdr:     'rgba(144,202,249,0.25)',
  sectionTitle:  '#0A1628',
  sectionSub:    '#7A92B0',
  arrowDefault:  '#CBD5E8',
  arrowHov:      '#1E5FAD',
};

// ── Module accent palette ─────────────────────────────────────────────────────
const ACCENTS = ['#1E5FAD','#1565C0','#0288D1','#006064','#01579B','#283593','#1B3A6B'];

// ── Module definitions ────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'queue',
    title: 'Patient Safety Events',
    description: 'Review, triage, assign, and manage open patient safety event reports.',
    href: '/queue',
    accent: ACCENTS[0],
    badge: { label: 'REVIEWER' },
    external: false,
    icon: (
      <svg className="w-6 h-6" style={{ color: ACCENTS[0] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    accent: ACCENTS[1],
    badge: { label: 'AI' },
    external: false,
    icon: (
      <svg className="w-6 h-6" style={{ color: ACCENTS[1] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
      </svg>
    ),
  },
  {
    id: 'trends',
    title: 'Trend Analysis',
    description: 'Visualize events by harm scale, event type, location, and contributing factors with cross-reference heatmaps.',
    href: '/trends',
    accent: ACCENTS[2],
    badge: null,
    external: false,
    icon: (
      <svg className="w-6 h-6" style={{ color: ACCENTS[2] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    id: 'compliance',
    title: 'Compliance & Audit Readiness',
    description: 'Track regulatory deadlines, audit checklists, and submission status.',
    href: '/compliance',
    accent: ACCENTS[3],
    badge: null,
    external: false,
    icon: (
      <svg className="w-6 h-6" style={{ color: ACCENTS[3] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    accent: ACCENTS[4],
    badge: null,
    external: false,
    icon: (
      <svg className="w-6 h-6" style={{ color: ACCENTS[4] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    accent: ACCENTS[5],
    badge: null,
    external: false,
    icon: (
      <svg className="w-6 h-6" style={{ color: ACCENTS[5] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    accent: ACCENTS[6],
    badge: { label: 'ADMIN' },
    external: false,
    icon: (
      <svg className="w-6 h-6" style={{ color: ACCENTS[6] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, valueColor }) {
  return (
    <div style={{
      background: C.statCardBg,
      border: `1px solid ${C.statCardBdr}`,
      backdropFilter: 'blur(8px)',
    }} className="rounded-xl px-6 py-5">
      <div className="text-3xl font-semibold" style={{ color: valueColor }}>
        {value ?? '—'}
      </div>
      <div className="text-xs font-medium mt-1.5" style={{ color: C.statLabel }}>{label}</div>
    </div>
  );
}

// ── Module card ───────────────────────────────────────────────────────────────
function ModuleCard({ mod }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={mod.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.cardBg,
        border: `1px solid ${hovered ? C.cardBorderHov : C.cardBorder}`,
        boxShadow: hovered ? '0 4px 16px rgba(30,95,173,0.12)' : '0 1px 3px rgba(10,22,40,0.06)',
        transition: 'border-color 0.18s, box-shadow 0.18s',
      }}
      className="rounded-xl overflow-hidden flex flex-col"
    >
      {/* Accent top bar */}
      <div style={{ height: 3, background: mod.accent, flexShrink: 0 }} />

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          {/* Icon */}
          <div className="w-11 h-11 rounded-lg flex items-center justify-center"
            style={{ background: `${mod.accent}15` }}>
            {mod.icon}
          </div>
          {/* Badge */}
          {mod.badge && (
            <span className="text-xs font-medium px-2 py-0.5 rounded"
              style={{ background: C.badgeBg, color: C.badgeTxt }}>
              {mod.badge.label}
            </span>
          )}
          {mod.external && (
            <svg className="w-4 h-4" style={{ color: C.cardBorder }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          )}
        </div>
        <h3 className="text-sm mb-1.5" style={{ fontWeight: 600, color: C.cardTitle }}>{mod.title}</h3>
        <p className="text-xs leading-relaxed flex-1" style={{ fontWeight: 400, color: C.cardBody }}>{mod.description}</p>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 flex items-center justify-between"
        style={{ background: C.cardFooterBg, borderTop: `1px solid ${C.cardBorder}` }}>
        <span className="text-xs" style={{ color: C.cardFooterTxt }}>
          {mod.external ? 'Open in new tab' : 'Open'}
        </span>
        <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ color: hovered ? C.cardBorderHov : C.arrowDefault, transform: hovered ? 'translateX(2px)' : 'none' }}>
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
    <div className="min-h-screen" style={{ background: C.pageBg }}>

      {/* ── Hero ── */}
      <div style={{ background: C.heroGradient }} className="px-6 pt-4 pb-10">
        <div className="max-w-6xl mx-auto">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🛡️</span>
              <div>
                <span className="text-white font-medium text-sm">SafetyZone</span>
                <span className="text-xs ml-2" style={{ color: C.platformTxt }}>Healthcare Risk Platform</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-sm font-medium leading-tight">{user?.name}</p>
                <p className="text-xs leading-tight" style={{ color: C.statB }}>{user?.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ background: C.avatarBg, border: `1px solid ${C.avatarBdr}` }}>
                {user?.name?.[0] || 'U'}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded transition-colors hover:text-white"
                style={{ color: C.signOutTxt, border: `1px solid ${C.signOutBorder}` }}
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-white mb-1.5">{firstName}</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: C.onlineDot }} />
              <span className="text-sm" style={{ color: C.roleTxt }}>{user?.role} · SafetyZone</span>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard value={stats ? stats.total.toLocaleString() : '…'}   label="Total Incidents"  valueColor={C.statA} />
            <StatCard value={stats ? stats.withHarm.toLocaleString() : '…'} label="Open Reports"    valueColor={C.statB} />
            <StatCard value={stats ? stats.noHarm.toLocaleString() : '…'}   label="Resolved"        valueColor={C.statA} />
            <StatCard value={stats ? `${stats.safetyRate}%` : '…'}          label="Resolution Rate" valueColor={C.statB} />
          </div>

        </div>
      </div>

      {/* ── Modules ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-base" style={{ fontWeight: 600, color: C.sectionTitle }}>Platform Modules</h2>
          <p className="text-sm mt-0.5" style={{ color: C.sectionSub }}>{MODULES.length} modules available</p>
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
