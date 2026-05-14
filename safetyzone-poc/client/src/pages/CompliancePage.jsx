import React, { useState } from 'react';

const TODAY = new Date('2026-05-14');

const C = {
  pageBg:      '#F0F4F8',
  cardBg:      '#FFFFFF',
  cardBorder:  '#CBD5E8',
  theadBg:     '#EEF2F8',
  theadTxt:    '#7A92B0',
  rowAlt:      '#F7F9FC',
  rowBorder:   '#EEF2F8',
  cellPrimary: '#0A1628',
  cellBody:    '#4A6080',
  cellMeta:    '#7A92B0',
  divider:     '#EEF2F8',
  pageTitle:   '#0A1628',
  pageSub:     '#4A6080',
  sectionHdr:  '#7A92B0',
  topbarBg:    '#FFFFFF',
  topbarBdr:   '#CBD5E8',
  tabBg:       '#FFFFFF',
  tabBdr:      '#CBD5E8',
  tabActiveTxt:'#1E5FAD',
  tabActiveBdr:'#1E5FAD',
  tabInactTxt: '#4A6080',
  readyBg:     '#E3EEFF',
  readyBdr:    '#CBD5E8',
  readyTxt:    '#1B3A6B',
  readyDot:    '#1E5FAD',
  barTrack:    '#EEF2F8',
  linkTxt:     '#1E5FAD',
  linkHov:     '#1565C0',
  // Functional alert colors (preserved)
  errBg:  '#FEE2E2', errBdr: '#FECACA', errTit: '#991B1B', errTxt: '#B91C1C',
  warnBg: '#FEF3C7', warnBdr:'#FDE68A', warnTxt:'#92400E',
};

// ── Shared helpers ────────────────────────────────────────────────────────────

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - TODAY) / (1000 * 60 * 60 * 24));
}

function DaysBadge({ dateStr }) {
  const d = daysUntil(dateStr);
  let bg, txt;
  if (d < 0)      { bg = C.errBg;  txt = C.errTit; }
  else if (d <= 7) { bg = C.errBg;  txt = C.errTit; }
  else if (d <= 30){ bg = C.warnBg; txt = C.warnTxt; }
  else             { bg = '#E3EEFF'; txt = '#1B3A6B'; }
  const label = d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'Today' : `${d}d`;
  return (
    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: bg, color: txt }}>
      {label}
    </span>
  );
}

const STATUS_MAP = {
  submitted:   { bg: '#E3EEFF', txt: '#1B3A6B' },
  in_progress: { bg: '#DBEAFE', txt: '#1E5FAD' },
  not_started: { bg: '#EEF2F8', txt: '#7A92B0' },
  overdue:     { bg: C.errBg,   txt: C.errTit  },
  current:     { bg: '#E3EEFF', txt: '#1B3A6B' },
  draft:       { bg: C.warnBg,  txt: C.warnTxt },
  partial:     { bg: C.warnBg,  txt: C.warnTxt },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status?.toLowerCase()] || { bg: '#EEF2F8', txt: '#7A92B0' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: s.bg, color: s.txt, textTransform: 'capitalize' }}>
      {(status || '').replace(/_/g, ' ')}
    </span>
  );
}

