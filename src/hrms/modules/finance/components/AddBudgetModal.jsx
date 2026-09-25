import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useToast } from '@/contexts/ToastContext';
import { financeService } from '@/modules/finance/services/finance.service';
export const AddBudgetModal = ({ isOpen, onClose, onBudgetAdded, }) => {
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [costCenter, setCostCenter] = useState('');
    const [category, setCategory] = useState('Exploration CAPEX');
    const [allocatedAmount, setAllocatedAmount] = useState(1000000);
    const [actualSpend, setActualSpend] = useState(200000);
    const [projectPeriod, setProjectPeriod] = useState('FY 2026-27 (Q3-Q4)');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!costCenter.trim()) {
            toast.error('Please enter the project or cost center name.', 'Validation Error');
            return;
        }
        if (allocatedAmount <= 0) {
            toast.error('Allocated amount must be greater than zero.', 'Validation Error');
            return;
        }
        setIsSubmitting(true);
        try {
            const created = await financeService.createBudgetAllocation({
                costCenter: costCenter.trim(),
                category,
                allocatedAmount: Number(allocatedAmount),
                actualSpend: Number(actualSpend || 0),
                projectPeriod: projectPeriod.trim(),
            });
            toast.success(`Budget allocated for ${created.costCenter} (₹${created.allocatedAmount.toLocaleString('en-IN')})`, 'Budget Created');
            onBudgetAdded(created);
            onClose();
        }
        catch {
            toast.error('Could not allocate budget.', 'System Error');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<Modal isOpen={isOpen} onClose={onClose} title="Add Budget Allocation" description="Allocate financial budget for geological projects, field exploration campaigns, or departmental expenses." maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 font-inter">
        <Input label="Project or Cost Center Name" placeholder="e.g. Zawar Lead-Zinc Deep Core Drilling Block 3" value={costCenter} onChange={(e) => setCostCenter(e.target.value)} isRequired/>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Budget Category" value={category} onChange={(e) => setCategory(e.target.value)} options={[
            { value: 'Exploration CAPEX', label: 'Exploration CAPEX' },
            { value: 'Field Operations OPEX', label: 'Field Operations OPEX' },
            { value: 'Assay & Laboratory', label: 'Assay & Laboratory' },
            { value: 'Logistics & Vehicles', label: 'Logistics & Vehicles' },
            { value: 'Administration', label: 'Administration' },
            { value: 'Personnel', label: 'Personnel Costs' },
        ]}/>
          <Input label="Fiscal Project Period" placeholder="e.g. FY 2026-27 (Q3-Q4)" value={projectPeriod} onChange={(e) => setProjectPeriod(e.target.value)} isRequired/>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Allocated Budget (₹)" type="number" min="1" value={allocatedAmount} onChange={(e) => setAllocatedAmount(Number(e.target.value))} isRequired/>
          <Input label="Initial Actual Spend (₹)" type="number" min="0" value={actualSpend} onChange={(e) => setActualSpend(Number(e.target.value))}/>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-[#253344]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Allocate Budget
          </Button>
        </div>
      </form>
    </Modal>);
};
