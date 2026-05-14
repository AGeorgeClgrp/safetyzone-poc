'use strict';

// Triage state overlay — keyed by Event_ID from the database.
// Events themselves live in SQL; this holds in-session classification/disposition/escalation.
const triageState = new Map();
const auditLog = [];
const sessions = [];

function getState(eventId) {
  return triageState.get(eventId) || { status: 'queued', classification: null, triageDecision: null, escalation: null };
}

function setState(eventId, updates) {
  const current = getState(eventId);
  triageState.set(eventId, { ...current, ...updates });
}

function addAuditEntry(entry) {
  auditLog.push(entry);
}

module.exports = { getState, setState, auditLog, sessions, addAuditEntry };
