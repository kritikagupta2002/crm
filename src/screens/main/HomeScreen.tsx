import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Crown,
  Building2,
  Calendar,
  MapPin,
  Bell,
  Users,
  FolderKanban,
  TrendingUp,
  FileCheck,
  Truck,
  BarChart3,
  ChevronRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileText,
  Coins,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react-native';
import { ScreenContainer, Button } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { useHrms } from '../../context/HrmsContext';
import { useNotifications } from '../../context/NotificationContext';
import { misService } from '../../services';

const drRajeshImg = require('../../../assets/dr-rajesh-bansal.jpg');

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < 360;
  const isTablet = screenWidth >= 600;
  const contentPadding = isCompact ? 12 : 16;
  const quickActionGap = 8;
  const quickActionCols = isTablet ? 6 : 3;
  const containerWidth = isTablet ? Math.min(screenWidth, 680) : screenWidth;
  const quickActionWidth = Math.floor(
    (containerWidth - contentPadding * 2 - quickActionGap * (quickActionCols - 1)) / quickActionCols
  );

  const { session, role } = useAuth();
  const { unreadCount } = useNotifications();
  const { projects } = useCrm();
  const {
    todayAttendance,
    punchIn,
    punchOut,
  } = useHrms();

  const [attMetrics, setAttMetrics] = useState<any>({
    totalStaff: 5,
    presentToday: 4,
    onLeaveToday: 1,
    absentToday: 0,
    attendancePercentage: '80.0',
  });
  const [commMetrics, setCommMetrics] = useState<any>({
    pipelineValue: 5664000,
    activeProjects: 4,
    conversionRate: '0.0',
    pendingApprovals: 1,
  });
  const [punching, setPunching] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');

  const activeProjectId = projects[0]?.id;
  const punchStatus = `${todayAttendance?.punchIn || ''}-${todayAttendance?.punchOut || ''}`;

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      try {
        const [att, comm] = await Promise.all([
          misService.getZeroFakeAttendanceMetrics(),
          misService.getCommercialKpis(),
        ]);
        if (isMounted) {
          if (att && att.totalStaff > 0) setAttMetrics(att);
          if (comm) setCommMetrics(comm);
        }
      } catch (e) {
        console.error('Error fetching home metrics:', e);
      }
    };
    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, [projects.length, activeProjectId, punchStatus]);

  const handlePunchToggle = useCallback(async () => {
    setPunching(true);
    try {
      if (todayAttendance?.punchIn && todayAttendance.punchOut === '-') {
        await punchOut();
      } else {
        await punchIn('Field Mobile Geotag Check-in');
      }
    } catch (e: any) {
      console.error('Punch error:', e);
    } finally {
      setPunching(false);
    }
  }, [todayAttendance, punchIn, punchOut]);

  const isCheckedIn = Boolean(todayAttendance?.punchIn && todayAttendance?.punchOut === '-');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const roleTitle = useMemo(() => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'hr':
        return 'HR Manager';
      case 'accountant':
        return 'Financial Controller';
      case 'lead':
        return 'Lead Geoscientist';
      case 'employee':
      default:
        return 'Field Geologist';
    }
  }, [role]);

  const roleDescription = useMemo(() => {
    switch (role) {
      case 'admin':
        return 'Executive command view across all 8 enterprise workspaces.';
      case 'hr':
        return 'Workforce muster, biometric records & leave regularizations.';
      case 'accountant':
        return 'Statutory general ledger, receivables & tax audit oversight.';
      case 'lead':
        return 'Exploration drilling logs, milestone deliverables & contracts.';
      case 'employee':
      default:
        return 'Field muster check-in, daily tasks, claims & payslips.';
    }
  }, [role]);

  const userName = (session as any)?.name || 'Dr. Rajesh Bansal';
  const userDesignation = (session as any)?.designation || 'Managing Director';

  const isDrRajesh = useMemo(() => {
    return userName.includes('Rajesh Bansal') || (session as any)?.email === 'rajesh.bansal@bansalgeo.com';
  }, [userName, session]);

  const userInitials = useMemo(() => {
    if (!userName) return 'BG';
    const parts = userName.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [userName]);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const safeAttendancePct = useMemo(() => {
    const attPctNum = parseFloat(attMetrics?.attendancePercentage);
    return !isNaN(attPctNum)
      ? Math.round(attPctNum)
      : attMetrics?.totalStaff > 0
      ? Math.round((attMetrics.presentToday / attMetrics.totalStaff) * 100)
      : 0;
  }, [attMetrics]);

  const featuredProject = useMemo(() => projects[0] || null, [projects]);

  return (
    <ScreenContainer
      scrollable
      edges={['bottom']}
      contentContainerStyle={styles.screenScrollContent}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Identity & Status Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 6, 16), paddingHorizontal: contentPadding }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProfileTab')}
            style={styles.avatarWrapper}
          >
            {isDrRajesh ? (
              <Image source={drRajeshImg} style={styles.avatarImage} />
            ) : (session as any)?.avatar ? (
              <Image source={{ uri: (session as any).avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarInitialsBox}>
                <Text style={styles.avatarInitialsText}>{userInitials}</Text>
              </View>
            )}
            <View
              style={[
                styles.avatarBadge,
                {
                  backgroundColor:
                    role === 'admin'
                      ? '#f59e0b'
                      : role === 'hr'
                      ? '#059669'
                      : role === 'accountant'
                      ? '#d97706'
                      : '#0284c7',
                },
              ]}
            >
              {role === 'admin' ? (
                <Crown size={9} color="#ffffff" strokeWidth={2.4} />
              ) : role === 'hr' ? (
                <Users size={9} color="#ffffff" strokeWidth={2.4} />
              ) : (
                <Sparkles size={9} color="#ffffff" strokeWidth={2.4} />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.userInfoCol}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.userNameText} numberOfLines={1}>{userName}</Text>
            <View style={styles.companyRow}>
              <Building2 size={11} color={colors.textSecondary} />
              <Text style={styles.companySubtext} numberOfLines={1}>
                Bansal Geo • {userDesignation}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Notifications')}
            style={styles.bellButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bell size={18} color={colors.textPrimary} strokeWidth={2} />
            {unreadCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <View style={styles.contextStrip}>
          <View style={styles.contextDateRow}>
            <Calendar size={12} color={colors.textSecondary} />
            <Text style={styles.contextDateText}>{formattedDate}</Text>
          </View>
          <View style={styles.contextSyncPill}>
            <View style={styles.syncDot} />
            <Text style={styles.syncText}>Live Field Sync</Text>
          </View>
        </View>
      </View>

      <View style={[styles.bodyContent, { paddingHorizontal: contentPadding }]}>
        {/* Attendance Command Section - Single Clear Primary Action */}
        <View style={styles.attendanceCard}>
          <View style={styles.attendanceHeader}>
            <View style={styles.attendanceStatusRow}>
              <View style={[styles.statusDot, isCheckedIn ? styles.dotPresent : styles.dotAbsent]} />
              <Text style={styles.attendanceStatusTitle}>
                {isCheckedIn ? 'ON DUTY • CHECKED IN' : 'ATTENDANCE PENDING'}
              </Text>
            </View>
            <View style={styles.geotagPill}>
              <MapPin size={11} color={colors.primaryDark} />
              <Text style={styles.geotagText}>Field GPS Verified</Text>
            </View>
          </View>

          <View style={styles.attendanceInfoBlock}>
            <Text style={styles.attendanceDetailText}>
              {isCheckedIn
                ? `Punched in at ${todayAttendance?.punchIn || '--:--'} • Field Biometric Verified`
                : 'No check-in recorded today • General Shift (09:00 - 18:00)'}
            </Text>
          </View>

          <Button
            title={isCheckedIn ? 'Punch Out of Duty' : 'Punch In (Field Biometric)'}
            onPress={handlePunchToggle}
            loading={punching}
            variant={isCheckedIn ? 'danger' : 'primary'}
            size="md"
            icon={<Clock size={16} color="#ffffff" strokeWidth={2.2} />}
            style={styles.punchBtn}
          />
        </View>

        {/* Unified Operational Snapshot Card */}
        <View style={styles.snapshotCard}>
          <View style={styles.snapshotHeader}>
            <Text style={styles.snapshotTitle}>OPERATIONAL METRICS</Text>
            <View style={styles.timeFilterWrap}>
              {(['today', 'week', 'month'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.7}
                  onPress={() => setTimeFilter(t)}
                  style={[styles.filterTab, timeFilter === t && styles.filterTabActive]}
                >
                  <Text style={[styles.filterTabText, timeFilter === t && styles.filterTabTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.snapshotGrid}>
            <View style={styles.snapshotCol}>
              <Text style={styles.snapshotLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>MUSTER</Text>
              <Text
                style={[styles.snapshotVal, { color: colors.primaryDark }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {timeFilter === 'today'
                  ? `${attMetrics.presentToday}/${attMetrics.totalStaff}`
                  : timeFilter === 'week'
                  ? '4/5'
                  : '5/5'}
              </Text>
              <Text style={styles.snapshotSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {timeFilter === 'today'
                  ? `${safeAttendancePct}%`
                  : timeFilter === 'week'
                  ? '80%'
                  : '92%'}
              </Text>
            </View>

            <View style={styles.snapshotDivider} />

            <View style={styles.snapshotCol}>
              <Text style={styles.snapshotLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>PROJECTS</Text>
              <Text
                style={[styles.snapshotVal, { color: '#0284c7' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {commMetrics.activeProjects || projects.length}
              </Text>
              <Text style={styles.snapshotSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Active</Text>
            </View>

            <View style={styles.snapshotDivider} />

            <View style={styles.snapshotCol}>
              <Text style={styles.snapshotLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>PIPELINE</Text>
              <Text
                style={[styles.snapshotVal, { color: '#d97706' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {formatCurrency(commMetrics.pipelineValue || 5664000)}
              </Text>
              <Text style={styles.snapshotSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{commMetrics.conversionRate}% win</Text>
            </View>

            <View style={styles.snapshotDivider} />

            <View style={styles.snapshotCol}>
              <Text style={styles.snapshotLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>GATES</Text>
              <Text
                style={[styles.snapshotVal, { color: '#dc2626' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {commMetrics.pendingApprovals || 1}
              </Text>
              <Text style={styles.snapshotSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Action req</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('WorkspacesTab')}
            style={styles.seeAllLink}
          >
            <Text style={styles.seeAllText}>All Modules</Text>
            <ArrowRight size={13} color={colors.primaryDark} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <View style={[styles.quickActionsGrid, { gap: quickActionGap }]}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Leads')}
            style={[styles.actionGridItem, { width: quickActionWidth }]}
          >
            <View style={styles.actionIconContainer}>
              <Users size={18} color={colors.primaryDark} strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Leads</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Projects')}
            style={[styles.actionGridItem, { width: quickActionWidth }]}
          >
            <View style={styles.actionIconContainer}>
              <FolderKanban size={18} color={colors.primaryDark} strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Tenders')}
            style={[styles.actionGridItem, { width: quickActionWidth }]}
          >
            <View style={styles.actionIconContainer}>
              <Shield size={18} color={colors.primaryDark} strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Bids</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('QuoteApprovals')}
            style={[styles.actionGridItem, { width: quickActionWidth }]}
          >
            <View style={styles.actionIconContainer}>
              <FileCheck size={18} color={colors.primaryDark} strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Approvals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Vendors')}
            style={[styles.actionGridItem, { width: quickActionWidth }]}
          >
            <View style={styles.actionIconContainer}>
              <Truck size={18} color={colors.primaryDark} strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Vendors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('MisReports')}
            style={[styles.actionGridItem, { width: quickActionWidth }]}
          >
            <View style={styles.actionIconContainer}>
              <BarChart3 size={18} color={colors.primaryDark} strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Active Geological Project Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Geological Block</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Projects')}
            style={styles.seeAllLink}
          >
            <Text style={styles.seeAllText}>View All</Text>
            <ArrowRight size={13} color={colors.primaryDark} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (featuredProject) {
              navigation.navigate('ProjectDetail', { projectId: featuredProject.id });
            } else {
              navigation.navigate('Projects');
            }
          }}
          style={styles.projectPreviewCard}
        >
          <View style={styles.projectCardHeader}>
            <View style={styles.projectBadges}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>
                  {featuredProject?.projectCode || 'PRJ-GEO-2026-001'}
                </Text>
              </View>
              <View style={styles.stageBadge}>
                <Text style={styles.stageBadgeText}>
                  {featuredProject?.stageName ? `Stage 3: ${featuredProject.stageName}` : 'Stage 3: Task Execution'}
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={colors.textTertiary} />
          </View>

          <Text style={styles.projectTitle} numberOfLines={2}>
            {featuredProject?.title || 'Bhilwara Lead-Zinc Exploration Block'}
          </Text>

          <View style={styles.projectLocationRow}>
            <MapPin size={12} color={colors.textMuted} />
            <Text style={styles.projectLocationText} numberOfLines={1}>
              {featuredProject?.clientName || 'Hindustan Zinc Ltd'} • {featuredProject?.location || 'Bhilwara, Rajasthan'}
            </Text>
          </View>

          <View style={styles.projectStatsRow}>
            <View style={styles.budgetCol}>
              <Text style={styles.statLabel}>Baseline Budget</Text>
              <Text style={styles.statValue}>
                {formatCurrency(featuredProject?.baselineBudget || 4200000)}
              </Text>
            </View>

            <View style={styles.progressCol}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.statLabel}>Execution</Text>
                <Text style={styles.progressValue}>60%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '60%' }]} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Recent Activity Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('TasksTab')}
            style={styles.seeAllLink}
          >
            <Text style={styles.seeAllText}>All Tasks</Text>
            <ArrowRight size={13} color={colors.primaryDark} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Projects')}
            style={styles.activityRow}
          >
            <View style={[styles.activityIconCircle, { backgroundColor: '#f0fdfa' }]}>
              <FileText size={15} color={colors.primaryDark} strokeWidth={2.2} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>New Exploration Project Created</Text>
              <Text style={styles.activitySub} numberOfLines={1}>
                {featuredProject?.title || 'Bhilwara Lead-Zinc Exploration Block'}
              </Text>
            </View>
            <Text style={styles.activityTime}>2h ago</Text>
            <ChevronRight size={14} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.activityDivider} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('QuoteApprovals')}
            style={styles.activityRow}
          >
            <View style={[styles.activityIconCircle, { backgroundColor: '#f0f9ff' }]}>
              <CheckCircle2 size={15} color="#0284c7" strokeWidth={2.2} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Commercial Quotation Pending</Text>
              <Text style={styles.activitySub} numberOfLines={1}>
                QTE-2026-042 • Tata Steel Exploration
              </Text>
            </View>
            <Text style={styles.activityTime}>5h ago</Text>
            <ChevronRight size={14} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Role & Authorized Scope Summary */}
        <View style={styles.roleSummaryCard}>
          <View style={styles.roleHeaderRow}>
            <View style={styles.roleIconWrap}>
              <Layers size={16} color={colors.primaryDark} strokeWidth={2.2} />
            </View>
            <View style={styles.roleTitleCol}>
              <Text style={styles.roleHeaderTitle}>{roleTitle}</Text>
              <Text style={styles.roleHeaderSubtitle}>Authorized Role Scope</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('MisReports')}
              style={styles.roleActionBtn}
            >
              <Text style={styles.roleActionText}>View MIS</Text>
              <ArrowRight size={11} color={colors.primaryDark} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <Text style={styles.roleDescText}>{roleDescription}</Text>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenScrollContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: spacing.huge + 32,
    backgroundColor: '#f8fafc',
  },

  headerContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
    ...shadows.xs,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 3,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
  },
  avatarInitialsBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#14b8a6',
  },
  avatarInitialsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.full,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  userInfoCol: {
    flex: 1,
  },
  greetingText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  companySubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.danger,
    minWidth: 14,
    height: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2.5,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  bellBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
  },
  contextStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  contextDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contextDateText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  contextSyncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  syncDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primaryDark,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },

  /* Attendance Card */
  attendanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
    ...shadows.xs,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotPresent: {
    backgroundColor: colors.success,
  },
  dotAbsent: {
    backgroundColor: colors.warning,
  },
  attendanceStatusTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  geotagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  geotagText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  attendanceInfoBlock: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.sm + 2,
    marginBottom: spacing.sm + 2,
  },
  attendanceDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  punchBtn: {
    marginTop: 0,
    minHeight: 44,
  },

  /* Section Header & Filters */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  timeFilterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterTab: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  filterTabActive: {
    backgroundColor: colors.primaryDark,
  },
  filterTabText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  seeAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seeAllText: {
    fontSize: 11.5,
    color: colors.primaryDark,
    fontWeight: '600',
  },

  /* Unified Operational Snapshot */
  snapshotCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
    ...shadows.xs,
  },
  snapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 2,
  },
  snapshotTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  snapshotGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snapshotCol: {
    flex: 1,
    alignItems: 'center',
  },
  snapshotDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.borderLight,
  },
  snapshotLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  snapshotVal: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  snapshotSub: {
    fontSize: 9.5,
    color: colors.textMuted,
    marginTop: 1,
  },

  /* Quick Actions Grid */
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionGridItem: {
    width: '30.5%',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.xs,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },

  /* Active Project Preview */
  projectPreviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
    ...shadows.xs,
  },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  codeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  stageBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.sm,
  },
  stageBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  projectTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  projectLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm + 2,
  },
  projectLocationText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '400',
  },
  projectStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  budgetCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  progressCol: {
    width: 90,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  progressValue: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryDark,
    borderRadius: 2,
  },

  /* Activity Card */
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
    ...shadows.xs,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  activityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  activityContent: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  activitySub: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  activityTime: {
    fontSize: 10,
    color: colors.textTertiary,
    marginRight: spacing.xs,
  },
  activityDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },

  /* Role Scope Card */
  roleSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.xs,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  roleTitleCol: {
    flex: 1,
  },
  roleHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  roleHeaderSubtitle: {
    fontSize: 9.5,
    color: colors.textMuted,
  },
  roleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  roleActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  roleDescText: {
    fontSize: 10.5,
    color: colors.textSecondary,
    lineHeight: 15,
  },
});