function SectionHeader({ title }) {
  return (
    <h3 style={{ fontSize: 10, fontWeight: 600, color: C.sectionHdr, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
      {title}
    </h3>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

function TableHead({ cols }) {
  return (
    <thead>
      <tr style={{ background: C.theadBg, borderBottom: `1px solid ${C.cardBorder}` }}>
        {cols.map((h, i) => (
          <th key={i} style={{ padding: '10px 16px', textAlign: h.right ? 'right' : 'left', fontSize: 10, fontWeight: 600, color: C.theadTxt, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {h.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

const kpis = [
  { label: 'Overall Readiness',   value: 84, trend: '+2% MoM',        color: 'blue'  },
  { label: 'CMS PSSM Compliance', value: 71, trend: 'Needs attention', color: 'amber' },
  { label: 'Credential Currency', value: 91, trend: '+1% MoM',        color: 'blue'  },
  { label: 'CAPA Closure Rate',   value: 68, trend: '-4% MoM',        color: 'red'   },
];

const KPI_COLORS = {
  blue:  { ring: '#E3EEFF', text: '#1E5FAD', bar: '#1E5FAD' },
  amber: { ring: C.warnBg,  text: C.warnTxt, bar: '#F59E0B' },
  red:   { ring: C.errBg,   text: C.errTit,  bar: '#EF4444' },
};

const overviewDeadlines = [
  { item: 'CMS PSSM Annual Report',          due: '2026-06-01', authority: 'CMS',      priority: 'high'   },
  { item: 'Staff Credential Renewal — Q2',   due: '2026-05-31', authority: 'Internal', priority: 'high'   },
  { item: 'CAPA #47 Closure',                due: '2026-05-28', authority: 'Internal', priority: 'high'   },
  { item: 'Joint Commission Survey Readiness',due: '2026-07-15', authority: 'TJC',     priority: 'medium' },
  { item: 'PSO Quarterly Submission',         due: '2026-06-30', authority: 'AHRQ PSO',priority: 'medium' },
];

const accreditationBars = [
  { name: 'The Joint Commission',             pct: 88 },
  { name: 'CMS Conditions of Participation',  pct: 74 },
  { name: 'DNV GL Healthcare',                pct: 92 },
  { name: 'NIAHO Standards',                  pct: 81 },
];

const psoBenchmark = [
  { metric: 'Fall Rate (per 1,000 pt-days)', facility: 2.1, national: 1.8, status: 'above' },
  { metric: 'Medication Error Rate',          facility: 3.4, national: 3.9, status: 'below' },
  { metric: 'PSSM Event Count (YTD)',         facility: 14,  national: 11,  status: 'above' },
];

function OverviewTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Cards */}
      <div>
        <SectionHeader title="Readiness Indicators" />
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((k) => {
            const col = KPI_COLORS[k.color];
            return (
              <div key={k.label} style={{ background: C.cardBg, border: `1px solid ${col.ring}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.cellMeta, marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 300, color: col.text }}>{k.value}%</div>
                <div style={{ marginTop: 8, height: 6, background: C.barTrack, borderRadius: 999 }}>
                  <div style={{ height: 6, borderRadius: 999, background: col.bar, width: `${k.value}%` }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: C.cellMeta }}>{k.trend}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div>
          <SectionHeader title="Upcoming Deadlines" />
          <Card>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <TableHead cols={[{ label: 'Item' }, { label: 'Authority' }, { label: 'Due', right: true }]} />
              <tbody>
                {overviewDeadlines.map((d, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : C.rowAlt, borderBottom: `1px solid ${C.rowBorder}` }}>
                    <td style={{ padding: '9px 16px', color: C.cellBody, fontSize: 11 }}>{d.item}</td>
                    <td style={{ padding: '9px 16px', color: C.cellMeta, fontSize: 11 }}>{d.authority}</td>
                    <td style={{ padding: '9px 16px', textAlign: 'right' }}><DaysBadge dateStr={d.due} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Accreditation Readiness */}
          <div>
            <SectionHeader title="Accreditation Readiness" />
            <Card style={{ padding: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {accreditationBars.map((a) => {
                  const barCol  = a.pct >= 90 ? '#1E5FAD' : a.pct >= 80 ? '#1565C0' : a.pct >= 70 ? '#F59E0B' : '#EF4444';
                  const textCol = a.pct >= 90 ? '#1E5FAD' : a.pct >= 80 ? '#1565C0' : a.pct >= 70 ? C.warnTxt  : C.errTit;
                  return (
                    <div key={a.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: C.cellBody }}>{a.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: textCol }}>{a.pct}%</span>
                      </div>
                      <div style={{ height: 6, background: C.barTrack, borderRadius: 999 }}>
                        <div style={{ height: 6, borderRadius: 999, background: barCol, width: `${a.pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* PSO Benchmarking */}
          <div>
            <SectionHeader title="PSO Benchmarking" />
            <Card>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <TableHead cols={[{ label: 'Metric' }, { label: 'Facility', right: true }, { label: 'National', right: true }]} />
                <tbody>
                  {psoBenchmark.map((p, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : C.rowAlt, borderBottom: `1px solid ${C.rowBorder}` }}>
                      <td style={{ padding: '9px 16px', color: C.cellBody }}>{p.metric}</td>
                      <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 600, color: p.status === 'above' ? C.warnTxt : '#1E5FAD' }}>{p.facility}</td>
                      <td style={{ padding: '9px 16px', textAlign: 'right', color: C.cellMeta }}>{p.national}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Compliance Calendar ──────────────────────────────────────────────────

const calendarItems = [
  { item: 'Fire Safety Drill Documentation',   due: '2026-05-20', type: 'Internal',     owner: 'Facilities',    framework: 'Life Safety'  },
  { item: 'CAPA #47 Root Cause Closure',        due: '2026-05-28', type: 'Internal',     owner: 'Risk Mgmt',     framework: 'CAPA'         },
  { item: 'Staff Credential Renewal — Q2',      due: '2026-05-31', type: 'Internal',     owner: 'HR/Compliance', framework: 'Credentialing' },
  { item: 'CMS PSSM Annual Report',             due: '2026-06-01', type: 'Federal',      owner: 'CMS',           framework: 'CMS CoP'      },
  { item: 'Pharmacy Inspection Readiness',      due: '2026-06-15', type: 'Accreditation',owner: 'Pharmacy',      framework: 'DNV GL'       },
  { item: 'PSO Quarterly Submission',           due: '2026-06-30', type: 'PSO',          owner: 'AHRQ',          framework: 'AHRQ PSO'     },
  { item: 'Joint Commission Survey Readiness',  due: '2026-07-15', type: 'Accreditation',owner: 'TJC',           framework: 'TJC'          },
  { item: 'HIPAA Annual Training Records',      due: '2026-08-31', type: 'Federal',      owner: 'Privacy Office',framework: 'HIPAA'        },
  { item: 'State Survey Preparation',           due: '2026-09-01', type: 'State',        owner: 'DOH',           framework: 'State Reg.'   },
];

const frameworkSummary = [
  { name: 'CMS CoP',      items: 3, status: 'In Progress' },
  { name: 'TJC',          items: 4, status: 'Prep Phase'  },
  { name: 'AHRQ PSO',     items: 2, status: 'Scheduled'   },
  { name: 'HIPAA / State',items: 3, status: 'On Track'    },
];

const immediateAlerts = [
  { title: 'Fire drill documentation due in 6 days',      action: 'Upload completed drill report to Document Repository.' },
  { title: 'CAPA #47 closure at risk',                    action: 'Action plan incomplete — assign responsible party and set milestone dates.' },
];

function CalendarTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Alert banners */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {immediateAlerts.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: C.errBg, border: `1px solid ${C.errBdr}`, borderRadius: 10, padding: '12px 16px' }}>
            <span style={{ color: C.errTit, fontSize: 14, marginTop: 1 }}>!</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.errTit }}>{a.title}</div>
              <div style={{ fontSize: 11, color: C.errTxt, marginTop: 2 }}>{a.action}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Deadline table */}
        <div style={{ gridColumn: 'span 2' }}>
          <SectionHeader title="Upcoming Compliance Deadlines" />
          <Card>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <TableHead cols={[{ label: 'Deadline' }, { label: 'Framework' }, { label: 'Owner' }, { label: 'Remaining', right: true }]} />
              <tbody>
                {calendarItems.map((c, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : C.rowAlt, borderBottom: `1px solid ${C.rowBorder}` }}>
                    <td style={{ padding: '9px 16px', color: C.cellBody, fontSize: 11 }}>{c.item}</td>
                    <td style={{ padding: '9px 16px', color: C.cellMeta, fontSize: 11 }}>{c.framework}</td>
                    <td style={{ padding: '9px 16px', color: C.cellMeta, fontSize: 11 }}>{c.owner}</td>
                    <td style={{ padding: '9px 16px', textAlign: 'right' }}><DaysBadge dateStr={c.due} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Framework summary */}
        <div>
          <SectionHeader title="Framework Summary" />
          <Card>
            {frameworkSummary.map((f, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: i < frameworkSummary.length - 1 ? `1px solid ${C.divider}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.cellPrimary }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: C.cellMeta }}>{f.items} items</div>
                </div>
                <span style={{ fontSize: 11, color: '#0288D1', background: '#E3EEFF', padding: '2px 8px', borderRadius: 4 }}>{f.status}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Audit Checklist ──────────────────────────────────────────────────────

const checklistItems = [
  { item: 'CMS PSSM Policy Review',           status: 'done',    category: 'Policy'      },
  { item: 'Sentinel Event Policy Updated',     status: 'done',    category: 'Policy'      },
  { item: 'Adverse Event Reporting SOP',       status: 'done',    category: 'Policy'      },
  { item: 'Staff Safety Training — Q1',        status: 'done',    category: 'Training'    },
  { item: 'Peer Review Committee Minutes',     status: 'done',    category: 'Governance'  },
  { item: 'Patient Rights Policy Review',      status: 'done',    category: 'Policy'      },
  { item: 'CAPA #47 Root Cause Analysis',      status: 'partial', category: 'CAPA'        },
  { item: 'CAPA #47 Action Plan',              status: 'partial', category: 'CAPA'        },
  { item: 'Credential Files — Q2 Renewals',    status: 'partial', category: 'HR'          },
  { item: 'HIPAA Training Completion',         status: 'partial', category: 'Training'    },
  { item: 'Fire Drill Documentation',          status: 'miss',    category: 'Life Safety' },
  { item: 'Pharmacy Inspection Checklist',     status: 'miss',    category: 'Pharmacy'    },
];

const evidenceRequests = [
  { description: 'Staff credential files (15 employees)', requestedBy: 'TJC Survey', due: '2026-06-10' },
  { description: 'PSSM event logs Q1 2026',               requestedBy: 'CMS',        due: '2026-05-25' },
  { description: 'Infection control records',             requestedBy: 'State DOH',  due: '2026-07-01' },
  { description: 'Q1 safety event summary',               requestedBy: 'AHRQ PSO',   due: '2026-06-30' },
  { description: 'Policy manual revision log',            requestedBy: 'DNV GL',     due: '2026-08-15' },
];

const regSubmissionsSummary = [
  { name: 'CMS PSSM Annual Report',      due: '2026-06-01', status: 'in_progress' },
  { name: 'PSO Q1 Submission',           due: '2026-06-30', status: 'not_started' },
  { name: 'State Adverse Event Report',  due: '2026-05-31', status: 'in_progress' },
  { name: 'HIPAA Breach Notification Log',due:'2026-08-31', status: 'not_started' },
  { name: 'Sentinel Event RCA Report',   due: '2026-05-20', status: 'submitted'   },
];

function ChecklistIcon({ status }) {
  if (status === 'done')    return <span style={{ color: '#1E5FAD', fontSize: 14 }}>✓</span>;
  if (status === 'partial') return <span style={{ color: C.warnTxt, fontSize: 14 }}>~</span>;
  return <span style={{ color: '#CBD5E8', fontSize: 14 }}>○</span>;
}

function AuditChecklistTab() {
  const done    = checklistItems.filter((c) => c.status === 'done').length;
  const partial = checklistItems.filter((c) => c.status === 'partial').length;
  const miss    = checklistItems.filter((c) => c.status === 'miss').length;

  const summary = [
    { label: 'Complete',    count: done,    bg: '#E3EEFF', txt: '#1E5FAD', bdr: '#CBD5E8' },
    { label: 'In Progress', count: partial, bg: C.warnBg,  txt: C.warnTxt, bdr: C.warnBdr },
    { label: 'Not Started', count: miss,    bg: '#EEF2F8', txt: '#4A6080', bdr: '#CBD5E8' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Progress summary */}
      <div className="grid grid-cols-3 gap-4">
        {summary.map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.bdr}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 300, color: s.txt }}>{s.count}</div>
            <div style={{ fontSize: 11, color: s.txt, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Checklist */}
        <div>
          <SectionHeader title="Audit Readiness Checklist" />
          <Card>
            {checklistItems.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < checklistItems.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                <ChecklistIcon status={c.status} />
                <div style={{ flex: 1, fontSize: 12, color: C.cellBody }}>{c.item}</div>
                <span style={{ fontSize: 10, color: C.cellMeta, background: C.theadBg, padding: '2px 6px', borderRadius: 4 }}>{c.category}</span>
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Evidence requests */}
          <div>
            <SectionHeader title="Outstanding Evidence Requests" />
            <Card>
              {evidenceRequests.map((e, i) => (
                <div key={i} style={{ padding: '12px 16px', borderBottom: i < evidenceRequests.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 12, color: C.cellBody }}>{e.description}</div>
                    <DaysBadge dateStr={e.due} />
                  </div>
                  <div style={{ fontSize: 11, color: C.cellMeta, marginTop: 2 }}>Requested by: {e.requestedBy}</div>
                </div>
              ))}
            </Card>
          </div>

          {/* Regulatory submissions */}
          <div>
            <SectionHeader title="Regulatory Submissions Status" />
            <Card>
              {regSubmissionsSummary.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < regSubmissionsSummary.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                  <div style={{ fontSize: 12, color: C.cellBody, flex: 1, marginRight: 8 }}>{r.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DaysBadge dateStr={r.due} />
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Document Repository ──────────────────────────────────────────────────

const documents = [
  { name: 'PSSM_Policy_v3.2.pdf',           type: 'Policy',         uploadedAt: '2026-04-10', status: 'current', size: '284 KB' },
  { name: 'Sentinel_Event_SOP_2026.pdf',     type: 'SOP',            uploadedAt: '2026-03-15', status: 'current', size: '191 KB' },
  { name: 'CAPA_47_RCA_Draft.docx',          type: 'RCA',            uploadedAt: '2026-05-01', status: 'draft',   size: '97 KB'  },
  { name: 'Staff_Training_Q1_2026.xlsx',     type: 'Training Records',uploadedAt: '2026-04-30',status: 'current', size: '540 KB' },
  { name: 'Credential_Files_Q2.zip',         type: 'HR Records',     uploadedAt: '2026-05-10', status: 'partial', size: '2.1 MB' },
  { name: 'Fire_Drill_Report_Apr2026.pdf',   type: 'Safety',         uploadedAt: '2026-04-25', status: 'current', size: '118 KB' },
  { name: 'PSO_Q1_Template.pdf',             type: 'Submission',     uploadedAt: '2026-05-05', status: 'draft',   size: '74 KB'  },
];

function fileIcon(name) {
  if (name.endsWith('.pdf'))  return '📄';
  if (name.endsWith('.xlsx')) return '📊';
  if (name.endsWith('.zip'))  return '📦';
  return '📝';
}

function DocumentRepositoryTab() {
  const current = documents.filter((d) => d.status === 'current').length;
  const draft   = documents.filter((d) => d.status === 'draft').length;
  const partial = documents.filter((d) => d.status === 'partial').length;

  const docStats = [
    { label: 'Total Documents', count: documents.length, txt: C.cellPrimary },
    { label: 'Current',         count: current,          txt: '#1E5FAD'     },
    { label: 'Draft / Partial', count: draft + partial,  txt: C.warnTxt     },
    { label: 'Last Upload',     count: '2026-05-10',     txt: '#0288D1'     },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="grid grid-cols-4 gap-4">
        {docStats.map((s) => (
          <div key={s.label} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 300, color: s.txt }}>{s.count}</div>
            <div style={{ fontSize: 11, color: C.cellMeta, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <SectionHeader title="Evidence File Repository" />
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <TableHead cols={[{ label: 'File Name' }, { label: 'Type' }, { label: 'Uploaded' }, { label: 'Size' }, { label: 'Status' }, { label: 'Actions' }]} />
            <tbody>
              {documents.map((doc, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : C.rowAlt, borderBottom: `1px solid ${C.rowBorder}` }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12 }}>{fileIcon(doc.name)}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.cellPrimary }}>{doc.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: C.cellMeta }}>{doc.type}</td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: C.cellMeta }}>{doc.uploadedAt}</td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: C.cellMeta }}>{doc.size}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={doc.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button style={{ fontSize: 11, color: C.linkTxt, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>View</button>
                      <span style={{ color: C.cardBorder }}>|</span>
                      <button style={{ fontSize: 11, color: C.cellMeta, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Upload</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ── Tab: Regulatory Submissions ───────────────────────────────────────────────

const submissions = [
  { name: 'CMS PSSM Annual Report',           due: '2026-06-01', status: 'in_progress', agency: 'CMS',      ref: 'CMS-2026-PSSM-001'  },
  { name: 'AHRQ PSO Q1 Safety Event Summary', due: '2026-06-30', status: 'not_started', agency: 'AHRQ',     ref: 'PSO-Q1-2026'        },
  { name: 'State Adverse Event Report',        due: '2026-05-31', status: 'in_progress', agency: 'State DOH',ref: 'DOH-AE-2026-Q1'     },
  { name: 'Sentinel Event RCA #SE-2026-03',    due: '2026-05-20', status: 'submitted',   agency: 'TJC',      ref: 'TJC-SE-2026-03'     },
  { name: 'HIPAA Breach Notification Log',     due: '2026-08-31', status: 'not_started', agency: 'HHS',      ref: 'HIPAA-2026-BN'      },
  { name: 'DNV GL Annual Survey Documentation',due: '2026-09-01', status: 'not_started', agency: 'DNV GL',   ref: 'DNV-2026-ANNUAL'    },
  { name: 'CAPA #47 Closure Report',           due: '2026-05-28', status: 'in_progress', agency: 'Internal', ref: 'CAPA-47-2026'       },
];

const agencies = [
  { name: 'Centers for Medicare & Medicaid (CMS)', status: 'active'  },
  { name: 'AHRQ Patient Safety Organization',      status: 'pending' },
  { name: 'The Joint Commission',                  status: 'active'  },
  { name: 'State Dept. of Health',                 status: 'active'  },
];

const SUB_STATUS_STYLES = {
  submitted:   { bg: '#E3EEFF', txt: '#1E5FAD', bdr: '#CBD5E8' },
  in_progress: { bg: '#DBEAFE', txt: '#1565C0', bdr: '#CBD5E8' },
  not_started: { bg: '#EEF2F8', txt: '#7A92B0', bdr: '#CBD5E8' },
  overdue:     { bg: C.errBg,   txt: C.errTit,  bdr: C.errBdr  },
};

function RegulatorySubmissionsTab() {
  const counts = {
    submitted:   submissions.filter((s) => s.status === 'submitted').length,
    in_progress: submissions.filter((s) => s.status === 'in_progress').length,
    not_started: submissions.filter((s) => s.status === 'not_started').length,
    overdue:     submissions.filter((s) => s.status === 'overdue').length,
  };

  const statCards = [
    { label: 'Submitted',   count: counts.submitted,   ...SUB_STATUS_STYLES.submitted   },
    { label: 'In Progress', count: counts.in_progress, ...SUB_STATUS_STYLES.in_progress },
    { label: 'Not Started', count: counts.not_started, ...SUB_STATUS_STYLES.not_started },
    { label: 'Overdue',     count: counts.overdue,     ...SUB_STATUS_STYLES.overdue     },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.bdr}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 300, color: s.txt }}>{s.count}</div>
            <div style={{ fontSize: 11, color: s.txt, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Submissions table */}
        <div style={{ gridColumn: 'span 2' }}>
          <SectionHeader title="Regulatory Submission Tracker" />
          <Card>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <TableHead cols={[{ label: 'Submission' }, { label: 'Agency' }, { label: 'Status' }, { label: 'Due', right: true }]} />
              <tbody>
                {submissions.map((s, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : C.rowAlt, borderBottom: `1px solid ${C.rowBorder}` }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 12, color: C.cellBody }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: C.cellMeta, marginTop: 2 }}>{s.ref}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: C.cellMeta }}>{s.agency}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}><DaysBadge dateStr={s.due} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Connected agencies */}
        <div>
          <SectionHeader title="Connected Regulatory Agencies" />
          <Card>
            {agencies.map((a, i) => {
              const dot   = a.status === 'active' ? '#1E5FAD' : a.status === 'pending' ? '#F59E0B' : '#CBD5E8';
              const txt   = a.status === 'active' ? '#1E5FAD' : a.status === 'pending' ? C.warnTxt : C.cellMeta;
              const label = a.status === 'active' ? 'Connected' : a.status === 'pending' ? 'Pending' : 'Offline';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < agencies.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                  <div style={{ fontSize: 12, color: C.cellBody }}>{a.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: txt }}>{label}</span>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',     label: 'Overview'                },
  { id: 'calendar',     label: 'Compliance Calendar'     },
  { id: 'checklist',    label: 'Audit Checklist'         },
  { id: 'documents',    label: 'Document Repository'     },
  { id: 'submissions',  label: 'Regulatory Submissions'  },
];

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.pageBg, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: C.topbarBg, borderBottom: `1px solid ${C.topbarBdr}`, padding: '16px 24px', flexShrink: 0 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.cellMeta, textTransform: 'uppercase', letterSpacing: '0.07em' }}>SafetyZone</span>
              <span style={{ color: C.cardBorder }}>·</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.cellMeta, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Compliance &amp; Audit Readiness</span>
            </div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: C.pageTitle, margin: 0 }}>Compliance Dashboard</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: C.cellMeta }}>
              As of {TODAY.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.readyBg, border: `1px solid ${C.readyBdr}`, borderRadius: 999, padding: '4px 12px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.readyDot, display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.readyTxt }}>84% Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: C.tabBg, borderBottom: `1px solid ${C.tabBdr}`, padding: '0 24px', flexShrink: 0 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 0 }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px', fontSize: 13, fontWeight: 500, border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? C.tabActiveBdr : 'transparent'}`,
                color: activeTab === tab.id ? C.tabActiveTxt : C.tabInactTxt,
                background: 'transparent', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {activeTab === 'overview'     && <OverviewTab />}
          {activeTab === 'calendar'     && <CalendarTab />}
          {activeTab === 'checklist'    && <AuditChecklistTab />}
          {activeTab === 'documents'    && <DocumentRepositoryTab />}
          {activeTab === 'submissions'  && <RegulatorySubmissionsTab />}
        </div>
      </div>
    </div>
  );
}
