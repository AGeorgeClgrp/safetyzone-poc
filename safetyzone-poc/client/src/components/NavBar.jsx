import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-700 text-white'
        : 'text-slate-200 hover:bg-indigo-600 hover:text-white'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-indigo-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="text-white font-bold text-lg tracking-tight">SafetyZone</span>
          </div>

          {/* Nav links */}
          {user && (
            <div className="flex items-center gap-1">
              <NavLink to="/queue" className={linkClass}>
                Workspace
              </NavLink>
              <NavLink
                to="/vrm"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-700 text-white'
                      : 'text-slate-200 hover:bg-indigo-600 hover:text-white'
                  }`
                }
              >
                <span className="text-xs">🤖</span> Agent Mode
              </NavLink>
              <NavLink to="/audit" className={linkClass}>
                Audit Log
              </NavLink>
              <NavLink to="/attestations" className={linkClass}>
                Attestations
              </NavLink>
              <NavLink to="/session-summary" className={linkClass}>
                Session Summary
              </NavLink>
              <NavLink to="/compliance" className={linkClass}>
                Compliance
              </NavLink>
            </div>
          )}

          {/* User pill + logout */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-white text-sm font-medium leading-tight">{user.name}</span>
                <span className="text-indigo-300 text-xs leading-tight">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
