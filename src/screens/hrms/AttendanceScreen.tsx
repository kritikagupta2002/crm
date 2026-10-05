import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import {
  AppHeader,
  Card,
  StatusBadge,
  Button,
  EmptyState,
  SegmentedControl,
} from '../../components/common';
import { AttendanceRecord, AttendanceCorrection } from '../../types';
import {
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Fingerprint,
  CalendarDays,
  FileEdit,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Building,
} from 'lucide-react-native';

const WORK_LOCATIONS = [
  { label: 'Jaipur Corporate HQ', source: 'Biometric - Jaipur HQ', coords: { latitude: 26.9124, longitude: 75.7873 } },
  { label: 'Bhilwara Exploration Camp', source: 'Mobile Punch (Field GPS)', coords: { latitude: 25.3476, longitude: 74.6408 } },
  { label: 'Khetri Copper Survey Base', source: 'Mobile Punch (Field GPS)', coords: { latitude: 27.9947, longitude: 75.7958 } },
  { label: 'Udaipur Phosphate Field Site', source: 'Mobile Punch (Field GPS)', coords: { latitude: 24.5854, longitude: 73.7125 } },
];

export const AttendanceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    attendance,
    todayAttendance,
    punchIn,
    punchOut,
    corrections,
    reviewCorrection,
    refreshHrms,
  } = useHrms();
  const { session, hasRole } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR']);
  const activeEmpId = (session as any)?.employeeId || (isHrOrAdmin ? 'BGS-2021-001' : 'BGS-2023-044');
  const activeEmpName = (session as any)?.name || 'Team Member';

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord =
    attendance.find((a) => a.employeeId === activeEmpId && a.date === todayStr) || todayAttendance;

  const [selectedLocation, setSelectedLocation] = useState(WORK_LOCATIONS[0]);
  const [isPunching, setIsPunching] = useState(false);

  const tabs = isHrOrAdmin
    ? ['Today’s Muster', 'My Punch Log', 'Corrections Queue']
    : ['My Attendance Log', 'My Regularizations'];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const todayMusterRecords = attendance.filter((a) => a.date === todayStr);
  const myRecords = attendance.filter((a) => a.employeeId === activeEmpId);
  const myCorrections = corrections.filter((c) => c.employeeId === activeEmpId);
  const pendingCorrections = corrections.filter((c) => c.status === 'Pending');

  const handlePunchToggle = async () => {
    try {
      setIsPunching(true);
      if (!todayRecord || !todayRecord.punchIn || todayRecord.punchIn === '-') {
        const record = await punchIn(
          selectedLocation.label,
          selectedLocation.coords,
          selectedLocation.source
        );
        Alert.alert(
          'Punch Recorded',
          `Checked in at ${record.punchIn} (${selectedLocation.label}). Status set to ${record.status}.`
        );
      } else if (!todayRecord.punchOut || todayRecord.punchOut === '-') {
        const record = await punchOut();
        Alert.alert(
          'Shift Concluded',
          `Checked out at ${record.punchOut}. Total duration: ${record.workingHours} (${record.durationHours} hrs). Status: ${record.status}.`
        );
      } else {
        Alert.alert('Shift Finished', `You have already completed your punch-out at ${todayRecord.punchOut} today.`);
      }
    } catch (err: any) {
      Alert.alert('Punch Error', err.message || 'Failed to update attendance punch.');
    } finally {
      setIsPunching(false);
    }
  };

  const handleReview = async (id: string, action: 'Approved' | 'Rejected') => {
    try {
      setReviewingId(id);
      const comment =
        action === 'Approved'
          ? 'Verified with site supervisor field log.'
          : 'Rejected due to insufficient documentation.';
      await reviewCorrection(id, action, comment);
      Alert.alert('Review Submitted', `Correction request has been ${action}.`);
    } catch (err: any) {
      Alert.alert('Review Error', err.message || 'Failed to review correction request.');
    } finally {
      setReviewingId(null);
    }
  };

  const isCheckedIn = !!(todayRecord && todayRecord.punchIn && todayRecord.punchIn !== '-');
  const isCheckedOut = !!(todayRecord && todayRecord.punchOut && todayRecord.punchOut !== '-');

  const renderAttendanceItem = ({ item }: { item: AttendanceRecord }) => (
    <Card style={styles.recordCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.staffName}>{item.employeeName}</Text>
          <Text style={styles.staffMeta}>
            {item.employeeId} • {item.department || 'Operations'}
          </Text>
        </View>
        <StatusBadge status={item.status} size="sm" />
      </View>

      <View style={styles.timesContainer}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>CHECK IN</Text>
          <Text style={styles.timeValue}>{item.punchIn || item.checkIn || '--:--'}</Text>
        </View>
        <View style={styles.timeDivider} />
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>CHECK OUT</Text>
          <Text style={styles.timeValue}>{item.punchOut || item.checkOut || '--:--'}</Text>
        </View>
        <View style={styles.timeDivider} />
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>DURATION</Text>
          <Text style={[styles.timeValue, { color: colors.primary }]}>
            {item.workingHours || (item.durationHours ? `${item.durationHours}h` : '--')}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.metaRow}>
          <Fingerprint size={13} color="#2563EB" />
          <Text style={styles.metaText}>{item.punchSource || 'Biometric - Jaipur HQ'}</Text>
        </View>
        {item.lateBy && item.lateBy !== '-' && (
          <View style={styles.lateTag}>
            <Text style={styles.lateText}>Late: {item.lateBy}</Text>
          </View>
        )}
      </View>
    </Card>
  );

  const renderCorrectionCard = ({ item }: { item: AttendanceCorrection }) => {
    const isPending = item.status === 'Pending';
    const isOwnCorrection = item.employeeId === activeEmpId;

    return (
      <Card style={styles.correctionCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.staffName}>{item.employeeName}</Text>
            <Text style={styles.staffMeta}>
              {item.employeeId} • Target Date: {item.date}
            </Text>
          </View>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <View style={styles.corrTimesBox}>
          <View style={styles.corrTimeRow}>
            <Text style={styles.corrLabel}>Logged:</Text>
            <Text style={styles.corrValue}>
              {item.currentCheckIn || '-'} to {item.currentCheckOut || '-'}
            </Text>
          </View>
          <View style={styles.corrTimeRow}>
            <Text style={[styles.corrLabel, { color: colors.primary, fontWeight: '700' }]}>
              Requested:
            </Text>
            <Text style={[styles.corrValue, { color: colors.primary, fontWeight: '700' }]}>
              {item.requestedCheckIn || item.requestedIn} to {item.requestedCheckOut || item.requestedOut}
            </Text>
          </View>
        </View>

        <Text style={styles.corrReasonLabel}>Justification Reason:</Text>
        <Text style={styles.corrReasonText}>{item.reason}</Text>

        {item.reviewedBy && (
          <View style={styles.reviewerInfo}>
            <Text style={styles.reviewerText}>
              Reviewed by <Text style={{ fontWeight: '700' }}>{item.reviewedBy}</Text>
              {item.reviewComment ? `: "${item.reviewComment}"` : ''}
            </Text>
          </View>
        )}

        {isHrOrAdmin && isPending && (
          <View style={styles.actionRow}>
            {isOwnCorrection ? (
              <View style={styles.selfReviewNotice}>
                <AlertCircle size={14} color={colors.semantic.warning} />
                <Text style={styles.selfReviewText}>
                  4-Eyes Rule: You cannot approve your own regularization request.
                </Text>
              </View>
            ) : (
              <>
                <Button
                  title="Reject"
                  variant="outline"
                  size="small"
                  style={styles.rejectBtn}
                  onPress={() => handleReview(item.id, 'Rejected')}
                  disabled={reviewingId === item.id}
                />
                <Button
                  title="Approve Regularization"
                  variant="primary"
                  size="small"
                  style={styles.approveBtn}
                  onPress={() => handleReview(item.id, 'Approved')}
                  disabled={reviewingId === item.id}
                />
              </>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Attendance & Biometric Muster"
        subtitle="Live site punches, duration & regularization"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('NewCorrectionRequest')}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addBtnText}>Correction</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.punchHeroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroDate}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
              <Text style={styles.heroShift}>General Shift: 09:00 AM - 06:00 PM</Text>
            </View>
            <StatusBadge
              status={
                isCheckedOut
                  ? 'Completed'
                  : isCheckedIn
                  ? todayRecord?.status || 'Present'
                  : 'Pending Punch'
              }
              size="md"
            />
          </View>

          <View style={styles.heroTimesGrid}>
            <View style={styles.heroTimeCol}>
              <Text style={styles.heroTimeLabel}>PUNCH IN</Text>
              <Text style={styles.heroTimeValue}>{todayRecord?.punchIn || '--:--'}</Text>
            </View>
            <View style={styles.heroTimeCol}>
              <Text style={styles.heroTimeLabel}>PUNCH OUT</Text>
              <Text style={styles.heroTimeValue}>{todayRecord?.punchOut || '--:--'}</Text>
            </View>
            <View style={styles.heroTimeCol}>
              <Text style={styles.heroTimeLabel}>DURATION</Text>
              <Text style={[styles.heroTimeValue, { color: colors.primary }]}>
                {todayRecord?.workingHours || (todayRecord?.durationHours ? `${todayRecord.durationHours}h` : '--')}
              </Text>
            </View>
          </View>

          {!isCheckedOut && (
            <View style={styles.locationSelector}>
              <Text style={styles.selectorLabel}>Punch Site / Deployment:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll}>
                {WORK_LOCATIONS.map((loc, idx) => {
                  const isSelected = selectedLocation.label === loc.label;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.locationPill, isSelected && styles.locationPillActive]}
                      onPress={() => setSelectedLocation(loc)}
                    >
                      <MapPin size={12} color={isSelected ? '#fff' : colors.text.secondary} />
                      <Text
                        style={[styles.locationPillText, isSelected && styles.locationPillTextActive]}
                      >
                        {loc.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.heroActionWrap}>
            {isCheckedOut ? (
              <View style={styles.shiftDoneBanner}>
                <CheckCircle2 size={18} color="#16A34A" />
                <Text style={styles.shiftDoneText}>
                  Today's shift complete ({todayRecord?.workingHours}). Punch ledger finalized.
                </Text>
              </View>
            ) : isCheckedIn ? (
              <Button
                title={isPunching ? 'Recording Punch Out...' : 'Punch Out (Check-Out)'}
                variant="primary"
                size="large"
                style={{ ...styles.punchBtn, backgroundColor: '#D97706' }}
                leftIcon={<Clock size={20} color="#fff" />}
                onPress={handlePunchToggle}
                disabled={isPunching}
              />
            ) : (
              <Button
                title={isPunching ? 'Recording Punch In...' : 'Punch In (Check-In)'}
                variant="primary"
                size="large"
                style={styles.punchBtn}
                leftIcon={<Fingerprint size={20} color="#fff" />}
                onPress={handlePunchToggle}
                disabled={isPunching}
              />
            )}
          </View>
        </Card>

        <View style={styles.quickLinksRow}>
          {isHrOrAdmin && (
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => navigation.navigate('DailyAttendance')}
            >
              <Fingerprint size={16} color={colors.primary} />
              <Text style={styles.quickLinkText}>Daily Register</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('MonthlyAttendance')}
          >
            <CalendarDays size={16} color="#9333EA" />
            <Text style={styles.quickLinkText}>Monthly Matrix</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('NewCorrectionRequest')}
          >
            <FileEdit size={16} color="#D97706" />
            <Text style={styles.quickLinkText}>Regularize Punch</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsWrap}>
          <SegmentedControl
            options={tabs}
            selectedIndex={tabs.indexOf(activeTab)}
            onSelect={(idx: number) => setActiveTab(tabs[idx])}
          />
        </View>

        {activeTab === 'Today’s Muster' && (
          <View style={styles.listSection}>
            {todayMusterRecords.length === 0 ? (
              <EmptyState
                icon={<Clock size={48} color={colors.text.tertiary} />}
                title="No Punches Recorded Today"
                description="Staff members have not yet logged their check-ins for today."
              />
            ) : (
              todayMusterRecords.map((item) => (
                <View key={item.id} style={{ marginBottom: spacing.sm }}>
                  {renderAttendanceItem({ item })}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'My Attendance Log' && (
          <View style={styles.listSection}>
            {myRecords.length === 0 ? (
              <EmptyState
                icon={<Clock size={48} color={colors.text.tertiary} />}
                title="No Personal Records"
                description="Your past attendance logs will appear here once punches are recorded."
              />
            ) : (
              myRecords.slice(0, 15).map((item) => (
                <View key={item.id} style={{ marginBottom: spacing.sm }}>
                  {renderAttendanceItem({ item })}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'Corrections Queue' && (
          <View style={styles.listSection}>
            {pendingCorrections.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={48} color={colors.semantic.success} />}
                title="Queue Clean"
                description="There are no pending attendance regularization requests requiring sign-off."
              />
            ) : (
              pendingCorrections.map((item) => (
                <View key={item.id} style={{ marginBottom: spacing.sm }}>
                  {renderCorrectionCard({ item })}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'My Regularizations' && (
          <View style={styles.listSection}>
            {myCorrections.length === 0 ? (
              <EmptyState
                icon={<FileEdit size={48} color={colors.text.tertiary} />}
                title="No Correction Requests"
                description="You have not submitted any attendance regularization requests."
                actionTitle="Submit Request"
                onAction={() => navigation.navigate('NewCorrectionRequest')}
              />
            ) : (
              myCorrections.map((item) => (
                <View key={item.id} style={{ marginBottom: spacing.sm }}>
                  {renderCorrectionCard({ item })}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  punchHeroCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  heroDate: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.heavy,
    color: colors.text.primary,
  },
  heroShift: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  heroTimesGrid: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  heroTimeCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroTimeLabel: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  heroTimeValue: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: 4,
  },
  locationSelector: {
    marginBottom: spacing.md,
  },
  selectorLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  locationScroll: {
    flexDirection: 'row',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginRight: spacing.xs,
  },
  locationPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  locationPillText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
  },
  locationPillTextActive: {
    color: '#fff',
    fontWeight: typography.fontWeights.bold,
  },
  heroActionWrap: {
    marginTop: spacing.xs,
  },
  punchBtn: {
    width: '100%',
    borderRadius: radius.lg,
  },
  shiftDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  shiftDoneText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#15803D',
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  quickLinkText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  tabsWrap: {
    marginBottom: spacing.md,
  },
  listSection: {
    marginTop: spacing.xs,
  },
  recordCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  staffName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  staffMeta: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  timesContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timeDivider: {
    width: 1,
    backgroundColor: colors.border.subtle,
  },
  timeLabel: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
  },
  timeValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
  },
  lateTag: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.xs,
  },
  lateText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: '#B45309',
  },
  correctionCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  corrTimesBox: {
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    gap: 4,
  },
  corrTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  corrLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
  },
  corrValue: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  corrReasonLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  corrReasonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  reviewerInfo: {
    padding: spacing.xs,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  reviewerText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  rejectBtn: {
    flex: 1,
    borderColor: colors.semantic.danger,
  },
  approveBtn: {
    flex: 2,
  },
  selfReviewNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: '#FFFBEB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  selfReviewText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: '#92400E',
    fontWeight: typography.fontWeights.semibold,
  },
});
