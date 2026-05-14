import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const C = {
  pageBg:      'linear-gradient(135deg, #0A1628 0%, #1B3A6B 55%, #1E5FAD 100%)',
  cardBg:      '#FFFFFF',
  cardBorder:  '#CBD5E8',
  cardTitle:   '#0A1628',
  cardBody:    '#4A6080',
  cardLabel:   '#7A92B0',
  badgeBg:     '#E3EEFF',
  badgeTxt:    '#1B3A6B',
  userBorderD: '#CBD5E8',
  userBorderH: '#1E5FAD',
  userBgH:     '#F0F4F8',
  userName:    '#0A1628',
  userTitle:   '#4A6080',
  userDesc:    '#7A92B0',
  arrowD:      '#7A92B0',
  arrowH:      '#1E5FAD',
  avatarRingD: 'rgba(255,255,255,0.20)',
  avatarRingBg:'rgba(255,255,255,0.10)',
  tagline:     'rgba(186,212,255,0.75)',
  footer:      'rgba(186,212,255,0.50)',
  errorBg:     '#FFF0F0',
  errorBdr:    '#FECACA',
  errorTxt:    '#991B1B',
};

const USERS = [
  {
    id: 'jamie_vps',
    name: 'Jamie Chen',
    role: 'TriageReviewer',
    title: 'VP Patient Safety / Risk Manager',
    description: 'Full triage, classification, escalation, and disposition capabilities.',
    icon: '👩‍⚕️',
  },
  {
    id: 'morgan_pso',
    name: 'Morgan Lee',
    role: 'Auditor',
    title: 'PSO Data Analyst',
    description: 'Read-only access to events, audit trail, and attestation records.',
    icon: '📊',
  },
];

function UserCard({ user, loading, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const isLoading = loading === user.id;
  return (
    <button
      onClick={() => onSelect(user)}
      disabled={isLoading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '14px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
        border: `2px solid ${hovered ? C.userBorderH : C.userBorderD}`,
        background: hovered ? C.userBgH : C.cardBg,
        opacity: isLoading ? 0.6 : 1,
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <span style={{ fontSize: 30, flexShrink: 0, lineHeight: 1 }}>{user.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: C.userName }}>{user.name}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
            background: C.badgeBg, color: C.badgeTxt }}>
            {user.role}
          </span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: C.userTitle, marginBottom: 3 }}>{user.title}</div>
        <div style={{ fontSize: 11, color: C.userDesc }}>{user.description}</div>
      </div>
      <div style={{ flexShrink: 0, fontSize: 16, color: hovered ? C.arrowH : C.arrowD,
        transition: 'color 0.15s' }}>
        {isLoading ? '⏳' : '→'}
      </div>
    </button>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  async function handleUserSelect(userDef) {
    setLoading(userDef.id);
    setError(null);
    login({ id: userDef.id, name: userDef.name, role: userDef.role });
    try { await apiClient.post('/session/start', {}); } catch { /* non-fatal */ }
    navigate('/queue');
    setLoading(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: C.pageBg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: '50%',
            background: C.avatarRingBg, border: `2px solid ${C.avatarRingD}`,
            marginBottom: 14 }}>
            <span style={{ fontSize: 36 }}>🛡️</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.5px', margin: '0 0 4px' }}>
            SafetyZone
          </h1>
          <p style={{ fontSize: 12, fontWeight: 500, color: C.tagline, margin: 0 }}>
            Morning Triage &amp; Escalation Platform
          </p>
        </div>

        {/* Card */}
        <div style={{ background: C.cardBg, borderRadius: 16,
          boxShadow: '0 20px 60px rgba(10,22,40,0.35)', padding: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: C.cardTitle,
            textAlign: 'center', marginBottom: 16 }}>
            Select your account to continue
          </h2>

          {error && (
            <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8,
              background: C.errorBg, border: `1px solid ${C.errorBdr}`,
              fontSize: 12, color: C.errorTxt }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {USERS.map((user) => (
              <UserCard key={user.id} user={user} loading={loading} onSelect={handleUserSelect} />
            ))}
          </div>

          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: C.cardLabel }}>
            POC environment — no real credentials required
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: C.footer, marginTop: 20 }}>
          SafetyZone v1.0 · CMS PSSM Domain 1 Compliant POC
        </p>
      </div>
    </div>
  );
}
