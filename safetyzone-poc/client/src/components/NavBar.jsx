import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Palette — matches DashboardPage C tokens ──────────────────────────────────
const N = {
  bg:           '#0A1628',
  border:       'rgba(255,255,255,0.08)',
  activeBg:     'rgba(30,95,173,0.40)',
  activeBar:    '#1E5FAD',
  hoverBg:      'rgba(255,255,255,0.06)',
  textActive:   '#FFFFFF',
  textInactive: 'rgba(186,212,255,0.70)',
  textHover:    '#FFFFFF',
  badgeBg:      'rgba(30,95,173,0.45)',
  badgeTxt:     '#BAD4FF',
  tooltipBg:    '#0D1F3C',
  tooltipBdr:   'rgba(30,95,173,0.50)',
  logoBrand:    '#FFFFFF',
  logoSub:      'rgba(186,212,255,0.55)',
  userName:     '#FFFFFF',
  userRole:     'rgba(186,212,255,0.65)',
  logoutBdr:    '#1E5FAD',
  logoutTxt:    '#93B8E8',
  logoutHovBg:  'rgba(30,95,173,0.30)',
  toggleTxt:    'rgba(186,212,255,0.60)',
};

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

// ── Nav item with hover state ─────────────────────────────────────────────────
function NavItem({ item, collapsed }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="px-2 relative group">
      <NavLink
        to={item.to}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '7px 10px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          color: isActive || hovered ? N.textActive : N.textInactive,
          background: isActive ? N.activeBg : hovered ? N.hoverBg : 'transparent',
          borderLeft: isActive ? `2px solid ${N.activeBar}` : '2px solid transparent',
          transition: 'background 0.15s, color 0.15s',
          textDecoration: 'none',
          justifyContent: collapsed ? 'center' : 'flex-start',
        })}
      >
        <span style={{ flexShrink: 0 }}>{item.icon}</span>
        {!collapsed && (
          <>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.label}
            </span>
            {item.badge && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: N.badgeBg, color: N.badgeTxt,
                padding: '2px 6px', borderRadius: 4, flexShrink: 0,
              }}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>

      {/* Tooltip when collapsed */}
      {collapsed && (
        <div style={{
          position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
          marginLeft: 8, padding: '6px 10px',
          background: N.tooltipBg, border: `1px solid ${N.tooltipBdr}`,
          color: '#FFFFFF', fontSize: 11, borderRadius: 6,
          whiteSpace: 'nowrap', pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          zIndex: 50,
        }} className="opacity-0 group-hover:opacity-100 transition-opacity">
          {item.label}
          {item.badge && (
            <span style={{ marginLeft: 6, color: N.badgeTxt, fontWeight: 600 }}>{item.badge}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sz-sidebar-collapsed') === 'true'
  );
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [toggleHovered, setToggleHovered] = useState(false);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sz-sidebar-collapsed', String(next));
  }

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <div style={{
      background: N.bg,
      width: collapsed ? 56 : 208,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'width 0.2s',
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 12px',
        borderBottom: `1px solid ${N.border}`,
        flexShrink: 0,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🛡️</span>
        {!collapsed && (
          <div>
            <p style={{ color: N.logoBrand, fontWeight: 600, fontSize: 13, lineHeight: 1.2, margin: 0 }}>SafetyZone</p>
            <p style={{ color: N.logoSub, fontSize: 10, lineHeight: 1.3, margin: 0 }}>Risk Platform</p>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div style={{ borderTop: `1px solid ${N.border}`, padding: '6px 8px', flexShrink: 0 }}>
        <button
          onClick={toggle}
          onMouseEnter={() => setToggleHovered(true)}
          onMouseLeave={() => setToggleHovered(false)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: toggleHovered ? N.hoverBg : 'transparent',
            color: toggleHovered ? N.textActive : N.toggleTxt,
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          <svg style={{
            width: 15, height: 15, flexShrink: 0,
            transform: collapsed ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span style={{ fontSize: 11 }}>Collapse</span>}
        </button>
      </div>

      {/* User + logout */}
      <div style={{ borderTop: `1px solid ${N.border}`, padding: 12, flexShrink: 0 }}>
        {collapsed ? (
          <button
            onClick={handleLogout}
            title="Logout"
            onMouseEnter={() => setLogoutHovered(true)}
            onMouseLeave={() => setLogoutHovered(false)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'center',
              padding: '4px 0', border: 'none', cursor: 'pointer', borderRadius: 6,
              background: 'transparent',
              color: logoutHovered ? N.textActive : N.toggleTxt,
              transition: 'color 0.15s',
            }}
          >
            <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        ) : (
          <>
            <p style={{ color: N.userName, fontSize: 11, fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </p>
            <p style={{ color: N.userRole, fontSize: 10, margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.role}
            </p>
            <button
              onClick={handleLogout}
              onMouseEnter={() => setLogoutHovered(true)}
              onMouseLeave={() => setLogoutHovered(false)}
              style={{
                width: '100%', fontSize: 11, fontWeight: 500,
                border: `1px solid ${N.logoutBdr}`,
                color: logoutHovered ? '#FFFFFF' : N.logoutTxt,
                background: logoutHovered ? N.logoutHovBg : 'transparent',
                padding: '6px 8px', borderRadius: 7, cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>

    </div>
  );
}
