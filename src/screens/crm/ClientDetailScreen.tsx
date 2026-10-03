import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FolderKanban,
  ShieldCheck,
  ExternalLink,
  MessageCircle,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  ScrollText,
  HelpCircle,
  X,
} from 'lucide-react-native';
import {
  ScreenContainer,
  AppHeader,
  Card,
  StatusBadge,
  Button,
} from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { useCrm } from '../../context/CrmContext';

interface ClientDetailScreenProps {
  route: any;
  navigation: any;
}

const ONBOARDING_STEPS = [
  { key: 'kyc', label: 'KYC — GST & PAN collected' },
  { key: 'leaseDocs', label: 'Lease & site documents received' },
  { key: 'kickoff', label: 'Kick-off meeting held' },
  { key: 'teamAssigned', label: 'Project team assigned' },
  { key: 'portal', label: 'Client portal access shared' },
];

const formatINR = (n: number) => {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

export const ClientDetailScreen: React.FC<ClientDetailScreenProps> = ({ route, navigation }) => {
  const { clientId, clientName } = route.params;
  const { clients, leads, projects } = useCrm();

  const [portalModalVisible, setPortalModalVisible] = useState(false);

  // Match either from leads (Won) or from clients
  const matchedLead = leads.find(
    (l) => l.id === clientId || l.company.toLowerCase() === (clientName || '').toLowerCase()
  );
  const matchedClient = clients.find(
    (c) => c.id === clientId || c.name.toLowerCase() === (clientName || '').toLowerCase()
  );

  const name = matchedLead?.company || matchedClient?.name || clientName || 'Corporate Client';
  const phone = matchedLead?.phone || matchedClient?.phone || '9887695208';
  const email = matchedLead?.email || matchedClient?.email || 'procurement@client.co.in';
  const contactPerson = matchedLead?.contactPerson || 'Authorized Representative';
  const location = matchedLead?.location || matchedClient?.billingAddress || 'Rajasthan, India';
  const owner = matchedLead?.assignedTo || 'Senior Geologist';
  const businessVal = matchedLead?.quoteValue || matchedLead?.estimatedValue || matchedClient?.totalValue || 4500000;
  const clientSince = matchedLead?.wonOn || matchedClient?.createdAt || '2026-02-15';

  const onboardingStepsDone = ONBOARDING_STEPS.filter(
    (s) => Boolean((matchedLead?.onboarding as any)?.[s.key] || (matchedClient?.onboarding as any)?.[s.key])
  ).length;

  const isAllOnboarded = onboardingStepsDone === ONBOARDING_STEPS.length;
  const status = isAllOnboarded ? 'Active' : 'Onboarding';

  // Linked ERM Projects
  const linkedProjects = projects.filter(
    (p) =>
      p.clientId === clientId ||
      p.clientName.toLowerCase() === name.toLowerCase() ||
      (matchedLead && p.title.toLowerCase().includes(matchedLead.serviceDetail?.toLowerCase() || ''))
  );

  const handleSharePortalWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneNo = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Dear ${contactPerson}, your Bansal Geo Client Portal has been activated. Access project deliverables, drill reports, and inspection certificates here: https://bansalgeo.com/portal?client=${clientId}`;
    const url = `whatsapp://send?phone=${phoneNo}&text=${encodeURIComponent(msg)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert('WhatsApp Not Available', 'Could not open WhatsApp on this device.');
      })
      .catch(() => Alert.alert('Error', 'Unable to open WhatsApp.'));
  };

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title="360° Client Profile"
          subtitle={name}
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      {/* 1. Header Card */}
      <Card>
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={styles.clientName}>{name}</Text>
            <Text style={styles.clientSinceText}>
              Client since {clientSince} · {matchedLead?.clientType || 'Corporate Concessionaire'}
            </Text>
          </View>
          <StatusBadge status={status} size="sm" />
        </View>

        {/* Contact Info & Direct Links */}
        <View style={styles.contactCard}>
          <Text style={styles.contactPersonName}>{contactPerson}</Text>

          <View style={styles.contactLines}>
            {phone ? (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${phone}`)}
              >
                <Phone size={14} color={colors.primary} />
                <Text style={styles.contactLinkText}>+91 {phone}</Text>
              </TouchableOpacity>
            ) : null}

            {email ? (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${email}`)}
              >
                <Mail size={14} color={colors.primary} />
                <Text style={styles.contactLinkText}>{email}</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.contactRow}>
              <MapPin size={14} color={colors.textMuted} />
              <Text style={styles.contactPlain}>{location}</Text>
            </View>
          </View>

          {/* Portal Action Buttons */}
          <View style={styles.portalActions}>
            <TouchableOpacity
              style={styles.portalBtn}
              onPress={() => setPortalModalVisible(true)}
            >
              <ExternalLink size={14} color={colors.primary} />
              <Text style={styles.portalBtnText}>Preview Client Portal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.waBtn}
              onPress={handleSharePortalWhatsApp}
            >
              <MessageCircle size={14} color="#25D366" />
              <Text style={styles.waBtnText}>Send Portal WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fact Grid */}
        <View style={styles.factGrid}>
          <View style={styles.factItem}>
            <Text style={styles.factLabel}>Business Value</Text>
            <Text style={styles.factVal}>{formatINR(businessVal)}</Text>
          </View>
          <View style={styles.factItem}>
            <Text style={styles.factLabel}>Account Owner</Text>
            <Text style={styles.factVal}>{owner}</Text>
          </View>
          <View style={styles.factItem}>
            <Text style={styles.factLabel}>GSTIN / PAN</Text>
            <Text style={styles.factVal}>
              {matchedClient?.gstin || '08AAACN1958C1Z7'}
            </Text>
          </View>
          <View style={styles.factItem}>
            <Text style={styles.factLabel}>Compliance</Text>
            <Text style={styles.factVal}>MSA Executed</Text>
          </View>
        </View>
      </Card>

      {/* 2. Onboarding Workflow Progress */}
      <Card>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Client Onboarding &amp; Setup</Text>
          <Text style={styles.progressCounter}>
            {onboardingStepsDone}/5 Steps Completed
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarWrap}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(onboardingStepsDone / 5) * 100}%`,
                  backgroundColor: isAllOnboarded ? colors.success : colors.warning,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.stepsList}>
          {ONBOARDING_STEPS.map((s, idx) => {
            const isDone = Boolean(
              (matchedLead?.onboarding as any)?.[s.key] ||
              (matchedClient?.onboarding as any)?.[s.key] ||
              (isAllOnboarded && idx < onboardingStepsDone)
            );
            return (
              <View key={s.key} style={styles.stepItemRow}>
                {isDone ? (
                  <CheckCircle2 size={16} color={colors.success} />
                ) : (
                  <Clock size={16} color={colors.textMuted} />
                )}
                <Text style={[styles.stepItemText, isDone && styles.stepItemTextDone]}>
                  {s.label}
                </Text>
              </View>
            );
          })}
        </View>

        {!isAllOnboarded && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => navigation.navigate('ClientOnboarding')}
          >
            <Text style={styles.continueBtnText}>Continue Client Onboarding &rarr;</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* 3. Linked Enquiry & Quotations */}
      <Card>
        <Text style={styles.sectionTitle}>Enquiry &amp; Commercial Contract</Text>
        <View style={styles.enquiryCard}>
          <View style={styles.enquiryHeader}>
            <Text style={styles.enquiryService}>
              {matchedLead?.serviceDetail || 'Geological Diamond Core Drilling & Exploration'}
            </Text>
            <Text style={styles.enquiryId}>{matchedLead?.id || 'BG-2026-001'}</Text>
          </View>

          <View style={styles.quoteRow}>
            <Text style={styles.quoteNoText}>
              Quotation: QT-{(matchedLead?.id || '001').replace('BG-', '')}
            </Text>
            <TouchableOpacity
              style={styles.viewQuoteLink}
              onPress={() => navigation.navigate('Quotes')}
            >
              <Text style={styles.viewQuoteText}>View Quotations &rarr;</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* 4. Active ERM Geological Projects */}
      <Card>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Active Geological Projects ({linkedProjects.length || 1})
          </Text>
          <FolderKanban size={18} color={colors.primary} />
        </View>

        {(linkedProjects.length > 0
          ? linkedProjects
          : [
              {
                id: 'prj-geo-01',
                projectCode: 'PRJ-GEO-2026-001',
                title: matchedLead?.serviceDetail || 'Diamond Core Drilling & Reserve Estimation',
                baselineBudget: businessVal,
                stageName: 'Stage 3: Task Execution',
              },
            ]
        ).map((p: any) => (
          <View key={p.id} style={styles.projectCard}>
            <View style={styles.projHeader}>
              <Text style={styles.projCode}>{p.projectCode}</Text>
              <StatusBadge status={p.stageName || 'In Progress'} size="sm" />
            </View>
            <Text style={styles.projTitle}>{p.title}</Text>
            <View style={styles.projFooter}>
              <Text style={styles.projBudget}>Budget: {formatINR(p.baselineBudget)}</Text>
              <Text style={styles.projAuthority}>Authority: DMG Rajasthan</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Client Portal Preview Modal */}
      <Modal
        visible={portalModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPortalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Bansal Geo Client Portal</Text>
                <Text style={styles.modalSub}>{name} • Live View</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPortalModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.portalWelcomeBanner}>
                <Building2 size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.portalWelcomeTitle}>Welcome, {contactPerson}</Text>
                  <Text style={styles.portalWelcomeDesc}>
                    Your exploration contract is active. All field bore logs, assay samples, and government submissions are updated in real-time.
                  </Text>
                </View>
              </View>

              <Text style={styles.portalSectionTitle}>Live Project Status</Text>
              <View style={styles.portalStatGrid}>
                <View style={styles.portalStatBox}>
                  <Text style={styles.portalStatLabel}>Boreholes Completed</Text>
                  <Text style={styles.portalStatVal}>12 / 18</Text>
                </View>
                <View style={styles.portalStatBox}>
                  <Text style={styles.portalStatLabel}>Core Recovery</Text>
                  <Text style={styles.portalStatVal}>92.4%</Text>
                </View>
                <View style={styles.portalStatBox}>
                  <Text style={styles.portalStatLabel}>Assay Certificates</Text>
                  <Text style={styles.portalStatVal}>4 Issued</Text>
                </View>
                <View style={styles.portalStatBox}>
                  <Text style={styles.portalStatLabel}>Govt Clearance</Text>
                  <Text style={styles.portalStatVal}>Pending DMG</Text>
                </View>
              </View>

              <Text style={styles.portalSectionTitle}>Recent Certified Documents</Text>
              <View style={styles.portalDocItem}>
                <ScrollText size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.portalDocName}>Interim Geological Core Report v1.2</Text>
                  <Text style={styles.portalDocDate}>Certified by Dr. Sunita Meena · Signed PDF</Text>
                </View>
              </View>
              <View style={styles.portalDocItem}>
                <ScrollText size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.portalDocName}>Geochemical Assay Batch #04 Results</Text>
                  <Text style={styles.portalDocDate}>NABL Accredited Lab · Signed PDF</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Close Portal Preview"
                onPress={() => setPortalModalVisible(false)}
                variant="outline"
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  clientName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  clientSinceText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactCard: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  contactPersonName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  contactLines: {
    gap: 4,
    marginBottom: spacing.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactLinkText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.medium,
  },
  contactPlain: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  portalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  portalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  portalBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  waBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#25D366',
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  factItem: {
    width: '48%',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  factLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  factVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  progressCounter: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  progressBarWrap: {
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepsList: {
    gap: 6,
    marginBottom: spacing.sm,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepItemText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  stepItemTextDone: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  continueBtn: {
    paddingVertical: 6,
  },
  continueBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  enquiryCard: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  enquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  enquiryService: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  enquiryId: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: 4,
  },
  quoteNoText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  viewQuoteLink: {
    paddingVertical: 2,
  },
  viewQuoteText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  projectCard: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  projHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  projCode: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  projTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  projFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  projBudget: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
  },
  projAuthority: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    padding: spacing.md,
  },
  portalWelcomeBanner: {
    flexDirection: 'row',
    backgroundColor: colors.primaryBg,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  portalWelcomeTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  portalWelcomeDesc: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textPrimary,
    marginTop: 2,
    lineHeight: 16,
  },
  portalSectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  portalStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  portalStatBox: {
    width: '48%',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  portalStatLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  portalStatVal: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  portalDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    marginBottom: 6,
  },
  portalDocName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  portalDocDate: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
