import React, { useEffect, useMemo, useState } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { accountService } from '../services/account.service';

const ENTITY_LABELS = {
    employees: 'Employees',
    users: 'Accounts',
    leaves: 'Leave',
    corrections: 'Attendance corrections',
    payroll_runs: 'Payroll',
    salary_structures: 'Salary structures',
    exit_records: 'Exits',
    shifts: 'Shifts',
    shift_assignments: 'Shift assignments',
    departments: 'Departments',
    designations: 'Designations',
    leave_types: 'Leave types',
    performance_records: 'Performance',
    company_settings: 'Settings',
    attendance_settings: 'Settings',
    leave_settings: 'Settings',
    payroll_settings: 'Settings',
};
const TONE = { create: 'good', delete: 'urgent', deactivate: 'urgent', disable: 'urgent', 'reset-password': 'attention', 'change-role': 'attention' };

/* Read-only trail of administrative changes: who did what and when. */
export const AuditLogPage = () => {
    const [entries, setEntries] = useState([]);
    const [entity, setEntity] = useState('');
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        accountService.auditLog({ limit: 500 })
            .then(setEntries)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return entries.filter((e) => (!entity || ENTITY_LABELS[e.entity] === entity) && (!q || `${e.actorName} ${e.summary}`.toLowerCase().includes(q)));
    }, [entries, entity, query]);
    const areas = [...new Set(Object.values(ENTITY_LABELS))].sort();

    return (<Card className="p-6">
      <div className="settings-section-head">
        <span className="settings-section-icon"><ScrollText size={20}/></span>
        <div>
          <h3 className="settings-section-title">Audit log</h3>
          <p className="settings-section-sub">Changes to employees, accounts, leave, attendance, payroll and settings. Entries cannot be edited.</p>
        </div>
      </div>

      <div className="table-toolbar">
        <label className="table-search">
          <Search size={16} aria-hidden="true"/>
          <input type="search" placeholder="Search by person or change" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search audit log"/>
        </label>
        <select className="table-select" value={entity} onChange={(e) => setEntity(e.target.value)} aria-label="Filter by area">
          <option value="">All areas</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {error && <p className="app-alert" role="alert">{error}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>Action</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td colSpan={4} className="table-empty">Loading…</td></tr>)}
            {!loading && visible.length === 0 && (<tr><td colSpan={4} className="table-empty">No entries yet.</td></tr>)}
            {visible.map((e) => (<tr key={e.id}>
                <td className="cell-secondary nowrap">{new Date(e.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                  <div className="cell-primary">{e.actorName}</div>
                  <div className="cell-secondary">{e.actorRole}</div>
                </td>
                <td><Badge variant={TONE[e.action] || 'neutral'}>{e.action.replace('-', ' ')}</Badge></td>
                <td>
                  <div>{e.summary}</div>
                  <div className="cell-secondary">{ENTITY_LABELS[e.entity] || e.entity}</div>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </Card>);
};
