import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Search,
  X,
  Gavel,
  Bookmark,
  BookmarkCheck,
  Clock,
  ArrowUpDown,
  Lock,
  ChevronRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
} from 'lucide-react-native';
import { Tender, SealedBid } from '../../../types';
import { closingOf, daysFrom, tenderPhase } from '../../../constants/vendor';
import { vendorTheme } from './vendorTheme';

export type TenderFilterKey = 'all' | 'open' | 'closing_soon' | 'saved' | 'submitted' | 'closed';
export type TenderSortKey = 'deadline' | 'value' | 'newest';

interface VendorTendersTabProps {
  tenderSearch: string;
  setTenderSearch: (text: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  filteredTenders: Tender[];
  vendorCode: string;
  myBids: { tender: Tender; bid: SealedBid }[];
  savedTenders: string[];
  toggleSavedTender: (tenderId: string, vendorId: string) => void;
  navigation: any;
}

export const VendorTendersTab: React.FC<VendorTendersTabProps> = ({
  tenderSearch,
  setTenderSearch,
  selectedCategory,
  setSelectedCategory,
  filteredTenders,
  vendorCode,
  myBids,
  savedTenders,
  toggleSavedTender,
  navigation,
}) => {
  const [activeFilter, setActiveFilter] = useState<TenderFilterKey>('all');
  const [sortBy, setSortBy] = useState<TenderSortKey>('deadline');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const categories = [
    'all',
    'Core drilling',
    'Drone survey',
    'Lab testing (NABL)',
    'Geotechnical testing',
    'Borewell & pumping test',
  ];

  // Apply filters
  const processedTenders = filteredTenders.filter((t) => {
    const phase = tenderPhase(t);
    const closingTime = closingOf(t);
    const diffDays = (new Date(closingTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    const hasMyBid = myBids.some((b) => b.tender.id === t.id);
    const isSaved = savedTenders.includes(t.id);

    if (activeFilter === 'open') return phase === 'Open';
    if (activeFilter === 'closing_soon') return phase === 'Open' && diffDays >= 0 && diffDays <= 4;
    if (activeFilter === 'saved') return isSaved;
    if (activeFilter === 'submitted') return hasMyBid;
    if (activeFilter === 'closed') return phase === 'Evaluation' || phase === 'Allotted' || phase === 'Cancelled';
    return true;
  });

  // Apply sorting
  processedTenders.sort((a, b) => {
    if (sortBy === 'deadline') {
      return new Date(closingOf(a)).getTime() - new Date(closingOf(b)).getTime();
    }
    if (sortBy === 'value') {
      return (b.estimatedValue || 0) - (a.estimatedValue || 0);
    }
    if (sortBy === 'newest') {
      return (
        new Date(b.publishedAt || '2026-01-01').getTime() -
        new Date(a.publishedAt || '2026-01-01').getTime()
      );
    }
    return 0;
  });

  return (
    <View style={styles.container}>
      {/* 1. LARGE SEARCH BAR */}
      <View style={styles.searchBar}>
        <Search size={19} color={vendorTheme.colors.navy} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tenders by title, number, or category..."
          placeholderTextColor={vendorTheme.colors.textTertiary}
          value={tenderSearch}
          onChangeText={setTenderSearch}
        />
        {tenderSearch.length > 0 && (
          <TouchableOpacity onPress={() => setTenderSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={vendorTheme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. CATEGORY CHIPS (BIGGER & MORE TOUCH-FRIENDLY) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
            >
              <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                {cat === 'all' ? 'All Disciplines' : cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. FILTER & SORT CONTROLS BAR */}
      <View style={styles.filterControlsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsScroll}
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'open', label: 'Open' },
            { key: 'closing_soon', label: 'Closing Soon' },
            { key: 'saved', label: `Saved (${savedTenders.length})` },
            { key: 'submitted', label: `My Bids (${myBids.length})` },
            { key: 'closed', label: 'Closed' },
          ].map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveFilter(tab.key as TenderFilterKey)}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort Toggle Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowSortMenu(!showSortMenu)}
          style={styles.sortButton}
        >
          <ArrowUpDown size={15} color={vendorTheme.colors.navy} />
          <Text style={styles.sortButtonText}>
            {sortBy === 'deadline' ? 'Deadline' : sortBy === 'value' ? 'Value' : 'Newest'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown Popup */}
      {showSortMenu && (
        <View style={styles.sortDropdown}>
          {[
            { key: 'deadline', label: 'Earliest Closing Deadline' },
            { key: 'value', label: 'Highest Estimated Value' },
            { key: 'newest', label: 'Recently Published' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortItem, sortBy === opt.key && styles.sortItemActive]}
              onPress={() => {
                setSortBy(opt.key as TenderSortKey);
                setShowSortMenu(false);
              }}
            >
              <Text style={[styles.sortItemText, sortBy === opt.key && styles.sortItemTextActive]}>
                {opt.label}
              </Text>
              {sortBy === opt.key && <CheckCircle2 size={15} color={vendorTheme.colors.teal} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 4. RESULTS COUNT SUMMARY */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          SHOWING {processedTenders.length} NOTICE{processedTenders.length === 1 ? '' : 'S'}
        </Text>
      </View>

      {/* 5. TENDER ROWS LIST (BIG & READABLE CARDS) */}
      {processedTenders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Gavel size={36} color={vendorTheme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Tenders Found</Text>
          <Text style={styles.emptyDesc}>
            No tenders match your current search and filter criteria. Try adjusting the discipline or status.
          </Text>
          <TouchableOpacity
            style={styles.resetFilterBtn}
            onPress={() => {
              setTenderSearch('');
              setSelectedCategory('all');
              setActiveFilter('all');
            }}
          >
            <Text style={styles.resetFilterText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tenderList}>
          {processedTenders.map((tender) => {
            const phase = tenderPhase(tender);
            const closingTime = closingOf(tender);
            const daysLabel = daysFrom(closingTime);
            const diffDays = Math.round(
              (new Date(closingTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const isSaved = savedTenders.includes(tender.id);

            // Check if this vendor submitted a bid
            const vendorBid = tender.sealedBids.find(
              (b) =>
                b.vendorId === vendorCode ||
                b.vendorName?.toLowerCase().includes('apex')
            );

            return (
              <TouchableOpacity
                key={tender.id}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('TenderDetail', { tenderId: tender.id })}
                style={styles.tenderRowCard}
              >
                {/* Row Header: ID, Category, Save Bookmark */}
                <View style={styles.rowTopHeader}>
                  <View style={styles.idCategoryRow}>
                    <View style={styles.tenderNoBadge}>
                      <Text style={styles.tenderNoBadgeText}>{tender.tenderNo || tender.id}</Text>
                    </View>
                    <Text style={styles.categoryBadgeText} numberOfLines={1}>
                      {tender.category || 'General Exploration'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => toggleSavedTender(tender.id, vendorCode)}
                    style={styles.saveBtn}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={22} color={vendorTheme.colors.amberDark} />
                    ) : (
                      <Bookmark size={22} color={vendorTheme.colors.textTertiary} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Big Tender Title */}
                <Text style={styles.tenderTitle} numberOfLines={2}>
                  {tender.title}
                </Text>

                {/* Commercial & Dates Matrix (Spacious & Bold) */}
                <View style={styles.specStrip}>
                  <View style={styles.specCol}>
                    <Text style={styles.specLabel}>EST. VALUE</Text>
                    <Text style={styles.specValue}>
                      {tender.estimatedValue ? `₹${(tender.estimatedValue / 100000).toFixed(1)}L` : 'Confidential'}
                    </Text>
                  </View>

                  <View style={styles.specDivider} />

                  <View style={styles.specCol}>
                    <Text style={styles.specLabel}>EMD DEPOSIT</Text>
                    <Text style={styles.specValue}>
                      {tender.emdAmount ? `₹${tender.emdAmount.toLocaleString('en-IN')}` : 'Nil'}
                    </Text>
                  </View>

                  <View style={styles.specDivider} />

                  <View style={styles.specCol}>
                    <Text style={styles.specLabel}>CLOSES IN</Text>
                    <Text
                      style={[
                        styles.specValue,
                        diffDays <= 2 ? { color: vendorTheme.colors.crimson } : undefined,
                      ]}
                    >
                      {phase === 'Open' ? daysLabel : phase}
                    </Text>
                  </View>
                </View>

                {/* Footer: Opening Date, Bid Status Badge, Chevron */}
                <View style={styles.rowFooter}>
                  <View style={styles.footerLeft}>
                    {vendorBid ? (
                      <View style={styles.bidSubmittedBadge}>
                        <Lock size={12} color={vendorTheme.colors.tealDark} />
                        <Text style={styles.bidSubmittedText}>
                          {vendorBid.status === 'Withdrawn'
                            ? 'Bid Withdrawn'
                            : 'Sealed Bid Lodged'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.deadlineMetaWrap}>
                        <Calendar size={13} color={vendorTheme.colors.textMuted} />
                        <Text style={styles.deadlineMetaText}>
                          Opening: {tender.openingDate?.slice(0, 10) || 'Post-closing'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.footerRight}>
                    <View
                      style={[
                        styles.phaseBadge,
                        phase === 'Open' ? styles.phaseOpen : styles.phaseClosed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.phaseBadgeText,
                          phase === 'Open' ? styles.phaseOpenText : styles.phaseClosedText,
                        ]}
                      >
                        {phase}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={vendorTheme.colors.navy} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 28,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: vendorTheme.colors.sandstoneBorder,
    marginBottom: 12,
    ...vendorTheme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: vendorTheme.colors.graphite,
    marginLeft: 10,
    padding: 0,
    fontWeight: '500',
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: vendorTheme.colors.surface,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
  },
  categoryChipActive: {
    backgroundColor: vendorTheme.colors.navy,
    borderColor: vendorTheme.colors.navy,
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: vendorTheme.colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  filterControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    gap: 10,
  },
  filterTabsScroll: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  filterPillActive: {
    backgroundColor: vendorTheme.colors.teal,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: vendorTheme.colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    gap: 5,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: vendorTheme.colors.navy,
  },
  sortDropdown: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.md,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    padding: 8,
    marginBottom: 10,
    ...vendorTheme.shadows.md,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortItemActive: {
    backgroundColor: vendorTheme.colors.sandstone,
  },
  sortItemText: {
    fontSize: 13,
    color: vendorTheme.colors.textSecondary,
  },
  sortItemTextActive: {
    fontWeight: '800',
    color: vendorTheme.colors.teal,
  },
  countRow: {
    marginVertical: 8,
  },
  countText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: vendorTheme.colors.textMuted,
    letterSpacing: 0.6,
  },
  emptyWrap: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: vendorTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resetFilterBtn: {
    marginTop: 16,
    backgroundColor: vendorTheme.colors.sandstoneDark,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  tenderList: {
    gap: 12,
  },
  tenderRowCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    ...vendorTheme.shadows.md,
  },
  rowTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  idCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tenderNoBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tenderNoBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: vendorTheme.colors.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  saveBtn: {
    padding: 2,
  },
  tenderTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    lineHeight: 21,
    marginBottom: 10,
  },
  specStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.sandstone,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  specCol: {
    flex: 1,
    alignItems: 'center',
  },
  specDivider: {
    width: 1,
    height: 22,
    backgroundColor: vendorTheme.colors.sandstoneBorder,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: vendorTheme.colors.textMuted,
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginTop: 2,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidSubmittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.tealSubtle,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#99f6e4',
    gap: 5,
  },
  bidSubmittedText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: vendorTheme.colors.tealDark,
  },
  deadlineMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  deadlineMetaText: {
    fontSize: 12,
    color: vendorTheme.colors.textMuted,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  phaseOpen: {
    backgroundColor: '#dcfce7',
  },
  phaseClosed: {
    backgroundColor: '#f1f5f9',
  },
  phaseBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  phaseOpenText: {
    color: '#15803d',
  },
  phaseClosedText: {
    color: '#64748b',
  },
});
