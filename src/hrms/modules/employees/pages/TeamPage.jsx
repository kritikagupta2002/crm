import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Mail, Phone, Building2, MapPin, Clock, UserCheck, ChevronRight, Briefcase, Compass, LayoutGrid, RotateCcw, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Avatar } from '@/components/common/Avatar';
import { storage } from '@/core/storage/storage';
import { PROJECT_METADATA, DEPARTMENT_METADATA, getEmployeeProject, STANDARD_PROJECTS, getEmployeeProjectById } from '@/core/constants/projects';
export { PROJECT_METADATA, DEPARTMENT_METADATA, getEmployeeProject, STANDARD_PROJECTS, getEmployeeProjectById };

export const TeamPage = () => {
    const navigate = useNavigate();
    // View mode: 'department' | 'project' | 'grid'
    const [viewMode, setViewMode] = useState('department');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedProject, setSelectedProject] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    // Centralized datasets
    const employees = useMemo(() => storage.getEmployees(), []);
    const leaveRequests = useMemo(() => storage.getLeaveRequests(), []);
    const attendance = useMemo(() => storage.getAttendance(), []);
    const todayStr = new Date().toLocaleDateString('en-CA');
    // Helper to determine live presence & availability status
    const getEmployeeStatus = (emp) => {
        // 1. Check approved leave today
        const activeLeave = leaveRequests.find((l) => l.employeeId === emp.employeeId &&
            l.status === 'Approved' &&
            l.startDate <= todayStr &&
            l.endDate >= todayStr);
        if (activeLeave) {
            return {
                status: 'On Leave',
                badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
                dotColor: 'bg-rose-500',
                details: `On Leave until ${activeLeave.endDate} (${activeLeave.leaveType.split('(')[0].trim()})`,
            };
        }
        // 2. Check punch-in today
        const todayPunch = attendance.find((a) => a.employeeId === emp.employeeId && a.date === todayStr && a.status === 'Present');
        if (todayPunch) {
            return {
                status: 'On Duty',
                badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
                dotColor: 'bg-emerald-500',
                details: `Checked in at ${todayPunch.checkIn || '09:00 AM'}`,
            };
        }
        // 3. Field site assignment
        if (emp.employment?.workLocation?.includes('Field') || emp.employment?.workLocation?.includes('Bhilwara')) {
            return {
                status: 'On Field Duty',
                badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
                dotColor: 'bg-amber-500',
                details: emp.employment.workLocation,
            };
        }
        return {
            status: 'Available',
            badgeColor: 'bg-teal-50 text-[#1F6F78] dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-900/50',
            dotColor: 'bg-[#1F6F78]',
            details: 'Regular Schedule',
        };
    };
    // Distinct department list
    const departments = useMemo(() => {
        const set = new Set();
        employees.forEach((e) => {
            if (e.employment?.department)
                set.add(e.employment.department);
        });
        return Array.from(set);
    }, [employees]);
    // Distinct project list
    const projects = useMemo(() => {
        const set = new Set();
        employees.forEach((e) => {
            set.add(getEmployeeProject(e));
        });
        return Array.from(set);
    }, [employees]);
    // Filtered employees list
    const filteredEmployees = useMemo(() => {
        return employees.filter((emp) => {
            const q = searchQuery.toLowerCase().trim();
            const proj = getEmployeeProject(emp);
            const matchesSearch = !q ||
                emp.name.toLowerCase().includes(q) ||
                emp.employeeId.toLowerCase().includes(q) ||
                emp.employment?.designation?.toLowerCase().includes(q) ||
                emp.employment?.department?.toLowerCase().includes(q) ||
                proj.toLowerCase().includes(q);
            const matchesDept = selectedDept === 'All' || emp.employment?.department === selectedDept;
            const matchesProject = selectedProject === 'All' || proj === selectedProject;
            const currentStatus = getEmployeeStatus(emp).status;
            const matchesStatus = selectedStatus === 'All' ||
                (selectedStatus === 'On Duty' && currentStatus === 'On Duty') ||
                (selectedStatus === 'On Leave' && currentStatus === 'On Leave') ||
                (selectedStatus === 'On Field Duty' && currentStatus === 'On Field Duty') ||
                (selectedStatus === 'Available' && currentStatus === 'Available');
            return matchesSearch && matchesDept && matchesProject && matchesStatus;
        });
    }, [employees, searchQuery, selectedDept, selectedProject, selectedStatus, leaveRequests, attendance]);
    // Stat counts
    const onDutyCount = useMemo(() => {
        return employees.filter((e) => getEmployeeStatus(e).status === 'On Duty').length;
    }, [employees, attendance, leaveRequests]);
    const fieldCount = useMemo(() => {
        return employees.filter((e) => getEmployeeStatus(e).status === 'On Field Duty').length;
    }, [employees, leaveRequests]);
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedDept('All');
        setSelectedProject('All');
        setSelectedStatus('All');
    };
    const isFiltered = searchQuery !== '' || selectedDept !== 'All' || selectedProject !== 'All' || selectedStatus !== 'All';
    return (<div className="space-y-6 pb-12">
      <PageHeader title="Team Directory" description="Department hierarchies, project site assignments, and live availability tracking." breadcrumbs={[
            { label: 'HRMS', path: '/hr' },
            { label: 'Team', path: '/hr/team' },
        ]} actions={<Button onClick={() => navigate('/hr/employees/new')}>
            <Users className="w-4 h-4 mr-1.5"/>
            Add Team Member
          </Button>}/>

      {/* ── TOP STAT SUMMARY ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Staff */}
        <div className="bg-white dark:bg-[#1A2430] border border-slate-200 dark:border-[#253344] rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#1F6F78] dark:text-teal-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5"/>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Staff</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{employees.length}</h4>
            </div>
          </div>
        </div>

        {/* Operational Departments */}
        <div onClick={() => setViewMode('department')} className={`bg-white dark:bg-[#1A2430] border rounded-2xl p-4 shadow-2xs hover:shadow-xs cursor-pointer transition-all ${viewMode === 'department'
            ? 'border-[#1F6F78] ring-2 ring-teal-500/20'
            : 'border-slate-200 dark:border-[#253344]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5"/>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Departments</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{departments.length}</h4>
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div onClick={() => setViewMode('project')} className={`bg-white dark:bg-[#1A2430] border rounded-2xl p-4 shadow-2xs hover:shadow-xs cursor-pointer transition-all ${viewMode === 'project'
            ? 'border-[#1F6F78] ring-2 ring-teal-500/20'
            : 'border-slate-200 dark:border-[#253344]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5"/>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Projects</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{projects.length}</h4>
            </div>
          </div>
        </div>

        {/* Duty & Field Deployments */}
        <div className="bg-white dark:bg-[#1A2430] border border-slate-200 dark:border-[#253344] rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5"/>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Duty & Field Staff</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {onDutyCount + fieldCount}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* ── VIEW SWITCHER TABS & FILTER BAR ── */}
      <Card className="p-4 shadow-2xs space-y-3.5">
        {/* Top row: View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
            <button type="button" onClick={() => setViewMode('department')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'department'
            ? 'bg-white dark:bg-[#111821] text-[#1F6F78] dark:text-teal-400 font-bold shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
              <Building2 className="w-4 h-4"/>
              <span>Department-wise</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                {departments.length}
              </span>
            </button>

            <button type="button" onClick={() => setViewMode('project')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'project'
            ? 'bg-white dark:bg-[#111821] text-[#1F6F78] dark:text-teal-400 font-bold shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
              <Compass className="w-4 h-4"/>
              <span>Project-wise</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                {projects.length}
              </span>
            </button>

            <button type="button" onClick={() => setViewMode('grid')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'grid'
            ? 'bg-white dark:bg-[#111821] text-[#1F6F78] dark:text-teal-400 font-bold shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
              <LayoutGrid className="w-4 h-4"/>
              <span>All Staff Grid</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                {filteredEmployees.length}
              </span>
            </button>
          </div>

          {/* Quick status message */}
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>Showing</span>
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">{filteredEmployees.length}</strong>
            <span>of {employees.length} team members</span>
            {isFiltered && (<button type="button" onClick={resetFilters} className="ml-2 text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-1 cursor-pointer">
                <RotateCcw className="w-3 h-3"/> Reset
              </button>)}
          </div>
        </div>

        {/* Bottom row: Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <Input placeholder="Search name, ID, role, project..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9"/>
          </div>

          {/* Department Filter */}
          <div>
            <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} options={[
            { value: 'All', label: 'All Departments' },
            ...departments.map((d) => ({ value: d, label: d })),
        ]}/>
          </div>

          {/* Project Filter */}
          <div>
            <Select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} options={[
            { value: 'All', label: 'All Projects' },
            ...projects.map((p) => ({ value: p, label: p })),
        ]}/>
          </div>

          {/* Status Filter */}
          <div>
            <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} options={[
            { value: 'All', label: 'All Statuses' },
            { value: 'On Duty', label: 'On Duty' },
            { value: 'On Field Duty', label: 'On Field Duty' },
            { value: 'Available', label: 'Available' },
            { value: 'On Leave', label: 'On Leave' },
        ]}/>
          </div>
        </div>
      </Card>

      {/* ── MAIN TEAM DISPLAY ── */}
      {filteredEmployees.length === 0 ? (<Card className="p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3"/>
          <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">No Team Members Found</h4>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria, department, or project filters.</p>
          <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5"/>
            Clear All Filters
          </Button>
        </Card>) : viewMode === 'project' ? (
        // ── 1. GROUPED BY PROJECT ──
        <div className="space-y-8">
          {projects.map((projectName) => {
                const projectEmps = filteredEmployees.filter((e) => getEmployeeProject(e) === projectName);
                if (projectEmps.length === 0)
                    return null;
                const meta = PROJECT_METADATA[projectName] || {
                    code: 'PRJ-EXT',
                    client: 'Corporate Site Client',
                    location: projectEmps[0]?.employment?.workLocation || 'Site Assignment',
                    siteType: 'Exploration Site',
                    category: 'Site Operations',
                    leadName: 'Project Manager',
                    badgeClass: 'bg-teal-50 text-[#1F6F78] border-teal-200',
                    desc: 'Exploration and project deliverables executing on site.',
                };
                return (<div key={projectName} className="space-y-4">
                {/* Project Header Banner */}
                <div className="bg-gradient-to-r from-teal-50/70 via-slate-50 to-blue-50/60 dark:from-[#15232d] dark:via-[#131d27] dark:to-[#172533] border border-teal-200/70 dark:border-teal-900/50 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 text-[#1F6F78] dark:text-teal-400 flex items-center justify-center font-bold shadow-xs shrink-0 border border-teal-100 dark:border-slate-700">
                        <Compass className="w-6 h-6 text-[#1F6F78] dark:text-teal-400"/>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {projectName}
                          </h3>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}>
                            {meta.code}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                            {meta.siteType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
                          {meta.desc}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400"/>
                            {meta.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400"/>
                            Client: <strong className="text-slate-700 dark:text-slate-200">{meta.client}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Project Lead
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {meta.leadName}
                        </span>
                      </div>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-[#1F6F78] dark:text-teal-400 border border-teal-200 dark:border-teal-800/40 shadow-xs">
                        {projectEmps.length} {projectEmps.length === 1 ? 'Member' : 'Members'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Team Members Grid for this Project */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectEmps.map((emp) => renderEmployeeCard(emp, getEmployeeStatus(emp), getEmployeeProject(emp), navigate))}
                </div>
              </div>);
            })}
        </div>) : viewMode === 'department' ? (
        // ── 2. GROUPED BY DEPARTMENT ──
        <div className="space-y-8">
          {departments.map((dept) => {
                const deptEmps = filteredEmployees.filter((e) => e.employment?.department === dept);
                if (deptEmps.length === 0)
                    return null;
                const meta = DEPARTMENT_METADATA[dept] || {
                    code: 'DIV',
                    headName: deptEmps[0]?.employment?.managerName || 'Department Head',
                    base: deptEmps[0]?.employment?.workLocation || 'Corporate HQ',
                    badgeClass: 'bg-teal-50 text-[#1F6F78] border-teal-200',
                    desc: 'Operational departmental unit driving corporate goals.',
                };
                return (<div key={dept} className="space-y-4">
                {/* Department Header Banner */}
                <div className="bg-gradient-to-r from-slate-50 via-teal-50/40 to-slate-50 dark:from-[#15232d] dark:via-[#131d27] dark:to-[#172533] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 text-[#1F6F78] dark:text-teal-400 flex items-center justify-center font-bold shadow-xs shrink-0 border border-slate-200 dark:border-slate-700">
                        <Building2 className="w-6 h-6 text-[#1F6F78] dark:text-teal-400"/>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {dept}
                          </h3>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}>
                            {meta.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
                          {meta.desc}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400"/>
                            Primary Base: <strong className="text-slate-700 dark:text-slate-200">{meta.base}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400"/>
                            Division Head: <strong className="text-slate-700 dark:text-slate-200">{meta.headName}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 self-start md:self-center">
                      <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-[#1F6F78] dark:text-teal-400 border border-slate-200 dark:border-slate-700 shadow-xs">
                        {deptEmps.length} {deptEmps.length === 1 ? 'Staff Member' : 'Staff Members'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Team Members Grid for this Department */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deptEmps.map((emp) => renderEmployeeCard(emp, getEmployeeStatus(emp), getEmployeeProject(emp), navigate))}
                </div>
              </div>);
            })}
        </div>) : (
        // ── 3. FLAT GRID (ALL MEMBERS) ──
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => renderEmployeeCard(emp, getEmployeeStatus(emp), getEmployeeProject(emp), navigate))}
        </div>)}
    </div>);
};
// ── SUB-COMPONENT: TEAM MEMBER CARD ──
function renderEmployeeCard(emp, statusObj, projectName, navigate) {
    return (<div key={emp.id || emp.employeeId} className="bg-white dark:bg-[#1A2430] border border-slate-200/90 dark:border-[#253344] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Card Header: Avatar + Name + Live Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar src={emp.avatarUrl} name={emp.name} size="lg" className="ring-2 ring-slate-100 dark:ring-slate-800"/>
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#1A2430] ${statusObj.dotColor}`} title={statusObj.status}/>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {emp.name}
              </h4>
              <p className="text-xs font-semibold text-[#1F6F78] dark:text-teal-400 mt-0.5">
                {emp.employment?.designation}
              </p>
              <span className="font-mono text-[10px] text-slate-400">
                {emp.employeeId}
              </span>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusObj.badgeColor}`}>
            {statusObj.status}
          </span>
        </div>

        {/* Card Body: Department, Project, Location, Schedule */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
          {/* Department */}
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
            <span className="font-medium truncate">{emp.employment?.department}</span>
          </div>

          {/* Assigned Project */}
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0"/>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-[#1F6F78] dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 truncate">
              {projectName}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
            <span className="truncate">{emp.employment?.workLocation}</span>
          </div>

          {/* Schedule / Check-in */}
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
            <span className="truncate font-medium">{statusObj.details}</span>
          </div>
        </div>
      </div>

      {/* Card Footer: Quick Contact Actions + Profile Button */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {emp.contact?.workEmail && (<a href={`mailto:${emp.contact.workEmail}`} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" title={emp.contact.workEmail}>
              <Mail className="w-3.5 h-3.5"/>
            </a>)}
          {emp.contact?.phone && (<a href={`tel:${emp.contact.phone}`} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" title={emp.contact.phone}>
              <Phone className="w-3.5 h-3.5"/>
            </a>)}
        </div>

        <Button variant="ghost" size="sm" onClick={() => navigate(`/hr/employees/${emp.id || emp.employeeId}`)} className="text-xs">
          View Profile
          <ChevronRight className="w-3 h-3 ml-1"/>
        </Button>
      </div>
    </div>);
}
