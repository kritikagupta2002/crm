import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Plus, Users, UserCheck, CalendarDays, MapPin, ShieldCheck, Sun, CheckCircle2, Coffee, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { shiftService } from '@/modules/shifts/services/shift.service';
export const ShiftListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const [shifts, setShifts] = useState([]);
    const isEmp = currentRole === 'employee' || user?.role === 'employee';
    useEffect(() => {
        const load = async () => {
            const data = await shiftService.getShifts();
            setShifts(data);
        };
        load();
    }, []);
    const columns = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            className: 'w-28 font-mono font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap',
        },
        {
            key: 'name',
            header: 'Shift Name',
            sortable: true,
            className: 'min-w-[160px]',
            render: (s) => (<div>
          <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{s.description}</p>
        </div>),
        },
        {
            key: 'timing',
            header: 'Timings',
            className: 'whitespace-nowrap',
            render: (s) => (<span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
          {s.startTime} - {s.endTime}
        </span>),
        },
        {
            key: 'breakDuration',
            header: 'Break & Grace',
            className: 'whitespace-nowrap',
            render: (s) => (<span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
          Break: {s.breakDuration} | Grace: {s.gracePeriod}
        </span>),
        },
        {
            key: 'weeklyOff',
            header: 'Weekly Off',
            className: 'whitespace-nowrap',
            render: (s) => (<span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{s.weeklyOff}</span>),
        },
        {
            key: 'assignedEmployeesCount',
            header: 'Assigned Staff',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (s) => (<span className="inline-flex items-center gap-1 font-bold text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
          <Users className="w-3.5 h-3.5 text-slate-400"/>
          {s.assignedEmployeesCount}
        </span>),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (s) => <StatusBadge status={s.status} size="sm"/>,
        },
    ];
    const weeklyRoster = [
        { day: 'Monday', date: '22 Sep 2026', shift: 'Mining Site Morning (MS-M)', timings: '06:00 AM - 02:30 PM', status: 'Completed', color: 'emerald' },
        { day: 'Tuesday', date: '23 Sep 2026', shift: 'Mining Site Morning (MS-M)', timings: '06:00 AM - 02:30 PM', status: 'Active Today', color: 'blue' },
        { day: 'Wednesday', date: '24 Sep 2026', shift: 'Mining Site Morning (MS-M)', timings: '06:00 AM - 02:30 PM', status: 'Scheduled', color: 'slate' },
        { day: 'Thursday', date: '25 Sep 2026', shift: 'Mining Site Morning (MS-M)', timings: '06:00 AM - 02:30 PM', status: 'Scheduled', color: 'slate' },
        { day: 'Friday', date: '26 Sep 2026', shift: 'Mining Site Morning (MS-M)', timings: '06:00 AM - 02:30 PM', status: 'Scheduled', color: 'slate' },
        { day: 'Saturday', date: '27 Sep 2026', shift: 'Mining Site Morning (MS-M)', timings: '06:00 AM - 02:30 PM', status: 'Scheduled', color: 'slate' },
        { day: 'Sunday', date: '28 Sep 2026', shift: 'Weekly Off', timings: 'Rest Day', status: 'Weekly Off', color: 'amber' },
    ];
    if (isEmp) {
        return (<div className="space-y-6">
        <PageHeader title="My Shift Schedule & Roster" description="Your active assigned shift, timing rules, grace window, and weekly roster." breadcrumbs={[
                { label: 'Dashboard', path: '/hr' },
                { label: 'Shifts', path: '/hr/shifts' },
                { label: 'My Schedule' },
            ]}/>

        {/* Assigned Shift Hero Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-200/80 dark:border-amber-800/60 bg-white dark:bg-[#1A2430] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
                  Current Assigned Shift
                </span>
                <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  MS-M
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Mining Site Morning Shift
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600"/>
                Bhilwara Open-Pit Lithium Block & Field Office • Supervisor: Dr. Amit Kumar Bansal
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="text-center pr-4 border-r border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Shift Timings</p>
                <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">06:00 AM - 02:30 PM</p>
                <p className="text-[10px] text-slate-500">8.5 Hrs Duration</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Weekly Off</p>
                <p className="text-sm font-black text-amber-600 dark:text-amber-400">Sunday</p>
                <p className="text-[10px] text-slate-500">Rotational Roster</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <Clock className="w-4 h-4 text-blue-500 shrink-0"/>
              <span><strong>Grace Window:</strong> 10 mins (up to 06:10 AM)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <Coffee className="w-4 h-4 text-amber-500 shrink-0"/>
              <span><strong>Lunch / Tea Break:</strong> 45 mins</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0"/>
              <span><strong>Biometric Sync:</strong> Bhilwara Site Reader #2</span>
            </div>
          </div>
        </div>

        {/* 7-Day Weekly Roster Table */}
        <div className="bg-white dark:bg-[#1A2430] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600"/>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Current Week Roster (22 Sep – 28 Sep 2026)
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Cycle: W-39</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Day & Date</th>
                  <th className="py-2.5 px-4 font-semibold">Shift Name</th>
                  <th className="py-2.5 px-4 font-semibold">Scheduled Hours</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Roster Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {weeklyRoster.map((r, idx) => (<tr key={idx} className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${r.status === 'Active Today' ? 'bg-blue-50/40 dark:bg-blue-950/20 font-medium' : ''}`}>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">{r.day}</span>
                      <p className="text-[11px] text-slate-500 tabular-nums">{r.date}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-200">
                      {r.shift}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                      {r.timings}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'Completed' && (<span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3"/> Completed
                        </span>)}
                      {r.status === 'Active Today' && (<span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          <Sun className="w-3 h-3 animate-pulse"/> Active Today
                        </span>)}
                      {r.status === 'Scheduled' && (<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          Scheduled
                        </span>)}
                      {r.status === 'Weekly Off' && (<span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          Weekly Off
                        </span>)}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </div>);
    }
    return (<div className="space-y-6">
      <PageHeader title="Shift Management" description="Shift rosters for Jaipur HQ, Bhilwara open-pit mine, and drone field campaigns." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Shifts' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/shifts/assignments')} leftIcon={<UserCheck className="w-4 h-4 text-blue-600"/>}>
              Shift Assignments
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/hr/shifts/new')} leftIcon={<Plus className="w-4 h-4"/>}>
              Add Shift
            </Button>
          </div>}/>

      <DataTable columns={columns} data={shifts} keyField="id" searchPlaceholder="Search shift by name or code..." searchFields={['name', 'code', 'location']}/>
    </div>);
};
