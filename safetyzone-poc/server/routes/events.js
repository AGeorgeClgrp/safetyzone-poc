'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getPool, sql } = require('../db');
const { getState, setState, auditLog, addAuditEntry } = require('../data/store');

const router = express.Router();

// Maps DB Severity values to app severity
const SEVERITY_MAP = { severe: 'serious', death: 'serious', moderate: 'moderate', mild: 'minor', no_harm: 'near_miss' };

// DB Severity → SQL ORDER BY rank (1=highest)
const SEVERITY_RANK = `CASE Severity WHEN 'death' THEN 1 WHEN 'severe' THEN 2 WHEN 'moderate' THEN 3 WHEN 'mild' THEN 4 ELSE 5 END`;

function calcPriorityScore(row) {
  const base = { death: 95, severe: 80, moderate: 55, mild: 30, no_harm: 15 }[row.Severity] || 20;
  const sentinelBonus = row.Sentinel === 'Yes' ? 8 : 0;
  const harmBonus = row.Harm_Event === 'Yes' ? 5 : 0;
  return Math.min(base + sentinelBonus + harmBonus, 100);
}

function mapRow(row, showPII = false) {
  const state = getState(row.Event_ID);
  const patient = showPII
    ? { mrn: row.MRN, name: `${row.First_Name} ${row.Last_Name}`, age: row.Age, sex: row.Sex, race: row.Race, facility: 'Main Campus' }
    : { mrn: row.MRN, facility: 'Main Campus' };

  return {
    id: row.Event_ID,
    type: row.Trigger_Name,
    triggerId: row.Trigger_ID,
    triggerSource: row.Trigger_Source,
    cfCode: row.CF_Code,
    severity: SEVERITY_MAP[row.Severity] || row.Severity,
    rawSeverity: row.Severity,
    sentinel: row.Sentinel === 'Yes',
    harmEvent: row.Harm_Event === 'Yes',
    occurredAt: row.Detected_At,
    reportedAt: row.Detected_At,
    narrative: row.AI_Narrative,
    patient,
    encounter: {
      id: String(row.Encounter_ID),
      unit: row.Location_Unit,
      location: row.Location_Unit,
    },
    contributingFactors: row.Contributing_Factors ? row.Contributing_Factors.split(' | ') : [],
    recommendedFollowUp: row.Recommended_Follow_Up ? row.Recommended_Follow_Up.split(' | ') : [],
    priorityScore: calcPriorityScore(row),
    status: state.status || 'queued',
    classification: state.classification || null,
    triageDecision: state.triageDecision || null,
    escalation: state.escalation || null,
  };
}

function makeAuditEntry(req, action, resourceRef, detail) {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action,
    resourceType: 'Event',
    resourceRef,
    detail: detail || null,
  };
}

