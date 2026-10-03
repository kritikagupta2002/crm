import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import {
  FileCheck2,
  Building2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Landmark,
  FileText,
  X,
  Check,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button, EmptyState } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { VendorApplication } from '../../types';
import { applicationChecks, suggestedTds, REJECT_REASONS } from '../../constants/vendor';

interface VendorApplicationsScreenProps {
  route?: { params?: { openId?: string } };
  navigation: any;
}

export const VendorApplicationsScreen: React.FC<VendorApplicationsScreenProps> = ({ route, navigation }) => {
  const { vendorApplications, vendors, decideVendorApplication } = useCrm();
  const { role, session } = useAuth();

  const isAuthorized = (role as any) === 'admin' || (role as any) === 'director' || (role as any) === 'tender_manager';

  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Changes requested' | 'Approved' | 'Rejected'>('New');
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);

  // Decision Modal State
  const [actionType, setActionType] = useState<'approve' | 'changes' | 'reject' | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [selectedTdsRate, setSelectedTdsRate] = useState<number>(0.02);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-open if parameter passed
  React.useEffect(() => {
    if (route?.params?.openId) {
      const match = vendorApplications.find((a) => a.id === route.params?.openId);
      if (match) setSelectedApp(match);
    }
  }, [route?.params?.openId, vendorApplications]);

  const tabs: Array<'All' | 'New' | 'Changes requested' | 'Approved' | 'Rejected'> = [
    'New',
    'Changes requested',
    'Approved',
    'Rejected',
    'All',
  ];

  const filteredApps = useMemo(() => {
    if (activeTab === 'All') return vendorApplications;
    return vendorApplications.filter((a) => a.status === activeTab);
  }, [vendorApplications, activeTab]);

  const checksForSelected = useMemo(() => {
    if (!selectedApp) return [];
    return applicationChecks(selectedApp, vendors, vendorApplications);
  }, [selectedApp, vendors, vendorApplications]);

  const openApproveModal = (app: VendorApplication) => {
    const sug = suggestedTds(app.firm);
    setSelectedTdsRate(sug.rate);
    setDecisionNote('');
    setActionType('approve');
  };

  const openChangesModal = (app: VendorApplication) => {
    setDecisionNote('');
    setActionType('changes');
  };

  const openRejectModal = (app: VendorApplication) => {
    setRejectReason(REJECT_REASONS[0]);
    setDecisionNote('');
    setActionType('reject');
  };

  const handleExecuteDecision = async () => {
    if (!selectedApp || !actionType) return;

    if (!isAuthorized) {
      Alert.alert('Permission Denied', 'Only Director, Tender Manager, or Admin can approve/reject vendor applications.');
      return;
    }

    if (actionType === 'changes' && !decisionNote.trim()) {
      Alert.alert('Instructions Required', 'Please provide a clear note stating the corrections needed.');
      return;
    }

    setIsProcessing(true);
    try {
      if (actionType === 'approve') {
        const res = await decideVendorApplication(selectedApp.id, 'approved', {
          tdsRate: selectedTdsRate,
          actorName: (session as any)?.name || 'Admin',
        });
        Alert.alert('Vendor Enrolled', `Firm approved! Enrolled under Vendor ID: ${res.vendor?.id || 'VN-XX'}`);
      } else if (actionType === 'changes') {
        await decideVendorApplication(selectedApp.id, 'changes_requested', {
          note: decisionNote.trim(),
          actorName: (session as any)?.name || 'Admin',
        });
        Alert.alert('Sent Back for Changes', 'Application status updated to Changes requested.');
      } else if (actionType === 'reject') {
        await decideVendorApplication(selectedApp.id, 'rejected', {
          reason: rejectReason,
          note: decisionNote.trim(),
          actorName: (session as any)?.name || 'Admin',
        });
        Alert.alert('Application Rejected', `Application marked Rejected: ${rejectReason}`);
      }

      setActionType(null);
      setSelectedApp(null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update application decision.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderAppCard = ({ item }: { item: VendorApplication }) => {
    const checks = applicationChecks(item, vendors, vendorApplications);
    const passed = checks.filter((c) => c.ok).length;
    const allPassed = passed === checks.length;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedApp(item)}
      >
        <Card style={styles.appCard}>
          <View style={styles.cardTop}>
            <View style={styles.idWrap}>
              <Text style={styles.appId}>{item.id}</Text>
              <Text style={styles.submittedDate}>
                {item.submittedAt ? item.submittedAt.slice(0, 10) : ''}
              </Text>
            </View>
            <StatusBadge status={item.status} size="small" />
          </View>

          <Text style={styles.firmName}>{item.firm.name}</Text>
          <Text style={styles.firmCategory} numberOfLines={1}>
            {item.work.categories.join(', ')}
          </Text>

          <View style={styles.locRow}>
            <Text style={styles.locText}>
              {item.address.city}, {item.address.state} • Contact: {item.contact.name} ({item.contact.mobile})
            </Text>
          </View>

          {/* Compliance summary indicator */}
          <View style={styles.complianceSummaryRow}>
            <View style={[styles.compliancePill, allPassed ? styles.pillGreen : styles.pillAmber]}>
              {allPassed ? (
                <CheckCircle2 size={13} color={colors.successText} />
              ) : (
                <AlertCircle size={13} color={colors.warningText} />
              )}
              <Text style={[styles.compliancePillText, allPassed ? styles.pillTextGreen : styles.pillTextAmber]}>
                {passed} of {checks.length} Automated Checks Passed
              </Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="Vendor Applications"
          subtitle="Statutory Verification & Empanellment"
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsList}>
          {tabs.map((t) => {
            const count =
              t === 'All'
                ? vendorApplications.length
                : vendorApplications.filter((a) => a.status === t).length;
            const isSelected = activeTab === t;

            return (
              <TouchableOpacity
                key={t}
                style={[styles.tabChip, isSelected && styles.tabChipSelected]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabChipText, isSelected && styles.tabChipTextSelected]}>
                  {t} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredApps}
        keyExtractor={(item) => item.id}
        renderItem={renderAppCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title={`No ${activeTab} Applications`}
            message="All registration requests in this state have been processed."
          />
        }
      />

      {/* Details Modal */}
      {selectedApp && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetAppId}>{selectedApp.id}</Text>
                  <Text style={styles.sheetTitle}>{selectedApp.firm.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedApp(null)} style={styles.closeBtn}>
                  <X size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.sheetContent}>
                {/* Automated Compliance Checks Engine */}
                <Card style={styles.checksCard}>
                  <Text style={styles.checksTitle}>Automated Statutory Verification</Text>
                  {checksForSelected.map((chk, i) => (
                    <View key={i} style={styles.checkLine}>
                      {chk.ok ? (
                        <CheckCircle2 size={16} color={colors.success} />
                      ) : (
                        <AlertCircle size={16} color={colors.danger} />
                      )}
                      <Text style={[styles.checkText, !chk.ok && styles.checkTextFail]}>
                        {chk.label}
                      </Text>
                    </View>
                  ))}
                </Card>

                {/* Firm & Contact Particulars */}
                <Card style={styles.infoCard}>
                  <Text style={styles.subHeading}>Enterprise Particulars</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Company Type</Text>
                    <Text style={styles.dVal}>{selectedApp.firm.companyType}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>CIN / Registration</Text>
                    <Text style={styles.dVal}>{selectedApp.firm.regNo}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Work Categories</Text>
                    <Text style={styles.dVal}>{selectedApp.work.categories.join(', ')}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Turnover</Text>
                    <Text style={styles.dVal}>{selectedApp.work.turnover}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Authorized Contact</Text>
                    <Text style={styles.dVal}>
                      {selectedApp.contact.name} ({selectedApp.contact.designation})
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Mobile / Email</Text>
                    <Text style={styles.dVal}>
                      {selectedApp.contact.mobile} • {selectedApp.contact.email}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Office Address</Text>
                    <Text style={styles.dVal}>
                      {selectedApp.address.line}, {selectedApp.address.city}, {selectedApp.address.state} - {selectedApp.address.pincode}
                    </Text>
                  </View>
                </Card>

                {/* Tax & Banking Particulars */}
                <Card style={styles.infoCard}>
                  <Text style={styles.subHeading}>Tax & Bank Credentials</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>PAN</Text>
                    <Text style={styles.dVal}>{selectedApp.tax.pan}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>GSTIN</Text>
                    <Text style={styles.dVal}>{selectedApp.tax.gstin || 'Unregistered'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Bank Name</Text>
                    <Text style={styles.dVal}>
                      {selectedApp.bank.bank}, {selectedApp.bank.branch}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Account Number</Text>
                    <Text style={styles.dVal}>{selectedApp.bank.accountNo}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>IFSC Code</Text>
                    <Text style={styles.dVal}>{selectedApp.bank.ifsc}</Text>
                  </View>
                </Card>

                {/* Documents */}
                <Card style={styles.infoCard}>
                  <Text style={styles.subHeading}>Submitted Documents ({selectedApp.documents?.length || 0})</Text>
                  {selectedApp.documents?.map((d) => (
                    <View key={d.id} style={styles.docRow}>
                      <FileText size={16} color={colors.primary} />
                      <Text style={styles.docNameText} numberOfLines={1}>
                        {d.name} ({d.kind})
                      </Text>
                    </View>
                  ))}
                </Card>

                {/* Actions Sheet if status is New or Changes requested */}
                {(selectedApp.status === 'New' || selectedApp.status === 'Changes requested') && isAuthorized && (
                  <View style={styles.actionSheetRow}>
                    <Button
                      title="Approve Firm"
                      variant="primary"
                      style={{ flex: 1 }}
                      onPress={() => openApproveModal(selectedApp)}
                    />
                    <Button
                      title="Request Changes"
                      variant="outline"
                      style={{ flex: 1 }}
                      onPress={() => openChangesModal(selectedApp)}
                    />
                    <Button
                      title="Reject"
                      variant="danger"
                      style={{ flex: 1 }}
                      onPress={() => openRejectModal(selectedApp)}
                    />
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Decision Sub-Modal */}
      {actionType && (
        <Modal visible transparent animationType="fade">
          <View style={styles.decisionBackdrop}>
            <Card style={styles.decisionModalCard}>
              <Text style={styles.decisionTitle}>
                {actionType === 'approve'
                  ? 'Confirm Vendor Empanellment'
                  : actionType === 'changes'
                  ? 'Request Document / Details Changes'
                  : 'Reject Vendor Application'}
              </Text>

              {actionType === 'approve' && (
                <View style={styles.approveSection}>
                  <Text style={styles.decisionDesc}>
                    Approving this application will generate a new official Vendor ID (VN-XX) and admit the firm to tender bidding.
                  </Text>
                  <Text style={styles.inputLabel}>APPLICABLE TDS RATE (FINANCE)</Text>
                  <View style={styles.tdsOptions}>
                    <TouchableOpacity
                      style={[styles.tdsChip, selectedTdsRate === 0.01 && styles.tdsChipActive]}
                      onPress={() => setSelectedTdsRate(0.01)}
                    >
                      <Text style={[styles.tdsChipText, selectedTdsRate === 0.01 && styles.tdsChipTextActive]}>
                        1.0% (Section 194C - Indiv/HUF)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tdsChip, selectedTdsRate === 0.02 && styles.tdsChipActive]}
                      onPress={() => setSelectedTdsRate(0.02)}
                    >
                      <Text style={[styles.tdsChipText, selectedTdsRate === 0.02 && styles.tdsChipTextActive]}>
                        2.0% (Section 194C - Company)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {actionType === 'changes' && (
                <View style={styles.inputSection}>
                  <Text style={styles.decisionDesc}>
                    The vendor will be notified via SMS/email and can resubmit their application through the registration portal.
                  </Text>
                  <Text style={styles.inputLabel}>REMARKS / SPECIFIC DEFICIENCIES *</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. Please attach clear copy of cancelled cheque showing account holder name..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    value={decisionNote}
                    onChangeText={setDecisionNote}
                  />
                </View>
              )}

              {actionType === 'reject' && (
                <View style={styles.inputSection}>
                  <Text style={styles.decisionDesc}>
                    Please select the official statutory ground for application rejection.
                  </Text>
                  <Text style={styles.inputLabel}>STATUTORY REASON FOR REJECTION *</Text>
                  {REJECT_REASONS.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.radioItem, rejectReason === r && styles.radioItemActive]}
                      onPress={() => setRejectReason(r)}
                    >
                      <View style={[styles.radioCircle, rejectReason === r && styles.radioCircleActive]}>
                        {rejectReason === r && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.radioText}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.inputLabel}>ADDITIONAL REMARKS (OPTIONAL)</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Optional internal remarks..."
                    placeholderTextColor={colors.textMuted}
                    value={decisionNote}
                    onChangeText={setDecisionNote}
                  />
                </View>
              )}

              <View style={styles.decisionBtnRow}>
                <Button
                  title="Cancel"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => setActionType(null)}
                />
                <Button
                  title={isProcessing ? 'Processing...' : 'Confirm Decision'}
                  variant={actionType === 'reject' ? 'danger' : 'primary'}
                  style={{ flex: 1 }}
                  disabled={isProcessing}
                  onPress={handleExecuteDecision}
                />
              </View>
            </Card>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabsWrap: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  tabsList: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  tabChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  tabChipSelected: {
    backgroundColor: colors.primary,
  },
  tabChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  tabChipTextSelected: {
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  appCard: {
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  idWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  appId: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  submittedDate: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  firmName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  firmCategory: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  locRow: {
    marginBottom: spacing.sm,
  },
  locText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  complianceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  compliancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
    gap: 4,
  },
  pillGreen: {
    backgroundColor: colors.successBg,
  },
  pillAmber: {
    backgroundColor: colors.warningBg,
  },
  compliancePillText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.semibold,
  },
  pillTextGreen: {
    color: colors.successText,
  },
  pillTextAmber: {
    color: colors.warningText,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  sheetAppId: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  sheetTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  sheetContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  checksCard: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    gap: 6,
  },
  checksTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  checkLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    flex: 1,
  },
  checkTextFail: {
    color: colors.dangerText,
    fontWeight: typography.fontWeights.medium,
  },
  infoCard: {
    padding: spacing.md,
  },
  subHeading: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  dLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    width: 120,
  },
  dVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  docNameText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    flex: 1,
  },
  actionSheetRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  decisionBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  decisionModalCard: {
    width: '100%',
    padding: spacing.lg,
  },
  decisionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  decisionDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  approveSection: {
    marginBottom: spacing.md,
  },
  inputSection: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
    marginBottom: 4,
  },
  tdsOptions: {
    gap: spacing.xs,
  },
  tdsChip: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surfaceMuted,
  },
  tdsChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  tdsChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  tdsChipTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.bold,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  radioItemActive: {},
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  radioCircleActive: {
    borderColor: colors.danger,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  radioText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    flex: 1,
  },
  decisionBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
