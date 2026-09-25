import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Users, MapPin, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { useToast } from '@/contexts/ToastContext';
import { organizationService } from '@/modules/organization/services/organization.service';
export const DepartmentsPage = () => {
    const [departments, setDepartments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    // Filters
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [headName, setHeadName] = useState('');
    const [location, setLocation] = useState('Jaipur Corporate HQ');
    const [description, setDescription] = useState('');
    const toast = useToast();
    const loadData = async () => {
        const data = await organizationService.getDepartments();
        setDepartments(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    const filteredDepartments = departments.filter((d) => {
        if (selectedLocation !== 'all' && !d.location.toLowerCase().includes(selectedLocation.toLowerCase()))
            return false;
        if (selectedStatus !== 'all' && d.status !== selectedStatus)
            return false;
        return true;
    });
    const handleOpenAdd = () => {
        setEditingDept(null);
        setName('');
        setCode('');
        setHeadName('');
        setLocation('Jaipur Corporate HQ');
        setDescription('');
        setIsModalOpen(true);
    };
    const handleOpenEdit = (dept) => {
        setEditingDept(dept);
        setName(dept.name);
        setCode(dept.code);
        setHeadName(dept.headName);
        setLocation(dept.location);
        setDescription(dept.description);
        setIsModalOpen(true);
    };
    const handleSave = async () => {
        if (!name.trim() || !code.trim()) {
            toast.error('Department name and code are required.', 'Validation Error');
            return;
        }
        if (editingDept) {
            await organizationService.updateDepartment(editingDept.id, {
                name,
                code,
                headName,
                location,
                description,
            });
            toast.success(`Department "${name}" updated successfully.`, 'Department Saved');
        }
        else {
            await organizationService.createDepartment({
                name,
                code,
                headName: headName || 'TBD',
                headEmployeeId: 'BGS-001',
                employeeCount: 0,
                location,
                description,
                status: 'Active',
            });
            toast.success(`Department "${name}" created successfully.`, 'Department Created');
        }
        setIsModalOpen(false);
        loadData();
    };
    const columns = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            className: 'w-20 font-mono font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap',
        },
        {
            key: 'name',
            header: 'Department Name',
            sortable: true,
            render: (d) => (<div>
          <span className="font-bold text-slate-900 dark:text-white">{d.name}</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-sm">{d.description}</p>
        </div>),
        },
        {
            key: 'headName',
            header: 'Department Head',
            sortable: true,
            render: (d) => (<span className="text-slate-800 dark:text-slate-200 font-medium">{d.headName}</span>),
        },
        {
            key: 'location',
            header: 'Location / Base',
            render: (d) => (<span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
          {d.location}
        </span>),
        },
        {
            key: 'employeeCount',
            header: 'Staff Count',
            sortable: true,
            render: (d) => (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 font-bold text-xs whitespace-nowrap">
          <Users className="w-3.5 h-3.5 text-[#D5860B] dark:text-amber-400 shrink-0"/>
          {d.employeeCount}
        </span>),
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
            render: (d) => (<Button variant="ghost" size="sm" onClick={() => handleOpenEdit(d)} leftIcon={<Edit2 className="w-3.5 h-3.5"/>}>
          Edit
        </Button>),
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title="Departments" description="Organizational structure and operational wings of Bansal Geo Solutions Pvt. Ltd." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Organization' },
            { label: 'Departments' },
        ]} actions={<Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4"/>}>
            Add Department
          </Button>}/>

      <DataTable compact={true} columns={columns} data={filteredDepartments} keyField="id" searchPlaceholder="Search departments by name or code..." searchFields={['name', 'code', 'headName']} filterComponent={<div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[140px]">
              <Select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} options={[
                { label: 'All Locations', value: 'all' },
                { label: 'Jaipur Corporate HQ', value: 'Jaipur' },
                { label: 'Bhilwara Site Office', value: 'Bhilwara' },
                { label: 'Udaipur Base', value: 'Udaipur' },
            ]}/>
            </div>
            <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[120px]">
              <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
            ]}/>
            </div>
            {(selectedLocation !== 'all' || selectedStatus !== 'all') && (<Button variant="ghost" size="sm" onClick={() => {
                    setSelectedLocation('all');
                    setSelectedStatus('all');
                }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs shrink-0 font-semibold w-full xs:w-auto flex items-center justify-center gap-1">
                <RotateCcw className="w-3 h-3"/>
                <span>Reset</span>
              </Button>)}
          </div>}/>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDept ? 'Edit Department' : 'Create New Department'} description="Define structural wing, department head, and operational location." footer={<>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Department
            </Button>
          </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input label="Department Name" isRequired value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Geophysics & Borehole Logging"/>
            </div>
            <div>
              <Input label="Dept Code" isRequired value={code} onChange={(e) => setCode(e.target.value)} placeholder="GEOPHYS"/>
            </div>
          </div>

          <Input label="Department Head Name" value={headName} onChange={(e) => setHeadName(e.target.value)} placeholder="e.g. Dr. Amit Kumar Bansal"/>

          <Select label="Location" value={location} onChange={(e) => setLocation(e.target.value)} options={[
            { label: 'Jaipur Corporate HQ', value: 'Jaipur Corporate HQ' },
            { label: 'Jaipur HQ & Bhilwara Mine Site', value: 'Jaipur HQ & Bhilwara Mine Site' },
            { label: 'Jaipur HQ & Udaipur Site', value: 'Jaipur HQ & Udaipur Site' },
            { label: 'Bhilwara Site Office', value: 'Bhilwara Site Office' },
        ]}/>

          <Textarea label="Department Overview & Responsibilities" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief scope of technical deliverables..." rows={3}/>
        </div>
      </Modal>
    </div>);
};
