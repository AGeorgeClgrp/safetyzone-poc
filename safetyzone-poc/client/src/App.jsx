import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import TriageQueuePage from './pages/TriageQueuePage';
import EventDetailPage from './pages/EventDetailPage';
import AuditLogPage from './pages/AuditLogPage';
import SessionSummaryPage from './pages/SessionSummaryPage';
import AttestationsPage from './pages/AttestationsPage';
import VrmPage from './pages/VrmPage';
import CompliancePage from './pages/CompliancePage';
import DashboardPage from './pages/DashboardPage';
import TrendsPage from './pages/TrendsPage';
import NavBar from './components/NavBar';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <NavBar />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/queue" replace /> : <LoginPage />} />
      <Route
        path="/queue"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TriageQueuePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EventDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AuditLogPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/session-summary"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SessionSummaryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attestations"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AttestationsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vrm"
        element={
          <ProtectedRoute>
            <AppLayout>
              <VrmPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trends"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TrendsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/compliance"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CompliancePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
