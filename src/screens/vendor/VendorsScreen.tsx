import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import {
  Search,
  ChevronRight,
  MapPin,
  Briefcase,
  Plus,
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
    paddingHorizontal: spacing.md,
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  vendorCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  idChip: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  idChipText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  msmeChip: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  msmeChipText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.successText,
  },
  vendorName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  workText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  contactDivider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  contactCol: {
    flex: 1,
  },
  contactPersonName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  contactPhone: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 1,
  },
  financialCol: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  financialLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  financialVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
});