function addBusinessDays(date, days) {
  let result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(parseInt(req.query.pageSize) || 50, 200);
    const offset = (page - 1) * pageSize;
    const severity = req.query.severity;

    // Build severity WHERE clause
    const severityFilter = {
      serious: `Severity IN ('severe','death')`,
      moderate: `Severity = 'moderate'`,
      minor: `Severity = 'mild'`,
      near_miss: `Severity = 'no_harm'`,
    };
    const severityClause = severity && severityFilter[severity] ? `AND ${severityFilter[severity]}` : '';

    const pool = await getPool();

    const countReq = pool.request().input('days', sql.Int, days);
    const countResult = await countReq.query(
      `SELECT COUNT(*) AS total FROM synthetic_safety_events
       WHERE Detected_At >= DATEADD(day, -@days, GETUTCDATE()) ${severityClause}`
    );
    const total = countResult.recordset[0].total;

    const dataReq = pool.request()
      .input('days', sql.Int, days)
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, pageSize);

    const result = await dataReq.query(
      `SELECT * FROM synthetic_safety_events
       WHERE Detected_At >= DATEADD(day, -@days, GETUTCDATE()) ${severityClause}
       ORDER BY ${SEVERITY_RANK},
                CASE WHEN Sentinel = 'Yes' THEN 0 ELSE 1 END,
                CASE WHEN Harm_Event = 'Yes' THEN 0 ELSE 1 END,
                Detected_At DESC
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`
    );

    res.json({
      events: result.recordset.map((row) => mapRow(row, false)),
      pagination: { total, page, pageSize, pages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    console.error('GET /api/events error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/stats
router.get('/stats', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN Severity IN ('severe','death') THEN 1 ELSE 0 END) AS critical,
        SUM(CASE WHEN Sentinel = 'Yes' THEN 1 ELSE 0 END) AS sentinel,
        SUM(CASE WHEN Harm_Event = 'No' THEN 1 ELSE 0 END) AS no_harm,
        SUM(CASE WHEN Harm_Event = 'Yes' THEN 1 ELSE 0 END) AS with_harm
      FROM synthetic_safety_events
    `);
    const row = result.recordset[0];
    const total = row.total || 0;
    res.json({
      total,
      critical: row.critical || 0,
      sentinel: row.sentinel || 0,
      noHarm: row.no_harm || 0,
      withHarm: row.with_harm || 0,
      safetyRate: total > 0 ? Math.round((row.no_harm / total) * 100) : 0,
    });
  } catch (err) {
    console.error('GET /api/events/stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar(50), req.params.id)
      .query('SELECT * FROM synthetic_safety_events WHERE Event_ID = @id');

    if (!result.recordset.length) return res.status(404).json({ error: 'Event not found' });

    const row = result.recordset[0];
    const state = getState(row.Event_ID);
    if (!state.status || state.status === 'queued') {
      setState(row.Event_ID, { ...state, status: 'in_review' });
    }

    addAuditEntry(makeAuditEntry(req, 'event_opened', row.Event_ID, `Opened: ${row.Trigger_Name}`));
    res.json(mapRow(row, true));
  } catch (err) {
    console.error('GET /api/events/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/events/:id/classify
router.patch('/:id/classify', async (req, res) => {
  try {
    const { eventType, harmLevel, contributingFactors } = req.body;
    const state = getState(req.params.id);

    setState(req.params.id, {
      ...state,
      status: 'classified',
      classification: {
        eventType,
        harmLevel,
        contributingFactors: contributingFactors || [],
        classifiedAt: new Date().toISOString(),
        classifiedBy: req.user.id,
      },
    });

    addAuditEntry(makeAuditEntry(req, 'event_classified', req.params.id, `Classified: ${eventType}, harm ${harmLevel}`));

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar(50), req.params.id)
      .query('SELECT * FROM synthetic_safety_events WHERE Event_ID = @id');

    res.json(mapRow(result.recordset[0], true));
  } catch (err) {
    console.error('PATCH /classify error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:id/disposition
router.post('/:id/disposition', async (req, res) => {
  try {
    const { disposition, rationale, assignee } = req.body;
    const statusMap = { close: 'closed', monitor: 'monitoring', escalate: 'escalated', route_investigation: 'under_investigation' };
    const state = getState(req.params.id);

    setState(req.params.id, {
      ...state,
      status: statusMap[disposition] || state.status,
      triageDecision: {
        disposition,
        rationale: rationale || '',
        assignee: assignee || null,
        decidedAt: new Date().toISOString(),
        decidedBy: req.user.id,
      },
    });

    addAuditEntry(makeAuditEntry(req, 'disposition_set', req.params.id, `Disposition: ${disposition}`));

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar(50), req.params.id)
      .query('SELECT * FROM synthetic_safety_events WHERE Event_ID = @id');

    res.json(mapRow(result.recordset[0], true));
  } catch (err) {
    console.error('POST /disposition error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:id/escalate
router.post('/:id/escalate', async (req, res) => {
  try {
    const { recipients, channel } = req.body;
    const now = new Date();
    const deadline = addBusinessDays(now, 3);
    const state = getState(req.params.id);

    setState(req.params.id, {
      ...state,
      status: 'escalated',
      triageDecision: {
        disposition: 'escalate',
        rationale: 'Serious event — notify leadership (PSSM Domain 1)',
        assignee: null,
        decidedAt: now.toISOString(),
        decidedBy: req.user.id,
      },
      escalation: {
        id: uuidv4(),
        recipients: recipients || [],
        channel: channel || 'Email',
        escalatedAt: now.toISOString(),
        escalatedBy: req.user.id,
        pssmAttestation: {
          id: uuidv4(),
          createdAt: now.toISOString(),
          deadline: deadline.toISOString(),
          status: 'pending',
          ackTimestamp: null,
          ackedBy: null,
        },
      },
    });

    addAuditEntry(makeAuditEntry(
      req, 'event_escalated', req.params.id,
      `Escalated via ${channel} to ${recipients ? recipients.length : 0} recipient(s). PSSM deadline: ${deadline.toISOString()}`
    ));

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar(50), req.params.id)
      .query('SELECT * FROM synthetic_safety_events WHERE Event_ID = @id');

    res.json(mapRow(result.recordset[0], true));
  } catch (err) {
    console.error('POST /escalate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:id/acknowledge
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const state = getState(req.params.id);
    if (!state.escalation || !state.escalation.pssmAttestation) {
      return res.status(400).json({ error: 'No escalation found for this event' });
    }

    const now = new Date().toISOString();
    setState(req.params.id, {
      ...state,
      escalation: {
        ...state.escalation,
        pssmAttestation: {
          ...state.escalation.pssmAttestation,
          ackTimestamp: now,
          ackedBy: req.user.id,
          status: 'acknowledged',
        },
      },
    });

    addAuditEntry(makeAuditEntry(req, 'escalation_acknowledged', req.params.id, 'PSSM attestation acknowledged'));

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar(50), req.params.id)
      .query('SELECT * FROM synthetic_safety_events WHERE Event_ID = @id');

    res.json(mapRow(result.recordset[0], true));
  } catch (err) {
    console.error('POST /acknowledge error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
