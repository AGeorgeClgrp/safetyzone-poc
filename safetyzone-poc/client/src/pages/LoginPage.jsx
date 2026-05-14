import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

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

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  async function handleUserSelect(userDef) {
    setLoading(userDef.id);
    setError(null);
    const userData = { id: userDef.id, name: userDef.name, role: userDef.role };
    login(userData);

    try {
      await apiClient.post('/session/start', {});
    } catch {
      // session start failure is non-fatal for POC
    }

    navigate('/queue');
    setLoading(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Title Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-4">
            <span className="text-4xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">SafetyZone</h1>
          <p className="text-indigo-200 mt-1 text-sm font-medium">
            Morning Triage &amp; Escalation Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4 text-center">
            Select your account to continue
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                disabled={loading === user.id}
                className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group text-left disabled:opacity-60"
              >
                <span className="text-3xl flex-shrink-0">{user.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-slate-900 text-sm">{user.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                      {user.role}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 mb-1">{user.title}</div>
                  <div className="text-xs text-slate-400">{user.description}</div>
                </div>
                <div className="flex-shrink-0 text-indigo-400 group-hover:text-indigo-600 text-lg">
                  {loading === user.id ? '⏳' : '→'}
                </div>
              </button>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            POC environment — no real credentials required
          </p>
        </div>

        <p className="text-center text-indigo-300 text-xs mt-6">
          SafetyZone v1.0 · CMS PSSM Domain 1 Compliant POC
        </p>
      </div>
    </div>
  );
}
