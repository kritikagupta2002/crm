import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, Button, Input } from '../../components';
import {
  User,
  Briefcase,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
} from 'lucide-react-native';

const STEPS = [
  { id: 1, label: 'Identity', desc: 'Basic & Contact' },
  { id: 2, label: 'Job & Org', desc: 'Dept & Designation' },
  { id: 3, label: 'Payroll', desc: 'Salary & Bank' },
  { id: 4, label: 'Statutory', desc: 'KYC & Emergency' },
];

export const AddEmployeeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { employees, departments, designations, createEmployee } = useHrms();
  const { hasRole } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate next BGS employee ID
  const defaultEmpId = useMemo(() => {
    const existingIds = employees.map(e => e.employeeId);
    let nextNum = employees.length + 1;
    let candidate = `BGS-${String(nextNum).padStart(3, '0')}`;
    while (existingIds.includes(candidate)) {
      nextNum++;
      candidate = `BGS-${String(nextNum).padStart(3, '0')}`;
    }
    return candidate;
  }, [employees]);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic
    fullName: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '1995-06-15',
    bloodGroup: 'B+',
    phone: '',
    workEmail: '',
    personalEmail: '',
    currentAddress: 'Malviya Nagar',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302017',

    // Step 2: Job & Org
    employeeId: defaultEmpId,
    department: departments[0]?.name || 'Geology & Mineral Exploration',
    designation: designations[0]?.title || 'Field Geologist',
    joiningDate: new Date().toISOString().split('T')[0],
    reportingManager: 'Dr. Amit Kumar Bansal',
    employmentType: 'Full-Time',
    workLocation: 'Jaipur Corporate HQ',
    status: 'Active' as const,
    project: 'Bhilwara Lead-Zinc Core Drilling',
    role: 'employee',

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
  });

  // Calculate live age from DOB
  const calculatedAge = useMemo(() => {
    if (!formData.dob) return null;
    const parts = formData.dob.split('-');
    if (parts.length !== 3) return null;
    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10) - 1;
    const birthDay = parseInt(parts[2], 10);
    const birthDate = new Date(birthYear, birthMonth, birthDay);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [formData.dob]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      const name = formData.fullName.trim();
      if (!name) {
        errs.fullName = 'Full Name is required.';
      } else if (name.length < 3) {
        errs.fullName = 'Full Name must be at least 3 characters.';
      } else if (name.length > 50) {
        errs.fullName = 'Full Name cannot exceed 50 characters.';
      } else if (!/^[A-Za-z\s.'-]+$/.test(name)) {
        errs.fullName = 'Full Name can only contain letters, spaces, dots, and hyphens.';
      }

      const phone = formData.phone.trim();
      if (!phone) {
        errs.phone = 'Mobile Phone is required.';
      } else if (!/^[6-9]\d{9}$/.test(phone)) {
        errs.phone = 'Must be a valid 10-digit Indian mobile starting with 6, 7, 8, or 9.';
      }

      const workEmail = formData.workEmail.trim();
      if (!workEmail) {
        errs.workEmail = 'Work Email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail)) {
        errs.workEmail = 'Enter a valid email address (e.g. name@bansalgeo.com).';
      } else {
        // Email Uniqueness Check
        const dupEmail = employees.find(
          e => e.email?.toLowerCase() === workEmail.toLowerCase()
        );
        if (dupEmail) {
          errs.workEmail = `Work Email already registered to ${dupEmail.name} (${dupEmail.employeeId}).`;
        }
      }

      if (formData.personalEmail.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalEmail.trim())) {
          errs.personalEmail = 'Enter a valid personal email address.';
        }
      }

      // Age validation: 18 to 65 years
      if (!formData.dob) {
        errs.dob = 'Date of birth is required.';
      } else if (calculatedAge === null || calculatedAge < 18) {
        errs.dob = `Statutory Age Limit: Candidate must be at least 18 years old (currently ${calculatedAge ?? 0} yrs).`;
      } else if (calculatedAge > 65) {
        errs.dob = `Statutory Age Limit: Exceeds retirement age 65 (currently ${calculatedAge} yrs).`;
      }
    } else if (step === 2) {
      const empId = formData.employeeId.trim().toUpperCase();
      if (!empId) {
        errs.employeeId = 'Employee ID is required.';
      } else if (empId.length < 3) {
        errs.employeeId = 'Employee ID must be at least 3 characters.';
      } else if (empId.length > 15) {
        errs.employeeId = 'Employee ID cannot exceed 15 characters.';
      } else {
        // Employee ID Uniqueness Check
        const dupEmpId = employees.find(
          e => e.employeeId.toUpperCase() === empId
        );
        if (dupEmpId) {
          errs.employeeId = `Employee ID "${empId}" is already assigned to ${dupEmpId.name}.`;
        }
      }

      if (!formData.department) {
        errs.department = 'Department selection is required.';
      }
      if (!formData.designation) {
        errs.designation = 'Designation selection is required.';
      }
      if (!formData.joiningDate) {
        errs.joiningDate = 'Joining Date is required.';
      }
    } else if (step === 3) {
      const sal = Number(formData.baseSalary);
      if (isNaN(sal) || sal <= 0) {
        errs.baseSalary = 'Valid monthly base salary is required.';
      } else if (sal < 10000) {
        errs.baseSalary = 'Statutory Wage Limit: Minimum wage cannot be below ₹10,000 / month.';
      } else if (sal > 2500000) {
        errs.baseSalary = 'Salary limit: Cannot exceed ₹25,00,000 / month.';
      }

      const acc = formData.accountNumber.trim();
      if (acc && !/^\d{9,18}$/.test(acc)) {
        errs.accountNumber = `Account Number must be 9 to 18 digits (entered ${acc.length}).`;
      }

      const ifsc = formData.ifscCode.trim().toUpperCase();
      if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        errs.ifscCode = 'IFSC Format: Exactly 11 chars (e.g. HDFC0001234).';
      }
    } else if (step === 4) {
      const pan = formData.panNumber.trim().toUpperCase();
      if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        errs.panNumber = 'PAN Format: Must be 10 alphanumeric chars (e.g. ABCDE1234F).';
      }

      const uan = formData.uanNumber.trim();
      if (uan && !/^\d{12}$/.test(uan)) {
        errs.uanNumber = `UAN Limit: Exactly 12 numeric digits (entered ${uan.length}/12).`;
      }

      const emergPhone = formData.emergencyPhone.trim();
      if (emergPhone && !/^[6-9]\d{9}$/.test(emergPhone)) {
        errs.emergencyPhone = 'Emergency phone must be a valid 10-digit Indian mobile.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      Alert.alert('Validation Error', 'Please resolve highlighted field errors before proceeding.');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // Validate all steps before submitting
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        Alert.alert('Incomplete Form', `Please resolve errors in Step ${s} before submitting.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.fullName.trim(),
        employeeId: formData.employeeId.trim().toUpperCase(),
        email: formData.workEmail.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: formData.role,
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
        personal: {
          gender: formData.gender,
          dob: formData.dob,
          bloodGroup: formData.bloodGroup,
          personalEmail: formData.personalEmail.trim(),
          currentAddress: formData.currentAddress.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        employment: {
          department: formData.department,
          designation: formData.designation,
          joiningDate: formData.joiningDate,
          reportingManager: formData.reportingManager,
          employmentType: formData.employmentType,
          workLocation: formData.workLocation,
          status: formData.status,
          project: formData.project,
        },
        bank: {
          accountHolderName: formData.accountHolderName.trim() || formData.fullName.trim(),
          bankName: formData.bankName.trim(),
          accountNumber: formData.accountNumber.trim(),
          ifscCode: formData.ifscCode.trim().toUpperCase(),
        },
        baseSalary: Number(formData.baseSalary),
        kyc: {
          panNumber: formData.panNumber.trim().toUpperCase(),
          uanNumber: formData.uanNumber.trim(),
          bankAccount: formData.accountNumber.trim(),
          bankName: formData.bankName.trim(),
          ifscCode: formData.ifscCode.trim().toUpperCase(),
          status: 'Verified' as const,
        },
        emergency: {
          name: formData.emergencyName.trim(),
          relationship: formData.emergencyRelation.trim(),
          phone: formData.emergencyPhone.trim(),
        },
      };

      const created = await createEmployee(payload);

      Alert.alert(
        'Employee Created Successfully',
        `Employee ${created.name} (${created.employeeId}) has been added.\n\nAutomatic Side-Effects Executed:\n• Leave Balances Initialized\n• Daily Attendance Initialized\n• Salary Structure Initialized\n• Org Staff Headcount Updated`,
        [
          {
            text: 'View Profile',
            onPress: () => {
              navigation.replace('EmployeeDetail', { employeeId: created.id });
            },
          },
          {
            text: 'Back to Directory',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Creation Failed', err.message || 'Could not create employee record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        title="Add Employee"
        subtitle={`Step ${currentStep} of 4: ${STEPS[currentStep - 1].desc}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Progress Steps Header */}
      <View style={styles.stepIndicatorContainer}>
        {STEPS.map((s, idx) => {
          const isDone = s.id < currentStep;
          const isCurrent = s.id === currentStep;
          return (
            <View key={s.id} style={styles.stepItem}>
              <View
                style={[
                  styles.stepBadge,
                  isDone && styles.stepBadgeDone,
                  isCurrent && styles.stepBadgeCurrent,
                ]}
              >
                {isDone ? (
                  <CheckCircle2 size={16} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.stepBadgeText,
                      isCurrent && styles.stepBadgeTextCurrent,
                    ]}
                  >
                    {s.id}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isCurrent && styles.stepLabelCurrent,
                ]}
                numberOfLines={1}
              >
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* ============================================================ */}
        {/* STEP 1: IDENTITY & BASIC CONTACT DETAILS */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <Card style={styles.formCard}>
            <View style={styles.cardTitleRow}>
              <User size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Basic Identity & Contact</Text>
            </View>

            <Input
              label="Full Name *"
              placeholder="e.g. Rahul Sharma"
              value={formData.fullName}
              onChangeText={val => handleChange('fullName', val)}
              error={errors.fullName}
            />

            {/* Gender Selection */}
            <Text style={styles.fieldLabel}>Gender *</Text>
            <View style={styles.pillRow}>
              {(['Male', 'Female', 'Other'] as const).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.pill, formData.gender === g && styles.pillActive]}
                  onPress={() => handleChange('gender', g)}
                >
                  <Text style={[styles.pillText, formData.gender === g && styles.pillTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date of Birth & Calculated Age */}
            <Input
              label="Date of Birth (YYYY-MM-DD) *"
              placeholder="1995-06-15"
              value={formData.dob}
              onChangeText={val => handleChange('dob', val)}
              error={errors.dob}
            />
            {calculatedAge !== null && (
              <View style={styles.ageNotice}>
                <Text style={styles.ageNoticeText}>
                  Calculated Statutory Age: <Text style={{ fontWeight: '700' }}>{calculatedAge} Years</Text>
                  {calculatedAge >= 18 && calculatedAge <= 65 ? ' (Eligible)' : ' (Outside 18–65 Bound)'}
                </Text>
              </View>
            )}

            <Input
              label="Blood Group"
              placeholder="B+"
              value={formData.bloodGroup}
              onChangeText={val => handleChange('bloodGroup', val)}
            />

            <Input
              label="Mobile Phone (10 digits) *"
              placeholder="9876543210"
              keyboardType="phone-pad"
              maxLength={10}
              value={formData.phone}
              onChangeText={val => handleChange('phone', val)}
              error={errors.phone}
            />

            <Input
              label="Corporate Work Email *"
              placeholder="rahul.sharma@bansalgeo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.workEmail}
              onChangeText={val => handleChange('workEmail', val)}
              error={errors.workEmail}
            />

            <Input
              label="Personal Email (Optional)"
              placeholder="rahul.personal@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.personalEmail}
              onChangeText={val => handleChange('personalEmail', val)}
              error={errors.personalEmail}
            />

            <Input
              label="Current Address"
              placeholder="Street / Colony"
              value={formData.currentAddress}
              onChangeText={val => handleChange('currentAddress', val)}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input
                  label="City"
                  placeholder="Jaipur"
                  value={formData.city}
                  onChangeText={val => handleChange('city', val)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Pincode"
                  placeholder="302017"
                  keyboardType="numeric"
                  maxLength={6}
                  value={formData.pincode}
                  onChangeText={val => handleChange('pincode', val)}
                />
              </View>
            </View>
          </Card>
        )}

        {/* ============================================================ */}
        {/* STEP 2: JOB & ORGANIZATION DETAILS */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <Card style={styles.formCard}>
            <View style={styles.cardTitleRow}>
              <Briefcase size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Organization & Job Master</Text>
            </View>

            <Input
              label="Employee ID *"
              placeholder="BGS-025"
              autoCapitalize="characters"
              value={formData.employeeId}
              onChangeText={val => handleChange('employeeId', val.toUpperCase())}
              error={errors.employeeId}
            />

            {/* Department Selection from Org Master */}
            <Text style={styles.fieldLabel}>Department (Org Master) *</Text>
            <View style={styles.chipGrid}>
              {departments.map(dept => (
                <TouchableOpacity
                  key={dept.id}
                  style={[
                    styles.orgChip,
                    formData.department === dept.name && styles.orgChipActive,
                  ]}
                  onPress={() => handleChange('department', dept.name)}
                >
                  <Text
                    style={[
                      styles.orgChipText,
                      formData.department === dept.name && styles.orgChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {dept.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Designation Selection from Org Master */}
            <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
              Designation (Org Master) *
            </Text>
            <View style={styles.chipGrid}>
              {designations.map(desig => (
                <TouchableOpacity
                  key={desig.id}
                  style={[
                    styles.orgChip,
                    formData.designation === desig.title && styles.orgChipActive,
                  ]}
                  onPress={() => handleChange('designation', desig.title)}
                >
                  <Text
                    style={[
                      styles.orgChipText,
                      formData.designation === desig.title && styles.orgChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {desig.title} ({desig.level || desig.grade || 'L3'})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Joining Date (YYYY-MM-DD) *"
              placeholder="2026-10-01"
              value={formData.joiningDate}
              onChangeText={val => handleChange('joiningDate', val)}
              error={errors.joiningDate}
            />

            <Input
              label="Reporting Manager"
              placeholder="Dr. Amit Kumar Bansal"
              value={formData.reportingManager}
              onChangeText={val => handleChange('reportingManager', val)}
            />

            <Text style={styles.fieldLabel}>Employment Type</Text>
            <View style={styles.pillRow}>
              {['Full-Time', 'Contract', 'Part-Time', 'Intern'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pill, formData.employmentType === type && styles.pillActive]}
                  onPress={() => handleChange('employmentType', type)}
                >
                  <Text style={[styles.pillText, formData.employmentType === type && styles.pillTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Work Location"
              placeholder="Jaipur Corporate HQ / Site Camp"
              value={formData.workLocation}
              onChangeText={val => handleChange('workLocation', val)}
            />

            <Input
              label="Assigned Project"
              placeholder="Bhilwara Lead-Zinc Core Drilling"
              value={formData.project}
              onChangeText={val => handleChange('project', val)}
            />

            {/* System Access Role */}
            <Text style={styles.fieldLabel}>System Access Role</Text>
            <View style={styles.pillRow}>
              {['employee', 'manager', 'hr', 'admin'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pill, formData.role === r && styles.pillActive]}
                  onPress={() => handleChange('role', r)}
                >
                  <Text style={[styles.pillText, formData.role === r && styles.pillTextActive]}>
                    {r.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* ============================================================ */}
        {/* STEP 3: BANK & PAYROLL DETAILS */}
        {/* ============================================================ */}
        {currentStep === 3 && (
          <Card style={styles.formCard}>
            <View style={styles.cardTitleRow}>
              <CreditCard size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Salary & Banking Structure</Text>
            </View>

            <Input
              label="Monthly Base Salary (₹) *"
              placeholder="55000"
              keyboardType="numeric"
              value={formData.baseSalary}
              onChangeText={val => handleChange('baseSalary', val)}
              error={errors.baseSalary}
            />
            <Text style={styles.helperText}>
              Statutory Limit: Minimum wage cannot be below ₹10,000 / month.
            </Text>

            <Input
              label="Account Holder Name"
              placeholder={formData.fullName || 'Rahul Sharma'}
              value={formData.accountHolderName}
              onChangeText={val => handleChange('accountHolderName', val)}
            />

            <Input
              label="Bank Name"
              placeholder="HDFC Bank"
              value={formData.bankName}
              onChangeText={val => handleChange('bankName', val)}
            />

            <Input
              label="Bank Account Number (9–18 digits)"
              placeholder="50100234567890"
              keyboardType="numeric"
              value={formData.accountNumber}
              onChangeText={val => handleChange('accountNumber', val)}
              error={errors.accountNumber}
            />

            <Input
              label="IFSC Code (11 characters)"
              placeholder="HDFC0001234"
              autoCapitalize="characters"
              maxLength={11}
              value={formData.ifscCode}
              onChangeText={val => handleChange('ifscCode', val.toUpperCase())}
              error={errors.ifscCode}
            />
          </Card>
        )}

        {/* ============================================================ */}
        {/* STEP 4: STATUTORY KYC & EMERGENCY CONTACTS */}
        {/* ============================================================ */}
        {currentStep === 4 && (
          <Card style={styles.formCard}>
            <View style={styles.cardTitleRow}>
              <ShieldCheck size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Statutory KYC & Emergency</Text>
            </View>

            <Input
              label="PAN Number (10 alphanumeric chars)"
              placeholder="ABCDE1234F"
              autoCapitalize="characters"
              maxLength={10}
              value={formData.panNumber}
              onChangeText={val => handleChange('panNumber', val.toUpperCase())}
              error={errors.panNumber}
            />

            <Input
              label="UAN Number (12 digits)"
              placeholder="100987654321"
              keyboardType="numeric"
              maxLength={12}
              value={formData.uanNumber}
              onChangeText={val => handleChange('uanNumber', val)}
              error={errors.uanNumber}
            />

            <View style={styles.subHeader}>
              <Text style={styles.subHeaderText}>Emergency Contact Details</Text>
            </View>

            <Input
              label="Contact Person Name"
              placeholder="Sunita Sharma"
              value={formData.emergencyName}
              onChangeText={val => handleChange('emergencyName', val)}
            />

            <Input
              label="Relationship"
              placeholder="Parent / Spouse / Sibling"
              value={formData.emergencyRelation}
              onChangeText={val => handleChange('emergencyRelation', val)}
            />

            <Input
              label="Emergency Contact Phone (10 digits)"
              placeholder="9876543211"
              keyboardType="phone-pad"
              maxLength={10}
              value={formData.emergencyPhone}
              onChangeText={val => handleChange('emergencyPhone', val)}
              error={errors.emergencyPhone}
            />
          </Card>
        )}

        {/* Prev / Next & Submit Controls */}
        <View style={styles.actionButtonsRow}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <ArrowLeft size={18} color={colors.text.primary} />
              <Text style={styles.backBtnText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentStep < 4 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Continue</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, styles.submitBtn]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.nextBtnText}>
                {isSubmitting ? 'Creating Employee...' : 'Confirm & Create Employee'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepBadgeDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepBadgeCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  stepBadgeTextCurrent: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: borderRadius.lg,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '800',
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  orgChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  orgChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  orgChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  orgChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  ageNotice: {
    backgroundColor: colors.background.secondary,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: -spacing.xs,
  },
  ageNoticeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.secondary,
  },
  helperText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: -spacing.xs,
  },
  subHeader: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  subHeaderText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  backBtnText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  nextBtnText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.success,
  },
});
