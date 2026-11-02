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
        toast.success('Attendance rules saved.', 'Saved');
    };
    if (!settings)
        return null;
    return (<Card className="p-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-6">
        Attendance rules
      </h3>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Default start time (when no shift is assigned)" value={settings.workStartTime} onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}/>
          <Input label="Default end time" value={settings.workEndTime} onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}/>
          <Input label="Late mark after (grace minutes)" type="number" value={settings.gracePeriodMinutes} onChange={(e) => setSettings({ ...settings, gracePeriodMinutes: Number(e.target.value) })}/>
          <Input label="Half day if worked less than (hours)" type="number" step="0.5" value={settings.halfDayThresholdHours} onChange={(e) => setSettings({ ...settings, halfDayThresholdHours: Number(e.target.value) })}/>
          <Input label="Full day hours" type="number" step="0.5" value={settings.fullDayMinimumHours} onChange={(e) => setSettings({ ...settings, fullDayMinimumHours: Number(e.target.value) })}/>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4"/>}>
            Save Attendance Rules
          </Button>
        </div>
      </form>
    </Card>);
};
