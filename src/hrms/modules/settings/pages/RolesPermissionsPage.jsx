import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Search, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/contexts/ToastContext';
import { accountService } from '../services/account.service';
import { PRIVILEGED_ROLES, initialsOf, useCrm } from '../../../../core/permissions/crm';

/*
 * Roles & Permissions (Managing Director and Developer). Pick a person, choose their role, and optionally
 * fine-tune exactly what they can do, for example only marking and viewing their own attendance.
 */
export const RolesPermissionsPage = () => {
    const toast = useToast();
    const { role: myRole, user: me } = useCrm();
    const [catalog, setCatalog] = useState({ permissions: [], roles: [] });
    const [accounts, setAccounts] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [draftRole, setDraftRole] = useState('');
    const [draftPerms, setDraftPerms] = useState([]);
    const [query, setQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            const [cat, list] = await Promise.all([accountService.catalog(), accountService.list()]);
            setCatalog(cat);
            setAccounts(list);
            setError('');
        } catch (err) {
            setError(err.message);
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const selected = accounts.find((a) => a.id === selectedId) || null;
    const select = (account) => {
        setSelectedId(account.id);
        setDraftRole(account.role);
        setDraftPerms(account.permissions);
    };

    const presetFor = (role) => catalog.roles.find((r) => r.name === role)?.permissions || [];
    const groups = useMemo(() => {
        const map = new Map();
        catalog.permissions.forEach((p) => map.set(p.group, [...(map.get(p.group) || []), p]));
        return [...map.entries()];
    }, [catalog.permissions]);

    const visible = accounts.filter((a) => `${a.name} ${a.email} ${a.role}`.toLowerCase().includes(query.trim().toLowerCase()));
    const isCustom = draftPerms.length !== presetFor(draftRole).length || draftPerms.some((p) => !presetFor(draftRole).includes(p));
    const changed = selected && (draftRole !== selected.role || draftPerms.length !== selected.permissions.length || draftPerms.some((p) => !selected.permissions.includes(p)));
    const locked = selected && (selected.id === me?.accountId || (PRIVILEGED_ROLES.includes(selected.role) && !PRIVILEGED_ROLES.includes(myRole)));
    const grantableRoles = catalog.roles.filter((r) => !PRIVILEGED_ROLES.includes(r.name) || PRIVILEGED_ROLES.includes(myRole));

    const toggle = (key) => setDraftPerms((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    const changeRole = (role) => {
        setDraftRole(role);
        setDraftPerms(presetFor(role));
    };

    const save = async () => {
        setSaving(true);
        try {
            const updated = await accountService.setAccess(selected.id, draftRole, isCustom ? draftPerms : null);
            setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            select(updated);
            toast.success(`${updated.name}'s access was updated. They will need to sign in again.`, 'Access saved');
        } catch (err) {
            toast.error(err.message, 'Could not save access');
        } finally {
            setSaving(false);
        }
    };

    return (<div className="perm-layout">
      <Card className="perm-list">
        <div className="perm-list-head">
          <h3 className="settings-section-title">People</h3>
          <label className="table-search">
            <Search size={16} aria-hidden="true"/>
            <input type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search people"/>
          </label>
        </div>
        {error && <p className="app-alert" role="alert">{error}</p>}
        <ul className="perm-people">
          {visible.map((a) => (<li key={a.id}>
              <button type="button" className={`perm-person ${a.id === selectedId ? 'is-active' : ''}`} onClick={() => select(a)}>
                <span className="avatar-sm">{initialsOf(a.name)}</span>
                <span className="perm-person-text">
                  <strong>{a.name}</strong>
                  <span>{a.role}{a.customPermissions ? ' · custom access' : ''}</span>
                </span>
                {a.status !== 'Active' && <Badge variant="urgent">Disabled</Badge>}
              </button>
            </li>))}
        </ul>
      </Card>

      <Card className="perm-detail">
        {!selected ? (<div className="perm-empty">
            <ShieldCheck size={28} aria-hidden="true"/>
            <h3>Choose a person</h3>
            <p>Select someone on the left to see and change what they can access.</p>
          </div>) : (<>
            <div className="perm-detail-head">
              <div>
                <h3 className="perm-name">{selected.name}</h3>
                <p className="settings-section-sub">{selected.email} · {selected.employeeId}</p>
              </div>
              {isCustom ? <Badge variant="attention">Custom access</Badge> : <Badge variant="good">Standard {draftRole} access</Badge>}
            </div>

            {locked && (<p className="app-alert">
                {selected.id === me?.accountId ? 'You cannot change your own access.' : 'Only the Managing Director or Developer can change this account.'}
              </p>)}

            <fieldset className="perm-roles" disabled={locked}>
              <legend className="perm-legend">Role</legend>
              <div className="perm-role-grid">
                {grantableRoles.map((r) => (<label key={r.name} className={`perm-role ${draftRole === r.name ? 'is-selected' : ''}`}>
                    <input type="radio" name="role" value={r.name} checked={draftRole === r.name} onChange={() => changeRole(r.name)}/>
                    <span className="perm-role-name">{r.name}</span>
                    <span className="perm-role-desc">{r.description}</span>
                  </label>))}
              </div>
            </fieldset>

            <fieldset className="perm-groups" disabled={locked}>
              <legend className="perm-legend">
                Permissions
                <span className="perm-legend-hint">Untick anything this person should not do. Changes apply after they sign in again.</span>
              </legend>
              {groups.map(([group, perms]) => (<div key={group} className="perm-group">
                  <h4>{group}</h4>
                  {perms.map((p) => (<label key={p.key} className="perm-check">
                      <input type="checkbox" checked={draftPerms.includes(p.key)} onChange={() => toggle(p.key)}/>
                      <span className="perm-box" aria-hidden="true"><Check size={12}/></span>
                      <span>{p.label}</span>
                    </label>))}
                </div>))}
            </fieldset>

            <div className="perm-actions">
              {isCustom && !locked && (<Button variant="ghost" onClick={() => setDraftPerms(presetFor(draftRole))}>Reset to {draftRole} defaults</Button>)}
              <Button variant="outline" disabled={!changed || saving} onClick={() => select(selected)}>Discard</Button>
              <Button disabled={!changed || saving || locked} isLoading={saving} onClick={save}>Save access</Button>
            </div>
          </>)}
      </Card>
    </div>);
};
