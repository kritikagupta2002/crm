import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  FileText,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Paperclip,
} from 'lucide-react-native';
import { WorkOrder, Tender } from '../../../types';
import { vendorTheme } from './vendorTheme';

interface VendorPortalModalsProps {
  accountModalVisible: boolean;
  setAccountModalVisible: (v: boolean) => void;
  currentVendor: any;

  deliveryModalVisible: boolean;
  setDeliveryModalVisible: (v: boolean) => void;
  selectedWoForDelivery: WorkOrder | null;
  deliveryNotes: string;
  setDeliveryNotes: (v: string) => void;
  attachedFiles: string[];
  setAttachedFiles: (files: string[]) => void;
  handleSubmitDelivery: () => void;

  billingModalVisible: boolean;
  setBillingModalVisible: (v: boolean) => void;
  selectedWoForBilling: WorkOrder | null;
  invoiceNo: string;
  setInvoiceNo: (v: string) => void;
  billAmount: string;
  setBillAmount: (v: string) => void;
  billRemarks: string;
  setBillRemarks: (v: string) => void;
  handleSubmitBill: () => void;

  askModalVisible: boolean;
  setAskModalVisible: (v: boolean) => void;
  selectedTenderForAsk: Tender | null;
  questionText: string;
  setQuestionText: (v: string) => void;
  handleSubmitClarification: () => void;
}

