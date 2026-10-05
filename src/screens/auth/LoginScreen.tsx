import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Image,
} from 'react-native';
import { Briefcase, Building, KeyRound, Phone, ArrowRight, Crown } from 'lucide-react-native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { Input, Button, SegmentedControl } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { TeamRole } from '../../types';
import { TEAM_PERSONAS } from '../../constants';

const heroBannerImg = require('../../../assets/hero-banner.jpg');
const rajeshAvatar = require('../../../assets/dr-rajesh-bansal.jpg');

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { loginTeam, loginClient, loginVendor } = useAuth();

  const [accountTypeIndex, setAccountTypeIndex] = useState<number>(0);
  const accountTypes = ['Team Staff', 'Client Portal', 'Vendor Portal'];

  const [selectedRole, setSelectedRole] = useState<TeamRole>('admin');
  const [teamEmail, setTeamEmail] = useState<string>(TEAM_PERSONAS.admin.email);
  const [teamPassword, setTeamPassword] = useState<string>('••••••••');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [enquiryId, setEnquiryId] = useState<string>('ENQ-2026-088');
  const [clientMobile, setClientMobile] = useState<string>('9820112233');

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
        <ImageBackground
          source={heroBannerImg}
          style={styles.heroBanner}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadgeRow}>
              <Crown size={12} color="#F59E0B" />
              <Text style={styles.heroBadgeText}>EST. 1989 • EXPLORATION & MINING</Text>
            </View>
            <Text style={styles.heroTitle}>BANSAL GEO</Text>
            <Text style={styles.heroSubtitle}>Enterprise Command & Governance Platform</Text>
          </View>
        </ImageBackground>

        <View style={styles.formContainer}>
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

          {accountTypeIndex === 0 ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Team Member Sign In</Text>
              <Text style={styles.formSubtitle}>
                Select authorized operational persona to sign into workspace
              </Text>

              <Text style={styles.rolePickerLabel}>OPERATIONAL ROLES:</Text>
              <View style={styles.roleChips}>
                {(['admin', 'hr', 'accountant', 'lead', 'employee'] as TeamRole[]).map((r) => {
                  const isSelected = selectedRole === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      activeOpacity={0.75}
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
                <Image
                  source={selectedRole === 'admin' ? rajeshAvatar : { uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }}
                  style={styles.personaAvatar}
                />
                <View style={styles.personaTextWrapper}>
                  <View style={styles.personaTitleRow}>
                    <Text style={styles.personaName} numberOfLines={1}>{TEAM_PERSONAS[selectedRole].name}</Text>
                    <View style={styles.rolePill}>
                      <Text style={styles.rolePillText}>{selectedRole.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.personaTitle} numberOfLines={1}>
                    {TEAM_PERSONAS[selectedRole].designation} • {TEAM_PERSONAS[selectedRole].department}
                  </Text>
                </View>
              </View>

              <Input
                label="Work Email"
                value={teamEmail}
                onChangeText={setTeamEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Briefcase size={17} color="#64748B" />}
              />

              <Input
                label="Password"
                value={teamPassword}
                onChangeText={setTeamPassword}
                secureTextEntry
                leftIcon={<KeyRound size={17} color="#64748B" />}
              />

              <Button
                title={`Enter as ${selectedRole.toUpperCase()}`}
                onPress={handleTeamSubmit}
                loading={isSubmitting}
                size="lg"
                style={styles.submitBtn}
              />
            </View>
          ) : null}

          {accountTypeIndex === 1 ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Client Portal Access</Text>
              <Text style={styles.formSubtitle}>
                Inspect project milestones, approve quotations, and download signed deliverables
              </Text>

              <Input
                label="Enquiry ID"
                placeholder="e.g. ENQ-2026-088"
                value={enquiryId}
                onChangeText={setEnquiryId}
                autoCapitalize="characters"
                leftIcon={<Building size={17} color="#64748B" />}
              />

              <Input
                label="Registered Mobile Number"
                placeholder="e.g. 9820112233"
                value={clientMobile}
                onChangeText={setClientMobile}
                keyboardType="phone-pad"
                leftIcon={<Phone size={17} color="#64748B" />}
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

          {accountTypeIndex === 2 ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Vendor & Contractor Gate</Text>
              <Text style={styles.formSubtitle}>
                Review tenders, submit sealed bids, inspect work orders, and upload milestone bills
              </Text>

              <Input
                label="Vendor ID"
                placeholder="e.g. VND-2026-014"
                value={vendorId}
                onChangeText={setVendorId}
                autoCapitalize="characters"
                leftIcon={<Building size={17} color="#64748B" />}
              />

              <Input
                label="Registered Mobile Number"
                placeholder="e.g. 9811223344"
                value={vendorMobile}
                onChangeText={setVendorMobile}
                keyboardType="phone-pad"
                leftIcon={<Phone size={17} color="#64748B" />}
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
                style={styles.registerLink}
              >
                <Text style={styles.registerLinkText}>
                  New Contractor? Register Firm / Track Application &rarr;
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('PublicEnquiry')}
            style={styles.publicEnquiryCard}
          >
            <View style={styles.publicEnquiryContent}>
              <Text style={styles.publicEnquiryTitle}>Need a Geological Survey?</Text>
              <Text style={styles.publicEnquiryDesc}>Submit a new exploration enquiry online</Text>
            </View>
            <ArrowRight size={17} color="#0D9488" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: spacing.huge,
  },
  heroBanner: {
    height: 154,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
  },
  heroContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md + 2,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2.5,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroBadgeText: {
    fontSize: 9.5,
    fontWeight: typography.fontWeights.bold,
    color: '#F8FAFC',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeights.heavy,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 1,
  },
  formContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  segmentedControl: {
    marginBottom: spacing.md,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 12.5,
    fontWeight: typography.fontWeights.medium,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.xs,
    marginBottom: spacing.md,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  formSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  rolePickerLabel: {
    fontSize: 9.5,
    fontWeight: typography.fontWeights.bold,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
    letterSpacing: 0.4,
  },
  roleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  roleChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4.5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleChipSelected: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
    ...shadows.xs,
  },
  roleChipText: {
    fontSize: 10.5,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
  },
  roleChipTextSelected: {
    color: '#FFFFFF',
  },
  activePersonaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: spacing.sm,
  },
  personaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#0D9488',
  },
  personaTextWrapper: {
    flex: 1,
  },
  personaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personaName: {
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
    color: '#0F172A',
  },
  rolePill: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  rolePillText: {
    fontSize: 8.5,
    fontWeight: typography.fontWeights.bold,
    color: '#0D9488',
  },
  personaTitle: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 1,
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
  registerLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  registerLinkText: {
    fontSize: 11.5,
    color: '#0D9488',
    fontWeight: typography.fontWeights.bold,
  },
  publicEnquiryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.xs,
  },
  publicEnquiryContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  publicEnquiryTitle: {
    fontSize: 13.5,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  publicEnquiryDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
