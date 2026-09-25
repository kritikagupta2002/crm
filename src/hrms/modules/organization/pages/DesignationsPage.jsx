import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Users, RotateCcw, Briefcase, Layers, Award, AlertTriangle, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { StatCard } from '@/components/common/StatCard';
import { useToast } from '@/contexts/ToastContext';
import { storage } from '@/core/storage/storage';
import { organizationService } from '@/modules/organization/services/organization.service';
export const DesignationsPage = () => {
    const [designations, setDesignations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDesig, setEditingDesig] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    // Filters
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    // Form State
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [department, setDepartment] = useState('Geology & Mineral Exploration');
    const [level, setLevel] = useState('L3');
    const [minExp, setMinExp] = useState('3-5 Years');
    const [status, setStatus] = useState('Active');
    const [errors, setErrors] = useState({});
    const toast = useToast();
    const loadData = async () => {
        const data = await organizationService.getDesignations();
        setDesignations(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    // Live count of active employees per designation directly from storage (Zero Fake Numbers)
    const staffCounts = useMemo(() => {
        const counts = {};
        const employees = storage.getEmployees();
        employees.forEach((emp) => {
            if (emp.employment?.status === 'Active') {
                const dTitle = emp.employment?.designation?.trim().toLowerCase();
                if (dTitle)
                    counts[dTitle] = (counts[dTitle] || 0) + 1;
                const dCode = emp.employment?.designationCode?.trim().toLowerCase();
                if (dCode)
                    counts[dCode] = (counts[dCode] || 0) + 1;
            }
        });
        return counts;
    }, [designations]);
    const getStaffCount = (d) => {
        const titleKey = d.title.trim().toLowerCase();
        const codeKey = d.code.trim().toLowerCase();
        if (staffCounts[titleKey] !== undefined)
            return staffCounts[titleKey];
        if (staffCounts[codeKey] !== undefined)
            return staffCounts[codeKey];
        return d.employeeCount || 0;
    };
    // Dynamic Department list combining designations and system departments
    const availableDepartments = useMemo(() => {
        const fromDesig = designations.map((d) => d.department);
        const fromDepts = storage.getDepartments().map((dept) => dept.name);
        const set = new Set([...fromDesig, ...fromDepts].filter(Boolean));
        return Array.from(set).sort();
    }, [designations]);
    // Filtering
    const filteredDesignations = useMemo(() => {
        return designations.filter((d) => {
            if (selectedDept !== 'all' && d.department !== selectedDept)
                return false;
            if (selectedLevel !== 'all' && d.level !== selectedLevel)
                return false;
            if (selectedStatus !== 'all' && d.status !== selectedStatus)
                return false;
            return true;
        });
    }, [designations, selectedDept, selectedLevel, selectedStatus]);
    // KPI Summary Metrics
    const metrics = useMemo(() => {
        const totalDesignations = designations.length;
        const executiveSenior = designations.filter((d) => ['L6', 'L5'].includes(d.level)).length;
        const totalAssignedStaff = designations.reduce((acc, d) => acc + getStaffCount(d), 0);
        const uniqueDepts = new Set(designations.map((d) => d.department)).size;
        return { totalDesignations, executiveSenior, totalAssignedStaff, uniqueDepts };
    }, [designations, staffCounts]);
    const handleOpenAdd = () => {
        setEditingDesig(null);
        setTitle('');
        setCode('');
        setDepartment(availableDepartments[0] || 'Geology & Mineral Exploration');
        setLevel('L3');
        setMinExp('3-5 Years');
        setStatus('Active');
        setErrors({});
        setIsModalOpen(true);
    };
    const handleOpenEdit = (desig) => {
        setEditingDesig(desig);
        setTitle(desig.title);
        setCode(desig.code);
        setDepartment(desig.department);
        setLevel(desig.level);
        setMinExp(desig.minExperience);
        setStatus(desig.status);
        setErrors({});
        setIsModalOpen(true);
    };
    const validateForm = () => {
        const newErrors = {};
        // Title validation & limits
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            newErrors.title = 'Designation title is required.';
        }
        else if (trimmedTitle.length < 3) {
            newErrors.title = 'Title must be at least 3 characters.';
        }
        else if (trimmedTitle.length > 60) {
            newErrors.title = 'Title cannot exceed 60 characters limit.';
        }
        else {
            const duplicateTitle = designations.find((d) => d.title.trim().toLowerCase() === trimmedTitle.toLowerCase() &&
                d.id !== editingDesig?.id);
            if (duplicateTitle) {
                newErrors.title = `A designation titled "${trimmedTitle}" already exists.`;
            }
        }
        // Code validation & limits
        const trimmedCode = code.trim().toUpperCase();
        if (!trimmedCode) {
            newErrors.code = 'Designation code is required.';
        }
        else if (trimmedCode.length < 2) {
            newErrors.code = 'Code must be at least 2 characters.';
        }
        else if (trimmedCode.length > 12) {
            newErrors.code = 'Code cannot exceed 12 characters limit.';
        }
        else if (!/^[A-Z0-9-]+$/.test(trimmedCode)) {
            newErrors.code = 'Code must only contain letters, numbers, and hyphens (e.g. SR-GEO).';
        }
        else {
            const duplicateCode = designations.find((d) => d.code.trim().toUpperCase() === trimmedCode &&
                d.id !== editingDesig?.id);
            if (duplicateCode) {
                newErrors.code = `Code "${trimmedCode}" is already used by "${duplicateCode.title}".`;
            }
        }
        // Experience limit
        if (minExp.trim().length > 25) {
            newErrors.minExp = 'Experience text cannot exceed 25 characters.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSave = async () => {
        if (!validateForm()) {
            toast.error('Please fix validation errors before proceeding.', 'Validation Error');
            return;
        }
        const cleanTitle = title.trim();
        const cleanCode = code.trim().toUpperCase();
        const cleanExp = minExp.trim() || 'Not specified';
        if (editingDesig) {
            await organizationService.updateDesignation(editingDesig.id, {
                title: cleanTitle,
                code: cleanCode,
                department,
                level,
                minExperience: cleanExp,
                status,
            });
            toast.success(`Designation "${cleanTitle}" updated successfully.`, 'Designation Saved');
        }
        else {
            await organizationService.createDesignation({
                title: cleanTitle,
                code: cleanCode,
                department,
                level,
                minExperience: cleanExp,
                employeeCount: 0,
                status,
            });
            toast.success(`Designation "${cleanTitle}" created successfully.`, 'Designation Created');
        }
        setIsModalOpen(false);
        loadData();
    };
    const handleDeleteClick = (d) => {
        const staffCount = getStaffCount(d);
        if (staffCount > 0) {
            toast.error(`Cannot delete "${d.title}" because ${staffCount} active employee(s) currently hold this designation. Please reassign or update staff records first.`, 'Action Restricted');
            return;
        }
        setDeleteTarget(d);
    };
    const handleConfirmDelete = async () => {
        if (!deleteTarget)
            return;
        await organizationService.deleteDesignation(deleteTarget.id);
        toast.success(`Designation "${deleteTarget.title}" deleted successfully.`, 'Deleted');
        setDeleteTarget(null);
        loadData();
    };
    const getLevelBadgeClass = (lvl) => {
        switch (lvl) {
            case 'L6':
                return 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700';
            case 'L5':
                return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
            case 'L4':
                return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
            case 'L3':
                return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'L2':
                return 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
            case 'L1':
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };
    const getLevelLabel = (lvl) => {
        switch (lvl) {
            case 'L6':
                return 'L6 · Executive';
            case 'L5':
                return 'L5 · Principal / Head';
            case 'L4':
                return 'L4 · Senior Lead';
            case 'L3':
                return 'L3 · Specialist / Officer';
            case 'L2':
                return 'L2 · Executive';
            case 'L1':
                return 'L1 · Associate';
            default:
                return lvl;
        }
    };
    const columns = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            className: 'w-28 font-mono font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap',
        },
        {
            key: 'title',
            header: 'Designation Title',
            sortable: true,
            render: (d) => (<div>
          <span className="font-bold text-slate-900 dark:text-white block">{d.title}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {getLevelLabel(d.level)}
          </span>
        </div>),
        },
        {
            key: 'department',
            header: 'Department',
            sortable: true,
            render: (d) => <Badge variant="blue" size="sm">{d.department}</Badge>,
        },
        {
            key: 'level',
            header: 'Hierarchy Level',
            sortable: true,
            render: (d) => (<span className={`px-2.5 py-0.5 rounded-md font-mono font-bold text-xs border whitespace-nowrap ${getLevelBadgeClass(d.level)}`}>
          {d.level}
        </span>),
        },
        {
            key: 'minExperience',
            header: 'Min Experience',
            render: (d) => (<span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
          {d.minExperience}
        </span>),
        },
        {
            key: 'employeeCount',
            header: 'Active Staff',
            sortable: true,
            render: (d) => {
                const count = getStaffCount(d);
                return (<span className={`inline-flex items-center gap-1.5 font-semibold text-xs whitespace-nowrap px-2.5 py-0.5 rounded-full border ${count > 0
                        ? 'text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border-teal-200/70 dark:border-teal-800/60'
                        : 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800'}`}>
            <Users className={`w-3.5 h-3.5 ${count > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}/>
            {count} {count === 1 ? 'staff' : 'staff'}
          </span>);
            },
        },
        {
            key: 'status',
            header: 'Status',
            render: (d) => <StatusBadge status={d.status} size="sm"/>,
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right whitespace-nowrap',
            render: (d) => (<div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(d)} leftIcon={<Edit2 className="w-3.5 h-3.5"/>}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(d)} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5" title="Delete designation">
            <Trash2 className="w-3.5 h-3.5"/>
          </Button>
        </div>),
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title="Designations & Seniority" description="Hierarchical designations and seniority grading across technical and managerial bands with strict validation limits." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Organization' },
            { label: 'Designations' },
        ]} actions={<Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4"/>}>
            Add Designation
          </Button>}/>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard title="Total Designations" value={metrics.totalDesignations} icon={<Briefcase className="w-5 h-5 text-teal-600 dark:text-teal-400"/>} iconBgColor="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300" caption="Configured in organization" compact/>
        <StatCard title="Executive & Senior (L5-L6)" value={metrics.executiveSenior} icon={<Award className="w-5 h-5 text-amber-600 dark:text-amber-400"/>} iconBgColor="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" caption="Leadership & consultant roles" compact/>
        <StatCard title="Assigned Live Staff" value={metrics.totalAssignedStaff} icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400"/>} iconBgColor="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" caption="Real workforce count" compact/>
        <StatCard title="Operational Divisions" value={metrics.uniqueDepts} icon={<Layers className="w-5 h-5 text-purple-600 dark:text-purple-400"/>} iconBgColor="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300" caption="Covered departments" compact/>
      </div>

      <DataTable compact={true} columns={columns} data={filteredDesignations} keyField="id" searchPlaceholder="Search designations by title, code, department, level..." searchFields={['title', 'code', 'department', 'level']} filterComponent={<div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Department Filter with all active departments */}
            <div className="w-full sm:w-auto flex-1 sm:flex-initial min-w-full xs:min-w-[160px] sm:min-w-[170px]">
              <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} options={[
                { label: 'All Departments', value: 'all' },
                ...availableDepartments.map((dept) => ({
                    label: dept,
                    value: dept,
                })),
            ]}/>
            </div>

            {/* Hierarchy Level Filter with complete L1 through L6 */}
            <div className="w-full sm:w-auto flex-1 sm:flex-initial min-w-full xs:min-w-[140px] sm:min-w-[150px]">
              <Select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} options={[
                { label: 'All Levels (L1-L6)', value: 'all' },
                { label: 'Level 6 (L6) - Executive', value: 'L6' },
                { label: 'Level 5 (L5) - Principal / Head', value: 'L5' },
                { label: 'Level 4 (L4) - Senior Lead', value: 'L4' },
                { label: 'Level 3 (L3) - Specialist / Officer', value: 'L3' },
                { label: 'Level 2 (L2) - Executive / Junior', value: 'L2' },
                { label: 'Level 1 (L1) - Associate / Trainee', value: 'L1' },
            ]}/>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-auto flex-1 sm:flex-initial min-w-full xs:min-w-[110px] sm:min-w-[120px]">
              <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
            ]}/>
            </div>

            {/* Reset Filters */}
            {(selectedDept !== 'all' || selectedLevel !== 'all' || selectedStatus !== 'all') && (<Button variant="ghost" size="sm" onClick={() => {
                    setSelectedDept('all');
                    setSelectedLevel('all');
                    setSelectedStatus('all');
                }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs shrink-0 font-semibold w-full sm:w-auto flex items-center justify-center gap-1">
                <RotateCcw className="w-3 h-3"/>
                <span>Reset</span>
              </Button>)}
          </div>}/>

      {/* Add / Edit Designation Modal with Strict Limits */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDesig ? 'Edit Designation' : 'Create New Designation'} description="Configure designation grade, hierarchy seniority band, and department assignment." footer={<>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editingDesig ? 'Save Changes' : 'Create Designation'}
            </Button>
          </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Input label="Designation Title" isRequired maxLength={60} value={title} onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title)
                setErrors((prev) => ({ ...prev, title: undefined }));
        }} placeholder="e.g. Senior Mine Geologist" error={errors.title} helperText={`${title.length}/60 characters max`}/>
            </div>
            <div>
              <Input label="Designation Code" isRequired maxLength={12} value={code} onChange={(e) => {
            // Automatic uppercase and limit to valid characters
            const sanitized = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            setCode(sanitized);
            if (errors.code)
                setErrors((prev) => ({ ...prev, code: undefined }));
        }} placeholder="e.g. SR-GEO" error={errors.code} helperText={`${code.length}/12 chars (A-Z, 0-9, -)`}/>
            </div>
          </div>

          <Select label="Associated Department" isRequired value={department} onChange={(e) => setDepartment(e.target.value)} options={availableDepartments.map((dept) => ({
            label: dept,
            value: dept,
        }))}/>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Hierarchy & Seniority Level" isRequired value={level} onChange={(e) => setLevel(e.target.value)} options={[
            { label: 'L6 - Director / Executive Management', value: 'L6' },
            { label: 'L5 - Head of Department / Principal', value: 'L5' },
            { label: 'L4 - Team Lead / Senior Specialist', value: 'L4' },
            { label: 'L3 - Senior Executive / Specialist / Officer', value: 'L3' },
            { label: 'L2 - Junior Executive / Analyst', value: 'L2' },
            { label: 'L1 - Entry Level / Trainee / Associate', value: 'L1' },
        ]}/>

            <Select label="Min Experience Required" isRequired value={minExp} onChange={(e) => {
            setMinExp(e.target.value);
            if (errors.minExp)
                setErrors((prev) => ({ ...prev, minExp: undefined }));
        }} options={[
            { label: '0-1 Years (Entry/Trainee)', value: '0-1 Years' },
            { label: '1-3 Years (Junior)', value: '1-3 Years' },
            { label: '2-4 Years (Executive)', value: '2-4 Years' },
            { label: '3-5 Years (Specialist/Officer)', value: '3-5 Years' },
            { label: '5-8 Years (Senior)', value: '5-8 Years' },
            { label: '8+ Years (Lead)', value: '8+ Years' },
            { label: '10+ Years (Principal)', value: '10+ Years' },
            { label: '12+ Years (Director)', value: '12+ Years' },
            { label: '15+ Years (Executive/Chief)', value: '15+ Years' },
        ]} error={errors.minExp}/>
          </div>

          <div>
            <Select label="Status" isRequired value={status} onChange={(e) => setStatus(e.target.value)} options={[
            { label: 'Active - Available for hiring and assignments', value: 'Active' },
            { label: 'Inactive - Deprecated or frozen designation', value: 'Inactive' },
        ]}/>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal with Safety Guard */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Designation" description="Are you sure you want to delete this designation? This action cannot be undone." footer={<>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
              Confirm Delete
            </Button>
          </>}>
        {deleteTarget && (<div className="space-y-3">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"/>
              <div>
                <p className="font-semibold">Confirm permanent removal:</p>
                <p className="mt-1">
                  Designation <strong>{deleteTarget.title}</strong> (Code: <code>{deleteTarget.code}</code>) in{' '}
                  <strong>{deleteTarget.department}</strong> will be removed.
                </p>
              </div>
            </div>
          </div>)}
      </Modal>
    </div>);
};
