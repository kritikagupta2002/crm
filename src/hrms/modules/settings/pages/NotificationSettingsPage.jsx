import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useToast } from '@/contexts/ToastContext';
export const NotificationSettingsPage = () => {
    const toast = useToast();
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [whatsappAlerts, setWhatsappAlerts] = useState(true);
    const [leaveAlerts, setLeaveAlerts] = useState(true);
    const [payrollAlerts, setPayrollAlerts] = useState(true);
    const handleSave = (e) => {
        e.preventDefault();
        toast.success('Notification preferences updated.', 'Settings Saved');
    };
    return (<Card className="p-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-6">
        Corporate Notification Channels
      </h3>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-[#111821] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Delivery Methods
            </h4>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"/>
              <span className="font-medium text-slate-700 dark:text-slate-300">Send Email digests to official @bansalgeo.com inboxes</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={whatsappAlerts} onChange={(e) => setWhatsappAlerts(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"/>
              <span className="font-medium text-slate-700 dark:text-slate-300">Enable automated WhatsApp alerts for site biometric punch failures</span>
            </label>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-[#111821] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Trigger Categories
            </h4>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={leaveAlerts} onChange={(e) => setLeaveAlerts(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"/>
              <span className="font-medium text-slate-700 dark:text-slate-300">Leave applications and manager approvals</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={payrollAlerts} onChange={(e) => setPayrollAlerts(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"/>
              <span className="font-medium text-slate-700 dark:text-slate-300">Monthly payslip generation and salary transfer alerts</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4"/>}>
            Save Preferences
          </Button>
        </div>
      </form>
    </Card>);
};
