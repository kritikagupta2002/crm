import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import {
  Briefcase,
  Search,
  ChevronRight,
  IndianRupee,
  Clock,
  Layers,
  Building2,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button, EmptyState } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { WorkOrder, WorkOrderStage } from '../../types';

interface WorkOrdersScreenProps {
  navigation: any;
}

export const WorkOrdersScreen: React.FC<WorkOrdersScreenProps> = ({ navigation }) => {
  const { workOrders } = useCrm();
  const { role } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('All');

  const STAGES: ('All' | WorkOrderStage)[] = [
    'All',
    'Issued',
    'Started',
    'Delivered',
    'Billed',
    'Verified',
    'Paid',
  ];

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

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

    let stageBadgeBg = colors.surfaceMuted;
    let stageBadgeColor = colors.textSecondary;

    switch (item.currentStage) {
      case 'Issued':
        stageBadgeBg = colors.warningBg;
        stageBadgeColor = colors.warningText;
        break;
      case 'Started':
        stageBadgeBg = colors.infoBg;
        stageBadgeColor = colors.infoText;
        break;
      case 'Delivered':
        stageBadgeBg = colors.accentBg;
        stageBadgeColor = colors.accent;
        break;
      case 'Billed':
        stageBadgeBg = colors.dangerBg;
        stageBadgeColor = colors.dangerText;
        break;
      case 'Verified':
        stageBadgeBg = colors.background.tertiary;
        stageBadgeColor = colors.text.secondary;
        break;
      case 'Paid':
        stageBadgeBg = colors.successBg;
        stageBadgeColor = colors.successText;
        break;
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('WorkOrderDetail', { woId: item.id })}
      >
        <Card style={styles.orderCard}>
          <View style={styles.cardTop}>
            <View style={styles.woIdWrap}>
              <Text style={styles.woIdText}>{item.woNumber || item.id}</Text>
              {item.dueOn && (
                <Text style={styles.dueDateText}>Due: {item.dueOn}</Text>
              )}
            </View>
            <View style={[styles.stageBadge, { backgroundColor: stageBadgeBg }]}>
              <Text style={[styles.stageBadgeText, { color: stageBadgeColor }]}>
                {item.currentStage}
              </Text>
            </View>
          </View>

          <Text style={styles.vendorName}>{item.vendorName || item.vendor}</Text>
          <Text style={styles.projectTitle} numberOfLines={1}>
            {item.projectTitle}
          </Text>

          {item.work && (
            <Text style={styles.workScopeText} numberOfLines={1}>
              {item.work}
            </Text>
          )}

          <View style={styles.financialRow}>
            <View style={styles.finCol}>
              <Text style={styles.finLabel}>CONTRACT</Text>
              <Text style={styles.finValue}>{formatCurrency(contractVal)}</Text>
            </View>
            <View style={styles.finCol}>
              <Text style={styles.finLabel}>BILLED ({billedPct}%)</Text>
              <Text style={styles.finValue}>{formatCurrency(billedVal)}</Text>
            </View>
            <View style={styles.finCol}>
              <Text style={styles.finLabel}>PAID ({paidPct}%)</Text>
              <Text style={[styles.finValue, { color: colors.success }]}>
                {formatCurrency(paidVal)}
              </Text>
            </View>
          </View>

          {/* Progress bar representing financial completion */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${paidPct}%` }]} />
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.statusNote}>
              {item.currentStage === 'Delivered' && (
                <Text style={styles.noticeAmber}>• Delivered · Awaiting vendor bill</Text>
              )}
              {item.currentStage === 'Billed' && (
                <Text style={styles.noticeRed}>• Invoiced · Needs 3-way reconciliation</Text>
              )}
              {item.currentStage === 'Verified' && (
                <Text style={styles.noticeGreen}>• Verified · Ready for disbursement</Text>
              )}
              {item.currentStage === 'Started' && (
                <Text style={styles.noticeBlue}>• Work in progress in field</Text>
              )}
              {item.currentStage === 'Issued' && (
                <Text style={styles.noticeMuted}>• Issued · Awaiting contractor start</Text>
              )}
              {item.currentStage === 'Paid' && (
                <Text style={styles.noticeGreen}>• Fully disbursed & closed</Text>
              )}
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
          title="Subcontracts (Work Orders)"
          subtitle={`${workOrders.length} Executed Field Orders`}
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      <View style={styles.topControl}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
          <TextInput
            placeholder="Search by WO #, vendor, scope, project..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
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
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
  },
  stageTabsList: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  stageChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  stageChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stageChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  stageChipTextSelected: {
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  orderCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  woIdWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  woIdText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  dueDateText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
  },
  vendorName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  projectTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.primaryDark,
    marginBottom: 2,
  },
  workScopeText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
    marginBottom: spacing.xs,
  },
  finCol: {
    flex: 1,
  },
  finLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  finValue: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
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
  noticeAmber: {
    fontSize: typography.fontSizes.xxs,
    color: colors.warningText,
    fontWeight: typography.fontWeights.semibold,
  },
  noticeRed: {
    fontSize: typography.fontSizes.xxs,
    color: colors.dangerText,
    fontWeight: typography.fontWeights.semibold,
  },
  noticeGreen: {
    fontSize: typography.fontSizes.xxs,
    color: colors.successText,
    fontWeight: typography.fontWeights.semibold,
  },
  noticeBlue: {
    fontSize: typography.fontSizes.xxs,
    color: colors.infoText,
    fontWeight: typography.fontWeights.semibold,
  },
  noticeMuted: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
});
