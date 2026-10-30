import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import {
  Search,
  ChevronRight,
  MapPin,
  Briefcase,
  Plus,
  Building2,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, EmptyState } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils';
import { useCrm } from '../../context/CrmContext';
import { Vendor } from '../../types';
import { WORK_CATEGORIES } from '../../constants/vendor';

interface VendorsScreenProps {
  navigation: any;
}

export const VendorsScreen: React.FC<VendorsScreenProps> = ({ navigation }) => {
  const { vendors, workOrders } = useCrm();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => ['All', ...WORK_CATEGORIES], []);

  const totalAwardedAll = useMemo(() => {
    return workOrders.reduce((sum, wo) => sum + (wo.contractValue || wo.amount || 0), 0);
  }, [workOrders]);

  const liveOrdersCount = useMemo(() => {
    return workOrders.filter((wo) => wo.currentStage !== 'Paid').length;
  }, [workOrders]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = search.trim().toLowerCase();
      const code = (v.id || v.vendorCode || '').toLowerCase();
      const name = (v.name || '').toLowerCase();
      const contact = (v.contact || v.contactPerson || '').toLowerCase();
      const work = (v.work || v.category || '').toLowerCase();
      const gstin = (v.gstin || '').toLowerCase();
      const pan = (v.pan || '').toLowerCase();

      const matchesSearch =
        !q ||
        code.includes(q) ||
        name.includes(q) ||
        contact.includes(q) ||
        work.includes(q) ||
        gstin.includes(q) ||
        pan.includes(q);

      const matchesCat =
        selectedCategory === 'All' ||
        (v.categories && v.categories.includes(selectedCategory)) ||
        (v.work && v.work.includes(selectedCategory)) ||
        v.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [vendors, search, selectedCategory]);

  const renderVendorCard = ({ item }: { item: Vendor }) => {
    const linkedOrders = workOrders.filter(
      (wo) => wo.vendorId === item.id || wo.vendor === item.name || wo.vendorName === item.name
    );
    const activeOrders = linkedOrders.filter((wo) => wo.currentStage !== 'Paid');
    const totalAwarded = linkedOrders.reduce((sum, wo) => sum + (wo.contractValue || wo.amount || 0), 0);
    const contactName = item.contact || item.contactPerson || 'Point of Contact';
    const location = item.place || (item.address ? `${item.address.city}, ${item.address.state}` : 'India');

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('VendorDetail', { vendorId: item.id })}
      >
        <Card style={styles.vendorCard}>
          <View style={styles.cardHeader}>
            <View style={styles.tagWrap}>
              <View style={styles.idChip}>
                <Text style={styles.idChipText}>{item.id || item.vendorCode}</Text>
              </View>
              {item.msme && (
                <View style={styles.msmeChip}>
                  <Text style={styles.msmeChipText}>MSME {item.msme}</Text>
                </View>
              )}
            </View>
            <StatusBadge
              status={item.empanelledStatus || 'Active'}
              size="small"
            />
          </View>

          <Text style={styles.vendorName}>{item.name}</Text>
          <Text style={styles.workText} numberOfLines={2}>
            {item.work || item.category || 'General Contractor'}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Briefcase size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {activeOrders.length} live / {linkedOrders.length} total orders
              </Text>
            </View>
          </View>

          <View style={styles.contactDivider} />

          <View style={styles.cardFooter}>
            <View style={styles.contactCol}>
              <Text style={styles.contactPersonName}>{contactName}</Text>
              <Text style={styles.contactPhone}>{item.phone}</Text>
            </View>
            <View style={styles.financialCol}>
              <Text style={styles.financialLabel}>Total Subcontracts</Text>
              <Text style={styles.financialVal}>{formatCurrency(totalAwarded)}</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer
      scrollable={false}
      noPadding
      header={
        <AppHeader
          title="Vendor Master"
          subtitle={`${vendors.length} Empanelled Contractors & Suppliers`}
          showBack
          onBack={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={() => navigation.navigate('VendorRegister')}
            >
              <Plus size={18} color={colors.surface} />
              <Text style={styles.headerAddBtnText}>Enroll</Text>
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search by ID, firm name, PAN, GSTIN, city..."
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
          data={categories}
          keyExtractor={(c) => c}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item: cat }) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={filteredVendors}
        keyExtractor={(v) => v.id}
        renderItem={renderVendorCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        ListHeaderComponent={
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, styles.kpiCardTotal]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxTotal]}>
                    <Building2 size={16} color="#2f6fb3" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeTotal}>
                    <Text style={styles.kpiBadgeTextTotal}>Contractors</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValText}>{vendors.length}</Text>
                  <ArrowUpRight size={15} color="#2f6fb3" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Empanelled Base</Text>
                <Text style={styles.kpiSubText}>Verified rig & lab vendors</Text>
              </View>

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
                  <Text style={[styles.kpiValText, { color: '#b07d27' }]}>{liveOrdersCount}</Text>
                  <ArrowUpRight size={15} color="#b07d27" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Live Subcontracts</Text>
                <Text style={styles.kpiSubText}>Active on exploration sites</Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, styles.kpiCardPaid]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPaid]}>
                    <CheckCircle2 size={16} color="#2e9e6b" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgePaid}>
                    <Text style={styles.kpiBadgeTextPaid}>Allocated</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValText, { color: '#2e9e6b' }]}>
                    ₹{(totalAwardedAll / 100000).toFixed(1)} L
                  </Text>
                  <ArrowUpRight size={15} color="#2e9e6b" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Awarded Contracts</Text>
                <Text style={styles.kpiSubText}>Cumulative order sanction</Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardActive]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxActive]}>
                    <Layers size={16} color="#3d5a6c" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeActive}>
                    <Text style={styles.kpiBadgeTextActive}>Capabilities</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValText}>{categories.length - 1}</Text>
                  <ArrowUpRight size={15} color="#3d5a6c" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Specializations</Text>
                <Text style={styles.kpiSubText}>Drilling, assays & lease</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Vendors Found"
            message={
              search
                ? `No vendor matches query "${search}". Try adjusting filters.`
                : 'No vendors empanelled in this category yet.'
            }
            actionLabel="Register New Vendor"
            onAction={() => navigation.navigate('VendorRegister')}
          />
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    gap: 4,
  },
  headerAddBtnText: {
    color: colors.surface,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  searchSection: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    marginHorizontal: 16,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  categoryChipTextSelected: {
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  vendorCard: {
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: '#e1e8eb',
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    ...shadows.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idChip: {
    backgroundColor: '#e6effa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#e6effa',
  },
  idChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#245a93',
  },
  msmeChip: {
    backgroundColor: '#e3f4ec',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#e3f4ec',
  },
  msmeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#237a53',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f2a3d',
    marginVertical: 3,
  },
  workText: {
    fontSize: 12.5,
    color: '#4a5b68',
    lineHeight: 18,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 2,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11.5,
    color: '#627079',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#edf1f3',
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  contactCol: {
    flex: 1,
  },
  contactPersonName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f2a3d',
  },
  contactPhone: {
    fontSize: 11.5,
    color: '#627079',
    marginTop: 1,
  },
  financialCol: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  financialLabel: {
    fontSize: 9.5,
    color: '#7c8b96',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  financialVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f2a3d',
    letterSpacing: -0.3,
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
});
