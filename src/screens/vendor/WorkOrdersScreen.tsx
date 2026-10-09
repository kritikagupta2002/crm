import React, { useState, useMemo } from 'react';
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

  // 1. Bento KPI Aggregations
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

  // 2. Filtered list
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

  const renderWorkOrderCard = ({ item }: { item: WorkOrder }) => {
    const contractVal = item.contractValue || item.amount || 0;
    const billedVal = item.billedAmount || (item.bill ? item.bill.amount : 0);
    const paidVal = item.paidAmount || (item.payment ? item.payment.gross : 0);

    const billedPct = contractVal > 0 ? Math.min(100, Math.round((billedVal / contractVal) * 100)) : 0;
    const paidPct = contractVal > 0 ? Math.min(100, Math.round((paidVal / contractVal) * 100)) : 0;

    let stageBadgeBg = '#f1f5f9';
    let stageBadgeColor = '#475569';
    let stageLabel: string = item.currentStage;

    switch (item.currentStage) {
      case 'Issued':
        stageBadgeBg = '#fef3c7';
        stageBadgeColor = '#b45309';
        stageLabel = 'ISSUED';
        break;
      case 'Started':
        stageBadgeBg = '#dbeafe';
        stageBadgeColor = '#1d4ed8';
        stageLabel = 'IN PROGRESS';
        break;
      case 'Delivered':
        stageBadgeBg = '#fef3c7';
        stageBadgeColor = '#d97706';
        stageLabel = 'DELIVERED';
        break;
      case 'Billed':
        stageBadgeBg = '#fee2e2';
        stageBadgeColor = '#dc2626';
        stageLabel = 'BILLED';
        break;
      case 'Verified':
        stageBadgeBg = '#f3e8ff';
        stageBadgeColor = '#7e22ce';
        stageLabel = 'VERIFIED';
        break;
      case 'Paid':
        stageBadgeBg = '#dcfce7';
        stageBadgeColor = '#15803d';
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
          {/* Top Line: ID Badge, Due Date, and Status Badge */}
          <View style={styles.cardTop}>
            <View style={styles.woIdWrap}>
              <View style={styles.woIdBadge}>
                <Text style={styles.woIdText}>{item.woNumber || item.id}</Text>
              </View>
              {formattedDueDate ? (
                <View style={styles.dueBadge}>
                  <Calendar size={11} color="#64748b" style={{ marginRight: 4 }} />
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

          {/* Vendor Name */}
          <Text style={styles.vendorName}>{item.vendorName || item.vendor}</Text>

          {/* Project Line */}
          <View style={styles.projectLine}>
            <Building2 size={13} color="#0f766e" style={{ marginRight: 5 }} />
            <Text style={styles.projectTitle} numberOfLines={1}>
              {item.projectTitle}
            </Text>
          </View>

          {/* Scope of Work */}
          {item.work ? (
            <Text style={styles.workScopeText} numberOfLines={2}>
              {item.work}
            </Text>
          ) : null}

          {/* Executive Financial Bento Strip */}
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
              <Text style={[styles.finLabel, paidVal > 0 && { color: '#15803d' }]}>
                PAID ({paidPct}%)
              </Text>
              <Text style={[styles.finValue, paidVal > 0 && { color: '#15803d' }]}>
                {formatCurrency(paidVal)}
              </Text>
            </View>
          </View>

          {/* Milestone Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(5, paidPct || billedPct || 10)}%`,
                    backgroundColor: item.currentStage === 'Paid' ? '#16a34a' : '#2563eb',
                  },
                ]}
              />
            </View>
          </View>

          {/* Card Footer: Clear Operational Milestone Notice */}
          <View style={styles.cardFooter}>
            <View style={styles.statusNote}>
              {item.currentStage === 'Paid' && (
                <View style={[styles.milestonePill, styles.milestonePillGreen]}>
                  <CheckCircle2 size={13} color="#15803d" style={{ marginRight: 5 }} />
                  <Text style={[styles.milestonePillText, { color: '#15803d' }]}>
                    Fully disbursed & closed
                  </Text>
                </View>
              )}
              {item.currentStage === 'Started' && (
                <View style={[styles.milestonePill, styles.milestonePillBlue]}>
                  <Clock size={13} color="#1d4ed8" style={{ marginRight: 5 }} />
                  <Text style={[styles.milestonePillText, { color: '#1d4ed8' }]}>
                    Work in progress in field
                  </Text>
                </View>
              )}
              {item.currentStage === 'Delivered' && (
                <View style={[styles.milestonePill, styles.milestonePillAmber]}>
                  <AlertTriangle size={13} color="#b45309" style={{ marginRight: 5 }} />
                  <Text style={[styles.milestonePillText, { color: '#b45309' }]}>
                    Delivered · Awaiting vendor bill
                  </Text>
                </View>
              )}
              {item.currentStage === 'Billed' && (
                <View style={[styles.milestonePill, styles.milestonePillRed]}>
                  <AlertTriangle size={13} color="#dc2626" style={{ marginRight: 5 }} />
                  <Text style={[styles.milestonePillText, { color: '#dc2626' }]}>
                    Invoiced · Needs 3-way reconciliation
                  </Text>
                </View>
              )}
              {item.currentStage === 'Verified' && (
                <View style={[styles.milestonePill, styles.milestonePillGreen]}>
                  <CheckCircle2 size={13} color="#15803d" style={{ marginRight: 5 }} />
                  <Text style={[styles.milestonePillText, { color: '#15803d' }]}>
                    Verified · Ready for payment release
                  </Text>
                </View>
              )}
              {item.currentStage === 'Issued' && (
                <View style={[styles.milestonePill, styles.milestonePillMuted]}>
                  <Clock size={13} color="#475569" style={{ marginRight: 5 }} />
                  <Text style={[styles.milestonePillText, { color: '#475569' }]}>
                    Issued · Awaiting contractor mobilization
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.arrowCircle}>
              <ChevronRight size={15} color="#2563eb" strokeWidth={2.4} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="Subcontracts (Work Orders)"
          subtitle={`${workOrders.length} Executed Field Orders`}
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      {/* Search & Filter Toolbar */}
      <View style={styles.topControl}>
        <View style={styles.searchBar}>
          <Search size={17} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search by WO #, vendor, scope, project..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color="#64748b" />
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
            const count =
              stage === 'All'
                ? workOrders.length
                : workOrders.filter((w) => w.currentStage === stage).length;

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

      {/* Main List with Top 4 Bento KPI Header */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderWorkOrderCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              {/* Card 1: Total Sanctioned */}
              <View style={[styles.kpiCard, styles.kpiCardTotal]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxTotal]}>
                    <Layers size={16} color="#0284c7" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeTotal}>
                    <Text style={styles.kpiBadgeTextTotal}>{workOrders.length} Orders</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValText}>₹{(totalContractVal / 100000).toFixed(2)} L</Text>
                  <ArrowUpRight size={15} color="#0284c7" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Total Sanctioned</Text>
                <Text style={styles.kpiSubText}>Gross contract allocation</Text>
              </View>

              {/* Card 2: Disbursed Paid */}
              <View style={[styles.kpiCard, styles.kpiCardPaid]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPaid]}>
                    <CheckCircle2 size={16} color="#16a34a" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgePaid}>
                    <Text style={styles.kpiBadgeTextPaid}>Settled</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValText, { color: '#16a34a' }]}>
                    ₹{(totalPaidVal / 100000).toFixed(2)} L
                  </Text>
                  <ArrowUpRight size={15} color="#16a34a" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Disbursed Paid</Text>
                <Text style={styles.kpiSubText}>Closed subcontract releases</Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              {/* Card 3: Active Field Sites */}
              <View style={[styles.kpiCard, styles.kpiCardPending]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPending]}>
                    <Clock size={16} color="#ea580c" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgePending}>
                    <Text style={styles.kpiBadgeTextPending}>Live Work</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValText, { color: '#ea580c' }]}>{activeWorkCount}</Text>
                  <ArrowUpRight size={15} color="#ea580c" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Active Field Sites</Text>
                <Text style={styles.kpiSubText}>Drilling & pumping in progress</Text>
              </View>

              {/* Card 4: Bills & Audit Review */}
              <View style={[styles.kpiCard, styles.kpiCardActive]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxActive]}>
                    <FileText size={16} color="#7c3aed" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeActive}>
                    <Text style={styles.kpiBadgeTextActive}>Audit Req</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValText}>{needsReviewCount}</Text>
                  <ArrowUpRight size={15} color="#7c3aed" strokeWidth={2.4} />
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    height: 42,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13.5,
    color: '#0f172a',
    paddingVertical: 0,
  },
  stageTabsList: {
    paddingVertical: 2,
    gap: 6,
  },
  stageChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
  },
  stageChipSelected: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  stageChipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  stageChipTextSelected: {
    color: '#ffffff',
  },

  /* 4 Bento KPI Grid */
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
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 124,
  },
  kpiCardTotal: {
    backgroundColor: '#f8fbff',
    borderColor: '#dbeafe',
  },
  kpiCardPending: {
    backgroundColor: '#fffaf5',
    borderColor: '#fed7aa',
  },
  kpiCardPaid: {
    backgroundColor: '#f5fdfb',
    borderColor: '#ccfbf1',
  },
  kpiCardActive: {
    backgroundColor: '#faf7ff',
    borderColor: '#f3e8ff',
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
    backgroundColor: '#eff6ff',
  },
  kpiIconBoxPending: {
    backgroundColor: '#fff7ed',
  },
  kpiIconBoxPaid: {
    backgroundColor: '#f0fdf4',
  },
  kpiIconBoxActive: {
    backgroundColor: '#f5f3ff',
  },
  kpiBadgeTotal: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextTotal: {
    color: '#0284c7',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgePending: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextPending: {
    color: '#ea580c',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgePaid: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextPaid: {
    color: '#16a34a',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgeActive: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextActive: {
    color: '#7c3aed',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiValText: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  kpiTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
    marginBottom: 1,
  },
  kpiSubText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },

  /* List & Cards */
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  woIdText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f766e',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dueDateText: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '700',
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  stageBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  vendorName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
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
    color: '#0f766e',
    flex: 1,
  },
  workScopeText: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 10,
  },

  /* Inner Financial Bento Box */
  financialBentoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#e2e8f0',
  },
  finLabel: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  finValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },

  /* Progress track */
  progressContainer: {
    marginBottom: 10,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  /* Card Footer Notice */
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
    backgroundColor: '#f0fdf4',
  },
  milestonePillBlue: {
    backgroundColor: '#eff6ff',
  },
  milestonePillAmber: {
    backgroundColor: '#fffbeb',
  },
  milestonePillRed: {
    backgroundColor: '#fef2f2',
  },
  milestonePillMuted: {
    backgroundColor: '#f8fafc',
  },
  milestonePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
