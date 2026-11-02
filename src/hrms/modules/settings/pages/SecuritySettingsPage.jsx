import React, { useState } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useToast } from '@/contexts/ToastContext';
import { useCrm } from '../../../../context/crm';
import { ChangePasswordForm } from '../../../../core/auth/ChangePasswordForm';

/* Password change and sign-out from every device, both handled by the server. */
export const SecuritySettingsPage = () => {
    const { showToast } = useToast();
    const { signOut } = useCrm();
    const [busy, setBusy] = useState(false);

    const signOutEverywhere = async () => {
        setBusy(true);
        await signOut();
    };

    return (<div className="space-y-6">
      <Card className="p-6">
        <div className="settings-section-head">
          <span className="settings-section-icon"><KeyRound size={20}/></span>
          <div>
            <h3 className="settings-section-title">Change password</h3>
            <p className="settings-section-sub">Changing your password signs you out on every other device.</p>
          </div>
        </div>
        <div style={{ maxWidth: 420 }}>
          <ChangePasswordForm onDone={() => showToast('Password updated.', 'success')}/>
        </div>
      </Card>

      <Card className="p-6">
        <div className="settings-section-head">
          <span className="settings-section-icon"><LogOut size={20}/></span>
          <div>
            <h3 className="settings-section-title">Sign out everywhere</h3>
            <p className="settings-section-sub">Ends your sessions on all browsers and phones, including this one.</p>
          </div>
        </div>
        <Button variant="outline" onClick={signOutEverywhere} disabled={busy}>
          {busy ? 'Signing out…' : 'Sign out of all devices'}
        </Button>
      </Card>
    </div>);
};
