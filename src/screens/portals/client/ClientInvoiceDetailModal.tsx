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
  Receipt,
  CreditCard,
  QrCode,
  CheckCircle2,
  Building2,
  Copy,
  Landmark,
  ShieldCheck,
  ArrowRight,
  Clock,
} from 'lucide-react-native';
import { clientTheme } from './clientTheme';
import { FinanceInvoice } from '../../../types';
import { COMPANY_BANK_DETAILS, generateInvoiceUpiLink } from '../../../utils/payments';

interface ClientInvoiceDetailModalProps {
  visible: boolean;
  invoice: FinanceInvoice | null;
  initialShowUpi?: boolean;
  clientCompanyName: string;
  clientGstin: string;
  clientAddress: string;
  onClose: () => void;
  onSettleUpi: (invoiceId: string, utrRef?: string) => Promise<void>;
}

export const ClientInvoiceDetailModal: React.FC<ClientInvoiceDetailModalProps> = ({
  visible,
  invoice,
  initialShowUpi = false,
  clientCompanyName,
  clientGstin,
  clientAddress,
  onClose,
  onSettleUpi,
}) => {
  if (!invoice) return null;

  const [showUpiSheet, setShowUpiSheet] = useState<boolean>(initialShowUpi);
  const [utrRef, setUtrRef] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isPaid = invoice.status === 'Paid';
  const taxTotal = (invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0);

  const handleCopyUpi = () => {
    Alert.alert('UPI ID Copied', `${COMPANY_BANK_DETAILS.upiId} copied to clipboard.`);
  };

  const handleConfirmPayment = async () => {
    try {
      setIsSubmitting(true);
      await onSettleUpi(invoice.id, utrRef.trim() || undefined);
      setShowUpiSheet(false);
      setUtrRef('');
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
              <View style={styles.taxPill}>
                <Text style={styles.taxPillText}>Tax Invoice</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  isPaid ? styles.statusBadgePaid : styles.statusBadgeUnpaid,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isPaid ? styles.statusBadgeTextPaid : styles.statusBadgeTextUnpaid,
                  ]}
                >
                  {invoice.status}
                </Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>{invoice.invoiceNo}</Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={clientTheme.colors.navy} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* 1. SELLER & BUYER CORPORATE DETAILS */}
          <View style={styles.sectionCard}>
            <View style={styles.partyRow}>
              {/* Seller */}
              <View style={styles.partyCol}>
                <Text style={styles.partyRoleLabel}>ISSUED BY (SUPPLIER)</Text>
                <Text style={styles.partyName}>{COMPANY_BANK_DETAILS.companyName}</Text>
                <Text style={styles.partyMeta}>GSTIN: {COMPANY_BANK_DETAILS.gstin}</Text>
                <Text style={styles.partyMeta}>PAN: {COMPANY_BANK_DETAILS.pan}</Text>
                <Text style={styles.partyMeta}>Jaipur, Rajasthan</Text>
              </View>

              <View style={styles.partyDivider} />

              {/* Buyer */}
              <View style={styles.partyCol}>
                <Text style={styles.partyRoleLabel}>BILLED TO (CLIENT)</Text>
                <Text style={styles.partyName}>{clientCompanyName}</Text>
                <Text style={styles.partyMeta}>GSTIN: {clientGstin}</Text>
                <Text style={styles.partyMeta} numberOfLines={2}>{clientAddress}</Text>
              </View>
            </View>
          </View>

          {/* 2. INVOICE META TIMELINE */}
          <View style={styles.metaStrip}>
            <View style={styles.metaStripCol}>
              <Text style={styles.metaStripLabel}>INVOICE DATE</Text>
              <Text style={styles.metaStripVal}>{invoice.date || invoice.invoiceDate}</Text>
            </View>
            <View style={styles.metaStripCol}>
              <Text style={styles.metaStripLabel}>DUE DATE</Text>
              <Text style={styles.metaStripVal}>{invoice.dueDate}</Text>
            </View>
            <View style={styles.metaStripCol}>
              <Text style={styles.metaStripLabel}>PAYMENT TERMS</Text>
              <Text style={styles.metaStripVal}>{invoice.paymentTerms || 'Net 30 Days'}</Text>
            </View>
          </View>

          {/* 3. LINE ITEMS TABLE */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Billed Exploration Deliverables</Text>

            {(invoice.items || [
              {
                id: 'def-1',
                description: 'Geological Field Investigation & Core Drilling',
                quantity: 1,
                unitRate: invoice.baseAmount || 1000000,
                amount: invoice.baseAmount || 1000000,
              },
            ]).map((item, idx) => (
              <View key={item.id || idx} style={styles.lineItemRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                  <Text style={styles.itemQty}>Qty: {item.quantity} × ₹{(item.unitRate || 0).toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.itemAmount}>₹{(item.amount || 0).toLocaleString('en-IN')}</Text>
              </View>
            ))}

            {/* GST Breakdown */}
            <View style={styles.taxSummaryBox}>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>Taxable Base Value:</Text>
                <Text style={styles.taxVal}>₹{(invoice.baseAmount || 0).toLocaleString('en-IN')}</Text>
              </View>

              {invoice.cgst ? (
                <>
                  <View style={styles.taxRow}>
                    <Text style={styles.taxLabel}>CGST @ 9%:</Text>
                    <Text style={styles.taxVal}>₹{invoice.cgst.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.taxRow}>
                    <Text style={styles.taxLabel}>SGST @ 9%:</Text>
                    <Text style={styles.taxVal}>₹{invoice.sgst.toLocaleString('en-IN')}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>IGST @ 18%:</Text>
                  <Text style={styles.taxVal}>₹{(invoice.igst || taxTotal).toLocaleString('en-IN')}</Text>
                </View>
              )}

              <View style={[styles.taxRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>TOTAL AMOUNT DUE:</Text>
                <Text style={styles.grandTotalVal}>₹{invoice.totalAmount.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* 4. INSTANT UPI PAYMENT OR SETTLEMENT RECEIPT */}
          {isPaid ? (
            <View style={styles.paidReceiptCard}>
              <CheckCircle2 size={24} color={clientTheme.colors.emerald} />
              <View style={{ flex: 1 }}>
                <Text style={styles.paidReceiptTitle}>Payment Settled in Full</Text>
                <Text style={styles.paidReceiptDesc}>
                  Remitted via Direct Electronic Transfer / Instant UPI. Attested Bank Voucher JV booked in Bansal Geo corporate accounts.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.paymentSectionCard}>
              <View style={styles.paymentSectionHeader}>
                <CreditCard size={18} color={clientTheme.colors.navy} />
                <Text style={styles.paymentSectionHeading}>Instant UPI / Bank Remittance</Text>
              </View>

              {!showUpiSheet ? (
                <TouchableOpacity
                  style={styles.openUpiBtn}
                  activeOpacity={0.8}
                  onPress={() => setShowUpiSheet(true)}
                >
                  <QrCode size={19} color="#ffffff" strokeWidth={2.4} />
                  <Text style={styles.openUpiBtnText}>Pay Now via Instant UPI QR</Text>
                  <ArrowRight size={18} color="#ffffff" />
                </TouchableOpacity>
              ) : (
                <View style={styles.upiContainer}>
                  {/* QR Graphic Box */}
                  <View style={styles.qrDisplayBox}>
                    <View style={styles.qrPatternBox}>
                      <QrCode size={90} color={clientTheme.colors.navy} />
                      <Text style={styles.qrScanText}>SCAN WITH ANY UPI APP</Text>
                    </View>

                    <Text style={styles.qrAmountText}>
                      ₹{invoice.totalAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {/* Bank & VPA Details */}
                  <View style={styles.vpaDetailsCard}>
                    <View style={styles.vpaRow}>
                      <Text style={styles.vpaLabel}>Corporate UPI ID:</Text>
                      <TouchableOpacity style={styles.copyRow} onPress={handleCopyUpi}>
                        <Text style={styles.vpaValMono}>{COMPANY_BANK_DETAILS.upiId}</Text>
                        <Copy size={13} color={clientTheme.colors.teal} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.vpaRow}>
                      <Text style={styles.vpaLabel}>Beneficiary Bank:</Text>
                      <Text style={styles.vpaVal}>{COMPANY_BANK_DETAILS.bankName}</Text>
                    </View>

                    <View style={styles.vpaRow}>
                      <Text style={styles.vpaLabel}>Account Number:</Text>
                      <Text style={styles.vpaValMono}>{COMPANY_BANK_DETAILS.accountNumber}</Text>
                    </View>

                    <View style={[styles.vpaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                      <Text style={styles.vpaLabel}>IFSC Code:</Text>
                      <Text style={styles.vpaValMono}>{COMPANY_BANK_DETAILS.ifscCode}</Text>
                    </View>
                  </View>

                  {/* UTR Confirmation Form */}
                  <View style={styles.confirmationBox}>
                    <Text style={styles.utrInputLabel}>TRANSACTION REFERENCE / UTR NO. (OPTIONAL)</Text>
                    <TextInput
                      style={styles.utrInput}
                      placeholder="e.g. UPI-2026-981245 or Bank Ref..."
                      placeholderTextColor={clientTheme.colors.textTertiary}
                      value={utrRef}
                      onChangeText={setUtrRef}
                      autoCapitalize="characters"
                    />

                    <TouchableOpacity
                      style={styles.confirmSettleBtn}
                      activeOpacity={0.8}
                      onPress={handleConfirmPayment}
                      disabled={isSubmitting}
                    >
                      <CheckCircle2 size={18} color="#ffffff" strokeWidth={2.4} />
                      <Text style={styles.confirmSettleBtnText}>
                        {isSubmitting ? 'Verifying Settlement...' : 'Confirm Payment Settlement'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
  taxPill: {
    backgroundColor: clientTheme.colors.navySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  taxPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgePaid: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  statusBadgeUnpaid: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadgeTextPaid: {
    color: clientTheme.colors.emerald,
  },
  statusBadgeTextUnpaid: {
    color: clientTheme.colors.goldDark,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: clientTheme.colors.sandstoneBorder,
  },
  partyRow: {
    flexDirection: 'row',
  },
  partyCol: {
    flex: 1,
  },
  partyDivider: {
    width: 1,
    backgroundColor: clientTheme.colors.sandstoneBorder,
    marginHorizontal: 12,
  },
  partyRoleLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: clientTheme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  partyName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    marginBottom: 3,
  },
  partyMeta: {
    fontSize: 11.5,
    color: clientTheme.colors.textSecondary,
    marginBottom: 2,
  },
  metaStrip: {
    flexDirection: 'row',
    backgroundColor: clientTheme.colors.sandstone,
    borderRadius: clientTheme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
  },
  metaStripCol: {
    flex: 1,
  },
  metaStripLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: clientTheme.colors.textMuted,
    marginBottom: 3,
  },
  metaStripVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: clientTheme.colors.graphite,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemDesc: {
    fontSize: 13.5,
    fontWeight: '700',
    color: clientTheme.colors.graphite,
  },
  itemQty: {
    fontSize: 11.5,
    color: clientTheme.colors.textMuted,
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  taxSummaryBox: {
    backgroundColor: clientTheme.colors.sandstone,
    padding: 12,
    borderRadius: clientTheme.radius.sm,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
    marginTop: 12,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  taxLabel: {
    fontSize: 12.5,
    color: clientTheme.colors.textMuted,
  },
  taxVal: {
    fontSize: 13,
    fontWeight: '700',
    color: clientTheme.colors.graphite,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: clientTheme.colors.sandstoneBorderDark,
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  grandTotalLabel: {
    fontSize: 13.5,
    fontWeight: '900',
    color: clientTheme.colors.navy,
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: clientTheme.colors.navy,
  },
  paymentSectionCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    ...clientTheme.shadows.md,
  },
  paymentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  paymentSectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  openUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: clientTheme.colors.navy,
    height: 50,
    borderRadius: clientTheme.radius.md,
    gap: 10,
    ...clientTheme.shadows.sm,
  },
  openUpiBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  upiContainer: {
    gap: 12,
  },
  qrDisplayBox: {
    backgroundColor: '#f8fafc',
    borderRadius: clientTheme.radius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrPatternBox: {
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrScanText: {
    fontSize: 10,
    fontWeight: '800',
    color: clientTheme.colors.textMuted,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  qrAmountText: {
    fontSize: 22,
    fontWeight: '900',
    color: clientTheme.colors.navy,
  },
  vpaDetailsCard: {
    backgroundColor: clientTheme.colors.sandstone,
    padding: 12,
    borderRadius: clientTheme.radius.sm,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
  },
  vpaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: clientTheme.colors.sandstoneBorder,
  },
  vpaLabel: {
    fontSize: 12,
    color: clientTheme.colors.textMuted,
  },
  vpaVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: clientTheme.colors.graphite,
  },
  vpaValMono: {
    fontSize: 12.5,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confirmationBox: {
    marginTop: 4,
  },
  utrInputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: clientTheme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  utrInput: {
    backgroundColor: clientTheme.colors.sandstone,
    borderWidth: 1.2,
    borderColor: clientTheme.colors.sandstoneBorderDark,
    borderRadius: clientTheme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: clientTheme.colors.graphite,
    marginBottom: 10,
  },
  confirmSettleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: clientTheme.colors.emerald,
    height: 50,
    borderRadius: clientTheme.radius.md,
    gap: 8,
    ...clientTheme.shadows.sm,
  },
  confirmSettleBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  paidReceiptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: clientTheme.radius.lg,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 12,
  },
  paidReceiptTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: clientTheme.colors.emeraldDark,
  },
  paidReceiptDesc: {
    fontSize: 12.5,
    color: '#065f46',
    marginTop: 2,
    lineHeight: 17,
  },
});
