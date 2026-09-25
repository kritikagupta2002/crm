import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Mail, Phone, MapPin, Calendar, Building2, FileText, Award, CheckCircle2, Eye, QrCode } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Tabs } from '@/components/common/Tabs';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Modal } from '@/components/common/Modal';
import { QRCodeCanvas } from '@/components/common/QRCodeCanvas';
import { useToast } from '@/contexts/ToastContext';
import { employeeService } from '@/modules/employees/services/employee.service';
import { performanceService } from '@/modules/employees/services/performance.service';
import { exitService } from '@/modules/employees/services/exit.service';
import { storage } from '@/core/storage/storage';

export const EmployeeDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [employee, setEmployee] = useState(null);
    const [appraisals, setAppraisals] = useState([]);
    const [exitRecord, setExitRecord] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    // Dynamic Module Data
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [salaryStructure, setSalaryStructure] = useState(null);
    const [payslips, setPayslips] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [empExpenses, setEmpExpenses] = useState([]);
    const [empReimbursements, setEmpReimbursements] = useState([]);

    useEffect(() => {
        const fetchEmp = async () => {
            if (!id)
                return;
            setIsLoading(true);
            try {
                const emp = await employeeService.getById(id);
                if (emp) {
                    setEmployee(emp);
                    const [appList, exitItem] = await Promise.all([
                        performanceService.getAppraisalsByEmployee(emp.employeeId),
                        exitService.getExitByEmployee(emp.employeeId),
                    ]);
                    setAppraisals(appList);
                    setExitRecord(exitItem || null);
                    // Centralized storage data
                    const balances = storage.getBalancesForEmployee(emp.employeeId, emp.name);
                    setLeaveBalances(balances);
                    const leaves = storage.getLeaveRequests().filter((l) => l.employeeId === emp.employeeId);
                    setLeaveRequests(leaves);
                    const att = storage.getAttendance().filter((a) => a.employeeId === emp.employeeId);
                    setAttendanceLogs(att);
                    const structures = storage.getSalaryStructures();
                    const sal = structures.find((s) => s.employeeId === emp.employeeId) || null;
                    setSalaryStructure(sal);
                    const slips = storage.getPayslips().filter((p) => p.employeeId === emp.employeeId);
                    setPayslips(slips);
                    const docs = storage.getEmployeeDocuments().filter((d) => d.employeeId === emp.employeeId);
                    setDocuments(docs);
                    const exps = storage.getExpenses().filter((e) => e.employeeId === emp.employeeId);
                    setEmpExpenses(exps);
                    const reims = storage.getReimbursements().filter((r) => r.employeeId === emp.employeeId);
                    setEmpReimbursements(reims);
                }
                else {
                    setEmployee(null);
                }
            }
            catch {
                toast.error('Failed to load employee details.', 'Error');
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchEmp();
    }, [id]);

    if (isLoading) {
        return <LoadingState message="Fetching employee profile from Bansal Geo repository..."/>;
    }
    if (!employee) {
        return (<ErrorState title="Employee Not Found" message={`No employee profile exists matching identifier "${id}".`} onRetry={() => navigate('/hr/employees')}/>);
    }

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'personal', label: 'Personal Details' },
        { id: 'job', label: 'Job Details' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'leave', label: 'Leave' },
        { id: 'payroll', label: 'Payroll' },
        { id: 'expenses', label: 'Expenses & Claims' },
        { id: 'documents', label: 'Documents' },
    ];

    // Calculated overview stats
    const totalAvailableLeave = leaveBalances.reduce((sum, b) => sum + (b.available || 0), 0);
    const tenureYears = employee.employment.joiningDate
        ? Math.max(0.1, ((new Date().getTime() - new Date(employee.employment.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))).toFixed(1)
        : '1.0';
    return (<div className="space-y-6 pb-12">
      <PageHeader title={employee.name} description={`Emp ID: ${employee.employeeId} • ${employee.employment.designation} (${employee.employment.department})`} breadcrumbs={[
            { label: 'HRMS', path: '/hr' },
            { label: 'Employees', path: '/hr/employees' },
            { label: employee.name },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/hr/employees')}>
              <ArrowLeft className="w-4 h-4 mr-1.5"/>
              Directory
            </Button>
            <Button onClick={() => navigate(`/hr/employees/${employee.id}/edit`)}>
              <Edit2 className="w-4 h-4 mr-1.5"/>
              Edit Profile
            </Button>
          </div>}/>

      {/* Header Banner Card */}
      <Card className="p-6 bg-gradient-to-r from-white via-slate-50 to-blue-50/30 dark:from-[#142028] dark:via-[#142028] dark:to-blue-950/20 border border-slate-200/80 dark:border-[#253344]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            <Avatar src={employee.avatarUrl} name={employee.name} size="xl" className="ring-4 ring-teal-100 dark:ring-teal-900/40"/>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {employee.name}
                </h1>
                <span className="font-mono text-xs font-bold text-[#1F6F78] dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800/60">
                  {employee.employeeId}
                </span>
                <StatusBadge status={employee.employment.status} size="sm"/>
              </div>

              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
                {employee.employment.designation}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400"/>
                  {employee.employment.department}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400"/>
                  {employee.employment.workLocation}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400"/>
                  Joined {employee.employment.joiningDate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
            <Badge variant="navy" size="md" className="font-semibold uppercase">
              Role: {employee.role.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Reports to: <strong className="text-slate-800 dark:text-slate-200">{employee.employment.managerName}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQrModalOpen(true)}
              className="mt-1 flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40"
            >
              <QrCode className="w-3.5 h-3.5" />
              Digital ID Pass QR
            </Button>
          </div>
        </div>
      </Card>

      {/* Digital ID QR Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Employee Digital ID & Biometric Verification Pass"
      >
        <div className="p-4 flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-md">
            <QRCodeCanvas
              value={JSON.stringify({
                company: 'Bansal Geo Solutions Pvt. Ltd.',
                empId: employee.employeeId,
                name: employee.name,
                designation: employee.employment.designation,
                department: employee.employment.department,
                workLocation: employee.employment.workLocation,
                status: employee.employment.status,
                issued: employee.employment.joiningDate,
                validUntil: '2026-12-31',
              })}
              size={180}
            />
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              {employee.name}
            </h4>
            <p className="text-xs text-teal-700 dark:text-teal-400 font-mono font-semibold">
              {employee.employeeId} • {employee.employment.designation}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Department: {employee.employment.department} | Site: {employee.employment.workLocation}
            </p>
          </div>

          <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span>Security Token:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">SHA256-BGS-{employee.employeeId}</span>
            </div>
            <div className="flex justify-between">
              <span>Biometric Punch Sync:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Enabled (Jaipur HQ & Bhilwara Mine)</span>
            </div>
            <div className="flex justify-between">
              <span>Validity:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">31-Dec-2026</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 w-full pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsQrModalOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast.success('Digital ID Badge printed / downloaded successfully.', 'Pass Exported');
                setIsQrModalOpen(false);
              }}
            >
              Print ID Pass
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}/>

      {/* Tab Content Areas */}
      <div className="mt-4">
        {/* 1. Overview Tab */}
        {activeTab === 'overview' && (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-4">
                  Professional Summary
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Key professional in {employee.employment.department} at Bansal Geo Solutions Pvt. Ltd., based out of {employee.employment.workLocation}. Responsible for specialized consulting execution, adherence to DGMS safety standards, and project delivery.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                  <div className="p-3 bg-slate-50 dark:bg-[#111821] rounded-xl border border-slate-200 dark:border-[#253344]">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Attendance Logged</span>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {attendanceLogs.length > 0 ? `${attendanceLogs.length} Days` : 'Enrolled'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#111821] rounded-xl border border-slate-200 dark:border-[#253344]">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Leave Available</span>
                    <p className="text-lg font-bold text-[#1F6F78] dark:text-teal-400 mt-0.5">
                      {totalAvailableLeave} Days
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#111821] rounded-xl border border-slate-200 dark:border-[#253344]">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Tenure</span>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {tenureYears} Years
                    </p>
                  </div>
                </div>
              </Card>

              {/* Performance & Appraisals Summary */}
              <Card className="p-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500"/>
                    Performance & Appraisal Highlights
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/hr/performance')}>
                    Full History
                  </Button>
                </div>

                {appraisals.length > 0 ? (<div className="space-y-3">
                    {appraisals.map((app) => (<div key={app.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{app.reviewCycle}</span>
                          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                            Rating: <strong>{app.overallScore} / 5.0</strong> • Reviewed by {app.reviewerName}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          {app.rating}
                        </span>
                      </div>))}
                  </div>) : (<p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                    Candidate is scheduled for upcoming annual performance appraisal cycle.
                  </p>)}
              </Card>
            </div>

            {/* Quick Details Sidebar */}
            <div className="space-y-6">
              <Card className="p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Quick Contacts
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0"/>
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">{employee.contact.workEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0"/>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{employee.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0"/>
                    <span className="text-slate-600 dark:text-slate-300">{employee.contact.city}, {employee.contact.state}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Emergency Contact
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">Name:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{employee.emergency.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Relationship:</span>{' '}
                    <span className="text-slate-700 dark:text-slate-300">{employee.emergency.relationship}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Phone:</span>{' '}
                    <span className="text-slate-800 dark:text-slate-200 font-mono">{employee.emergency.phone}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Statutory Records
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">PAN:</span>{' '}
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{employee.bank.panNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">UAN:</span>{' '}
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{employee.bank.uanNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Bank:</span>{' '}
                    <span className="text-slate-700 dark:text-slate-300">{employee.bank.bankName}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>)}

        {/* 2. Personal Details Tab */}
        {activeTab === 'personal' && (<Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              Personal Information & Demographics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs sm:text-sm">
              <div>
                <p className="text-slate-400 text-xs">First Name</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{employee.personal.firstName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Last Name</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{employee.personal.lastName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Date of Birth</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 font-mono">{employee.personal.dob}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Gender</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{employee.personal.gender}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Blood Group</p>
                <p className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">{employee.personal.bloodGroup}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Marital Status</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{employee.personal.maritalStatus}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Nationality</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{employee.personal.nationality}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-400 text-xs">Current Residence Address</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {employee.contact.currentAddress}, {employee.contact.city}, {employee.contact.state} - {employee.contact.pincode}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-400 text-xs">Permanent Hometown Address</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{employee.contact.permanentAddress}</p>
              </div>
            </div>
          </Card>)}

        {/* 3. Job Details Tab (Employment + Exit Status) */}
        {activeTab === 'job' && (<div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                Employment & Operational Assignment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs sm:text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Employee ID</p>
                  <p className="font-mono font-bold text-[#1F6F78] dark:text-teal-400 mt-0.5">{employee.employeeId}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Department</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{employee.employment.department}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Designation</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{employee.employment.designation}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Employment Classification</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{employee.employment.employmentType}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Work Location</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{employee.employment.workLocation}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Joining Date</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 font-mono">{employee.employment.joiningDate}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Direct Reporting Manager</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{employee.employment.managerName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Service Status</p>
                  <div className="mt-1">
                    <StatusBadge status={employee.employment.status} size="sm"/>
                  </div>
                </div>
              </div>
            </Card>

            {/* Clearance & Exit Status */}
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                Service Standing & Separation Status
              </h3>
              {exitRecord ? (<div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400">
                      Separation Request ({exitRecord.status})
                    </span>
                    <span className="text-xs text-slate-500">Notice: {exitRecord.noticePeriodDays} Days</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Reason: <strong>{exitRecord.reason}</strong> • Requested LWD: <strong>{exitRecord.requestedLWD}</strong>
                  </p>
                </div>) : (<div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-5 h-5"/>
                  Active Employee in Clear Standing with No Pending Clearances or Exit Procedures.
                </div>)}
            </Card>
          </div>)}

        {/* 4. Attendance Tab */}
        {activeTab === 'attendance' && (<Card className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Biometric & Field Punch Log
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/hr/attendance/daily')}>
                Full Daily Attendance
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Check-In</th>
                    <th className="py-2.5 px-3">Check-Out</th>
                    <th className="py-2.5 px-3">Working Hours</th>
                    <th className="py-2.5 px-3">Source / Site</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attendanceLogs.length > 0 ? (attendanceLogs.map((log) => (<tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">{log.date}</td>
                        <td className="py-2.5 px-3 font-mono">{log.checkIn}</td>
                        <td className="py-2.5 px-3 font-mono">{log.checkOut}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{log.workingHours}</td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{log.punchSource}</td>
                        <td className="py-2.5 px-3"><StatusBadge status={log.status} size="sm"/></td>
                      </tr>))) : (<tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Candidate enrolled today. Ready for biometric check-in.
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </Card>)}

        {/* 5. Leave Tab */}
        {activeTab === 'leave' && (<div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {leaveBalances.map((b) => (<div key={b.leaveType} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A2430]">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block truncate">
                    {b.leaveType.split('(')[0]}
                  </span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {b.available} <span className="text-xs font-normal text-slate-400">/ {b.totalAllocated}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {b.used} days availed
                  </span>
                </div>))}
            </div>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recent Leave Requests</h4>
                <Button variant="outline" size="sm" onClick={() => navigate('/hr/leave/requests')}>
                  Leave Register
                </Button>
              </div>

              {leaveRequests.length > 0 ? (<div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Duration</th>
                        <th className="py-2 px-3">Days</th>
                        <th className="py-2 px-3">Reason</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {leaveRequests.map((req) => (<tr key={req.id}>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{req.leaveType}</td>
                          <td className="py-2 px-3 text-slate-500 font-mono">{req.startDate} to {req.endDate}</td>
                          <td className="py-2 px-3 font-bold">{req.days}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400 truncate max-w-xs">{req.reason}</td>
                          <td className="py-2 px-3"><StatusBadge status={req.status} size="sm"/></td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>) : (<div className="text-xs text-slate-400 py-4 text-center">
                  No leave requests filed yet for this employee. Full quota available.
                </div>)}
            </Card>
          </div>)}

        {/* 6. Payroll Tab */}
        {activeTab === 'payroll' && (<div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Salary Structure (INR ₹)</h3>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded">
                  FY 2026-27 Active
                </span>
              </div>

              {salaryStructure ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-[#111821] rounded-lg border border-slate-200 dark:border-[#253344]">
                    <span className="text-slate-400">Monthly Basic</span>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      ₹{salaryStructure.basic.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#111821] rounded-lg border border-slate-200 dark:border-[#253344]">
                    <span className="text-slate-400">House Rent Allowance (HRA)</span>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      ₹{salaryStructure.hra.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#111821] rounded-lg border border-slate-200 dark:border-[#253344]">
                    <span className="text-slate-400">Special & Site Allowance</span>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      ₹{salaryStructure.specialAllowance.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#111821] rounded-lg border border-slate-200 dark:border-[#253344]">
                    <span className="text-slate-400">Provident Fund (PF)</span>
                    <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      -₹{salaryStructure.providentFund.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#111821] rounded-lg border border-slate-200 dark:border-[#253344]">
                    <span className="text-slate-400">TDS / Professional Tax</span>
                    <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      -₹{(salaryStructure.tds + salaryStructure.professionalTax).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 rounded-lg border border-teal-200 dark:border-teal-800">
                    <span className="text-[#1F6F78] dark:text-teal-400 font-semibold">Net Take-Home Monthly</span>
                    <p className="text-lg font-extrabold text-[#1F6F78] dark:text-teal-300 mt-0.5">
                      ₹{salaryStructure.monthlyNet.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>) : (<div className="text-center py-6 text-slate-400 text-xs">
                  Salary structure will be generated based on base compensation.
                </div>)}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Available Payslips</h4>
                <Button variant="outline" size="sm" onClick={() => navigate('/hr/payroll/payslips')}>
                  All Payslips
                </Button>
              </div>

              {payslips.length > 0 ? (<div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {payslips.map((ps) => (<div key={ps.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#1F6F78]"/>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{ps.month} Payslip</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate('/hr/payroll/payslips')}>
                        View / Print
                      </Button>
                    </div>))}
                </div>) : (<div className="text-xs text-slate-400 py-3 text-center">
                  Monthly payslip will be generated in the next payroll execution run.
                </div>)}
            </Card>
          </div>)}

        {/* Expenses & Claims Tab */}
        {activeTab === 'expenses' && (() => {
            const allClaims = [
                ...empExpenses.map((e) => ({
                    id: e.id,
                    ref: e.expenseNumber,
                    type: 'Expense Claim',
                    category: e.category,
                    date: e.date,
                    project: e.project,
                    requested: Number(e.requestedAmount !== undefined ? e.requestedAmount : e.amount) || 0,
                    approved: Number(e.approvedAmount || 0),
                    rejected: Number(e.rejectedAmount || 0),
                    hrStatus: e.hrStatus || e.status,
                    financeStatus: e.financeStatus,
                    queryStatus: e.queryStatus,
                    settlementStatus: e.settlementStatus || (e.status === 'Settled' ? 'Settled' : 'Pending'),
                    settlementReference: e.settlementReference,
                    settledAmount: Number(e.settledAmount || (e.settlementStatus === 'Settled' ? e.approvedAmount : 0)),
                })),
                ...empReimbursements.map((r) => ({
                    id: r.id,
                    ref: r.claimId,
                    type: 'Allowance / Reimbursement',
                    category: r.category,
                    date: r.date,
                    project: r.project || 'General Operations',
                    requested: Number(r.claimAmount) || 0,
                    approved: Number(r.approvedAmount || 0),
                    rejected: Number(r.rejectedAmount || 0),
                    hrStatus: r.hrStatus || r.status,
                    financeStatus: r.financeStatus,
                    queryStatus: r.queryStatus,
                    settlementStatus: r.settlementStatus || (r.status === 'Settled' ? 'Settled' : 'Pending'),
                    settlementReference: r.settlementReference,
                    settledAmount: Number(r.settledAmount || (r.settlementStatus === 'Settled' ? r.approvedAmount : 0)),
                })),
            ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

            const totalRequested = allClaims.reduce((acc, c) => acc + c.requested, 0);
            const totalApproved = allClaims.reduce((acc, c) => acc + c.approved, 0);
            const totalRejected = allClaims.reduce((acc, c) => acc + c.rejected, 0);
            const totalSettled = allClaims.reduce((acc, c) => acc + c.settledAmount, 0);
            const pendingFinanceOrSettlement = allClaims.filter((c) => c.settlementStatus === 'Pending' && c.hrStatus !== 'Rejected' && c.financeStatus !== 'Rejected').length;

            return (
                <div className="space-y-6">
                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="p-4 bg-white dark:bg-[#142028] rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Requested</span>
                            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                                ₹{totalRequested.toLocaleString('en-IN')}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{allClaims.length} Claims Filed</span>
                        </div>
                        <div className="p-4 bg-white dark:bg-[#142028] rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 shadow-xs">
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">HR Authorized</span>
                            <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                                ₹{totalApproved.toLocaleString('en-IN')}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Approved Ceilings</span>
                        </div>
                        <div className="p-4 bg-white dark:bg-[#142028] rounded-xl border border-rose-200/80 dark:border-rose-800/40 shadow-xs">
                            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Total Disallowed</span>
                            <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                                ₹{totalRejected.toLocaleString('en-IN')}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Rejected Amounts</span>
                        </div>
                        <div className="p-4 bg-white dark:bg-[#142028] rounded-xl border border-teal-200/80 dark:border-teal-800/40 shadow-xs">
                            <span className="text-[11px] font-bold text-[#1F6F78] dark:text-teal-400 uppercase tracking-wider block">Total Settled</span>
                            <p className="text-lg sm:text-xl font-black text-[#1F6F78] dark:text-teal-400 mt-1">
                                ₹{totalSettled.toLocaleString('en-IN')}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Disbursed to Staff</span>
                        </div>
                        <div className="p-4 bg-white dark:bg-[#142028] rounded-xl border border-amber-200/80 dark:border-amber-800/40 shadow-xs col-span-2 sm:col-span-1">
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">In Progress</span>
                            <p className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-400 mt-1">
                                {pendingFinanceOrSettlement}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting Audit / Pay</span>
                        </div>
                    </div>

                    {/* Claims Ledger */}
                    <Card className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Expenses & Reimbursement Claims Dossier
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Chronological records of filed travel, operational expenses, and per-diem allowances for {employee.name}.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => navigate('/hr/expenses')}>
                                    Expenses
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => navigate('/hr/reimbursement')}>
                                    Reimbursements
                                </Button>
                            </div>
                        </div>

                        {allClaims.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                                            <th className="py-2.5 px-3">Claim Ref</th>
                                            <th className="py-2.5 px-3">Type & Category</th>
                                            <th className="py-2.5 px-3">Date</th>
                                            <th className="py-2.5 px-3">Project / Site</th>
                                            <th className="py-2.5 px-3 text-right">Requested</th>
                                            <th className="py-2.5 px-3 text-right">HR Approved</th>
                                            <th className="py-2.5 px-3">HR Status</th>
                                            <th className="py-2.5 px-3">Finance Audit</th>
                                            <th className="py-2.5 px-3">Settlement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {allClaims.map((c) => (
                                            <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                                <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                    {c.ref}
                                                </td>
                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                    <span className="font-semibold text-slate-900 dark:text-white block">{c.category}</span>
                                                    <span className="text-[10px] text-slate-400 block">{c.type}</span>
                                                </td>
                                                <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    {c.date}
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                                                    {c.project}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                                    ₹{c.requested.toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                                    ₹{c.approved.toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                    <StatusBadge status={c.hrStatus} size="sm" />
                                                </td>
                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                    <div className="flex flex-col gap-0.5">
                                                        <StatusBadge status={c.financeStatus === 'None' ? (c.hrStatus === 'Rejected' ? 'None' : 'Pending HR') : (c.financeStatus || 'Pending Review')} size="sm" />
                                                        {c.queryStatus && c.queryStatus !== 'No Query' && (
                                                            <StatusBadge status={c.queryStatus} size="sm" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                    <StatusBadge status={c.settlementStatus === 'None' ? 'Not Payable' : (c.settlementStatus || 'Pending')} size="sm" />
                                                    {c.settlementReference && (
                                                        <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                                                            {c.settlementReference}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-xs">
                                No expense or reimbursement claims filed by this staff member yet.
                            </div>
                        )}
                    </Card>
                </div>
            );
        })()}

        {/* 7. Documents Tab */}
        {activeTab === 'documents' && (<Card className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Verified Credentials & Document Dossier
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/hr/documents/employee')}>
                Manage Documents
              </Button>
            </div>

            {documents.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc) => (<div key={doc.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-[#1F6F78] dark:text-teal-400 shrink-0">
                        <FileText className="w-5 h-5"/>
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{doc.documentType}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {doc.fileName} • {doc.fileSize}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                        {doc.status}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => toast.info(`Viewing ${doc.fileName}`, 'Document Preview')}>
                        <Eye className="w-3.5 h-3.5"/>
                      </Button>
                    </div>
                  </div>))}
              </div>) : (<div className="text-center py-8 text-slate-400 text-xs">
                No documents currently uploaded. Go to Employee Documents to upload verified credentials.
              </div>)}
          </Card>)}
      </div>
    </div>);
};
