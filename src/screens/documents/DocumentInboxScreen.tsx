import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useCrm, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Input, EmptyState, Button } from '../../components';
import { DocumentItem } from '../../types';
import { DocumentVerificationModal } from './DocumentVerificationModal';
import { FileText, Search, ShieldCheck, ShieldAlert, Send, Eye, Lock } from 'lucide-react-native';

export const DocumentInboxScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { documents } = useCrm();
  const { hasRole } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const categories = [
    'All',
    'Mineral Concession Deed',
    'Assay Report',
    'CAD Topo Map',
    'Environmental Clearance',
    'Subcontract Agreement',
  ];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.docNo.toLowerCase().includes(search.toLowerCase()) ||
      doc.projectCode.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getConfidentialityColor = (conf: DocumentItem['confidentiality']) => {
    switch (conf) {
      case 'Strictly Secret':
        return colors.semantic.danger;
      case 'Confidential':
        return colors.semantic.warning;
      case 'Internal':
        return colors.primary;
      default:
        return colors.text.secondary;
    }
  };

  const renderDocCard = ({ item }: { item: DocumentItem }) => {
    const confColor = getConfidentialityColor(item.confidentiality);

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.tagWrap}>
            <Text style={styles.docNo}>{item.docNo}</Text>
            <View style={[styles.confidentialBadge, { borderColor: confColor }]}>
              <Lock size={10} color={confColor} />
              <Text style={[styles.confidentialText, { color: confColor }]}>
                {item.confidentiality}
              </Text>
            </View>
          </View>
          <StatusBadge status={item.isVerified ? 'Verified' : 'Pending'} size="small" />
        </View>

        <Text style={styles.docTitle}>{item.title}</Text>
        <Text style={styles.category}>{item.category} • Project {item.projectCode}</Text>

        <View style={styles.uploaderRow}>
          <Text style={styles.uploaderText}>
            Uploaded by: <Text style={{ fontWeight: '600' }}>{item.uploaderName}</Text> on {item.uploadDate}
          </Text>
        </View>

        {item.isVerified && (
          <View style={styles.verifiedRow}>
            <ShieldCheck size={14} color={colors.primary} />
            <Text style={styles.verifiedText}>
              Verified by {item.verifierName} ({item.verificationRemarks})
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.verifyActionBtn}
            onPress={() => {
              setSelectedDoc(item);
              setShowVerifyModal(true);
            }}
          >
            <ShieldCheck size={16} color={colors.primary} />
            <Text style={styles.verifyActionText}>
              {item.isVerified ? 'View Compliance Stamp' : 'Four-Eyes Verification'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Document Custody"
        subtitle="Mineral deeds, assay tests & technical drafts"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.dispatchHeaderBtn}
            onPress={() => navigation.navigate('DispatchRegister')}
          >
            <Send size={16} color={colors.primary} />
            <Text style={styles.dispatchHeaderText}>Dispatch</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by title, doc #, project..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.text.secondary} />}
        />
      </View>

      <View style={styles.filterScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === item && styles.filterChipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.filterChipText, selectedCategory === item && styles.filterChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredDocs}
        keyExtractor={item => item.id}
        renderItem={renderDocCard}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No Documents Found"
            message={search ? 'Try adjusting your search filters.' : 'Document inbox is currently empty.'}
            icon={<FileText size={40} color={colors.text.tertiary} />}
          />
        }
      />

      <DocumentVerificationModal
        visible={showVerifyModal}
        document={selectedDoc}
        onClose={() => setShowVerifyModal(false)}
        onVerified={() => setShowVerifyModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  dispatchHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
  },
  dispatchHeaderText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  filterScroll: {
    paddingBottom: spacing.sm,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
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
    gap: spacing.sm,
  },
  docNo: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  confidentialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  confidentialText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  docTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 2,
  },
  category: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  uploaderRow: {
    marginBottom: spacing.xs,
  },
  uploaderText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.primary}10`,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  verifiedText: {
    ...typography.caption,
    color: colors.primary,
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  verifyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
  },
  verifyActionText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
});
