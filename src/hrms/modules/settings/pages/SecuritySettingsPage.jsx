import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/contexts/ToastContext';
import { ShieldCheck, KeyRound, Smartphone, Laptop, Globe, History, CheckCircle2, } from 'lucide-react';
export const SecuritySettingsPage = () => {
    const { showToast } = useToast();
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [activeSessions, setActiveSessions] = useState([
        {
            id: 'sess-1',
            device: 'Windows PC (Chrome 128)',
            location: 'Jaipur, Rajasthan (Okay Plus Square HQ)',
            ip: '103.212.144.12',
            current: true,
            lastActive: 'Active now',
        },
        {
            id: 'sess-2',
            device: 'Android Mobile (BGSPL Field App / Chrome)',
            location: 'Bhilwara Mine Site, Rajasthan',
            ip: '49.36.18.241',
            current: false,
            lastActive: '4 hours ago',
        },
        {
            id: 'sess-3',
            device: 'MacBook Pro (Safari 17.5)',
            location: 'Jaipur Corporate Office',
            ip: '103.212.144.18',
            current: false,
            lastActive: '2 days ago',
        },
    ]);
    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Please fill out all password fields', 'error');
            return;
        }
        if (newPassword.length < 8) {
            showToast('New password must be at least 8 characters long', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }
        setIsUpdatingPassword(true);
        setTimeout(() => {
            setIsUpdatingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showToast('Password updated successfully across corporate network', 'success');
        }, 600);
    };
    const handleToggle2FA = () => {
        const newState = !twoFactorEnabled;
        setTwoFactorEnabled(newState);
        showToast(newState ? 'Two-Factor Authentication enabled via Microsoft Authenticator / OTP' : 'Two-Factor Authentication disabled', newState ? 'success' : 'info');
    };
    const handleRevokeOtherSessions = () => {
        setActiveSessions((prev) => prev.filter((s) => s.current));
        showToast('All other active sessions have been terminated', 'success');
    };
    return (<div className="space-y-6">
      {/* Change Password */}
      <Card className="p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="p-2.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 rounded-lg">
            <KeyRound className="w-5 h-5"/>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Change Account Password</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ensure your password contains at least 8 characters, including upper & lower case, numbers, and symbols.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <Input label="Current Password" type="password" placeholder="••••••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required/>
          <Input label="New Password" type="password" placeholder="Enter minimum 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required/>
          <Input label="Confirm New Password" type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required/>

          <div className="pt-2">
            <Button type="submit" variant="primary" isLoading={isUpdatingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-lg shrink-0">
              <Smartphone className="w-5 h-5"/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Two-Factor Authentication (2FA)</h3>
                <Badge variant={twoFactorEnabled ? 'emerald' : 'slate'}>
                  {twoFactorEnabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enforces verification via TOTP authenticator (Google/Microsoft Authenticator) or registered SMS OTP.
              </p>
            </div>
          </div>
          <Button variant={twoFactorEnabled ? 'outline' : 'primary'} size="sm" onClick={handleToggle2FA} className="self-start sm:self-auto shrink-0">
            {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
        </div>

        <div className="bg-slate-50 dark:bg-[#111821] p-4 rounded-lg border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0"/>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-800 dark:text-white">Enterprise Security Policy Applied</p>
            <p>
              BGSPL administrative and managerial accounts require mandatory multi-factor verification for remote access
              outside the Jaipur HQ static IP subnets.
            </p>
          </div>
        </div>
      </Card>

      {/* Active Sessions */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 rounded-lg shrink-0">
              <Laptop className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Active Devices & Sessions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Devices currently authenticated with your enterprise BGSPL portal credentials.
              </p>
            </div>
          </div>
          {activeSessions.length > 1 && (<Button variant="danger" size="sm" onClick={handleRevokeOtherSessions} className="self-start sm:self-auto shrink-0">
              Revoke Other Sessions
            </Button>)}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activeSessions.map((session) => (<div key={session.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded mt-0.5 shrink-0">
                  <Globe className="w-4 h-4"/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{session.device}</span>
                    {session.current && (<Badge variant="blue">This Device</Badge>)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                    <span>{session.location}</span>
                    <span>•</span>
                    <span className="font-mono">{session.ip}</span>
                    <span>•</span>
                    <span>{session.lastActive}</span>
                  </div>
                </div>
              </div>

              {!session.current && (<Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400 hover:text-red-700 text-xs self-start sm:self-auto" onClick={() => {
                    setActiveSessions((prev) => prev.filter((s) => s.id !== session.id));
                    showToast('Session logged out', 'info');
                }}>
                  Log out
                </Button>)}
            </div>))}
        </div>
      </Card>

      {/* Security Audit Log */}
      <Card className="p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="p-2.5 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 rounded-lg shrink-0">
            <History className="w-5 h-5"/>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Recent Security Activity</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Log of authentication events, IP addresses, and credential actions.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
                event: 'Successful Corporate Login',
                ip: '103.212.144.12',
                time: 'Today at 09:12 AM',
                location: 'Jaipur Okay Plus Square',
                status: 'success',
            },
            {
                event: 'Role Switched to HR Executive for Simulation',
                ip: '103.212.144.12',
                time: 'Yesterday at 04:30 PM',
                location: 'Jaipur Okay Plus Square',
                status: 'info',
            },
            {
                event: '2FA Verification Code Approved',
                ip: '49.36.18.241',
                time: '15 Sep 2026 at 11:15 AM',
                location: 'Bhilwara Mine Site Office',
                status: 'success',
            },
        ].map((item, idx) => (<div key={idx} className="flex items-start justify-between gap-3 text-xs py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{item.event}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 font-mono">{item.location} ({item.ip})</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 shrink-0 whitespace-nowrap">{item.time}</span>
            </div>))}
        </div>
      </Card>
    </div>);
};
