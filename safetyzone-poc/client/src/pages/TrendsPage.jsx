import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import apiClient from '../api/client';

// ── Palette ───────────────────────────────────────────────────────────────────
const SEV_COLOR = {
  death:    '#1e293b',
  severe:   '#dc2626',
  moderate: '#f97316',
  mild:     '#eab308',
  no_harm:  '#22c55e',
};
const SEV_LABEL = {
  death:    'Death',
  severe:   'Severe Harm',
  moderate: 'Moderate Harm',
  mild:     'Mild Harm',
  no_harm:  'No Harm',
};
const CHART_COLORS = [
  '#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#06b6d4','#84cc16','#f97316','#ec4899',
  '#14b8a6','#a855f7',
];

// ── Shared tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-medium text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-800">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── Section card wrapper ───────────────────────────────────────────────────────
function Card({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="text-sm font-medium text-slate-800">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── KPI chip ──────────────────────────────────────────────────────────────────
function KpiChip({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

// ── Horizontal bar (simple, no recharts) ──────────────────────────────────────
function HBar({ label, count, max, color, rank }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-4 text-xs text-slate-300 text-right flex-shrink-0">{rank}</span>
      <div className="w-36 text-xs text-slate-600 truncate flex-shrink-0" title={label}>{label}</div>
      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-10 text-xs text-slate-500 text-right flex-shrink-0">{count.toLocaleString()}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TrendsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [crossTab, setCrossTab] = useState('sevByLoc'); // sevByLoc | cfBySev

  useEffect(() => {
    apiClient.get('/trends')
      .then(({ data }) => { setData(data); setLoading(false); })
      .catch((err) => { setError(err.response?.data?.error || 'Failed to load trend data'); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading trend data…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-lg">{error}</p>
    </div>
  );

  const { bySeverity, byCFCode, byLocation, byContributingFactor,
          severityByLocation, cfCodeBySeverity, monthlyTrend, meta } = data;

  const totalHarm     = bySeverity.filter((s) => ['death','severe','moderate'].includes(s.key)).reduce((n, s) => n + s.count, 0);
  const totalNoHarm   = bySeverity.find((s) => s.key === 'no_harm')?.count || 0;
  const totalEvents   = meta.totalEvents;
  const harmRate      = totalEvents > 0 ? Math.round((totalHarm / totalEvents) * 100) : 0;
  const topLocation   = byLocation[0]?.label || '—';
  const topCF         = byContributingFactor[0]?.label || '—';

  const sevKeys = ['severe','moderate','mild','no_harm','death'];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm font-medium text-slate-800">Trend Analysis</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {totalEvents.toLocaleString()} events · updated {new Date(meta.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-700">Live · SafetyZone DB</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── KPI row ── */}
          <div className="grid grid-cols-5 gap-4">
            <KpiChip label="Total Events"          value={totalEvents.toLocaleString()}  color="text-indigo-600" />
            <KpiChip label="Events with Harm"      value={totalHarm.toLocaleString()}    color="text-red-500" />
            <KpiChip label="No Harm / Near Miss"   value={totalNoHarm.toLocaleString()}  color="text-emerald-600" />
            <KpiChip label="Harm Rate"             value={`${harmRate}%`}               color="text-amber-500" />
            <KpiChip label="Top Risk Location"     value={topLocation}                   color="text-slate-700" />
          </div>

          {/* ── Row 1: Harm Scale + Monthly Trend ── */}
          <div className="grid grid-cols-5 gap-6">

            {/* Harm Scale pie + bar */}
            <Card title="Harm Scale" subtitle="Events by severity level" className="col-span-2">
              <div className="flex gap-6 items-center">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={bySeverity} dataKey="count" nameKey="label" cx="50%" cy="50%"
                      innerRadius={45} outerRadius={72} paddingAngle={2}>
                      {bySeverity.map((s) => (
                        <Cell key={s.key} fill={SEV_COLOR[s.key] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => v.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {bySeverity.map((s) => (
                    <div key={s.key} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: SEV_COLOR[s.key] || '#94a3b8' }} />
                        <span className="text-xs text-slate-600">{s.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{s.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Monthly trend line */}
            <Card title="Monthly Trend" subtitle="Events over time by harm scale" className="col-span-3">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  {sevKeys.filter((k) => bySeverity.find((s) => s.key === k)).map((k) => (
                    <Line key={k} type="monotone" dataKey={k} name={SEV_LABEL[k]}
                      stroke={SEV_COLOR[k]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* ── Row 2: Event Type + Location + Contributing Factors ── */}
          <div className="grid grid-cols-3 gap-6">

            {/* Event Type */}
            <Card title="Event Type" subtitle="Top 10 by CF code">
              <div className="space-y-1">
                {byCFCode.map((d, i) => (
                  <HBar key={d.label} label={d.label} count={d.count}
                    max={byCFCode[0]?.count || 1} color={CHART_COLORS[i % CHART_COLORS.length]} rank={i + 1} />
                ))}
              </div>
            </Card>

            {/* Location */}
            <Card title="Location" subtitle="Top 10 units by event volume">
              <div className="space-y-1">
                {byLocation.map((d, i) => (
                  <HBar key={d.label} label={d.label} count={d.count}
                    max={byLocation[0]?.count || 1} color={CHART_COLORS[i % CHART_COLORS.length]} rank={i + 1} />
                ))}
              </div>
            </Card>

            {/* Contributing Factors */}
            <Card title="Contributing Factors" subtitle="Top 12 individual factors">
              <div className="space-y-1">
                {byContributingFactor.map((d, i) => (
                  <HBar key={d.label} label={d.label} count={d.count}
                    max={byContributingFactor[0]?.count || 1} color={CHART_COLORS[i % CHART_COLORS.length]} rank={i + 1} />
                ))}
              </div>
            </Card>
          </div>

          {/* ── Row 3: Cross-reference ── */}
          <Card
            title="Cross-Reference Analysis"
            subtitle="Intersect two dimensions to identify risk concentration"
          >
            {/* Tab switcher */}
            <div className="flex gap-2 mb-5">
              {[
                { id: 'sevByLoc', label: 'Harm Scale × Location' },
                { id: 'cfBySev',  label: 'Event Type × Harm Scale' },
              ].map((t) => (
                <button key={t.id} onClick={() => setCrossTab(t.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    crossTab === t.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Harm Scale × Location */}
            {crossTab === 'sevByLoc' && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={severityByLocation} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="location" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false}
                    axisLine={false} angle={-25} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  {sevKeys.filter((k) => bySeverity.find((s) => s.key === k)).map((k) => (
                    <Bar key={k} dataKey={k} name={SEV_LABEL[k]} stackId="a"
                      fill={SEV_COLOR[k]} radius={k === 'death' ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Event Type × Harm Scale */}
            {crossTab === 'cfBySev' && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cfCodeBySeverity} layout="vertical"
                  margin={{ top: 4, right: 30, left: 60, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="cfCode" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  {sevKeys.filter((k) => bySeverity.find((s) => s.key === k)).map((k) => (
                    <Bar key={k} dataKey={k} name={SEV_LABEL[k]} stackId="a" fill={SEV_COLOR[k]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* ── Row 4: Contributing Factors × Harm Scale stacked bar ── */}
          <Card
            title="Contributing Factors × Harm Scale"
            subtitle="Which factors drive the most harmful events"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={byContributingFactor.slice(0, 10).map((cf) => {
                  const entry = { factor: cf.label, total: cf.count };
                  return entry;
                })}
                layout="vertical"
                margin={{ top: 4, right: 30, left: 120, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="factor" tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false} axisLine={false} width={115} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Events" radius={[0, 4, 4, 0]}>
                  {byContributingFactor.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                  <LabelList dataKey="total" position="right" style={{ fontSize: 10, fill: '#64748b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

        </div>
      </div>
    </div>
  );
}
