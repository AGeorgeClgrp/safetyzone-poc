'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { store } = require('../data/store');

const router = express.Router();

function makeAuditEntry(req, action, detail) {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action,
    resourceType: 'Session',
    resourceRef: null,
    detail: detail || null,
  };
}

// POST /api/session/start
router.post('/start', (req, res) => {
  const session = {
    id: uuidv4(),
    userId: req.user.id,
    userName: req.user.name,
    startedAt: new Date().toISOString(),
    endedAt: null,
    active: true,
  };
  store.sessions.push(session);

  store.addAuditEntry(makeAuditEntry(req, 'session_start', `Session started by ${req.user.name}`));

  res.json(session);
});

// GET /api/session/summary
router.get('/summary', (req, res) => {
  const events = store.events;

  const reviewed = events.filter((e) => e.status !== 'queued');
  const total = reviewed.length;

  const dispositions = { close: 0, monitor: 0, escalate: 0, route_investigation: 0 };
  reviewed.forEach((e) => {
    if (e.triageDecision && e.triageDecision.disposition) {
      const d = e.triageDecision.disposition;
      if (dispositions[d] !== undefined) {
        dispositions[d]++;
      }
    }
  });

  const escalated = events.filter((e) => e.status === 'escalated');
  const escalationsCount = escalated.length;

  const openAcknowledgments = escalated
    .filter((e) => e.escalation && !e.escalation.pssmAttestation.ackTimestamp)
    .map((e) => ({
      eventId: e.id,
      eventType: e.type,
      deadline: e.escalation.pssmAttestation.deadline,
    }));

  const now = new Date();
  const overduePssm = escalated
    .filter(
      (e) =>
        e.escalation &&
        !e.escalation.pssmAttestation.ackTimestamp &&
        new Date(e.escalation.pssmAttestation.deadline) < now
    )
    .map((e) => ({
      eventId: e.id,
      eventType: e.type,
      deadline: e.escalation.pssmAttestation.deadline,
    }));

  res.json({
    totalReviewed: total,
    dispositions,
    escalationsCount,
    openAcknowledgments,
    overduePssm,
  });
});

// POST /api/session/end
router.post('/end', (req, res) => {
  const active = store.sessions.filter((s) => s.userId === req.user.id && s.active);
  const session = active[active.length - 1] || null;

  if (session) {
    session.endedAt = new Date().toISOString();
    session.active = false;
  }

  store.addAuditEntry(makeAuditEntry(req, 'session_end', `Session ended by ${req.user.name}`));

  res.json(session || { message: 'No active session found' });
});

module.exports = router;
