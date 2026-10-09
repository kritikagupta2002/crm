import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Briefcase,
  Lock,
  Clock,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  IndianRupee,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react-native';
import { Tender, WorkOrder, SealedBid, WorkOrderStage } from '../../../types';
import { vendorTheme } from './vendorTheme';
import { tenderPhase } from '../../../constants/vendor';

export type WorkSubSection = 'active' | 'bids' | 'billing' | 'paid';

const STAGES: WorkOrderStage[] = [
  'Issued',
  'Started',
  'Delivered',
  'Billed',
  'Verified',
  'Paid',
];

interface VendorWorkTabProps {
  myWorkOrders: WorkOrder[];
  myBids: { tender: Tender; bid: SealedBid }[];
  vendorCode: string;
  vendorName: string;
  handleStartWork: (wo: WorkOrder) => void;
  handleOpenDelivery: (wo: WorkOrder) => void;
  handleOpenBilling: (wo: WorkOrder) => void;
  handleWithdrawBid: (tender: Tender) => void;
  navigation: any;
}

export const VendorWorkTab: React.FC<VendorWorkTabProps> = ({
  myWorkOrders,
  myBids,
  vendorCode,
  vendorName,
  handleStartWork,
  handleOpenDelivery,
  handleOpenBilling,
  handleWithdrawBid,
  navigation,
}) => {
  const [subSection, setSubSection] = useState<WorkSubSection>('active');

  const activeOrders = myWorkOrders.filter((w) =>
    ['Issued', 'Started', 'Delivered'].includes(w.currentStage)
  );

  const pendingBillingOrders = myWorkOrders.filter(
    (w) => w.currentStage === 'Delivered' || w.currentStage === 'Billed' || w.currentStage === 'Verified'
  );

  const paidOrders = myWorkOrders.filter((w) => w.currentStage === 'Paid');

  return (
    <View style={styles.container}>
      {/* 1. BIGGER SUBSECTION TAB CONTROLLER */}
      <View style={styles.subNavBar}>
        {[
          { key: 'active', label: `Active (${activeOrders.length})` },
          { key: 'bids', label: `My Bids (${myBids.length})` },
          { key: 'billing', label: `Billing (${pendingBillingOrders.length})` },
          { key: 'paid', label: `Paid (${paidOrders.length})` },
        ].map((tab) => {
          const isSelected = subSection === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setSubSection(tab.key as WorkSubSection)}
              style={[styles.subNavTab, isSelected && styles.subNavTabActive]}
            >
              <Text style={[styles.subNavText, isSelected && styles.subNavTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. ACTIVE ORDERS SUBSECTION (BIG & SPACIOUS) */}
      {subSection === 'active' && (
        <View style={styles.sectionBody}>
          {activeOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Briefcase size={36} color={vendorTheme.colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Active Field Contracts</Text>
              <Text style={styles.emptySub}>
                You currently have no field work orders in mobilization, execution, or delivery stages.
              </Text>
            </View>
          ) : (
            activeOrders.map((wo) => {
              const currentStageIdx = STAGES.indexOf(wo.currentStage);
              const contractVal = wo.contractValue || 0;
              const paidVal = wo.paidAmount || 0;

              return (
                <View key={wo.id} style={styles.woCard}>
                  {/* Card Header: WO Number, Stage Badge */}
                  <View style={styles.woCardHeader}>
                    <View style={styles.woHeaderLeft}>
                      <View style={styles.woNumberBadge}>
                        <Text style={styles.woNumberText}>{wo.woNumber || wo.id}</Text>
                      </View>
                      <Text style={styles.woProjectCode} numberOfLines={1}>
                        Ref: {wo.tenderId || 'Subcontract'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.stagePill,
                        wo.currentStage === 'Issued'
                          ? styles.stageIssued
                          : wo.currentStage === 'Started'
                          ? styles.stageStarted
                          : styles.stageDelivered,
                      ]}
                    >
                      <Text style={styles.stagePillText}>{wo.currentStage}</Text>
                    </View>
                  </View>

                  {/* Project Title & Scope (Large & Bold) */}
                  <Text style={styles.woProjectTitle}>{wo.projectTitle}</Text>
                  <Text style={styles.woScopeText} numberOfLines={2}>
                    {wo.work || wo.scopeOfWork || 'Geotechnical drilling and field testing operations'}
                  </Text>

                  {/* 6-Stage Timeline Visual Indicator (BIGGER DOTS & LABELS) */}
                  <View style={styles.lifecycleContainer}>
                    <Text style={styles.lifecycleTitle}>6-STAGE CONTRACT LIFECYCLE</Text>
                    <View style={styles.stepperRow}>
                      {STAGES.map((s, idx) => {
                        const isDone = idx < currentStageIdx;
                        const isCurrent = idx === currentStageIdx;

                        return (
                          <View key={s} style={styles.stepItem}>
                            <View
                              style={[
                                styles.stepDot,
                                isDone && styles.stepDotDone,
                                isCurrent && styles.stepDotCurrent,
                              ]}
                            >
                              {isDone ? (
                                <CheckCircle2 size={13} color="#ffffff" strokeWidth={3} />
                              ) : (
                                <Text
                                  style={[
                                    styles.stepDotNum,
                                    isCurrent && styles.stepDotNumCurrent,
                                  ]}
                                >
                                  {idx + 1}
                                </Text>
                              )}
                            </View>
                            <Text
                              style={[
                                styles.stepText,
                                isCurrent && styles.stepTextCurrent,
                                isDone && styles.stepTextDone,
                              ]}
                              numberOfLines={1}
                            >
                              {s}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Financials & Deadline Strip */}
                  <View style={styles.finStrip}>
                    <View style={styles.finCol}>
                      <Text style={styles.finLabel}>Contract Value</Text>
                      <Text style={styles.finVal}>₹{(contractVal / 100000).toFixed(2)}L</Text>
                    </View>
                    <View style={styles.finDiv} />
                    <View style={styles.finCol}>
                      <Text style={styles.finLabel}>Target Date</Text>
                      <Text style={styles.finVal}>{wo.dueOn || 'Active'}</Text>
                    </View>
                    <View style={styles.finDiv} />
                    <View style={styles.finCol}>
                      <Text style={styles.finLabel}>Issued On</Text>
                      <Text style={styles.finVal}>{wo.issuedOn || 'N/A'}</Text>
                    </View>
                  </View>

                  {/* Big Primary Action Buttons */}
                  <View style={styles.actionsRow}>
                    {wo.currentStage === 'Issued' && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleStartWork(wo)}
                        style={[styles.primaryActionBtn, { backgroundColor: vendorTheme.colors.navy }]}
                      >
                        <Text style={styles.primaryActionBtnText}>Confirm Mobilization / Start</Text>
                      </TouchableOpacity>
                    )}

                    {wo.currentStage === 'Started' && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleOpenDelivery(wo)}
                        style={[styles.primaryActionBtn, { backgroundColor: vendorTheme.colors.teal }]}
                      >
                        <Text style={styles.primaryActionBtnText}>Submit Field Delivery</Text>
                      </TouchableOpacity>
                    )}

                    {wo.currentStage === 'Delivered' && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleOpenBilling(wo)}
                        style={[styles.primaryActionBtn, { backgroundColor: vendorTheme.colors.emerald }]}
                      >
                        <Text style={styles.primaryActionBtnText}>Submit Milestone Bill</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('WorkOrderDetail', { woId: wo.id })}
                      style={styles.detailsBtn}
                    >
                      <Text style={styles.detailsBtnText}>Order Detail</Text>
                      <ChevronRight size={16} color={vendorTheme.colors.navy} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* 3. MY BIDS SUBSECTION (SEALED VAULT) */}
      {subSection === 'bids' && (
        <View style={styles.sectionBody}>
          <View style={styles.vaultNoticeCard}>
            <View style={styles.vaultNoticeHeader}>
              <Lock size={17} color={vendorTheme.colors.amberDark} />
              <Text style={styles.vaultNoticeTitle}>Escrow Dual-Key Vault Protection</Text>
            </View>
            <Text style={styles.vaultNoticeText}>
              Your submitted commercial quotations are encrypted. In compliance with strict fair-procurement rules, competitor bids and rankings remain confidential until the official opening date.
            </Text>
          </View>

          {myBids.length === 0 ? (
            <View style={styles.emptyCard}>
              <Lock size={36} color={vendorTheme.colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Active Bids</Text>
              <Text style={styles.emptySub}>
                You have not submitted sealed bids for any active tenders. Go to the Tenders tab to explore open notices.
              </Text>
            </View>
          ) : (
            myBids.map(({ tender, bid }) => {
              const phase = tenderPhase(tender);
              const isWithdrawn = bid.status === 'Withdrawn';

              return (
                <View key={bid.id} style={styles.bidCard}>
                  <View style={styles.bidCardHeader}>
                    <View style={styles.bidRefBox}>
                      <Text style={styles.bidRefText}>Bid Ref: {bid.id}</Text>
                    </View>
                    <View
                      style={[
                        styles.bidStatusBadge,
                        isWithdrawn ? styles.statusWithdrawn : styles.statusSealed,
                      ]}
                    >
                      {bid.isSealed && !isWithdrawn ? (
                        <Lock size={12} color={vendorTheme.colors.tealDark} />
                      ) : null}
                      <Text
                        style={isWithdrawn ? styles.statusWithdrawnText : styles.statusSealedText}
                      >
                        {isWithdrawn ? 'Withdrawn' : bid.status || 'Sealed in Escrow'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.bidTenderTitle}>{tender.title}</Text>
                  <Text style={styles.bidTenderMeta}>
                    Notice: {tender.tenderNo || tender.id} • Discipline: {tender.category || 'General'}
                  </Text>

                  <View style={styles.bidDetailStrip}>
                    <View style={styles.bidDetailCol}>
                      <Text style={styles.bidDetailLabel}>MY QUOTATION</Text>
                      <Text style={styles.bidDetailVal}>
                        {bid.bidAmount ? `₹${(bid.bidAmount / 100000).toFixed(2)}L` : 'Confidential'}
                      </Text>
                    </View>
                    <View style={styles.finDiv} />
                    <View style={styles.bidDetailCol}>
                      <Text style={styles.bidDetailLabel}>SUBMITTED ON</Text>
                      <Text style={styles.bidDetailVal}>
                        {bid.submissionDate || bid.submittedAt?.slice(0, 10) || 'Recent'}
                      </Text>
                    </View>
                    <View style={styles.finDiv} />
                    <View style={styles.bidDetailCol}>
                      <Text style={styles.bidDetailLabel}>TENDER PHASE</Text>
                      <Text style={styles.bidDetailVal}>{phase}</Text>
                    </View>
                  </View>

                  {/* Actions: Withdraw Bid (if tender open) or View Tender */}
                  <View style={styles.bidActionRow}>
                    {phase === 'Open' && !isWithdrawn && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleWithdrawBid(tender)}
                        style={styles.withdrawBtn}
                      >
                        <RotateCcw size={14} color={vendorTheme.colors.crimson} />
                        <Text style={styles.withdrawBtnText}>Withdraw Bid</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('TenderDetail', { tenderId: tender.id })}
                      style={styles.viewTenderBtn}
                    >
                      <Text style={styles.viewTenderBtnText}>View Tender Notice</Text>
                      <ChevronRight size={16} color={vendorTheme.colors.navy} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* 4. BILLING SUBSECTION */}
      {subSection === 'billing' && (
        <View style={styles.sectionBody}>
          {pendingBillingOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <FileSpreadsheet size={36} color={vendorTheme.colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Pending Invoices</Text>
              <Text style={styles.emptySub}>
                There are currently no subcontracts requiring milestone invoice submissions or verification.
              </Text>
            </View>
          ) : (
            pendingBillingOrders.map((wo) => {
              const contractVal = wo.contractValue || 0;
              const billedVal = wo.billedAmount || 0;
              const unbilledCeiling = Math.max(0, contractVal - billedVal);

              return (
                <View key={wo.id} style={styles.billingCard}>
                  <View style={styles.billingHeader}>
                    <Text style={styles.billingWoCode}>{wo.woNumber || wo.id}</Text>
                    <View style={styles.billingStageBadge}>
                      <Text style={styles.billingStageText}>{wo.currentStage}</Text>
                    </View>
                  </View>

                  <Text style={styles.billingProjectTitle}>{wo.projectTitle}</Text>

                  {/* Ceiling and Status */}
                  <View style={styles.billingFinGrid}>
                    <View style={styles.finCol}>
                      <Text style={styles.finLabel}>Total Contract</Text>
                      <Text style={styles.finVal}>₹{(contractVal / 100000).toFixed(2)}L</Text>
                    </View>
                    <View style={styles.finDiv} />
                    <View style={styles.finCol}>
                      <Text style={styles.finLabel}>Total Billed</Text>
                      <Text style={styles.finVal}>₹{(billedVal / 100000).toFixed(2)}L</Text>
                    </View>
                    <View style={styles.finDiv} />
                    <View style={styles.finCol}>
                      <Text style={styles.finLabel}>Remaining Ceiling</Text>
                      <Text style={[styles.finVal, { color: vendorTheme.colors.teal }]}>
                        ₹{(unbilledCeiling / 100000).toFixed(2)}L
                      </Text>
                    </View>
                  </View>

                  {wo.bill && (
                    <View style={styles.existingBillRow}>
                      <View style={styles.existingBillLeft}>
                        <FileCheck2 size={18} color={vendorTheme.colors.teal} />
                        <View style={{ marginLeft: 8 }}>
                          <Text style={styles.existingBillNo}>Invoice: {wo.bill.no}</Text>
                          <Text style={styles.existingBillDate}>Dated: {wo.bill.date}</Text>
                        </View>
                      </View>
                      <Text style={styles.existingBillAmount}>
                        ₹{wo.bill.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}

                  {/* Invoice action */}
                  <View style={styles.actionsRow}>
                    {wo.currentStage === 'Delivered' && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleOpenBilling(wo)}
                        style={[styles.primaryActionBtn, { backgroundColor: vendorTheme.colors.emerald }]}
                      >
                        <Text style={styles.primaryActionBtnText}>Submit Milestone Invoice</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('WorkOrderDetail', { woId: wo.id })}
                      style={styles.detailsBtn}
                    >
                      <Text style={styles.detailsBtnText}>Order Detail</Text>
                      <ChevronRight size={16} color={vendorTheme.colors.navy} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* 5. PAID & TDS REGISTER SUBSECTION */}
      {subSection === 'paid' && (
        <View style={styles.sectionBody}>
          {paidOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <IndianRupee size={36} color={vendorTheme.colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Disbursed Orders Yet</Text>
              <Text style={styles.emptySub}>
                Completed contracts with verified bank electronic disbursements and TDS vouchers will be archived here.
              </Text>
            </View>
          ) : (
            paidOrders.map((wo) => {
              const gross = wo.payment?.gross || wo.paidAmount || 0;
              const tdsAmount = wo.payment?.tds?.amount || Math.round(gross * 0.02);
              const netPaid = gross - tdsAmount;

              return (
                <View key={wo.id} style={styles.paidVoucherCard}>
                  <View style={styles.voucherTop}>
                    <View style={styles.voucherBadge}>
                      <Text style={styles.voucherBadgeText}>PAID VOUCHER</Text>
                    </View>
                    <Text style={styles.voucherDate}>{wo.payment?.on || 'Settled'}</Text>
                  </View>

                  <Text style={styles.voucherWoText}>{wo.woNumber || wo.id}</Text>
                  <Text style={styles.voucherProjectTitle}>{wo.projectTitle}</Text>

                  <View style={styles.voucherTable}>
                    <View style={styles.voucherRow}>
                      <Text style={styles.voucherRowLabel}>Gross Invoice Amount</Text>
                      <Text style={styles.voucherRowVal}>₹{gross.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.voucherRow}>
                      <Text style={styles.voucherRowLabel}>
                        Less: Statutory TDS (Sec 194C @ 2%)
                      </Text>
                      <Text style={[styles.voucherRowVal, { color: vendorTheme.colors.crimson }]}>
                        - ₹{tdsAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.voucherDivider} />

                    <View style={styles.voucherRow}>
                      <Text style={styles.voucherTotalLabel}>Net Remitted to Bank</Text>
                      <Text style={styles.voucherTotalVal}>₹{netPaid.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  <View style={styles.utrStrip}>
                    <CheckCircle2 size={16} color={vendorTheme.colors.emerald} />
                    <Text style={styles.utrText}>
                      Bank Transfer UTR: <Text style={styles.utrBold}>{wo.payment?.ref || 'NEFT-PROCESSED'}</Text>
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 28,
  },
  subNavBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: vendorTheme.radius.lg,
    padding: 4,
    marginBottom: 16,
  },
  subNavTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: vendorTheme.radius.md,
  },
  subNavTabActive: {
    backgroundColor: vendorTheme.colors.surface,
    ...vendorTheme.shadows.sm,
  },
  subNavText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: vendorTheme.colors.textMuted,
  },
  subNavTextActive: {
    color: vendorTheme.colors.navy,
    fontWeight: '800',
  },
  sectionBody: {
    gap: 14,
  },
  emptyCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    color: vendorTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },
  woCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    ...vendorTheme.shadows.md,
  },
  woCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  woHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  woNumberBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  woNumberText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  woProjectCode: {
    fontSize: 12,
    color: vendorTheme.colors.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  stagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stageIssued: {
    backgroundColor: '#e0e7ff',
  },
  stageStarted: {
    backgroundColor: '#ccfbf1',
  },
  stageDelivered: {
    backgroundColor: '#fef3c7',
  },
  stagePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  woProjectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginBottom: 4,
  },
  woScopeText: {
    fontSize: 12.5,
    color: vendorTheme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  lifecycleContainer: {
    backgroundColor: vendorTheme.colors.sandstone,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  lifecycleTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: vendorTheme.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotDone: {
    backgroundColor: vendorTheme.colors.emerald,
  },
  stepDotCurrent: {
    backgroundColor: vendorTheme.colors.navy,
    borderWidth: 2,
    borderColor: '#93c5fd',
  },
  stepDotNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  stepDotNumCurrent: {
    color: '#ffffff',
  },
  stepText: {
    fontSize: 10,
    color: vendorTheme.colors.textMuted,
    fontWeight: '600',
  },
  stepTextCurrent: {
    color: vendorTheme.colors.navy,
    fontWeight: '800',
  },
  stepTextDone: {
    color: vendorTheme.colors.emerald,
    fontWeight: '700',
  },
  finStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    marginBottom: 12,
  },
  finCol: {
    flex: 1,
    alignItems: 'center',
  },
  finDiv: {
    width: 1,
    height: 22,
    backgroundColor: vendorTheme.colors.sandstoneBorder,
  },
  finLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: vendorTheme.colors.textMuted,
    textTransform: 'uppercase',
  },
  finVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: vendorTheme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: vendorTheme.radius.sm,
    borderWidth: 1.5,
    borderColor: vendorTheme.colors.sandstoneBorderDark,
    gap: 3,
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: vendorTheme.colors.navy,
  },
  vaultNoticeCard: {
    backgroundColor: '#fffbeb',
    borderRadius: vendorTheme.radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },
  vaultNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  vaultNoticeTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: vendorTheme.colors.amberDark,
  },
  vaultNoticeText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 17,
  },
  bidCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    ...vendorTheme.shadows.md,
  },
  bidCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bidRefBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bidRefText: {
    fontSize: 12,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  bidStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  statusSealed: {
    backgroundColor: vendorTheme.colors.tealSubtle,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  statusSealedText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: vendorTheme.colors.tealDark,
  },
  statusWithdrawn: {
    backgroundColor: '#fee2e2',
  },
  statusWithdrawnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: vendorTheme.colors.crimson,
  },
  bidTenderTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginBottom: 3,
  },
  bidTenderMeta: {
    fontSize: 12,
    color: vendorTheme.colors.textMuted,
    marginBottom: 10,
  },
  bidDetailStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.sandstone,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  bidDetailCol: {
    flex: 1,
    alignItems: 'center',
  },
  bidDetailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: vendorTheme.colors.textMuted,
  },
  bidDetailVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginTop: 2,
  },
  bidActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  withdrawBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: vendorTheme.colors.crimson,
  },
  viewTenderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  viewTenderBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: vendorTheme.colors.navy,
  },
  billingCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    ...vendorTheme.shadows.md,
  },
  billingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billingWoCode: {
    fontSize: 13,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  billingStageBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  billingStageText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: vendorTheme.colors.amberDark,
  },
  billingProjectTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginBottom: 10,
  },
  billingFinGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.sandstone,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  existingBillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdfa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    marginBottom: 12,
  },
  existingBillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  existingBillNo: {
    fontSize: 12.5,
    fontWeight: '800',
    color: vendorTheme.colors.tealDark,
  },
  existingBillDate: {
    fontSize: 11,
    color: vendorTheme.colors.textMuted,
  },
  existingBillAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: vendorTheme.colors.graphite,
  },
  paidVoucherCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    ...vendorTheme.shadows.md,
  },
  voucherTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  voucherBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  voucherBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
  },
  voucherDate: {
    fontSize: 11.5,
    color: vendorTheme.colors.textMuted,
  },
  voucherWoText: {
    fontSize: 13,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  voucherProjectTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginBottom: 10,
  },
  voucherTable: {
    backgroundColor: vendorTheme.colors.sandstone,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  voucherRowLabel: {
    fontSize: 12.5,
    color: vendorTheme.colors.textSecondary,
    fontWeight: '500',
  },
  voucherRowVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
  },
  voucherDivider: {
    height: 1,
    backgroundColor: vendorTheme.colors.sandstoneBorder,
    marginVertical: 8,
  },
  voucherTotalLabel: {
    fontSize: 13.5,
    fontWeight: '900',
    color: vendorTheme.colors.navy,
  },
  voucherTotalVal: {
    fontSize: 15.5,
    fontWeight: '900',
    color: vendorTheme.colors.emerald,
  },
  utrStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  utrText: {
    fontSize: 12,
    color: '#065f46',
  },
  utrBold: {
    fontWeight: '800',
  },
});
