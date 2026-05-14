import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import apiClient from '../api/client';

// ── Color tokens (matches DashboardPage palette) ──────────────────────────────
const C = {
  pageBg:       '#F0F4F8',
  navy:         '#0A1628',
  cardBg:       '#FFFFFF',
  cardBorder:   '#CBD5E8',
  cardHeaderBg: '#F7F9FC',
  cardTitle:    '#0A1628',
  cardBody:     '#4A6080',
  footerBg:     '#EEF2F8',
  footerTxt:    '#7A92B0',
  kpiLabel:     '#7A92B0',
  rankNum:      '#CBD5E8',
  barTrack:     '#EEF2F8',
  barCount:     '#4A6080',
  barLabel:     '#4A6080',
  gridLine:     '#EEF2F8',
  axisLabel:    '#7A92B0',
  axisLabelDk:  '#4A6080',
  tooltipBdr:   '#CBD5E8',
  tooltipTitle: '#0A1628',
  tooltipVal:   '#0A1628',
  tooltipMeta:  '#4A6080',
  tabActive:    '#1E5FAD',
  tabActiveTxt: '#FFFFFF',
  tabInactive:  '#EEF2F8',
  tabInactTxt:  '#4A6080',
  liveDot:      '#00E5C3',
  liveBg:       'rgba(0,229,195,0.08)',
  liveBdr:      'rgba(0,229,195,0.25)',
  liveTxt:      '#006064',
  errorTxt:     '#1565C0',
  errorBg:      '#E3EEFF',
  errorBdr:     '#CBD5E8',
  spinRing:     '#E3EEFF',
  spinHead:     '#1E5FAD',
  headerBorder: '#CBD5E8',
  headerBg:     '#FFFFFF',
};

// ── Harm-scale blue gradient — darkest (death) → lightest (no_harm) ───────────
const SEV_COLOR = {
  death:    '#0A1628',
  severe:   '#1565C0',
  moderate: '#1E5FAD',
  mild:     '#4A90D9',
  no_harm:  '#90CAF9',
};
const SEV_LABEL = {
  death:    'Death',
  severe:   'Severe Harm',
  moderate: 'Moderate Harm',
  mild:     'Mild Harm',
  no_harm:  'No Harm',
};

// ── Blue chart palette for categorical data ───────────────────────────────────
const CHART_COLORS = [
  '#1E5FAD','#1565C0','#0288D1','#1B3A6B',
  '#01579B','#283593','#0277BD','#006064',
  '#0D47A1','#1A237E','#004D99','#003D7A',
];

// ── KPI value colors (alternating two blues) ──────────────────────────────────
const KPI_COLORS = ['#1E5FAD','#1565C0','#0288D1','#1B3A6B','#01579B'];

