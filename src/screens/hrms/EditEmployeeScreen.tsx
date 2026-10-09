import React, { useState, useEffect } from 'react';
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
import { isValidIndianMobile, isValidEmail } from '../../utils';
import {
  User,
  Briefcase,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react-native';

export const EditEmployeeScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { employees, departments, designations, updateEmployee } = useHrms();
  const employeeId = route?.params?.employeeId || employees[0]?.id;
  const { hasRole } = useAuth();

  const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    workEmail: '',
    personalEmail: '',
    gender: 'Male',
    dob: '',
    bloodGroup: '',
    currentAddress: '',
    city: '',
    state: '',
    pincode: '',
    department: '',
    designation: '',
    reportingManager: '',
    employmentType: 'Full-Time',
    workLocation: '',
    status: 'Active',
    project: '',
    role: 'employee',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    baseSalary: '50000',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (emp) {
      setFormData({
        name: emp.name || '',
        phone: emp.phone || '',
        workEmail: emp.email || '',
        personalEmail: emp.personal?.personalEmail || '',
        gender: emp.personal?.gender || 'Male',
        dob: emp.personal?.dob || '',
        bloodGroup: emp.personal?.bloodGroup || 'B+',
        currentAddress: emp.personal?.currentAddress || '',
        city: emp.personal?.city || 'Jaipur',
        state: emp.personal?.state || 'Rajasthan',
        pincode: emp.personal?.pincode || '302017',
        department: emp.employment?.department || departments[0]?.name || '',
        designation: emp.employment?.designation || designations[0]?.title || '',
        reportingManager: emp.employment?.reportingManager || emp.employment?.managerName || '',
        employmentType: emp.employment?.employmentType || 'Full-Time',
        workLocation: emp.employment?.workLocation || 'Jaipur Corporate HQ',
        status: emp.employment?.status || 'Active',
        project: emp.employment?.project || '',
        role: emp.role || 'employee',
        accountHolderName: emp.bank?.accountHolderName || emp.name || '',
        bankName: emp.bank?.bankName || emp.kyc?.bankName || 'HDFC Bank',
        accountNumber: emp.bank?.accountNumber || emp.kyc?.bankAccount || '',
        ifscCode: emp.bank?.ifscCode || emp.kyc?.ifscCode || 'HDFC0001234',
        baseSalary: String(emp.baseSalary || 50000),
        emergencyName: emp.emergency?.name || '',
        emergencyRelation: emp.emergency?.relationship || '',
        emergencyPhone: emp.emergency?.phone || '',
      });
    }
  }, [emp, departments, designations]);

  if (!emp) {
    return (
      <View style={styles.container}>
        <AppHeader title="Edit Employee" showBack onBack={() => navigation.goBack()} />
        <View style={styles.errorCenter}>
          <Text style={styles.errorText}>Employee record not found.</Text>
        </View>
      </View>
    );
  }

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

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const name = formData.name.trim();
    if (!name || name.length < 3) {
      errs.name = 'Full Name must be at least 3 characters.';
    }

    const phone = formData.phone.trim();
    if (!phone || !isValidIndianMobile(phone)) {
      errs.phone = 'Valid 10-digit Indian mobile is required.';
    }

    const email = formData.workEmail.trim();
    if (!email || !isValidEmail(email)) {
      errs.workEmail = 'Valid work email is required.';
    } else {
      const dup = employees.find(
        e => e.id !== emp.id && e.email?.toLowerCase() === email.toLowerCase()
      );
      if (dup) {
        errs.workEmail = `Email already assigned to ${dup.name} (${dup.employeeId}).`;
      }
    }

    const sal = Number(formData.baseSalary);
    if (isNaN(sal) || sal < 10000) {
      errs.baseSalary = 'Base salary cannot be below ₹10,000.';
    }

    if (formData.accountNumber && !/^\d{9,18}$/.test(formData.accountNumber.trim())) {
      errs.accountNumber = 'Bank account must be 9–18 digits.';
    }

    if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.trim().toUpperCase())) {
      errs.ifscCode = 'IFSC must be 11 characters (e.g. HDFC0001234).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please correct the highlighted fields.');
      return;
    }

    try {
      setIsSubmitting(true);

      const updates = {
        name: formData.name.trim(),
        email: formData.workEmail.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: formData.role,
        personal: {
          ...emp.personal,
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
          ...emp.employment,
          department: formData.department,
          designation: formData.designation,
          reportingManager: formData.reportingManager,
          employmentType: formData.employmentType,
          workLocation: formData.workLocation,
          status: formData.status as any,
          project: formData.project,
        },
        bank: {
          accountHolderName: formData.accountHolderName.trim(),
          bankName: formData.bankName.trim(),
          accountNumber: formData.accountNumber.trim(),
          ifscCode: formData.ifscCode.trim().toUpperCase(),
        },
        baseSalary: Number(formData.baseSalary),
        emergency: {
          name: formData.emergencyName.trim(),
          relationship: formData.emergencyRelation.trim(),
          phone: formData.emergencyPhone.trim(),
        },
      };

      await updateEmployee(emp.id, updates);

      Alert.alert('Success', `Employee details for ${formData.name} updated.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update employee.');
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
        title={`Edit: ${emp.name}`}
        subtitle={`Emp ID: ${emp.employeeId}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <User size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Identity & Personal</Text>
          </View>

          <Input
            label="Full Name *"
            value={formData.name}
            onChangeText={v => handleChange('name', v)}
            error={errors.name}
          />

          <Input
            label="Mobile Phone *"
            keyboardType="phone-pad"
            maxLength={10}
            value={formData.phone}
            onChangeText={v => handleChange('phone', v)}
            error={errors.phone}
          />

          <Input
            label="Corporate Work Email *"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.workEmail}
            onChangeText={v => handleChange('workEmail', v)}
            error={errors.workEmail}
          />

          <Input
            label="City"
            value={formData.city}
            onChangeText={v => handleChange('city', v)}
          />
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Briefcase size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Organization & Job</Text>
          </View>

          <Text style={styles.label}>Department</Text>
          <View style={styles.chipRow}>
            {departments.map(d => (
              <TouchableOpacity
                key={d.id}
                style={[styles.chip, formData.department === d.name && styles.chipActive]}
                onPress={() => handleChange('department', d.name)}
              >
                <Text style={[styles.chipText, formData.department === d.name && styles.chipTextActive]}>
                  {d.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: spacing.md }]}>Designation</Text>
          <View style={styles.chipRow}>
            {designations.map(d => (
              <TouchableOpacity
                key={d.id}
                style={[styles.chip, formData.designation === d.title && styles.chipActive]}
                onPress={() => handleChange('designation', d.title)}
              >
                <Text style={[styles.chipText, formData.designation === d.title && styles.chipTextActive]}>
                  {d.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: spacing.md }]}>Employment Status</Text>
          <View style={styles.chipRow}>
            {['Active', 'On Leave', 'Notice Period', 'Probation', 'Terminated', 'Resigned'].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, formData.status === s && styles.chipActive]}
                onPress={() => handleChange('status', s)}
              >
                <Text style={[styles.chipText, formData.status === s && styles.chipTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Reporting Manager"
            value={formData.reportingManager}
            onChangeText={v => handleChange('reportingManager', v)}
          />

          <Input
            label="Work Location"
            value={formData.workLocation}
            onChangeText={v => handleChange('workLocation', v)}
          />

          <Input
            label="Project"
            value={formData.project}
            onChangeText={v => handleChange('project', v)}
          />
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <CreditCard size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Salary & Bank</Text>
          </View>

          <Input
            label="Monthly Base Salary (₹) *"
            keyboardType="numeric"
            value={formData.baseSalary}
            onChangeText={v => handleChange('baseSalary', v)}
            error={errors.baseSalary}
          />

          <Input
            label="Bank Name"
            value={formData.bankName}
            onChangeText={v => handleChange('bankName', v)}
          />

          <Input
            label="Account Number"
            keyboardType="numeric"
            value={formData.accountNumber}
            onChangeText={v => handleChange('accountNumber', v)}
            error={errors.accountNumber}
          />

          <Input
            label="IFSC Code"
            autoCapitalize="characters"
            maxLength={11}
            value={formData.ifscCode}
            onChangeText={v => handleChange('ifscCode', v.toUpperCase())}
            error={errors.ifscCode}
          />
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
          </View>

          <Input
            label="Contact Person Name"
            value={formData.emergencyName}
            onChangeText={v => handleChange('emergencyName', v)}
          />

          <Input
            label="Relationship"
            value={formData.emergencyRelation}
            onChangeText={v => handleChange('emergencyRelation', v)}
          />

          <Input
            label="Emergency Phone"
            keyboardType="phone-pad"
            maxLength={10}
            value={formData.emergencyPhone}
            onChangeText={v => handleChange('emergencyPhone', v)}
          />
        </Card>

        <Button
          title={isSubmitting ? 'Saving Changes...' : 'Save Employee Profile'}
          variant="primary"
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={isSubmitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: borderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '800',
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: spacing.sm,
  },
  errorCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
