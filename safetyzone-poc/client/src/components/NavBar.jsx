import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/queue',
    label: 'Workspace',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: '/vrm',
    label: 'Agent Mode',
    badge: 'AI',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
      </svg>
    ),
  },
  {
    to: '/trends',
    label: 'Trends',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    to: '/compliance',
    label: 'Compliance',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    to: '/audit',
    label: 'Audit Log',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: '/attestations',
    label: 'Attestations',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    to: '/session-summary',
    label: 'Session Summary',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sz-sidebar-collapsed') === 'true'
  );

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sz-sidebar-collapsed', String(next));
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className={`flex-shrink-0 flex flex-col bg-indigo-900 h-full transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}>

      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-3 py-4 border-b border-indigo-800 flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <span className="text-xl flex-shrink-0">🛡️</span>
        {!collapsed && (
          <div>
            <p className="text-white font-medium text-sm leading-tight">SafetyZone</p>
            <p className="text-indigo-400 text-xs leading-tight">Risk Platform</p>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => (
          <div key={item.to} className="px-2 relative group">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="truncate flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-xs bg-indigo-600 text-indigo-200 px-1.5 py-0.5 rounded flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
            {/* Tooltip when collapsed */}
            {collapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                {item.label}
                {item.badge && <span className="ml-1.5 text-blue-300">{item.badge}</span>}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-indigo-800 px-2 py-2 flex-shrink-0">
        <button
          onClick={toggle}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>

      {/* User + logout */}
      <div className="border-t border-indigo-800 p-3 flex-shrink-0">
        {collapsed ? (
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-full flex justify-center text-indigo-300 hover:text-white py-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        ) : (
          <>
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <p className="text-indigo-400 text-xs truncate mb-2">{user?.role}</p>
            <button
              onClick={handleLogout}
              className="w-full text-xs bg-indigo-700 hover:bg-indigo-600 text-indigo-200 hover:text-white px-2 py-1.5 rounded-lg transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>

    </div>
  );
}
