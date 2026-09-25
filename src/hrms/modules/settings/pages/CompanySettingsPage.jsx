import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { useToast } from '@/contexts/ToastContext';
import { settingsService } from '@/modules/settings/services/settings.service';
export const CompanySettingsPage = () => {
    const toast = useToast();
    const [settings, setSettings] = useState(null);
    useEffect(() => {
        settingsService.getCompanySettings().then(setSettings);
    }, []);
    const handleSave = async (e) => {
        e.preventDefault();
        if (!settings)
            return;
        await settingsService.updateCompanySettings(settings);
        toast.success('Bansal Geo Solutions corporate records updated.', 'Settings Saved');
    };
    if (!settings)
        return null;
    return (<Card className="p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bansal Geo Solutions Pvt. Ltd.</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Official legal entity details, registered office & tax registrations</p>
        </div>
        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md">
          Jaipur HQ (BGSPL)
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Corporate Entity Name" isRequired value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}/>
          <Input label="Corporate Identification Number (CIN)" isRequired value={settings.cinNumber} onChange={(e) => setSettings({ ...settings, cinNumber: e.target.value })}/>
          <Input label="GSTIN Identification Number" isRequired value={settings.gstin} onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}/>
          <Input label="Permanent Account Number (PAN)" isRequired value={settings.panNumber} onChange={(e) => setSettings({ ...settings, panNumber: e.target.value })}/>
          <Input label="Corporate Contact Email" type="email" isRequired value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}/>
          <Input label="Corporate Telephone" isRequired value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })}/>
          <Input label="Official Website URL" value={settings.website} onChange={(e) => setSettings({ ...settings, website: e.target.value })}/>
          <Input label="Incorporation Year" value={settings.foundedYear} onChange={(e) => setSettings({ ...settings, foundedYear: e.target.value })}/>
        </div>

        <Textarea label="Registered Corporate Headquarters Address" isRequired value={settings.registeredOffice} onChange={(e) => setSettings({ ...settings, registeredOffice: e.target.value })} rows={3}/>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4"/>}>
            Save Company Profile
          </Button>
        </div>
      </form>
    </Card>);
};
