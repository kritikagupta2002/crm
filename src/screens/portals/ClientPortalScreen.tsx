import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useCrm, useFinance, useAuth } from '../../context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button, EmptyState } from '../../components/common';
import { Project, Quote, Deliverable, FinanceInvoice } from '../../types';
import {
  Compass,
  FileText,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Receipt,
  CreditCard,
  Building,
  Clock,
  ArrowRight,
  Download,
  AlertCircle,
  QrCode,
  DollarSign,
  Layers,
} from 'lucide-react-native';
import { COMPANY_BANK_DETAILS } from '../../utils/payments';

type PortalTab = 'projects' | 'deliverables' | 'invoices' | 'payments';

export const ClientPortalScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { session, logout } = useAuth();
  const { projects, quotes } = useCrm();
  const { invoices } = useFinance();

  const [activeTab, setActiveTab] = useState<PortalTab>('projects');
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceInvoice | null>(null);

  const clientName = session?.accountType === 'client' ? (session as any).name : 'Mining Exploration Client';
  const clientEnquiryId = session?.accountType === 'client' ? (session as any).enquiryId : 'ENQ-2026-081';

  const clientProjects = projects;
  const clientQuotes = quotes;

  const allDeliverables = useMemo(() => {
    const list: (Deliverable & { projectTitle: string })[] = [];
    projects.forEach((p) => {
      (p.deliverables || []).forEach((d) => {
        list.push({ ...d, projectTitle: p.title });
      });
    });
    return list;
  }, [projects]);

  const clientInvoices = useMemo(() => {
    return invoices.filter(
      (inv) =>
        !clientName ||
        inv.clientName.toLowerCase().includes(clientName.toLowerCase()) ||
        inv.clientId === (session as any)?.clientId ||
        invoices.length <= 4
    );
  }, [invoices, clientName, session]);

  const clientPayments = useMemo(() => {
    return clientInvoices.filter(
      (inv) => inv.status === 'Paid' || inv.status === 'Partially Paid' || (inv.paidAmount && inv.paidAmount > 0)
    );
  }, [clientInvoices]);

  const handleApproveDeliverable = (delivTitle: string) => {
    Alert.alert(
      'Deliverable Approved',
      `You have electronically signed off on technical deliverable "${delivTitle}". Bansal Geo Project Lead notified.`,
      [{ text: 'OK' }]
    );
  };

  const handlePayInvoice = (inv: FinanceInvoice) => {
    Alert.alert(
      'Payment Remittance Instructions',
      `Invoice: ${inv.invoiceNo}\nAmount Due: ₹${inv.totalAmount.toLocaleString('en-IN')}\n\nBank: ${COMPANY_BANK_DETAILS.bankName}\nA/C: ${COMPANY_BANK_DETAILS.accountNumber}\nIFSC: ${COMPANY_BANK_DETAILS.ifscCode}\nUPI ID: ${COMPANY_BANK_DETAILS.upiId}\n\nPlease quote "${inv.invoiceNo}" in payment remarks.`,
      [{ text: 'Copy Details', onPress: () => Alert.alert('Copied', 'Bank details copied to clipboard.') }, { text: 'Done' }]
    );
  };

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title={clientName}
          subtitle={`Client Portal • Enquiry #${clientEnquiryId}`}
          showBack={false}
          rightAction={
            <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.75}>
              <LogOut size={16} color={colors.danger} />
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'projects' && styles.tabActive]}
          onPress={() => setActiveTab('projects')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, activeTab === 'projects' && styles.tabTextActive]}>
            Projects ({clientProjects.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'deliverables' && styles.tabActive]}
          onPress={() => setActiveTab('deliverables')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, activeTab === 'deliverables' && styles.tabTextActive]}>
            Deliverables ({allDeliverables.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'invoices' && styles.tabActive]}
          onPress={() => setActiveTab('invoices')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, activeTab === 'invoices' && styles.tabTextActive]}>
            Invoices ({clientInvoices.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
          onPress={() => setActiveTab('payments')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
            Payments ({clientPayments.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'projects' && (
          <>
            {clientProjects.length === 0 ? (
              <EmptyState
                title="No Active Projects"
                description="Your exploration projects will appear here once commissioned."
                icon={<Compass size={36} color={colors.textMuted} />}
              />
            ) : (
              clientProjects.map((p) => (
                <Card key={p.id} style={styles.portalCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.codeText}>{p.projectCode || p.id}</Text>
                    <StatusBadge status={`Stage ${p.currentStage || 1}`} size="sm" />
                  </View>

                  <Text style={styles.cardTitle}>{p.title}</Text>
                  <Text style={styles.subText}>{p.location} • {p.stageName || 'Field Exploration'}</Text>

                  <View style={styles.progressRow}>
                    <View style={styles.progLabelRow}>
                      <Text style={styles.progLabel}>Completion Progress</Text>
                      <Text style={styles.progPercent}>{Math.round(((p.currentStage || 1) / 7) * 100)}%</Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${((p.currentStage || 1) / 7) * 100}%` }]} />
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.metaFootText}>Authority: {p.authority || 'DMG Rajasthan'}</Text>
                    <Text style={styles.metaFootText}>{p.tasks?.length || 0} milestones</Text>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {activeTab === 'deliverables' && (
          <>
            {allDeliverables.length === 0 ? (
              <EmptyState
                title="No Deliverables Available"
                description="Technical reports, assay certificates, and drill logs will be uploaded here."
                icon={<FileText size={36} color={colors.textMuted} />}
              />
            ) : (
              allDeliverables.map((d) => (
                <Card key={d.id} style={styles.portalCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.codeText}>{d.version || 'v1.0'}</Text>
                    <StatusBadge status={d.status} size="sm" />
                  </View>

                  <Text style={styles.cardTitle}>{d.title}</Text>
                  <Text style={styles.subText}>{d.projectTitle}</Text>
                  <Text style={styles.fileMeta}>Document: {d.fileName} ({d.fileSize || '14.2 MB'})</Text>

                  {d.status === 'Submitted' ? (
                    <Button
                      title="Review & Sign Off Deliverable"
                      variant="primary"
                      size="sm"
                      icon={<ShieldCheck size={16} color="#ffffff" />}
                      onPress={() => handleApproveDeliverable(d.title)}
                      style={{ marginTop: spacing.sm }}
                    />
                  ) : (
                    <View style={styles.signedBadgeRow}>
                      <CheckCircle2 size={14} color={colors.success} />
                      <Text style={styles.signedText}>Deliverable Accepted & Signed Off</Text>
                    </View>
                  )}
                </Card>
              ))
            )}
          </>
        )}

        {activeTab === 'invoices' && (
          <>
            {clientInvoices.length === 0 ? (
              <EmptyState
                title="No Invoices Issued"
                description="Commercial tax invoices will be listed here upon project billing."
                icon={<Receipt size={36} color={colors.textMuted} />}
              />
            ) : (
              clientInvoices.map((inv) => {
                const isPaid = inv.status === 'Paid';
                const isOverdue = inv.status === 'Overdue' || (!isPaid && inv.dueDate < new Date().toISOString().split('T')[0]);
                const taxAmount = (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0);

                return (
                  <Card key={inv.id} style={styles.portalCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.invTitleCol}>
                        <Text style={styles.codeText}>{inv.invoiceNo}</Text>
                        <Text style={styles.invDateText}>Issued: {inv.date}</Text>
                      </View>
                      <StatusBadge status={isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Unpaid'} size="sm" />
                    </View>

                    <Text style={styles.cardTitle} numberOfLines={1}>{inv.projectTitle || 'Geological Exploration Services'}</Text>
                    <Text style={styles.subText}>Due Date: {inv.dueDate}</Text>

                    <View style={styles.invoiceBreakdownBox}>
                      <View style={styles.invRow}>
                        <Text style={styles.invLabel}>Taxable Base:</Text>
                        <Text style={styles.invVal}>₹{inv.baseAmount.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.invRow}>
                        <Text style={styles.invLabel}>GST (18%):</Text>
                        <Text style={styles.invVal}>+ ₹{taxAmount.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={[styles.invRow, styles.invTotalRow]}>
                        <Text style={styles.invTotalLabel}>Total Due:</Text>
                        <Text style={styles.invTotalVal}>₹{inv.totalAmount.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>

                    {!isPaid ? (
                      <View style={styles.invActionRow}>
                        <Button
                          title="Pay via UPI / RTGS"
                          variant="primary"
                          size="sm"
                          icon={<CreditCard size={15} color="#ffffff" />}
                          onPress={() => handlePayInvoice(inv)}
                          style={{ flex: 1 }}
                        />
                      </View>
                    ) : (
                      <View style={styles.signedBadgeRow}>
                        <CheckCircle2 size={14} color={colors.success} />
                        <Text style={styles.signedText}>Paid & Settled • Receipt Acknowledged</Text>
                      </View>
                    )}
                  </Card>
                );
              })
            )}
          </>
        )}

        {activeTab === 'payments' && (
          <>
            {clientPayments.length === 0 ? (
              <EmptyState
                title="No Remittance Records"
                description="Completed settlements and receipt confirmations will appear here."
                icon={<CreditCard size={36} color={colors.textMuted} />}
              />
            ) : (
              clientPayments.map((p) => (
                <Card key={`pay-${p.id}`} style={styles.portalCard}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.codeText}>{p.invoiceNo}</Text>
                      <Text style={styles.invDateText}>Paid on: {p.dueDate || p.date}</Text>
                    </View>
                    <StatusBadge status="Paid" size="sm" />
                  </View>

                  <View style={styles.paymentSummaryBox}>
                    <View style={styles.invRow}>
                      <Text style={styles.invLabel}>Gross Invoiced:</Text>
                      <Text style={styles.invVal}>₹{p.totalAmount.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.invRow}>
                      <Text style={styles.invLabel}>Remitted Amount:</Text>
                      <Text style={[styles.invVal, { color: colors.success, fontWeight: '700' }]}>
                        ₹{(p.paidAmount || p.totalAmount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.invRow}>
                      <Text style={styles.invLabel}>Payment Route:</Text>
                      <Text style={styles.invVal}>NEFT / Corporate NetBanking</Text>
                    </View>
                  </View>

                  <View style={styles.signedBadgeRow}>
                    <ShieldCheck size={14} color={colors.success} />
                    <Text style={styles.signedText}>Attested by Bansal Geo Accounts Department</Text>
                  </View>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.huge,
    gap: spacing.sm,
  },
  portalCard: {
    marginBottom: spacing.xs,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  invTitleCol: {
    flex: 1,
  },
  codeText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  invDateText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  progressRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  progLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  progPercent: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  track: {
    height: 6,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    marginTop: spacing.xs,
  },
  metaFootText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  fileMeta: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.xs,
  },
  signedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  signedText: {
    fontSize: typography.fontSizes.xs,
    color: colors.success,
    fontWeight: typography.fontWeights.semibold,
  },
  invoiceBreakdownBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    gap: 4,
  },
  paymentSummaryBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    gap: 4,
  },
  invRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  invVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  invTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: 4,
    marginTop: 2,
  },
  invTotalLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  invTotalVal: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primary,
  },
  invActionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
