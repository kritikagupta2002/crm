import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, User, Briefcase, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { LoadingState } from '@/components/common/LoadingState';
import { useToast } from '@/contexts/ToastContext';
import { employeeService } from '@/modules/employees/services/employee.service';
const editSchema = z.object({
    name: z.string().min(2, 'Full name required'),
    workEmail: z.string().email('Valid corporate email required'),
    phone: z.string().min(10, 'Valid 10-digit phone required'),
    department: z.string().min(1, 'Department required'),
    designation: z.string().min(1, 'Designation required'),
    workLocation: z.enum([
        'Jaipur Corporate HQ',
        'Bhilwara Site Office',
        'Udaipur Exploration Base',
        'Remote / Field',
    ]),
    employmentType: z.enum(['Full-Time', 'Part-Time', 'Contract', 'Consultant', 'Intern']),
    status: z.enum(['Active', 'On Leave', 'Notice Period', 'Terminated']),
    role: z.enum(['hr', 'employee']),
    managerName: z.string().min(1, 'Manager name required'),
    bankName: z.string().min(2, 'Bank name required'),
    accountNumber: z.string().min(6, 'Account number required'),
    panNumber: z.string().min(10, 'PAN required'),
});
export const EditEmployeePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting }, } = useForm({
        resolver: zodResolver(editSchema),
    });
    useEffect(() => {
        const loadEmp = async () => {
            if (!id)
                return;
            setIsLoading(true);
            try {
                const emp = await employeeService.getById(id);
                if (emp) {
                    reset({
                        name: emp.name,
                        workEmail: emp.contact.workEmail,
                        phone: emp.contact.phone,
                        department: emp.employment.department,
                        designation: emp.employment.designation,
                        workLocation: emp.employment.workLocation,
                        employmentType: emp.employment.employmentType,
                        status: emp.employment.status,
                        role: emp.role,
                        managerName: emp.employment.managerName,
                        bankName: emp.bank.bankName,
                        accountNumber: emp.bank.accountNumber,
                        panNumber: emp.bank.panNumber,
                    });
                }
            }
            catch {
                toast.error('Failed to load employee for editing.', 'Error');
            }
            finally {
                setIsLoading(false);
            }
        };
        loadEmp();
    }, [id, reset]);
    const onSubmit = async (data) => {
        if (!id)
            return;
        try {
            const emp = await employeeService.getById(id);
            if (!emp)
                throw new Error('Employee not found');
            await employeeService.update(id, {
                name: data.name,
                role: data.role,
                contact: {
                    ...emp.contact,
                    workEmail: data.workEmail,
                    phone: data.phone,
                },
                employment: {
                    ...emp.employment,
                    department: data.department,
                    designation: data.designation,
                    workLocation: data.workLocation,
                    employmentType: data.employmentType,
                    status: data.status,
                    managerName: data.managerName,
                },
                bank: {
                    ...emp.bank,
                    bankName: data.bankName,
                    accountNumber: data.accountNumber,
                    panNumber: data.panNumber,
                },
            });
            toast.success(`Profile for ${data.name} updated successfully.`, 'Changes Saved');
            navigate(`/hr/employees/${id}`);
        }
        catch {
            toast.error('Could not save modifications.', 'Error');
        }
    };
    if (isLoading) {
        return <LoadingState message="Loading employee information..."/>;
    }
    return (<div className="space-y-6 pb-12">
      <PageHeader title="Edit Employee Profile" description="Update departmental placement, contact channels, and system security credentials." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Employees', path: '/hr/employees' },
            { label: 'Edit Profile' },
        ]} actions={<Button variant="outline" size="sm" onClick={() => navigate(`/hr/employees/${id}`)} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
            Cancel
          </Button>}/>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400"/>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">General Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" isRequired {...register('name')} error={errors.name?.message}/>
            <Input label="Official Email" isRequired type="email" {...register('workEmail')} error={errors.workEmail?.message}/>
            <Input label="Phone Number" isRequired {...register('phone')} error={errors.phone?.message}/>
            <Select label="Security Access Role" isRequired {...register('role')} options={[
            { label: 'HR & System Admin', value: 'hr' },
            { label: 'Employee (Self-Service)', value: 'employee' },
        ]} error={errors.role?.message}/>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400"/>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Departmental & Site Placement</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Department" isRequired {...register('department')} options={[
            { label: 'Geology & Mineral Exploration', value: 'Geology & Mineral Exploration' },
            { label: 'Mining & Mine Planning', value: 'Mining & Mine Planning' },
            { label: 'GIS, Remote Sensing & UAV', value: 'GIS, Remote Sensing & UAV' },
            { label: 'Hydrogeology & Groundwater', value: 'Hydrogeology & Groundwater' },
            { label: 'Environment & Permitting', value: 'Environment & Permitting' },
            { label: 'Geotechnical Engineering', value: 'Geotechnical Engineering' },
            { label: 'Finance & Mineral Economics', value: 'Finance & Mineral Economics' },
            { label: 'Human Resources & Admin', value: 'Human Resources & Admin' },
        ]} error={errors.department?.message}/>
            <Input label="Designation Title" isRequired {...register('designation')} error={errors.designation?.message}/>
            <Select label="Operational Work Location" isRequired {...register('workLocation')} options={[
            { label: 'Jaipur Corporate HQ', value: 'Jaipur Corporate HQ' },
            { label: 'Bhilwara Site Office', value: 'Bhilwara Site Office' },
            { label: 'Udaipur Exploration Base', value: 'Udaipur Exploration Base' },
            { label: 'Remote / Field', value: 'Remote / Field' },
        ]} error={errors.workLocation?.message}/>
            <Input label="Reporting Manager" isRequired {...register('managerName')} error={errors.managerName?.message}/>
            <Select label="Employment Type" isRequired {...register('employmentType')} options={[
            { label: 'Full-Time', value: 'Full-Time' },
            { label: 'Contract', value: 'Contract' },
            { label: 'Consultant', value: 'Consultant' },
            { label: 'Intern', value: 'Intern' },
        ]} error={errors.employmentType?.message}/>
            <Select label="Employment Status" isRequired {...register('status')} options={[
            { label: 'Active', value: 'Active' },
            { label: 'On Leave', value: 'On Leave' },
            { label: 'Notice Period', value: 'Notice Period' },
            { label: 'Terminated', value: 'Terminated' },
        ]} error={errors.status?.message}/>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Banking & Statutory</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Bank Name" isRequired {...register('bankName')} error={errors.bankName?.message}/>
            <Input label="Account Number" isRequired {...register('accountNumber')} error={errors.accountNumber?.message}/>
            <Input label="PAN Number" isRequired {...register('panNumber')} error={errors.panNumber?.message}/>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={() => navigate(`/hr/employees/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Save className="w-4 h-4"/>}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>);
};
