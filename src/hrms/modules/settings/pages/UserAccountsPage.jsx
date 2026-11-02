import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, Search } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/contexts/ToastContext';
import { accountService } from '../services/account.service';
import { PRIVILEGED_ROLES, useAccess, useCrm } from '../../../../core/permissions/crm';

const formatWhen = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never');

/* Login accounts: who can sign in, with which role, and password resets for people who are locked out. */
export const UserAccountsPage = () => {
    const toast = useToast();
    const { role: myRole, user: me } = useCrm();
    const [accounts, setAccounts] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [issued, setIssued] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const { has } = useAccess();
    const canManage = has('accounts.manage');

    const load = useCallback(async () => {
        try {
            setAccounts(await accountService.list());
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? accounts.filter((a) => `${a.name} ${a.email} ${a.employeeId} ${a.role}`.toLowerCase().includes(q)) : accounts;
    }, [accounts, query]);

    const run = async (account, action, success) => {
        setBusyId(account.id);
        try {
            const result = await action();
            await load();
            if (success) toast.success(success, 'Account updated');
            return result;
        } catch (err) {
            toast.error(err.message, 'Could not update account');
            return null;
        } finally {
            setBusyId(null);
        }
    };

    const resetPassword = async (account) => {
        if (!window.confirm(`Reset the password for ${account.name}? They will be signed out everywhere.`)) return;
        const result = await run(account, () => accountService.resetPassword(account.id));
        if (result) setIssued({ name: account.name, ...result });
    };

    return (<div className="space-y-6">
      <Card className="p-6">
        <div className="settings-section-head">
          <span className="settings-section-icon"><KeyRound size={20}/></span>
          <div>
            <h3 className="settings-section-title">User accounts</h3>
            <p className="settings-section-sub">Everyone who can sign in. Change what a person can access under Roles & Permissions.</p>
          </div>
        </div>

        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} aria-hidden="true"/>
            <input type="search" placeholder="Search by name, email or role" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search accounts"/>
          </label>
          <span className="table-count">{visible.length} of {accounts.length} accounts</span>
        </div>

        {error && <p className="app-alert" role="alert">{error}</p>}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last sign-in</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (<tr><td colSpan={5} className="table-empty">Loading accounts…</td></tr>)}
              {!loading && visible.length === 0 && (<tr><td colSpan={5} className="table-empty">No accounts match your search.</td></tr>)}
              {visible.map((a) => {
            const self = a.id === me?.accountId;
            const protectedAccount = PRIVILEGED_ROLES.includes(a.role) && !PRIVILEGED_ROLES.includes(myRole);
            return (<tr key={a.id}>
                  <td>
                    <div className="cell-primary">{a.name}</div>
                    <div className="cell-secondary">{a.email} · {a.employeeId}</div>
                  </td>
                  <td>
                    {a.role}
                    {a.customPermissions && <div className="cell-secondary">Custom access</div>}
                  </td>
                  <td>
                    <Badge variant={a.status === 'Active' ? 'good' : 'urgent'}>{a.status}</Badge>
                    {a.mustChangePassword && a.status === 'Active' && <div className="cell-secondary">Temporary password</div>}
                  </td>
                  <td className="cell-secondary">{formatWhen(a.lastLoginAt)}</td>
                  <td className="text-right">
                    {!self && !protectedAccount && canManage && (<div className="row-actions">
                        <Button size="sm" variant="outline" disabled={busyId === a.id} onClick={() => resetPassword(a)}>Reset password</Button>
                        <Button size="sm" variant={a.status === 'Active' ? 'ghost' : 'outline'} disabled={busyId === a.id} onClick={() => run(a, () => accountService.setStatus(a.id, a.status === 'Active' ? 'Disabled' : 'Active'), `${a.name} ${a.status === 'Active' ? 'disabled' : 'enabled'}.`)}>
                          {a.status === 'Active' ? 'Disable' : 'Enable'}
                        </Button>
                      </div>)}
                  </td>
                </tr>);
        })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={Boolean(issued)} onClose={() => setIssued(null)} title="Temporary password issued" description="Share it with the employee privately. It is shown only once and must be changed at their next sign-in." footer={<Button onClick={() => setIssued(null)}>Done</Button>}>
        {issued && (<dl className="credential-list">
            <div><dt>Employee</dt><dd>{issued.name}</dd></div>
            <div><dt>Sign-in email</dt><dd>{issued.email}</dd></div>
            <div><dt>Temporary password</dt><dd className="credential-secret">{issued.temporaryPassword}</dd></div>
          </dl>)}
      </Modal>
    </div>);
};
