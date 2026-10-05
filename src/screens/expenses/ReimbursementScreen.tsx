import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  Modal,
  TouchableOpacity,
  RefreshControl,
  Switch,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, Input, EmptyState } from '../../components';
import { ReimbursementClaim, ReimbursementCategory } from '../../types';
import {
  Compass,
  Car,
  MapPin,
  IndianRupee,
  Plus,
  CheckCircle2,
  Calendar,
  Briefcase,
  Paperclip,
  Eye,
  AlertTriangle,
  X,
  CreditCard,
  Building,
  CheckSquare,
  Square,
  ShieldCheck,
  Search,
} from 'lucide-react-native';

const HARDSHIP_TIERS = [
  { tier: 'Tier 1 - HQ / Metro Transit', rate: 800 },
  { tier: 'Tier 2 - District Site / Camp', rate: 1200 },
  { tier: 'Tier 3 - Remote Rig / Forest Camp', rate: 1500 },
];

const VEHICLE_RATES = [
  { label: 'Four-Wheeler / Jeep (₹12/km)', rate: 12 },
  { label: 'Two-Wheeler / Bike (₹6/km)', rate: 6 },
];

export const ReimbursementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    reimbursements,
    submitReimbursement,
    reviewReimbursement,
    settleReimbursement,
    refreshHrms,
  } = useHrms();
  const { session, hasRole } = useAuth();

  const isHr = hasRole(['Admin', 'HR']);
  const isAccountant = hasRole(['Admin', 'Accountant']);
  const isPrivileged = isHr || isAccountant;
  const activeEmpId = session?.accountType === 'team' ? (session as any).employeeId : 'BGS-2021-001';

  const [activeTab, setActiveTab] = useState<'claims' | 'review' | 'settlement'>('claims');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState<ReimbursementCategory>('Vehicle Mileage');
  const [kmDriven, setKmDriven] = useState('120');
  const [ratePerKm, setRatePerKm] = useState('12');
  const [daDays, setDaDays] = useState('3');
  const [daRate, setDaRate] = useState('1200');
  const [hardshipTier, setHardshipTier] = useState(HARDSHIP_TIERS[1].tier);
  const [mobileAmount, setMobileAmount] = useState('1500');
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split('T')[0]);
  const [project, setProject] = useState('Bhilwara Lead-Zinc Exploration Block');
  const [clientBillable, setClientBillable] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reviewTarget, setReviewTarget] = useState<ReimbursementClaim | null>(null);
  const [reviewMode, setReviewMode] = useState<'approve' | 'partial' | 'reject'>('approve');
  const [partialApprovedAmt, setPartialApprovedAmt] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const [settleTarget, setSettleTarget] = useState<ReimbursementClaim | null>(null);
  const [utrRef, setUtrRef] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Bank Transfer' | 'UPI' | 'Cheque'>('Bank Transfer');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [settleError, setSettleError] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  const baseClaims = useMemo(() => {
    if (isPrivileged) {
      return reimbursements;
    }
    return reimbursements.filter((r) => r.employeeId === activeEmpId);
  }, [reimbursements, isPrivileged, activeEmpId]);

  const filteredClaims = useMemo(() => {
    return baseClaims.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.claimId && c.claimId.toLowerCase().includes(q)) ||
        c.employeeName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.remarks.toLowerCase().includes(q);

      if (activeTab === 'review') {
        return matchesSearch && c.status === 'Pending';
      }
      if (activeTab === 'settlement') {
        return matchesSearch && (c.status === 'Approved' || c.status === 'Partially Approved');
      }
      return matchesSearch;
    });
  }, [baseClaims, search, activeTab]);

  const totalCalculated = useMemo(() => {
    if (category === 'Vehicle Mileage') {
      const km = parseFloat(kmDriven) || 0;
      const rate = parseFloat(ratePerKm) || 0;
      return km * rate;
    }
    if (
      category === 'Field Deployment Daily Allowance (DA)' ||
      category === 'Travel Daily Allowance' ||
      category === 'Remote Site Hardship' ||
      category === 'Remote Hardship'
    ) {
      const days = parseFloat(daDays) || 0;
      const rate = parseFloat(daRate) || 0;
      return days * rate;
    }
    return parseFloat(mobileAmount) || 0;
  }, [category, kmDriven, ratePerKm, daDays, daRate, mobileAmount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshHrms();
    } finally {
      setRefreshing(false);
    }
  }, [refreshHrms]);

  const handleLodgeReimbursement = async () => {
    setFormError('');

    if (totalCalculated <= 0) {
      setFormError('Calculated reimbursement claim must be a positive number greater than ₹0.');
      return;
    }

    if (!remarks || remarks.trim().length < 5) {
      setFormError('Please enter at least 5 characters of justification/remarks.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (!claimDate || claimDate > today) {
      setFormError('Claim date is required and cannot be in the future.');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitReimbursement({
        category,
        claimAmount: totalCalculated,
        date: claimDate,
        project: project.trim(),
        clientBillable,
        kilometersDriven: category === 'Vehicle Mileage' ? parseFloat(kmDriven) : undefined,
        ratePerKm: category === 'Vehicle Mileage' ? parseFloat(ratePerKm) : undefined,
        daDays:
          category === 'Field Deployment Daily Allowance (DA)' ||
          category === 'Travel Daily Allowance' ||
          category === 'Remote Site Hardship'
            ? parseFloat(daDays)
            : undefined,
        daRate:
          category === 'Field Deployment Daily Allowance (DA)' ||
          category === 'Travel Daily Allowance' ||
          category === 'Remote Site Hardship'
            ? parseFloat(daRate)
            : undefined,
        hardshipTier:
          category === 'Field Deployment Daily Allowance (DA)' ||
          category === 'Remote Site Hardship'
            ? hardshipTier
            : undefined,
        remarks: remarks.trim(),
      });

      setShowAddModal(false);
      setRemarks('');
      Alert.alert(
        'Reimbursement Claim Submitted',
        `Claim for ₹${totalCalculated.toLocaleString('en-IN')} submitted under ${category}. Status is now Pending for HR review.`
      );
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit reimbursement claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReview = (claim: ReimbursementClaim, mode: 'approve' | 'partial' | 'reject') => {
    setReviewTarget(claim);
    setReviewMode(mode);
    setReviewRemarks('');
    setReviewError('');
    if (mode === 'partial') {
      const half = Math.round(Number(claim.claimAmount || 0) * 0.7);
      setPartialApprovedAmt(String(half));
    }
  };

  const handleConfirmReview = async () => {
    if (!reviewTarget) return;
    setReviewError('');

    const claimed = Number(reviewTarget.claimAmount || 0);

    try {
      setIsReviewing(true);

      if (reviewMode === 'approve') {
        await reviewReimbursement(reviewTarget.id, {
          status: 'Approved',
          approvedAmount: claimed,
          remarks: reviewRemarks.trim() || 'Verified against allowance rate chart and approved in full.',
        });
        Alert.alert('Approved', `Full allowance ₹${claimed.toLocaleString('en-IN')} approved.`);
      } else if (reviewMode === 'partial') {
        const val = parseFloat(partialApprovedAmt);
        if (isNaN(val) || val <= 0) {
          setReviewError('Approved amount must be a positive number greater than ₹0.');
          setIsReviewing(false);
          return;
        }

        if (val > claimed) {
          setReviewError(
            `Over-approval Blocked: Approved amount (₹${val.toLocaleString('en-IN')}) cannot exceed claimed amount (₹${claimed.toLocaleString('en-IN')}).`
          );
          setIsReviewing(false);
          return;
        }

        await reviewReimbursement(reviewTarget.id, {
          status: 'Partially Approved',
          approvedAmount: val,
          remarks:
            reviewRemarks.trim() ||
            `Partially approved at ₹${val.toLocaleString('en-IN')}; balance ₹${(claimed - val).toLocaleString('en-IN')} disallowed.`,
        });
        Alert.alert(
          'Partially Approved',
          `Claim sanctioned at ₹${val.toLocaleString('en-IN')}; ₹${(claimed - val).toLocaleString('en-IN')} rejected.`
        );
      } else {
        await reviewReimbursement(reviewTarget.id, {
          status: 'Rejected',
          approvedAmount: 0,
          remarks: reviewRemarks.trim() || 'Rejected during compliance review.',
        });
        Alert.alert('Claim Rejected', 'Allowance claim rejected.');
      }

      setReviewTarget(null);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to record review decision.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleOpenSettle = (claim: ReimbursementClaim) => {
    setSettleTarget(claim);
    setUtrRef('');
    setSettleError('');
    setSettlementDate(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmSettle = async () => {
    if (!settleTarget) return;
    setSettleError('');

    const payable = Number(settleTarget.approvedAmount || 0);
    if (payable <= 0) {
      setSettleError('Cannot settle a claim with ₹0 sanctioned amount.');
      return;
    }

    if (!utrRef || utrRef.trim().length < 4) {
      setSettleError('Disbursement Reference / UTR required (at least 4 characters).');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (!settlementDate || settlementDate > today) {
      setSettleError('Settlement date cannot be in the future.');
      return;
    }

    try {
      setIsSettling(true);
      await settleReimbursement(settleTarget.id, {
        settlementReference: utrRef.trim(),
        paymentMode,
        settlementDate,
      });

      setSettleTarget(null);
      Alert.alert(
        'Allowance Disbursed',
        `₹${payable.toLocaleString('en-IN')} disbursed via ${paymentMode} (UTR: ${utrRef.trim()}). Automated Payment Voucher posted to finance ledger.`
      );
    } catch (err: any) {
      setSettleError(err.message || 'Settlement failed.');
    } finally {
      setIsSettling(false);
    }
  };

  const renderClaimCard = ({ item }: { item: ReimbursementClaim }) => {
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.claimCategory}>{item.category}</Text>
            <Text style={styles.claimRefId}>{item.claimId || item.id}</Text>
          </View>
          <StatusBadge status={item.status} size="small" />
        </View>

        {isPrivileged && (
          <View style={styles.empRow}>
            <Text style={styles.empTitle}>{item.employeeName}</Text>
            <Text style={styles.deptBadge}>{item.department || 'Operations'}</Text>
          </View>
        )}

        <View style={styles.dateRow}>
          <Calendar size={12} color={colors.text.tertiary} />
          <Text style={styles.claimDate}>Incurred Date: {item.date}</Text>
        </View>

        {item.kilometersDriven && (
          <View style={styles.calcPill}>
            <Car size={13} color={colors.primary} />
            <Text style={styles.calcPillText}>
              {item.kilometersDriven} KM × ₹{item.ratePerKm || 12}/KM = ₹
              {(Number(item.kilometersDriven) * Number(item.ratePerKm || 12)).toLocaleString('en-IN')}
            </Text>
          </View>
        )}

        {item.daDays && (
          <View style={styles.calcPill}>
            <MapPin size={13} color={colors.primary} />
            <Text style={styles.calcPillText}>
              {item.daDays} Days @ ₹{item.daRate}/day ({item.hardshipTier || 'Standard Tier'})
            </Text>
          </View>
        )}

        {item.clientBillable && (
          <View style={styles.billableBadge}>
            <CheckCircle2 size={11} color={colors.primary} />
            <Text style={styles.billableText}>Client-Billable Tagged</Text>
          </View>
        )}

        <Text style={styles.remarksText} numberOfLines={2}>
          {item.remarks}
        </Text>

        <View style={styles.amountBox}>
          <View style={styles.amtCol}>
            <Text style={styles.amtLabel}>CLAIMED</Text>
            <Text style={styles.amtValue}>
              ₹{Number(item.claimAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amtCol}>
            <Text style={[styles.amtLabel, { color: colors.semantic.success }]}>APPROVED</Text>
            <Text style={[styles.amtValue, { color: colors.semantic.success }]}>
              ₹{Number(item.approvedAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amtCol}>
            <Text style={[styles.amtLabel, { color: colors.primary }]}>SETTLED</Text>
            <Text style={[styles.amtValue, { color: colors.primary }]}>
              ₹{Number(item.settledAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {item.settlementReference && (
          <View style={styles.settleNotice}>
            <CheckCircle2 size={12} color={colors.semantic.success} />
            <Text style={styles.settleNoticeText}>
              Disbursed via {item.paymentMode || 'Bank Transfer'} (UTR: {item.settlementReference})
            </Text>
          </View>
        )}

        {isHr && item.status === 'Pending' && (
          <View style={styles.cardActions}>
            <Button
              title="Full Approve"
              variant="primary"
              size="small"
              onPress={() => handleOpenReview(item, 'approve')}
              style={{ flex: 1, backgroundColor: colors.semantic.success }}
            />
            <Button
              title="Partial"
              variant="outline"
              size="small"
              onPress={() => handleOpenReview(item, 'partial')}
              style={{ flex: 1 }}
            />
            <Button
              title="Reject"
              variant="outline"
              size="small"
              onPress={() => handleOpenReview(item, 'reject')}
              style={{ flex: 1, borderColor: colors.semantic.error }}
            />
          </View>
        )}

        {isAccountant && (item.status === 'Approved' || item.status === 'Partially Approved') && (
          <View style={{ marginTop: spacing.sm }}>
            <Button
              title="Disburse & Settle"
              variant="primary"
              size="small"
              onPress={() => handleOpenSettle(item)}
            />
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={isPrivileged ? 'Field Reimbursements' : 'My Reimbursements'}
        subtitle="Vehicle mileage, daily allowances & hardship claims"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={() => {
              setFormError('');
              setShowAddModal(true);
            }}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addHeaderText}>Claim</Text>
          </TouchableOpacity>
        }
      />

      {isPrivileged && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'claims' && styles.tabBtnActive]}
            onPress={() => setActiveTab('claims')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'claims' && styles.tabBtnTextActive]}>
              All Claims ({baseClaims.length})
            </Text>
          </TouchableOpacity>

          {isHr && (
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'review' && styles.tabBtnActive]}
              onPress={() => setActiveTab('review')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'review' && styles.tabBtnTextActive]}>
                Pending Review ({baseClaims.filter((c) => c.status === 'Pending').length})
              </Text>
            </TouchableOpacity>
          )}

          {isAccountant && (
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'settlement' && styles.tabBtnActive]}
              onPress={() => setActiveTab('settlement')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'settlement' && styles.tabBtnTextActive]}>
                Settlement ({baseClaims.filter((c) => c.status === 'Approved' || c.status === 'Partially Approved').length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.searchContainer}>
        <Input
          placeholder={
            isPrivileged
              ? 'Search allowance claims by staff, category, remarks...'
              : 'Search my claims, category, remarks...'
          }
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.text.secondary} />}
        />
      </View>

      <FlatList
        data={filteredClaims}
        keyExtractor={(item) => item.id}
        renderItem={renderClaimCard}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Claims Found"
            message={
              search
                ? 'No claims match your search query.'
                : activeTab === 'review'
                ? 'No allowance claims currently awaiting review.'
                : activeTab === 'settlement'
                ? 'No approved claims ready for settlement.'
                : 'No field travel or mileage claims currently lodged.'
            }
            icon={<Compass size={44} color={colors.text.tertiary} />}
          />
        }
      />

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>File Allowance Claim</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <X size={20} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {formError ? (
                <View style={styles.errorAlert}>
                  <AlertTriangle size={15} color={colors.semantic.error} />
                  <Text style={styles.errorAlertText}>{formError}</Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Allowance Category *</Text>
              <View style={styles.catChips}>
                {[
                  'Vehicle Mileage',
                  'Field Deployment Daily Allowance (DA)',
                  'Remote Site Hardship',
                  'Mobile & Internet',
                ].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catChip, category === c && styles.catChipActive]}
                    onPress={() => setCategory(c as any)}
                  >
                    <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {category === 'Vehicle Mileage' && (
                <View style={styles.calcBox}>
                  <Text style={styles.calcTitle}>Vehicle Mileage Calculator</Text>

                  <View style={styles.ratePresets}>
                    {VEHICLE_RATES.map((r) => (
                      <TouchableOpacity
                        key={r.label}
                        style={[
                          styles.presetChip,
                          ratePerKm === String(r.rate) && styles.presetChipActive,
                        ]}
                        onPress={() => setRatePerKm(String(r.rate))}
                      >
                        <Text
                          style={[
                            styles.presetText,
                            ratePerKm === String(r.rate) && styles.presetTextActive,
                          ]}
                        >
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.calcRow}>
                    <Input
                      label="Kilometers Driven *"
                      keyboardType="numeric"
                      value={kmDriven}
                      onChangeText={setKmDriven}
                      containerStyle={{ flex: 1 }}
                    />
                    <Input
                      label="Rate / KM (INR) *"
                      keyboardType="numeric"
                      value={ratePerKm}
                      onChangeText={setRatePerKm}
                      containerStyle={{ flex: 1 }}
                    />
                  </View>

                  <View style={styles.calcPreviewRow}>
                    <Text style={styles.calcPreviewFormula}>
                      {kmDriven || 0} KM × ₹{ratePerKm || 0}/KM =
                    </Text>
                    <Text style={styles.calcPreviewResult}>
                      ₹{((parseFloat(kmDriven) || 0) * (parseFloat(ratePerKm) || 0)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              )}

              {(category === 'Field Deployment Daily Allowance (DA)' ||
                category === 'Travel Daily Allowance' ||
                category === 'Remote Site Hardship' ||
                category === 'Remote Hardship') && (
                <View style={styles.calcBox}>
                  <Text style={styles.calcTitle}>Hardship Tier & Daily Allowance</Text>

                  <Text style={styles.tierLabel}>Select Remote Hardship Tier:</Text>
                  <View style={styles.tierOptions}>
                    {HARDSHIP_TIERS.map((t) => (
                      <TouchableOpacity
                        key={t.tier}
                        style={[
                          styles.tierBtn,
                          hardshipTier === t.tier && styles.tierBtnActive,
                        ]}
                        onPress={() => {
                          setHardshipTier(t.tier);
                          setDaRate(String(t.rate));
                        }}
                      >
                        <Text
                          style={[
                            styles.tierBtnText,
                            hardshipTier === t.tier && styles.tierBtnTextActive,
                          ]}
                        >
                          {t.tier} (₹{t.rate}/day)
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.calcRow}>
                    <Input
                      label="Number of Site Days *"
                      keyboardType="numeric"
                      value={daDays}
                      onChangeText={setDaDays}
                      containerStyle={{ flex: 1 }}
                    />
                    <Input
                      label="Daily Rate (INR) *"
                      keyboardType="numeric"
                      value={daRate}
                      onChangeText={setDaRate}
                      containerStyle={{ flex: 1 }}
                    />
                  </View>

                  <View style={styles.calcPreviewRow}>
                    <Text style={styles.calcPreviewFormula}>
                      {daDays || 0} Days × ₹{daRate || 0}/day =
                    </Text>
                    <Text style={styles.calcPreviewResult}>
                      ₹{((parseFloat(daDays) || 0) * (parseFloat(daRate) || 0)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              )}

              {category === 'Mobile & Internet' && (
                <View style={styles.calcBox}>
                  <Input
                    label="Claim Amount (Monthly Limit ₹2,500) *"
                    keyboardType="numeric"
                    value={mobileAmount}
                    onChangeText={setMobileAmount}
                    leftIcon={<IndianRupee size={16} color={colors.text.secondary} />}
                  />
                  <Text style={styles.policyNotice}>
                    Verified against standard monthly 5G field hotspot recharge schedule.
                  </Text>
                </View>
              )}

              <View style={styles.calcRow}>
                <Input
                  label="Claim Date (YYYY-MM-DD) *"
                  value={claimDate}
                  onChangeText={setClaimDate}
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={styles.billableToggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.billableToggleTitle}>Client-Billable Tag</Text>
                  <Text style={styles.billableToggleSub}>
                    Charge back directly to exploration client project account
                  </Text>
                </View>
                <Switch
                  value={clientBillable}
                  onValueChange={setClientBillable}
                  trackColor={{ false: colors.border.light, true: colors.primary }}
                />
              </View>

              <View style={styles.totalPreview}>
                <Text style={styles.totalPreviewLabel}>Calculated Sanction Amount:</Text>
                <Text style={styles.totalPreviewValue}>
                  ₹{totalCalculated.toLocaleString('en-IN')}
                </Text>
              </View>

              <Input
                label="Site / Purpose Remarks (Min 5 chars) *"
                placeholder="e.g. Exploratory field traverse between Base Camp and Borehole BH-12..."
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setShowAddModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Submit Allowance Claim"
                  variant="primary"
                  loading={isSubmitting}
                  onPress={handleLodgeReimbursement}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={!!reviewTarget} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {reviewMode === 'approve'
                    ? 'Full Allowance Approval'
                    : reviewMode === 'partial'
                    ? 'Partial Sanction'
                    : 'Reject Claim'}
                </Text>
                <Text style={styles.modalSub}>{reviewTarget?.claimId}</Text>
              </View>
              <TouchableOpacity onPress={() => setReviewTarget(null)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {reviewError ? (
              <View style={styles.errorAlert}>
                <AlertTriangle size={15} color={colors.semantic.error} />
                <Text style={styles.errorAlertText}>{reviewError}</Text>
              </View>
            ) : null}

            <Text style={styles.claimMetaVal}>
              Claimed Amount: ₹{Number(reviewTarget?.claimAmount || 0).toLocaleString('en-IN')}
            </Text>

            {reviewMode === 'partial' && (
              <Input
                label="Sanctioned Amount (INR ₹) *"
                placeholder="e.g. 2000"
                keyboardType="numeric"
                value={partialApprovedAmt}
                onChangeText={setPartialApprovedAmt}
                leftIcon={<IndianRupee size={16} color={colors.text.secondary} />}
              />
            )}

            <Input
              label="Reviewer Remarks / Policy Notes"
              placeholder="e.g. Approved per remote field exploration rate matrix..."
              value={reviewRemarks}
              onChangeText={setReviewRemarks}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setReviewTarget(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Decision"
                variant="primary"
                loading={isReviewing}
                onPress={handleConfirmReview}
                style={{
                  flex: 1,
                  backgroundColor:
                    reviewMode === 'reject'
                      ? colors.semantic.error
                      : colors.primary,
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!settleTarget} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Allowance Disbursement</Text>
                <Text style={styles.modalSub}>{settleTarget?.claimId}</Text>
              </View>
              <TouchableOpacity onPress={() => setSettleTarget(null)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {settleError ? (
              <View style={styles.errorAlert}>
                <AlertTriangle size={15} color={colors.semantic.error} />
                <Text style={styles.errorAlertText}>{settleError}</Text>
              </View>
            ) : null}

            <View style={styles.settleSummary}>
              <Text style={styles.settleSummaryLabel}>SANCTIONED PAYABLE</Text>
              <Text style={styles.settleSummaryVal}>
                ₹{Number(settleTarget?.approvedAmount || 0).toLocaleString('en-IN')}
              </Text>
            </View>

            <Text style={styles.inputLabel}>Payment Mode *</Text>
            <View style={styles.catChips}>
              {(['Bank Transfer', 'UPI', 'Cheque'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.catChip, paymentMode === m && styles.catChipActive]}
                  onPress={() => setPaymentMode(m)}
                >
                  <Text style={[styles.catChipText, paymentMode === m && styles.catChipTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Disbursement Reference / UTR *"
              placeholder="e.g. UTR-HDFC-8891024"
              value={utrRef}
              onChangeText={setUtrRef}
              leftIcon={<CreditCard size={16} color={colors.text.secondary} />}
            />

            <Input
              label="Settlement Date (YYYY-MM-DD) *"
              value={settlementDate}
              onChangeText={setSettlementDate}
              leftIcon={<Calendar size={16} color={colors.text.secondary} />}
            />

            <View style={styles.ledgerPreviewNotice}>
              <Text style={styles.ledgerNoticeHeading}>FINANCE INTEGRATION</Text>
              <Text style={styles.ledgerNoticeText}>
                Disbursement automatically posts Payment Voucher to ledger:
                DR: 5100 - Employee Allowance & Welfare
                CR: 1002 - HDFC Bank Corporate A/c
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setSettleTarget(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Disburse & Post"
                variant="primary"
                loading={isSettling}
                onPress={handleConfirmSettle}
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
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
  },
  addHeaderText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingHorizontal: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  claimCategory: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  claimRefId: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginTop: 1,
  },
  empRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  empTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  deptBadge: {
    fontSize: 10,
    color: colors.text.secondary,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  claimDate: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  calcPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  calcPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  billableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: `${colors.semantic.success}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  billableText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.semantic.success,
  },
  remarksText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  amountBox: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  amtCol: {
    flex: 1,
    alignItems: 'center',
  },
  amtLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  amtValue: {
    ...typography.body,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  settleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.semantic.success}12`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  settleNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.semantic.success,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '100%',
    maxWidth: 420,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: spacing.xs,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalSub: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  catChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  catChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calcBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  calcTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  ratePresets: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  presetChipActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  presetText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  presetTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tierLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  tierOptions: {
    gap: 4,
    marginBottom: spacing.xs,
  },
  tierBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tierBtnActive: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  tierBtnText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  tierBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  calcRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  calcPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: 4,
  },
  calcPreviewFormula: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  calcPreviewResult: {
    ...typography.body,
    fontWeight: '800',
    color: colors.primary,
  },
  policyNotice: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  billableToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  billableToggleTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  billableToggleSub: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  totalPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${colors.primary}12`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  totalPreviewLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  totalPreviewValue: {
    ...typography.h3,
    color: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.semantic.error}15`,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  errorAlertText: {
    fontSize: 11,
    color: colors.semantic.error,
    fontWeight: '600',
    flex: 1,
  },
  claimMetaVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  settleSummary: {
    backgroundColor: `${colors.primary}12`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  settleSummaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  settleSummaryVal: {
    ...typography.h2,
    color: colors.primary,
    marginTop: 2,
  },
  ledgerPreviewNotice: {
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  ledgerNoticeHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  ledgerNoticeText: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
    lineHeight: 14,
  },
});
