'use strict';

const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

const SEVERITY_ORDER = ['death', 'severe', 'moderate', 'mild', 'no_harm'];
const SEVERITY_LABEL = { death: 'Death', severe: 'Severe Harm', moderate: 'Moderate Harm', mild: 'Mild Harm', no_harm: 'No Harm / Near Miss' };

// GET /api/trends — aggregated trend data for the dashboard
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    const [sevRes, cfCodeRes, locationRes, cfFactorRes, crossSevLocRes, crossCFSevRes, monthlyRes] =
      await Promise.all([

        // Harm Scale (Severity)
        pool.request().query(`
          SELECT Severity, COUNT(*) AS cnt
          FROM synthetic_safety_events
          GROUP BY Severity
          ORDER BY cnt DESC
        `),

        // Event Type (CF_Code)
        pool.request().query(`
          SELECT CF_Code, COUNT(*) AS cnt
          FROM synthetic_safety_events
          WHERE CF_Code IS NOT NULL AND CF_Code != ''
          GROUP BY CF_Code
          ORDER BY cnt DESC
        `),

        // Location
        pool.request().query(`
          SELECT Location_Unit, COUNT(*) AS cnt
          FROM synthetic_safety_events
          WHERE Location_Unit IS NOT NULL AND Location_Unit != ''
          GROUP BY Location_Unit
          ORDER BY cnt DESC
        `),

        // Contributing Factors (pipe-separated — split and count each)
        pool.request().query(`
          SELECT LTRIM(RTRIM(value)) AS factor, COUNT(*) AS cnt
          FROM synthetic_safety_events
          CROSS APPLY STRING_SPLIT(Contributing_Factors, '|')
          WHERE Contributing_Factors IS NOT NULL AND Contributing_Factors != ''
            AND LTRIM(RTRIM(value)) != ''
          GROUP BY LTRIM(RTRIM(value))
          ORDER BY cnt DESC
        `),

        // Cross-ref: Harm Scale × Location (top 6 locations)
        pool.request().query(`
          SELECT TOP 120
            Severity,
            Location_Unit,
            COUNT(*) AS cnt
          FROM synthetic_safety_events
          WHERE Location_Unit IS NOT NULL
          GROUP BY Severity, Location_Unit
          ORDER BY cnt DESC
        `),

        // Cross-ref: Event Type × Harm Scale (top 8 CF codes)
        pool.request().query(`
          SELECT CF_Code, Severity, COUNT(*) AS cnt
          FROM synthetic_safety_events
          WHERE CF_Code IS NOT NULL AND CF_Code != ''
          GROUP BY CF_Code, Severity
          ORDER BY CF_Code, cnt DESC
        `),

        // Monthly trend by Harm Scale (last 18 months)
        pool.request().query(`
          SELECT
            FORMAT(Detected_At, 'yyyy-MM') AS month,
            Severity,
            COUNT(*) AS cnt
          FROM synthetic_safety_events
          WHERE Detected_At >= DATEADD(MONTH, -18, GETDATE())
          GROUP BY FORMAT(Detected_At, 'yyyy-MM'), Severity
          ORDER BY month ASC
        `),
      ]);

    // ── Severity (Harm Scale) ─────────────────────────────────────────────────
    const bySeverity = SEVERITY_ORDER
      .map((s) => {
        const row = sevRes.recordset.find((r) => r.Severity === s);
        return { key: s, label: SEVERITY_LABEL[s] || s, count: row?.cnt || 0 };
      })
      .filter((s) => s.count > 0);

    // ── CF_Code (Event Type) — top 10 ─────────────────────────────────────────
    const byCFCode = cfCodeRes.recordset.slice(0, 10).map((r) => ({
      label: r.CF_Code,
      count: r.cnt,
    }));

    // ── Location — top 10 ────────────────────────────────────────────────────
    const byLocation = locationRes.recordset.slice(0, 10).map((r) => ({
      label: r.Location_Unit,
      count: r.cnt,
    }));

    // ── Contributing Factors — top 12 ────────────────────────────────────────
    const byContributingFactor = cfFactorRes.recordset.slice(0, 12).map((r) => ({
      label: r.factor,
      count: r.cnt,
    }));

    // ── Cross-ref: Harm Scale × Location ─────────────────────────────────────
    // Top 6 locations, all severities
    const topLocations = locationRes.recordset.slice(0, 6).map((r) => r.Location_Unit);
    const severityByLocation = topLocations.map((loc) => {
      const entry = { location: loc };
      SEVERITY_ORDER.forEach((sev) => {
        const row = crossSevLocRes.recordset.find((r) => r.Severity === sev && r.Location_Unit === loc);
        entry[sev] = row?.cnt || 0;
      });
      return entry;
    });

    // ── Cross-ref: Event Type × Harm Scale ───────────────────────────────────
    const topCFCodes = cfCodeRes.recordset.slice(0, 8).map((r) => r.CF_Code);
    const cfCodeBySeverity = topCFCodes.map((cf) => {
      const entry = { cfCode: cf };
      SEVERITY_ORDER.forEach((sev) => {
        const row = crossCFSevRes.recordset.find((r) => r.CF_Code === cf && r.Severity === sev);
        entry[sev] = row?.cnt || 0;
      });
      return entry;
    });

    // ── Monthly trend ─────────────────────────────────────────────────────────
    const months = [...new Set(monthlyRes.recordset.map((r) => r.month))].sort();
    const monthlyTrend = months.map((month) => {
      const entry = { month };
      SEVERITY_ORDER.forEach((sev) => {
        const row = monthlyRes.recordset.find((r) => r.month === month && r.Severity === sev);
        entry[sev] = row?.cnt || 0;
      });
      entry.total = SEVERITY_ORDER.reduce((s, k) => s + (entry[k] || 0), 0);
      return entry;
    });

    res.json({
      bySeverity,
      byCFCode,
      byLocation,
      byContributingFactor,
      severityByLocation,
      cfCodeBySeverity,
      monthlyTrend,
      meta: {
        totalEvents: sevRes.recordset.reduce((s, r) => s + r.cnt, 0),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('GET /api/trends error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
