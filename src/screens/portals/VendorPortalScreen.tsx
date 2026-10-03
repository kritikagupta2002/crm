import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useCrm, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, EmptyState } from '../../components';
import { Tender, WorkOrder, SealedBid, TenderClarification } from '../../types';
import {
  Gavel,
  FileSpreadsheet,
  IndianRupee,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Search,
  Clock,
  HardHat,
  Wallet,
  Building2,
  FileCheck,
  AlertTriangle,
  Upload,
  Receipt,
  Eye,
  Undo2,
  MessageCircleQuestion,
  HelpCircle,
  FileText,
  X,
  CreditCard,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react-native';
import { tenderPhase, closingOf, daysFrom, formatDateTime } from '../../constants/vendor';

type PortalTab = 'home' | 'tenders' | 'bids' | 'workOrders' | 'payments';

export const VendorPortalScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { session, logout } = useAuth();
  const {
    tenders,
    workOrders,
    vendors,
    clarifications,
    savedTenders,
    toggleSavedTender,
    withdrawBid,
    startWorkOrder,
    deliverWorkOrder,
    billWorkOrder,
    askClarification,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<PortalTab>('home');
  const [tenderSearch, setTenderSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  // Delivery Modal State
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [selectedWoForDelivery, setSelectedWoForDelivery] = useState<WorkOrder | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  // Billing Modal State
  const [billingModalVisible, setBillingModalVisible] = useState(false);
  const [selectedWoForBilling, setSelectedWoForBilling] = useState<WorkOrder | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billRemarks, setBillRemarks] = useState('');

  // Clarification Modal State
  const [askModalVisible, setAskModalVisible] = useState(false);
  const [selectedTenderForAsk, setSelectedTenderForAsk] = useState<Tender | null>(null);
  const [questionText, setQuestionText] = useState('');

  // Identify Current Vendor
  const vendorName = session?.accountType === 'vendor' ? (session as any).name : 'Apex Drilling Services';
  const vendorCode = session?.accountType === 'vendor' ? (session as any).vendorId : 'VEND-001';
  const currentVendor = vendors.find(v => v.id === vendorCode) || {
    id: vendorCode,
    name: vendorName,
    contactPerson: 'Mr. Rajesh Verma',
    phone: '9829012345',
    email: 'rajesh@apexdrilling.in',
    workCategory: 'Drilling & Boring',
    rating: 4.8,
    approvalStatus: 'approved' as const,
    pan: 'ABCDE1234F',
    gstin: '08ABCDE1234F1Z5',
    bankDetails: {
      accountNumber: '912010045678912',
      ifscCode: 'HDFC0000123',
      bankName: 'HDFC Bank, MI Road Jaipur',
    },
    msmeRegistrationNo: 'UDYAM-RJ-14-0012345',
    address: 'Plot 45, Vishwakarma Industrial Area, Jaipur, Rajasthan 302013',
  };

  // Vendor Data Aggregates
  const myWorkOrders = workOrders.filter(w => w.vendorId === vendorCode);
  const myBids: { tender: Tender; bid: SealedBid }[] = [];
  tenders.forEach(t => {
    const b = t.sealedBids.find(bid => bid.vendorId === vendorCode);
    if (b) {
      myBids.push({ tender: t, bid: b });
    }
  });

  const openTenders = tenders.filter(t => tenderPhase(t) === 'Open');
  const freshTenders = openTenders.filter(t => !myBids.some(b => b.tender.id === t.id));
  const waitingOrders = myWorkOrders.filter(w => ['Issued', 'Started', 'Delivered'].includes(w.currentStage));
  const totalPaid = myWorkOrders.reduce((sum, w) => sum + (w.paidAmount || 0), 0);
  const totalContract = myWorkOrders.reduce((sum, w) => sum + (w.contractValue || 0), 0);

  // Handle Work Order Mobilization
  const handleStartWork = (wo: WorkOrder) => {
    Alert.alert(
      'Confirm Mobilization',
      `Confirm that fieldwork and equipment mobilization for ${wo.woNumber} (${wo.projectTitle}) has officially started?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Start',
          onPress: async () => {
            try {
              await startWorkOrder(wo.id, 'Mobilization confirmed by contractor via portal');
              Alert.alert('Work Started', `Order ${wo.woNumber} is now marked as Started.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update stage');
            }
          },
        },
      ]
    );
  };

  // Handle Delivery Submission
  const handleOpenDelivery = (wo: WorkOrder) => {
    setSelectedWoForDelivery(wo);
    setDeliveryNotes('');
    setAttachedFiles(['Field_Survey_Log_v1.pdf', 'Core_Drilling_Photos.zip']);
    setDeliveryModalVisible(true);
  };

  const handleSubmitDelivery = async () => {
    if (!selectedWoForDelivery) return;
    if (!deliveryNotes.trim()) {
      Alert.alert('Validation Error', 'Please enter completion notes describing delivered fieldwork.');
      return;
    }
    try {
      await deliverWorkOrder(selectedWoForDelivery.id, {
        notes: deliveryNotes.trim(),
        files: attachedFiles.map((fn, idx) => ({ id: `proof-${Date.now()}-${idx}`, name: fn, size: '2.4 MB' })),
      });
      setDeliveryModalVisible(false);
      Alert.alert('Delivery Submitted', 'Your field deliverables and survey log have been submitted to Project Management.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record delivery');
    }
  };

  // Handle Milestone Billing Submission
  const handleOpenBilling = (wo: WorkOrder) => {
    setSelectedWoForBilling(wo);
    setInvoiceNo(`INV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);
    const remainingCeiling = wo.contractValue - (wo.paidAmount || 0);
    setBillAmount(String(Math.min(remainingCeiling, Math.round(wo.contractValue * 0.4))));
    setBillRemarks('');
    setBillingModalVisible(true);
  };

  const handleSubmitBill = async () => {
    if (!selectedWoForBilling) return;
    const amt = parseFloat(billAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid billing amount.');
      return;
    }
    const remainingCeiling = selectedWoForBilling.contractValue - (selectedWoForBilling.paidAmount || 0);
    if (amt > remainingCeiling) {
      Alert.alert(
        'Ceiling Violation',
        `Invoice amount ₹${amt.toLocaleString('en-IN')} exceeds remaining unbilled contract ceiling of ₹${remainingCeiling.toLocaleString('en-IN')}.`
      );
      return;
    }

    try {
      await billWorkOrder(selectedWoForBilling.id, {
        billNo: invoiceNo.trim() || `INV-${Date.now()}`,
        amount: amt,
        notes: billRemarks.trim(),
      });
      setBillingModalVisible(false);
      Alert.alert('Invoice Submitted', 'Invoice has been uploaded and queued for 3-way verification by Accounts.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit bill');
    }
  };

  // Handle Withdraw Bid
  const handleWithdrawBid = (tender: Tender) => {
    Alert.alert(
      'Withdraw Sealed Bid',
      `Are you sure you want to withdraw your bid for ${tender.tenderNo}? You can lodge a modified bid as long as the submission deadline is open.`,
      [
        { text: 'No, Keep Bid', style: 'cancel' },
        {
          text: 'Withdraw Bid',
          style: 'destructive',
          onPress: async () => {
            try {
              await withdrawBid(tender.id, vendorCode, vendorName);
              Alert.alert('Bid Withdrawn', 'Your sealed bid has been withdrawn from escrow.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to withdraw bid');
            }
          },
        },
      ]
    );
  };

  // Handle Pre-bid Clarification Ask
  const handleOpenClarification = (t: Tender) => {
    setSelectedTenderForAsk(t);
    setQuestionText('');
    setAskModalVisible(true);
  };

  const handleSubmitClarification = async () => {
    if (!selectedTenderForAsk || !questionText.trim()) {
      Alert.alert('Required', 'Please write your clarification query.');
      return;
    }
    try {
      await askClarification(selectedTenderForAsk.id, questionText.trim(), vendorCode, vendorName);
      setAskModalVisible(false);
      Alert.alert('Query Submitted', 'Your pre-bid clarification query has been sent to the Tender Committee.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit clarification');
    }
  };

  // Filtered Tenders
  const filteredTenders = tenders.filter(t => {
    const title = (t.title || '').toLowerCase();
    const no = (t.tenderNo || t.id || '').toLowerCase();
    const cat = (t.category || t.tenderCategory || '').toLowerCase();
    const searchLower = tenderSearch.toLowerCase();
    const matchesSearch = title.includes(searchLower) || no.includes(searchLower) || cat.includes(searchLower);
    const matchesCat = selectedCategory === 'all' || (t.category || t.tenderCategory) === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <AppHeader
        title={vendorName}
        subtitle={`Empanelled Contractor #${vendorCode}`}
        rightAction={
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setAccountModalVisible(true)}
              accessibilityLabel="View Account Profile"
            >
              <Building2 size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: `${colors.semantic.danger}15` }]}
              onPress={logout}
              accessibilityLabel="Sign Out"
            >
              <LogOut size={16} color={colors.semantic.danger} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Navigation Tabs */}
      <View style={styles.navBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
            onPress={() => setActiveTab('home')}
          >
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Overview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'tenders' && styles.tabItemActive]}
            onPress={() => setActiveTab('tenders')}
          >
            <Text style={[styles.tabLabel, activeTab === 'tenders' && styles.tabLabelActive]}>
              Tenders ({openTenders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'bids' && styles.tabItemActive]}
            onPress={() => setActiveTab('bids')}
          >
            <Text style={[styles.tabLabel, activeTab === 'bids' && styles.tabLabelActive]}>
              My Bids ({myBids.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'workOrders' && styles.tabItemActive]}
            onPress={() => setActiveTab('workOrders')}
          >
            <Text style={[styles.tabLabel, activeTab === 'workOrders' && styles.tabLabelActive]}>
              Work Orders ({myWorkOrders.length})
            </Text>
            {waitingOrders.length > 0 && <View style={styles.badgeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'payments' && styles.tabItemActive]}
            onPress={() => setActiveTab('payments')}
          >
            <Text style={[styles.tabLabel, activeTab === 'payments' && styles.tabLabelActive]}>Payments</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ===================== TAB 1: OVERVIEW ===================== */}
        {activeTab === 'home' && (
          <View style={{ gap: spacing.md }}>
            {/* Contractor Banner */}
            <Card style={styles.heroCard}>
              <View style={styles.heroRow}>
                <View style={styles.heroBadge}>
                  <HardHat size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>{vendorName}</Text>
                  <Text style={styles.heroSub}>Category: {currentVendor.workCategory || 'Geotechnical'}</Text>
                  <View style={styles.heroMetaRow}>
                    <StatusBadge status={currentVendor.approvalStatus || 'approved'} size="small" />
                    <Text style={styles.heroMetaText}>GSTIN: {currentVendor.gstin || 'Registered'}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.heroActionBtn}
                onPress={() => setAccountModalVisible(true)}
              >
                <Text style={styles.heroActionText}>View Banking & Compliance Profile →</Text>
              </TouchableOpacity>
            </Card>

            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              <Card style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: `${colors.semantic.info}15` }]}>
                  <Gavel size={18} color={colors.semantic.info} />
                </View>
                <Text style={styles.kpiValue}>{freshTenders.length}</Text>
                <Text style={styles.kpiLabel}>Open to Bid</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: `${colors.primary}15` }]}>
                  <ShieldCheck size={18} color={colors.primary} />
                </View>
                <Text style={styles.kpiValue}>{myBids.length}</Text>
                <Text style={styles.kpiLabel}>My Active Bids</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: `${colors.semantic.warning}15` }]}>
                  <FileSpreadsheet size={18} color={colors.semantic.warning} />
                </View>
                <Text style={styles.kpiValue}>{waitingOrders.length}</Text>
                <Text style={styles.kpiLabel}>Action Required</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: `${colors.semantic.success}15` }]}>
                  <IndianRupee size={18} color={colors.semantic.success} />
                </View>
                <Text style={styles.kpiValue}>₹{(totalPaid / 100000).toFixed(1)}L</Text>
                <Text style={styles.kpiLabel}>Disbursed</Text>
              </Card>
            </View>

            {/* Subcontracts Requiring Vendor Attention */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Subcontracts Requiring Action</Text>
              <TouchableOpacity onPress={() => setActiveTab('workOrders')}>
                <Text style={styles.linkText}>View All ({myWorkOrders.length})</Text>
              </TouchableOpacity>
            </View>

            {waitingOrders.length === 0 ? (
              <Card style={styles.emptyNoteCard}>
                <CheckCircle2 size={24} color={colors.semantic.success} />
                <Text style={styles.emptyNoteTitle}>All Subcontracts are Up to Date</Text>
                <Text style={styles.emptyNoteSub}>No pending mobilization, delivery, or milestone invoicing actions.</Text>
              </Card>
            ) : (
              waitingOrders.map(wo => (
                <Card key={wo.id} style={styles.orderActionCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.woCode}>{wo.woNumber}</Text>
                    <StatusBadge status={wo.currentStage} size="small" />
                  </View>
                  <Text style={styles.woTitle}>{wo.projectTitle}</Text>
                  <Text style={styles.woScope}>{wo.scopeOfWork}</Text>

                  <View style={styles.woDivider} />

                  <View style={styles.actionBtnRow}>
                    {wo.currentStage === 'Issued' && (
                      <Button
                        title="Confirm Mobilization / Start Work"
                        variant="primary"
                        size="small"
                        onPress={() => handleStartWork(wo)}
                        style={{ flex: 1 }}
                      />
                    )}
                    {wo.currentStage === 'Started' && (
                      <Button
                        title="Submit Field Delivery Report"
                        variant="primary"
                        size="small"
                        onPress={() => handleOpenDelivery(wo)}
                        style={{ flex: 1 }}
                      />
                    )}
                    {wo.currentStage === 'Delivered' && (
                      <Button
                        title="Submit Milestone Invoice"
                        variant="primary"
                        size="small"
                        onPress={() => handleOpenBilling(wo)}
                        style={{ flex: 1 }}
                      />
                    )}
                    <Button
                      title="Details"
                      variant="outline"
                      size="small"
                      onPress={() => navigation.navigate('WorkOrderDetail', { woId: wo.id })}
                    />
                  </View>
                </Card>
              ))
            )}

            {/* Latest Notice Board / Open Tenders Preview */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Open Tenders</Text>
              <TouchableOpacity onPress={() => setActiveTab('tenders')}>
                <Text style={styles.linkText}>Explore ({freshTenders.length})</Text>
              </TouchableOpacity>
            </View>

            {freshTenders.slice(0, 3).map(t => {
              const closingTime = closingOf(t);
              const daysDiff = Math.round((new Date(closingTime).getTime() - Date.now()) / 86400000);
              const daysLabel = daysFrom(closingTime);
              return (
                <Card
                  key={t.id}
                  style={styles.tenderCard}
                  onPress={() => navigation.navigate('TenderDetail', { tenderId: t.id })}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.woCode}>{t.tenderNo || t.id}</Text>
                    <View style={styles.timeTag}>
                      <Clock size={11} color={colors.semantic.warning} />
                      <Text style={styles.timeTagText}>
                        {daysDiff > 0 ? daysLabel : 'Closes Today'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.woTitle}>{t.title}</Text>
                  <Text style={styles.woScope} numberOfLines={2}>
                    {t.description || t.prequal || 'Field exploration & sampling work order'}
                  </Text>

                  <View style={styles.metaPillsRow}>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillLabel}>Est. Value</Text>
                      <Text style={styles.metaPillVal}>₹{(t.estimatedValue / 100000).toFixed(1)} L</Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillLabel}>EMD</Text>
                      <Text style={styles.metaPillVal}>₹{t.emdAmount.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillLabel}>Bids Locked</Text>
                      <Text style={styles.metaPillVal}>{t.sealedBids.length} in Vault</Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* ===================== TAB 2: ACTIVE TENDERS ===================== */}
        {activeTab === 'tenders' && (
          <View style={{ gap: spacing.md }}>
            {/* Search Input */}
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

            {/* Category Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {['all', 'Geotechnical', 'Topographical Survey', 'Structural Audit', 'Pavement Investigation'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catFilterChip, selectedCategory === cat && styles.catFilterChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.catFilterText, selectedCategory === cat && styles.catFilterTextActive]}>
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
              filteredTenders.map(t => {
                const myBid = t.sealedBids.find(b => b.vendorId === vendorCode);
                const isSaved = (savedTenders || []).includes(t.id);
                const closingTime = closingOf(t);
                const daysDiff = Math.round((new Date(closingTime).getTime() - Date.now()) / 86400000);
                const daysLabel = daysFrom(closingTime);

                return (
                  <Card
                    key={t.id}
                    style={styles.tenderCard}
                    onPress={() => navigation.navigate('TenderDetail', { tenderId: t.id })}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
                    <Text style={styles.tenderOrg}>{t.issuingAuthority || 'Bansal Geo'}</Text>

                    <View style={styles.tenderStatsRow}>
                      <View style={styles.statBox}>
                        <Text style={styles.statBoxLabel}>ESTIMATED VALUE</Text>
                        <Text style={styles.statBoxVal}>₹{(t.estimatedValue / 100000).toFixed(1)} L</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statBoxLabel}>EMD AMOUNT</Text>
                        <Text style={styles.statBoxVal}>₹{t.emdAmount.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statBoxLabel}>CLOSING IN</Text>
                        <Text style={[styles.statBoxVal, { color: daysDiff <= 2 ? colors.semantic.danger : colors.text.primary }]}>
                          {daysDiff > 0 ? daysLabel : 'Closed'}
                        </Text>
                      </View>
                    </View>

                    {myBid ? (
                      <View style={styles.myBidVaultBox}>
                        <ShieldCheck size={16} color={colors.semantic.success} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.myBidVaultTitle}>Commercial Bid Locked in Escrow</Text>
                          <Text style={styles.myBidVaultSub}>
                            ₹{myBid.bidAmount.toLocaleString('en-IN')} (Masked from staff until dual-key unsealing)
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.cardActionRow}>
                        <Button
                          title="Submit Commercial Bid"
                          variant="primary"
                          size="small"
                          onPress={() => navigation.navigate('TenderDetail', { tenderId: t.id })}
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
        )}

        {/* ===================== TAB 3: MY BIDS ===================== */}
        {activeTab === 'bids' && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Bid Escrow Vault</Text>
              <Text style={styles.sectionSub}>Bids remain cryptographically sealed until official committee opening</Text>
            </View>

            {myBids.length === 0 ? (
              <EmptyState
                title="No Submitted Bids"
                message="You have not lodged commercial bids for any active tenders yet."
                icon={<ShieldCheck size={40} color={colors.text.tertiary} />}
                actionLabel="Explore Open Tenders"
                onAction={() => setActiveTab('tenders')}
              />
            ) : (
              myBids.map(({ tender, bid }) => {
                const isOpen = tenderPhase(tender) === 'Open';
                const isShortlisted = bid.status === 'Shortlisted';
                const isAwarded = tender.awardedToVendorId === vendorCode;

                return (
                  <Card key={tender.id} style={styles.bidCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.woCode}>{tender.tenderNo || tender.id}</Text>
                      <StatusBadge
                        status={isAwarded ? 'Allotted' : isShortlisted ? 'Shortlisted' : bid.status || 'Submitted'}
                        size="small"
                      />
                    </View>

                    <Text style={styles.woTitle}>{tender.title}</Text>
                    <Text style={styles.tenderOrg}>{tender.issuingAuthority}</Text>

                    <View style={styles.bidFinancialsBox}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bidBoxLabel}>YOUR LODGED QUOTATION</Text>
                        <Text style={styles.bidBoxVal}>₹{bid.bidAmount.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bidBoxLabel}>ESCROW STATUS</Text>
                        <Text style={[styles.bidBoxVal, { color: bid.isSealed ? colors.primary : colors.semantic.success }]}>
                          {bid.isSealed ? '🔒 Sealed in Chamber' : '🔓 Unsealed / Evaluated'}
                        </Text>
                      </View>
                    </View>

                    {bid.remarks ? (
                      <Text style={styles.bidRemarksText}>Note: {bid.remarks}</Text>
                    ) : null}

                    <View style={styles.bidActionsRow}>
                      <Button
                        title="Tender Details"
                        variant="outline"
                        size="small"
                        onPress={() => navigation.navigate('TenderDetail', { tenderId: tender.id })}
                        style={{ flex: 1 }}
                      />

                      {isOpen && (bid.status === 'Submitted' || (bid as any).isSealed) && (
                        <TouchableOpacity
                          style={styles.withdrawBtn}
                          onPress={() => handleWithdrawBid(tender)}
                        >
                          <Undo2 size={14} color={colors.semantic.danger} />
                          <Text style={styles.withdrawBtnText}>Withdraw</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Card>
                );
              })
            )}

            {/* Pre-bid Clarifications Section */}
            <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
              <Text style={styles.sectionTitle}>My Pre-Bid Clarifications</Text>
            </View>

            {clarifications.filter(c => c.vendorId === vendorCode).length === 0 ? (
              <Card style={styles.emptyNoteCard}>
                <MessageCircleQuestion size={24} color={colors.text.tertiary} />
                <Text style={styles.emptyNoteTitle}>No Pre-bid Queries Raised</Text>
                <Text style={styles.emptyNoteSub}>You can submit questions on technical specs directly from any tender card.</Text>
              </Card>
            ) : (
              clarifications
                .filter(c => c.vendorId === vendorCode)
                .map(c => (
                  <Card key={c.id} style={styles.clarificationCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.clarificationTenderId}>Query #{c.id.substring(0, 8)}</Text>
                      <Text style={styles.clarificationDate}>{c.at ? formatDateTime(c.at) : c.date || 'Recent'}</Text>
                    </View>
                    <Text style={styles.clarificationQuestion}>Q: {c.question}</Text>
                    {c.answer ? (
                      <View style={styles.clarificationAnswerBox}>
                        <Text style={styles.answerHeader}>Official Response ({c.answeredBy || 'Tender Committee'}):</Text>
                        <Text style={styles.answerBody}>{c.answer}</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingAnswerBox}>
                        <Clock size={12} color={colors.semantic.warning} />
                        <Text style={styles.pendingAnswerText}>Under review by Lead Project Engineer</Text>
                      </View>
                    )}
                  </Card>
                ))
            )}
          </View>
        )}

        {/* ===================== TAB 4: WORK ORDERS (SUBCONTRACTS) ===================== */}
        {activeTab === 'workOrders' && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Subcontract Lifecycle</Text>
              <Text style={styles.sectionSub}>Manage execution from mobilization through milestone invoicing</Text>
            </View>

            {myWorkOrders.length === 0 ? (
              <EmptyState
                title="No Awarded Subcontracts"
                message="No active work orders have been assigned to your contractor code."
                icon={<FileSpreadsheet size={40} color={colors.text.tertiary} />}
              />
            ) : (
              myWorkOrders.map(wo => {
                const totalPaid = wo.paidAmount || 0;
                const percentPaid = Math.min(100, Math.round((totalPaid / wo.contractValue) * 100));

                return (
                  <Card
                    key={wo.id}
                    style={styles.orderCard}
                    onPress={() => navigation.navigate('WorkOrderDetail', { woId: wo.id })}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.woCode}>{wo.woNumber}</Text>
                      <StatusBadge status={wo.currentStage} size="small" />
                    </View>

                    <Text style={styles.woTitle}>{wo.projectTitle}</Text>
                    <Text style={styles.woScope}>{wo.scope || (wo as any).scopeOfWork || 'Fieldwork and testing'}</Text>

                    {/* Progress Bar */}
                    <View style={styles.progressWrap}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${percentPaid}%` }]} />
                      </View>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressSub}>Disbursed: ₹{(totalPaid / 100000).toFixed(2)}L of ₹{(wo.contractValue / 100000).toFixed(2)}L</Text>
                        <Text style={styles.progressPct}>{percentPaid}%</Text>
                      </View>
                    </View>

                    {/* Stage Guidance Note */}
                    <View style={styles.stageNoteBox}>
                      <Clock size={14} color={colors.primary} />
                      <Text style={styles.stageNoteText}>
                        {wo.currentStage === 'Issued' && 'Work order issued. Please confirm field mobilization to start.'}
                        {wo.currentStage === 'Started' && 'Work is in progress. Submit survey reports/core logs upon field completion.'}
                        {wo.currentStage === 'Delivered' && 'Fieldwork delivered. Submit milestone tax invoice for verification.'}
                        {wo.currentStage === 'Billed' && 'Invoice under 3-way reconciliation (PO vs Field Report vs Bill).'}
                        {wo.currentStage === 'Verified' && 'Approved by Accounts team. Awaiting bank transfer (RTGS/NEFT).'}
                        {wo.currentStage === 'Paid' && 'Payment disbursed in full. Electronic receipt posted.'}
                      </Text>
                    </View>

                    {/* Lifecycle Action Buttons */}
                    <View style={styles.orderActionsRow}>
                      {wo.currentStage === 'Issued' && (
                        <Button
                          title="Confirm Mobilization"
                          variant="primary"
                          size="small"
                          onPress={() => handleStartWork(wo)}
                          style={{ flex: 1 }}
                        />
                      )}
                      {wo.currentStage === 'Started' && (
                        <Button
                          title="Submit Field Delivery"
                          variant="primary"
                          size="small"
                          onPress={() => handleOpenDelivery(wo)}
                          style={{ flex: 1 }}
                        />
                      )}
                      {wo.currentStage === 'Delivered' && (
                        <Button
                          title="Submit Invoice"
                          variant="primary"
                          size="small"
                          onPress={() => handleOpenBilling(wo)}
                          style={{ flex: 1 }}
                        />
                      )}
                      <Button
                        title="View Full Ledger"
                        variant="outline"
                        size="small"
                        onPress={() => navigation.navigate('WorkOrderDetail', { woId: wo.id })}
                      />
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* ===================== TAB 5: PAYMENTS ===================== */}
        {activeTab === 'payments' && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Remittance & TDS Tracking</Text>
              <Text style={styles.sectionSub}>Verified electronic disbursements and tax deductions</Text>
            </View>

            {/* Financial Summary Cards */}
            <View style={styles.summaryRow}>
              <Card style={styles.summaryBox}>
                <Text style={styles.summaryBoxLabel}>TOTAL CONTRACT VALUE</Text>
                <Text style={styles.summaryBoxVal}>₹{(totalContract / 100000).toFixed(2)} L</Text>
              </Card>
              <Card style={styles.summaryBox}>
                <Text style={styles.summaryBoxLabel}>TOTAL RECEIVED (NET)</Text>
                <Text style={[styles.summaryBoxVal, { color: colors.semantic.success }]}>
                  ₹{(totalPaid / 100000).toFixed(2)} L
                </Text>
              </Card>
            </View>

            {/* Verified Payment Records */}
            <Text style={styles.subSectionTitle}>Payment Disbursement History</Text>

            {myWorkOrders.flatMap(w => w.milestoneBills.filter(b => b.status === 'Paid')).length === 0 ? (
              <EmptyState
                title="No Remittances Disbursed"
                message="Disbursed electronic payments and UTR transactions will appear here."
                icon={<IndianRupee size={40} color={colors.text.tertiary} />}
              />
            ) : (
              myWorkOrders.map(wo => {
                const paidBills = wo.milestoneBills.filter(b => b.status === 'Paid');
                if (paidBills.length === 0) return null;

                return (
                  <View key={wo.id} style={{ gap: spacing.sm }}>
                    {paidBills.map(b => (
                      <Card key={b.id} style={styles.paymentCard}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.woCode}>{wo.woNumber} · {b.invoiceNo || b.billNo}</Text>
                          <StatusBadge status="paid" size="small" />
                        </View>
                        <Text style={styles.woTitle}>{wo.projectTitle}</Text>

                        <View style={styles.paymentBreakdown}>
                          <View style={styles.payRow}>
                            <Text style={styles.payLabel}>Gross Invoiced</Text>
                            <Text style={styles.payVal}>₹{b.amount.toLocaleString('en-IN')}</Text>
                          </View>
                          {b.tdsRate && b.tdsRate > 0 ? (
                            <View style={styles.payRow}>
                              <Text style={styles.payLabel}>TDS Withheld ({b.tdsRate}%)</Text>
                              <Text style={[styles.payVal, { color: colors.semantic.danger }]}>
                                -₹{Math.round(b.amount * (b.tdsRate / 100)).toLocaleString('en-IN')}
                              </Text>
                            </View>
                          ) : null}
                          <View style={[styles.payRow, styles.netPayRow]}>
                            <Text style={styles.netPayLabel}>Net Remitted via RTGS</Text>
                            <Text style={styles.netPayVal}>
                              ₹{(b.tdsRate ? Math.round(b.amount * (1 - b.tdsRate / 100)) : b.amount).toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </View>

                        {b.utrNo || b.utrRef ? (
                          <View style={styles.utrTag}>
                            <CreditCard size={12} color={colors.primary} />
                            <Text style={styles.utrText}>UTR: {b.utrNo || b.utrRef} | Paid on {b.paidDate || b.date || 'Today'}</Text>
                          </View>
                        ) : null}
                      </Card>
                    ))}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ===================== MODAL 1: ACCOUNT & BANKING PROFILE ===================== */}
      <Modal visible={accountModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Contractor Profile</Text>
                <Text style={styles.modalSub}>Verified Banking & Compliance Record</Text>
              </View>
              <TouchableOpacity onPress={() => setAccountModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>FIRM IDENTITY</Text>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Vendor Code</Text>
                  <Text style={styles.profileVal}>{currentVendor.id}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Legal Firm Name</Text>
                  <Text style={styles.profileVal}>{currentVendor.name}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>PAN Card</Text>
                  <Text style={styles.profileVal}>{currentVendor.pan}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>GSTIN</Text>
                  <Text style={styles.profileVal}>{currentVendor.gstin}</Text>
                </View>
                {(currentVendor as any).msmeRegistrationNo || (currentVendor as any).msme ? (
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>MSME Reg. No</Text>
                    <Text style={styles.profileVal}>{(currentVendor as any).msmeRegistrationNo || (currentVendor as any).msme}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>BANKING DETAILS (FOR ELECTRONIC RTGS/NEFT)</Text>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Bank Name</Text>
                  <Text style={styles.profileVal}>{(currentVendor as any).bankDetails?.bankName || (currentVendor as any).bank?.name}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Account Number</Text>
                  <Text style={styles.profileVal}>
                    {'•'.repeat(8)}
                    {((currentVendor as any).bankDetails?.accountNumber || (currentVendor as any).bank?.accountNo)?.slice(-4) || '7890'}
                  </Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>IFSC Code</Text>
                  <Text style={styles.profileVal}>{(currentVendor as any).bankDetails?.ifscCode || (currentVendor as any).bank?.ifsc}</Text>
                </View>
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>CONTACT PERSON</Text>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Authorized Rep</Text>
                  <Text style={styles.profileVal}>{currentVendor.contactPerson}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Mobile</Text>
                  <Text style={styles.profileVal}>+91 {currentVendor.phone}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Email</Text>
                  <Text style={styles.profileVal}>{currentVendor.email}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Close"
                variant="primary"
                onPress={() => setAccountModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ===================== MODAL 2: SUBMIT DELIVERY REPORT ===================== */}
      <Modal visible={deliveryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Fieldwork Delivery</Text>
                <Text style={styles.modalSub}>{selectedWoForDelivery?.woNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setDeliveryModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
              <Text style={styles.inputLabel}>Field Completion Notes *</Text>
              <TextInput
                style={[styles.textInput, { height: 80 }]}
                multiline
                placeholder="Describe completed boreholes, depths drilled, samples gathered, or test results..."
                placeholderTextColor={colors.text.tertiary}
                value={deliveryNotes}
                onChangeText={setDeliveryNotes}
              />

              <Text style={styles.inputLabel}>Attached Field Proofs & Survey Sheets</Text>
              {attachedFiles.map((fn, idx) => (
                <View key={idx} style={styles.fileChipRow}>
                  <FileText size={14} color={colors.primary} />
                  <Text style={styles.fileNameText}>{fn}</Text>
                </View>
              ))}

              <Button
                title="Attach Additional Files"
                variant="outline"
                size="small"
                onPress={() => setAttachedFiles([...attachedFiles, `Field_Data_Sheet_${Date.now().toString().slice(-4)}.csv`])}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setDeliveryModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Submit Delivery"
                variant="primary"
                onPress={handleSubmitDelivery}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ===================== MODAL 3: SUBMIT MILESTONE INVOICE ===================== */}
      <Modal visible={billingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Submit Milestone Bill</Text>
                <Text style={styles.modalSub}>{selectedWoForBilling?.woNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setBillingModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
              <Text style={styles.inputLabel}>Tax Invoice Number *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. INV/2026/0124"
                placeholderTextColor={colors.text.tertiary}
                value={invoiceNo}
                onChangeText={setInvoiceNo}
              />

              <Text style={styles.inputLabel}>Billing Amount (₹) *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="Amount in Rupees"
                placeholderTextColor={colors.text.tertiary}
                value={billAmount}
                onChangeText={setBillAmount}
              />

              {selectedWoForBilling && (
                <Text style={styles.ceilingHint}>
                  Remaining Contract Ceiling: ₹{(selectedWoForBilling.contractValue - (selectedWoForBilling.paidAmount || 0)).toLocaleString('en-IN')}
                </Text>
              )}

              <Text style={styles.inputLabel}>Remarks / Milestone Reference</Text>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                multiline
                placeholder="Milestone description or payment reference notes..."
                placeholderTextColor={colors.text.tertiary}
                value={billRemarks}
                onChangeText={setBillRemarks}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setBillingModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Lodge Bill"
                variant="primary"
                onPress={handleSubmitBill}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ===================== MODAL 4: ASK PRE-BID CLARIFICATION ===================== */}
      <Modal visible={askModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Ask Pre-Bid Clarification</Text>
                <Text style={styles.modalSub}>{selectedTenderForAsk?.tenderNo}</Text>
              </View>
              <TouchableOpacity onPress={() => setAskModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
              <Text style={styles.inputLabel}>Your Technical Query *</Text>
              <TextInput
                style={[styles.textInput, { height: 100 }]}
                multiline
                placeholder="Please state specific clause, BOQ item, or soil depth clarification..."
                placeholderTextColor={colors.text.tertiary}
                value={questionText}
                onChangeText={setQuestionText}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setAskModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Send Query"
                variant="primary"
                onPress={handleSubmitClarification}
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
  headerIconBtn: {
    padding: spacing.xs,
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.background.secondary,
  },
  tabsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  tabItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.semantic.danger,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    padding: spacing.md,
    backgroundColor: `${colors.primary}08`,
    borderColor: `${colors.primary}25`,
  },
  heroRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  heroSub: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  heroMetaText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  heroActionBtn: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: `${colors.primary}15`,
  },
  heroActionText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    padding: spacing.sm,
    alignItems: 'flex-start',
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  kpiValue: {
    ...typography.h3,
    color: colors.text.primary,
  },
  kpiLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sectionSub: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  subSectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  linkText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyNoteCard: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyNoteTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptyNoteSub: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  orderActionCard: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  woCode: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.tertiary,
  },
  woTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  woScope: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  woDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.sm,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tenderCard: {
    padding: spacing.md,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.semantic.warning}15`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  timeTagText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.semantic.warning,
  },
  metaPillsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    marginTop: spacing.sm,
  },
  metaPill: {
    flex: 1,
    alignItems: 'center',
  },
  metaPillLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.tertiary,
  },
  metaPillVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  filterScroll: {
    gap: spacing.xs,
  },
  catFilterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  catFilterChipActive: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  catFilterText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  catFilterTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  saveBtn: {
    padding: 4,
  },
  tenderOrg: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  tenderStatsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.tertiary,
  },
  statBoxVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  myBidVaultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.semantic.success}10`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  myBidVaultTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.semantic.success,
  },
  myBidVaultSub: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bidCard: {
    padding: spacing.md,
  },
  bidFinancialsBox: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  bidBoxLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.tertiary,
  },
  bidBoxVal: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  bidRemarksText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  bidActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.semantic.danger}40`,
    borderRadius: borderRadius.sm,
  },
  withdrawBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.semantic.danger,
  },
  clarificationCard: {
    padding: spacing.md,
  },
  clarificationTenderId: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  clarificationDate: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  clarificationQuestion: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    marginVertical: spacing.xs,
  },
  clarificationAnswerBox: {
    backgroundColor: `${colors.semantic.success}10`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.success,
  },
  answerHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.semantic.success,
  },
  answerBody: {
    ...typography.caption,
    color: colors.text.primary,
    marginTop: 2,
  },
  pendingAnswerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pendingAnswerText: {
    ...typography.caption,
    color: colors.semantic.warning,
    fontSize: 10,
  },
  orderCard: {
    padding: spacing.md,
  },
  progressWrap: {
    marginTop: spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background.tertiary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  progressSub: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
  },
  progressPct: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  stageNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.primary}08`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  stageNoteText: {
    ...typography.caption,
    color: colors.primary,
    flex: 1,
  },
  orderActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryBox: {
    flex: 1,
    padding: spacing.md,
  },
  summaryBoxLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.tertiary,
    fontWeight: '700',
  },
  summaryBoxVal: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: 2,
  },
  paymentCard: {
    padding: spacing.md,
  },
  paymentBreakdown: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
    gap: 4,
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  payVal: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.primary,
  },
  netPayRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 4,
    marginTop: 2,
  },
  netPayLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  netPayVal: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.semantic.success,
  },
  utrTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  utrText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalSub: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  profileSection: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  profileSectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.tertiary,
    fontSize: 10,
    marginBottom: 4,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  profileVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  textInput: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  ceilingHint: {
    ...typography.caption,
    color: colors.semantic.info,
    fontSize: 10,
  },
  fileChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xs,
    backgroundColor: `${colors.primary}10`,
    borderRadius: borderRadius.sm,
  },
  fileNameText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});
