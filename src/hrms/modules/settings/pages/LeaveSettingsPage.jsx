import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useToast } from '@/contexts/ToastContext';
import { settingsService } from '@/modules/settings/services/settings.service';
export const LeaveSettingsPage = () => {
    const toast = useToast();
    const [settings, setSettings] = useState(null);
    useEffect(() => {
        settingsService.getLeaveSettings().then(setSettings);
    }, []);
    const handleSave = async (e) => {
        e.preventDefault();
        if (!settings)
            return;
        await settingsService.updateLeaveSettings(settings);
        toast.success('Corporate leave quota policies and employee banks updated.', 'Settings Saved');
    };
    if (!settings)
        return null;
    return (<Card className="p-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-6">
        Annual leave quotas
      </h3>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="Annual Casual Leave Bank (Days)" type="number" value={settings.annualCasualLeave} onChange={(e) => setSettings({ ...settings, annualCasualLeave: Number(e.target.value) })}/>
          <Input label="Annual Sick Leave Bank (Days)" type="number" value={settings.annualSickLeave} onChange={(e) => setSettings({ ...settings, annualSickLeave: Number(e.target.value) })}/>
          <Input label="Annual Earned / Privilege Leave (Days)" type="number" value={settings.annualEarnedLeave} onChange={(e) => setSettings({ ...settings, annualEarnedLeave: Number(e.target.value) })}/>
          <Input label="Compensatory Off Quota (Days)" type="number" value={settings.annualCompOffLeave ?? 8} onChange={(e) => setSettings({ ...settings, annualCompOffLeave: Number(e.target.value) })}/>
          <Input label="Field Duty Leave Quota (Days)" type="number" value={settings.annualFieldDutyLeave ?? 15} onChange={(e) => setSettings({ ...settings, annualFieldDutyLeave: Number(e.target.value) })}/>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4"/>}>
            Save Leave Policies
          </Button>
        </div>
      </form>
    </Card>);
};
