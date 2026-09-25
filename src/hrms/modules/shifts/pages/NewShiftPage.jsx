import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { useToast } from '@/contexts/ToastContext';
import { shiftService } from '@/modules/shifts/services/shift.service';
export const NewShiftPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [startTime, setStartTime] = useState('09:30 AM');
    const [endTime, setEndTime] = useState('06:00 PM');
    const [breakDuration, setBreakDuration] = useState('45 mins');
    const [gracePeriod, setGracePeriod] = useState('15 mins');
    const [weeklyOff, setWeeklyOff] = useState('Saturday & Sunday');
    const [location, setLocation] = useState('Jaipur Corporate HQ');
    const [desc, setDesc] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !code.trim()) {
            toast.error('Shift name and code are required.', 'Validation Error');
            return;
        }
        await shiftService.createShift({
            name,
            code,
            startTime,
            endTime,
            breakDuration,
            gracePeriod,
            weeklyOff,
            location,
            status: 'Active',
            assignedEmployeesCount: 0,
            description: desc,
        });
        toast.success(`Shift "${name}" added to company schedules.`, 'Shift Created');
        navigate('/hr/shifts');
    };
    return (<div className="space-y-6 max-w-3xl mx-auto pb-12">
      <PageHeader title="Create New Shift" description="Establish operational hours, grace thresholds, and weekly rest days." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Shifts', path: '/hr/shifts' },
            { label: 'New Shift' },
        ]} actions={<Button variant="outline" size="sm" onClick={() => navigate('/hr/shifts')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
            Cancel
          </Button>}/>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input label="Shift Name" isRequired value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Night Borehole Drilling Shift"/>
              </div>
              <div>
                <Input label="Shift Code" isRequired value={code} onChange={(e) => setCode(e.target.value)} placeholder="NIGHT-DRILL"/>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Start Time" isRequired value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="08:00 AM"/>
              <Input label="End Time" isRequired value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="04:30 PM"/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Break Duration" value={breakDuration} onChange={(e) => setBreakDuration(e.target.value)} placeholder="45 mins"/>
              <Input label="Grace Period" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} placeholder="15 mins"/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Designated Weekly Off" value={weeklyOff} onChange={(e) => setWeeklyOff(e.target.value)} options={[
            { label: 'Saturday & Sunday', value: 'Saturday & Sunday' },
            { label: 'Sunday Only', value: 'Sunday' },
            { label: 'Rotational (1 day / week)', value: 'Rotational (1 day / week)' },
        ]}/>
              <Select label="Location Applicability" value={location} onChange={(e) => setLocation(e.target.value)} options={[
            { label: 'Jaipur Corporate HQ', value: 'Jaipur Corporate HQ' },
            { label: 'Bhilwara & Udaipur Mine Sites', value: 'Bhilwara & Udaipur Mine Sites' },
            { label: 'Exploration Blocks / Field', value: 'Exploration Blocks / Field' },
        ]}/>
            </div>

            <Textarea label="Shift Scope & Operating Instructions" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Guidelines on shift handover, vehicle log, and PPE requirements..." rows={3}/>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/hr/shifts')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4"/>}>
            Save Shift Schedule
          </Button>
        </div>
      </form>
    </div>);
};
