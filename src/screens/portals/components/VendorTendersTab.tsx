import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Search,
  X,
  Gavel,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
} from 'lucide-react-native';
import { Card, StatusBadge, Button, EmptyState } from '../../../components';
import { colors, spacing } from '../../../theme';
import { Tender } from '../../../types';
import { closingOf, daysFrom } from '../../../constants/vendor';
import { styles } from './vendorPortalStyles';

interface VendorTendersTabProps {
  tenderSearch: string;
  setTenderSearch: (text: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  filteredTenders: Tender[];
  vendorCode: string;
  savedTenders: string[];
  toggleSavedTender: (tenderId: string, vendorId: string) => void;
  handleOpenClarification: (t: Tender) => void;
  navigation: any;
}

export const VendorTendersTab: React.FC<VendorTendersTabProps> = ({
  tenderSearch,
  setTenderSearch,
  selectedCategory,
  setSelectedCategory,
  filteredTenders,
  vendorCode,
  savedTenders,
  toggleSavedTender,
  handleOpenClarification,
  navigation,
}) => {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.searchBar}>
        <Search size={16} color={colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tenders by title, number, or discipline..."
          placeholderTextColor={colors.text.tertiary}
          value={tenderSearch}
          onChangeText={setTenderSearch}
        />
        {tenderSearch.length > 0 && (
          <TouchableOpacity onPress={() => setTenderSearch('')}>
            <X size={16} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {[
          'all',
          'Geotechnical',
          'Topographical Survey',
          'Structural Audit',
          'Pavement Investigation',
        ].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.catFilterChip,
              selectedCategory === cat && styles.catFilterChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.catFilterText,
                selectedCategory === cat && styles.catFilterTextActive,
              ]}
            >
              {cat === 'all' ? 'All Disciplines' : cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredTenders.length === 0 ? (
        <EmptyState
          title="No Tenders Found"
          message="No notice matches your search criteria or discipline filter."
          icon={<Gavel size={40} color={colors.text.tertiary} />}
        />
      ) : (
        filteredTenders.map((t) => {
          const myBid = t.sealedBids.find((b) => b.vendorId === vendorCode);
          const isSaved = (savedTenders || []).includes(t.id);
          const closingTime = closingOf(t);
          const daysDiff = Math.round(
            (new Date(closingTime).getTime() - Date.now()) / 86400000
          );
          const daysLabel = daysFrom(closingTime);

          return (
            <Card
              key={t.id}
              style={styles.tenderCard}
              onPress={() =>
                navigation.navigate('TenderDetail', { tenderId: t.id })
              }
            >
              <View style={styles.cardHeader}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Text style={styles.woCode}>{t.tenderNo || t.id}</Text>
                  <StatusBadge status={t.status} size="small" />
                </View>
                <TouchableOpacity
                  onPress={() => toggleSavedTender(t.id, vendorCode)}
                  style={styles.saveBtn}
                >
                  {isSaved ? (
                    <BookmarkCheck size={18} color={colors.primary} />
                  ) : (
                    <Bookmark size={18} color={colors.text.tertiary} />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.woTitle}>{t.title}</Text>
              <Text style={styles.tenderOrg}>
                {t.issuingAuthority || 'Bansal Geo'}
              </Text>

              <View style={styles.tenderStatsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>ESTIMATED VALUE</Text>
                  <Text style={styles.statBoxVal}>
                    ₹{(t.estimatedValue / 100000).toFixed(1)} L
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>EMD AMOUNT</Text>
                  <Text style={styles.statBoxVal}>
                    ₹{t.emdAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>CLOSING IN</Text>
                  <Text
                    style={[
                      styles.statBoxVal,
                      {
                        color:
                          daysDiff <= 2
                            ? colors.semantic.danger
                            : colors.text.primary,
                      },
                    ]}
                  >
                    {daysDiff > 0 ? daysLabel : 'Closed'}
                  </Text>
                </View>
              </View>

              {myBid ? (
                <View style={styles.myBidVaultBox}>
                  <ShieldCheck size={16} color={colors.semantic.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.myBidVaultTitle}>
                      Commercial Bid Locked in Escrow
                    </Text>
                    <Text style={styles.myBidVaultSub}>
                      ₹{myBid.bidAmount.toLocaleString('en-IN')} (Masked from
                      staff until dual-key unsealing)
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.cardActionRow}>
                  <Button
                    title="Submit Commercial Bid"
                    variant="primary"
                    size="small"
                    onPress={() =>
                      navigation.navigate('TenderDetail', { tenderId: t.id })
                    }
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Clarifications"
                    variant="outline"
                    size="small"
                    onPress={() => handleOpenClarification(t)}
                  />
                </View>
              )}
            </Card>
          );
        })
      )}
    </View>
  );
};
