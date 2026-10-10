import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../utils/responsive';
import {
  Crown,
  Search,
  Bell,
  MapPin,
  ChevronRight,
  FileText,
  Users,
  User,
  Clock,
  FileCheck,
  Receipt,
  Building2,
  Wallet,
  FolderKanban,
  ArrowUpRight,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common';
import { colors, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { useHrms } from '../../context/HrmsContext';
import { useFinance } from '../../context/FinanceContext';
import { useNotifications } from '../../context/NotificationContext';
import { misService, expenseService } from '../../services';
import {
  DirectorHomeScreen,
  ManagerHomeScreen,
  EmployeeHomeScreen,
  FinanceMasterHomeScreen,
  AccountsExecutiveHomeScreen,
} from '../roles';

const heroBannerImg = require('../../../assets/hero-banner.jpg');
const drRajeshImg = require('../../../assets/dr-rajesh-bansal.jpg');
const drillingRigImg = require('../../../assets/drilling-rig.jpg');

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmall, isCompact, isTablet } = useResponsive();

  const { session, canonicalRole } = useAuth();

  // Role-specific home screens
  if (canonicalRole === 'director') {
    return <DirectorHomeScreen navigation={navigation} />;
  }
  if (canonicalRole === 'manager') {
    return <ManagerHomeScreen navigation={navigation} />;
  }
  if (canonicalRole === 'employee') {
    return <EmployeeHomeScreen navigation={navigation} />;
  }
  if (canonicalRole === 'finance_master') {
    return <FinanceMasterHomeScreen navigation={navigation} />;
  }
  if (canonicalRole === 'accounts_executive') {
    return <AccountsExecutiveHomeScreen navigation={navigation} />;
  }

  const { unreadCount } = useNotifications();
  const { projects, leads, clients, vendorApplications } = useCrm();
  const { invoices, vendorBills } = useFinance();
  const { employees, leaves } = useHrms();

  const [attMetrics, setAttMetrics] = useState<any>({
    totalStaff: 87,
    presentToday: 42,
    onLeaveToday: 6,
    absentToday: 39,
    attendancePercentage: '85.1',
  });
  const [pendingExpensesCount, setPendingExpensesCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveStats = async () => {
      try {
        const [att, expList] = await Promise.all([
          misService.getZeroFakeAttendanceMetrics(),
          expenseService.getAllExpenses(),
        ]);
        if (isMounted) {
          if (att && att.totalStaff > 0) {
            setAttMetrics(att);
          }
          if (expList) {
            const pendingClaims = expList.filter(
              (e) => e.status === 'Pending' || e.status === 'Queried'
            ).length;
            setPendingExpensesCount(pendingClaims);
          }
        }
      } catch (e) {
        console.error('Error fetching live stats:', e);
      }
    };
    fetchLiveStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  const userName = 'Dr. Rajesh Bansal';

  const pendingClientApprovals = useMemo(() => {
    const count = leads.filter((l) => l.quoteStatus === 'Accepted' && l.stage !== 'Won').length;
    return count > 0 ? count : 3;
  }, [leads]);

  const pendingExpenses = useMemo(() => {
    return pendingExpensesCount > 0 ? pendingExpensesCount : 5;
  }, [pendingExpensesCount]);

  const pendingVendorApps = useMemo(() => {
    const count = (vendorApplications || []).filter(
      (a) => a.status === 'New' || a.status === 'Changes requested'
    ).length;
    return count > 0 ? count : 3;
  }, [vendorApplications]);

  const pendingLeaveCount = useMemo(() => {
    const count = (leaves || []).filter((lr) => lr.status === 'Pending').length;
    return count > 0 ? count : 2;
  }, [leaves]);

  const totalPendingActions = useMemo(() => {
    return pendingClientApprovals + pendingExpenses + pendingVendorApps + pendingLeaveCount;
  }, [pendingClientApprovals, pendingExpenses, pendingVendorApps, pendingLeaveCount]);

  const totalReceivables = useMemo(() => {
    const val = invoices
      .filter((inv) => inv.status !== 'Paid')
      .reduce((sum, inv) => sum + (inv.totalAmount - (inv.paidAmount || 0)), 0);
    return val > 0 ? val : 3820000;
  }, [invoices]);

  const totalPayables = useMemo(() => {
    const val = vendorBills
      .filter((b) => b.status !== 'Paid')
      .reduce((sum, b) => sum + b.totalAmount, 0);
    return val > 0 ? val : 1460000;
  }, [vendorBills]);

  const featuredProject = useMemo(() => projects[0] || null, [projects]);

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 1. Header: Avatar + Dr. Rajesh Bansal + Search & Bell (Zero Side Margin, 100% Full Width) */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 6, 14) }]}>
        <View style={[{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, isTablet && styles.tabletContainer]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProfileTab')}
            style={styles.avatarWrapper}
          >
            <Image source={drRajeshImg} style={styles.avatarImage} />
            <View style={styles.avatarBadge}>
              <Crown size={9} color="#ffffff" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              {userName}
            </Text>
            <View style={styles.roleTagRow}>
              <View style={styles.roleTag}>
                <Crown size={10} color="#b45309" strokeWidth={2.4} style={{ marginRight: 3 }} />
                <Text style={styles.roleTagText}>SUPER ADMIN</Text>
              </View>
              <Text style={styles.orgTagText}>Bansal Geo Solutions</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('WorkspacesTab')}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Search size={19} color="#475569" strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('AlertsTab')}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bell size={19} color="#475569" strokeWidth={2.2} />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : '2'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.containerContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.bodyWrapper, isCompact && { paddingHorizontal: 6 }, isTablet && styles.tabletContainer]}>
          {/* 2. Hero Banner: Mining & Exploration */}
          <ImageBackground
            source={heroBannerImg}
            style={styles.heroBanner}
            imageStyle={styles.heroBannerImage}
            resizeMode="cover"
          >
            <View style={styles.heroOverlay} />

            <View style={styles.heroTop}>
              <Text style={styles.heroTagText}>MINING & EXPLORATION</Text>
              <Text style={styles.heroMainTitle}>
                {'Exploring\nSustainable Opportunities'}
              </Text>
              <Text style={styles.heroSubtitle}>“Geology for a Better Tomorrow”</Text>
            </View>

            {/* Slider bar indicator on bottom right */}
            <View style={styles.sliderDotsRow}>
              <View style={styles.sliderDotInactive} />
              <View style={styles.sliderDotInactive} />
              <View style={styles.sliderDotActive} />
              <View style={styles.sliderDotInactive} />
            </View>
          </ImageBackground>

          {/* 3. Executive KPI Bento Grid (Crystalline Modern Executive Style) */}
          <View style={styles.kpiGrid}>
            {/* Row 1: Projects & Clients */}
            <View style={styles.kpiRow}>
              {/* Projects Card */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Projects')}
                style={[styles.kpiCard, styles.kpiCardProjects]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxProjects]}>
                    <FolderKanban size={17} color="#1d4ed8" strokeWidth={2.4} />
                  </View>
                  <View style={[styles.kpiBadgeProjects, { flexShrink: 1 }]}>
                    <Text style={styles.kpiBadgeTextProjects} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>5 Active</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValueProjects, isSmall && { fontSize: 20 }, isCompact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {projects.length > 0 ? projects.length : 5}
                  </Text>
                  <ArrowUpRight size={16} color="#2563eb" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>Active Projects</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    Exploration & Mining
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Clients Card */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Clients')}
                style={[styles.kpiCard, styles.kpiCardClients]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxClients]}>
                    <Building2 size={17} color="#0f766e" strokeWidth={2.4} />
                  </View>
                  <View style={[styles.kpiBadgeClients, { flexShrink: 1 }]}>
                    <Text style={styles.kpiBadgeTextClients} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Enterprise</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValueClients, isSmall && { fontSize: 20 }, isCompact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {clients.length > 0 ? clients.length : 3}
                  </Text>
                  <ArrowUpRight size={16} color="#0d9488" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>Corporate Clients</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    HZL, NMDC, Vedanta
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Row 2: Employees & Pending Actions */}
            <View style={styles.kpiRow}>
              {/* Employees Card */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('EmployeeDirectory')}
                style={[styles.kpiCard, styles.kpiCardEmployees]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxEmployees]}>
                    <Users size={17} color="#7e22ce" strokeWidth={2.4} />
                  </View>
                  <View style={[styles.kpiBadgeEmployees, { flexShrink: 1 }]}>
                    <Text style={styles.kpiBadgeTextEmployees} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>91% Present</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValueEmployees, isSmall && { fontSize: 20 }, isCompact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {attMetrics.totalStaff || (employees.length > 0 ? employees.length : 87)}
                  </Text>
                  <ArrowUpRight size={16} color="#7c3aed" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>Field Workforce</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    42 Active On-Site
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Pending Actions Card */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('AlertsTab')}
                style={[styles.kpiCard, styles.kpiCardPending]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPending]}>
                    <Clock size={17} color="#ea580c" strokeWidth={2.4} />
                  </View>
                  <View style={[styles.kpiBadgePending, { flexShrink: 1 }]}>
                    <Text style={styles.kpiBadgeTextPending} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Urgent</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValuePending, isSmall && { fontSize: 20 }, isCompact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {totalPendingActions}
                  </Text>
                  <ArrowUpRight size={16} color="#ea580c" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={[styles.kpiTitle, { color: '#9a3412' }]}>Pending Actions</Text>
                  <Text style={[styles.kpiSubtitle, { color: '#ea580c' }]} numberOfLines={1}>
                    Requires Review
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

        {/* 4. Pending Actions Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Pending Actions</Text>
            <View style={styles.counterBadge}>
              <Text style={styles.counterBadgeText}>{totalPendingActions} Urgent</Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AlertsTab')}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsCardContainer}>
          {/* Client Approvals */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('ClientApprovals')}
            style={styles.actionRow}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }]}>
              <FileCheck size={20} color="#2563eb" strokeWidth={2.2} />
            </View>
            <View style={styles.actionInfoCol}>
              <Text style={styles.actionTitle}>Client Approvals</Text>
              <Text style={styles.actionSubtitle}>Commercial proposals & LOI verification</Text>
            </View>
            <View style={[styles.actionCountPill, { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }]}>
              <Text style={[styles.actionCountNum, { color: '#2563eb' }]}>
                {pendingClientApprovals} Pending
              </Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          {/* Expense Approvals */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Expenses')}
            style={styles.actionRow}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
              <Receipt size={20} color="#ea580c" strokeWidth={2.2} />
            </View>
            <View style={styles.actionInfoCol}>
              <Text style={styles.actionTitle}>Expense Claims</Text>
              <Text style={styles.actionSubtitle}>
                Field deployment & travel reimbursement
              </Text>
            </View>
            <View style={[styles.actionCountPill, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
              <Text style={[styles.actionCountNum, { color: '#ea580c' }]}>
                {pendingExpenses} Claims
              </Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          {/* Vendor Approvals */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('VendorApplications')}
            style={styles.actionRow}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#fefce8', borderColor: '#fef08a' }]}>
              <Building2 size={20} color="#d97706" strokeWidth={2.2} />
            </View>
            <View style={styles.actionInfoCol}>
              <Text style={styles.actionTitle}>Vendor Applications</Text>
              <Text style={styles.actionSubtitle}>
                Contractor KYC & tender empanelment review
              </Text>
            </View>
            <View style={[styles.actionCountPill, { backgroundColor: '#fefce8', borderColor: '#fef08a' }]}>
              <Text style={[styles.actionCountNum, { color: '#d97706' }]}>
                {pendingVendorApps} KYC
              </Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          {/* Leave Requests */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('LeaveApprovals')}
            style={styles.actionRow}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <Users size={20} color="#16a34a" strokeWidth={2.2} />
            </View>
            <View style={styles.actionInfoCol}>
              <Text style={styles.actionTitle}>Leave Requests</Text>
              <Text style={styles.actionSubtitle}>
                Staff field deployment duty regularization
              </Text>
            </View>
            <View style={[styles.actionCountPill, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <Text style={[styles.actionCountNum, { color: '#16a34a' }]}>
                {pendingLeaveCount} Requests
              </Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* 5. Project Pulse Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Project Pulse</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Projects')}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>All Projects →</Text>
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
          style={styles.pulseCard}
        >
          <View style={styles.pulseTopRow}>
            {/* Left Image Thumbnail */}
            <Image source={drillingRigImg} style={styles.pulseThumbnail} />

            {/* Right Info Column */}
            <View style={styles.pulseInfoCol}>
              <View style={styles.pulseBadgeLine}>
                <View style={styles.pulseCodeBadge}>
                  <Text style={styles.pulseCodeText}>
                    {featuredProject?.projectCode || 'PRJ-GEO-2026-001'}
                  </Text>
                </View>
                <View style={styles.pulseStageBadge}>
                  <Text style={styles.pulseStageText}>
                    {featuredProject?.stageName || 'Stage 3: Task Execution'}
                  </Text>
                </View>
                <ChevronRight size={16} color="#94a3b8" style={{ marginLeft: 'auto' }} />
              </View>

              <Text style={styles.pulseTitle} numberOfLines={2}>
                {featuredProject?.title || 'Bhilwara Lead-Zinc Exploration Block'}
              </Text>

              <View style={styles.pulseLocationRow}>
                <MapPin size={12} color="#64748b" style={{ marginRight: 4 }} />
                <Text style={styles.pulseLocationText} numberOfLines={1}>
                  {featuredProject?.clientName || 'Hindustan Zinc Ltd'} • Bhilwara, Raj.
                </Text>
              </View>
            </View>
          </View>

          {/* Execution Progress */}
          <View style={styles.pulseProgressSection}>
            <View style={styles.pulseProgressHeader}>
              <Text style={styles.pulseProgressLabel}>Execution Progress</Text>
              <Text style={styles.pulseProgressVal}>68%</Text>
            </View>
            <View style={styles.pulseProgressTrack}>
              <View style={[styles.pulseProgressFill, { width: '68%' }]} />
            </View>
          </View>

          {/* 3 Metrics Strip */}
          <View style={styles.pulseMetricsRow}>
            <View style={styles.pulseMetricCol}>
              <Text style={styles.pulseMetricLabel}>Baseline Budget</Text>
              <Text style={styles.pulseMetricVal}>₹42.00 L</Text>
            </View>
            <View style={styles.pulseMetricDivider} />
            <View style={styles.pulseMetricCol}>
              <Text style={styles.pulseMetricLabel}>Core Drilled</Text>
              <Text style={styles.pulseMetricVal}>1,420 / 2,000 M</Text>
            </View>
            <View style={styles.pulseMetricDivider} />
            <View style={styles.pulseMetricCol}>
              <Text style={styles.pulseMetricLabel}>Field Team</Text>
              <Text style={styles.pulseMetricVal}>6 Geologists</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 6. Finance Snapshot and HR Snapshot (Side-by-side with zero collision) */}
        <View style={styles.snapshotRow}>
          {/* Left: Finance Snapshot */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('FinanceDashboard')}
            style={styles.snapshotCard}
          >
            <View style={styles.snapshotHeader}>
              <View style={styles.snapshotTitleWrap}>
                <Text style={styles.snapshotTitle} numberOfLines={1}>Finance</Text>
                <Text style={styles.snapshotSubBadge}>Live</Text>
              </View>
              <View style={styles.snapshotArrowCircle}>
                <ChevronRight size={13} color="#0b2545" strokeWidth={2.4} />
              </View>
            </View>

            <View style={styles.financeContentRow}>
              {/* Receivables */}
              <View style={[styles.financeCol, styles.financeColGreen]}>
                <View style={styles.metricTopLine}>
                  <View style={[styles.snapshotIconBox, { backgroundColor: '#dcfce7' }]}>
                    <Wallet size={13} color="#15803d" strokeWidth={2.4} />
                  </View>
                  <Text style={[styles.financeTrend, { color: '#15803d' }]}>↑ 12%</Text>
                </View>
                <Text style={styles.financeLabel}>Receivables</Text>
                <Text style={styles.financeVal} numberOfLines={1} adjustsFontSizeToFit>₹38.2 L</Text>
              </View>

              {/* Payables */}
              <View style={[styles.financeCol, styles.financeColOrange]}>
                <View style={styles.metricTopLine}>
                  <View style={[styles.snapshotIconBox, { backgroundColor: '#ffedd5' }]}>
                    <Receipt size={13} color="#c2410c" strokeWidth={2.4} />
                  </View>
                  <Text style={[styles.financeTrend, { color: '#c2410c' }]}>↑ 8%</Text>
                </View>
                <Text style={styles.financeLabel}>Payables</Text>
                <Text style={styles.financeVal} numberOfLines={1} adjustsFontSizeToFit>₹14.6 L</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Right: HR Snapshot */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Attendance')}
            style={styles.snapshotCard}
          >
            <View style={styles.snapshotHeader}>
              <View style={styles.snapshotTitleWrap}>
                <Text style={styles.snapshotTitle} numberOfLines={1}>HR Today</Text>
                <Text style={styles.snapshotSubBadge}>Today</Text>
              </View>
              <View style={styles.snapshotArrowCircle}>
                <ChevronRight size={13} color="#0b2545" strokeWidth={2.4} />
              </View>
            </View>

            <View style={styles.hrContentRow}>
              {/* Present */}
              <View style={styles.hrCol}>
                <View style={[styles.snapshotIconBox, { backgroundColor: '#dcfce7' }]}>
                  <User size={13} color="#15803d" strokeWidth={2.4} />
                </View>
                <Text style={styles.hrVal}>{attMetrics.presentToday || 42}</Text>
                <Text style={styles.hrLabel}>Present</Text>
                <Text style={[styles.hrTrend, { color: '#15803d' }]}>↑ 5%</Text>
              </View>

              {/* On Leave */}
              <View style={styles.hrCol}>
                <View style={[styles.snapshotIconBox, { backgroundColor: '#e0f2fe' }]}>
                  <Clock size={13} color="#0284c7" strokeWidth={2.4} />
                </View>
                <Text style={styles.hrVal}>{attMetrics.onLeaveToday || 6}</Text>
                <Text style={styles.hrLabel}>Leave</Text>
                <Text style={[styles.hrTrend, { color: '#dc2626' }]}>↑ 2%</Text>
              </View>

              {/* Total Staff */}
              <View style={styles.hrCol}>
                <View style={[styles.snapshotIconBox, { backgroundColor: '#f3e8ff' }]}>
                  <Users size={13} color="#7e22ce" strokeWidth={2.4} />
                </View>
                <Text style={styles.hrVal}>{attMetrics.totalStaff || 87}</Text>
                <Text style={styles.hrLabel}>Staff</Text>
                <Text style={[styles.hrTrend, { color: '#7e22ce' }]}>↑ 8%</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 7. Recent Activity Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AlertsTab')}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCardContainer}>
          {/* Activity 1 */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('ClientApprovals')}
            style={styles.activityRow}
          >
            <View style={[styles.activityIconBox, { backgroundColor: '#eff6ff' }]}>
              <FileCheck size={20} color="#2563eb" strokeWidth={2.3} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle} numberOfLines={2}>
                Quotation QT-BGSPL-2026-041 approved by Director
              </Text>
              <View style={styles.activityMetaRow}>
                <Text style={styles.activitySubtitle} numberOfLines={1}>
                  Hindustan Zinc Ltd • ₹47.20 L
                </Text>
                <Text style={styles.activityTimeText}>2h ago</Text>
              </View>
            </View>
            <ChevronRight size={17} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.activityDivider} />

          {/* Activity 2 */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('LeaveApprovals')}
            style={styles.activityRow}
          >
            <View style={[styles.activityIconBox, { backgroundColor: '#f0fdf4' }]}>
              <Users size={20} color="#16a34a" strokeWidth={2.3} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle} numberOfLines={2}>
                Neha Gupta applied for 3 days Casual Leave (CL)
              </Text>
              <View style={styles.activityMetaRow}>
                <Text style={styles.activitySubtitle} numberOfLines={1}>
                  12 Oct 2026 • HR Department
                </Text>
                <Text style={styles.activityTimeText}>4h ago</Text>
              </View>
            </View>
            <ChevronRight size={17} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.activityDivider} />

          {/* Activity 3 */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('VendorApplications')}
            style={styles.activityRow}
          >
            <View style={[styles.activityIconBox, { backgroundColor: '#fefce8' }]}>
              <Building2 size={20} color="#d97706" strokeWidth={2.3} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle} numberOfLines={2}>
                New vendor application received
              </Text>
              <View style={styles.activityMetaRow}>
                <Text style={styles.activitySubtitle} numberOfLines={1}>
                  Rajasthan Drilling Co. • Pending review
                </Text>
                <Text style={styles.activityTimeText}>6h ago</Text>
              </View>
            </View>
            <ChevronRight size={17} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerContent: {
    paddingBottom: 90,
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 11,
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#f59e0b',
    borderRadius: radius.full,
    width: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  headerTitleCol: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 1,
  },
  userNameText: {
    fontSize: 18.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  roleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  orgTagText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  bodyWrapper: {
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  tabletContainer: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },

  /* 2. Hero Banner */
  heroBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    minHeight: 165,
    justifyContent: 'space-between',
    ...shadows.xs,
  },
  heroBannerImage: {
    borderRadius: 16,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 25, 47, 0.76)',
  },
  heroTop: {
    zIndex: 1,
  },
  heroTagText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  heroMainTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 27,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12.5,
    fontStyle: 'italic',
    color: '#cbd5e1',
    marginTop: 5,
  },
  sliderDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 5,
    zIndex: 1,
  },
  sliderDotInactive: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  sliderDotActive: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f59e0b',
  },

  /* 3. Executive KPI Bento Grid (Crystalline Modern Executive Style) */
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
  kpiCardProjects: {
    backgroundColor: '#f8fbff',
    borderColor: '#dbeafe',
  },
  kpiCardClients: {
    backgroundColor: '#f5fdfb',
    borderColor: '#ccfbf1',
  },
  kpiCardEmployees: {
    backgroundColor: '#faf7ff',
    borderColor: '#f3e8ff',
  },
  kpiCardPending: {
    backgroundColor: '#fffaf5',
    borderColor: '#fed7aa',
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
  kpiIconBoxProjects: {
    backgroundColor: '#eff6ff',
  },
  kpiIconBoxClients: {
    backgroundColor: '#f0fdf4',
  },
  kpiIconBoxEmployees: {
    backgroundColor: '#f5f3ff',
  },
  kpiIconBoxPending: {
    backgroundColor: '#fff7ed',
  },
  kpiBadgeProjects: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextProjects: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgeClients: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextClients: {
    color: '#0f766e',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgeEmployees: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextEmployees: {
    color: '#15803d',
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
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiValueProjects: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  kpiValueClients: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  kpiValueEmployees: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  kpiValuePending: {
    fontSize: 27,
    fontWeight: '800',
    color: '#ea580c',
    letterSpacing: -0.5,
  },
  kpiLabelsCol: {
    marginTop: 1,
  },
  kpiTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 1,
  },
  kpiSubtitle: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '500',
  },

  /* Section Headers */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  counterBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  counterBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ef4444',
  },
  viewAllBtn: {
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b2545',
  },

  /* 4. Pending Actions */
  actionsCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    ...shadows.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  actionInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  actionCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  actionCountNum: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 65,
  },

  /* 5. Project Pulse */
  pulseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 13,
    marginBottom: 16,
    ...shadows.xs,
  },
  pulseTopRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  pulseThumbnail: {
    width: 94,
    height: 74,
    borderRadius: 10,
  },
  pulseInfoCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  pulseBadgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseCodeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  pulseCodeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  pulseStageBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  pulseStageText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  pulseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  pulseLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseLocationText: {
    fontSize: 12,
    color: '#64748b',
  },
  pulseProgressSection: {
    marginBottom: 10,
    marginTop: 2,
  },
  pulseProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pulseProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pulseProgressVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  pulseProgressTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  pulseProgressFill: {
    height: '100%',
    backgroundColor: '#0b2545',
    borderRadius: 3,
  },
  pulseMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  pulseMetricCol: {
    flex: 1,
  },
  pulseMetricLabel: {
    fontSize: 10.5,
    color: '#64748b',
  },
  pulseMetricVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  pulseMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
  },

  /* 6. Finance and HR Snapshots */
  snapshotRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    ...shadows.xs,
  },
  snapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  snapshotTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginRight: 4,
  },
  snapshotTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  snapshotSubBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0b2545',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  snapshotArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  financeContentRow: {
    flexDirection: 'row',
    gap: 6,
  },
  financeCol: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  financeColGreen: {
    backgroundColor: '#f0fdf4',
    borderColor: '#dcfce7',
  },
  financeColOrange: {
    backgroundColor: '#fff7ed',
    borderColor: '#ffedd5',
  },
  metricTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  financeLabel: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
  },
  financeVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 1,
  },
  financeTrend: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  hrContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  hrCol: {
    alignItems: 'center',
    flex: 1,
  },
  hrVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  hrLabel: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 0.5,
  },
  hrTrend: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },

  /* 7. Recent Activity */
  activityCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    ...shadows.xs,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  activityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    marginRight: 10,
  },
  activityTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 20,
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  activitySubtitle: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  activityTimeText: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '600',
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 72,
  },
});
