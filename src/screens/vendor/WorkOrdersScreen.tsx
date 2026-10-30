import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import {
  Search,
  ChevronRight,
  Calendar,
  ArrowUpRight,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Layers,
  X,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, EmptyState } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils';
import { formatDate } from '../../utils/date';
import { useCrm } from '../../context/CrmContext';
import { WorkOrder, WorkOrderStage } from '../../types';

interface WorkOrdersScreenProps {
  navigation: any;
}

const STAGES: ('All' | WorkOrderStage)[] = [
  'All',
  'Issued',
  'Started',
  'Delivered',
  'Billed',
  'Verified',
  'Paid',
];

export const WorkOrdersScreen: React.FC<WorkOrdersScreenProps> = ({ navigation }) => {
  const { workOrders } = useCrm();

  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('All');

  const totalContractVal = useMemo(() => {
    return workOrders.reduce((sum, wo) => sum + (wo.contractValue || wo.amount || 0), 0);
  }, [workOrders]);

  const totalPaidVal = useMemo(() => {
    return workOrders.reduce((sum, wo) => sum + (wo.paidAmount || (wo.payment ? wo.payment.gross : 0) || 0), 0);
  }, [workOrders]);

  const activeWorkCount = useMemo(() => {
    return workOrders.filter((wo) => wo.currentStage === 'Started' || wo.currentStage === 'Issued').length;
  }, [workOrders]);

  const needsReviewCount = useMemo(() => {
    return workOrders.filter(
      (wo) => wo.currentStage === 'Delivered' || wo.currentStage === 'Billed' || wo.currentStage === 'Verified'
    ).length;
  }, [workOrders]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: workOrders.length };
    STAGES.forEach((s) => {
      if (s !== 'All') {
        counts[s] = workOrders.filter((w) => w.currentStage === s).length;
      }
    });
    return counts;
  }, [workOrders]);

  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const q = search.trim().toLowerCase();
      const num = (wo.woNumber || wo.id || '').toLowerCase();
      const vendor = (wo.vendorName || wo.vendor || '').toLowerCase();
      const project = (wo.projectTitle || '').toLowerCase();
      const work = (wo.work || '').toLowerCase();

      const matchesSearch =
        !q ||
        num.includes(q) ||
        vendor.includes(q) ||
        project.includes(q) ||
        work.includes(q);

      const matchesStage = selectedStage === 'All' || wo.currentStage === selectedStage;
      return matchesSearch && matchesStage;
    });
  }, [workOrders, search, selectedStage]);

  const renderWorkOrderCard = useCallback(({ item }: { item: WorkOrder }) => {
    const contractVal = item.contractValue || item.amount || 0;
    const billedVal = item.billedAmount || (item.bill ? item.bill.amount : 0);
    const paidVal = item.paidAmount || (item.payment ? item.payment.gross : 0);

    const billedPct = contractVal > 0 ? Math.min(100, Math.round((billedVal / contractVal) * 100)) : 0;
    const paidPct = contractVal > 0 ? Math.min(100, Math.round((paidVal / contractVal) * 100)) : 0;

    let stageBadgeBg = '#edf1f3';
    let stageBadgeColor = '#4a5b68';
    let stageLabel: string = item.currentStage;

    switch (item.currentStage) {
      case 'Issued':
        stageBadgeBg = '#fcf0dc';
        stageBadgeColor = '#9a5f0c';
        stageLabel = 'ISSUED';
        break;
      case 'Started':
        stageBadgeBg = '#e6effa';
        stageBadgeColor = '#245a93';
        stageLabel = 'IN PROGRESS';
        break;
      case 'Delivered':
        stageBadgeBg = '#fcf0dc';
        stageBadgeColor = '#c27a12';
        stageLabel = 'DELIVERED';
        break;
      case 'Billed':
        stageBadgeBg = '#fbe5e4';
        stageBadgeColor = '#d24c47';
        stageLabel = 'BILLED';
        break;
      case 'Verified':
        stageBadgeBg = '#e8eef1';
        stageBadgeColor = '#34495a';
        stageLabel = 'VERIFIED';
        break;
      case 'Paid':
        stageBadgeBg = '#e3f4ec';
        stageBadgeColor = '#237a53';
        stageLabel = 'PAID';
        break;
    }

    const formattedDueDate = item.dueOn ? formatDate(item.dueOn) : '';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('WorkOrderDetail', { woId: item.id })}
        style={styles.cardWrapper}
      >
        <View style={styles.orderCard}>
          <View style={styles.cardTop}>
            <View style={styles.woIdWrap}>
              <View style={styles.woIdBadge}>
                <Text style={styles.woIdText}>{item.woNumber || item.id}</Text>
              </View>
              {formattedDueDate ? (
                <View style={styles.dueBadge}>
                  <Calendar size={11} color="#627079" style={{ marginRight: 4 }} />
                  <Text style={styles.dueDateText}>Due: {formattedDueDate}</Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.stageBadge, { backgroundColor: stageBadgeBg }]}>
              <Text style={[styles.stageBadgeText, { color: stageBadgeColor }]}>
                {stageLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.vendorName}>{item.vendorName || item.vendor}</Text>

          <View style={styles.projectLine}>
            <Building2 size={13} color="#0e4a52" style={{ marginRight: 5 }} />
            <Text style={styles.projectTitle} numberOfLines={1}>
              {item.projectTitle}
            </Text>
          </View>

          {item.work ? (
            <Text style={styles.workScopeText} numberOfLines={2}>
              {item.work}
            </Text>
          ) : null}

          <View style={styles.financialBentoBox}>
            <View style={styles.finCol}>
              <Text style={styles.finLabel}>CONTRACT</Text>
              <Text style={styles.finValue}>{formatCurrency(contractVal)}</Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.finCol}>
              <Text style={styles.finLabel}>BILLED ({billedPct}%)</Text>
              <Text style={styles.finValue}>{formatCurrency(billedVal)}</Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.finCol}>
              <Text style={[styles.finLabel, paidVal > 0 && { color: '#237a53' }]}>
                PAID ({paidPct}%)
              </Text>
              <Text style={[styles.finValue, paidVal > 0 && { color: '#237a53' }]}>
                {formatCurrency(paidVal)}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(5, paidPct || billedPct || 10)}%`,
                    backgroundColor: item.currentStage === 'Paid' ? '#2e9e6b' : '#2f6fb3',
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.statusNote}>
              {item.currentStage === 'Paid' && (
                <View style={[styles.milestonePill, styles.milestonePillGreen]}>
                  <CheckCircle2 size={13} color="#237a53" style={{ marginRight: 5 }} />
                  <Text style={[styles.milestonePillText, { color: '#237a53' }]}>
                    Fully disbursed & closed
                  </Text>
                </View>
              )}
              {item.currentStage === 'Started' && (
                <View style={[styles.milestonePill, styles.milestonePillBlue]}>
                  <Clock size={13} color="#245a93" style={{ marginRight: 5 }} />
                  <Text style={[styles.milestonePillText, { color: '#245a93' }]}>
                    Work in progress in field
                  </Text>
                </View>
              )}
              {item.currentStage === 'Delivered' && (
                <View style={[styles.milestonePill, styles.milestonePillAmber]}>
                  <AlertTriangle size={13} color="#9a5f0c" style={{ marginRight: 5 }} />
                  <Text style={[styles.milestonePillText, { color: '#9a5f0c' }]}>
                    Delivered · Awaiting vendor bill
                  </Text>
                </View>
              )}
              {item.currentStage === 'Billed' && (
                <View style={[styles.milestonePill, styles.milestonePillRed]}>
                  <AlertTriangle size={13} color="#d24c47" style={{ marginRight: 5 }} />
                  <Text style={[styles.milestonePillText, { color: '#d24c47' }]}>
                    Invoiced · Needs 3-way reconciliation
                  </Text>
                </View>
              )}
              {item.currentStage === 'Verified' && (
                <View style={[styles.milestonePill, styles.milestonePillGreen]}>
                  <CheckCircle2 size={13} color="#237a53" style={{ marginRight: 5 }} />
                  <Text style={[styles.milestonePillText, { color: '#237a53' }]}>
                    Verified · Ready for payment release
                  </Text>
                </View>
              )}
              {item.currentStage === 'Issued' && (
                <View style={[styles.milestonePill, styles.milestonePillMuted]}>
                  <Clock size={13} color="#4a5b68" style={{ marginRight: 5 }} />
                  <Text style={[styles.milestonePillText, { color: '#4a5b68' }]}>
                    Issued · Awaiting contractor mobilization
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.arrowCircle}>
              <ChevronRight size={15} color="#2f6fb3" strokeWidth={2.4} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  return (
    <ScreenContainer
      scrollable={false}
      noPadding
      header={
        <AppHeader
          title="Subcontracts (Work Orders)"
          subtitle={`${workOrders.length} Executed Field Orders`}
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      <View style={styles.topControl}>
        <View style={styles.searchBar}>
          <Search size={17} color="#627079" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search by WO #, vendor, scope, project..."
            placeholderTextColor="#7c8b96"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color="#627079" />
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STAGES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.stageTabsList}
          renderItem={({ item: stage }) => {
            const isSelected = selectedStage === stage;
            const count = stageCounts[stage] || 0;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.stageChip, isSelected && styles.stageChipSelected]}
                onPress={() => setSelectedStage(stage)}
              >
                <Text style={[styles.stageChipText, isSelected && styles.stageChipTextSelected]}>
                  {stage} ({count})
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderWorkOrderCard}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, styles.kpiCardTotal]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxTotal]}>
                    <Layers size={16} color="#2f6fb3" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeTotal}>
                    <Text style={styles.kpiBadgeTextTotal}>{workOrders.length} Orders</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValText}>₹{(totalContractVal / 100000).toFixed(2)} L</Text>
                  <ArrowUpRight size={15} color="#2f6fb3" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Total Sanctioned</Text>
                <Text style={styles.kpiSubText}>Gross contract allocation</Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardPaid]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPaid]}>
                    <CheckCircle2 size={16} color="#2e9e6b" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgePaid}>
                    <Text style={styles.kpiBadgeTextPaid}>Settled</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValText, { color: '#2e9e6b' }]}>
                    ₹{(totalPaidVal / 100000).toFixed(2)} L
                  </Text>
                  <ArrowUpRight size={15} color="#2e9e6b" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Disbursed Paid</Text>
                <Text style={styles.kpiSubText}>Closed subcontract releases</Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, styles.kpiCardPending]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPending]}>
                    <Clock size={16} color="#b07d27" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgePending}>
                    <Text style={styles.kpiBadgeTextPending}>Live Work</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValText, { color: '#b07d27' }]}>{activeWorkCount}</Text>
                  <ArrowUpRight size={15} color="#b07d27" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Active Field Sites</Text>
                <Text style={styles.kpiSubText}>Drilling & pumping in progress</Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardActive]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxActive]}>
                    <FileText size={16} color="#3d5a6c" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeActive}>
                    <Text style={styles.kpiBadgeTextActive}>Audit Req</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValText}>{needsReviewCount}</Text>
                  <ArrowUpRight size={15} color="#3d5a6c" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Audit / 3-Way Match</Text>
                <Text style={styles.kpiSubText}>Delivered reports & bills</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Work Orders Found"
            message={
              search
                ? `No subcontract matches "${search}".`
                : `No work orders currently in "${selectedStage}" stage.`
            }
          />
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  topControl: {
    backgroundColor: '#ffffff',
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f3',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderColor: '#e1e8eb',
    height: 42,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13.5,
    color: '#0f2a3d',
    paddingVertical: 0,
  },
  stageTabsList: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 6,
  },
  stageChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e1e8eb',
  },
  stageChipSelected: {
    backgroundColor: '#1f6f78',
    borderColor: '#1f6f78',
  },
  stageChipText: {
    fontSize: 12,
    color: '#627079',
    fontWeight: '700',
  },
  stageChipTextSelected: {
    color: '#ffffff',
  },

  kpiGrid: {
    gap: 10,
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    shadowColor: '#0f2a3d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 124,
  },
  kpiCardTotal: {
    backgroundColor: '#f2f6fb',
    borderColor: '#e6effa',
  },
  kpiCardPending: {
    backgroundColor: '#fbf6ec',
    borderColor: '#ecd6ae',
  },
  kpiCardPaid: {
    backgroundColor: '#eef7f7',
    borderColor: '#ddefef',
  },
  kpiCardActive: {
    backgroundColor: '#f1f5f7',
    borderColor: '#e8eef1',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconBoxTotal: {
    backgroundColor: '#e6effa',
  },
  kpiIconBoxPending: {
    backgroundColor: '#f7ebd5',
  },
  kpiIconBoxPaid: {
    backgroundColor: '#e3f4ec',
  },
  kpiIconBoxActive: {
    backgroundColor: '#f1f5f7',
  },
  kpiBadgeTotal: {
    backgroundColor: '#e6effa',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextTotal: {
    color: '#2f6fb3',
    fontSize: 10,
    fontWeight: '700',
  },
  kpiBadgePending: {
    backgroundColor: '#fbe5e4',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextPending: {
    color: '#b07d27',
    fontSize: 10,
    fontWeight: '700',
  },
  kpiBadgePaid: {
    backgroundColor: '#e3f4ec',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextPaid: {
    color: '#2e9e6b',
    fontSize: 10,
    fontWeight: '700',
  },
  kpiBadgeActive: {
    backgroundColor: '#e8eef1',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextActive: {
    color: '#3d5a6c',
    fontSize: 10,
    fontWeight: '700',
  },
  kpiNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiValText: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 25,
    color: '#0f2a3d',
    letterSpacing: -0.5,
  },
  kpiTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f2a3d',
    letterSpacing: -0.2,
    marginBottom: 1,
  },
  kpiSubText: {
    fontSize: 11,
    color: '#627079',
    fontWeight: '600',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#e1e8eb',
    borderRadius: 18,
    ...shadows.xs,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  woIdWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  woIdBadge: {
    backgroundColor: '#eef7f7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddefef',
  },
  woIdText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0e4a52',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f7f8',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e1e8eb',
  },
  dueDateText: {
    fontSize: 10.5,
    color: '#627079',
    fontWeight: '700',
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  stageBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  vendorName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f2a3d',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  projectLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  projectTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0e4a52',
    flex: 1,
  },
  workScopeText: {
    fontSize: 12.5,
    color: '#627079',
    lineHeight: 17,
    marginBottom: 10,
  },

  financialBentoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f4f7f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8eb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  finCol: {
    flex: 1,
    alignItems: 'center',
  },
  finDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e1e8eb',
  },
  finLabel: {
    fontSize: 9.5,
    color: '#627079',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  finValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f2a3d',
    letterSpacing: -0.2,
  },

  progressContainer: {
    marginBottom: 10,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#e1e8eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  statusNote: {
    flex: 1,
  },
  milestonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  milestonePillGreen: {
    backgroundColor: '#e3f4ec',
  },
  milestonePillBlue: {
    backgroundColor: '#e6effa',
  },
  milestonePillAmber: {
    backgroundColor: '#fcf0dc',
  },
  milestonePillRed: {
    backgroundColor: '#fbe5e4',
  },
  milestonePillMuted: {
    backgroundColor: '#f4f7f8',
  },
  milestonePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e6effa',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
