import React, { useState, useEffect } from 'react';
import { Save, Camera } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { storage } from '@/core/storage/storage';

export const ProfileSettingsPage = () => {
    const { user, updateUser } = useAuth();
    const toast = useToast();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            const emp = storage.getEmployees().find((e) => e.employeeId === user.employeeId || (user.name && e.name.toLowerCase() === user.name.toLowerCase()));
            setPhone(emp?.contact?.phone || emp?.emergency?.phone || '+91 98290 12345');
        }
    }, [user]);

    const handleSave = (e) => {
        e.preventDefault();
        updateUser({ name, email });
        // Update phone in storage if employee found
        if (user?.employeeId) {
            const list = storage.getEmployees();
            const idx = list.findIndex((e) => e.employeeId === user.employeeId);
            if (idx !== -1) {
                list[idx].contact = { ...list[idx].contact, phone };
                storage.setEmployees(list);
            }
        }
        toast.success('Your profile personal credentials have been updated.', 'Profile Saved');
    };

    return (<Card className="p-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-6">
        Personal User Profile
      </h3>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar src={user?.avatarUrl} name={user?.name} size="xl"/>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={() => toast.info('Photo upload dialog triggered.', 'Avatar Upload')} leftIcon={<Camera className="w-3.5 h-3.5"/>}>
              Change Photo
            </Button>
            <p className="text-[11px] text-slate-400 mt-1">JPG, PNG up to 2MB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" isRequired value={name} onChange={(e) => setName(e.target.value)}/>
          <Input label="Corporate Email" isRequired value={email} onChange={(e) => setEmail(e.target.value)}/>
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)}/>
          <Input label="Employee Code" disabled value={user?.employeeId ?? 'Not linked'}/>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4"/>}>
            Save Profile
          </Button>
        </div>
      </form>
    </Card>);
};
