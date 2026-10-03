import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useCrm, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Input, EmptyState, Button } from '../../components';
import { GovtDocument, DocumentItem } from '../../types';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Send,
  Eye,
  Lock,
  ChevronRight,
  FileScan,
  Truck,
  Download,
  X,
  Check,
} from 'lucide-react-native';
import { DOC_KINDS, DOC_STAGES, STAGE_TONE, accessLabel, verifyBlock } from '../../constants';

const STAGE_FILTERS = ['All', ...DOC_STAGES];

export const DocumentsScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
  route,
}) => {
  const { govtDocuments, scanInbox, documents, refreshGovtDocuments, isLoading } = useCrm();
  const { session } = useAuth();
  const currentUserName = (session as any)?.name || (session as any)?.contactPerson || 'Active User';


  const initialStep = route?.params?.step || 'All';
  const initialView = route?.params?.view || 'Government documents';

  const [activeView, setActiveView] = useState<'Government documents' | 'Other documents'>(initialView);
  const [selectedStage, setSelectedStage] = useState<string>(initialStep);
  const [search, setSearch] = useState('');
  const [selectedKind, setSelectedKind] = useState<string>('All kinds');
  const [selectedAccess, setSelectedAccess] = useState<string>('Any access');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  // Filtered Government Documents
  const filteredGovtDocs = useMemo(() => {
    return govtDocuments.filter((doc) => {
      // Stage filter
      if (selectedStage !== 'All' && doc.stage !== selectedStage) {
        return false;
      }
      // Kind filter
      if (selectedKind !== 'All kinds' && doc.kind !== selectedKind) {
        return false;
      }
      // Access filter
      if (selectedAccess === 'Client can see' && !doc.record.access?.client) return false;
      if (selectedAccess === 'Vendor can see' && !doc.record.access?.vendor) return false;
      if (selectedAccess === 'Office only' && (doc.record.access?.client || doc.record.access?.vendor)) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = [
          doc.letter.title,
          doc.letter.ref,
          doc.lead?.company,
          doc.project?.name,
          doc.project?.id,
          doc.record.links?.leaseNo,
          doc.vendor?.name,
          doc.record.filedBy,
        ].some((val) => val && val.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [govtDocuments, selectedStage, selectedKind, selectedAccess, search]);

  // Filtered Other Documents
  const filteredOtherDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.docNo.toLowerCase().includes(q) ||
          doc.projectCode.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, search]);

  const activeFilterCount =
    (selectedKind !== 'All kinds' ? 1 : 0) + (selectedAccess !== 'Any access' ? 1 : 0);

  const renderGovtCard = ({ item }: { item: GovtDocument }) => {
    const isFiler = item.record.filedBy?.toLowerCase() === currentUserName.toLowerCase();
    const isBlocked = verifyBlock(item, currentUserName);
    const hasOriginal = item.record.dispatch && item.record.dispatch.status !== 'Not needed';

    return (
      <Card style={styles.docCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('DocumentDetail', { docId: item.id })}
        >
          <View style={styles.cardHeader}>
            <View style={styles.refWrap}>
              <Text style={styles.refText}>{item.letter.ref}</Text>
              <Text style={styles.kindText}>• {item.kind}</Text>
            </View>
            <StatusBadge
              status={item.rescan ? 'Rescan needed' : item.stage}
              size="small"
            />
          </View>

          <Text style={styles.docTitle} numberOfLines={2}>
            {item.letter.title}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaCompany}>{item.lead.company}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaProject}>{item.project.id}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaDate}>{item.letter.date}</Text>
          </View>

          {/* Custody & 4-Eyes Guard Note */}
          <View style={styles.custodyRow}>
            <Text style={styles.custodyText}>
              Filed by <Text style={{ fontWeight: '600' }}>{item.record.filedBy}</Text>
            </Text>
            {item.record.verify?.status === 'Verified' && (
              <View style={styles.verifiedTag}>
                <ShieldCheck size={12} color={colors.semantic.success} />
                <Text style={styles.verifiedTagText}>Verified</Text>
              </View>
            )}
            {item.stage === 'To verify' && isFiler && (
              <View style={styles.guardTag}>
                <ShieldAlert size={12} color={colors.semantic.danger} />
                <Text style={styles.guardTagText}>4-Eyes Guard: Your filing</Text>
              </View>
            )}
          </View>

          {/* Access & Dispatch Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.accessBadge}>
              <Lock size={11} color={colors.text.tertiary} />
              <Text style={styles.accessText}>
                {accessLabel(item.record.access, item.record.links, [])}
              </Text>
            </View>
            {hasOriginal && (
              <View style={styles.dispatchPill}>
                <Truck size={11} color={colors.semantic.info} />
                <Text style={styles.dispatchPillText}>
                  {item.record.dispatch?.status === 'Dispatched' ? 'In Transit' : item.record.dispatch?.status}
                </Text>
              </View>
            )}
            <ChevronRight size={16} color={colors.text.tertiary} />
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderOtherCard = ({ item }: { item: DocumentItem }) => {
    return (
      <Card style={styles.docCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.refText}>{item.docNo}</Text>
          <StatusBadge status={item.isVerified ? 'Verified' : 'Pending'} size="small" />
        </View>

        <Text style={styles.docTitle}>{item.title}</Text>
        <Text style={styles.metaProject}>{item.category} • Project {item.projectCode}</Text>

        <View style={styles.custodyRow}>
          <Text style={styles.custodyText}>
            Uploaded: {item.uploadDate} by {item.uploaderName}
          </Text>
          <View style={styles.accessBadge}>
            <Lock size={11} color={colors.text.tertiary} />
            <Text style={styles.accessText}>{item.confidentiality}</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Documents Register"
        subtitle={`${govtDocuments.length} EDMS records • ${scanInbox.length} in scan inbox`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={

          <TouchableOpacity
            style={styles.headerFilterBtn}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={18} color={activeFilterCount > 0 ? colors.primary : colors.text.secondary} />
            {activeFilterCount > 0 && <View style={styles.filterDot} />}
          </TouchableOpacity>
        }
      />

      {/* View Switch: Government EDMS vs Other Documents */}
      <View style={styles.viewTabs}>
        <TouchableOpacity
          style={[styles.viewTab, activeView === 'Government documents' && styles.viewTabActive]}
          onPress={() => setActiveView('Government documents')}
        >
          <Text style={[styles.viewTabText, activeView === 'Government documents' && styles.viewTabTextActive]}>
            Government documents ({govtDocuments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewTab, activeView === 'Other documents' && styles.viewTabActive]}
          onPress={() => setActiveView('Other documents')}
        >
          <Text style={[styles.viewTabText, activeView === 'Other documents' && styles.viewTabTextActive]}>
            Other documents ({documents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search size={16} color={colors.text.tertiary} style={{ marginRight: spacing.xs }} />
        <Input
          placeholder={
            activeView === 'Government documents'
              ? 'Search letter title, ref, client, or lease...'
              : 'Search files, projects...'
          }
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Pipeline Stage Tabs for Government Documents */}
      {activeView === 'Government documents' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageTabsContainer}
        >
          {STAGE_FILTERS.map((stage) => {
            const count =
              stage === 'All'
                ? govtDocuments.length
                : govtDocuments.filter((d) => d.stage === stage).length;
            const isSelected = selectedStage === stage;

            return (
              <TouchableOpacity
                key={stage}
                style={[styles.stagePill, isSelected && styles.stagePillActive]}
                onPress={() => setSelectedStage(stage)}
              >
                <Text style={[styles.stagePillText, isSelected && styles.stagePillTextActive]}>
                  {stage}
                </Text>
                <View style={[styles.stagePillBadge, isSelected && styles.stagePillBadgeActive]}>
                  <Text style={[styles.stagePillBadgeText, isSelected && styles.stagePillBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Document List */}
      {activeView === 'Government documents' ? (
        <FlatList
          data={filteredGovtDocs}
          keyExtractor={(item) => item.id}
          renderItem={renderGovtCard}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refreshGovtDocuments}
          ListEmptyComponent={
            <EmptyState
              icon={<FileText size={48} color={colors.text.tertiary} />}
              title="No documents match"
              description="Try adjusting your search criteria or selected stage filters."
            />
          }
        />
      ) : (
        <FlatList
          data={filteredOtherDocs}
          keyExtractor={(item) => item.id}
          renderItem={renderOtherCard}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refreshGovtDocuments}
          ListEmptyComponent={
            <EmptyState
              icon={<FileText size={48} color={colors.text.tertiary} />}
              title="No documents found"
              description="No auxiliary documents matching your search."
            />
          }
        />
      )}

      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Documents</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Document Kind Filter */}
              <Text style={styles.filterSectionTitle}>Document Kind</Text>
              <View style={styles.filterOptionsGrid}>
                {['All kinds', ...DOC_KINDS].map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={[styles.filterChip, selectedKind === k && styles.filterChipActive]}
                    onPress={() => setSelectedKind(k)}
                  >
                    <Text style={[styles.filterChipText, selectedKind === k && styles.filterChipTextActive]}>
                      {k}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Access Grants Filter */}
              <Text style={styles.filterSectionTitle}>Portal Access</Text>
              <View style={styles.filterOptionsGrid}>
                {['Any access', 'Client can see', 'Vendor can see', 'Office only'].map((acc) => (
                  <TouchableOpacity
                    key={acc}
                    style={[styles.filterChip, selectedAccess === acc && styles.filterChipActive]}
                    onPress={() => setSelectedAccess(acc)}
                  >
                    <Text style={[styles.filterChipText, selectedAccess === acc && styles.filterChipTextActive]}>
                      {acc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Reset Filters"
                variant="secondary"
                onPress={() => {
                  setSelectedKind('All kinds');
                  setSelectedAccess('Any access');
                  setShowFilterModal(false);
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Apply Filters"
                variant="primary"
                onPress={() => setShowFilterModal(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerFilterBtn: {
    padding: spacing.xs,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  viewTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.background.secondary,
  },
  viewTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  viewTabActive: {
    borderBottomColor: colors.primary,
  },
  viewTabText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  viewTabTextActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: spacing.xs,
  },
  stageTabsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  stagePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stagePillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  stagePillTextActive: {
    color: colors.text.inverse,
  },
  stagePillBadge: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },

  stagePillBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  stagePillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  stagePillBadgeTextActive: {
    color: colors.text.inverse,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  docCard: {
    marginBottom: spacing.xs,
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
    gap: 4,
    flex: 1,
    marginRight: spacing.sm,
  },
  refText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  kindText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  docTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  metaCompany: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  metaDot: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  metaProject: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  metaDate: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  custodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    marginTop: spacing.xs,
  },
  custodyText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: `${colors.semantic.success}12`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  verifiedTagText: {
    fontSize: 10,
    color: colors.semantic.success,
    fontWeight: '700',
  },
  guardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: `${colors.semantic.danger}12`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  guardTagText: {
    fontSize: 10,
    color: colors.semantic.danger,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accessText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  dispatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${colors.semantic.info}12`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  dispatchPillText: {
    fontSize: 10,
    color: colors.semantic.info,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalScroll: {
    marginBottom: spacing.md,
  },
  filterSectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },

  filterChipActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
