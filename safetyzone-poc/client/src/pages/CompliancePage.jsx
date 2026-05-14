import React, { useState } from 'react';

const TODAY = new Date('2026-05-14');

function daysUntil(dateStr) {
  const target = new Date(dateStr);
  return Math.ceil((target - TODAY) / (1000 * 60 * 60 * 24));
}

function DaysBadge({ dateStr }) {
  const d = daysUntil(dateStr);
  let cls = 'px-2 py-0.5 rounded text-xs font-medium ';
  if (d < 0) cls += 'bg-red-100 text-red-700';
  else if (d <= 7) cls += 'bg-red-100 text-red-700';
  else if (d <= 30) cls += 'bg-amber-100 text-amber-700';
  else cls += 'bg-emerald-100 text-emerald-700';
  const label = d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'Today' : `${d}d`;
  return <span className={cls}>{label}</span>;
}

function StatusBadge({ status }) {
  const map = {
    submitted: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-blue-100 text-blue-700',
    not_started: 'bg-slate-100 text-slate-600',
    overdue: 'bg-red-100 text-red-700',
    current: 'bg-emerald-100 text-emerald-700',
    draft: 'bg-amber-100 text-amber-700',
    partial: 'bg-amber-100 text-amber-700',
  };
  const label = status.replace(/_/g, ' ');
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${map[status.toLowerCase()] || 'bg-slate-100 text-slate-600'}`}>
      {label}
    </span>
  );
}

function SectionHeader({ title }) {
  return <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">{title}</h3>;
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

const kpis = [
  { label: 'Overall Readiness', value: 84, trend: '+2% MoM', color: 'emerald' },
  { label: 'CMS PSSM Compliance', value: 71, trend: 'Needs attention', color: 'amber' },
  { label: 'Credential Currency', value: 91, trend: '+1% MoM', color: 'emerald' },
  { label: 'CAPA Closure Rate', value: 68, trend: '-4% MoM', color: 'red' },
];

const overviewDeadlines = [
  { item: 'CMS PSSM Annual Report', due: '2026-06-01', authority: 'CMS', priority: 'high' },
  { item: 'Staff Credential Renewal — Q2', due: '2026-05-31', authority: 'Internal', priority: 'high' },
  { item: 'CAPA #47 Closure', due: '2026-05-28', authority: 'Internal', priority: 'high' },
  { item: 'Joint Commission Survey Readiness', due: '2026-07-15', authority: 'TJC', priority: 'medium' },
  { item: 'PSO Quarterly Submission', due: '2026-06-30', authority: 'AHRQ PSO', priority: 'medium' },
];

const accreditationBars = [
  { name: 'The Joint Commission', pct: 88 },
  { name: 'CMS Conditions of Participation', pct: 74 },
  { name: 'DNV GL Healthcare', pct: 92 },
  { name: 'NIAHO Standards', pct: 81 },
];

const psoBenchmark = [
  { metric: 'Fall Rate (per 1,000 pt-days)', facility: 2.1, national: 1.8, status: 'above' },
  { metric: 'Medication Error Rate', facility: 3.4, national: 3.9, status: 'below' },
  { metric: 'PSSM Event Count (YTD)', facility: 14, national: 11, status: 'above' },
];

function OverviewTab() {
  const colorMap = {
    emerald: { ring: 'ring-emerald-200', text: 'text-emerald-600', bar: 'bg-emerald-500' },
    amber: { ring: 'ring-amber-200', text: 'text-amber-600', bar: 'bg-amber-400' },
    red: { ring: 'ring-red-200', text: 'text-red-600', bar: 'bg-red-500' },
  };
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div>
        <SectionHeader title="Readiness Indicators" />
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((k) => {
            const c = colorMap[k.color];
            return (
              <div key={k.label} className={`bg-white rounded-lg border border-slate-200 ring-1 ${c.ring} p-4`}>
                <div className="text-xs text-slate-500 mb-1">{k.label}</div>
                <div className={`text-3xl font-light ${c.text}`}>{k.value}%</div>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full">
                  <div className={`h-1.5 rounded-full ${c.bar}`} style={{ width: `${k.value}%` }} />
                </div>
                <div className="mt-1.5 text-xs text-slate-400">{k.trend}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div>
          <SectionHeader title="Upcoming Deadlines" />
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Item</th>
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Authority</th>
                  <th className="text-right text-xs text-slate-400 font-medium px-4 py-2.5">Due</th>
                </tr>
              </thead>
              <tbody>
                {overviewDeadlines.map((d, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-700 text-xs">{d.item}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{d.authority}</td>
                    <td className="px-4 py-2.5 text-right">
                      <DaysBadge dateStr={d.due} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accreditation Readiness */}
        <div className="space-y-4">
          <div>
            <SectionHeader title="Accreditation Readiness" />
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
              {accreditationBars.map((a) => {
                const barColor = a.pct >= 90 ? 'bg-emerald-500' : a.pct >= 80 ? 'bg-teal-500' : a.pct >= 70 ? 'bg-amber-400' : 'bg-red-500';
                const textColor = a.pct >= 90 ? 'text-emerald-600' : a.pct >= 80 ? 'text-teal-600' : a.pct >= 70 ? 'text-amber-600' : 'text-red-600';
                return (
                  <div key={a.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-600">{a.name}</span>
                      <span className={`text-xs font-medium ${textColor}`}>{a.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${a.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PSO Benchmarking */}
          <div>
            <SectionHeader title="PSO Benchmarking" />
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-slate-400 font-medium px-4 py-2">Metric</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-2">Facility</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-2">National</th>
                  </tr>
                </thead>
                <tbody>
                  {psoBenchmark.map((p, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-2.5 text-slate-700">{p.metric}</td>
                      <td className={`px-4 py-2.5 text-right font-medium ${p.status === 'above' ? 'text-amber-600' : 'text-emerald-600'}`}>{p.facility}</td>
                      <td className="px-4 py-2.5 text-right text-slate-400">{p.national}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Compliance Calendar ─────────────────────────────────────────────────

const calendarItems = [
  { item: 'Fire Safety Drill Documentation', due: '2026-05-20', type: 'Internal', owner: 'Facilities', framework: 'Life Safety' },
  { item: 'CAPA #47 Root Cause Closure', due: '2026-05-28', type: 'Internal', owner: 'Risk Mgmt', framework: 'CAPA' },
  { item: 'Staff Credential Renewal — Q2', due: '2026-05-31', type: 'Internal', owner: 'HR/Compliance', framework: 'Credentialing' },
  { item: 'CMS PSSM Annual Report', due: '2026-06-01', type: 'Federal', owner: 'CMS', framework: 'CMS CoP' },
  { item: 'Pharmacy Inspection Readiness', due: '2026-06-15', type: 'Accreditation', owner: 'Pharmacy', framework: 'DNV GL' },
  { item: 'PSO Quarterly Submission', due: '2026-06-30', type: 'PSO', owner: 'AHRQ', framework: 'AHRQ PSO' },
  { item: 'Joint Commission Survey Readiness', due: '2026-07-15', type: 'Accreditation', owner: 'TJC', framework: 'TJC' },
  { item: 'HIPAA Annual Training Records', due: '2026-08-31', type: 'Federal', owner: 'Privacy Office', framework: 'HIPAA' },
  { item: 'State Survey Preparation', due: '2026-09-01', type: 'State', owner: 'DOH', framework: 'State Reg.' },
];

const frameworkSummary = [
  { name: 'CMS CoP', items: 3, status: 'In Progress' },
  { name: 'TJC', items: 4, status: 'Prep Phase' },
  { name: 'AHRQ PSO', items: 2, status: 'Scheduled' },
  { name: 'HIPAA / State', items: 3, status: 'On Track' },
];

const immediateAlerts = [
  { title: 'Fire drill documentation due in 6 days', action: 'Upload completed drill report to Document Repository.' },
  { title: 'CAPA #47 closure at risk', action: 'Action plan incomplete — assign responsible party and set milestone dates.' },
];

function CalendarTab() {
  return (
    <div className="space-y-6">
      {/* Alert banners */}
      <div className="space-y-2">
        {immediateAlerts.map((a, i) => (
          <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <span className="text-red-500 text-sm mt-0.5">!</span>
            <div>
              <div className="text-sm font-medium text-red-700">{a.title}</div>
              <div className="text-xs text-red-600 mt-0.5">{a.action}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Deadline table */}
        <div className="col-span-2">
          <SectionHeader title="Upcoming Compliance Deadlines" />
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Deadline</th>
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Framework</th>
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Owner</th>
                  <th className="text-right text-xs text-slate-400 font-medium px-4 py-2.5">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {calendarItems.map((c, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-700 text-xs">{c.item}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{c.framework}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{c.owner}</td>
                    <td className="px-4 py-2.5 text-right">
                      <DaysBadge dateStr={c.due} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Framework summary */}
        <div>
          <SectionHeader title="Framework Summary" />
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
            {frameworkSummary.map((f, i) => (
              <div key={i} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <div className="text-xs font-medium text-slate-700">{f.name}</div>
                  <div className="text-xs text-slate-400">{f.items} items</div>
                </div>
                <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{f.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Audit Checklist ─────────────────────────────────────────────────────

const checklistItems = [
  { item: 'CMS PSSM Policy Review', status: 'done', category: 'Policy' },
  { item: 'Sentinel Event Policy Updated', status: 'done', category: 'Policy' },
  { item: 'Adverse Event Reporting SOP', status: 'done', category: 'Policy' },
  { item: 'Staff Safety Training — Q1', status: 'done', category: 'Training' },
  { item: 'Peer Review Committee Minutes', status: 'done', category: 'Governance' },
  { item: 'Patient Rights Policy Review', status: 'done', category: 'Policy' },
  { item: 'CAPA #47 Root Cause Analysis', status: 'partial', category: 'CAPA' },
  { item: 'CAPA #47 Action Plan', status: 'partial', category: 'CAPA' },
  { item: 'Credential Files — Q2 Renewals', status: 'partial', category: 'HR' },
  { item: 'HIPAA Training Completion', status: 'partial', category: 'Training' },
  { item: 'Fire Drill Documentation', status: 'miss', category: 'Life Safety' },
  { item: 'Pharmacy Inspection Checklist', status: 'miss', category: 'Pharmacy' },
];

const evidenceRequests = [
  { description: 'Staff credential files (15 employees)', requestedBy: 'TJC Survey', due: '2026-06-10' },
  { description: 'PSSM event logs Q1 2026', requestedBy: 'CMS', due: '2026-05-25' },
  { description: 'Infection control records', requestedBy: 'State DOH', due: '2026-07-01' },
  { description: 'Q1 safety event summary', requestedBy: 'AHRQ PSO', due: '2026-06-30' },
  { description: 'Policy manual revision log', requestedBy: 'DNV GL', due: '2026-08-15' },
];

const regSubmissionsSummary = [
  { name: 'CMS PSSM Annual Report', due: '2026-06-01', status: 'in_progress' },
  { name: 'PSO Q1 Submission', due: '2026-06-30', status: 'not_started' },
  { name: 'State Adverse Event Report', due: '2026-05-31', status: 'in_progress' },
  { name: 'HIPAA Breach Notification Log', due: '2026-08-31', status: 'not_started' },
  { name: 'Sentinel Event RCA Report', due: '2026-05-20', status: 'submitted' },
];

function ChecklistIcon({ status }) {
  if (status === 'done') return <span className="text-emerald-500 text-sm">✓</span>;
  if (status === 'partial') return <span className="text-amber-500 text-sm">~</span>;
  return <span className="text-slate-300 text-sm">○</span>;
}

function AuditChecklistTab() {
  const done = checklistItems.filter((c) => c.status === 'done').length;
  const partial = checklistItems.filter((c) => c.status === 'partial').length;
  const miss = checklistItems.filter((c) => c.status === 'miss').length;

  return (
    <div className="space-y-6">
      {/* Progress summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-emerald-600">{done}</div>
          <div className="text-xs text-emerald-600 mt-1">Complete</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-amber-600">{partial}</div>
          <div className="text-xs text-amber-600 mt-1">In Progress</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-slate-500">{miss}</div>
          <div className="text-xs text-slate-500 mt-1">Not Started</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Checklist */}
        <div>
          <SectionHeader title="Audit Readiness Checklist" />
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-50">
            {checklistItems.map((c, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <ChecklistIcon status={c.status} />
                <div className="flex-1 text-xs text-slate-700">{c.item}</div>
                <span className="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{c.category}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Evidence requests */}
          <div>
            <SectionHeader title="Outstanding Evidence Requests" />
            <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-50">
              {evidenceRequests.map((e, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-slate-700">{e.description}</div>
                    <DaysBadge dateStr={e.due} />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Requested by: {e.requestedBy}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory submissions */}
          <div>
            <SectionHeader title="Regulatory Submissions Status" />
            <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-50">
              {regSubmissionsSummary.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div className="text-xs text-slate-700 flex-1 mr-2">{r.name}</div>
                  <div className="flex items-center gap-2">
                    <DaysBadge dateStr={r.due} />
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Document Repository ─────────────────────────────────────────────────

const documents = [
  { name: 'PSSM_Policy_v3.2.pdf', type: 'Policy', uploadedAt: '2026-04-10', status: 'current', size: '284 KB' },
  { name: 'Sentinel_Event_SOP_2026.pdf', type: 'SOP', uploadedAt: '2026-03-15', status: 'current', size: '191 KB' },
  { name: 'CAPA_47_RCA_Draft.docx', type: 'RCA', uploadedAt: '2026-05-01', status: 'draft', size: '97 KB' },
  { name: 'Staff_Training_Q1_2026.xlsx', type: 'Training Records', uploadedAt: '2026-04-30', status: 'current', size: '540 KB' },
  { name: 'Credential_Files_Q2.zip', type: 'HR Records', uploadedAt: '2026-05-10', status: 'partial', size: '2.1 MB' },
  { name: 'Fire_Drill_Report_Apr2026.pdf', type: 'Safety', uploadedAt: '2026-04-25', status: 'current', size: '118 KB' },
  { name: 'PSO_Q1_Template.pdf', type: 'Submission', uploadedAt: '2026-05-05', status: 'draft', size: '74 KB' },
];

function DocumentRepositoryTab() {
  const current = documents.filter((d) => d.status === 'current').length;
  const draft = documents.filter((d) => d.status === 'draft').length;
  const partial = documents.filter((d) => d.status === 'partial').length;

  return (
    <div className="space-y-6">
      {/* Summary counts */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-slate-700">{documents.length}</div>
          <div className="text-xs text-slate-400 mt-1">Total Documents</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-emerald-600">{current}</div>
          <div className="text-xs text-slate-400 mt-1">Current</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-amber-600">{draft + partial}</div>
          <div className="text-xs text-slate-400 mt-1">Draft / Partial</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-teal-600">2026-05-10</div>
          <div className="text-xs text-slate-400 mt-1">Last Upload</div>
        </div>
      </div>

      <div>
        <SectionHeader title="Evidence File Repository" />
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">File Name</th>
                <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Type</th>
                <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Uploaded</th>
                <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Size</th>
                <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Status</th>
                <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">{doc.name.endsWith('.pdf') ? '📄' : doc.name.endsWith('.xlsx') ? '📊' : doc.name.endsWith('.zip') ? '📦' : '📝'}</span>
                      <span className="text-xs text-slate-700 font-medium">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{doc.type}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{doc.uploadedAt}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{doc.size}</td>
                  <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-xs text-teal-600 hover:text-teal-700 hover:underline">View</button>
                      <span className="text-slate-200">|</span>
                      <button className="text-xs text-slate-500 hover:text-slate-700 hover:underline">Upload</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Regulatory Submissions ──────────────────────────────────────────────

const submissions = [
  { name: 'CMS PSSM Annual Report', due: '2026-06-01', status: 'in_progress', agency: 'CMS', ref: 'CMS-2026-PSSM-001' },
  { name: 'AHRQ PSO Q1 Safety Event Summary', due: '2026-06-30', status: 'not_started', agency: 'AHRQ', ref: 'PSO-Q1-2026' },
  { name: 'State Adverse Event Report', due: '2026-05-31', status: 'in_progress', agency: 'State DOH', ref: 'DOH-AE-2026-Q1' },
  { name: 'Sentinel Event RCA #SE-2026-03', due: '2026-05-20', status: 'submitted', agency: 'TJC', ref: 'TJC-SE-2026-03' },
  { name: 'HIPAA Breach Notification Log', due: '2026-08-31', status: 'not_started', agency: 'HHS', ref: 'HIPAA-2026-BN' },
  { name: 'DNV GL Annual Survey Documentation', due: '2026-09-01', status: 'not_started', agency: 'DNV GL', ref: 'DNV-2026-ANNUAL' },
  { name: 'CAPA #47 Closure Report', due: '2026-05-28', status: 'in_progress', agency: 'Internal', ref: 'CAPA-47-2026' },
];

const agencies = [
  { name: 'Centers for Medicare & Medicaid (CMS)', status: 'active' },
  { name: 'AHRQ Patient Safety Organization', status: 'pending' },
  { name: 'The Joint Commission', status: 'active' },
  { name: 'State Dept. of Health', status: 'active' },
];

function RegulatorySubmissionsTab() {
  const counts = {
    submitted: submissions.filter((s) => s.status === 'submitted').length,
    in_progress: submissions.filter((s) => s.status === 'in_progress').length,
    not_started: submissions.filter((s) => s.status === 'not_started').length,
    overdue: submissions.filter((s) => s.status === 'overdue').length,
  };

  return (
    <div className="space-y-6">
      {/* Status counts */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Submitted', count: counts.submitted, color: 'emerald' },
          { label: 'In Progress', count: counts.in_progress, color: 'blue' },
          { label: 'Not Started', count: counts.not_started, color: 'slate' },
          { label: 'Overdue', count: counts.overdue, color: 'red' },
        ].map((s) => {
          const colors = {
            emerald: 'text-emerald-600 border-emerald-200 bg-emerald-50',
            blue: 'text-blue-600 border-blue-200 bg-blue-50',
            slate: 'text-slate-600 border-slate-200 bg-slate-50',
            red: 'text-red-600 border-red-200 bg-red-50',
          };
          return (
            <div key={s.label} className={`border rounded-lg p-4 text-center ${colors[s.color]}`}>
              <div className="text-2xl font-light">{s.count}</div>
              <div className="text-xs mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Submissions table */}
        <div className="col-span-2">
          <SectionHeader title="Regulatory Submission Tracker" />
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Submission</th>
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Agency</th>
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-2.5">Status</th>
                  <th className="text-right text-xs text-slate-400 font-medium px-4 py-2.5">Due</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-700">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.ref}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{s.agency}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-right"><DaysBadge dateStr={s.due} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Connected agencies */}
        <div>
          <SectionHeader title="Connected Regulatory Agencies" />
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
            {agencies.map((a, i) => {
              const dot = a.status === 'active' ? 'bg-emerald-400' : a.status === 'pending' ? 'bg-amber-400' : 'bg-slate-300';
              const label = a.status === 'active' ? 'Connected' : a.status === 'pending' ? 'Pending' : 'Offline';
              const textColor = a.status === 'active' ? 'text-emerald-600' : a.status === 'pending' ? 'text-amber-600' : 'text-slate-400';
              return (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="text-xs text-slate-700">{a.name}</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className={`text-xs ${textColor}`}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'calendar', label: 'Compliance Calendar' },
  { id: 'checklist', label: 'Audit Checklist' },
  { id: 'documents', label: 'Document Repository' },
  { id: 'submissions', label: 'Regulatory Submissions' },
];

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">SafetyZone</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Compliance & Audit Readiness</span>
            </div>
            <h1 className="text-lg font-medium text-slate-800">Compliance Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400">As of {TODAY.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-700 font-medium">84% Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'checklist' && <AuditChecklistTab />}
        {activeTab === 'documents' && <DocumentRepositoryTab />}
        {activeTab === 'submissions' && <RegulatorySubmissionsTab />}
      </div>
    </div>
  );
}
