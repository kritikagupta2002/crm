import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Download,
  Eye,
  Edit2,
  Trash2,
  Users,
  UserCheck,
  CalendarOff,
  Building2,
  MapPin,
  Phone,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/contexts/ToastContext';
import { employeeService } from '@/modules/employees/services/employee.service';
import { getEmployeeProject } from './TeamPage';
import { STANDARD_PROJECTS } from '@/core/constants/projects';

export const EmployeeListPage = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await employeeService.getAll();
      setEmployees(data || []);
    } catch {
      toast.error('Failed to load employee list', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await employeeService.delete(employeeToDelete.id);
      setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete.id));
      toast.success(`${employeeToDelete.name} has been removed from directory.`, 'Employee Deleted');
      setEmployeeToDelete(null);
    } catch {
      toast.error('Could not delete employee record.', 'Error');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Employee ID,Name,Mobile,Emergency Contact Name,Emergency Contact Phone,DOB,Joining Date,Designation,Department,Address,Status',
    ];
    const rows = employees.map(
      (e) =>
        `"${e.employeeId}","${e.name}","${e.contact?.phone || ''}","${e.emergency?.name || ''}","${
          e.emergency?.phone || ''
        }","${e.personal?.dob || ''}","${e.employment?.joiningDate || ''}","${
          e.employment?.designation || ''
        }","${e.employment?.department || ''}","${(e.contact?.currentAddress || '').replace(/"/g, '""')}","${
          e.employment?.status || 'Active'
        }"`
    );
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

  // Metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.employment?.status === 'Active').length;
  const onLeaveEmployees = employees.filter((e) => e.employment?.status === 'On Leave').length;
  const totalDepartments = new Set(employees.map((e) => e.employment?.department).filter(Boolean)).size;

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (activeTab !== 'all' && emp.employment?.status !== activeTab) return false;
      if (selectedDept !== 'all' && emp.employment?.department !== selectedDept) return false;
      if (selectedProject !== 'all' && getEmployeeProject(emp) !== selectedProject) return false;
      if (
        selectedLocation !== 'all' &&
        !emp.employment?.workLocation?.toLowerCase().includes(selectedLocation.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [employees, activeTab, selectedDept, selectedProject, selectedLocation]);

  // Stage Tabs
  const stageTabs = [
    { id: 'all', label: 'All Personnel', count: totalEmployees },
    { id: 'Active', label: 'Active on Duty', count: activeEmployees },
    { id: 'On Leave', label: 'On Leave', count: onLeaveEmployees },
  ];

  const columns = [
    {
      key: 'employeeId',
      header: 'Emp ID',
      sortable: true,
      className: 'w-24 font-mono font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap',
      render: (emp) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
          {emp.employeeId}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Staff Member',
      sortable: true,
      className: 'min-w-[220px]',
      render: (emp) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar src={emp.avatarUrl} name={emp.name} size="sm" />
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white hover:text-[#D5860B] transition-colors text-xs sm:text-sm whitespace-nowrap">
              {emp.name}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
              <span>{emp.contact?.workEmail}</span>
              {emp.contact?.phone && (
                <>
                  <span>•</span>
                  <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5 text-slate-400" />
                    {emp.contact.phone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'designation',
      header: 'Designation',
      sortable: true,
      className: 'min-w-[160px]',
      render: (emp) => (
        <p className="text-slate-800 dark:text-slate-200 font-medium text-xs whitespace-nowrap">
          {emp.employment?.designation}
        </p>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      className: 'min-w-[170px]',
      render: (emp) => {
        let badgeVariant = 'gold';
        const dept = emp.employment?.department || '';
        if (dept.includes('Geology') || dept.includes('Mineral')) badgeVariant = 'gold';
        else if (dept.includes('Mining') || dept.includes('Survey')) badgeVariant = 'slate';
        else if (dept.includes('GIS')) badgeVariant = 'cyan';
        else if (dept.includes('HR')) badgeVariant = 'purple';
        return (
          <div className="min-w-0">
            <Badge variant={badgeVariant} size="sm" className="whitespace-nowrap">
              {dept}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'project',
      header: 'Assigned Project / Site',
      sortable: true,
      className: 'min-w-[180px]',
      render: (emp) => {
        const proj = getEmployeeProject(emp);
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D5860B]" />
            {proj}
          </span>
        );
      },
    },
    {
      key: 'emergency',
      header: 'Emergency Contact',
      className: 'min-w-[170px] whitespace-nowrap',
      render: (emp) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{emp.emergency?.name || '-'}</p>
          {emp.emergency?.phone && (
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              {emp.emergency.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'joiningDate',
      header: 'Joining Date',
      sortable: true,
      className: 'w-28 text-center whitespace-nowrap',
      render: (emp) => (
        <span className="text-slate-700 dark:text-slate-300 font-mono text-xs tabular-nums whitespace-nowrap">
          {emp.employment?.joiningDate}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'w-24 text-center whitespace-nowrap',
      render: (emp) => (
        <div className="flex justify-center">
          <StatusBadge status={emp.employment?.status || 'Active'} size="sm" />
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right whitespace-nowrap',
      render: (emp) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/hr/employees/${emp.id}`)}
            className="p-1.5 text-slate-400 hover:text-[#D5860B] hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/hr/employees/${emp.id}/edit`)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
            title="Edit Employee"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEmployeeToDelete(emp)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* CRM PageHeader */}
      <PageHeader
        title="Employee Directory"
        description="Official workforce registry of all Bansal Geo Solutions corporate executives and exploration site personnel."
        breadcrumbs={[
          { label: 'Dashboard', path: '/hr' },
          { label: 'Employees' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hr/employees/new')}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Add Employee
            </Button>
          </div>
        }
      />

      {/* CRM Stat Cards Strip */}
      <section className="stat-grid">
        <div className="card stat-card tone-amber">
          <div className="stat-top">
            <span className="stat-icon">
              <Users size={20} />
            </span>
            <h3>Total Workforce</h3>
          </div>
          <strong className="stat-value">{totalEmployees}</strong>
          <div className="stat-meta">
            <span className="muted">Corporate & Site Personnel</span>
          </div>
        </div>

        <div className="card stat-card tone-success">
          <div className="stat-top">
            <span className="stat-icon">
              <UserCheck size={20} />
            </span>
            <h3>Active on Duty</h3>
          </div>
          <strong className="stat-value">{activeEmployees}</strong>
          <div className="stat-meta">
            <span className="stat-delta positive">
              {totalEmployees ? Math.round((activeEmployees / totalEmployees) * 100) : 0}% deployed
            </span>
            <span className="muted">Jaipur HQ & Sites</span>
          </div>
        </div>

        <div className="card stat-card tone-warning">
          <div className="stat-top">
            <span className="stat-icon">
              <CalendarOff size={20} />
            </span>
            <h3>On Leave</h3>
          </div>
          <strong className="stat-value">{onLeaveEmployees}</strong>
          <div className="stat-meta">
            <span className="muted">Approved Leaves</span>
          </div>
        </div>

        <div className="card stat-card tone-info">
          <div className="stat-top">
            <span className="stat-icon">
              <Building2 size={20} />
            </span>
            <h3>Departments</h3>
          </div>
          <strong className="stat-value">{totalDepartments}</strong>
          <div className="stat-meta">
            <span className="muted">Specialized Units</span>
          </div>
        </div>
      </section>

      {/* Single Unified CRM Card with DataTable */}
      <DataTable
        compact={true}
        columns={columns}
        data={filteredEmployees}
        keyField="id"
        searchPlaceholder="Search staff by name, code, designation, mobile..."
        searchFields={['name', 'employeeId', 'employment.designation', 'contact.phone', 'employment.department']}
        onRowClick={(emp) => navigate(`/hr/employees/${emp.id}`)}
        filterComponent={
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Status Stage Tabs */}
            <div className="stage-tabs mr-1">
              {stageTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`stage-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <span>{tab.label}</span>
                  <span className="tab-count">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Department Dropdown */}
            <div className="w-full xs:w-44">
              <Select
                size="sm"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                options={[
                  { label: 'All Departments', value: 'all' },
                  { label: 'Mineral Exploration', value: 'Mineral Exploration' },
                  { label: 'Mining & Survey', value: 'Mining & Survey' },
                  { label: 'HR & Administration', value: 'HR & Administration' },
                  { label: 'GIS & Remote Sensing', value: 'GIS, Remote Sensing & UAV' },
                ]}
              />
            </div>

            {/* Project Dropdown */}
            <div className="w-full xs:w-48">
              <Select
                size="sm"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                options={[
                  { label: 'All Projects / Sites', value: 'all' },
                  ...STANDARD_PROJECTS.map((p) => ({ label: p, value: p })),
                ]}
              />
            </div>

            {(selectedDept !== 'all' || selectedProject !== 'all' || activeTab !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDept('all');
                  setSelectedProject('all');
                  setActiveTab('all');
                }}
                className="link-button text-xs flex items-center gap-1 text-rose-600 hover:text-rose-700"
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>
        }
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={!!employeeToDelete}
        onClose={() => setEmployeeToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Employee Record"
        message={`Are you sure you want to remove ${employeeToDelete?.name} (${employeeToDelete?.employeeId}) from the directory? This action cannot be undone.`}
        confirmText="Yes, Delete Record"
        variant="danger"
      />
    </div>
  );
};
