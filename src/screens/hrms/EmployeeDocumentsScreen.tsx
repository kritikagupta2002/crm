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
import { EmployeeDocumentRecord } from '../../types';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppHeader, Card, StatCard, Button, StatusBadge, EmptyState } from '../../components/common';
import { attachmentStorage } from '../../services/attachmentStorage.service';
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Filter,
  ShieldCheck,
  Award,
  RotateCcw,
  Search,
  X,
  FileUp,
  Image as ImageIcon,
  User,
  Building2,
  Calendar,
  ChevronDown,
} from 'lucide-react-native';

const DOCUMENT_TYPES = [
  { label: 'Aadhaar Card (UIDAI)', value: 'Aadhaar Card' },
  { label: 'PAN Card (Income Tax Dept)', value: 'PAN Card' },
  { label: 'Degree / Academic Diploma', value: 'Degree / Diploma' },
  { label: 'DGMS Mining Competency Certificate', value: 'DGMS Mining Competency' },
  { label: 'DGCA UAV Drone Pilot License', value: 'UAV Remote Pilot License' },
  { label: 'Official Appointment Letter', value: 'Appointment Letter' },
  { label: 'Confidentiality & NDA Agreement', value: 'NDA Agreement' },
];

const DEPARTMENTS = [
  'All Departments',
  'Geology & Mineral Exploration',
  'Mining & Mine Planning',
  'GIS & Remote Sensing',
  'Hydrogeology & Groundwater',
  'Finance & Accounts',
  'Human Resources & Admin',
  'Executive Board',
];

const STATUS_FILTERS = ['All Statuses', 'Verified', 'Pending Review'];

