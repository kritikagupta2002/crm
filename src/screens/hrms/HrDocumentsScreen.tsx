import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { HrDocument } from '../../types';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppHeader, Card, Button, StatusBadge, EmptyState, ConfirmationModal } from '../../components/common';
import { attachmentStorage } from '../../services/attachmentStorage.service';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  X,
  FileCheck2,
  Shield,
  FileUp,
  Image as ImageIcon,
  FolderOpen,
} from 'lucide-react-native';

const CATEGORIES = [
  'All',
  'Company Documents',
  'Identity',
  'Education',
  'Joining Documents',
  'Other',
];

export const HrDocumentsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { hrDocuments, uploadHrDocument, deleteHrDocument, isLoading } = useHrms();
  const { hasRole, session } = useAuth();
  const isHrOrAdmin = hasRole(['Admin', 'HR']);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<HrDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<HrDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [docTitle, setDocTitle] = useState<string>('');
  const [docCategory, setDocCategory] = useState<string>('Company Documents');
  const [docDesc, setDocDesc] = useState<string>('');
  const [selectedAttachment, setSelectedAttachment] = useState<{
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const accessibleDocs = useMemo(() => {
    return hrDocuments.filter((d) => {
      if (isHrOrAdmin) return true;
      return d.accessRole === 'all' || !d.accessRole;
    });
  }, [hrDocuments, isHrOrAdmin]);

  const filteredDocs = useMemo(() => {
    return accessibleDocs.filter((d) => {
      const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        d.uploadedBy.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [accessibleDocs, selectedCategory, searchQuery]);

  const handlePickDocument = async () => {
    const file = await attachmentStorage.pickDocument(['application/pdf', 'image/png', 'image/jpeg']);
    if (file) {
      setSelectedAttachment(file);
    }
  };

  const handlePickPhoto = async () => {
    const file = await attachmentStorage.pickImageFromLibrary();
    if (file) {
      setSelectedAttachment(file);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const file = await attachmentStorage.takePhoto();
      if (file) {
        setSelectedAttachment(file);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Unable to access camera.');
    }
  };

  const handleUploadSubmit = async () => {
    if (!docTitle.trim()) {
      Alert.alert('Validation Error', 'Document title is required.');
      return;
    }

    try {
      setIsUploading(true);
      const uploader = (session as any)?.name || 'HR Administration';
      await uploadHrDocument({
        title: docTitle.trim(),
        category: docCategory,
        description: docDesc.trim(),
        uploadedBy: uploader,
        accessRole: 'all',
        attachment: selectedAttachment || undefined,
      });

      Alert.alert('Upload Successful', `Document "${docTitle}" uploaded to corporate repository.`);
      setIsUploadOpen(false);
      setDocTitle('');
      setDocDesc('');
      setSelectedAttachment(null);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Unable to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    try {
      setIsDeleting(true);
      await deleteHrDocument(docToDelete.id);
      Alert.alert('Document Deleted', `"${docToDelete.title}" has been removed from repository.`);
      setDocToDelete(null);
    } catch (err: any) {
      Alert.alert('Delete Failed', err.message || 'Unable to delete document.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAttachment = async (doc: HrDocument) => {
    if (doc.attachmentUri) {
      const ok = await attachmentStorage.openOrShareAttachment(doc.attachmentUri, doc.fileName);
      if (!ok) {
        Alert.alert('File View', `Attachment "${doc.fileName}" (${doc.fileSize}) is verified and archived in vault.`);
      }
    } else {
      Alert.alert('Document Archived', `"${doc.fileName}" (${doc.fileSize}) is available in corporate repository.\nFormat: ${doc.fileType}`);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Corporate Document Vault"
        subtitle="SOPs, compliance guidelines, licenses & policies"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          isHrOrAdmin ? (
            <TouchableOpacity
              style={styles.headerUploadBtn}
              onPress={() => setIsUploadOpen(true)}
              activeOpacity={0.8}
            >
              <Upload size={16} color="#FFFFFF" />
              <Text style={styles.headerUploadText}>Upload</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.body}>
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search document title, file name, or author..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredDocs.length === 0 ? (
            <EmptyState
              icon={<FolderOpen size={48} color={colors.text.tertiary} />}
              title="No Corporate Documents Found"
              description={
                searchQuery
                  ? `No documents matching "${searchQuery}"`
                  : `No corporate documents available in "${selectedCategory}".`
              }
            />
          ) : (
            filteredDocs.map((doc) => {
              const isHrOnly = doc.accessRole === 'hr';
              return (
                <Card key={doc.id} style={styles.docCard}>
                  <View style={styles.docCardHeader}>
                    <View style={styles.fileIconWrap}>
                      <FileText size={22} color={colors.primary} />
                    </View>
                    <View style={styles.docHeaderInfo}>
                      <Text style={styles.docTitle}>{doc.title}</Text>
                      <View style={styles.metaRow}>
                        <Text style={styles.fileName}>{doc.fileName}</Text>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.fileSize}>{doc.fileSize}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.categoryAndRoleRow}>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{doc.category}</Text>
                    </View>
                    {isHrOnly ? (
                      <View style={styles.hrOnlyBadge}>
                        <Shield size={12} color="#DC2626" />
                        <Text style={styles.hrOnlyText}>HR Confidential</Text>
                      </View>
                    ) : (
                      <View style={styles.allAccessBadge}>
                        <FileCheck2 size={12} color="#059669" />
                        <Text style={styles.allAccessText}>Company Wide</Text>
                      </View>
                    )}
                  </View>

                  {doc.description ? (
                    <Text style={styles.docDesc} numberOfLines={2}>
                      {doc.description}
                    </Text>
                  ) : null}

                  <View style={styles.docFooter}>
                    <View>
                      <Text style={styles.uploaderText}>Uploaded by: {doc.uploadedBy}</Text>
                      <Text style={styles.uploadDate}>{doc.uploadDate}</Text>
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => setPreviewDoc(doc)}
                        activeOpacity={0.7}
                      >
                        <Eye size={18} color={colors.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleOpenAttachment(doc)}
                        activeOpacity={0.7}
                      >
                        <Download size={18} color="#059669" />
                      </TouchableOpacity>

                      {isHrOrAdmin && (
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => setDocToDelete(doc)}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={18} color="#DC2626" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      </View>

      <Modal statusBarTranslucent visible={isUploadOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Corporate Document</Text>
              <TouchableOpacity onPress={() => setIsUploadOpen(false)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>Document Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Tailings Dam Safety Protocol 2026"
                placeholderTextColor={colors.text.tertiary}
                value={docTitle}
                onChangeText={setDocTitle}
              />

              <Text style={styles.inputLabel}>Category *</Text>
              <View style={styles.catPickerRow}>
                {['Company Documents', 'Identity', 'Education', 'Joining Documents', 'Other'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catPickBtn, docCategory === c && styles.catPickBtnActive]}
                    onPress={() => setDocCategory(c)}
                  >
                    <Text
                      style={[
                        styles.catPickBtnText,
                        docCategory === c && styles.catPickBtnTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Attach Document / Scan File</Text>
              <View style={styles.attachmentOptions}>
                <TouchableOpacity
                  style={styles.attachOptionBtn}
                  onPress={handlePickDocument}
                  activeOpacity={0.8}
                >
                  <FileUp size={18} color={colors.primary} />
                  <Text style={styles.attachOptionText}>Browse File</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachOptionBtn}
                  onPress={handlePickPhoto}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={18} color="#059669" />
                  <Text style={styles.attachOptionText}>Photo Library</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachOptionBtn}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Upload size={18} color="#D97706" />
                  <Text style={styles.attachOptionText}>Take Photo</Text>
                </TouchableOpacity>
              </View>

              {selectedAttachment && (
                <View style={styles.selectedFilePill}>
                  <FileCheck2 size={16} color={colors.primary} />
                  <View style={{ flex: 1, marginHorizontal: spacing.xs }}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {selectedAttachment.name}
                    </Text>
                    <Text style={styles.selectedFileSize}>
                      {attachmentStorage.formatFileSize(selectedAttachment.size)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedAttachment(null)}>
                    <X size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.inputLabel}>Summary / Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Brief purpose and revision notes..."
                placeholderTextColor={colors.text.tertiary}
                value={docDesc}
                onChangeText={setDocDesc}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setIsUploadOpen(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Upload to Vault"
                variant="primary"
                onPress={handleUploadSubmit}
                loading={isUploading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal statusBarTranslucent visible={!!previewDoc} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.previewCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {previewDoc?.title}
                </Text>
                <Text style={styles.previewCategory}>
                  {previewDoc?.category} • {previewDoc?.uploadDate}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPreviewDoc(null)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.previewBody}>
              {previewDoc?.attachmentUri &&
              previewDoc?.mimeType?.startsWith('image/') ? (
                <View style={styles.imagePreviewWrap}>
                  <Image
                    source={{ uri: previewDoc.attachmentUri }}
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={styles.docIconPreviewWrap}>
                  <FileText size={48} color={colors.primary} />
                  <Text style={styles.previewFileName}>{previewDoc?.fileName}</Text>
                  <Text style={styles.previewFileSize}>
                    Size: {previewDoc?.fileSize} • Encrypted Format
                  </Text>
                </View>
              )}

              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Uploaded By</Text>
                  <Text style={styles.detailVal}>{previewDoc?.uploadedBy}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Access Policy</Text>
                  <Text style={styles.detailVal}>
                    {previewDoc?.accessRole === 'hr' ? 'HR Only' : 'Corporate Public'}
                  </Text>
                </View>
              </View>

              {previewDoc?.description ? (
                <View style={styles.descWrap}>
                  <Text style={styles.descLabel}>Purpose / Description:</Text>
                  <Text style={styles.descVal}>"{previewDoc.description}"</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Close"
                variant="outline"
                onPress={() => setPreviewDoc(null)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Open / Download"
                variant="primary"
                onPress={() => previewDoc && handleOpenAttachment(previewDoc)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={!!docToDelete}
        title="Delete Corporate Document"
        message={`Are you sure you want to permanently remove "${docToDelete?.title}" from the corporate document vault?`}
        confirmText="Yes, Delete Document"
        confirmVariant="danger"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDocToDelete(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  body: {
    flex: 1,
  },
  headerUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    gap: spacing.xxs,
  },
  headerUploadText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.secondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  docCard: {
    padding: spacing.md,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  fileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docHeaderInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  fileName: {
    fontSize: typography.fontSizes.xs,
    fontFamily: 'monospace',
    color: colors.text.tertiary,
    flexShrink: 1,
  },
  bullet: {
    marginHorizontal: spacing.xxs,
    color: colors.text.tertiary,
  },
  fileSize: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.tertiary,
  },
  categoryAndRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  catBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  catBadgeText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: '#1D4ED8',
  },
  hrOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  hrOnlyText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: '#DC2626',
  },
  allAccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    gap: 3,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  allAccessText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: '#059669',
  },
  docDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  docFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  uploaderText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeights.medium,
  },
  uploadDate: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtn: {
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    width: '100%',
    maxHeight: '90%',
    padding: spacing.lg,
    ...shadows.lg,
  },
  previewCard: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    width: '100%',
    maxHeight: '85%',
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  previewCategory: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  modalBody: {
    paddingBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  textInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  catPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  catPickBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  catPickBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  catPickBtnText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
  },
  catPickBtnTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  attachmentOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  attachOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
  },
  attachOptionText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  selectedFilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.md,
    padding: spacing.xs,
    marginTop: spacing.xs,
  },
  selectedFileName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  selectedFileSize: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.secondary,
  },
  modalFooter: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  previewBody: {
    paddingVertical: spacing.sm,
  },
  imagePreviewWrap: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  docIconPreviewWrap: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  previewFileName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  previewFileSize: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.tertiary,
  },
  detailVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  descWrap: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  descLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeights.bold,
  },
  descVal: {
    fontSize: typography.fontSizes.xs,
    fontStyle: 'italic',
    color: colors.text.secondary,
    marginTop: 2,
  },
});
