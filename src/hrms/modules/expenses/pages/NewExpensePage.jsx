import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { DatePicker } from '@/components/common/DatePicker';
import { Textarea } from '@/components/common/Textarea';
import { FileUpload } from '@/components/common/FileUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { expenseService } from '@/modules/expenses/services/expense.service';
import { STANDARD_PROJECTS } from '@/core/constants/projects';
import { attachmentStorage } from '@/core/storage/attachmentStorage';

export const NewExpensePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();

    const [category, setCategory] = useState('Site Travel & Transit');
    const [amount, setAmount] = useState('5000');
    const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [project, setProject] = useState(STANDARD_PROJECTS[0]);
    const [description, setDescription] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const errs = {};
        const numAmount = Number(amount);
        if (!amount || isNaN(numAmount) || numAmount <= 0) {
            errs.amount = 'Amount must be a positive number greater than ₹0';
        }
        if (!date) {
            errs.date = 'Expense date is required';
        } else {
            const today = new Date().toLocaleDateString('en-CA');
            if (date > today) {
                errs.date = 'Expense date cannot be in the future';
            }
        }
        if (!category) {
            errs.category = 'Please select a valid expense category';
        }
        if (!project || !project.trim()) {
            errs.project = 'Project block must be specified';
        }
        if (!description.trim() || description.trim().length < 10) {
            errs.description = 'Justification description must be at least 10 characters';
        }
        if (!user?.employeeId) {
            errs.auth = 'Valid employee profile required. Please log in again.';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleFieldChange = (field, setter, val) => {
        setter(val);
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            toast.error('Please resolve the validation errors before submitting.', 'Validation Error');
            return;
        }

        setIsSubmitting(true);
        try {
            let receiptPreviewUrl = null;
            if (uploadedFile) {
                const stored = await attachmentStorage.saveFile(uploadedFile.name, uploadedFile);
                if (stored) {
                    receiptPreviewUrl = stored.previewDataUrl;
                }
            }

            const submitted = await expenseService.submitExpense({
                employeeId: user.employeeId,
                employeeName: user.name || 'Staff Member',
                department: user.department || 'Operations',
                category,
                requestedAmount: Number(amount),
                amount: Number(amount),
                date,
                project,
                description: description.trim(),
                receiptFileName: uploadedFile ? uploadedFile.name : null,
                receiptFileSize: uploadedFile ? uploadedFile.size : null,
                receiptFileType: uploadedFile ? uploadedFile.type : null,
                receiptUrl: receiptPreviewUrl,
                receiptDataUrl: receiptPreviewUrl,
            });

            if (uploadedFile && submitted?.expenseNumber) {
                await attachmentStorage.saveFile(submitted.expenseNumber, uploadedFile);
            }
            toast.success(`Expense claim for ₹${Number(amount).toLocaleString('en-IN')} submitted for management approval.`, 'Expense Claim Submitted');
            navigate('/hr/expenses');
        } catch (err) {
            toast.error(err.message || 'Could not submit expense.', 'Submission Failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-12">
            <PageHeader 
                title="Submit Expense Claim" 
                description="File reimbursement for travel, survey consumables, and project expenditures." 
                breadcrumbs={[
                    { label: 'HRMS', path: '/hr' },
                    { label: 'Expenses', path: '/hr/expenses' },
                    { label: 'Submit Claim' },
                ]} 
                actions={
                    <Button variant="secondary" size="sm" onClick={() => navigate('/hr/expenses')}>
                        <ArrowLeft className="w-4 h-4 mr-1.5"/>
                        Cancel
                    </Button>
                }
            />

            {/* Validation Error Banner */}
            {Object.keys(errors).length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-800 dark:text-rose-300">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"/>
                    <div className="text-xs">
                        <p className="font-bold">Please correct the highlighted errors before submitting:</p>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-700 dark:text-rose-400">
                            {Object.values(errors).map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select 
                                label="Expense Category" 
                                isRequired 
                                value={category} 
                                onChange={(e) => handleFieldChange('category', setCategory, e.target.value)} 
                                error={errors.category} 
                                options={[
                                    { label: 'Site Travel & Transit', value: 'Site Travel & Transit' },
                                    { label: 'Geological Survey Equipment', value: 'Geological Survey Equipment' },
                                    { label: 'Field Accommodation', value: 'Field Accommodation' },
                                    { label: 'Fuel & Vehicle Maintenance', value: 'Fuel & Vehicle Maintenance' },
                                    { label: 'Client Meeting & Meals', value: 'Client Meeting & Meals' },
                                    { label: 'Software & Licenses', value: 'Software & Licenses' },
                                    { label: 'Other', value: 'Other' },
                                ]}
                            />

                            <Input 
                                label="Claim Amount (INR ₹)" 
                                type="number" 
                                isRequired 
                                value={amount} 
                                onChange={(e) => handleFieldChange('amount', setAmount, e.target.value)} 
                                error={errors.amount} 
                                placeholder="e.g. 5000"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DatePicker 
                                label="Date of Expense" 
                                isRequired 
                                value={date} 
                                onChange={(e) => handleFieldChange('date', setDate, e.target.value)} 
                                error={errors.date}
                            />

                            <Select 
                                label="Assigned Project / Client Block" 
                                isRequired 
                                value={project} 
                                onChange={(e) => handleFieldChange('project', setProject, e.target.value)} 
                                error={errors.project} 
                                options={STANDARD_PROJECTS.map((p) => ({ label: p, value: p }))}
                            />
                        </div>

                        <Textarea 
                            label="Detailed Description & Justification" 
                            isRequired 
                            value={description} 
                            onChange={(e) => handleFieldChange('description', setDescription, e.target.value)} 
                            error={errors.description} 
                            placeholder="State the technical necessity, vendor names, and deliverables covered (minimum 10 characters)..." 
                            rows={3}
                        />

                        <FileUpload 
                            label="Attach GST Tax Invoice / Cash Receipt (Optional)" 
                            onFileSelect={async (f) => {
                                setUploadedFile(f);
                                if (f) {
                                    await attachmentStorage.saveFile(f.name, f);
                                }
                            }} 
                            helperText="PDF, PNG, JPG receipts up to 10MB (Saved locally to your claim record)"
                        />
                    </div>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => navigate('/hr/expenses')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        <Save className="w-4 h-4 mr-1.5"/>
                        {isSubmitting ? 'Submitting Claim...' : 'Submit for Approval'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
