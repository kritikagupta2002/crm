import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useToast } from '@/contexts/ToastContext';
import { settingsService } from '@/modules/settings/services/settings.service';
export const PayrollSettingsPage = () => {
    const toast = useToast();
    const [settings, setSettings] = useState(null);
    useEffect(() => {
        settingsService.getPayrollSettings().then(setSettings);
    }, []);
    const handleSave = async (e) => {
        e.preventDefault();
        if (!settings)
            return;
        await settingsService.updatePayrollSettings(settings);
        toast.success('Statutory tax and provident fund rates saved.', 'Settings Updated');
    };
    if (!settings)
        return null;
    return (<Card className="p-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-6">
        Statutory Payroll & Deduction Configurations
      </h3>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Disbursal Cutoff Day" type="number" value={settings.salaryDisbursementDay} onChange={(e) => setSettings({ ...settings, salaryDisbursementDay: Number(e.target.value) })}/>
          <Input label="Currency Symbol" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}/>
          <Input label="Employee Provident Fund (%)" type="number" step="0.5" value={settings.pfDeductionPercentage} onChange={(e) => setSettings({ ...settings, pfDeductionPercentage: Number(e.target.value) })}/>
          <Input label="Professional Tax Monthly (₹)" type="number" value={settings.professionalTaxMonthly} onChange={(e) => setSettings({ ...settings, professionalTaxMonthly: Number(e.target.value) })}/>
          <Input label="ESI Employer Contribution (%)" type="number" step="0.25" value={settings.esiEmployerPercentage} onChange={(e) => setSettings({ ...settings, esiEmployerPercentage: Number(e.target.value) })}/>
          <Input label="ESI Employee Contribution (%)" type="number" step="0.25" value={settings.esiEmployeePercentage} onChange={(e) => setSettings({ ...settings, esiEmployeePercentage: Number(e.target.value) })}/>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4"/>}>
            Save Payroll Rules
          </Button>
        </div>
      </form>
    </Card>);
};
