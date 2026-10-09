import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  AlertCircle,
  Download,
  Building2,
  Award,
  Check,
} from 'lucide-react-native';
import { clientTheme } from './clientTheme';
import { Deliverable } from '../../../types';

interface ClientDeliverableDetailModalProps {
  visible: boolean;
  deliverable: (Deliverable & { projectTitle: string; projectCode?: string }) | null;
  clientCompanyName: string;
  clientContactPerson: string;
  onClose: () => void;
  onSignOff: (projectId: string, deliverableId: string, remarks?: string) => Promise<void>;
  onRequestRevision: (projectId: string, deliverableId: string, reason: string) => Promise<void>;
}

export const ClientDeliverableDetailModal: React.FC<ClientDeliverableDetailModalProps> = ({
  visible,
  deliverable,
  clientCompanyName,
  clientContactPerson,
  onClose,
  onSignOff,
  onRequestRevision,
}) => {
  if (!deliverable) return null;

  const [declarationChecked, setDeclarationChecked] = useState<boolean>(false);
  const [signOffRemarks, setSignOffRemarks] = useState<string>('');
  const [showRevisionInput, setShowRevisionInput] = useState<boolean>(false);
  const [revisionReason, setRevisionReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isApproved = deliverable.status === 'Client Approved';
  const isSubmitted = deliverable.status === 'Submitted';

  const handleApprovePress = async () => {
    if (!declarationChecked) {
      Alert.alert(
        'Confirmation Required',
        'Please check the declaration confirming technical review on behalf of ' + clientCompanyName
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSignOff(deliverable.projectId, deliverable.id, signOffRemarks.trim());
      setDeclarationChecked(false);
      setSignOffRemarks('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevisionPress = async () => {
    if (!revisionReason.trim()) {
      Alert.alert('Details Required', 'Please enter specific technical revision notes or queries.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onRequestRevision(deliverable.projectId, deliverable.id, revisionReason.trim());
      setShowRevisionInput(false);
      setRevisionReason('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <View style={styles.badgeRow}>
              <View style={styles.versionPill}>
                <Text style={styles.versionText}>Version {deliverable.version || 'v1.0'}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  isApproved && styles.statusBadgeApproved,
                  isSubmitted && styles.statusBadgeSubmitted,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isApproved && styles.statusBadgeTextApproved,
                    isSubmitted && styles.statusBadgeTextSubmitted,
                  ]}
                >
                  {deliverable.status}
                </Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>{deliverable.title}</Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={clientTheme.colors.navy} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* 1. DOCUMENT METADATA CARD */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color={clientTheme.colors.navy} />
              <Text style={styles.sectionHeading}>Technical Deliverable Details</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Associated Project</Text>
              <Text style={styles.detailVal}>{deliverable.projectTitle}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Digital File Name</Text>
              <Text style={[styles.detailVal, { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
                {deliverable.fileName || 'Report_Lithologs_Attested.pdf'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Certified File Size</Text>
              <Text style={styles.detailVal}>{deliverable.fileSize || '14.2 MB'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submission Date</Text>
              <Text style={styles.detailVal}>{deliverable.submissionDate || '2026-09-28'}</Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Lead Geologist</Text>
              <Text style={styles.detailVal}>Dr. Sunita Meena (Lead Consultant)</Text>
            </View>
          </View>

          {/* 2. TECHNICAL REPORT SUMMARY & BOREHOLE PREVIEW */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ShieldCheck size={18} color={clientTheme.colors.navy} />
              <Text style={styles.sectionHeading}>Executive Geological Summary</Text>
            </View>

            <Text style={styles.summaryParagraph}>
              This technical deliverable compiles complete lithological borehole logs, core photography, structural shear zone measurements, and NABL-accredited geochemical ICP-MS assay results for the concession block.
            </Text>

            <View style={styles.specBox}>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Total Borehole Coring:</Text>
                <Text style={styles.specVal}>150.0 Meters (HQ Diameter)</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Average Core Recovery:</Text>
                <Text style={[styles.specVal, { color: clientTheme.colors.emerald }]}>92.4% (Good Quality)</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Geochemical Samples:</Text>
                <Text style={styles.specVal}>240 Core Splits Assayed</Text>
              </View>
              <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.specKey}>Statutory Standard:</Text>
                <Text style={styles.specVal}>UNFC G3 Classification Guidelines</Text>
              </View>
            </View>

            {/* Verification Stamp */}
            <View style={styles.attestationStamp}>
              <Award size={20} color={clientTheme.colors.teal} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stampTitle}>Bansal Geo Quality Assured</Text>
                <Text style={styles.stampSub}>
                  Digitally sealed and verified by Department of Mines & Geology accredited competent person.
                </Text>
              </View>
            </View>
          </View>

          {/* 3. STAGE 5 CLIENT SIGN-OFF SECTION */}
          {isApproved ? (
            <View style={styles.approvedNoticeCard}>
              <CheckCircle2 size={24} color={clientTheme.colors.emerald} />
              <View style={{ flex: 1 }}>
                <Text style={styles.approvedNoticeTitle}>Signed Off & Accepted</Text>
                <Text style={styles.approvedNoticeDesc}>
                  Officially signed off by {clientContactPerson} on behalf of {clientCompanyName}. Recorded in Stage 5 project lifecycle.
                </Text>
              </View>
            </View>
          ) : isSubmitted ? (
            <View style={styles.signOffCard}>
              <View style={styles.signOffHeader}>
                <ShieldCheck size={20} color={clientTheme.colors.goldDark} />
                <Text style={styles.signOffTitle}>Stage 5 Client Executive Sign-Off</Text>
              </View>

              <Text style={styles.signOffDesc}>
                As authorized signatory of {clientCompanyName}, you can review and grant executive acceptance for this technical deliverable to advance the concession lifecycle to Stage 6: Invoicing.
              </Text>

              {/* Declaration Checkbox */}
              <TouchableOpacity
                style={styles.declarationRow}
                activeOpacity={0.8}
                onPress={() => setDeclarationChecked(!declarationChecked)}
              >
                <View style={[styles.checkbox, declarationChecked && styles.checkboxActive]}>
                  {declarationChecked && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </View>
                <Text style={styles.declarationText}>
                  I confirm that the technical deliverable has been inspected and meets the contracted exploration specifications.
                </Text>
              </TouchableOpacity>

              {/* Optional Remarks */}
              <Text style={styles.remarksLabel}>SIGN-OFF REMARKS / CONCESSION NOTES (OPTIONAL)</Text>
              <TextInput
                style={styles.remarksInput}
                placeholder="e.g. Approved for statutory DMG submission..."
                placeholderTextColor={clientTheme.colors.textTertiary}
                value={signOffRemarks}
                onChangeText={setSignOffRemarks}
              />

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.approveBtn}
                activeOpacity={0.8}
                onPress={handleApprovePress}
                disabled={isSubmitting}
              >
                <CheckCircle2 size={18} color="#ffffff" strokeWidth={2.4} />
                <Text style={styles.approveBtnText}>
                  {isSubmitting ? 'Recording Sign-Off...' : 'Approve & Sign Off Deliverable'}
                </Text>
              </TouchableOpacity>

              {/* Revision Trigger */}
              {!showRevisionInput ? (
                <TouchableOpacity
                  style={styles.revisionTriggerBtn}
                  activeOpacity={0.7}
                  onPress={() => setShowRevisionInput(true)}
                >
                  <AlertCircle size={16} color={clientTheme.colors.crimson} />
                  <Text style={styles.revisionTriggerText}>Request Clarification / Technical Revision</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.revisionInputBox}>
                  <Text style={styles.revisionInputLabel}>SPECIFY TECHNICAL QUERIES OR REVISION REQUIRED *</Text>
                  <TextInput
                    style={[styles.remarksInput, { height: 80, textAlignVertical: 'top' }]}
                    multiline
                    placeholder="Describe discrepancy in lithologs, core recovery, or assay calculations..."
                    placeholderTextColor={clientTheme.colors.textTertiary}
                    value={revisionReason}
                    onChangeText={setRevisionReason}
                  />

                  <View style={styles.revisionActionsRow}>
                    <TouchableOpacity
                      style={styles.cancelRevisionBtn}
                      onPress={() => setShowRevisionInput(false)}
                    >
                      <Text style={styles.cancelRevisionText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.submitRevisionBtn}
                      onPress={handleRevisionPress}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.submitRevisionText}>Submit Query</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.revisionNoticeCard}>
              <AlertCircle size={22} color={clientTheme.colors.crimson} />
              <View style={{ flex: 1 }}>
                <Text style={styles.revisionNoticeTitle}>Revision In Progress</Text>
                <Text style={styles.revisionNoticeDesc}>
                  Your feedback has been logged. The technical team is revising the borehole logs and will upload a replacement version shortly.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: clientTheme.colors.sandstone,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: clientTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: clientTheme.colors.sandstoneBorder,
    ...clientTheme.shadows.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  versionPill: {
    backgroundColor: clientTheme.colors.navySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  versionText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  statusBadge: {
    backgroundColor: clientTheme.colors.sandstoneDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeApproved: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  statusBadgeSubmitted: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: clientTheme.colors.textMuted,
  },
  statusBadgeTextApproved: {
    color: clientTheme.colors.emerald,
  },
  statusBadgeTextSubmitted: {
    color: clientTheme.colors.goldDark,
  },
  headerTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: clientTheme.colors.sandstoneDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 16,
    paddingBottom: 80,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
    ...clientTheme.shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: clientTheme.colors.sandstoneBorder,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 13,
    color: clientTheme.colors.textMuted,
  },
  detailVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: clientTheme.colors.graphite,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  summaryParagraph: {
    fontSize: 13,
    color: clientTheme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  specBox: {
    backgroundColor: clientTheme.colors.sandstone,
    padding: 12,
    borderRadius: clientTheme.radius.sm,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: clientTheme.colors.sandstoneBorder,
  },
  specKey: {
    fontSize: 12.5,
    color: clientTheme.colors.textMuted,
    fontWeight: '600',
  },
  specVal: {
    fontSize: 13,
    fontWeight: '800',
    color: clientTheme.colors.graphite,
  },
  attestationStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    gap: 10,
  },
  stampTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: clientTheme.colors.tealDark,
  },
  stampSub: {
    fontSize: 11,
    color: '#0f766e',
    marginTop: 2,
    lineHeight: 15,
  },
  signOffCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    ...clientTheme.shadows.md,
  },
  signOffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  signOffTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: clientTheme.colors.goldDark,
  },
  signOffDesc: {
    fontSize: 12.5,
    color: clientTheme.colors.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  declarationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffdf5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 12,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: clientTheme.colors.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: clientTheme.colors.goldDark,
  },
  declarationText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: clientTheme.colors.graphite,
    flex: 1,
    lineHeight: 17,
  },
  remarksLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: clientTheme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  remarksInput: {
    backgroundColor: clientTheme.colors.sandstone,
    borderWidth: 1.2,
    borderColor: clientTheme.colors.sandstoneBorderDark,
    borderRadius: clientTheme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: clientTheme.colors.graphite,
    marginBottom: 14,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: clientTheme.colors.emerald,
    height: 50,
    borderRadius: clientTheme.radius.md,
    gap: 8,
    ...clientTheme.shadows.sm,
    marginBottom: 10,
  },
  approveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  revisionTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  revisionTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: clientTheme.colors.crimson,
  },
  revisionInputBox: {
    backgroundColor: '#fffbfa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: 6,
  },
  revisionInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: clientTheme.colors.crimson,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  revisionActionsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelRevisionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelRevisionText: {
    fontSize: 13,
    fontWeight: '600',
    color: clientTheme.colors.textMuted,
  },
  submitRevisionBtn: {
    backgroundColor: clientTheme.colors.crimson,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitRevisionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  approvedNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: clientTheme.radius.lg,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 12,
  },
  approvedNoticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: clientTheme.colors.emeraldDark,
  },
  approvedNoticeDesc: {
    fontSize: 12.5,
    color: '#065f46',
    marginTop: 2,
    lineHeight: 17,
  },
  revisionNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: clientTheme.radius.lg,
    borderWidth: 1,
    borderColor: '#fca5a5',
    gap: 12,
  },
  revisionNoticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: clientTheme.colors.crimson,
  },
  revisionNoticeDesc: {
    fontSize: 12.5,
    color: '#991b1b',
    marginTop: 2,
    lineHeight: 17,
  },
});