// ── Shared tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.cardBg,
      border: `1px solid ${C.tooltipBdr}`,
      borderRadius: 10,
      boxShadow: '0 4px 16px rgba(10,22,40,0.10)',
      padding: '10px 14px',
      fontSize: 11,
    }}>
      <p style={{ fontWeight: 600, color: C.tooltipTitle, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: p.color }} />
          <span style={{ color: C.tooltipMeta }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: C.tooltipVal }}>{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Card({ title, subtitle, children, className = '' }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}
      className={className}>
      <div style={{ borderBottom: `1px solid ${C.cardBorder}`, background: C.cardHeaderBg, padding: '14px 24px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.cardTitle, margin: 0 }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11, color: C.cardBody, marginTop: 2, margin: 0 }}>{subtitle}</p>}
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

// ── KPI chip ──────────────────────────────────────────────────────────────────
function KpiChip({ label, value, valueColor }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: '16px 20px' }}>
      <p style={{ fontSize: 22, fontWeight: 700, color: valueColor, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 11, color: C.kpiLabel, marginTop: 5, margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

// ── Horizontal bar ────────────────────────────────────────────────────────────
function HBar({ label, count, max, color, rank }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 5, paddingBottom: 5 }}>
      <span style={{ width: 16, fontSize: 10, color: C.rankNum, textAlign: 'right', flexShrink: 0 }}>{rank}</span>
      <div style={{ width: 144, fontSize: 11, color: C.axisLabelDk, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>{label}</div>
      <div style={{ flex: 1, background: C.barTrack, borderRadius: 999, height: 9, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: color, transition: 'width 0.3s' }} />
      </div>
      <span style={{ width: 38, fontSize: 11, color: C.barCount, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>{count.toLocaleString()}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TrendsPage() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [crossTab, setCrossTab] = useState('sevByLoc');

  useEffect(() => {
    apiClient.get('/trends')
      .then(({ data }) => { setData(data); setLoading(false); })
      .catch((err) => { setError(err.response?.data?.error || 'Failed to load trend data'); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.pageBg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: `4px solid ${C.spinRing}`, borderTopColor: C.spinHead, borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 13, color: C.cardBody }}>Loading trend data…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.pageBg }}>
      <p style={{ fontSize: 13, color: C.errorTxt, background: C.errorBg, border: `1px solid ${C.errorBdr}`, padding: '8px 16px', borderRadius: 8 }}>{error}</p>
    </div>
  );

  const { bySeverity, byCFCode, byLocation, byContributingFactor,
          severityByLocation, cfCodeBySeverity, monthlyTrend, meta } = data;

  const totalHarm   = bySeverity.filter((s) => ['death','severe','moderate'].includes(s.key)).reduce((n, s) => n + s.count, 0);
  const totalNoHarm = bySeverity.find((s) => s.key === 'no_harm')?.count || 0;
  const totalEvents = meta.totalEvents;
  const harmRate    = totalEvents > 0 ? Math.round((totalHarm / totalEvents) * 100) : 0;
  const topLocation = byLocation[0]?.label || '—';

  const sevKeys = ['severe','moderate','mild','no_harm','death'];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: C.pageBg }}>

      {/* ── Header ── */}
      <div style={{
        background: C.headerBg,
        borderBottom: `1px solid ${C.headerBorder}`,
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.cardTitle, margin: 0 }}>Trend Analysis</p>
          <p style={{ fontSize: 11, color: C.cardBody, marginTop: 2 }}>
            {totalEvents.toLocaleString()} events · updated {new Date(meta.generatedAt).toLocaleString()}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: C.liveBg, border: `1px solid ${C.liveBdr}`,
          padding: '5px 12px', borderRadius: 999,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.liveDot }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.liveTxt }}>Live · SafetyZone DB</span>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }} className="space-y-6">

          {/* KPI row */}
          <div className="grid grid-cols-5 gap-4">
            <KpiChip label="Total Events"        value={totalEvents.toLocaleString()}  valueColor={KPI_COLORS[0]} />
            <KpiChip label="Events with Harm"    value={totalHarm.toLocaleString()}    valueColor={KPI_COLORS[1]} />
            <KpiChip label="No Harm / Near Miss" value={totalNoHarm.toLocaleString()}  valueColor={KPI_COLORS[2]} />
            <KpiChip label="Harm Rate"           value={`${harmRate}%`}               valueColor={KPI_COLORS[3]} />
            <KpiChip label="Top Risk Location"   value={topLocation}                   valueColor={KPI_COLORS[4]} />
          </div>

          {/* Row 1: Harm Scale pie + Monthly trend */}
          <div className="grid grid-cols-5 gap-6">

            <Card title="Harm Scale" subtitle="Events by severity level" className="col-span-2">
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={bySeverity} dataKey="count" nameKey="label" cx="50%" cy="50%"
                      innerRadius={45} outerRadius={72} paddingAngle={2}>
                      {bySeverity.map((s) => (
                        <Cell key={s.key} fill={SEV_COLOR[s.key] || C.cardBorder} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => v.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }} className="space-y-2">
                  {bySeverity.map((s) => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: SEV_COLOR[s.key] || C.cardBorder }} />
                        <span style={{ fontSize: 11, color: C.axisLabelDk }}>{s.label}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.cardTitle }}>{s.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Monthly Trend" subtitle="Events over time by harm scale" className="col-span-3">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.axisLabel }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: C.axisLabel }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: C.cardBody }} />
                  {sevKeys.filter((k) => bySeverity.find((s) => s.key === k)).map((k) => (
                    <Line key={k} type="monotone" dataKey={k} name={SEV_LABEL[k]}
                      stroke={SEV_COLOR[k]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Row 2: Event Type + Location + Contributing Factors */}
          <div className="grid grid-cols-3 gap-6">
            <Card title="Event Type" subtitle="Top 10 by CF code">
              <div className="space-y-1">
                {byCFCode.map((d, i) => (
                  <HBar key={d.label} label={d.label} count={d.count}
                    max={byCFCode[0]?.count || 1} color={CHART_COLORS[i % CHART_COLORS.length]} rank={i + 1} />
                ))}
              </div>
            </Card>

            <Card title="Location" subtitle="Top 10 units by event volume">
              <div className="space-y-1">
                {byLocation.map((d, i) => (
                  <HBar key={d.label} label={d.label} count={d.count}
                    max={byLocation[0]?.count || 1} color={CHART_COLORS[i % CHART_COLORS.length]} rank={i + 1} />
                ))}
              </div>
            </Card>

            <Card title="Contributing Factors" subtitle="Top 12 individual factors">
              <div className="space-y-1">
                {byContributingFactor.map((d, i) => (
                  <HBar key={d.label} label={d.label} count={d.count}
                    max={byContributingFactor[0]?.count || 1} color={CHART_COLORS[i % CHART_COLORS.length]} rank={i + 1} />
                ))}
              </div>
            </Card>
          </div>

          {/* Row 3: Cross-reference */}
          <Card title="Cross-Reference Analysis" subtitle="Intersect two dimensions to identify risk concentration">

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'sevByLoc', label: 'Harm Scale × Location' },
                { id: 'cfBySev',  label: 'Event Type × Harm Scale' },
              ].map((t) => (
                <button key={t.id} onClick={() => setCrossTab(t.id)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    background: crossTab === t.id ? C.tabActive    : C.tabInactive,
                    color:      crossTab === t.id ? C.tabActiveTxt : C.tabInactTxt,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {crossTab === 'sevByLoc' && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={severityByLocation} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                  <XAxis dataKey="location" tick={{ fontSize: 10, fill: C.axisLabelDk }} tickLine={false}
                    axisLine={false} angle={-25} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: C.axisLabel }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: C.cardBody }} />
                  {sevKeys.filter((k) => bySeverity.find((s) => s.key === k)).map((k) => (
                    <Bar key={k} dataKey={k} name={SEV_LABEL[k]} stackId="a"
                      fill={SEV_COLOR[k]} radius={k === 'death' ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}

            {crossTab === 'cfBySev' && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cfCodeBySeverity} layout="vertical"
                  margin={{ top: 4, right: 30, left: 60, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: C.axisLabel }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="cfCode" tick={{ fontSize: 10, fill: C.axisLabelDk }}
                    tickLine={false} axisLine={false} width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: C.cardBody }} />
                  {sevKeys.filter((k) => bySeverity.find((s) => s.key === k)).map((k) => (
                    <Bar key={k} dataKey={k} name={SEV_LABEL[k]} stackId="a" fill={SEV_COLOR[k]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Row 4: Contributing Factors × Harm Scale */}
          <Card title="Contributing Factors × Harm Scale" subtitle="Which factors drive the most harmful events">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={byContributingFactor.slice(0, 10).map((cf) => ({ factor: cf.label, total: cf.count }))}
                layout="vertical"
                margin={{ top: 4, right: 30, left: 120, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: C.axisLabel }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="factor" tick={{ fontSize: 10, fill: C.axisLabelDk }}
                  tickLine={false} axisLine={false} width={115} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Events" radius={[0, 4, 4, 0]}>
                  {byContributingFactor.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                  <LabelList dataKey="total" position="right"
                    style={{ fontSize: 10, fill: C.barLabel, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

        </div>
      </div>

      {/* spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
