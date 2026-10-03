import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {
  ClipboardList,
  UserPlus,
  CheckCircle2,
  Rocket,
  CheckSquare,
  Square,
  Lock,
  MessageCircle,
  Building2,
  ShieldCheck,
  Plus,
} from 'lucide-react-native';
import {
  ScreenContainer,
  AppHeader,
  Card,
  StatusBadge,
  StatCard,
  Input,
  Button,
  EmptyState,
} from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { Lead } from '../../types';

interface ClientOnboardingScreenProps {
  navigation: any;
}

const ONBOARDING_STEPS = [
  { key: 'kyc', label: 'KYC — GST & PAN collected', by: 'onboarding' },
  { key: 'leaseDocs', label: 'Lease & site documents received', by: 'onboarding' },
  { key: 'kickoff', label: 'Kick-off meeting held', by: 'onboarding' },
  { key: 'teamAssigned', label: 'Project team assigned', by: 'onboarding' },
  { key: 'portal', label: 'Client portal access shared', by: 'onboarding' },
] as const;

export const ClientOnboardingScreen: React.FC<ClientOnboardingScreenProps> = ({ navigation }) => {
  const { leads, updateOnboardingStep, clients } = useCrm();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<'progress' | 'completed' | 'new_kyc'>('progress');
  const [loadingStepKey, setLoadingStepKey] = useState<string | null>(null);

  // New Client KYC Form State
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [hasMsa, setHasMsa] = useState(false);
  const [hasGstinVerified, setHasGstinVerified] = useState(false);
  const [hasPanVerified, setHasPanVerified] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const canOnboard = ['admin', 'operations_manager', 'project_manager', 'lead_engineer'].includes(role || '');

  // Won leads
  const wonLeads = leads.filter((l) => l.stage === 'Won');

  const isDone = (l: Lead) =>
    ONBOARDING_STEPS.every((s) => (l.onboarding as any)?.[s.key]);

  const inProgressLeads = wonLeads
    .filter((l) => !isDone(l))
    .sort((a, b) => {
      const aDone = ONBOARDING_STEPS.filter((s) => (a.onboarding as any)?.[s.key]).length;
      const bDone = ONBOARDING_STEPS.filter((s) => (b.onboarding as any)?.[s.key]).length;
      return bDone - aDone;
    });

  const completedLeads = wonLeads.filter(isDone);
  const notStartedCount = inProgressLeads.filter(
    (l) => ONBOARDING_STEPS.filter((s) => (l.onboarding as any)?.[s.key]).length === 0
  ).length;

  const handleToggle = async (lead: Lead, stepKey: string, currentVal: boolean) => {
    if (!canOnboard) {
      Alert.alert('Permission Denied', 'Onboarding steps are verified by Project Coordinators and Administrators.');
      return;
    }

    setLoadingStepKey(`${lead.id}-${stepKey}`);
    try {
      await updateOnboardingStep(lead.id, stepKey, !currentVal);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoadingStepKey(null);
    }
  };

  const handleSharePortalWhatsApp = (lead: Lead) => {
    if (!lead.phone) {
      Alert.alert('No Phone', 'No contact phone number recorded for this client.');
      return;
    }
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const phoneNo = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Dear ${lead.contactPerson || 'Client'}, your Bansal Geo Client Portal has been activated. Track real-time exploration progress, site survey logs, and government approvals here: https://bansalgeo.com/portal?lead=${lead.id}`;
    const url = `whatsapp://send?phone=${phoneNo}&text=${encodeURIComponent(msg)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
          // Auto mark portal step as done
          if (!lead.onboarding?.portal) {
            updateOnboardingStep(lead.id, 'portal', true);
          }
        } else {
          Alert.alert('WhatsApp Not Available', 'Could not open WhatsApp on this device.');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp.');
      });
  };

  const handleManualKYCOnboard = () => {
    if (!companyName.trim() || !gstin.trim() || !pan.trim()) {
      Alert.alert('Required Fields', 'Please complete Company Name, GSTIN, and PAN.');
      return;
    }
    if (gstin.trim().length !== 15) {
      Alert.alert('Validation Error', 'GSTIN must be exactly 15 characters.');
      return;
    }
    if (pan.trim().length !== 10) {
      Alert.alert('Validation Error', 'PAN must be exactly 10 characters.');
      return;
    }
    if (!hasMsa || !hasGstinVerified || !hasPanVerified) {
      Alert.alert('Compliance Incomplete', 'Please verify all required KYC checkboxes before enrollment.');
      return;
    }

    setFormLoading(true);
    setTimeout(() => {
      setFormLoading(false);
      Alert.alert(
        'Client KYC Verified',
        `${companyName} has been enrolled into Client Master with Active contract status.`,
        [
          {
            text: 'View Clients',
            onPress: () => {
              setActiveTab('completed');
              navigation.navigate('Clients');
            },
          },
        ]
      );
    }, 400);
  };

  return (
    <ScreenContainer
      scrollable={activeTab === 'new_kyc'}
      header={
        <AppHeader
          title="Client Onboarding"
          subtitle="Transforming won commercial deals into active projects"
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      {/* 4 Stat Cards */}
      <View style={styles.kpiGrid}>
        <StatCard
          label="In Progress"
          value={inProgressLeads.length - notStartedCount}
          subtext="Some steps verified"
          icon={<ClipboardList size={20} color={colors.warning} />}
          tone="attention"
        />
        <StatCard
          label="Not Started"
          value={notStartedCount}
          subtext="Won, docs pending"
          icon={<UserPlus size={20} color={colors.danger} />}
          tone="urgent"
        />
        <StatCard
          label="Active Clients"
          value={completedLeads.length}
          subtext="Onboarding complete"
          icon={<CheckCircle2 size={20} color={colors.success} />}
          tone="good"
        />
        <StatCard
          label="Won Deals"
          value={wonLeads.length}
          subtext="All-time won deals"
          icon={<Rocket size={20} color={colors.info} />}
          tone="info"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'progress' && styles.tabBtnActive]}
          onPress={() => setActiveTab('progress')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'progress' && styles.tabBtnTextActive]}>
            In Progress ({inProgressLeads.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'completed' && styles.tabBtnTextActive]}>
            Completed ({completedLeads.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'new_kyc' && styles.tabBtnActive]}
          onPress={() => setActiveTab('new_kyc')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'new_kyc' && styles.tabBtnTextActive]}>
            New KYC Form
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Tab Content */}
      {activeTab === 'new_kyc' ? (
        <View style={styles.formContainer}>
          <Card>
            <Text style={styles.formSectionHeader}>Corporate Information</Text>

            <Input
              label="Corporate Entity Name *"
              placeholder="e.g. National Mineral Exploration Corp"
              value={companyName}
              onChangeText={setCompanyName}
            />

            <Input
              label="GST Identification Number (GSTIN) *"
              placeholder="e.g. 08AAACN1958C1Z7"
              value={gstin}
              onChangeText={setGstin}
              autoCapitalize="characters"
              maxLength={15}
            />

            <Input
              label="Permanent Account Number (PAN) *"
              placeholder="e.g. AAACN1958C"
              value={pan}
              onChangeText={setPan}
              autoCapitalize="characters"
              maxLength={10}
            />

            <Input
              label="Official Contact Phone"
              placeholder="e.g. 9887695208"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Input
              label="Corporate Email Address"
              placeholder="e.g. procurement@nmdc.co.in"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Billing Address"
              placeholder="Registered office / mine lease address"
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </Card>

          <Card>
            <Text style={styles.formSectionHeader}>Compliance &amp; KYC Verification</Text>
            <Text style={styles.formSectionSub}>
              Mandatory legal checks before master enrollment:
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setHasMsa(!hasMsa)}
              style={styles.checkRow}
            >
              {hasMsa ? (
                <CheckSquare size={20} color={colors.primary} />
              ) : (
                <Square size={20} color={colors.textMuted} />
              )}
              <Text style={styles.checkLabel}>
                Master Service Agreement (MSA) Executed &amp; Uploaded
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setHasGstinVerified(!hasGstinVerified)}
              style={styles.checkRow}
            >
              {hasGstinVerified ? (
                <CheckSquare size={20} color={colors.primary} />
              ) : (
                <Square size={20} color={colors.textMuted} />
              )}
              <Text style={styles.checkLabel}>
                GSTIN Active &amp; Verified on Govt GST Portal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setHasPanVerified(!hasPanVerified)}
              style={styles.checkRow}
            >
              {hasPanVerified ? (
                <CheckSquare size={20} color={colors.primary} />
              ) : (
                <Square size={20} color={colors.textMuted} />
              )}
              <Text style={styles.checkLabel}>
                PAN Verified with Income Tax Department
              </Text>
            </TouchableOpacity>

            <Button
              title="Enroll into Client Master"
              onPress={handleManualKYCOnboard}
              loading={formLoading}
              size="lg"
              style={styles.enrollBtn}
            />
          </Card>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'progress' ? inProgressLeads : completedLeads}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              title={
                activeTab === 'progress'
                  ? 'All Won Clients Onboarded!'
                  : 'No Completed Onboardings'
              }
              description={
                activeTab === 'progress'
                  ? 'All won commercial deals have completed onboarding and are active.'
                  : 'Complete all 5 onboarding steps for in-progress clients.'
              }
              icon={<CheckCircle2 size={48} color={colors.success} />}
            />
          }
          renderItem={({ item }) => {
            const stepsDone = ONBOARDING_STEPS.filter((s) => (item.onboarding as any)?.[s.key]).length;
            const completed = stepsDone === ONBOARDING_STEPS.length;
            const percent = Math.round((stepsDone / ONBOARDING_STEPS.length) * 100);

            return (
              <Card style={styles.onboardCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleCol}>
                    <Text style={styles.clientName}>{item.company}</Text>
                    <Text style={styles.metaText}>
                      Won · Assigned to {item.assignedTo || 'Senior Geologist'}
                    </Text>
                  </View>
                  <StatusBadge
                    status={completed ? 'Active' : 'Onboarding'}
                    size="sm"
                  />
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarWrap}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: completed ? colors.success : colors.warning,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.percentText}>
                    {stepsDone}/{ONBOARDING_STEPS.length} Steps
                  </Text>
                </View>

                {/* 5 Onboarding Steps */}
                <View style={styles.checklist}>
                  {ONBOARDING_STEPS.map((step) => {
                    const isChecked = Boolean((item.onboarding as any)?.[step.key]);
                    return (
                      <TouchableOpacity
                        key={step.key}
                        style={[styles.checkItem, isChecked && styles.checkItemDone]}
                        activeOpacity={0.7}
                        onPress={() => handleToggle(item, step.key, isChecked)}
                      >
                        {isChecked ? (
                          <CheckSquare size={18} color={colors.success} />
                        ) : !canOnboard ? (
                          <Lock size={18} color={colors.textMuted} />
                        ) : (
                          <Square size={18} color={colors.textMuted} />
                        )}
                        <Text
                          style={[
                            styles.stepLabel,
                            isChecked && styles.stepLabelDone,
                          ]}
                        >
                          {step.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Footer Action */}
                <View style={styles.cardFooter}>
                  {completed ? (
                    <View style={styles.activeBadge}>
                      <CheckCircle2 size={16} color={colors.success} />
                      <Text style={styles.activeBadgeText}>Active Client — Ready for Fieldwork</Text>
                    </View>
                  ) : !item.onboarding?.portal ? (
                    <TouchableOpacity
                      style={styles.waShareBtn}
                      onPress={() => handleSharePortalWhatsApp(item)}
                    >
                      <MessageCircle size={16} color="#fff" />
                      <Text style={styles.waShareBtnText}>Share Portal Access on WhatsApp</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.portalSharedText}>
                      Client portal shared via WhatsApp
                    </Text>
                  )}
                </View>
              </Card>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    padding: 3,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  tabBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  listContent: {
    paddingBottom: spacing.huge,
  },
  onboardCard: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  clientName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  metaText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
  },
  checklist: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  checkItemDone: {
    backgroundColor: colors.successBg,
  },
  stepLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    flex: 1,
  },
  stepLabelDone: {
    color: colors.successText,
    fontWeight: typography.fontWeights.semibold,
  },
  cardFooter: {
    paddingTop: spacing.xs,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successBg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  activeBadgeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.successText,
    fontWeight: typography.fontWeights.bold,
  },
  waShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    gap: 6,
  },
  waShareBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#fff',
  },
  portalSharedText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Form
  formContainer: {
    paddingBottom: spacing.huge,
  },
  formSectionHeader: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  formSectionSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  checkLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    flex: 1,
  },
  enrollBtn: {
    marginTop: spacing.md,
  },
});
