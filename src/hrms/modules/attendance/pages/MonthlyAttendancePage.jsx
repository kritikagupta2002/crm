import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ChevronLeft, ChevronRight, Search, Building2, UserCheck, CalendarOff, Clock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { storage } from '@/core/storage/storage';
import { getEmployeeProject, STANDARD_PROJECTS } from '@/core/constants/projects';
import { downloadCsv } from '../../../../shared/utils/exportCsv';
import { todayIso } from '@/modules/attendance/utils/punch';
import { weeklyOffFor } from '@/modules/attendance/utils/weeklyOff';
import { NATIONAL_HOLIDAYS_2026 } from '@/modules/leave/utils/workingDays';

const CELL = {
    P: { title: 'Present', bg: 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/70 dark:text-emerald-300' },
    L: { title: 'Late', bg: 'bg-amber-100 text-amber-700 font-bold dark:bg-amber-950/70 dark:text-amber-300' },
    A: { title: 'Absent', bg: 'bg-rose-100 text-rose-700 font-bold dark:bg-rose-950/70 dark:text-rose-300' },
    LV: { title: 'Leave', bg: 'bg-purple-100 text-purple-700 font-bold dark:bg-purple-950/70 dark:text-purple-300' },
    WO: { title: 'Weekly off', bg: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
    H: { title: 'Holiday', bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300' },
    '-': { title: 'No entry', bg: 'text-slate-300 dark:text-slate-600' },
};
const STATUS_CODE = { Present: 'P', Late: 'L', Absent: 'A', 'On Leave': 'LV' };
const pad = (n) => String(n).padStart(2, '0');

/* One row per person for the month, from the attendance register, their weekly off and the holidays. */
export const MonthlyAttendancePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const isEmp = currentRole === 'employee' || user?.role === 'employee';
    const empId = user?.employeeId ?? '';
    const rawEmployees = storage.getEmployees();
    // An employee sees only their own row.
    const employees = useMemo(() => (isEmp ? rawEmployees.filter((e) => e.employeeId === empId) : rawEmployees), [isEmp, empId, rawEmployees]);
    const today = todayIso();
    const [monthKey, setMonthKey] = useState(today.slice(0, 7));
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [year, month] = monthKey.split('-').map(Number);
    const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const days = Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => i + 1);
    const shiftMonth = (delta) => {
        const d = new Date(year, month - 1 + delta, 1);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        if (key <= today.slice(0, 7)) setMonthKey(key);
    };

    const filteredEmployees = employees.filter((emp) => {
        if (!isEmp) {
            if (selectedDept !== 'all' && emp.employment.department !== selectedDept)
                return false;
            if (selectedProject !== 'all' && getEmployeeProject(emp) !== selectedProject)
                return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            if (!emp.name.toLowerCase().includes(q) && !emp.employeeId.toLowerCase().includes(q))
                return false;
        }
        return true;
    });

    const rows = useMemo(() => {
        const attendance = storage.getAttendance().filter((a) => a.date.startsWith(monthKey));
        const companyHolidays = (storage.getLeaveSettings()?.companyHolidays || []).map((h) => (typeof h === 'string' ? h : h?.date));
        return filteredEmployees.map((emp) => {
            const offDays = weeklyOffFor(emp.employeeId);
            const mine = new Map(attendance.filter((a) => a.employeeId === emp.employeeId).map((a) => [a.date, a]));
            const cells = days.map((day) => {
                const iso = `${monthKey}-${pad(day)}`;
                const rec = mine.get(iso);
                if (rec && STATUS_CODE[rec.status]) return STATUS_CODE[rec.status];
                if (iso > today) return '-';
                if (NATIONAL_HOLIDAYS_2026.includes(iso) || companyHolidays.includes(iso)) return 'H';
                if (offDays.includes(new Date(year, month - 1, day).getDay())) return 'WO';
                return '-';
            });
            const count = (code) => cells.filter((c) => c === code).length;
            return { emp, cells, present: count('P') + count('L'), late: count('L'), absent: count('A'), leave: count('LV'), off: count('WO') };
        });
    }, [filteredEmployees, monthKey, days, today, year, month]);
    const mine = isEmp ? rows[0] : null;

    const exportMonth = () => downloadCsv(`Attendance_${monthKey}.csv`, [
        { label: 'Employee ID', value: (r) => r.emp.employeeId },
        { label: 'Name', value: (r) => r.emp.name },
        { label: 'Department', value: (r) => r.emp.employment?.department },
        ...days.map((d, i) => ({ label: String(d), value: (r) => r.cells[i] })),
        { label: 'Present', value: (r) => r.present },
        { label: 'Late', value: (r) => r.late },
        { label: 'Absent', value: (r) => r.absent },
        { label: 'Leave', value: (r) => r.leave },
    ], rows);

    return (<div className="space-y-6">
      <PageHeader title={isEmp ? 'My Monthly Attendance' : 'Monthly Attendance'} description={isEmp
            ? `Your attendance for ${monthLabel}.`
            : `Everyone's attendance for ${monthLabel}, from the punch register.`} breadcrumbs={[
            { label: isEmp ? 'My Portal' : 'Dashboard', path: '/hr' },
            { label: 'Attendance', path: '/hr/attendance' },
            { label: 'Monthly' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/attendance')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
              {isEmp ? 'My Attendance Log' : 'Back to Overview'}
            </Button>
            <Button variant="primary" size="sm" onClick={exportMonth} disabled={!rows.length} leftIcon={<Download className="w-4 h-4"/>}>
              Export CSV
            </Button>
          </div>}/>

      {mine && (<div className="stat-grid">
          {[
                { title: 'Present Days', value: mine.present, Icon: UserCheck, tone: 'border-l-emerald-500', icon: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' },
                { title: 'Late Marks', value: mine.late, Icon: Clock, tone: 'border-l-amber-500', icon: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' },
                { title: 'Leave Days', value: mine.leave, Icon: CalendarOff, tone: 'border-l-purple-500', icon: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400' },
                { title: 'Weekly Offs', value: mine.off, Icon: Building2, tone: 'border-l-slate-400', icon: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
            ].map((c) => (<StatCard key={c.title} title={c.title} value={c.value} icon={<c.Icon />} iconBgColor={c.icon}/>))}
        </div>)}

      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="p-1.5" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="w-4 h-4"/>
          </Button>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 px-3 min-w-[140px] text-center">{monthLabel}</span>
          <Button variant="outline" size="sm" className="p-1.5" onClick={() => shiftMonth(1)} disabled={monthKey >= today.slice(0, 7)} aria-label="Next month">
            <ChevronRight className="w-4 h-4"/>
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs flex-wrap text-slate-700 dark:text-slate-300">
          {['P', 'L', 'A', 'LV', 'WO', 'H'].map((code) => (<span key={code} className="inline-flex items-center gap-1.5">
              <span className={`min-w-4 h-4 px-0.5 rounded text-[10px] flex items-center justify-center font-bold ${CELL[code].bg}`}>{code}</span>
              {CELL[code].title}
            </span>))}
        </div>
      </Card>

      {!isEmp && (<div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#1A2430] p-4 rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
          <div className="w-full sm:w-64">
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by staff name or ID..." leftIcon={<Search className="w-4 h-4 text-slate-400"/>}/>
          </div>
          <div className="w-full sm:w-48">
            <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} options={[
                { value: 'all', label: 'All Departments' },
                ...[...new Set(rawEmployees.map((e) => e.employment?.department).filter(Boolean))].map((d) => ({ value: d, label: d })),
            ]}/>
          </div>
          <div className="w-full sm:w-56">
            <Select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} options={[
                { value: 'all', label: 'All Projects / Sites' },
                ...STANDARD_PROJECTS.map((p) => ({ value: p, label: p })),
            ]}/>
          </div>
          {(selectedDept !== 'all' || selectedProject !== 'all' || searchQuery.trim()) && (<Button variant="ghost" size="sm" onClick={() => {
                    setSelectedDept('all');
                    setSelectedProject('all');
                    setSearchQuery('');
                }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs">
              Reset Filters
            </Button>)}
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto hidden md:inline">
            Showing <strong>{filteredEmployees.length}</strong> of <strong>{employees.length}</strong> employees
          </span>
        </div>)}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto custom-sidebar-scroll">
          <table className="w-full text-center text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#111821] border-b border-slate-200 dark:border-[#253344] text-slate-700 dark:text-slate-300">
                <th className="sticky left-0 z-20 bg-slate-100 dark:bg-[#111821] py-3 px-3 text-left font-bold text-slate-800 dark:text-slate-100 min-w-[220px] border-r border-slate-200 dark:border-[#253344]">
                  Staff Member
                </th>
                {days.map((d) => (<th key={d} className="p-1.5 min-w-[32px] font-mono text-[11px] font-semibold border-r border-slate-200 dark:border-[#253344]">
                    {d}
                  </th>))}
                <th className="py-3 px-2 font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">P</th>
                <th className="py-3 px-2 font-bold text-rose-800 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20">A</th>
                <th className="py-3 px-2 font-bold text-purple-800 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20">LV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#253344]">
              {rows.length === 0 ? (<tr>
                  <td colSpan={days.length + 4} className="py-8 text-center text-slate-400">
                    {isEmp ? 'Your HR record is not set up yet.' : 'No employees match the selected filters.'}
                  </td>
                </tr>) : (rows.map((r) => (<tr key={r.emp.id} className="hover:bg-slate-50/80 dark:hover:bg-[#253344]/40 transition-colors">
                    <td className="sticky left-0 z-10 bg-white dark:bg-[#1A2430] py-2 px-3 text-left font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-[#253344]">
                      <div className="truncate max-w-[210px] font-bold text-slate-900 dark:text-white">{r.emp.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500">{r.emp.employeeId}</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 truncate max-w-[130px]" title={getEmployeeProject(r.emp)}>
                          • {getEmployeeProject(r.emp)}
                        </span>
                      </div>
                    </td>
                    {r.cells.map((code, i) => (<td key={days[i]} className="p-1 border-r border-slate-100 dark:border-[#253344]">
                        <span className={`inline-block min-w-6 h-6 leading-6 px-0.5 rounded text-[10px] ${CELL[code].bg}`} title={CELL[code].title}>
                          {code}
                        </span>
                      </td>))}
                    <td className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 tabular-nums">{r.present}</td>
                    <td className="font-bold text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20 tabular-nums">{r.absent}</td>
                    <td className="font-bold text-purple-700 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/20 tabular-nums">{r.leave}</td>
                  </tr>)))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>);
};