export const EmployeeDocumentsScreen: React.FC<{ route?: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const initialEmpId = route?.params?.employeeId;
  const initialFilterType = route?.params?.filterType;

  const {
    employees,
    employeeDocuments,
    uploadEmployeeDocument,
    verifyEmployeeDocument,
    deleteEmployeeDocument,
    refreshDocuments,
  } = useHrms();
  const { hasRole, session, userRole } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR']);
  const isEmployee = !isHrOrAdmin;

  const activeEmpId =
    session?.accountType === 'team'
      ? (session as any).employeeId || 'BGS-2023-044'
      : 'BGS-2021-001';
  const activeEmpName = (session as any)?.name || 'Team Member';
  const activeEmpDept = (session as any)?.department || 'Geology & Mineral Exploration';

  const [selectedDept, setSelectedDept] = useState<string>('All Departments');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [targetEmpId, setTargetEmpId] = useState<string>(initialEmpId || '');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<EmployeeDocumentRecord | null>(null);

  const [uploadEmpId, setUploadEmpId] = useState<string>(
    isEmployee ? activeEmpId : (initialEmpId || '')
  );
  const [uploadDocType, setUploadDocType] = useState<string>(initialFilterType || 'Aadhaar Card');
  const [uploadExpiryDate, setUploadExpiryDate] = useState<string>('');
  const [selectedAttachment, setSelectedAttachment] = useState<{
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [deptPickerVisible, setDeptPickerVisible] = useState<boolean>(false);
  const [statusPickerVisible, setStatusPickerVisible] = useState<boolean>(false);
  const [empPickerVisible, setEmpPickerVisible] = useState<boolean>(false);
  const [typePickerVisible, setTypePickerVisible] = useState<boolean>(false);

  const kpiRecords = useMemo(() => {
    if (isEmployee) {
      return employeeDocuments.filter(
        (r) =>
          r.employeeId === activeEmpId ||
          (activeEmpName && r.employeeName?.toLowerCase() === activeEmpName.toLowerCase())
      );
    }
    if (targetEmpId) {
      return employeeDocuments.filter((r) => r.employeeId === targetEmpId);
    }
    return employeeDocuments;
  }, [employeeDocuments, isEmployee, activeEmpId, activeEmpName, targetEmpId]);

  const filteredRecords = useMemo(() => {
    return kpiRecords.filter((rec) => {
      const matchesDept =
        isEmployee || selectedDept === 'All Departments' || rec.department === selectedDept;
      const matchesStatus =
        selectedStatus === 'All Statuses' || rec.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        rec.employeeName.toLowerCase().includes(q) ||
        rec.employeeId.toLowerCase().includes(q) ||
        rec.documentType.toLowerCase().includes(q) ||
        rec.fileName.toLowerCase().includes(q);
      return matchesDept && matchesStatus && matchesSearch;
    });
  }, [kpiRecords, isEmployee, selectedDept, selectedStatus, searchQuery]);

  const verifiedCount = useMemo(
    () => kpiRecords.filter((r) => r.status === 'Verified').length,
    [kpiRecords]
  );
  const pendingCount = useMemo(
    () => kpiRecords.filter((r) => r.status === 'Pending Review').length,
    [kpiRecords]
  );
  const statutoryLicenseCount = useMemo(
    () =>
      kpiRecords.filter(
        (r) => r.documentType.includes('DGMS') || r.documentType.includes('Pilot')
      ).length,
    [kpiRecords]
  );

  const handlePickDocument = async () => {
    const file = await attachmentStorage.pickDocument([
      'application/pdf',
      'image/png',
      'image/jpeg',
    ]);
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
    const effectiveEmpId = isEmployee ? activeEmpId : uploadEmpId;
    if (!effectiveEmpId) {
      Alert.alert('Validation Error', 'Please select an employee.');
      return;
    }

    const emp = employees.find(
      (e) => e.id === effectiveEmpId || e.employeeId === effectiveEmpId
    );

    const isStatutoryLicense =
      uploadDocType.includes('DGMS') || uploadDocType.includes('Pilot');
    if (isStatutoryLicense && !uploadExpiryDate.trim()) {
      Alert.alert(
        'Validation Error',
        'Certificate validity expiry date is required for statutory DGMS certificates and DGCA drone licenses.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await uploadEmployeeDocument({
        employeeId: isEmployee ? activeEmpId : (emp?.employeeId || effectiveEmpId),
        employeeName: isEmployee ? activeEmpName : (emp?.name || 'Staff Member'),
        department: isEmployee
          ? activeEmpDept
          : (emp?.employment?.department || 'Operations'),
        documentType: uploadDocType,
        expiryDate: uploadExpiryDate.trim() || undefined,
        attachment: selectedAttachment || undefined,
      });

      Alert.alert(
        'Document Submitted',
        'Employee document uploaded and queued for HR verification.'
      );
      setIsUploadModalOpen(false);
      setSelectedAttachment(null);
      setUploadExpiryDate('');
      await refreshDocuments();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Unable to upload document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (docId: string) => {
    if (isEmployee) {
      Alert.alert('Access Denied', 'Only HR and Admin personnel can verify documents.');
      return;
    }
    try {
      await verifyEmployeeDocument(docId);
      Alert.alert('Compliance Verified', 'Document marked as Verified & Compliant.');
      setSelectedDoc(null);
      await refreshDocuments();
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Unable to verify document.');
    }
  };

  const handleOpenAttachment = async (doc: EmployeeDocumentRecord) => {
    if (doc.attachmentUri) {
      const ok = await attachmentStorage.openOrShareAttachment(doc.attachmentUri, doc.fileName);
      if (!ok) {
        Alert.alert(
          'Document Preview',
          `Credential "${doc.fileName}" (${doc.fileSize}) is verified in the employee vault.`
        );
      }
    } else {
      Alert.alert(
        'Document Dossier',
        `"${doc.fileName}" (${doc.fileSize})\nValidity: ${doc.expiryDate ? 'Expires on ' + doc.expiryDate : 'Lifetime Validity'}\nStatus: ${doc.status}`
      );
    }
  };

  const resetFilters = () => {
    setSelectedDept('All Departments');
    setSelectedStatus('All Statuses');
    setSearchQuery('');
    setTargetEmpId('');
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={isEmployee ? 'My Documents & Credentials' : 'Employee Documents'}
        subtitle={
          isEmployee
            ? 'Your verified identity proofs, certificates & licenses'
            : targetEmpId
            ? `Dossier for employee ${targetEmpId}`
            : 'Repository of employee Aadhaar, PAN & credentials'
        }
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.headerUploadBtn}
            onPress={() => setIsUploadModalOpen(true)}
            activeOpacity={0.8}
          >
            <Upload size={16} color="#FFFFFF" />
            <Text style={styles.headerUploadText}>Upload</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCol}>
            <StatCard
              title="TOTAL DOCUMENTS"
              value={String(kpiRecords.length)}
              caption="In Dossier"
              icon={<FileText size={18} color={colors.primary} />}
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard
              title="VERIFIED"
              value={String(verifiedCount)}
              caption="Compliant"
              icon={<CheckCircle size={18} color="#059669" />}
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard
              title="PENDING REVIEW"
              value={String(pendingCount)}
              caption="HR Verification"
              icon={<Clock size={18} color="#D97706" />}
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard
              title="DGMS / DRONE"
              value={String(statutoryLicenseCount)}
              caption="Statutory Licenses"
              icon={<Award size={18} color="#4F46E5" />}
            />
          </View>
        </View>

        <Card style={styles.filterCard}>
          <View style={styles.searchRow}>
            <Search size={16} color={colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                isEmployee
                  ? 'Search my credentials...'
                  : 'Search employee, document type, file name...'
              }
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

          <View style={styles.filterButtonsRow}>
            {!isEmployee && (
              <TouchableOpacity
                style={styles.filterDropdownBtn}
                onPress={() => setDeptPickerVisible(true)}
              >
                <Text style={styles.filterDropdownText} numberOfLines={1}>
                  {selectedDept}
                </Text>
                <ChevronDown size={14} color={colors.text.secondary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.filterDropdownBtn}
              onPress={() => setStatusPickerVisible(true)}
            >
              <Text style={styles.filterDropdownText}>{selectedStatus}</Text>
              <ChevronDown size={14} color={colors.text.secondary} />
            </TouchableOpacity>

            {(selectedDept !== 'All Departments' ||
              selectedStatus !== 'All Statuses' ||
              searchQuery.length > 0 ||
              targetEmpId) && (
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <RotateCcw size={14} color="#DC2626" />
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} color={colors.text.tertiary} />}
            title="No KYC Documents Found"
            description={
              searchQuery
                ? `No documents matching "${searchQuery}".`
                : isEmployee
                ? 'You have not uploaded any KYC documents or credentials yet.'
                : 'No employee credentials meet the active filter criteria.'
            }
          />
        ) : (
          filteredRecords.map((item) => {
            const isLicense =
              item.documentType.includes('DGMS') || item.documentType.includes('Pilot');
            const isVerified = item.status === 'Verified';

            return (
              <Card key={item.id} style={styles.docItemCard}>
                <View style={styles.itemHeader}>
                  <View
                    style={[
                      styles.itemIconWrap,
                      isLicense ? styles.iconWrapLicense : styles.iconWrapNormal,
                    ]}
                  >
                    {isLicense ? (
                      <Award size={22} color="#4F46E5" />
                    ) : (
                      <FileText size={22} color={colors.primary} />
                    )}
                  </View>

                  <View style={styles.itemTitleBlock}>
                    <Text style={styles.itemDocType}>{item.documentType}</Text>
                    <Text style={styles.itemFileName}>
                      {item.fileName} • {item.fileSize}
                    </Text>
                  </View>

                  <StatusBadge
                    status={
                      item.status === 'Verified'
                        ? 'approved'
                        : item.status === 'Pending Review'
                        ? 'pending'
                        : 'rejected'
                    }
                    customLabel={item.status}
                  />
                </View>

                {!isEmployee && (
                  <View style={styles.employeeInfoRow}>
                    <User size={13} color={colors.text.tertiary} />
                    <Text style={styles.employeeNameText}>
                      {item.employeeName}{' '}
                      <Text style={styles.empIdHighlight}>({item.employeeId})</Text>
                    </Text>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.departmentText}>{item.department}</Text>
                  </View>
                )}

                <View style={styles.validityRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>Uploaded On</Text>
                    <Text style={styles.dateValue}>{item.uploadedOn}</Text>
                  </View>

                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>Validity / Expiry</Text>
                    <Text
                      style={[
                        styles.dateValue,
                        item.expiryDate ? styles.expiryActive : styles.expiryLifetime,
                      ]}
                    >
                      {item.expiryDate ? `Expires ${item.expiryDate}` : 'Permanent Document'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => setSelectedDoc(item)}
                    activeOpacity={0.7}
                  >
                    <Eye size={16} color={colors.primary} />
                    <Text style={styles.actionIconBtnText}>Inspect</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => handleOpenAttachment(item)}
                    activeOpacity={0.7}
                  >
                    <Download size={16} color="#059669" />
                    <Text style={[styles.actionIconBtnText, { color: '#059669' }]}>
                      Open
                    </Text>
                  </TouchableOpacity>

                  {!isEmployee && item.status === 'Pending Review' && (
                    <TouchableOpacity
                      style={styles.verifyActionBtn}
                      onPress={() => handleVerify(item.id)}
                      activeOpacity={0.8}
                    >
                      <CheckCircle size={15} color="#FFFFFF" />
                      <Text style={styles.verifyActionBtnText}>Verify</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      <Modal statusBarTranslucent visible={isUploadModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEmployee
                  ? 'Upload Personal Credential / KYC'
                  : 'Upload Employee Credential / KYC'}
              </Text>
              <TouchableOpacity onPress={() => setIsUploadModalOpen(false)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              {isEmployee ? (
                <View style={styles.selfUploadBanner}>
                  <Text style={styles.selfUploadLabel}>Uploading Document For:</Text>
                  <Text style={styles.selfUploadName}>
                    {activeEmpName} ({activeEmpId})
                  </Text>
                  <Text style={styles.selfUploadDept}>{activeEmpDept}</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Select Employee *</Text>
                  <TouchableOpacity
                    style={styles.selectBtn}
                    onPress={() => setEmpPickerVisible(true)}
                  >
                    <Text style={styles.selectBtnText}>
                      {uploadEmpId
                        ? employees.find(
                            (e) => e.id === uploadEmpId || e.employeeId === uploadEmpId
                          )?.name || uploadEmpId
                        : '-- Select Employee --'}
                    </Text>
                    <ChevronDown size={16} color={colors.text.secondary} />
                  </TouchableOpacity>
                </>
              )}

              <Text style={styles.inputLabel}>Document Type *</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => setTypePickerVisible(true)}
              >
                <Text style={styles.selectBtnText}>{uploadDocType}</Text>
                <ChevronDown size={16} color={colors.text.secondary} />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Certificate Validity Expiry Date</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD (e.g. 2028-12-31)"
                placeholderTextColor={colors.text.tertiary}
                value={uploadExpiryDate}
                onChangeText={setUploadExpiryDate}
              />
              <Text style={styles.helperText}>
                Required for statutory DGMS certificates and DGCA drone licenses. Leave blank for permanent IDs.
              </Text>

              <Text style={styles.inputLabel}>Attach Document File (PDF, PNG, JPEG up to 10MB)</Text>
              <View style={styles.attachRow}>
                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={handlePickDocument}
                  activeOpacity={0.8}
                >
                  <FileUp size={18} color={colors.primary} />
                  <Text style={styles.attachBtnText}>Browse PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={handlePickPhoto}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={18} color="#059669" />
                  <Text style={styles.attachBtnText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Upload size={18} color="#D97706" />
                  <Text style={styles.attachBtnText}>Camera</Text>
                </TouchableOpacity>
              </View>

              {selectedAttachment && (
                <View style={styles.fileSelectedBox}>
                  <CheckCircle size={16} color={colors.primary} />
                  <View style={{ flex: 1, marginHorizontal: spacing.xs }}>
                    <Text style={styles.fileSelectedName} numberOfLines={1}>
                      {selectedAttachment.name}
                    </Text>
                    <Text style={styles.fileSelectedSize}>
                      {attachmentStorage.formatFileSize(selectedAttachment.size)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedAttachment(null)}>
                    <X size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setIsUploadModalOpen(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Submit Document"
                variant="primary"
                loading={isSubmitting}
                onPress={handleUploadSubmit}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal statusBarTranslucent visible={!!selectedDoc} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.previewCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={styles.modalTitle}>{selectedDoc?.documentType}</Text>
                <Text style={styles.previewSub}>
                  {selectedDoc?.employeeName} ({selectedDoc?.employeeId})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDoc(null)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {selectedDoc?.attachmentUri &&
              selectedDoc?.mimeType?.startsWith('image/') ? (
                <View style={styles.imageWrap}>
                  <Image
                    source={{ uri: selectedDoc.attachmentUri }}
                    style={styles.imageFull}
                    resizeMode="contain"
                  />
                </View>
              ) : null}

              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Employee:</Text>
                  <Text style={styles.detailValBold}>
                    {selectedDoc?.employeeName} ({selectedDoc?.employeeId})
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Department:</Text>
                  <Text style={styles.detailVal}>{selectedDoc?.department}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Document Type:</Text>
                  <Text style={[styles.detailValBold, { color: colors.primary }]}>
                    {selectedDoc?.documentType}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>File Name:</Text>
                  <Text style={styles.detailValMono}>{selectedDoc?.fileName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>File Size:</Text>
                  <Text style={styles.detailVal}>{selectedDoc?.fileSize}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Uploaded On:</Text>
                  <Text style={styles.detailVal}>{selectedDoc?.uploadedOn}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Validity:</Text>
                  <Text style={styles.detailVal}>
                    {selectedDoc?.expiryDate
                      ? `Expires on ${selectedDoc.expiryDate}`
                      : 'Permanent Document (Lifetime Validity)'}
                  </Text>
                </View>
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailKey}>Compliance Status:</Text>
                  <StatusBadge
                    status={
                      selectedDoc?.status === 'Verified'
                        ? 'approved'
                        : selectedDoc?.status === 'Pending Review'
                        ? 'pending'
                        : 'rejected'
                    }
                    customLabel={selectedDoc?.status}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Download / Open"
                variant="outline"
                onPress={() => selectedDoc && handleOpenAttachment(selectedDoc)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />

              {!isEmployee && selectedDoc?.status === 'Pending Review' && (
                <Button
                  title="Mark as Verified"
                  variant="primary"
                  onPress={() => selectedDoc && handleVerify(selectedDoc.id)}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal statusBarTranslucent visible={deptPickerVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDeptPickerVisible(false)}
        >
          <View style={styles.pickerPopup}>
            <Text style={styles.pickerPopupTitle}>Filter by Department</Text>
            {DEPARTMENTS.map((dept) => (
              <TouchableOpacity
                key={dept}
                style={[
                  styles.pickerPopupOption,
                  selectedDept === dept && styles.pickerPopupOptionActive,
                ]}
                onPress={() => {
                  setSelectedDept(dept);
                  setDeptPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerPopupOptionText,
                    selectedDept === dept && styles.pickerPopupOptionTextActive,
                  ]}
                >
                  {dept}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal statusBarTranslucent visible={statusPickerVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusPickerVisible(false)}
        >
          <View style={styles.pickerPopup}>
            <Text style={styles.pickerPopupTitle}>Filter by Status</Text>
            {STATUS_FILTERS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.pickerPopupOption,
                  selectedStatus === s && styles.pickerPopupOptionActive,
                ]}
                onPress={() => {
                  setSelectedStatus(s);
                  setStatusPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerPopupOptionText,
                    selectedStatus === s && styles.pickerPopupOptionTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal statusBarTranslucent visible={typePickerVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTypePickerVisible(false)}
        >
          <View style={styles.pickerPopup}>
            <Text style={styles.pickerPopupTitle}>Select Document Type</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              {DOCUMENT_TYPES.map((dt) => (
                <TouchableOpacity
                  key={dt.value}
                  style={[
                    styles.pickerPopupOption,
                    uploadDocType === dt.value && styles.pickerPopupOptionActive,
                  ]}
                  onPress={() => {
                    setUploadDocType(dt.value);
                    setTypePickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerPopupOptionText,
                      uploadDocType === dt.value && styles.pickerPopupOptionTextActive,
                    ]}
                  >
                    {dt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal statusBarTranslucent visible={empPickerVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEmpPickerVisible(false)}
        >
          <View style={styles.pickerPopup}>
            <Text style={styles.pickerPopupTitle}>Select Staff Member</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              {employees.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={[
                    styles.pickerPopupOption,
                    uploadEmpId === e.id && styles.pickerPopupOptionActive,
                  ]}
                  onPress={() => {
                    setUploadEmpId(e.id);
                    setEmpPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerPopupOptionText,
                      uploadEmpId === e.id && styles.pickerPopupOptionTextActive,
                    ]}
                  >
                    {e.name} ({e.employeeId} - {e.employment.designation})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  body: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCol: {
    flex: 1,
    minWidth: '47%',
  },
  filterCard: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 38,
    fontSize: typography.fontSizes.xs,
    color: colors.text.primary,
  },
  filterButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.xs,
  },
  filterDropdownText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.primary,
    fontWeight: typography.fontWeights.medium,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    gap: 3,
  },
  resetBtnText: {
    fontSize: typography.fontSizes.xs,
    color: '#DC2626',
    fontWeight: typography.fontWeights.bold,
  },
  docItemCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapNormal: {
    backgroundColor: '#EFF6FF',
  },
  iconWrapLicense: {
    backgroundColor: '#EEF2FF',
  },
  itemTitleBlock: {
    flex: 1,
  },
  itemDocType: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  itemFileName: {
    fontSize: typography.fontSizes.xs,
    fontFamily: 'monospace',
    color: colors.text.tertiary,
    marginTop: 2,
  },
  employeeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    gap: 4,
  },
  employeeNameText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  empIdHighlight: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
    fontFamily: 'monospace',
  },
  bullet: {
    color: colors.text.tertiary,
  },
  departmentText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
  },
  validityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.xs,
  },
  dateCol: {},
  dateLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.tertiary,
  },
  dateValue: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.primary,
    marginTop: 2,
  },
  expiryActive: {
    color: '#D97706',
    fontWeight: typography.fontWeights.bold,
  },
  expiryLifetime: {
    color: colors.text.secondary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.xs,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    backgroundColor: colors.background.secondary,
  },
  actionIconBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
  },
  verifyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  verifyActionBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#FFFFFF',
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
  previewSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  modalBody: {
    paddingBottom: spacing.sm,
  },
  selfUploadBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: spacing.xs,
  },
  selfUploadLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.secondary,
  },
  selfUploadName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  selfUploadDept: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  selectBtnText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
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
  helperText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.tertiary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  attachRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  attachBtn: {
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
  attachBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  fileSelectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.md,
    padding: spacing.xs,
    marginTop: spacing.xs,
  },
  fileSelectedName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  fileSelectedSize: {
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
  imageWrap: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  imageFull: {
    width: '100%',
    height: '100%',
  },
  detailCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  detailKey: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.tertiary,
  },
  detailVal: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.primary,
  },
  detailValBold: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  detailValMono: {
    fontSize: typography.fontSizes.xs,
    fontFamily: 'monospace',
    color: colors.text.primary,
  },
  pickerPopup: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    width: '85%',
    padding: spacing.md,
    ...shadows.lg,
  },
  pickerPopupTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: spacing.xs,
  },
  pickerPopupOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  pickerPopupOptionActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: radius.sm,
  },
  pickerPopupOptionText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
  },
  pickerPopupOptionTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});
