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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Rect, Text as SvgText } from 'react-native-svg';
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

const drillingRigImg = require('../../../assets/drilling-rig.jpg');
const drRajeshImg = require('../../../assets/dr-rajesh-bansal.jpg');

interface HomeScreenProps {
  navigation: any;
}

const DonutProgress = React.memo<{ percentage: number; color?: string }>(({
  percentage,
  color = '#0d9488',
}) => {
  const size = 44;
  const strokeWidth = 4.5;
  const radiusVal = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const safePct = Math.min(100, Math.max(0, isNaN(percentage) ? 0 : Math.round(percentage)));
  const strokeDashoffset = circumference - (circumference * safePct) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke={safePct === 0 ? '#cbd5e1' : color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <SvgText
          x={size / 2}
          y={size / 2 + 3.5}
          fontSize="10"
          fontWeight="bold"
          fill={safePct === 0 ? '#64748b' : '#0f172a'}
          textAnchor="middle"
        >
          {`${safePct}%`}
        </SvgText>
      </Svg>
    </View>
  );
});

const MiniBars = React.memo<{ color?: string; heights?: number[] }>(({
  color = '#0284c7',
  heights = [10, 16, 22, 28],
}) => {
  const width = 36;
  const height = 30;
  const barWidth = 5;
  const gap = 3;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {heights.map((h, i) => {
        const x = 3 + i * (barWidth + gap);
        const y = height - h;
        const opacity = 0.35 + (i / (heights.length - 1)) * 0.65;
        return (
          <Rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            rx={1.5}
            fill={color}
            opacity={opacity}
          />
        );
      })}
    </Svg>
  );
});

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 6, 16) }]}>
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

      <View style={styles.bodyContent}>
        <View style={styles.attendanceCommandCard}>
          <View style={styles.attendanceCardHeader}>
            <View style={styles.attendanceHeaderLeft}>
              <View style={[styles.statusIndicatorDot, isCheckedIn ? styles.dotPresent : styles.dotAbsent]} />
              <Text style={styles.attendanceCardTitle}>
                {isCheckedIn ? 'ON DUTY • CHECKED IN' : 'ATTENDANCE • PENDING'}
              </Text>
            </View>
            <View style={styles.geotagBadge}>
              <MapPin size={11} color={colors.primaryDark} />
              <Text style={styles.geotagBadgeText}>Field Geotag Active</Text>
            </View>
          </View>

          <View style={styles.attendanceTimingRow}>
            <View style={styles.timingCol}>
              <Text style={styles.timingLabel}>Punch In</Text>
              <Text style={styles.timingValue}>
                {todayAttendance?.punchIn && todayAttendance.punchIn !== '-'
                  ? todayAttendance.punchIn
                  : '--:--'}
              </Text>
            </View>
            <View style={styles.timingDivider} />
            <View style={styles.timingCol}>
              <Text style={styles.timingLabel}>Punch Out</Text>
              <Text style={styles.timingValue}>
                {todayAttendance?.punchOut && todayAttendance.punchOut !== '-'
                  ? todayAttendance.punchOut
                  : '--:--'}
              </Text>
            </View>
            <View style={styles.timingDivider} />
            <View style={styles.timingCol}>
              <Text style={styles.timingLabel}>Shift Status</Text>
              <Text style={[styles.timingValue, isCheckedIn ? { color: colors.success } : { color: colors.warning }]}>
                {isCheckedIn ? 'Present' : 'Not Punched'}
              </Text>
            </View>
          </View>

          <Button
            title={isCheckedIn ? 'Punch Out of Duty' : 'Punch In (Field Biometric)'}
            onPress={handlePunchToggle}
            loading={punching}
            variant={isCheckedIn ? 'danger' : 'primary'}
            size="md"
            icon={<Clock size={16} color="#ffffff" strokeWidth={2.2} />}
            style={styles.punchActionBtn}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Key Operational Metrics</Text>
          <View style={styles.timePillContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTimeFilter('today')}
              style={[styles.timePill, timeFilter === 'today' && styles.timePillActive]}
            >
              <Text style={[styles.timePillText, timeFilter === 'today' && styles.timePillTextActive]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTimeFilter('week')}
              style={[styles.timePill, timeFilter === 'week' && styles.timePillActive]}
            >
              <Text style={[styles.timePillText, timeFilter === 'week' && styles.timePillTextActive]}>
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTimeFilter('month')}
              style={[styles.timePill, timeFilter === 'month' && styles.timePillActive]}
            >
              <Text style={[styles.timePillText, timeFilter === 'month' && styles.timePillTextActive]}>
                Month
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.kpiContainer}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiTopRow}>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#ecfdf5' }]}>
                  <Users size={16} color="#059669" strokeWidth={2.2} />
                </View>
                <DonutProgress
                  percentage={timeFilter === 'today' ? safeAttendancePct : timeFilter === 'week' ? 80 : 92}
                  color="#0d9488"
                />
              </View>
              <Text style={styles.kpiLabel}>STAFF MUSTER</Text>
              <Text style={[styles.kpiValue, { color: colors.primaryDark }]}>
                {timeFilter === 'today'
                  ? `${attMetrics.presentToday} / ${attMetrics.totalStaff}`
                  : timeFilter === 'week'
                  ? '4 / 5'
                  : '5 / 5'}
              </Text>
              <Text style={styles.kpiSubtext} numberOfLines={1}>
                {timeFilter === 'today'
                  ? `${safeAttendancePct}% present today`
                  : timeFilter === 'week'
                  ? '80.0% weekly average'
                  : '92.0% monthly average'}
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={styles.kpiTopRow}>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#f0f9ff' }]}>
                  <FolderKanban size={16} color="#0284c7" strokeWidth={2.2} />
                </View>
                <MiniBars color="#0284c7" heights={[10, 16, 22, 28]} />
              </View>
              <Text style={styles.kpiLabel}>ACTIVE PROJECTS</Text>
              <Text style={[styles.kpiValue, { color: '#0284c7' }]}>
                {commMetrics.activeProjects || projects.length}
              </Text>
              <Text style={styles.kpiSubtext} numberOfLines={1}>Field exploration</Text>
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiTopRow}>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#fffbeb' }]}>
                  <TrendingUp size={16} color="#d97706" strokeWidth={2.2} />
                </View>
                <MiniBars color="#d97706" heights={[12, 18, 24, 30]} />
              </View>
              <Text style={styles.kpiLabel}>COMMERCIAL PIPELINE</Text>
              <Text style={[styles.kpiValue, { color: '#d97706' }]}>
                {formatCurrency(commMetrics.pipelineValue || 5664000)}
              </Text>
              <Text style={styles.kpiSubtext} numberOfLines={1}>
                {commMetrics.conversionRate}% conversion rate
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={styles.kpiTopRow}>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#fef2f2' }]}>
                  <FileCheck size={16} color="#dc2626" strokeWidth={2.2} />
                </View>
                <MiniBars color="#dc2626" heights={[14, 20, 26, 28]} />
              </View>
              <Text style={styles.kpiLabel}>PENDING APPROVALS</Text>
              <Text style={[styles.kpiValue, { color: '#dc2626' }]}>
                {commMetrics.pendingApprovals || 1}
              </Text>
              <Text style={styles.kpiSubtext} numberOfLines={1}>Director quotation gate</Text>
            </View>
          </View>
        </View>

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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsScroll}
        >
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Leads')}
            style={styles.actionItem}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#ecfdf5' }]}>
              <Users size={20} color="#059669" strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Leads</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Projects')}
            style={styles.actionItem}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#f0f9ff' }]}>
              <FolderKanban size={20} color="#0284c7" strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Tenders')}
            style={styles.actionItem}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#fffbeb' }]}>
              <Shield size={20} color="#d97706" strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Bids</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('QuoteApprovals')}
            style={styles.actionItem}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#fef2f2' }]}>
              <FileCheck size={20} color="#dc2626" strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Approvals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Vendors')}
            style={styles.actionItem}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#f5f3ff' }]}>
              <Truck size={20} color="#7c3aed" strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Vendors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('MisReports')}
            style={styles.actionItem}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#f0fdf4' }]}>
              <BarChart3 size={20} color="#16a34a" strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Reports</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Geological Project</Text>
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
          activeOpacity={0.85}
          onPress={() => {
            if (featuredProject) {
              navigation.navigate('ProjectDetail', { projectId: featuredProject.id });
            } else {
              navigation.navigate('Projects');
            }
          }}
          style={styles.projectCard}
        >
          <View style={styles.projectHeaderRow}>
            <Image source={drillingRigImg} style={styles.projectThumb} />
            <View style={styles.projectMainInfo}>
              <View style={styles.projectBadgeRow}>
                <View style={styles.projectCodeBadge}>
                  <Text style={styles.projectCodeText}>
                    {featuredProject?.projectCode || 'PRJ-GEO-2026-001'}
                  </Text>
                </View>
                <View style={styles.projectStageBadge}>
                  <Text style={styles.projectStageText}>
                    {featuredProject?.stageName ? `Stage 3: ${featuredProject.stageName}` : 'Stage 3: Task Execution'}
                  </Text>
                </View>
              </View>

              <Text style={styles.projectTitle} numberOfLines={2}>
                {featuredProject?.title || 'Bhilwara Lead-Zinc Exploration Block'}
              </Text>

              <View style={styles.projectLocationRow}>
                <MapPin size={11} color={colors.textSecondary} />
                <Text style={styles.projectLocationText} numberOfLines={1}>
                  {featuredProject?.clientName || 'Hindustan Zinc Ltd'} • {featuredProject?.location || 'Bhilwara, Rajasthan'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.projectFooter}>
            <View style={styles.projectBudgetCol}>
              <View style={styles.budgetLabelRow}>
                <Coins size={12} color={colors.primaryDark} />
                <Text style={styles.budgetLabel}>Baseline Budget</Text>
              </View>
              <Text style={styles.budgetValue}>
                {formatCurrency(featuredProject?.baselineBudget || 4200000)}
              </Text>
            </View>

            <View style={styles.projectProgressCol}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Execution</Text>
                <Text style={styles.progressPercent}>60%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '60%' }]} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

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

        <View style={styles.activityList}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Projects')}
            style={styles.activityItem}
          >
            <View style={[styles.activityIconCircle, { backgroundColor: '#ecfdf5' }]}>
              <FileText size={16} color="#059669" strokeWidth={2.2} />
            </View>
            <View style={styles.activityTextCol}>
              <Text style={styles.activityItemTitle}>New Exploration Project Created</Text>
              <Text style={styles.activityItemSub} numberOfLines={1}>
                {featuredProject?.title || 'Bhilwara Lead-Zinc Exploration Block'}
              </Text>
            </View>
            <Text style={styles.activityTimeText}>2h ago</Text>
            <ChevronRight size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('QuoteApprovals')}
            style={styles.activityItem}
          >
            <View style={[styles.activityIconCircle, { backgroundColor: '#f0f9ff' }]}>
              <CheckCircle2 size={16} color="#0284c7" strokeWidth={2.2} />
            </View>
            <View style={styles.activityTextCol}>
              <Text style={styles.activityItemTitle}>Commercial Quotation Pending</Text>
              <Text style={styles.activityItemSub} numberOfLines={1}>
                QTE-2026-042 • Tata Steel Exploration
              </Text>
            </View>
            <Text style={styles.activityTimeText}>5h ago</Text>
            <ChevronRight size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.roleSummaryCard}>
          <View style={styles.roleHeaderRow}>
            <View style={styles.roleIconWrap}>
              <Layers size={18} color={colors.primaryDark} strokeWidth={2.2} />
            </View>
            <View style={styles.roleTitleCol}>
              <Text style={styles.roleHeaderTitle}>{roleTitle}</Text>
              <Text style={styles.roleHeaderSubtitle}>Authorized Role Scope</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => navigation.navigate('MisReports')}
              style={styles.roleActionBtn}
            >
              <Text style={styles.roleActionText}>View MIS</Text>
              <ArrowRight size={12} color={colors.primaryDark} strokeWidth={2} />
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
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    ...shadows.xs,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
  },
  avatarInitialsBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#14b8a6',
  },
  avatarInitialsText: {
    fontSize: 15,
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
    width: 16,
    height: 16,
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
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  companySubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
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
    minWidth: 15,
    height: 15,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  bellBadgeText: {
    fontSize: 8.5,
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
  },

  attendanceCommandCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
    ...shadows.xs,
  },
  attendanceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  attendanceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotPresent: {
    backgroundColor: colors.success,
  },
  dotAbsent: {
    backgroundColor: colors.warning,
  },
  attendanceCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  geotagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  geotagBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  attendanceTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  timingCol: {
    alignItems: 'center',
    flex: 1,
  },
  timingDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderMedium,
  },
  timingLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  timingValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  punchActionBtn: {
    marginTop: 0,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  timePillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  timePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  timePillActive: {
    backgroundColor: colors.primaryDark,
  },
  timePillText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timePillTextActive: {
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
    fontWeight: '700',
  },

  kpiContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.xs,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  kpiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  kpiSubtext: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },

  quickActionsScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
    marginBottom: spacing.lg,
  },
  actionItem: {
    alignItems: 'center',
    width: 56,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.xs,
  },
  actionLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },

  projectCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
    ...shadows.xs,
  },
  projectHeaderRow: {
    flexDirection: 'row',
  },
  projectThumb: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
  },
  projectMainInfo: {
    flex: 1,
    paddingLeft: spacing.md,
    justifyContent: 'space-between',
  },
  projectBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  projectCodeBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  projectCodeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  projectStageBadge: {
    backgroundColor: colors.accentBg,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.full,
  },
  projectStageText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.accentDark,
  },
  projectTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 16,
  },
  projectLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  projectLocationText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  projectBudgetCol: {
    flex: 1,
  },
  budgetLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  budgetLabel: {
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
  budgetValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 1,
  },
  projectProgressCol: {
    width: 90,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  progressLabel: {
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
  progressPercent: {
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

  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
    ...shadows.xs,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  activityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  activityTextCol: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activityItemSub: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  activityTimeText: {
    fontSize: 10,
    color: colors.textTertiary,
    marginRight: spacing.xs,
  },

  roleSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.xs,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  roleIconWrap: {
    width: 30,
    height: 30,
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
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  roleHeaderSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
  },
  roleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.full,
  },
  roleActionText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  roleDescText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
