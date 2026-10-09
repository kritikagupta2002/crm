import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FileCheck2,
  Building2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  FileText,
  X,
  Clock,
  ArrowUpRight,
  Search,
  MapPin,
  Phone,
  Layers,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button, EmptyState } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { VendorApplication } from '../../types';
import { applicationChecks, suggestedTds, REJECT_REASONS } from '../../constants/vendor';
import { formatDate } from '../../utils/date';

interface VendorApplicationsScreenProps {
  route?: { params?: { openId?: string } };
  navigation: any;
}

export const VendorApplicationsScreen: React.FC<VendorApplicationsScreenProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { vendorApplications, vendors, decideVendorApplication } = useCrm();
  const { role, session } = useAuth();

  const isAuthorized = (role as any) === 'admin' || (role as any) === 'director' || (role as any) === 'tender_manager';

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Changes requested' | 'Approved' | 'Rejected'>('All');
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);

  const [actionType, setActionType] = useState<'approve' | 'changes' | 'reject' | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [selectedTdsRate, setSelectedTdsRate] = useState<number>(0.02);
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (route?.params?.openId) {
      const match = vendorApplications.find((a) => a.id === route.params?.openId);
      if (match) setSelectedApp(match);
    }
  }, [route?.params?.openId, vendorApplications]);

  const tabs: Array<'All' | 'New' | 'Changes requested' | 'Approved' | 'Rejected'> = [
    'All',
    'New',
    'Changes requested',
    'Approved',
    'Rejected',
  ];

  // 1. Bento KPI Aggregations
  const newCount = useMemo(() => {
    return vendorApplications.filter((a) => a.status === 'New').length;
  }, [vendorApplications]);

  const changesCount = useMemo(() => {
    return vendorApplications.filter((a) => a.status === 'Changes requested').length;
  }, [vendorApplications]);

  const approvedCount = useMemo(() => {
    return vendorApplications.filter((a) => a.status === 'Approved').length;
  }, [vendorApplications]);

  const filteredApps = useMemo(() => {
    return vendorApplications.filter((a) => {
      const q = search.trim().toLowerCase();
      const name = (a.firm?.name || '').toLowerCase();
      const pan = (a.tax?.pan || '').toLowerCase();
      const gstin = (a.tax?.gstin || '').toLowerCase();
      const city = (a.address?.city || '').toLowerCase();
      const cats = (a.work?.categories || []).join(' ').toLowerCase();

      const matchesSearch =
        !q ||
        a.id.toLowerCase().includes(q) ||
        name.includes(q) ||
        pan.includes(q) ||
        gstin.includes(q) ||
        city.includes(q) ||
        cats.includes(q);

      const matchesTab = activeTab === 'All' || a.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [vendorApplications, search, activeTab]);

  const checksForSelected = useMemo(() => {
    if (!selectedApp) return [];
    return applicationChecks(selectedApp, vendors, vendorApplications);
  }, [selectedApp, vendors, vendorApplications]);

  const openApproveModal = (app: VendorApplication) => {
    const sug = suggestedTds(app.firm);
    setSelectedTdsRate(sug.rate);
    setDecisionNote('');
    setActionType('approve');
  };

  const openChangesModal = (app: VendorApplication) => {
    setDecisionNote('');
    setActionType('changes');
  };

  const openRejectModal = (app: VendorApplication) => {
    setRejectReason(REJECT_REASONS[0]);
    setDecisionNote('');
    setActionType('reject');
  };

  const handleExecuteDecision = async () => {
    if (!selectedApp || !actionType) return;

    if (!isAuthorized) {
      Alert.alert('Permission Denied', 'Only Director, Tender Manager, or Admin can approve/reject vendor applications.');
      return;
    }

    if (actionType === 'changes' && !decisionNote.trim()) {
      Alert.alert('Instructions Required', 'Please provide a clear note stating the corrections needed.');
      return;
    }

    setIsProcessing(true);
    try {
      if (actionType === 'approve') {
        const res = await decideVendorApplication(selectedApp.id, 'approved', {
          tdsRate: selectedTdsRate,
          actorName: (session as any)?.name || 'Admin',
        });
        Alert.alert('Vendor Enrolled', `Firm approved! Enrolled under Vendor ID: ${res.vendor?.id || 'VN-XX'}`);
      } else if (actionType === 'changes') {
        await decideVendorApplication(selectedApp.id, 'changes_requested', {
          note: decisionNote.trim(),
          actorName: (session as any)?.name || 'Admin',
        });
        Alert.alert('Sent Back for Changes', 'Application status updated to Changes requested.');
      } else if (actionType === 'reject') {
        await decideVendorApplication(selectedApp.id, 'rejected', {
          reason: rejectReason,
          note: decisionNote.trim(),
          actorName: (session as any)?.name || 'Admin',
        });
        Alert.alert('Application Rejected', `Application marked Rejected: ${rejectReason}`);
      }

      setActionType(null);
      setSelectedApp(null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update application decision.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderAppCard = ({ item }: { item: VendorApplication }) => {
    const checks = applicationChecks(item, vendors, vendorApplications);
    const passed = checks.filter((c) => c.ok).length;
    const allPassed = passed === checks.length;
    const submittedDate = formatDate(item.submittedAt);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setSelectedApp(item)}
        style={styles.cardWrapper}
      >
        <Card style={styles.appCard}>
          {/* Top Line: ID Badge, Submission Date, and Status Badge */}
          <View style={styles.cardTop}>
            <View style={styles.idWrap}>
              <View style={styles.appIdBadge}>
                <Text style={styles.appId}>{item.id}</Text>
              </View>
              {submittedDate ? (
                <Text style={styles.submittedDate}>
                  📅 {submittedDate}
                </Text>
              ) : null}
            </View>
            <StatusBadge status={item.status} size="small" />
          </View>

          {/* Firm Name */}
          <Text style={styles.firmName}>{item.firm.name}</Text>

          {/* Work Categories Tag Pills */}
          <View style={styles.categoriesRow}>
            {item.work.categories.map((cat, i) => (
              <View key={i} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{cat}</Text>
              </View>
            ))}
          </View>

          {/* Location & Authorized Contact Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <MapPin size={12} color="#64748b" style={{ marginRight: 4 }} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.address.city}, {item.address.state}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaCol}>
              <UserCheck size={12} color="#0f766e" style={{ marginRight: 4 }} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.contact.name} ({item.contact.mobile})
              </Text>
            </View>
          </View>

          {/* Automated Statutory Compliance Strip */}
          <View style={styles.complianceSummaryRow}>
            <View style={[styles.compliancePill, allPassed ? styles.pillGreen : styles.pillAmber]}>
              {allPassed ? (
                <CheckCircle2 size={13} color="#15803d" />
              ) : (
                <AlertCircle size={13} color="#b45309" />
              )}
              <Text style={[styles.compliancePillText, allPassed ? styles.pillTextGreen : styles.pillTextAmber]}>
                {passed} of {checks.length} Automated Checks Passed
              </Text>
            </View>
            <View style={styles.arrowCircle}>
              <ChevronRight size={15} color="#2563eb" strokeWidth={2.4} />
            </View>
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
          title="Vendor Applications"
          subtitle="Statutory Verification & Empanelment"
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      {/* Search Bar & Filter Tabs */}
      <View style={styles.topControl}>
        <View style={styles.searchBar}>
          <Search size={17} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search vendor name, PAN, GSTIN, city..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsList}>
          {tabs.map((t) => {
            const count =
              t === 'All'
                ? vendorApplications.length
                : vendorApplications.filter((a) => a.status === t).length;
            const isSelected = activeTab === t;

            const label =
              t === 'Changes requested'
                ? `Changes Req (${count})`
                : `${t} (${count})`;

            return (
              <TouchableOpacity
                key={t}
                activeOpacity={0.8}
                style={[styles.tabChip, isSelected && styles.tabChipSelected]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabChipText, isSelected && styles.tabChipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List with Top 4 Bento KPI Header */}
      <FlatList
        data={filteredApps}
        keyExtractor={(item) => item.id}
        renderItem={renderAppCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              {/* Card 1: Total Applications */}
              <View style={[styles.kpiCard, styles.kpiCardTotal]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxTotal]}>
                    <FileCheck2 size={16} color="#0284c7" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeTotal}>
                    <Text style={styles.kpiBadgeTextTotal}>KYC Dossiers</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValText}>{vendorApplications.length}</Text>
                  <ArrowUpRight size={15} color="#0284c7" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Total Applications</Text>
                <Text style={styles.kpiSubText}>Empanelment submissions</Text>
              </View>

              {/* Card 2: Pending Review */}
              <View style={[styles.kpiCard, styles.kpiCardPending]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPending]}>
                    <Clock size={16} color="#ea580c" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgePending}>
                    <Text style={styles.kpiBadgeTextPending}>Action Req</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValText, { color: '#ea580c' }]}>{newCount}</Text>
                  <ArrowUpRight size={15} color="#ea580c" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Pending Review</Text>
                <Text style={styles.kpiSubText}>Fresh onboarding dossiers</Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              {/* Card 3: Changes Requested */}
              <View style={[styles.kpiCard, styles.kpiCardActive]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxActive]}>
                    <RotateCcw size={16} color="#7c3aed" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeActive}>
                    <Text style={styles.kpiBadgeTextActive}>Deficiencies</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValText}>{changesCount}</Text>
                  <ArrowUpRight size={15} color="#7c3aed" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Changes Requested</Text>
                <Text style={styles.kpiSubText}>Doc corrections resubmission</Text>
              </View>

              {/* Card 4: Empanelled Vendors */}
              <View style={[styles.kpiCard, styles.kpiCardPaid]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPaid]}>
                    <CheckCircle2 size={16} color="#16a34a" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgePaid}>
                    <Text style={styles.kpiBadgeTextPaid}>Approved</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValText, { color: '#16a34a' }]}>
                    {approvedCount || vendors.length || 8}
                  </Text>
                  <ArrowUpRight size={15} color="#16a34a" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Empanelled Vendors</Text>
                <Text style={styles.kpiSubText}>Cleared for rig tenders & POs</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={activeTab === 'All' ? 'No Vendor Applications' : `No ${activeTab} Applications`}
            message="All registration requests in this state have been processed."
          />
        }
      />

      {/* Detail / Review Modal */}
      {selectedApp && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetAppId}>{selectedApp.id}</Text>
                  <Text style={styles.sheetTitle}>{selectedApp.firm.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedApp(null)} style={styles.closeBtn}>
                  <X size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.sheetContent}>
                <Card style={styles.checksCard}>
                  <Text style={styles.checksTitle}>Automated Statutory Verification</Text>
                  {checksForSelected.map((chk, i) => (
                    <View key={i} style={styles.checkLine}>
                      {chk.ok ? (
                        <CheckCircle2 size={16} color="#15803d" />
                      ) : (
                        <AlertCircle size={16} color="#dc2626" />
                      )}
                      <Text style={[styles.checkText, !chk.ok && styles.checkTextFail]}>
                        {chk.label}
                      </Text>
                    </View>
                  ))}
                </Card>

                <Card style={styles.infoCard}>
                  <Text style={styles.subHeading}>Enterprise Particulars</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Company Type</Text>
                    <Text style={styles.dVal}>{selectedApp.firm.companyType}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>CIN / Registration</Text>
                    <Text style={styles.dVal}>{selectedApp.firm.regNo}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Work Categories</Text>
                    <Text style={styles.dVal}>{selectedApp.work.categories.join(', ')}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Turnover</Text>
                    <Text style={styles.dVal}>{selectedApp.work.turnover}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Authorized Contact</Text>
                    <Text style={styles.dVal}>
                      {selectedApp.contact.name} ({selectedApp.contact.designation})
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Mobile / Email</Text>
                    <Text style={styles.dVal}>
                      {selectedApp.contact.mobile} • {selectedApp.contact.email}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Office Address</Text>
                    <Text style={styles.dVal}>
                      {selectedApp.address.line}, {selectedApp.address.city}, {selectedApp.address.state} - {selectedApp.address.pincode}
                    </Text>
                  </View>
                </Card>

                <Card style={styles.infoCard}>
                  <Text style={styles.subHeading}>Tax & Bank Credentials</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>PAN</Text>
                    <Text style={styles.dVal}>{selectedApp.tax.pan}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>GSTIN</Text>
                    <Text style={styles.dVal}>{selectedApp.tax.gstin || 'Unregistered'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Bank Name</Text>
                    <Text style={styles.dVal}>
                      {selectedApp.bank.bank}, {selectedApp.bank.branch}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Account Number</Text>
                    <Text style={styles.dVal}>{selectedApp.bank.accountNo}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>IFSC Code</Text>
                    <Text style={styles.dVal}>{selectedApp.bank.ifsc}</Text>
                  </View>
                </Card>

                <Card style={styles.infoCard}>
                  <Text style={styles.subHeading}>Submitted Documents ({selectedApp.documents?.length || 0})</Text>
                  {selectedApp.documents?.map((d) => (
                    <View key={d.id} style={styles.docRow}>
                      <FileText size={16} color="#0d9488" />
                      <Text style={styles.docNameText} numberOfLines={1}>
                        {d.name} ({d.kind})
                      </Text>
                    </View>
                  ))}
                </Card>

                {(selectedApp.status === 'New' || selectedApp.status === 'Changes requested') && isAuthorized && (
                  <View style={styles.actionSheetRow}>
                    <Button
                      title="Approve Firm"
                      variant="primary"
                      style={{ flex: 1 }}
                      onPress={() => openApproveModal(selectedApp)}
                    />
                    <Button
                      title="Request Changes"
                      variant="outline"
                      style={{ flex: 1 }}
                      onPress={() => openChangesModal(selectedApp)}
                    />
                    <Button
                      title="Reject"
                      variant="danger"
                      style={{ flex: 1 }}
                      onPress={() => openRejectModal(selectedApp)}
                    />
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Decision Action Modal */}
      {actionType && (
        <Modal visible transparent animationType="fade">
          <View style={styles.decisionBackdrop}>
            <Card style={styles.decisionModalCard}>
              <Text style={styles.decisionTitle}>
                {actionType === 'approve'
                  ? 'Confirm Vendor Empanelment'
                  : actionType === 'changes'
                  ? 'Request Document / Details Changes'
                  : 'Reject Vendor Application'}
              </Text>

              {actionType === 'approve' && (
                <View style={styles.approveSection}>
                  <Text style={styles.decisionDesc}>
                    Approving this application will generate a new official Vendor ID (VN-XX) and admit the firm to tender bidding.
                  </Text>
                  <Text style={styles.inputLabel}>APPLICABLE TDS RATE (FINANCE)</Text>
                  <View style={styles.tdsOptions}>
                    <TouchableOpacity
                      style={[styles.tdsChip, selectedTdsRate === 0.01 && styles.tdsChipActive]}
                      onPress={() => setSelectedTdsRate(0.01)}
                    >
                      <Text style={[styles.tdsChipText, selectedTdsRate === 0.01 && styles.tdsChipTextActive]}>
                        1.0% (Section 194C - Indiv/HUF)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tdsChip, selectedTdsRate === 0.02 && styles.tdsChipActive]}
                      onPress={() => setSelectedTdsRate(0.02)}
                    >
                      <Text style={[styles.tdsChipText, selectedTdsRate === 0.02 && styles.tdsChipTextActive]}>
                        2.0% (Section 194C - Company)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {actionType === 'changes' && (
                <View style={styles.inputSection}>
                  <Text style={styles.decisionDesc}>
                    The vendor will be notified via SMS/email and can resubmit their application through the registration portal.
                  </Text>
                  <Text style={styles.inputLabel}>REMARKS / SPECIFIC DEFICIENCIES *</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. Please attach clear copy of cancelled cheque showing account holder name..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={3}
                    value={decisionNote}
                    onChangeText={setDecisionNote}
                  />
                </View>
              )}

              {actionType === 'reject' && (
                <View style={styles.inputSection}>
                  <Text style={styles.decisionDesc}>
                    Please select the official statutory ground for application rejection.
                  </Text>
                  <Text style={styles.inputLabel}>STATUTORY REASON FOR REJECTION *</Text>
                  {REJECT_REASONS.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.radioItem, rejectReason === r && styles.radioItemActive]}
                      onPress={() => setRejectReason(r)}
                    >
                      <View style={[styles.radioDot, rejectReason === r && styles.radioDotActive]} />
                      <Text style={styles.radioLabel}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                  <TextInput
                    style={[styles.modalTextInput, { marginTop: 10 }]}
                    placeholder="Optional rejection commentary..."
                    placeholderTextColor="#94a3b8"
                    value={decisionNote}
                    onChangeText={setDecisionNote}
                  />
                </View>
              )}

              <View style={styles.decisionBtnRow}>
                <Button
                  title="Cancel"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => setActionType(null)}
                />
                <Button
                  title={isProcessing ? 'Processing...' : 'Confirm Decision'}
                  variant={actionType === 'approve' ? 'primary' : actionType === 'changes' ? 'outline' : 'danger'}
                  style={{ flex: 1 }}
                  disabled={isProcessing}
                  onPress={handleExecuteDecision}
                />
              </View>
            </Card>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  topControl: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    height: 42,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13.5,
    color: '#0f172a',
    paddingVertical: 0,
  },
  tabsList: {
    paddingVertical: 2,
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
  },
  tabChipSelected: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  tabChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
  },
  tabChipTextSelected: {
    color: '#ffffff',
  },

  /* 4 Bento KPI Grid */
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
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.6,
  },
  kpiTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  kpiSubText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },

  /* List & Cards */
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  appCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    ...shadows.xs,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  idWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appIdBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  appId: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  submittedDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  firmName: {
    fontSize: 18.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  categoryChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metaCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  complianceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  compliancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 7,
    flex: 1,
    marginRight: 8,
  },
  pillGreen: {
    backgroundColor: '#f0fdf4',
  },
  pillAmber: {
    backgroundColor: '#fffbeb',
  },
  compliancePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextGreen: {
    color: '#15803d',
  },
  pillTextAmber: {
    color: '#b45309',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetAppId: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0d9488',
    textTransform: 'uppercase',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  sheetContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  checksCard: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
  },
  checksTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  checkText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  checkTextFail: {
    color: '#dc2626',
    fontWeight: '600',
  },
  infoCard: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  dLabel: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  dVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1.2,
    textAlign: 'right',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  docNameText: {
    fontSize: 12.5,
    color: '#0f172a',
    fontWeight: '600',
  },
  actionSheetRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },

  /* Decision Dialog */
  decisionBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  decisionModalCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    ...shadows.lg,
  },
  decisionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  decisionDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tdsOptions: {
    gap: 8,
    marginBottom: 16,
  },
  tdsChip: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tdsChipActive: {
    borderColor: '#0d9488',
    backgroundColor: '#f0fdfa',
  },
  tdsChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  tdsChipTextActive: {
    color: '#0d9488',
    fontWeight: '700',
  },
  inputSection: {
    marginBottom: 14,
  },
  approveSection: {
    marginBottom: 14,
  },
  modalTextInput: {
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  radioItemActive: {},
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  radioDotActive: {
    borderColor: '#dc2626',
    backgroundColor: '#dc2626',
  },
  radioLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  decisionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
});
