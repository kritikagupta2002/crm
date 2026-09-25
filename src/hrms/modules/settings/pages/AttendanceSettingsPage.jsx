import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useToast } from '@/contexts/ToastContext';
import { settingsService } from '@/modules/settings/services/settings.service';
export const AttendanceSettingsPage = () => {
    const toast = useToast();
    const [settings, setSettings] = useState(null);
    useEffect(() => {
        settingsService.getAttendanceSettings().then(setSettings);
    }, []);
    const handleSave = async (e) => {
        e.preventDefault();
        if (!settings)
            return;
        await settingsService.updateAttendanceSettings(settings);
        toast.success('Attendance and biometric policy thresholds saved.', 'Settings Updated');
    };
    if (!settings)
        return null;
    return (<Card className="p-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-6">
        Attendance & Biometric Policy Rules
      </h3>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Standard Shift Start Time" value={settings.workStartTime} onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}/>
          <Input label="Standard Shift End Time" value={settings.workEndTime} onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}/>
          <Input label="Grace Period Threshold (Minutes)" type="number" value={settings.gracePeriodMinutes} onChange={(e) => setSettings({ ...settings, gracePeriodMinutes: Number(e.target.value) })}/>
          <Input label="Half-Day Minimum Hours" type="number" step="0.5" value={settings.halfDayThresholdHours} onChange={(e) => setSettings({ ...settings, halfDayThresholdHours: Number(e.target.value) })}/>
          <Input label="Full-Day Required Hours" type="number" step="0.5" value={settings.fullDayMinimumHours} onChange={(e) => setSettings({ ...settings, fullDayMinimumHours: Number(e.target.value) })}/>
          <Input label="Biometric Cloud Sync Interval (Minutes)" type="number" value={settings.biometricSyncIntervalMinutes} onChange={(e) => setSettings({ ...settings, biometricSyncIntervalMinutes: Number(e.target.value) })}/>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-[#111821] rounded-xl space-y-3 mt-4 border border-slate-200 dark:border-[#253344]">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
            <input type="checkbox" checked={settings.allowMobileGpsPunch} onChange={(e) => setSettings({ ...settings, allowMobileGpsPunch: e.target.checked })} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"/>
            <span>Enable Mobile GPS Punch for field exploration and drone survey pilots</span>
          </label>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4"/>}>
            Save Attendance Rules
          </Button>
        </div>
      </form>
    </Card>);
};
