import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ShieldCheck, UserCheck, Briefcase, Building, KeyRound, Phone } from 'lucide-react-native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { Input, Button, SegmentedControl } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { TeamRole } from '../../types';
import { TEAM_PERSONAS } from '../../constants';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { loginTeam, loginClient, loginVendor } = useAuth();

  const [accountTypeIndex, setAccountTypeIndex] = useState<number>(0);
  const accountTypes = ['Team Staff', 'Client Portal', 'Vendor Portal'];

  // Team state
  const [selectedRole, setSelectedRole] = useState<TeamRole>('admin');
  const [teamEmail, setTeamEmail] = useState<string>(TEAM_PERSONAS.admin.email);
  const [teamPassword, setTeamPassword] = useState<string>('••••••••');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Client state
  const [enquiryId, setEnquiryId] = useState<string>('ENQ-2026-088');
  const [clientMobile, setClientMobile] = useState<string>('9820112233');

  // Vendor state
  const [vendorId, setVendorId] = useState<string>('VND-2026-014');
  const [vendorMobile, setVendorMobile] = useState<string>('9811223344');

  const handleRoleSelect = (role: TeamRole) => {
    setSelectedRole(role);
    setTeamEmail(TEAM_PERSONAS[role].email);
    setErrorMessage('');
  };

  const handleTeamSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await loginTeam(selectedRole);
    } catch (e: any) {
      setErrorMessage(e.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientSubmit = async () => {
    if (!enquiryId.trim() || !clientMobile.trim()) {
      setErrorMessage('Please enter both Enquiry ID and Registered Mobile Number.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await loginClient(enquiryId, clientMobile);
    } catch (e: any) {
      setErrorMessage(e.message || 'Client portal login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVendorSubmit = async () => {
    if (!vendorId.trim() || !vendorMobile.trim()) {
      setErrorMessage('Please enter both Vendor ID and Registered Mobile Number.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await loginVendor(vendorId, vendorMobile);
    } catch (e: any) {
      setErrorMessage(e.message || 'Vendor portal login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <ShieldCheck size={36} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>BANSAL GEO</Text>
          <Text style={styles.brandSubtitle}>
            CRM • ERM • HRMS & Finance Mobile Platform
          </Text>
        </View>

        {/* Account Type Switcher */}
        <SegmentedControl
          options={accountTypes}
          selectedIndex={accountTypeIndex}
          onSelect={(idx) => {
            setAccountTypeIndex(idx);
            setErrorMessage('');
          }}
          style={styles.segmentedControl}
        />

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* 1. TEAM LOGIN */}
        {accountTypeIndex === 0 ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Team Member Sign In</Text>
            <Text style={styles.formSubtitle}>
              Select your organizational role to enter your authorized workspace
            </Text>

            {/* Quick Role Personas */}
            <Text style={styles.rolePickerLabel}>Sign In As Role:</Text>
            <View style={styles.roleChips}>
              {(['admin', 'hr', 'accountant', 'lead', 'employee'] as TeamRole[]).map((r) => {
                const isSelected = selectedRole === r;
                const p = TEAM_PERSONAS[r];
                return (
                  <TouchableOpacity
                    key={r}
                    activeOpacity={0.8}
                    onPress={() => handleRoleSelect(r)}
                    style={[styles.roleChip, isSelected ? styles.roleChipSelected : null]}
                  >
                    <Text style={[styles.roleChipText, isSelected ? styles.roleChipTextSelected : null]}>
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.activePersonaInfo}>
              <Text style={styles.personaName}>{TEAM_PERSONAS[selectedRole].name}</Text>
              <Text style={styles.personaTitle}>
                {TEAM_PERSONAS[selectedRole].designation} • {TEAM_PERSONAS[selectedRole].department}
              </Text>
            </View>

            <Input
              label="Work Email"
              value={teamEmail}
              onChangeText={setTeamEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Briefcase size={18} color={colors.textMuted} />}
            />

            <Input
              label="Password"
              value={teamPassword}
              onChangeText={setTeamPassword}
              secureTextEntry
              leftIcon={<KeyRound size={18} color={colors.textMuted} />}
            />

            <Button
              title={`Sign In as ${selectedRole.toUpperCase()}`}
              onPress={handleTeamSubmit}
              loading={isSubmitting}
              size="lg"
              style={styles.submitBtn}
            />
          </View>
        ) : null}

        {/* 2. CLIENT LOGIN */}
        {accountTypeIndex === 1 ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Client Portal Access</Text>
            <Text style={styles.formSubtitle}>
              Inspect project milestones, approve quotations, and download signed exploration deliverables
            </Text>

            <Input
              label="Enquiry ID"
              placeholder="e.g. ENQ-2026-088"
              value={enquiryId}
              onChangeText={setEnquiryId}
              autoCapitalize="characters"
              leftIcon={<Building size={18} color={colors.textMuted} />}
            />

            <Input
              label="Registered Mobile Number"
              placeholder="e.g. 9820112233"
              value={clientMobile}
              onChangeText={setClientMobile}
              keyboardType="phone-pad"
              leftIcon={<Phone size={18} color={colors.textMuted} />}
            />

            <Button
              title="Open My Client Portal"
              onPress={handleClientSubmit}
              loading={isSubmitting}
              size="lg"
              style={styles.submitBtn}
            />
          </View>
        ) : null}

        {/* 3. VENDOR LOGIN */}
        {accountTypeIndex === 2 ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Vendor & Contractor Portal</Text>
            <Text style={styles.formSubtitle}>
              Review tenders, submit sealed bids, inspect awarded work orders, and upload milestone bills
            </Text>

            <Input
              label="Vendor ID"
              placeholder="e.g. VND-2026-014"
              value={vendorId}
              onChangeText={setVendorId}
              autoCapitalize="characters"
              leftIcon={<Building size={18} color={colors.textMuted} />}
            />

            <Input
              label="Registered Mobile Number"
              placeholder="e.g. 9811223344"
              value={vendorMobile}
              onChangeText={setVendorMobile}
              keyboardType="phone-pad"
              leftIcon={<Phone size={18} color={colors.textMuted} />}
            />

            <Button
              title="Open Vendor Portal"
              onPress={handleVendorSubmit}
              loading={isSubmitting}
              size="lg"
              style={styles.submitBtn}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('VendorRegister')}
              style={{ marginTop: spacing.md, alignItems: 'center' }}
            >
              <Text style={{ fontSize: typography.fontSizes.xs, color: colors.primary, fontWeight: typography.fontWeights.semibold }}>
                New Contractor? Register Firm / Track Application &rarr;
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Public Exploration Lead Link */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('PublicEnquiry')}
          style={styles.publicEnquiryLink}
        >
          <Text style={styles.publicEnquiryText}>
            Prospect? <Text style={styles.linkBold}>Submit a New Exploration Lead Enquiry &rarr;</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.huge,
    paddingBottom: spacing.huge,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  brandTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primary,
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  segmentedControl: {
    marginBottom: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: colors.dangerText,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  formTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  rolePickerLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  roleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  roleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.surfaceMuted,
  },
  roleChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleChipText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
  },
  roleChipTextSelected: {
    color: colors.textInverse,
  },
  activePersonaInfo: {
    backgroundColor: colors.primaryBg,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  personaName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  personaTitle: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  publicEnquiryLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  publicEnquiryText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  linkBold: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});
