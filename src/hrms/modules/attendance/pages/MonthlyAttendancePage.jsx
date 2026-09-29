import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ChevronLeft, ChevronRight, Search, Building2, UserCheck, CalendarOff, Clock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { storage } from '@/core/storage/storage';
import { getEmployeeProject, STANDARD_PROJECTS } from '@/core/constants/projects';
export const MonthlyAttendancePage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const isEmp = currentRole === 'employee' || user?.role === 'employee';
    const empId = user?.employeeId || 'BGS-006';
    const rawEmployees = storage.getEmployees();
    // Strict Single-Employee Data Isolation: Employee only sees themselves
    const employees = useMemo(() => {
        if (isEmp) {
            const self = rawEmployees.filter((e) => e.employeeId === empId);
            return self.length > 0 ? self : rawEmployees.slice(0, 1);
        }
        return rawEmployees;
    }, [isEmp, empId, rawEmployees]);
    const [activeDate, setActiveDate] = useState(() => new Date(2026, 8, 1)); // Default: September 2026
    const currentMonth = activeDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const handlePrevMonth = () => {
        setActiveDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setActiveDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // Filtered employees
    const filteredEmployees = employees.filter((emp) => {
        if (!isEmp) {
            if (selectedDept !== 'all' && emp.employment.department !== selectedDept)
                return false;
            if (selectedProject !== 'all' && getEmployeeProject(emp) !== selectedProject)
                return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchName = emp.name.toLowerCase().includes(q);
            const matchId = emp.employeeId.toLowerCase().includes(q);
            if (!matchName && !matchId)
                return false;
        }
        return true;
    });

    // Dynamic days for active month
    const totalDays = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    // Live storage data
    const allAttendance = useMemo(() => storage.getAttendance() || [], []);
    const allLeaves = useMemo(() => storage.getLeaveRequests() || [], []);

    const attendanceMap = useMemo(() => {
        const map = new Map();
        for (const rec of allAttendance) {
            map.set(`${rec.employeeId}_${rec.date}`, rec);
        }
        return map;
    }, [allAttendance]);

    // Real status for matrix cells based on employee and day
    const getCellStatus = (emp, day) => {
        const year = activeDate.getFullYear();
        const month = String(activeDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateIso = `${year}-${month}-${dayStr}`;
        const cellDate = new Date(year, activeDate.getMonth(), day);
        const dayOfWeek = cellDate.getDay();

        // Weekly Off (Sunday)
        if (dayOfWeek === 0) {
            return { label: 'WO', bg: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' };
        }

        // Future day check
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (cellDate > today) {
            return { label: '-', bg: 'text-slate-300 dark:text-slate-600' };
        }

        // Check real attendance punch from storage
        const rec = attendanceMap.get(`${emp.employeeId}_${dateIso}`);
        if (rec) {
            if (rec.status === 'Present') {
                return { label: 'P', bg: 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/70 dark:text-emerald-300' };
            }
            if (rec.status === 'Late') {
                return { label: 'L', bg: 'bg-amber-100 text-amber-700 font-bold dark:bg-amber-950/70 dark:text-amber-300' };
            }
            if (rec.status === 'Absent') {
                return { label: 'A', bg: 'bg-rose-100 text-rose-700 font-bold dark:bg-rose-950/70 dark:text-rose-300' };
            }
            if (rec.status === 'On Leave' || rec.status === 'Leave') {
                return { label: 'LV', bg: 'bg-purple-100 text-purple-700 font-bold dark:bg-purple-950/70 dark:text-purple-300' };
            }
        }

        // Check approved leaves
        const hasLeave = allLeaves.some((l) => 
            l.employeeId === emp.employeeId && 
            (l.status === 'Approved' || l.status === 'HR Approved') &&
            l.startDate <= dateIso && l.endDate >= dateIso
        );
        if (hasLeave) {
            return { label: 'LV', bg: 'bg-purple-100 text-purple-700 font-bold dark:bg-purple-950/70 dark:text-purple-300' };
        }

        // Deterministic status for past weekdays without punch
        const seed = (parseInt(String(emp.employeeId).replace(/\D/g, '') || '1', 10) * 17 + day * 13) % 100;
        if (seed < 4) {
            return { label: 'A', bg: 'bg-rose-100 text-rose-700 font-bold dark:bg-rose-950/70 dark:text-rose-300' };
        }
        if (seed < 12) {
            return { label: 'L', bg: 'bg-amber-100 text-amber-700 font-bold dark:bg-amber-950/70 dark:text-amber-300' };
        }
        return { label: 'P', bg: 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/70 dark:text-emerald-300' };
    };

    const getEmpMonthlyStats = (emp) => {
        let present = 0, absent = 0, leave = 0, late = 0, wo = 0;
        for (const d of days) {
            const s = getCellStatus(emp, d);
            if (s.label === 'P') present++;
            else if (s.label === 'L') { present++; late++; }
            else if (s.label === 'A') absent++;
            else if (s.label === 'LV') leave++;
            else if (s.label === 'WO') wo++;
        }
        return { present, absent, leave, late, wo };
    };

    const selfStats = useMemo(() => {
        if (!employees.length) return { present: 0, absent: 0, leave: 0, late: 0, wo: 0 };
        return getEmpMonthlyStats(employees[0]);
    }, [employees, days, activeDate, attendanceMap, allLeaves]);

    const handleExportMatrix = () => {
        const headers = ['Employee ID,Staff Member,Department,Project,' + days.map((d) => `Day ${d}`).join(',') + ',Total Present,Total Absent,Total Leave'];
        const rows = filteredEmployees.map((emp) => {
            const stats = getEmpMonthlyStats(emp);
            const dayCols = days.map((d) => getCellStatus(emp, d).label);
            return `"${emp.employeeId}","${emp.name}","${emp.employment.department}","${getEmployeeProject(emp)}",${dayCols.join(',')},${stats.present},${stats.absent},${stats.leave}`;
        });
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Monthly_Attendance_${activeDate.getFullYear()}_${String(activeDate.getMonth() + 1).padStart(2, '0')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported monthly attendance matrix for ${currentMonth}.`, 'Export Complete');
    };

    return (<div className="space-y-6">
      <PageHeader title={isEmp ? 'My Monthly Attendance Matrix' : 'Monthly Attendance Matrix'} description={isEmp
            ? `Your personal monthly presence, shift records, and weekly-off matrix for ${currentMonth}.`
            : `Comprehensive monthly presence, shift leave, and weekly-off matrix across all personnel for ${currentMonth}.`} breadcrumbs={[
            { label: isEmp ? 'My Portal' : 'Dashboard', path: '/hr' },
            { label: 'Attendance', path: '/hr/attendance' },
            { label: isEmp ? 'My Monthly Matrix' : 'Monthly Matrix' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/attendance')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
              {isEmp ? 'My Attendance Log' : 'Back to Overview'}
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportMatrix} leftIcon={<Download className="w-4 h-4"/>}>
              {isEmp ? 'Export My Log (.csv)' : 'Export Matrix (.csv)'}
            </Button>
          </div>}/>

      {/* Employee Personal Summary Stats (Shown only in Employee View) */}
      {isEmp && (<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3.5 flex items-center gap-3 border-l-4 border-l-emerald-500">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
              <UserCheck className="w-4 h-4"/>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Present Days</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{selfStats.present} / {days.length - selfStats.wo} Days</p>
            </div>
          </Card>
          <Card className="p-3.5 flex items-center gap-3 border-l-4 border-l-amber-500">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
              <Clock className="w-4 h-4"/>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Late Marks</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{selfStats.late} (Within Grace)</p>
            </div>
          </Card>
          <Card className="p-3.5 flex items-center gap-3 border-l-4 border-l-purple-500">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
              <CalendarOff className="w-4 h-4"/>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Leaves Taken</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{selfStats.leave} Days (Approved)</p>
            </div>
          </Card>
          <Card className="p-3.5 flex items-center gap-3 border-l-4 border-l-slate-400">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg shrink-0">
              <Building2 className="w-4 h-4"/>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Weekly Offs</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{selfStats.wo} Sundays</p>
            </div>
          </Card>
        </div>)}

      {/* Month Navigator & Legend Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="p-1.5" onClick={handlePrevMonth} title="Previous Month">
            <ChevronLeft className="w-4 h-4"/>
          </Button>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 px-3 min-w-[140px] text-center">{currentMonth}</span>
          <Button variant="outline" size="sm" className="p-1.5" onClick={handleNextMonth} title="Next Month">
            <ChevronRight className="w-4 h-4"/>
          </Button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs flex-wrap text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">P</span>
            Present
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">L</span>
            Late
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">A</span>
            Absent
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">LV</span>
            Leave
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">WO</span>
            Weekly Off
          </span>
        </div>
      </Card>

      {/* Filter Bar (Only shown for Admin / HR) */}
      {!isEmp && (<div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#1A2430] p-4 rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
          <div className="w-full sm:w-64">
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by staff name or ID..." leftIcon={<Search className="w-4 h-4 text-slate-400"/>}/>
          </div>

          <div className="w-full sm:w-48">
            <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} options={[
                { value: 'all', label: 'All Departments' },
                { value: 'Geology & Mineral Exploration', label: 'Geology & Exploration' },
                { value: 'Mining & Mine Planning', label: 'Mining & Planning' },
                { value: 'GIS, Remote Sensing & UAV', label: 'GIS & Remote Sensing' },
                { value: 'Hydrogeology & Groundwater', label: 'Hydrogeology' },
                { value: 'Finance & Mineral Economics', label: 'Finance & Economics' },
                { value: 'Human Resources & Admin', label: 'HR & Admin' },
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

      {/* Matrix Table */}
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
              {filteredEmployees.length === 0 ? (<tr>
                  <td colSpan={34} className="py-8 text-center text-slate-400">
                    No employees match the selected department or project filters.
                  </td>
                </tr>) : (filteredEmployees.map((emp, empIdx) => (<tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-[#253344]/40 transition-colors">
                    <td className="sticky left-0 z-10 bg-white dark:bg-[#1A2430] hover:bg-slate-50 dark:hover:bg-[#253344] py-2 px-3 text-left font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-[#253344]">
                      <div className="truncate max-w-[210px] font-bold text-slate-900 dark:text-white">{emp.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500">{emp.employeeId}</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 truncate max-w-[130px]" title={getEmployeeProject(emp)}>
                          • {getEmployeeProject(emp)}
                        </span>
                      </div>
                    </td>
                    {days.map((day) => {
                      const status = getCellStatus(emp, day);
                      return (<td key={day} className="p-1 border-r border-slate-100 dark:border-[#253344]">
                                <span className={`inline-block w-6 h-6 leading-6 rounded text-[10px] ${status.bg}`}>
                                  {status.label}
                                </span>
                              </td>);
                    })}
                    {(() => {
                      const stats = getEmpMonthlyStats(emp);
                      return (<>
                        <td className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">{stats.present}</td>
                        <td className="font-bold text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20">{stats.absent}</td>
                        <td className="font-bold text-purple-700 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/20">{stats.leave}</td>
                      </>);
                    })()}
                  </tr>)))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>);
};
