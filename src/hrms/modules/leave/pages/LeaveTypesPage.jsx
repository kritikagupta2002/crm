import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { useToast } from '@/contexts/ToastContext';
import { leaveService } from '@/modules/leave/services/leave.service';
export const LeaveTypesPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [types, setTypes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [quota, setQuota] = useState(12);
    const [carryForward, setCarryForward] = useState(0);
    const [encashable, setEncashable] = useState(false);
    const [notice, setNotice] = useState(1);
    const [desc, setDesc] = useState('');
    const load = async () => {
        const data = await leaveService.getLeaveTypes();
        setTypes(data);
    };
    useEffect(() => {
        load();
    }, []);
    const handleSave = async () => {
        if (!name.trim() || !code.trim()) {
            toast.error('Leave type name and code are required.', 'Validation Error');
            return;
        }
        await leaveService.createLeaveType({
            name: name,
            code,
            annualQuota: Number(quota),
            carryForwardMax: Number(carryForward),
            encashable,
            minNoticeDays: Number(notice),
            applicableTo: 'All Permanent Personnel',
            description: desc,
        });
        toast.success(`Leave category "${name}" added to company policy.`, 'Category Created');
        setIsModalOpen(false);
        load();
    };
    const columns = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            className: 'w-20 font-mono font-bold text-blue-700',
        },
        {
            key: 'name',
            header: 'Leave Policy Name',
            sortable: true,
            render: (t) => (<div>
          <span className="font-bold text-slate-900 dark:text-white">{t.name}</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{t.description}</p>
        </div>),
        },
        {
            key: 'annualQuota',
            header: 'Annual Bank',
            sortable: true,
            render: (t) => (<span className="font-bold text-slate-900 dark:text-white">{t.annualQuota} Days</span>),
        },
        {
            key: 'carryForwardMax',
            header: 'Carry Forward Limit',
            render: (t) => (<span className="text-slate-600 dark:text-slate-400 text-xs">{t.carryForwardMax} Days</span>),
        },
        {
            key: 'encashable',
            header: 'Encashable',
            render: (t) => t.encashable ? (<span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
            <Check className="w-3.5 h-3.5"/> Yes
          </span>) : (<span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
            <X className="w-3.5 h-3.5"/> No
          </span>),
        },
        {
            key: 'minNoticeDays',
            header: 'Min Notice',
            render: (t) => (<span className="text-slate-600 dark:text-slate-400 text-xs">{t.minNoticeDays} day(s) advance</span>),
        },
        {
            key: 'applicableTo',
            header: 'Eligibility',
            render: (t) => <Badge variant="slate" size="sm">{t.applicableTo}</Badge>,
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title="Leave Types" description="Configure entitlement quotas, encashment criteria, and notice requirements." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Leave', path: '/hr/leave' },
            { label: 'Leave Types' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/leave')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
              Back
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4"/>}>
              Add Leave Type
            </Button>
          </div>}/>

      <DataTable columns={columns} data={types} keyField="id" searchPlaceholder="Search leave policies..." searchFields={['name', 'code']}/>

      {/* Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure New Leave Category" description="Establish entitlement rules, carry-forward, and encashability." footer={<>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Policy
            </Button>
          </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input label="Policy Name" isRequired value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sabbatical Leave"/>
            </div>
            <div>
              <Input label="Code" isRequired value={code} onChange={(e) => setCode(e.target.value)} placeholder="SAB"/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Annual Quota (Days)" type="number" isRequired value={quota} onChange={(e) => setQuota(Number(e.target.value))}/>
            <Input label="Max Carry Forward" type="number" value={carryForward} onChange={(e) => setCarryForward(Number(e.target.value))}/>
            <Input label="Min Notice (Days)" type="number" value={notice} onChange={(e) => setNotice(Number(e.target.value))}/>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input type="checkbox" checked={encashable} onChange={(e) => setEncashable(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"/>
            <span>Allow encashment upon separation or fiscal year-end</span>
          </label>

          <Textarea label="Policy Description" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Outline criteria and statutory guidelines..." rows={2}/>
        </div>
      </Modal>
    </div>);
};
