import React, { useState } from 'react';
import { Save, Camera } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
export const ProfileSettingsPage = () => {
    const { user, updateUser } = useAuth();
    const toast = useToast();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('+91 98876 95208');
    const handleSave = (e) => {
        e.preventDefault();
        updateUser({ name, email });
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
          <Input label="Employee Code" disabled value={user?.employeeId || 'BGS-001'}/>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4"/>}>
            Save Profile
          </Button>
        </div>
      </form>
    </Card>);
};
