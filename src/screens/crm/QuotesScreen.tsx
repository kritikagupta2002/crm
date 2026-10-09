import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Percent,
  X,
  Send,
  MessageCircle,
  FileEdit,
  XCircle,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react-native';
import {
  ScreenContainer,
  AppHeader,
  Card,
  StatusBadge,
  Input,
  StatCard,
  EmptyState,
} from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { Quote, Lead } from '../../types';

interface QuotesScreenProps {
  navigation: any;
  route?: any;
}

const TABS = ['All', 'Sent', 'Revised', 'Changes requested', 'Accepted', 'Rejected', 'Expired'] as const;
type TabType = typeof TABS[number];

const formatINR = (n: number) => {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

const fullINR = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

export const QuotesScreen: React.FC<QuotesScreenProps> = ({ navigation, route }) => {
  const { leads, acceptQuotation, rejectQuotation } = useCrm();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [search, setSearch] = useState('');
  const [selectedQuoteLead, setSelectedQuoteLead] = useState<{ lead: Lead; quote: any } | null>(null);
  const [rejectingLeadId, setRejectingLeadId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Price too high');
  const [actionLoading, setActionLoading] = useState(false);

  const unifiedQuotes = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const items: Array<{ lead: Lead; quote: any }> = [];

    leads.forEach((l) => {
      if (l.quote || l.quoteValue) {
        const base = l.quote || {
          version: l.quoteStatus === 'Revised' || l.stage === 'Negotiation' ? 2 : 1,
          items: [
            { description: l.serviceDetail || l.title, qty: 1, rate: Math.round((l.quoteValue || l.estimatedValue) * 0.65) },
            { description: 'Field survey & site visits', qty: 1, rate: Math.round((l.quoteValue || l.estimatedValue) * 0.25) },
            { description: 'Report preparation & submission', qty: 1, rate: Math.round((l.quoteValue || l.estimatedValue) * 0.1) },
          ],
          discountPct: 0,
          gstPct: 18,
          validDays: 30,
          sentOn: l.createdAt ? l.createdAt.split('T')[0] : today,
        };

        const gross = base.items.reduce((s: number, it: any) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
        const discount = Math.round((gross * (base.discountPct || 0)) / 100);
        const net = gross - discount;
        const gst = Math.round((net * (base.gstPct || 18)) / 100);
        const total = net + gst;

        const sentDate = new Date(base.sentOn);
        const validDate = new Date(sentDate.getTime() + (base.validDays || 30) * 86400000);
        const validUntil = validDate.toISOString().split('T')[0];

        const status = l.quoteStatus || 'Sent';
        const isExpired = (status === 'Sent' || status === 'Revised') && validUntil < today;
        const displayStatus = isExpired ? 'Expired' : status;

        items.push({
          lead: l,
          quote: {
            ...base,
            number: `QT-${l.id.replace('BG-', '')}${base.version > 1 ? `-R${base.version - 1}` : ''}`,
            validUntil,
            status,
            displayStatus,
            gross,
            discount,
            net,
            gst,
            total: l.quoteValue || total,
          },
        });
      }
    });

    return items.sort((a, b) => (b.quote.sentOn || '').localeCompare(a.quote.sentOn || ''));
  }, [leads]);

  const metrics = useMemo(() => {
    const openList = unifiedQuotes.filter(
      (r) => r.quote.status === 'Sent' || r.quote.status === 'Revised' || r.quote.status === 'Changes requested'
    );
    const accepted = unifiedQuotes.filter((r) => r.quote.status === 'Accepted');
    const rejected = unifiedQuotes.filter((r) => r.quote.status === 'Rejected');
    const expired = unifiedQuotes.filter((r) => r.quote.displayStatus === 'Expired');
    const decided = accepted.length + rejected.length;
    const rate = decided > 0 ? Math.round((accepted.length / decided) * 100) : 0;
    const awaiting = openList.reduce((s, r) => s + r.quote.total, 0);
    const accSum = accepted.reduce((s, r) => s + r.quote.total, 0);

    return {
      openQuotesList: openList,
      acceptedQuotes: accepted,
      rejectedQuotes: rejected,
      expiredQuotes: expired,
      decidedCount: decided,
      acceptanceRate: rate,
      awaitingSum: awaiting,
      acceptedSum: accSum,
    };
  }, [unifiedQuotes]);

  const { openQuotesList, acceptedQuotes, rejectedQuotes, expiredQuotes, decidedCount, acceptanceRate, awaitingSum, acceptedSum } = metrics;

  const visibleQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return unifiedQuotes.filter((r) => {
      const matchesTab = activeTab === 'All' || r.quote.displayStatus === activeTab;
      const matchesSearch =
        !q ||
        r.quote.number.toLowerCase().includes(q) ||
        r.lead.company.toLowerCase().includes(q) ||
        (r.lead.serviceDetail || '').toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [unifiedQuotes, activeTab, search]);

  const handleShareWhatsApp = (lead: Lead, quote: any) => {
    if (!lead.phone) {
      Alert.alert('No Phone', 'No contact phone number recorded for this lead.');
      return;
    }
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const phoneNo = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Dear ${lead.contactPerson || 'Client'}, please find our quotation ${quote.number} for ${lead.serviceDetail || lead.title}: ${fullINR(quote.total)} including GST, valid till ${quote.validUntil}. — Bansal Geo Solutions Pvt. Ltd.`;
    const url = `whatsapp://send?phone=${phoneNo}&text=${encodeURIComponent(msg)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('WhatsApp Not Available', 'Could not open WhatsApp on this device.');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to initiate WhatsApp chat.');
      });
  };

  const handleAcceptQuote = useCallback(async (leadId: string) => {
    setActionLoading(true);
    try {
      await acceptQuotation(leadId);
      Alert.alert(
        'Quotation Accepted',
        'Quotation marked Accepted! The lead is now ready for Client Approval (PO, Advance & Agreement).',
        [
          {
            text: 'Go to Approvals',
            onPress: () => {
              setSelectedQuoteLead(null);
              navigation.navigate('ClientApprovals');
            },
          },
          { text: 'Dismiss', onPress: () => setSelectedQuoteLead(null) },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  }, [acceptQuotation, navigation]);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingLeadId) return;
    setActionLoading(true);
    try {
      await rejectQuotation(rejectingLeadId, rejectReason);
      Alert.alert('Quotation Rejected', 'Quotation marked as Rejected and lead archived as Lost.');
      setRejectingLeadId(null);
      setSelectedQuoteLead(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  }, [rejectingLeadId, rejectReason, rejectQuotation]);

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="Quotations & Proposals"
          subtitle={`${unifiedQuotes.length} quotes · ${formatINR(awaitingSum)} awaiting decision`}
          showBack
          onBack={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('QuoteBuilder')}
            >
              <Plus size={20} color={colors.textInverse} />
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={styles.metricsStrip}>
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>{openQuotesList.length}</Text>
          <Text style={styles.metricLbl}>Awaiting</Text>
          <Text style={styles.metricSub}>{formatINR(awaitingSum)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, { color: colors.success }]}>{acceptedQuotes.length}</Text>
          <Text style={styles.metricLbl}>Accepted</Text>
          <Text style={styles.metricSub}>{formatINR(acceptedSum)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, { color: colors.warning }]}>{acceptanceRate}%</Text>
          <Text style={styles.metricLbl}>Win Rate</Text>
          <Text style={styles.metricSub}>{acceptedQuotes.length}/{decidedCount}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, { color: expiredQuotes.length > 0 ? colors.danger : colors.textMuted }]}>{expiredQuotes.length}</Text>
          <Text style={styles.metricLbl}>Expired</Text>
          <Text style={styles.metricSub}>Past valid</Text>
        </View>
      </View>

      <Input
        placeholder="Search quotation no., client or service..."
        value={search}
        onChangeText={setSearch}
        leftIcon={<Search size={16} color={colors.textMuted} />}
        containerStyle={styles.searchBar}
      />

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {TABS.map((t) => {
            const isSel = activeTab === t;
            const count =
              t === 'All'
                ? unifiedQuotes.length
                : unifiedQuotes.filter((r) => r.quote.displayStatus === t).length;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setActiveTab(t)}
                style={[styles.tabChip, isSel && styles.tabChipActive]}
              >
                <Text style={[styles.tabChipText, isSel && styles.tabChipTextActive]}>
                  {t}
                </Text>
                <View style={[styles.tabBadge, isSel && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isSel && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {visibleQuotes.length === 0 ? (
        <EmptyState
          title="No Quotations Found"
          description={
            search
              ? 'No quotation matches your search query.'
              : `No quotations under status "${activeTab}".`
          }
          icon={<FileText size={48} color={colors.textMuted} />}
          actionLabel="Create Quotation"
          onAction={() => navigation.navigate('QuoteBuilder')}
        />
      ) : (
        <FlatList
          data={visibleQuotes}
          keyExtractor={(item) => `${item.lead.id}-${item.quote.number}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const { lead, quote } = item;
            return (
              <Card
                style={styles.quoteCard}
                onPress={() => setSelectedQuoteLead(item)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.quoteNoCol}>
                    <Text style={styles.quoteNo}>{quote.number}</Text>
                    <Text style={styles.versionText}>v{quote.version}</Text>
                  </View>
                  <StatusBadge status={quote.displayStatus} size="sm" />
                </View>

                <Text style={styles.clientName}>{lead.company}</Text>
                <Text style={styles.serviceName} numberOfLines={1}>
                  {lead.serviceDetail || lead.title}
                </Text>

                <View style={styles.datesRow}>
                  <Text style={styles.dateLabel}>
                    Sent: <Text style={styles.dateVal}>{quote.sentOn}</Text>
                  </Text>
                  <Text style={[styles.dateLabel, quote.displayStatus === 'Expired' && styles.expiredDate]}>
                    Valid: <Text style={styles.dateVal}>{quote.validUntil}</Text>
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.amtLabel}>Amount (incl. 18% GST)</Text>
                    <Text style={styles.amtValue}>{fullINR(quote.total)}</Text>
                  </View>
                  <View style={styles.viewRow}>
                    <Text style={styles.viewText}>View Quotation</Text>
                    <ArrowRight size={14} color={colors.primary} />
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}

      {selectedQuoteLead && (
        <Modal
          visible={Boolean(selectedQuoteLead)}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedQuoteLead(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleCol}>
                  <Text style={styles.modalTitle}>{selectedQuoteLead.quote.number}</Text>
                  <Text style={styles.modalSub}>
                    {selectedQuoteLead.lead.company} · {selectedQuoteLead.lead.id}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedQuoteLead(null)}
                  style={styles.closeBtn}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalStatusRow}>
                  <StatusBadge status={selectedQuoteLead.quote.displayStatus} />
                  <Text style={styles.modalMetaText}>
                    Valid until {selectedQuoteLead.quote.validUntil}
                  </Text>
                </View>

                {selectedQuoteLead.quote.status === 'Changes requested' && (
                  <View style={styles.changesBanner}>
                    <AlertCircle size={16} color={colors.warningText} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.changesTitle}>Client Requested Changes</Text>
                      <Text style={styles.changesDesc}>
                        {selectedQuoteLead.lead.changeRequest?.text ||
                          'Client requested commercial revisions or scope adjustments.'}
                      </Text>
                    </View>
                  </View>
                )}

                <Text style={styles.sheetSectionTitle}>Itemized Scope & Technical Rates</Text>
                <View style={styles.tableCard}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.thText, { flex: 2 }]}>Service / Deliverable</Text>
                    <Text style={[styles.thText, { flex: 0.8, textAlign: 'center' }]}>Qty</Text>
                    <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>Rate (₹)</Text>
                    <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>Total (₹)</Text>
                  </View>

                  {selectedQuoteLead.quote.items?.map((it: any, idx: number) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tdText, { flex: 2 }]} numberOfLines={2}>
                        {it.description}
                      </Text>
                      <Text style={[styles.tdText, { flex: 0.8, textAlign: 'center' }]}>
                        {it.qty}
                      </Text>
                      <Text style={[styles.tdText, { flex: 1.2, textAlign: 'right' }]}>
                        {formatINR(Number(it.rate) || 0).replace('₹', '')}
                      </Text>
                      <Text style={[styles.tdTextBold, { flex: 1.2, textAlign: 'right' }]}>
                        {formatINR((Number(it.qty) || 0) * (Number(it.rate) || 0)).replace('₹', '')}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.breakdownCard}>
                  <View style={styles.sumRow}>
                    <Text style={styles.sumLabel}>Gross Subtotal:</Text>
                    <Text style={styles.sumVal}>{fullINR(selectedQuoteLead.quote.gross)}</Text>
                  </View>
                  {selectedQuoteLead.quote.discount > 0 && (
                    <View style={styles.sumRow}>
                      <Text style={[styles.sumLabel, { color: colors.warningText }]}>
                        Discount ({selectedQuoteLead.quote.discountPct || 0}%):
                      </Text>
                      <Text style={[styles.sumVal, { color: colors.warningText }]}>
                        - {fullINR(selectedQuoteLead.quote.discount)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.sumRow}>
                    <Text style={styles.sumLabel}>Taxable Net Amount:</Text>
                    <Text style={styles.sumVal}>{fullINR(selectedQuoteLead.quote.net)}</Text>
                  </View>
                  <View style={styles.sumRow}>
                    <Text style={styles.sumLabel}>Standard GST (18%):</Text>
                    <Text style={styles.sumVal}>+ {fullINR(selectedQuoteLead.quote.gst)}</Text>
                  </View>
                  <View style={[styles.sumRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalLabel}>Grand Total (incl. GST):</Text>
                    <Text style={styles.grandTotalVal}>{fullINR(selectedQuoteLead.quote.total)}</Text>
                  </View>
                </View>

                <View style={styles.termsBox}>
                  <Text style={styles.termsTitle}>Commercial Terms</Text>
                  <Text style={styles.termsText}>
                    50% advance with work order, balance on submission of final report. Government fees
                    and site travel beyond 100 km billed at actuals.
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={() =>
                    handleShareWhatsApp(selectedQuoteLead.lead, selectedQuoteLead.quote)
                  }
                >
                  <MessageCircle size={18} color="#fff" />
                  <Text style={styles.waBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reviseBtn}
                  onPress={() => {
                    const lId = selectedQuoteLead.lead.id;
                    setSelectedQuoteLead(null);
                    navigation.navigate('QuoteBuilder', { leadId: lId, isRevision: true });
                  }}
                >
                  <FileEdit size={16} color={colors.textPrimary} />
                  <Text style={styles.reviseBtnText}>Revise</Text>
                </TouchableOpacity>

                {selectedQuoteLead.quote.status !== 'Accepted' &&
                  selectedQuoteLead.quote.status !== 'Rejected' && (
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => setRejectingLeadId(selectedQuoteLead.lead.id)}
                    >
                      <XCircle size={16} color={colors.danger} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  )}

                {selectedQuoteLead.quote.status !== 'Accepted' && (
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAcceptQuote(selectedQuoteLead.lead.id)}
                  >
                    <CheckCircle size={16} color="#fff" />
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                )}

                {selectedQuoteLead.quote.status === 'Accepted' &&
                  selectedQuoteLead.lead.stage !== 'Won' && (
                    <TouchableOpacity
                      style={styles.workflowBtn}
                      onPress={() => {
                        setSelectedQuoteLead(null);
                        navigation.navigate('ClientApprovals');
                      }}
                    >
                      <Text style={styles.workflowBtnText}>Go to Client Approvals &rarr;</Text>
                    </TouchableOpacity>
                  )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {rejectingLeadId && (
        <Modal
          visible={Boolean(rejectingLeadId)}
          transparent
          animationType="fade"
          onRequestClose={() => setRejectingLeadId(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dialogCard}>
              <Text style={styles.dialogTitle}>Mark Quotation as Rejected</Text>
              <Text style={styles.dialogDesc}>
                Select the primary reason for client rejection. This will mark the quotation Rejected and the enquiry as Lost.
              </Text>

              {['Price too high', 'Competitor selected', 'Project delayed / cancelled', 'Terms not acceptable'].map(
                (reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonRow, rejectReason === reason && styles.reasonRowSelected]}
                    onPress={() => setRejectReason(reason)}
                  >
                    <View
                      style={[styles.radioDot, rejectReason === reason && styles.radioDotSelected]}
                    />
                    <Text style={styles.reasonText}>{reason}</Text>
                  </TouchableOpacity>
                )
              )}

              <View style={styles.dialogBtnRow}>
                <TouchableOpacity
                  style={styles.dialogCancelBtn}
                  onPress={() => setRejectingLeadId(null)}
                >
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dialogConfirmBtn}
                  onPress={handleConfirmReject}
                >
                  <Text style={styles.dialogConfirmText}>Confirm Rejection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  metricSub: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
  },
  searchBar: {
    marginBottom: spacing.xs,
  },
  tabsWrap: {
    marginBottom: spacing.xs,
  },
  tabsContent: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: 6,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  tabChipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
  },
  tabBadge: {
    backgroundColor: colors.borderMedium,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.bold,
  },
  tabBadgeTextActive: {
    color: colors.textInverse,
  },
  listContent: {
    paddingBottom: spacing.huge,
  },
  quoteCard: {
    marginBottom: spacing.md,
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: spacing.md + 2,
    ...shadows.xs,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quoteNoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quoteNo: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  versionText: {
    fontSize: 11,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    fontWeight: '600',
  },
  clientName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 4,
    lineHeight: 20,
  },
  serviceName: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 8,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  dateVal: {
    color: '#0f172a',
    fontWeight: '700',
  },
  expiredDate: {
    color: colors.danger,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  amtLabel: {
    fontSize: 9.5,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  amtValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  viewText: {
    fontSize: 11.5,
    color: colors.primary,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
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
  modalTitleCol: {
    flex: 1,
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
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
  modalStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalMetaText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  changesBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningBg,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warningLight,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  changesTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.warningText,
  },
  changesDesc: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textPrimary,
    marginTop: 2,
  },
  sheetSectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  tableCard: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  thText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: 'center',
  },
  tdText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
  },
  tdTextBold: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  breakdownCard: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    gap: 4,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sumLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  sumVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  grandTotalVal: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primary,
  },
  termsBox: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  termsTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  termsText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.xs,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  waBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#fff',
  },
  reviseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  reviseBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.dangerBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dangerLight,
  },
  rejectBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.dangerText,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
  },
  acceptBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#fff',
  },
  workflowBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
  },
  workflowBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#fff',
  },

  dialogCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  dialogTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dialogDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 6,
    gap: spacing.sm,
  },
  reasonRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.borderMedium,
  },
  radioDotSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  reasonText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
  },
  dialogBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dialogCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dialogCancelText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  dialogConfirmBtn: {
    backgroundColor: colors.danger,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
  },
  dialogConfirmText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#fff',
  },
});
