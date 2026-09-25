import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, CreditCard, ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { DatePicker } from '@/components/common/DatePicker';
import { useToast } from '@/contexts/ToastContext';
import { employeeService } from '@/modules/employees/services/employee.service';
const STEPS = [
    { id: 1, label: 'Basic Details', icon: User, desc: 'Identity & Contacts' },
    { id: 2, label: 'Job Details', icon: Briefcase, desc: 'Department & Role' },
    { id: 3, label: 'Bank & Payroll', icon: CreditCard, desc: 'Salary & Banking' },
    { id: 4, label: 'Statutory & Emergency', icon: ShieldCheck, desc: 'KYC & Contacts' },
];
export const AddEmployeePage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Basic Details
        fullName: '',
        avatarUrl: '',
        gender: 'Male',
        dob: '1995-06-15',
        bloodGroup: 'B+',
        phone: '',
        workEmail: '',
        personalEmail: '',
        currentAddress: 'Malviya Nagar, Jaipur',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        // Step 2: Job Details
        employeeId: `BGS-0${Math.floor(11 + Math.random() * 89)}`,
        department: 'Geology & Mineral Exploration',
        designation: 'Field Geologist',
        joiningDate: new Date().toLocaleDateString('en-CA'),
        reportingManager: 'Dr. Amit Kumar Bansal',
        employmentType: 'Full-Time',
        workLocation: 'Jaipur Corporate HQ',
        status: 'Active',
        project: 'Bhilwara Lead-Zinc Core Drilling',
        // Step 3: Bank & Payroll
        accountHolderName: '',
        bankName: 'HDFC Bank',
        accountNumber: '',
        ifscCode: 'HDFC0001234',
        baseSalary: '55000',
        // Step 4: Statutory & Emergency
        panNumber: 'ABCDE1234F',
        uanNumber: '100987654321',
        emergencyName: 'Family Contact',
        emergencyRelation: 'Parent / Spouse',
        emergencyPhone: '',
        role: 'employee',
    });
    // Statutory Age Bounds (18 to 65 years)
    const minDobDate = '1961-01-01'; // 65 yrs max age
    const maxDobDate = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 18);
        return d.toLocaleDateString('en-CA');
    }, []); // 18 yrs min age
    const calculatedAge = useMemo(() => {
        if (!formData.dob)
            return null;
        const birthDate = new Date(formData.dob);
        if (isNaN(birthDate.getTime()))
            return null;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }, [formData.dob]);
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };
    const validateStep = (step) => {
        const errs = {};
        if (step === 1) {
            // Full Name Limits
            const name = formData.fullName.trim();
            if (!name) {
                errs.fullName = 'Full Name is required';
            }
            else if (name.length < 3) {
                errs.fullName = 'Full Name must be at least 3 characters (entered: ' + name.length + ')';
            }
            else if (name.length > 50) {
                errs.fullName = 'Full Name cannot exceed 50 characters';
            }
            else if (!/^[A-Za-z\s.'-]+$/.test(name)) {
                errs.fullName = 'Full Name can only contain letters, spaces, dots, and hyphens';
            }
            // Mobile Phone Limits (Exact 10 digits starting with 6-9)
            const phone = formData.phone.trim();
            if (!phone) {
                errs.phone = 'Mobile Phone is required';
            }
            else if (phone.length !== 10) {
                errs.phone = `Phone number must be exactly 10 digits (currently ${phone.length}/10)`;
            }
            else if (!/^[6-9]\d{9}$/.test(phone)) {
                errs.phone = 'Must be a valid 10-digit Indian mobile starting with 6, 7, 8, or 9';
            }
            // Work Email Limits
            const workEmail = formData.workEmail.trim();
            if (!workEmail) {
                errs.workEmail = 'Work Email is required';
            }
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail)) {
                errs.workEmail = 'Enter a valid corporate email address (e.g. name@bansalgeo.com)';
            }
            else if (workEmail.length > 80) {
                errs.workEmail = 'Email address cannot exceed 80 characters';
            }
            // Personal Email Limits (Optional)
            const personalEmail = formData.personalEmail.trim();
            if (personalEmail) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) {
                    errs.personalEmail = 'Enter a valid personal email address';
                }
                else if (personalEmail.length > 80) {
                    errs.personalEmail = 'Email address cannot exceed 80 characters';
                }
            }
            // Date of Birth & Legal Age Limits (18 to 65 years)
            if (formData.dob) {
                if (calculatedAge === null || calculatedAge < 18) {
                    errs.dob = `Statutory Age Limit: Candidate must be at least 18 years old (currently ${calculatedAge ?? 0} yrs)`;
                }
                else if (calculatedAge > 65) {
                    errs.dob = `Statutory Age Limit: Candidate exceeds maximum retirement age (65 yrs, currently ${calculatedAge} yrs)`;
                }
            }
            else {
                errs.dob = 'Date of birth is required';
            }
            // City Limit
            if (formData.city && formData.city.length > 40) {
                errs.city = 'City cannot exceed 40 characters';
            }
        }
        else if (step === 2) {
            // Employee ID Limits
            const empId = formData.employeeId.trim();
            if (!empId) {
                errs.employeeId = 'Employee ID is required';
            }
            else if (empId.length < 3) {
                errs.employeeId = 'Employee ID must be at least 3 characters';
            }
            else if (empId.length > 15) {
                errs.employeeId = 'Employee ID cannot exceed 15 characters';
            }
            if (!formData.department.trim())
                errs.department = 'Department is required';
            // Designation Limits
            const desig = formData.designation.trim();
            if (!desig) {
                errs.designation = 'Designation is required';
            }
            else if (desig.length < 2) {
                errs.designation = 'Designation must be at least 2 characters';
            }
            else if (desig.length > 50) {
                errs.designation = 'Designation cannot exceed 50 characters';
            }
            if (!formData.joiningDate.trim())
                errs.joiningDate = 'Joining Date is required';
            if (formData.reportingManager && formData.reportingManager.length > 50) {
                errs.reportingManager = 'Manager name cannot exceed 50 characters';
            }
        }
        else if (step === 3) {
            // Base Salary Limits
            const sal = Number(formData.baseSalary);
            if (isNaN(sal) || sal <= 0) {
                errs.baseSalary = 'Valid monthly base salary is required';
            }
            else if (sal < 10000) {
                errs.baseSalary = 'Statutory Wage Limit: Minimum wage cannot be below ₹10,000 / month';
            }
            else if (sal > 2500000) {
                errs.baseSalary = 'Company Limit: Monthly salary cannot exceed ₹25,00,000 / month';
            }
            // Bank Account Number Limits
            const acc = formData.accountNumber.trim();
            if (acc && !/^\d{9,18}$/.test(acc)) {
                errs.accountNumber = `Account Number Limit: Must be 9 to 18 digits (currently ${acc.length} digits)`;
            }
            // IFSC Code Limits
            const ifsc = formData.ifscCode.trim();
            if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
                errs.ifscCode = 'IFSC Format: Must be exactly 11 characters (e.g. HDFC0001234)';
            }
            if (formData.bankName && formData.bankName.length > 50) {
                errs.bankName = 'Bank name cannot exceed 50 characters';
            }
            if (formData.accountHolderName && formData.accountHolderName.length > 50) {
                errs.accountHolderName = 'Account holder name cannot exceed 50 characters';
            }
        }
        else if (step === 4) {
            // PAN Number Limits
            const pan = formData.panNumber.trim();
            if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
                errs.panNumber = 'PAN Format: Must be 10 characters alphanumeric (e.g. ABCDE1234F)';
            }
            // UAN Number Limits
            const uan = formData.uanNumber.trim();
            if (uan && !/^\d{12}$/.test(uan)) {
                errs.uanNumber = `UAN Limit: Must be exactly 12 numeric digits (currently ${uan.length}/12)`;
            }
            // Emergency Phone Limits
            const emerg = formData.emergencyPhone.trim();
            if (emerg) {
                if (emerg.length !== 10) {
                    errs.emergencyPhone = `Emergency Phone must be exactly 10 digits (currently ${emerg.length}/10)`;
                }
                else if (!/^[6-9]\d{9}$/.test(emerg)) {
                    errs.emergencyPhone = 'Must be a valid 10-digit mobile starting with 6, 7, 8, or 9';
                }
            }
            if (formData.emergencyName && formData.emergencyName.length > 50) {
                errs.emergencyName = 'Contact name cannot exceed 50 characters';
            }
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };
    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 4));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        else {
            toast.error('Please resolve highlighted input limits and errors before proceeding.', 'Validation Limit Failed');
        }
    };
    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) {
            toast.error('Please resolve highlighted input limits before enrolling.', 'Validation Failed');
            return;
        }
        setIsSubmitting(true);
        try {
            const nameParts = formData.fullName.trim().split(' ');
            const firstName = nameParts[0] || formData.fullName.trim();
            const lastName = nameParts.slice(1).join(' ') || '';
            await employeeService.create({
                employeeId: formData.employeeId.trim(),
                name: formData.fullName.trim(),
                avatarUrl: formData.avatarUrl,
                role: formData.role,
                personal: {
                    firstName,
                    lastName,
                    dob: formData.dob,
                    gender: formData.gender,
                    bloodGroup: formData.bloodGroup,
                    maritalStatus: 'Single',
                    nationality: 'Indian',
                },
                contact: {
                    workEmail: formData.workEmail.trim(),
                    personalEmail: formData.personalEmail.trim(),
                    phone: formData.phone.trim(),
                    currentAddress: formData.currentAddress,
                    permanentAddress: formData.currentAddress,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                },
                employment: {
                    employeeId: formData.employeeId.trim(),
                    department: formData.department,
                    designation: formData.designation.trim(),
                    joiningDate: formData.joiningDate,
                    employmentType: formData.employmentType,
                    managerId: 'BGS-001',
                    managerName: formData.reportingManager.trim(),
                    workLocation: formData.workLocation,
                    status: 'Active',
                    project: formData.project,
                },
                emergency: {
                    name: formData.emergencyName.trim(),
                    relationship: formData.emergencyRelation.trim(),
                    phone: formData.emergencyPhone.trim(),
                },
                bank: {
                    accountHolderName: formData.accountHolderName.trim() || formData.fullName.trim(),
                    bankName: formData.bankName.trim(),
                    accountNumber: formData.accountNumber.trim(),
                    ifscCode: formData.ifscCode.trim(),
                    panNumber: formData.panNumber.trim(),
                    uanNumber: formData.uanNumber.trim(),
                },
                documents: [],
                ...{ baseSalary: Number(formData.baseSalary) || 55000 },
            });
            toast.success(`${formData.fullName} (ID: ${formData.employeeId}) has been successfully enrolled in HRMS Directory, Attendance, and Leave systems!`, 'Employee Onboarded Successfully');
            navigate('/hr/employees');
        }
        catch (err) {
            toast.error(err?.message || 'Failed to enroll employee. Please verify details.', 'Onboarding Failed');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── HEADER ── */}
      <PageHeader title="Enroll New Employee" description="Complete the guided 4-step onboarding workflow with statutory data validation and real-time field limits." breadcrumbs={[
            { label: 'HRMS', path: '/hr' },
            { label: 'Employees', path: '/hr/employees' },
            { label: 'New Onboarding' },
        ]}/>

      {/* ── STEPPER PROGRESS BAR ── */}
      <div className="bg-white dark:bg-[#151D24] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isDone = currentStep > s.id;
            const isCurr = currentStep === s.id;
            return (<div key={s.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 ${isCurr
                    ? 'bg-teal-50 dark:bg-teal-950/40 border border-[#1F6F78]/30 dark:border-teal-700/50'
                    : isDone
                        ? 'bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800'
                        : 'opacity-50'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurr
                        ? 'bg-[#1F6F78] text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4"/> : <Icon className="w-4 h-4"/>}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Step {s.id}
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {s.label}
                  </div>
                </div>
              </div>);
        })}
        </div>
      </div>

      {/* ── STEP CONTENT ── */}
      <Card className="p-5 sm:p-7 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: BASIC DETAILS */}
          {currentStep === 1 && (<div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#1F6F78]"/>
                  Basic & Personal Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter candidate's personal identity and primary communication details.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Full Name */}
                <Input label="Full Name" isRequired placeholder="e.g. Rahul Sharma" value={formData.fullName} maxLength={50} onChange={(e) => handleChange('fullName', e.target.value.replace(/[^A-Za-z\s.'-]/g, '').slice(0, 50))} error={errors.fullName}/>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className={`flex rounded-lg overflow-hidden border transition-all ${errors.phone
                ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200'
                : 'border-[#E2E8F0] dark:border-[#253344] focus-within:border-teal-600 focus-within:ring-3 focus-within:ring-teal-500/20'}`}>
                    <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 text-xs font-medium border-r border-[#E2E8F0] dark:border-[#253344] select-none">
                      +91
                    </span>
                    <input type="tel" inputMode="numeric" placeholder="98290 12345" value={formData.phone} maxLength={10} onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full h-[38px] px-3.5 text-[13px] font-inter bg-white dark:bg-[#111821] text-[#0F172A] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"/>
                  </div>
                  {errors.phone && (<span className="text-xs text-rose-600 font-medium block mt-1">{errors.phone}</span>)}
                </div>

                {/* Work Email */}
                <Input label="Work Email" isRequired type="email" placeholder="name@bansalgeo.com" value={formData.workEmail} maxLength={80} onChange={(e) => handleChange('workEmail', e.target.value.trim().slice(0, 80))} error={errors.workEmail}/>

                {/* Personal Email */}
                <Input label="Personal Email (Optional)" type="email" placeholder="name@gmail.com" value={formData.personalEmail} maxLength={80} onChange={(e) => handleChange('personalEmail', e.target.value.trim().slice(0, 80))} error={errors.personalEmail}/>

                {/* Gender */}
                <Select label="Gender" value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
            ]}/>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <DatePicker value={formData.dob} min={minDobDate} max={maxDobDate} onChange={(val) => handleChange('dob', val)}/>
                  {errors.dob ? (<span className="text-xs text-rose-600 font-medium block mt-1">{errors.dob}</span>) : calculatedAge !== null ? (<span className="text-[11px] text-slate-400 block mt-1">Age: {calculatedAge} years</span>) : null}
                </div>

                {/* Blood Group */}
                <Select label="Blood Group" value={formData.bloodGroup} onChange={(e) => handleChange('bloodGroup', e.target.value)} options={[
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
            ]}/>

                {/* Current City */}
                <Input label="Current City" placeholder="Jaipur" value={formData.city} maxLength={40} onChange={(e) => handleChange('city', e.target.value.slice(0, 40))} error={errors.city}/>
              </div>
            </div>)}

          {/* STEP 2: JOB DETAILS */}
          {currentStep === 2 && (<div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#1F6F78]"/>
                  Job & Employment Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Assign the employee ID, department, designation, and reporting structure.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Employee ID */}
                <Input label="Employee ID" isRequired placeholder="e.g. BGS-011" value={formData.employeeId} maxLength={15} onChange={(e) => handleChange('employeeId', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 15))} error={errors.employeeId}/>

                {/* Department */}
                <Select label="Department" isRequired value={formData.department} onChange={(e) => handleChange('department', e.target.value)} options={[
                { value: 'Geology & Mineral Exploration', label: 'Geology & Mineral Exploration' },
                { value: 'Mining & Mine Planning', label: 'Mining & Mine Planning' },
                { value: 'GIS & Remote Sensing', label: 'GIS & Remote Sensing' },
                { value: 'Project Management & Survey', label: 'Project Management & Survey' },
                { value: 'Finance & Accounts', label: 'Finance & Accounts' },
                { value: 'Human Resources & Admin', label: 'Human Resources & Admin' },
                { value: 'Executive Management', label: 'Executive Management' },
            ]} error={errors.department}/>

                {/* Designation */}
                <Input label="Designation" isRequired placeholder="e.g. Field Geologist" value={formData.designation} maxLength={50} onChange={(e) => handleChange('designation', e.target.value.slice(0, 50))} error={errors.designation}/>

                {/* Joining Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Joining Date <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <DatePicker value={formData.joiningDate} min="2010-01-01" max="2027-12-31" onChange={(val) => handleChange('joiningDate', val)}/>
                  {errors.joiningDate && (<span className="text-xs text-rose-600 font-medium block mt-1">{errors.joiningDate}</span>)}
                </div>

                {/* Reporting Manager */}
                <Input label="Reporting Manager" placeholder="e.g. Dr. Amit Kumar Bansal" value={formData.reportingManager} maxLength={50} onChange={(e) => handleChange('reportingManager', e.target.value.slice(0, 50))} error={errors.reportingManager}/>

                {/* Employment Type */}
                <Select label="Employment Type" value={formData.employmentType} onChange={(e) => handleChange('employmentType', e.target.value)} options={[
                { value: 'Full-Time', label: 'Full-Time Regular' },
                { value: 'Contract', label: 'Contractual' },
                { value: 'Consultant', label: 'Technical Consultant' },
                { value: 'Part-Time', label: 'Part-Time' },
                { value: 'Intern', label: 'Intern / Trainee' },
            ]}/>

                {/* Work Location */}
                <Select label="Work Location" value={formData.workLocation} onChange={(e) => handleChange('workLocation', e.target.value)} options={[
                { value: 'Jaipur Corporate HQ', label: 'Jaipur Corporate HQ' },
                { value: 'Bhilwara Site Office', label: 'Bhilwara Site Office' },
                { value: 'Udaipur Exploration Base', label: 'Udaipur Exploration Base' },
                { value: 'Remote / Field', label: 'Remote / Field Exploration' },
            ]}/>

                {/* Assigned Project / Site Assignment */}
                <Select label="Assigned Project / Site Assignment" value={formData.project} onChange={(e) => handleChange('project', e.target.value)} options={[
                { value: 'Bhilwara Lead-Zinc Core Drilling', label: 'Bhilwara Lead-Zinc Core Drilling' },
                { value: 'Jaipur Ring Road Drone Photogrammetry', label: 'Jaipur Ring Road Drone Photogrammetry' },
                { value: 'Khetri Copper Belt Reconnaissance', label: 'Khetri Copper Belt Reconnaissance' },
                { value: 'Udaipur Rock Phosphate Assessment', label: 'Udaipur Rock Phosphate Assessment' },
                { value: 'Corporate Operations & Governance', label: 'Corporate Operations & Governance' },
            ]}/>
              </div>
            </div>)}

          {/* STEP 3: BANK & PAYROLL */}
          {currentStep === 3 && (<div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#1F6F78]"/>
                  Bank & Payroll Configuration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Define compensation and banking account for direct deposit and payslip issuance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Base Monthly Salary */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Base Monthly Salary (₹) <span className="text-rose-500 font-bold">*</span>
                    </label>
                    {formData.baseSalary && Number(formData.baseSalary) > 0 && (<span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                        ₹{Number(formData.baseSalary).toLocaleString('en-IN')}/mo
                      </span>)}
                  </div>
                  <Input type="number" placeholder="e.g. 55000" value={formData.baseSalary} min={10000} max={2500000} onChange={(e) => handleChange('baseSalary', e.target.value.replace(/\D/g, ''))} error={errors.baseSalary}/>
                </div>

                {/* Bank Name */}
                <Input label="Bank Name" placeholder="e.g. HDFC Bank / State Bank of India" value={formData.bankName} maxLength={50} onChange={(e) => handleChange('bankName', e.target.value.slice(0, 50))} error={errors.bankName}/>

                {/* Account Holder Name */}
                <Input label="Account Holder Name" placeholder={formData.fullName || 'Candidate Name'} value={formData.accountHolderName} maxLength={50} onChange={(e) => handleChange('accountHolderName', e.target.value.slice(0, 50))} error={errors.accountHolderName}/>

                {/* Bank Account Number */}
                <Input label="Bank Account Number" placeholder="e.g. 50100234567890" value={formData.accountNumber} maxLength={18} inputMode="numeric" onChange={(e) => handleChange('accountNumber', e.target.value.replace(/\D/g, '').slice(0, 18))} error={errors.accountNumber}/>

                {/* IFSC Code */}
                <Input label="IFSC Code" placeholder="e.g. HDFC0001234" value={formData.ifscCode} maxLength={11} onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))} error={errors.ifscCode}/>
              </div>
            </div>)}

          {/* STEP 4: STATUTORY & EMERGENCY */}
          {currentStep === 4 && (<div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1F6F78]"/>
                  Statutory KYC & Emergency Contact
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Government statutory identifiers and next-of-kin emergency contact information.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* PAN Number */}
                <Input label="PAN Number" placeholder="e.g. ABCDE1234F" value={formData.panNumber} maxLength={10} onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} error={errors.panNumber}/>

                {/* UAN Number */}
                <Input label="UAN (EPFO) Number" placeholder="e.g. 100987654321" value={formData.uanNumber} maxLength={12} inputMode="numeric" onChange={(e) => handleChange('uanNumber', e.target.value.replace(/\D/g, '').slice(0, 12))} error={errors.uanNumber}/>

                {/* Emergency Contact Name */}
                <Input label="Emergency Contact Name" placeholder="e.g. Suresh Kumar" value={formData.emergencyName} maxLength={50} onChange={(e) => handleChange('emergencyName', e.target.value.slice(0, 50))} error={errors.emergencyName}/>

                {/* Emergency Relationship */}
                <Input label="Emergency Relationship" placeholder="e.g. Father / Spouse / Sibling" value={formData.emergencyRelation} maxLength={40} onChange={(e) => handleChange('emergencyRelation', e.target.value.slice(0, 40))} error={errors.emergencyRelation}/>

                {/* Emergency Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Phone
                  </label>
                  <div className={`flex rounded-lg overflow-hidden border transition-all ${errors.emergencyPhone
                ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200'
                : 'border-[#E2E8F0] dark:border-[#253344] focus-within:border-teal-600 focus-within:ring-3 focus-within:ring-teal-500/20'}`}>
                    <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 text-xs font-medium border-r border-[#E2E8F0] dark:border-[#253344] select-none">
                      +91
                    </span>
                    <input type="tel" inputMode="numeric" placeholder="98290 54321" value={formData.emergencyPhone} maxLength={10} onChange={(e) => handleChange('emergencyPhone', e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full h-[38px] px-3.5 text-[13px] font-inter bg-white dark:bg-[#111821] text-[#0F172A] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"/>
                  </div>
                  {errors.emergencyPhone && (<span className="text-xs text-rose-600 font-medium block mt-1">{errors.emergencyPhone}</span>)}
                </div>

                {/* Portal Access Role */}
                <Select label="Portal Access Role" value={formData.role} onChange={(e) => handleChange('role', e.target.value)} options={[
                { value: 'employee', label: 'Standard Staff (Employee Self-Service)' },
                { value: 'hr', label: 'HR / Admin Access' },
            ]}/>
              </div>

              {/* Onboarding Summary Box */}
              <div className="bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 rounded-xl p-4 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                <div className="font-bold text-[#1F6F78] dark:text-teal-400 mb-1 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4"/> Ready for Automated Cross-Module Enrollment
                </div>
                <p>
                  Upon submission, <strong>{formData.fullName || 'Candidate'}</strong> will be automatically provisioned with:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400 ml-1">
                  <li>Employee Directory profile & active status</li>
                  <li>Today's attendance register slot</li>
                  <li>Individual leave balance quota (12 CL, 10 SL, 18 EL, 5 CO, 15 FDL)</li>
                  <li>Monthly salary structure of ₹{Number(formData.baseSalary || 55000).toLocaleString('en-IN')}</li>
                  <li>KYC & identity document dossier in Documents module</li>
                </ul>
              </div>
            </div>)}

          {/* ── FOOTER ACTIONS ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              {currentStep > 1 && (<Button type="button" variant="secondary" onClick={handleBack} disabled={isSubmitting} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
                  Previous Step
                </Button>)}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate('/hr/employees')} disabled={isSubmitting}>
                Cancel
              </Button>

              {currentStep < 4 ? (<Button type="button" onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4"/>}>
                  Next Step
                </Button>) : (<Button type="submit" disabled={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4"/>}>
                  {isSubmitting ? 'Onboarding Employee...' : 'Complete Onboarding'}
                </Button>)}
            </div>
          </div>
        </form>
      </Card>
    </div>);
};
