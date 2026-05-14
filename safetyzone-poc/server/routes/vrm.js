'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Anthropic = require('@anthropic-ai/sdk');
const { getPool, sql } = require('../db');
const { addAuditEntry } = require('../data/store');

const POLICY_PATH = path.join(__dirname, '../policies/FALL_PREVENTION_POLICY.txt');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// In-memory store for triage runs (keyed by run_id)
const triageRuns = new Map();

// GET /api/vrm/batch — returns the 20 highest-priority events for agent analysis
router.get('/batch', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT TOP 20
          Event_ID, Detected_At, Trigger_ID, Trigger_Name, Trigger_Source,
          CF_Code, Severity, Sentinel, Harm_Event, Age, Sex,
          Location_Unit, AI_Narrative, Contributing_Factors, Recommended_Follow_Up
        FROM synthetic_safety_events
        WHERE Severity != 'death'
        ORDER BY
          CASE Severity WHEN 'death' THEN 1 WHEN 'severe' THEN 2 WHEN 'moderate' THEN 3 WHEN 'mild' THEN 4 ELSE 5 END,
          CASE WHEN Sentinel = 'Yes' THEN 0 ELSE 1 END,
          CASE WHEN Harm_Event = 'Yes' THEN 0 ELSE 1 END,
          Detected_At DESC
      `);

    const events = result.recordset.map((row) => ({
      id: row.Event_ID,
      type: row.Trigger_Name,
      triggerId: row.Trigger_ID,
      triggerSource: row.Trigger_Source,
      cfCode: row.CF_Code,
      severity: row.Severity,
      sentinel: row.Sentinel === 'Yes',
      harmEvent: row.Harm_Event === 'Yes',
      occurredAt: row.Detected_At,
      patient: { age: row.Age, sex: row.Sex },
      unit: row.Location_Unit,
      narrative: row.AI_Narrative,
      contributingFactors: row.Contributing_Factors ? row.Contributing_Factors.split(' | ') : [],
      recommendedFollowUp: row.Recommended_Follow_Up ? row.Recommended_Follow_Up.split(' | ') : [],
    }));

    res.json({ events, batchId: `batch-${Date.now()}`, loadedAt: new Date().toISOString() });
  } catch (err) {
    console.error('GET /api/vrm/batch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vrm/triage/run — invoke Claude to analyze the batch
router.post('/triage/run', async (req, res) => {
  const { events, batchId } = req.body;
  if (!events || !events.length) return res.status(400).json({ error: 'No events provided' });

  const runId = uuidv4();
  const startedAt = Date.now();

  // Strip to minimal fields for PHI minimization before sending to Claude
  const safeEvents = events.map((e) => ({
    id: e.id, type: e.type, triggerSource: e.triggerSource, cfCode: e.cfCode,
    severity: e.severity, sentinel: e.sentinel, harmEvent: e.harmEvent,
    unit: e.unit, narrative: e.narrative, contributingFactors: e.contributingFactors || [],
  }));

  // Compact one-line-per-event format to minimize tokens
  const eventList = safeEvents.map((e) =>
    `${e.id}|${e.type}|${e.severity}|sentinel=${e.sentinel}|harm=${e.harmEvent}|unit=${e.unit}|"${e.narrative}"|factors:[${e.contributingFactors.join('; ')}]`
  ).join('\n');

  // Load active policy if available
  let policyText = '';
  try { policyText = fs.readFileSync(POLICY_PATH, 'utf8'); } catch (_) {}
  const policySection = policyText
    ? `\n\nACTIVE POLICY ON FILE — Fall Prevention Policy FP-001:\n${policyText}\n`
    : '';
  const policyField = policyText
    ? `,"policy_alignment":{"coverage_rating":"poor|fair|good","coverage_summary":"2-3 sentences: overall assessment of how well the active policy covers the event types in this batch.","gaps":[{"event_id":"...","event_type":"Trigger/event type name","compliance_type":"non_compliance|missing_policy","policy_section":"Section X.Y — Section Title","gap":"One sentence: what the policy requires vs. what this event shows.","suggestion":"One sentence: specific corrective action."}]}`
    : '';
  const policyRule = policyText
    ? '\npolicy_alignment rules: coverage_rating=poor if >3 event types lack coverage, fair if 1-3, good if 0. compliance_type: non_compliance=policy exists but was not followed; missing_policy=no applicable policy covers this event type. Only include events with a clear documentable gap. One sentence per gap and suggestion. Omit events with no gap.'
    : '';

  const fallAnalysisField = policyText
    ? `,"fall_analysis":{"fall_event_ids":["event IDs whose type/narrative indicate a fall event"],"pattern_summary":"1-2 sentences: cross-event fall patterns, contributing factor clusters, and systemic risks identified across ALL fall events.","universal_precautions_failures":[{"event_id":"...","precaution":"Exact precaution text from Section 5.1 of FP-001","evidence":"Quote or paraphrase from narrative/factors showing this precaution was absent or failed.","failure_mode":"One sentence: how this specific failure contributed to or enabled the fall."}],"five_ps_analysis":[{"event_id":"...","patient":{"status":"failed|compliant|unknown","finding":"Who was affected: patient age, sex, unit, fall risk level, comorbidities relevant to the fall."},"problem":{"status":"failed|compliant|unknown","finding":"The condition, diagnosis, or clinical issue that contributed to or was exacerbated by the fall — e.g. altered mobility, sedation, confusion, unmet toileting need."},"plan":{"status":"failed|compliant|unknown","finding":"Was an individualized fall prevention care plan in place and appropriate? Was it followed? Evidence from narrative."},"purpose":{"status":"failed|compliant|unknown","finding":"What was the intended outcome of the care plan or intervention? Was the goal of preventing this fall clearly defined and communicated to staff and patient?"},"process":{"status":"failed|compliant|unknown","finding":"How was care actually delivered? Was rounding completed, call light accessible, bed in low position, non-slip footwear worn? Process breakdowns evident in narrative."}}],"action_plans":[{"priority":"immediate|short_term|ongoing","action":"Specific corrective action.","owner":"Role responsible (e.g., Charge Nurse, CNO, Pharmacist).","metric":"How compliance will be measured."}],"rca_required_elements":[{"element":"What must be examined in the RCA.","rationale":"Why this element is critical for this fall pattern."}]}"`
    : '';
  const fallAnalysisRule = policyText
    ? '\nfall_analysis rules: fall_event_ids=only events where the trigger type, narrative, or contributing factors clearly indicate an actual patient fall occurred. five_ps_analysis=one entry per fall event using the Healthcare 5 Ps framework (Patient/Problem/Plan/Purpose/Process); status=failed if narrative/factors show a gap or breakdown in that dimension; compliant if evidence it was addressed; unknown if no evidence either way. universal_precautions_failures=only include where narrative/factors provide clear evidence of a specific precaution being absent; omit precautions with no evidence. action_plans=3-6 actions covering immediate response, systemic process fixes, and ongoing monitoring. rca_required_elements=5-8 elements specific to the fall pattern found, not generic RCA steps.'
    : '';

  const prompt = `You are a healthcare risk management AI. Analyze this batch of ${safeEvents.length} patient safety events and return ONLY raw JSON — no markdown, no code fences.

EVENTS (id|type|severity|sentinel|harm|unit|narrative|factors):
${eventList}
${policySection}
Return this exact JSON structure:
{"summary":"Max 12 words: the single most urgent risk.","pattern_alerts":["Max 10 words per pattern — name the issue and event count only."],"regulatory_flags":[{"event_id":"...","flag":"Regulation, citation, deadline."}],"counts":{"immediate":0,"high":0,"medium":0,"routine":0},"queue":[{"event_id":"...","priority":"immediate|high|medium|routine","one_liner":"Why this priority."}],"top_3":[{"event_id":"...","narrative_analysis":"2 sentences.","contributing_factors_extracted":["factor"],"recommended_actions":["action 1","action 2","action 3"],"interview_targets":[{"role":"Title","why":"Reason."}],"rca_warranted":true,"rca_rationale":"One sentence.","regulatory_obligations":"Regulation and deadline."}]${policyField}${fallAnalysisField}}

Priority rules: immediate=death or sentinel=true; high=severe harm, PSSM escalation candidates; medium=moderate harm; routine=no_harm or mild. top_3=3 most critical events. All event_id must exactly match input IDs.${policyRule}${fallAnalysisRule}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content[0].text.trim();
    // Strip markdown code fences if Claude added them despite instructions
    const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const triageResult = JSON.parse(jsonText);

    const run = {
      runId,
      batchId,
      modelId: 'claude-sonnet-4-6',
      userId: req.user.id,
      eventCount: events.length,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt,
      result: triageResult,
    };
    triageRuns.set(runId, run);

    addAuditEntry({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'vrm_triage_run',
      resourceType: 'TriageRun',
      resourceRef: runId,
      detail: `Agent triage run on ${events.length} events. Elapsed: ${Date.now() - startedAt}ms`,
    });

    res.json({ runId, ...triageResult });
  } catch (err) {
    console.error('POST /api/vrm/triage/run error:', err.message);
    res.status(500).json({ error: `Agent error: ${err.message}` });
  }
});

// POST /api/vrm/ask — per-event Q&A with Claude
router.post('/ask', async (req, res) => {
  const { runId, eventId, question, event, triageAnalysis } = req.body;
  if (!question || !event) return res.status(400).json({ error: 'question and event are required' });

  const prompt = `You are a healthcare risk management AI assistant. A Risk Manager is asking a follow-up question about a specific patient safety event you previously analyzed.

EVENT:
${JSON.stringify(event, null, 2)}

${triageAnalysis ? `YOUR PREVIOUS TRIAGE ANALYSIS:\n${JSON.stringify(triageAnalysis, null, 2)}\n` : ''}
QUESTION: ${question}

Provide a concise, clinically accurate, actionable answer focused on risk management implications.
Keep your response to 2-4 sentences unless the question genuinely requires more detail.
Do not repeat information already covered in your triage analysis unless the question specifically asks for clarification.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const answer = message.content[0].text.trim();

    addAuditEntry({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'vrm_ask',
      resourceType: 'Event',
      resourceRef: eventId || 'unknown',
      detail: `Q: ${question.substring(0, 100)}`,
    });

    res.json({ answer, runId, eventId });
  } catch (err) {
    console.error('POST /api/vrm/ask error:', err.message);
    res.status(500).json({ error: `Agent error: ${err.message}` });
  }
});

module.exports = router;