export const VendorPortalModals: React.FC<VendorPortalModalsProps> = ({
  accountModalVisible,
  setAccountModalVisible,
  currentVendor,
  deliveryModalVisible,
  setDeliveryModalVisible,
  selectedWoForDelivery,
  deliveryNotes,
  setDeliveryNotes,
  attachedFiles,
  setAttachedFiles,
  handleSubmitDelivery,
  billingModalVisible,
  setBillingModalVisible,
  selectedWoForBilling,
  invoiceNo,
  setInvoiceNo,
  billAmount,
  setBillAmount,
  billRemarks,
  setBillRemarks,
  handleSubmitBill,
  askModalVisible,
  setAskModalVisible,
  selectedTenderForAsk,
  questionText,
  setQuestionText,
  handleSubmitClarification,
}) => {
  // Compute Section 194C TDS preview
  const numAmount = parseFloat(billAmount) || 0;
  const tdsEstimate = Math.round(numAmount * 0.02);
  const netEstimate = Math.max(0, numAmount - tdsEstimate);

  const remainingCeiling = selectedWoForBilling
    ? (selectedWoForBilling.contractValue || 0) - (selectedWoForBilling.paidAmount || 0)
    : 0;

  return (
    <>
      {/* 1. DELIVERY REPORT MODAL */}
      <Modal visible={deliveryModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Fieldwork Delivery Report</Text>
                <Text style={styles.sheetSubtitle}>
                  Order: {selectedWoForDelivery?.woNumber || selectedWoForDelivery?.id}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDeliveryModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={18} color={vendorTheme.colors.navy} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody}>
              <Text style={styles.inputLabel}>COMPLETION NOTES & FIELD SUMMARY *</Text>
              <TextInput
                style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
                multiline
                placeholder="Detail completed borehole meterage, samples collected, recoveries, rig equipment logs..."
                placeholderTextColor={vendorTheme.colors.textTertiary}
                value={deliveryNotes}
                onChangeText={setDeliveryNotes}
              />

              <Text style={styles.inputLabel}>DELIVERY PROOFS & LITHOLOGY SHEETS</Text>
              <View style={styles.filesList}>
                {attachedFiles.map((fn, idx) => (
                  <View key={idx} style={styles.fileItem}>
                    <FileText size={15} color={vendorTheme.colors.teal} />
                    <Text style={styles.fileName} numberOfLines={1}>
                      {fn}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.addFileBtn}
                onPress={() =>
                  setAttachedFiles([
                    ...attachedFiles,
                    `Survey_Attestation_${Date.now().toString().slice(-4)}.pdf`,
                  ])
                }
              >
                <Paperclip size={14} color={vendorTheme.colors.navy} />
                <Text style={styles.addFileText}>Attach Additional Field Document</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                onPress={() => setDeliveryModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitDelivery}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnText}>Submit Field Deliverables</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 2. MILESTONE BILLING MODAL WITH 2% TDS LOGIC */}
      <Modal visible={billingModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Submit Milestone Invoice</Text>
                <Text style={styles.sheetSubtitle}>
                  Order: {selectedWoForBilling?.woNumber || selectedWoForBilling?.id}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setBillingModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={18} color={vendorTheme.colors.navy} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody}>
              <View style={styles.ceilingNotice}>
                <Text style={styles.ceilingNoticeText}>
                  Remaining Unbilled Ceiling: ₹{remainingCeiling.toLocaleString('en-IN')}
                </Text>
              </View>

              <Text style={styles.inputLabel}>TAX INVOICE NUMBER *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. APX-INV-2026-089"
                placeholderTextColor={vendorTheme.colors.textTertiary}
                value={invoiceNo}
                onChangeText={setInvoiceNo}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>GROSS INVOICE AMOUNT (EXCLUDING GST) (₹) *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="e.g. 500000"
                placeholderTextColor={vendorTheme.colors.textTertiary}
                value={billAmount}
                onChangeText={setBillAmount}
              />

              {/* Live Section 194C TDS Preview */}
              {numAmount > 0 && (
                <View style={styles.tdsPreviewCard}>
                  <Text style={styles.tdsPreviewTitle}>STATUTORY TDS ESTIMATE (SEC 194C)</Text>
                  <View style={styles.tdsPreviewRow}>
                    <Text style={styles.tdsPreviewLabel}>Gross Invoice Amount:</Text>
                    <Text style={styles.tdsPreviewVal}>₹{numAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.tdsPreviewRow}>
                    <Text style={styles.tdsPreviewLabel}>Less: TDS Deduction @ 2%:</Text>
                    <Text style={[styles.tdsPreviewVal, { color: vendorTheme.colors.crimson }]}>
                      - ₹{tdsEstimate.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.tdsDivider} />
                  <View style={styles.tdsPreviewRow}>
                    <Text style={styles.tdsPreviewTotalLabel}>Est. Net Bank Remittance:</Text>
                    <Text style={styles.tdsPreviewTotalVal}>₹{netEstimate.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>MILESTONE DESCRIPTION / WORK SUMMARY</Text>
              <TextInput
                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                multiline
                placeholder="Completed core logging, borehole depths, milestone milestone reference..."
                placeholderTextColor={vendorTheme.colors.textTertiary}
                value={billRemarks}
                onChangeText={setBillRemarks}
              />
            </ScrollView>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                onPress={() => setBillingModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitBill}
                style={[styles.submitBtn, { backgroundColor: vendorTheme.colors.emerald }]}
              >
                <Text style={styles.submitBtnText}>Lodge Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 3. PRE-BID CLARIFICATION QUERY MODAL */}
      <Modal visible={askModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Ask Pre-Bid Clarification</Text>
                <Text style={styles.sheetSubtitle}>
                  Tender: {selectedTenderForAsk?.tenderNo || selectedTenderForAsk?.id}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAskModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={18} color={vendorTheme.colors.navy} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody}>
              <Text style={styles.inputLabel}>TECHNICAL QUERY / AMBIGUITY *</Text>
              <TextInput
                style={[styles.textInput, { height: 110, textAlignVertical: 'top' }]}
                multiline
                placeholder="State specific scope clause, lithology logging requirement, borehole inclination, or testing standard..."
                placeholderTextColor={vendorTheme.colors.textTertiary}
                value={questionText}
                onChangeText={setQuestionText}
              />

              <View style={styles.infoHint}>
                <HelpCircle size={14} color={vendorTheme.colors.textMuted} />
                <Text style={styles.infoHintText}>
                  Your query will be submitted to the Bansal Geo Tender Evaluation Committee. Official responses are broadcast to all prospective bidders before bid opening.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                onPress={() => setAskModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitClarification}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnText}>Submit Inquiry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 37, 69, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: vendorTheme.colors.surface,
    borderTopLeftRadius: vendorTheme.radius.xl,
    borderTopRightRadius: vendorTheme.radius.xl,
    maxHeight: '88%',
    ...vendorTheme.shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: vendorTheme.colors.sandstoneBorder,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
    letterSpacing: -0.2,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: vendorTheme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: vendorTheme.colors.sandstoneDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    padding: 18,
    gap: 12,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: vendorTheme.colors.textSecondary,
    letterSpacing: 0.6,
  },
  textInput: {
    backgroundColor: vendorTheme.colors.sandstone,
    borderWidth: 1.2,
    borderColor: vendorTheme.colors.sandstoneBorderDark,
    borderRadius: vendorTheme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
    color: vendorTheme.colors.graphite,
    minHeight: 48,
  },
  filesList: {
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fileName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: vendorTheme.colors.graphite,
  },
  addFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: vendorTheme.radius.md,
    borderWidth: 1.2,
    borderColor: vendorTheme.colors.sandstoneBorderDark,
    backgroundColor: vendorTheme.colors.sandstone,
    gap: 8,
    marginTop: 4,
  },
  addFileText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: vendorTheme.colors.navy,
  },
  ceilingNotice: {
    backgroundColor: '#f0fdfa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    marginBottom: 4,
  },
  ceilingNoticeText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: vendorTheme.colors.tealDark,
  },
  tdsPreviewCard: {
    backgroundColor: vendorTheme.colors.sandstone,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorderDark,
    marginVertical: 4,
  },
  tdsPreviewTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: vendorTheme.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  tdsPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  tdsPreviewLabel: {
    fontSize: 13,
    color: vendorTheme.colors.textSecondary,
    fontWeight: '500',
  },
  tdsPreviewVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: vendorTheme.colors.graphite,
  },
  tdsDivider: {
    height: 1,
    backgroundColor: vendorTheme.colors.sandstoneBorderDark,
    marginVertical: 8,
  },
  tdsPreviewTotalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  tdsPreviewTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: vendorTheme.colors.emerald,
  },
  infoHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    gap: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoHintText: {
    flex: 1,
    fontSize: 12.5,
    color: vendorTheme.colors.textSecondary,
    lineHeight: 18,
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: vendorTheme.colors.sandstoneBorder,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: vendorTheme.radius.md,
    borderWidth: 1.2,
    borderColor: vendorTheme.colors.sandstoneBorderDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vendorTheme.colors.sandstone,
  },
  cancelBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: vendorTheme.colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: vendorTheme.colors.navy,
    height: 50,
    borderRadius: vendorTheme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...vendorTheme.shadows.sm,
  },
  submitBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#ffffff',
  },
});
