import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Layers,
  Search,
  Lock,
  Calendar,
  Clock,
  ChevronRight,
  ShieldCheck,
  Plus,
  X,
  FileText,
  AlertCircle,
  Briefcase,
  IndianRupee,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button, EmptyState } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { Tender } from '../../types';
import {
  tenderPhase,
  closingOf,
  daysFrom,
  formatDateTime,
  TENDER_CATEGORIES,
  CONTRACT_FORMS,
} from '../../constants/vendor';

interface TendersScreenProps {
  navigation: any;
}

export const TendersScreen: React.FC<TendersScreenProps> = ({ navigation }) => {
  const { tenders, publishTender } = useCrm();
  const { role, session } = useAuth();

  const isAuthorizedToPublish = (role as any) === 'admin' || (role as any) === 'director' || (role as any) === 'tender_manager';

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Open' | 'Evaluation' | 'Allotted'>('All');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const totalEstimatedVal = useMemo(() => {
    return tenders.reduce((sum, t) => sum + (t.estimatedValue || t.estimate || 0), 0);
  }, [tenders]);

  const openBidsCount = useMemo(() => {
    return tenders.filter((t) => tenderPhase(t) === 'Open').length;
  }, [tenders]);

  const evaluationCount = useMemo(() => {
    return tenders.filter((t) => tenderPhase(t) === 'Evaluation').length;
  }, [tenders]);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState(TENDER_CATEGORIES[0]);
  const [newEstimate, setNewEstimate] = useState('2500000');
  const [newEmd, setNewEmd] = useState('50000');
  const [newClosingDays, setNewClosingDays] = useState('14');
  const [newDescription, setNewDescription] = useState('');
  const [newPrequal, setNewPrequal] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const filteredTenders = useMemo(() => {
    return tenders.filter((t) => {
      const q = search.trim().toLowerCase();
      const id = (t.id || '').toLowerCase();
      const ref = (t.refNo || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();

      const matchesSearch = !q || id.includes(q) || ref.includes(q) || title.includes(q) || cat.includes(q);

      const phase = tenderPhase(t);
      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Open' && phase === 'Open') ||
        (activeTab === 'Evaluation' && phase === 'Evaluation') ||
        (activeTab === 'Allotted' && phase === 'Allotted');

      return matchesSearch && matchesTab;
    });
  }, [tenders, search, activeTab]);

  const handlePublishSubmit = async () => {
    setFormErrors([]);
    if (!newTitle.trim()) {
      setFormErrors(['Tender title and scope description are required.']);
      return;
    }
    const est = Number(newEstimate);
    if (!est || est <= 0) {
      setFormErrors(['Estimated value must be greater than zero.']);
      return;
    }

    setIsPublishing(true);
    try {
      const closingDate = new Date(Date.now() + Number(newClosingDays || 14) * 86400000).toISOString();
      const openingDate = new Date(Date.now() + (Number(newClosingDays || 14) + 1) * 86400000).toISOString();

      await publishTender({
        title: newTitle.trim(),
        category: newCategory,
        estimatedValue: est,
        estimate: est,
        emdAmount: Number(newEmd) || Math.round(est * 0.02),
        emd: Number(newEmd) || Math.round(est * 0.02),
        closesAt: closingDate,
        submissionDeadline: closingDate,
        openingDate,
        opensAt: openingDate,
        description: newDescription.trim() || 'Exploration and geological drilling subcontract work package.',
        prequal: newPrequal.trim() || 'Statutory empanelled vendor with matching equipment capability.',
        forProject: selectedProjectId || undefined,
        location: 'Rajasthan, India',
        service: 'Mineral Exploration & Resources',
      });

      setShowCreateModal(false);
      setNewTitle('');
      setNewEstimate('2500000');
      Alert.alert('Tender Published', 'The tender notice has been broadcast to all empanelled vendors.');
    } catch (e: any) {
      Alert.alert('Publishing Error', e.message || 'Unable to publish tender notice.');
    } finally {
      setIsPublishing(false);
    }
  };

  const renderTenderCard = ({ item }: { item: Tender }) => {
    const phase = tenderPhase(item);
    const closingTime = closingOf(item);
    const daysDiff = Math.round((new Date(closingTime).getTime() - Date.now()) / 86400000);
    const daysLabel = daysFrom(closingTime);
    const liveBids = item.sealedBids.filter((b) => b.status !== 'Withdrawn');
    const sealedCount = liveBids.filter((b) => b.isSealed).length;

    let closingChipStyle = styles.closingChipOpen;
    let closingChipText = `Closes ${daysLabel}`;
    if (daysDiff < 0 || phase !== 'Open') {
      closingChipStyle = styles.closingChipClosed;
      closingChipText = phase === 'Allotted' ? 'Allotted' : 'Bidding Closed';
    } else if (daysDiff <= 2) {
      closingChipStyle = styles.closingChipUrgent;
      closingChipText = daysDiff === 0 ? 'Closing Today' : 'Closes in 1 day';
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('TenderDetail', { tenderId: item.id })}
      >
        <Card style={styles.tenderCard}>
          <View style={styles.cardHeader}>
            <View style={styles.refWrap}>
              <Text style={styles.tenderIdText}>{item.id}</Text>
              <View style={[styles.closingChip, closingChipStyle]}>
                <Clock size={11} color={styles.closingChipText.color} />
                <Text style={styles.closingChipText}>{closingChipText}</Text>
              </View>
            </View>
            <StatusBadge
              status={phase === 'Evaluation' ? 'Under Evaluation' : phase}
              size="small"
            />
          </View>

          <Text style={styles.tenderTitle}>{item.title}</Text>
          <Text style={styles.tenderRef}>{item.refNo || item.id}</Text>

          <View style={styles.financialRow}>
            <View style={styles.finCol}>
              <Text style={styles.finLabel}>EST. CONTRACT VALUE</Text>
              <Text style={styles.finValue}>{formatCurrency(item.estimatedValue || item.estimate || 0)}</Text>
            </View>
            <View style={styles.finCol}>
              <Text style={styles.finLabel}>EMD DEPOSIT</Text>
              <Text style={styles.finValue}>₹{(item.emdAmount || item.emd || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.finCol}>
              <Text style={styles.finLabel}>BIDS LODGED</Text>
              <View style={styles.bidCountBadge}>
                {sealedCount > 0 && <Lock size={12} color={colors.accent} />}
                <Text style={styles.bidCountText}>
                  {liveBids.length} {sealedCount > 0 ? `(${sealedCount} Sealed)` : ''}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.timelineRow}>
              <Calendar size={13} color={colors.textMuted} />
              <Text style={styles.timelineText}>
                Opens: {formatDateTime(item.openingDate || item.opensAt || '')}
              </Text>
            </View>

            {phase === 'Evaluation' ? (
              <TouchableOpacity
                style={styles.unsealActionBtn}
                onPress={() => navigation.navigate('SealedBidding', { tenderId: item.id })}
              >
                <Lock size={13} color={colors.surface} />
                <Text style={styles.unsealActionText}>Dual-Key Chamber</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.inspectRow}>
                <Text style={styles.inspectText}>Inspect Details</Text>
                <ChevronRight size={16} color={colors.primary} />
              </View>
            )}
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
          title="Tender Notice Board"
          subtitle={`${tenders.length} Subcontract Procurement Packages`}
          showBack
          onBack={() => navigation.goBack()}
          rightAction={
            isAuthorizedToPublish ? (
              <TouchableOpacity
                style={styles.publishHeaderBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Plus size={18} color={colors.surface} />
                <Text style={styles.publishHeaderBtnText}>New Tender</Text>
              </TouchableOpacity>
            ) : undefined
          }
        />
      }
    >
      <View style={styles.topControl}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
          <TextInput
            placeholder="Search by tender ID, reference, scope..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>

        <View style={styles.tabRow}>
          {(['All', 'Open', 'Evaluation', 'Allotted'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            const count =
              tab === 'All'
                ? tenders.length
                : tenders.filter((t) => tenderPhase(t) === tab).length;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}>
                  {tab} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredTenders}
        keyExtractor={(item) => item.id}
        renderItem={renderTenderCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              {/* Card 1: Total Tenders */}
              <View style={[styles.kpiCard, styles.kpiCardTotal]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxTotal]}>
                    <Layers size={16} color="#0284c7" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeTotal}>
                    <Text style={styles.kpiBadgeTextTotal}>Procurement</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValText}>{tenders.length}</Text>
                  <ArrowUpRight size={15} color="#0284c7" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Tender Packages</Text>
                <Text style={styles.kpiSubText}>Active subcontract notices</Text>
              </View>

              {/* Card 2: Open Bids */}
              <View style={[styles.kpiCard, styles.kpiCardPending]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPending]}>
                    <Clock size={16} color="#ea580c" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgePending}>
                    <Text style={styles.kpiBadgeTextPending}>Live Bidding</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValText, { color: '#ea580c' }]}>{openBidsCount}</Text>
                  <ArrowUpRight size={15} color="#ea580c" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Open for Bidding</Text>
                <Text style={styles.kpiSubText}>Accepting vendor proposals</Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              {/* Card 3: Estimated Value */}
              <View style={[styles.kpiCard, styles.kpiCardPaid]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPaid]}>
                    <IndianRupee size={16} color="#16a34a" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgePaid}>
                    <Text style={styles.kpiBadgeTextPaid}>Budget</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValText, { color: '#16a34a' }]}>
                    ₹{(totalEstimatedVal / 100000).toFixed(1)} L
                  </Text>
                  <ArrowUpRight size={15} color="#16a34a" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Estimated Value</Text>
                <Text style={styles.kpiSubText}>Sanctioned tender outlay</Text>
              </View>

              {/* Card 4: Dual-Key Vault */}
              <View style={[styles.kpiCard, styles.kpiCardActive]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxActive]}>
                    <Lock size={16} color="#7c3aed" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeActive}>
                    <Text style={styles.kpiBadgeTextActive}>Dual-Key</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValText}>{evaluationCount}</Text>
                  <ArrowUpRight size={15} color="#7c3aed" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Vault Unseal Queue</Text>
                <Text style={styles.kpiSubText}>Sealed bids awaiting unlock</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Tenders Found"
            message={
              search
                ? `No tender notice matches "${search}".`
                : 'No procurement packages in this state.'
            }
            actionLabel={isAuthorizedToPublish ? 'Publish New Tender' : undefined}
            onAction={isAuthorizedToPublish ? () => setShowCreateModal(true) : undefined}
          />
        }
      />

      {showCreateModal && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Publish Subcontract Tender</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeBtn}>
                  <X size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.sheetContent}>
                {formErrors.length > 0 && (
                  <View style={styles.errorBox}>
                    {formErrors.map((err, i) => (
                      <Text key={i} style={styles.errorText}>
                        • {err}
                      </Text>
                    ))}
                  </View>
                )}

                <Text style={styles.fieldLabel}>TENDER TITLE / SCOPE *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Diamond Core Drilling Package — Khetri Copper Belt"
                  placeholderTextColor={colors.textMuted}
                  value={newTitle}
                  onChangeText={setNewTitle}
                />

                <Text style={styles.fieldLabel}>WORK CATEGORY</Text>
                <View style={styles.categoryChips}>
                  {TENDER_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, newCategory === cat && styles.catChipActive]}
                      onPress={() => setNewCategory(cat)}
                    >
                      <Text style={[styles.catChipText, newCategory === cat && styles.catChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.rowTwo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>ESTIMATED CEILING (₹) *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 2500000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={newEstimate}
                      onChangeText={setNewEstimate}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>EMD DEPOSIT (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 50000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={newEmd}
                      onChangeText={setNewEmd}
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>BIDDING DURATION (DAYS)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 14"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={newClosingDays}
                  onChangeText={setNewClosingDays}
                />

                <Text style={styles.fieldLabel}>TECHNICAL SPECIFICATIONS & LOGISTICS</Text>
                <TextInput
                  style={[styles.textInput, { minHeight: 70, textAlignVertical: 'top' }]}
                  placeholder="Core size HQ/NQ, wireline coring rigs, mobilization turnaround, camp logistics..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={newDescription}
                  onChangeText={setNewDescription}
                />

                <Text style={styles.fieldLabel}>PREQUALIFICATION CRITERIA</Text>
                <TextInput
                  style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
                  placeholder="Minimum 3 years drilling track record in sedimentary formations..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                  value={newPrequal}
                  onChangeText={setNewPrequal}
                />

                <View style={styles.sheetActions}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    style={{ flex: 1 }}
                    onPress={() => setShowCreateModal(false)}
                  />
                  <Button
                    title={isPublishing ? 'Publishing...' : 'Publish Tender Notice'}
                    variant="primary"
                    style={{ flex: 1 }}
                    disabled={isPublishing}
                    onPress={handlePublishSubmit}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  publishHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    gap: 4,
  },
  publishHeaderBtnText: {
    color: colors.surface,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
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
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  tabButtonTextActive: {
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  tenderCard: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  refWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tenderIdText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  closingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    gap: 3,
  },
  closingChipOpen: {
    backgroundColor: colors.infoBg,
  },
  closingChipUrgent: {
    backgroundColor: colors.warningBg,
  },
  closingChipClosed: {
    backgroundColor: colors.surfaceMuted,
  },
  closingChipText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
  },
  tenderTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  tenderRef: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceMuted,
    marginBottom: spacing.sm,
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
  bidCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bidCountText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.accent,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  unsealActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    gap: 4,
  },
  unsealActionText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.surface,
  },
  inspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inspectText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
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
    paddingBottom: spacing.xxl,
  },
  errorBox: {
    backgroundColor: colors.dangerBg,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSizes.xs,
    color: colors.dangerText,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  catChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surfaceMuted,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  /* Bento KPI Grid */
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
});
