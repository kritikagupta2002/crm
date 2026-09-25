import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Download, Eye, Edit2, Trash2, Users, UserCheck, CalendarOff, Building2, MapPin, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatCard } from '@/components/common/StatCard';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/contexts/ToastContext';
import { employeeService } from '@/modules/employees/services/employee.service';
import { getEmployeeProject } from './TeamPage';
export const EmployeeListPage = () => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();
    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await employeeService.getAll();
            setEmployees(data);
        }
        catch {
            toast.error('Failed to load employee list', 'Error');
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, []);
    const handleDelete = async () => {
        if (!employeeToDelete)
            return;
        try {
            await employeeService.delete(employeeToDelete.id);
            setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete.id));
            toast.success(`${employeeToDelete.name} has been removed from directory.`, 'Employee Deleted');
            setEmployeeToDelete(null);
        }
        catch {
            toast.error('Could not delete employee record.', 'Error');
        }
    };
    const handleExportCSV = () => {
        const headers = ['Employee ID,Name,Department,Designation,Manager,Joining Date,Type,Status,Work Location'];
        const rows = employees.map((e) => `"${e.employeeId}","${e.name}","${e.employment.department}","${e.employment.designation}","${e.employment.managerName}","${e.employment.joiningDate}","${e.employment.employmentType}","${e.employment.status}","${e.employment.workLocation}"`);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `BGSPL_Employees_${new Date().toLocaleDateString('en-CA')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Employee directory exported to CSV.', 'Export Complete');
    };
    // Filtered employees
    const filteredEmployees = employees.filter((emp) => {
        if (selectedDept !== 'all' && emp.employment.department !== selectedDept)
            return false;
        if (selectedProject !== 'all' && getEmployeeProject(emp) !== selectedProject)
            return false;
        if (selectedStatus !== 'all' && emp.employment.status !== selectedStatus)
            return false;
        if (selectedLocation !== 'all' && !emp.employment.workLocation?.toLowerCase().includes(selectedLocation.toLowerCase()))
            return false;
        if (selectedType !== 'all' && emp.employment.employmentType !== selectedType)
            return false;
        return true;
    });
    // Summary Metrics
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.employment.status === 'Active').length;
    const onLeaveEmployees = employees.filter((e) => e.employment.status === 'On Leave').length;
    const totalDepartments = new Set(employees.map((e) => e.employment.department).filter(Boolean)).size;
    const columns = [
        {
            key: 'employeeId',
            header: 'Emp ID',
            sortable: true,
            className: 'w-24 text-center whitespace-nowrap',
            render: (emp) => (<div className="flex justify-center">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 tabular-nums shadow-2xs">
            {emp.employeeId}
          </span>
        </div>),
        },
        {
            key: 'name',
            header: 'Employee',
            sortable: true,
            className: 'min-w-[230px]',
            render: (emp) => (<div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <Avatar src={emp.avatarUrl} name={emp.name} size="sm"/>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1A2430] ${emp.employment.status === 'Active'
                    ? 'bg-emerald-500'
                    : emp.employment.status === 'On Leave'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'}`} title={`Status: ${emp.employment.status}`}/>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white hover:text-[#D5860B] transition-colors text-xs sm:text-sm whitespace-nowrap">
              {emp.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap" title={emp.contact.workEmail}>
              {emp.contact.workEmail}
            </p>
          </div>
        </div>),
        },
        {
            key: 'department',
            header: 'Department',
            sortable: true,
            className: 'min-w-[180px]',
            render: (emp) => {
                let badgeVariant = 'gold';
                const dept = emp.employment.department || '';
                if (dept.includes('Geology'))
                    badgeVariant = 'gold';
                else if (dept.includes('Mining'))
                    badgeVariant = 'slate';
                else if (dept.includes('GIS'))
                    badgeVariant = 'cyan';
                else if (dept.includes('Hydrogeology'))
                    badgeVariant = 'cyan';
                else if (dept.includes('Finance'))
                    badgeVariant = 'emerald';
                else if (dept.includes('HR'))
                    badgeVariant = 'purple';
                return (<div className="min-w-0">
            <Badge variant={badgeVariant} size="sm" className="whitespace-nowrap">
              {dept}
            </Badge>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0"/>
              {emp.employment.workLocation}
            </p>
          </div>);
            },
        },
        {
            key: 'project',
            header: 'Project / Site',
            sortable: true,
            className: 'min-w-[190px]',
            render: (emp) => {
                const proj = getEmployeeProject(emp);
                return (<div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D5860B]"/>
              {proj}
            </span>
          </div>);
            },
        },
        {
            key: 'designation',
            header: 'Designation',
            sortable: true,
            className: 'min-w-[170px]',
            render: (emp) => (<p className="text-slate-800 dark:text-slate-200 font-medium text-xs sm:text-sm whitespace-nowrap" title={emp.employment.designation}>
          {emp.employment.designation}
        </p>),
        },
        {
            key: 'manager',
            header: 'Reports To',
            className: 'min-w-[140px] whitespace-nowrap',
            render: (emp) => {
                const mgr = emp.employment.managerName;
                if (!mgr)
                    return <span className="text-slate-400 text-xs">-</span>;
                const initial = mgr.charAt(0);
                return (<div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
              {initial}
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{mgr}</span>
          </div>);
            },
        },
        {
            key: 'joiningDate',
            header: 'Joining Date',
            sortable: true,
            className: 'w-28 text-center whitespace-nowrap',
            render: (emp) => (<span className="text-slate-700 dark:text-slate-300 font-medium text-xs tabular-nums whitespace-nowrap">
          {emp.employment.joiningDate}
        </span>),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            className: 'w-24 text-center whitespace-nowrap',
            render: (emp) => (<div className="flex justify-center">
          <StatusBadge status={emp.employment.status} size="sm"/>
        </div>),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'w-24 text-center whitespace-nowrap',
            render: (emp) => (<div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/hr/employees/${emp.id}`)} className="p-1.5 text-slate-400 hover:text-[#D5860B] hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors" title="View Profile">
            <Eye className="w-4 h-4"/>
          </button>
          <button onClick={() => navigate(`/hr/employees/${emp.id}/edit`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors" title="Edit Employee">
            <Edit2 className="w-4 h-4"/>
          </button>
          <button onClick={() => setEmployeeToDelete(emp)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors" title="Delete">
            <Trash2 className="w-4 h-4"/>
          </button>
        </div>),
        },
    ];
    return (<div className="space-y-5 animate-fade-in">
      <PageHeader title="Employee Directory" description="Comprehensive repository of all Bansal Geo Solutions corporate and site personnel." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Employees' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-4 h-4 text-slate-600"/>}>
              Export CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/hr/employees/new')} leftIcon={<UserPlus className="w-4 h-4"/>}>
              Add Employee
            </Button>
          </div>}/>

      {/* 4 Summary Metric Stat Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total Workforce" value={totalEmployees} icon={<Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#D5860B]"/>} iconBgColor="bg-amber-50 dark:bg-amber-950/50 text-[#D5860B] border border-amber-200/60 dark:border-amber-800/60" change="+2 this quarter" changeType="increase" caption="Corporate & Site"/>
        <StatCard title="Active on Duty" value={activeEmployees} icon={<UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600"/>} iconBgColor="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200/60 dark:border-emerald-800/60" change={`${totalEmployees ? Math.round((activeEmployees / totalEmployees) * 100) : 0}% deployed`} changeType="increase" caption="Jaipur, Bhilwara, Udaipur"/>
        <StatCard title="On Leave" value={onLeaveEmployees} icon={<CalendarOff className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600"/>} iconBgColor="bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200/60 dark:border-amber-800/60" change="Approved Leaves" changeType="neutral" caption="Casual / Sick / Earned"/>
        <StatCard title="Specialized Units" value={totalDepartments} icon={<Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"/>} iconBgColor="bg-blue-50 dark:bg-blue-950/50 text-blue-600 border border-blue-200/60 dark:border-blue-800/60" change="6 Active Depts" changeType="neutral" caption="Mining & Mineral Division"/>
      </div>

      {/* Directory Table with Filters */}
      <DataTable compact={true} columns={columns} data={filteredEmployees} keyField="id" searchPlaceholder="Search by name, employee ID, role..." searchFields={['name', 'employeeId']} onRowClick={(emp) => navigate(`/hr/employees/${emp.id}`)} filterComponent={<div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="w-full sm:w-auto flex-1 sm:flex-initial min-w-full xs:min-w-[150px]">
              <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} options={[
                { label: 'All Departments', value: 'all' },
                { label: 'Geology & Exploration', value: 'Geology & Mineral Exploration' },
                { label: 'Mining & Planning', value: 'Mining & Mine Planning' },
                { label: 'GIS & Remote Sensing', value: 'GIS, Remote Sensing & UAV' },
                { label: 'Hydrogeology', value: 'Hydrogeology & Groundwater' },
                { label: 'Finance & Economics', value: 'Finance & Mineral Economics' },
                { label: 'HR & Admin', value: 'Human Resources & Admin' },
            ]}/>
            </div>
            <div className="w-full sm:w-auto flex-1 sm:flex-initial min-w-full xs:min-w-[170px]">
              <Select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} options={[
                { label: 'All Projects / Sites', value: 'all' },
                { label: 'Bhilwara Lead-Zinc Core Drilling', value: 'Bhilwara Lead-Zinc Core Drilling' },
                { label: 'Jaipur Ring Road Drone Photogrammetry', value: 'Jaipur Ring Road Drone Photogrammetry' },
                { label: 'Khetri Copper Belt Reconnaissance', value: 'Khetri Copper Belt Reconnaissance' },
                { label: 'Udaipur Rock Phosphate Assessment', value: 'Udaipur Rock Phosphate Assessment' },
                { label: 'Corporate Operations & Governance', value: 'Corporate Operations & Governance' },
            ]}/>
            </div>
            <div className="w-full sm:w-auto flex-1 sm:flex-initial min-w-full xs:min-w-[120px]">
              <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Active', value: 'Active' },
                { label: 'On Leave', value: 'On Leave' },
                { label: 'Notice Period', value: 'Notice Period' },
                { label: 'Terminated', value: 'Terminated' },
            ]}/>
            </div>
            <div className="w-full sm:w-auto flex-1 sm:flex-initial min-w-full xs:min-w-[120px]">
              <Select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} options={[
                { label: 'All Locations', value: 'all' },
                { label: 'Jaipur HQ', value: 'Jaipur' },
                { label: 'Bhilwara Site', value: 'Bhilwara' },
                { label: 'Udaipur Base', value: 'Udaipur' },
            ]}/>
            </div>
            <div className="w-full sm:w-auto flex-1 sm:flex-initial min-w-full xs:min-w-[110px]">
              <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} options={[
                { label: 'All Types', value: 'all' },
                { label: 'Full-time', value: 'Full-time' },
                { label: 'Contract', value: 'Contract' },
                { label: 'Intern', value: 'Intern' },
            ]}/>
            </div>
            {(selectedDept !== 'all' || selectedProject !== 'all' || selectedStatus !== 'all' || selectedLocation !== 'all' || selectedType !== 'all') && (<Button variant="ghost" size="sm" onClick={() => {
                    setSelectedDept('all');
                    setSelectedProject('all');
                    setSelectedStatus('all');
                    setSelectedLocation('all');
                    setSelectedType('all');
                }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs shrink-0 font-semibold w-full xs:w-auto">
                Clear Filters
              </Button>)}
          </div>}/>

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog isOpen={!!employeeToDelete} onClose={() => setEmployeeToDelete(null)} onConfirm={handleDelete} title="Delete Employee Record" message={`Are you sure you want to remove ${employeeToDelete?.name} (${employeeToDelete?.employeeId}) from the directory? This action cannot be undone.`} confirmText="Yes, Delete Record" variant="danger"/>
    </div>);
};
