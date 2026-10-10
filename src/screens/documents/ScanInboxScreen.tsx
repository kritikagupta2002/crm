import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useCrm, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, Input, EmptyState } from '../../components';
import { ScanItem, GovtDocument } from '../../types';
import {
  FileScan,
  Upload,
  FileInput,
  X,
  Eye,
  CheckCircle2,
  Trash2,
  HardDrive,
  Clock,
  Layers,
  Building,
  ChevronRight,
} from 'lucide-react-native';
import { SCAN_FOLDER, DOC_KINDS, STAGE_TONE } from '../../constants';

export const ScanInboxScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    scanInbox,
    projects,
    vendors,
    documents,
    govtDocuments,
    addScans,
    discardScan,
    fileScanToProject,
  } = useCrm();
  const { session } = useAuth();
  const currentUserName = (session as any)?.name || (session as any)?.contactPerson || 'Active User';

  const [activeScan, setActiveScan] = useState<ScanItem | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [leaseNo, setLeaseNo] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [letterTitle, setLetterTitle] = useState('');
  const [letterRef, setLetterRef] = useState('');
  const [letterDate, setLetterDate] = useState(new Date().toISOString().split('T')[0]);
  const [letterKind, setLetterKind] = useState<string>(DOC_KINDS[0]);
  const [isFiling, setIsFiling] = useState(false);

  const [justFiledDoc, setJustFiledDoc] = useState<{ id: string; title: string } | null>(null);

  const [previewScan, setPreviewScan] = useState<ScanItem | null>(null);

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const recentFiled = govtDocuments
    .filter((d) => d.record.filedAt >= weekAgo)
    .sort((a, b) => b.record.filedAt.localeCompare(a.record.filedAt))
    .slice(0, 5);

  const handleSimulateNewScan = async () => {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const mockFiles = [
      {
        name: `SCAN_${timestamp}_001.pdf`,
        size: 1024 * (400 + Math.floor(Math.random() * 800)),
        type: 'application/pdf',
      },
    ];
    await addScans(mockFiles, 'Office Scanner');
    Alert.alert('Scan Ingested', `Received ${mockFiles[0].name} from scanner network folder.`);
  };

  const handleOpenFileModal = (scan: ScanItem) => {
    setActiveScan(scan);
    setJustFiledDoc(null);

    setSelectedProjectId(projects[0]?.id || '');
    setLetterTitle('');
    setLetterRef(`DMG/RAJ/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}/L-1`);
    setLetterDate(new Date().toISOString().split('T')[0]);
    setLeaseNo('');
    setVendorId('');
    setLetterKind('Letter');
  };

  const handleConfirmFiling = async () => {
    if (!activeScan) return;
    if (!selectedProjectId) {
      Alert.alert('Project Required', 'Please assign the document to an active project.');
      return;
    }
    if (!letterTitle.trim() || !letterRef.trim()) {
      Alert.alert('Incomplete Form', 'Please provide Document Title and Reference Number.');
      return;
    }

    try {
      setIsFiling(true);
      const targetProject = projects.find((p) => p.id === selectedProjectId);
      const authority = (targetProject as any)?.lead?.company || 'Department of Mines & Geology';

      const filedDoc = await fileScanToProject(
        activeScan.id,
        selectedProjectId,
        {
          title: letterTitle.trim(),
          ref: letterRef.trim(),
          date: letterDate,
          authority,
          kind: letterKind,
          links: {
            leaseNo: leaseNo.trim() || undefined,
            vendorId: vendorId || undefined,
          },
        },
        currentUserName
      );

      setActiveScan(null);
      setJustFiledDoc({ id: filedDoc.id, title: filedDoc.letter.title });
      Alert.alert('Filed Successfully', `${filedDoc.letter.title} filed to ${selectedProjectId}. Now in verification queue.`);
    } catch (e: any) {
      Alert.alert('Filing Error', e.message);
    } finally {
      setIsFiling(false);
    }
  };

  const handleDiscard = (scan: ScanItem) => {
    Alert.alert(
      'Discard Scan',
      `Are you sure ${scan.name} is not an official government letter? It will be removed from the ingestion queue.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await discardScan(scan.id);
          },
        },
      ]
    );
  };

  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  const renderScanItem = ({ item }: { item: ScanItem }) => (
    <Card style={styles.scanCard}>
      <View style={styles.scanCardRow}>
        <View style={styles.scanIconWrap}>
          <FileScan size={22} color={colors.primary} />
        </View>
        <View style={styles.scanInfo}>
          <Text style={styles.scanName}>{item.name}</Text>
          <Text style={styles.scanMeta}>
            {item.scanner || 'Scanner'} • {item.scannedAt.slice(0, 10)} {new Date(item.scannedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.scanSub}>
            {formatSize(item.size)} • {item.pages || 2} pages
          </Text>
        </View>
      </View>

      <View style={styles.scanActionsRow}>
        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => setPreviewScan(item)}
        >
          <Eye size={15} color={colors.text.secondary} />
          <Text style={styles.actionIconBtnText}>Inspect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => handleDiscard(item)}
        >
          <Trash2 size={15} color={colors.semantic.danger} />
          <Text style={[styles.actionIconBtnText, { color: colors.semantic.danger }]}>Not a letter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fileBtn}
          onPress={() => handleOpenFileModal(item)}
        >
          <FileInput size={15} color={colors.text.inverse} />
          <Text style={styles.fileBtnText}>File to Project</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="Scan Ingestion Inbox"
        subtitle={`${scanInbox.length} raw scans waiting`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={

          <TouchableOpacity style={styles.headerAddBtn} onPress={handleSimulateNewScan}>
            <Upload size={18} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.folderRibbon}>
        <HardDrive size={14} color={colors.text.secondary} />
        <Text style={styles.folderRibbonText} numberOfLines={1}>
          Watch Folder: <Text style={styles.monoPath}>{SCAN_FOLDER}</Text>
        </Text>
      </View>

      {justFiledDoc && (
        <View style={styles.filedSuccessBanner}>
          <CheckCircle2 size={18} color={colors.semantic.success} />
          <View style={styles.filedSuccessTextWrap}>
            <Text style={styles.filedSuccessTitle}>{justFiledDoc.title} is filed</Text>
            <Text style={styles.filedSuccessSub}>It has moved to Verification (4-Eyes Review)</Text>
          </View>
          <TouchableOpacity
            style={styles.openFiledBtn}
            onPress={() => navigation.navigate('DocumentDetail', { docId: justFiledDoc.id })}
          >
            <Text style={styles.openFiledBtnText}>Open →</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={scanInbox}
        keyExtractor={(item) => item.id}
        renderItem={renderScanItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderTitle}>Scans Waiting to be Filed</Text>
              <Button
                title="+ Ingest Scan"
                variant="outline"
                size="small"
                onPress={handleSimulateNewScan}
              />
            </View>
          </View>
        }
        ListFooterComponent={
          recentFiled.length > 0 ? (
            <View style={styles.recentSection}>
              <Text style={styles.recentSectionTitle}>Filed This Week ({recentFiled.length})</Text>
              {recentFiled.map((d) => (
                <TouchableOpacity
                  key={`recent-${d.id}`}
                  style={styles.recentRow}
                  onPress={() => navigation.navigate('DocumentDetail', { docId: d.id })}
                >
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentTitle}>{d.letter.title}</Text>
                    <Text style={styles.recentMeta}>
                      {d.lead.company} • {d.project.id} • Filed by {d.record.filedBy}
                    </Text>
                  </View>
                  <StatusBadge status={d.rescan ? 'Rescan needed' : d.stage} size="small" />
                  <ChevronRight size={14} color={colors.text.tertiary} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={<CheckCircle2 size={48} color={colors.semantic.success} />}
            title="Scan inbox is clear"
            description="Every scan in the NAS folder has been filed to its project. Incoming scanned letters will appear here."
          />
        }
      />

      <Modal statusBarTranslucent
        visible={Boolean(activeScan)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveScan(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeadRow}>
              <Text style={styles.modalTitle}>File {activeScan?.name}</Text>
              <TouchableOpacity onPress={() => setActiveScan(null)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>1. Select Target Project *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectScroll}>
                {projects.map((p) => {
                  const isSelected = selectedProjectId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.projectChip, isSelected && styles.projectChipActive]}
                      onPress={() => setSelectedProjectId(p.id)}
                    >
                      <Text style={[styles.projectChipCode, isSelected && styles.projectChipCodeActive]}>
                        {p.id}
                      </Text>
                      <Text
                        style={[styles.projectChipName, isSelected && styles.projectChipNameActive]}
                        numberOfLines={1}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Input
                label="Letter Title *"
                placeholder="e.g. Permission for DGPS boundary pillar survey"
                value={letterTitle}
                onChangeText={setLetterTitle}
              />

              <Input
                label="Reference Number *"
                placeholder="e.g. DMG/RAJ/2026/8460/P-1"
                value={letterRef}
                onChangeText={setLetterRef}
              />

              <Input
                label="Letter Date (YYYY-MM-DD) *"
                value={letterDate}
                onChangeText={setLetterDate}
              />

              <Text style={styles.inputLabel}>Document Kind:</Text>
              <View style={styles.kindChipRow}>
                {DOC_KINDS.map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={[styles.kindChip, letterKind === k && styles.kindChipActive]}
                    onPress={() => setLetterKind(k)}
                  >
                    <Text style={[styles.kindChipText, letterKind === k && styles.kindChipTextActive]}>
                      {k}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Mining Lease No. (Optional)"
                placeholder="e.g. ML 17/2004"
                value={leaseNo}
                onChangeText={setLeaseNo}
              />

              <Text style={styles.inputLabel}>Subcontractor Vendor (Optional):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vendorScroll}>
                <TouchableOpacity
                  style={[styles.vendorChip, !vendorId && styles.vendorChipActive]}
                  onPress={() => setVendorId('')}
                >
                  <Text style={[styles.vendorChipText, !vendorId && styles.vendorChipTextActive]}>
                    None
                  </Text>
                </TouchableOpacity>
                {vendors.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.vendorChip, vendorId === v.id && styles.vendorChipActive]}
                    onPress={() => setVendorId(v.id)}
                  >
                    <Text style={[styles.vendorChipText, vendorId === v.id && styles.vendorChipTextActive]}>
                      {v.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setActiveScan(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="File to Project"
                variant="primary"
                loading={isFiling}
                onPress={handleConfirmFiling}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal statusBarTranslucent
        visible={Boolean(previewScan)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewScan(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeadRow}>
              <Text style={styles.modalTitle}>Scan Inspection</Text>
              <TouchableOpacity onPress={() => setPreviewScan(null)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.scanInspectCanvas}>
              <FileScan size={56} color={colors.primary} />
              <Text style={styles.inspectName}>{previewScan?.name}</Text>
              <Text style={styles.inspectMeta}>
                Source: {previewScan?.scanner || 'Network Scanner'}
              </Text>
              <Text style={styles.inspectMeta}>
                Scanned: {previewScan?.scannedAt}
              </Text>
              <Text style={styles.inspectMeta}>
                Size: {previewScan ? formatSize(previewScan.size) : ''} • {previewScan?.pages || 2} Pages
              </Text>
              <Text style={styles.inspectPath}>{SCAN_FOLDER}\{previewScan?.name}</Text>
            </View>

            <Button title="Done" variant="primary" onPress={() => setPreviewScan(null)} />
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
  headerAddBtn: {
    padding: spacing.xs,
  },
  folderRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  folderRibbonText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  monoPath: {
    fontFamily: 'monospace',
    color: colors.primary,
    fontWeight: '600',
  },
  filedSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.semantic.success}15`,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.semantic.success}40`,
  },
  filedSuccessTextWrap: {
    flex: 1,
  },
  filedSuccessTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.semantic.success,
  },
  filedSuccessSub: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  openFiledBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.semantic.success,
    borderRadius: borderRadius.sm,
  },
  openFiledBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  listHeader: {
    marginBottom: spacing.xs,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listHeaderTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  scanCard: {
    gap: spacing.sm,
  },
  scanCardRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  scanIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanInfo: {
    flex: 1,
  },
  scanName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scanMeta: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  scanSub: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
    marginTop: 1,
  },
  scanActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
  },
  actionIconBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  fileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  fileBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  recentSection: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  recentSectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  recentMeta: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
  },
  modalScroll: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  projectScroll: {
    marginBottom: spacing.sm,
  },
  projectChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginRight: spacing.xs,
  },
  projectChipActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  projectChipCode: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  projectChipCodeActive: {
    color: colors.primary,
  },
  projectChipName: {
    fontSize: 10,
    color: colors.text.tertiary,
    maxWidth: 120,
  },
  projectChipNameActive: {
    color: colors.primary,
  },
  kindChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  kindChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
  },
  kindChipActive: {
    backgroundColor: colors.primary,
  },
  kindChipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  kindChipTextActive: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  vendorScroll: {
    marginBottom: spacing.sm,
  },
  vendorChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    marginRight: spacing.xs,
  },

  vendorChipActive: {
    backgroundColor: colors.primary,
  },
  vendorChipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  vendorChipTextActive: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  scanInspectCanvas: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
    gap: spacing.xs,
  },
  inspectName: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  inspectMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  inspectPath: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: spacing.xs,
  },
});
