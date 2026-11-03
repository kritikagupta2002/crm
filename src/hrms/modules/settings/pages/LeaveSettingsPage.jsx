import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Skeleton } from '@/components/common/Skeleton';
import { useToast } from '@/contexts/ToastContext';
import { settingsService } from '@/modules/settings/services/settings.service';

const DEFAULT_ACCRUAL = { PL: 1, CL: 0.5, SL: 0.5 };
const FIELDS = [
    { code: 'PL', label: 'Privilege Leave (PL) per month' },
    { code: 'CL', label: 'Casual Leave (CL) per month' },
    { code: 'SL', label: 'Sick Leave (SL) per month' },
];

/* Leave credits: opening balances as on a date, then days credited at every month end (pro rata for part months). */
export const LeaveSettingsPage = () => {
    const toast = useToast();
    const [settings, setSettings] = useState(null);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        settingsService.getLeaveSettings().then((s) => setSettings(s || {}));
    }, []);
    const accrual = { ...DEFAULT_ACCRUAL, ...(settings?.monthlyAccrual || {}) };
    const setRate = (code, value) => setSettings({ ...settings, monthlyAccrual: { ...accrual, [code]: Math.max(0, Number(value) || 0) } });
    const handleSave = async (e) => {
        e.preventDefault();
        if (!settings)
            return;
        setSaving(true);
        try {
            await settingsService.updateLeaveSettings({ ...settings, monthlyAccrual: accrual });
            toast.success('Monthly leave credits updated.', 'Settings Saved');
        }
        catch (err) {
            toast.error(err.message || 'Could not save the leave settings.', 'Not saved');
        }
        finally {
            setSaving(false);
        }
    };
    return (<Card className="p-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
        Monthly leave credits
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
        Balances start from the HR sheet as on {settings?.openingBalanceDate || '2026-10-31'}. At every month end these days are
        credited to each employee, pro rata to the days they were employed that month.
      </p>

      {!settings ? (<div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-busy="true">
          {FIELDS.map((f) => (<div key={f.code} className="space-y-2"><Skeleton width="60%" height={10}/><Skeleton height={38} radius={8}/></div>))}
        </div>) : (<form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FIELDS.map((f) => (<Input key={f.code} label={f.label} type="number" step="0.5" min="0" value={accrual[f.code]} onChange={(e) => setRate(f.code, e.target.value)}/>))}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="submit" variant="primary" isLoading={saving} leftIcon={<Save className="w-4 h-4"/>}>
            Save Leave Credits
          </Button>
        </div>
      </form>)}
    </Card>);
};
