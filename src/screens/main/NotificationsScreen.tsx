import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Check,
  Calendar,
  Users,
  FileText,
  Building2,
  CheckSquare,
  Receipt,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';
import { colors, radius, shadows } from '../../theme';
import { useNotifications } from '../../context/NotificationContext';

interface NotificationsScreenProps {
  navigation: any;
}

interface AlertItem {
  id: string;
  title: string;
  message: string;
  dateStr: string;
  timeAgo: string;
  category: 'Approvals' | 'Tasks' | 'Finance' | 'HR' | 'Projects' | 'Documents' | 'Vendor';
  badges: Array<{ label: string; bg: string; text: string }>;
  iconType: 'leave' | 'quote' | 'vendor' | 'doc' | 'task' | 'expense' | 'employee';
  iconBg: string;
  iconColor: string;
  read: boolean;
  actionRequired?: boolean;
  actionLabel: string;
  actionPrimary?: boolean;
  route: string;
  routeParams?: any;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth <= 360;

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Canonical operational alerts matching the exact reference UI
  const [alertsList, setAlertsList] = useState<AlertItem[]>([
    // Section 1: TODAY
    {
      id: 'alert-1',
      title: 'New Leave Request',
      message: 'Neha Gupta applied for 3 days Casual Leave (CL) starting 12-Oct-2026.',
      dateStr: '6 Oct 2026',
      timeAgo: '2 hours ago',
      category: 'HR',
      badges: [
        { label: 'ACTION REQUIRED', bg: '#fee2e2', text: '#ef4444' },
        { label: 'HR', bg: '#f1f5f9', text: '#64748b' },
      ],
      iconType: 'leave',
      iconBg: '#ecfdf5',
      iconColor: '#16a34a',
      read: false,
      actionRequired: true,
      actionLabel: 'Authorize',
      actionPrimary: true,
      route: 'LeaveApprovals',
    },
    {
      id: 'alert-2',
      title: 'Quotation Approved',
      message: 'Director approved quotation QT-BGSPL-2026-041 for Hindustan Zinc Ltd (₹47.20 Lakhs).',
      dateStr: '6 Oct 2026',
      timeAgo: '5 hours ago',
      category: 'Finance',
      badges: [
        { label: 'APPROVED', bg: '#ecfdf5', text: '#059669' },
        { label: 'FINANCE', bg: '#f1f5f9', text: '#64748b' },
      ],
      iconType: 'quote',
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      read: false,
      actionRequired: false,
      actionLabel: 'View Details',
      actionPrimary: false,
      route: 'ClientApprovals',
    },
    {
      id: 'alert-3',
      title: 'New vendor application received',
      message: 'Rajasthan Drilling Co. submitted vendor application for drilling services.',
      dateStr: '6 Oct 2026',
      timeAgo: '6 hours ago',
      category: 'Vendor',
      badges: [
        { label: 'NEW', bg: '#eff6ff', text: '#2563eb' },
        { label: 'VENDOR', bg: '#fff7ed', text: '#ea580c' },
      ],
      iconType: 'vendor',
      iconBg: '#fefce8',
      iconColor: '#d97706',
      read: true,
      actionRequired: false,
      actionLabel: 'Review',
      actionPrimary: false,
      route: 'VendorApplications',
    },

    // Section 2: EARLIER
    {
      id: 'alert-4',
      title: 'Document verified',
      message: 'Geological mapping report INV-2026-001 has been verified and moved to archive.',
      dateStr: '5 Oct 2026',
      timeAgo: '1 day ago',
      category: 'Documents',
      badges: [
        { label: 'UPDATED', bg: '#faf5ff', text: '#9333ea' },
        { label: 'DOCUMENTS', bg: '#f1f5f9', text: '#64748b' },
      ],
      iconType: 'doc',
      iconBg: '#faf5ff',
      iconColor: '#9333ea',
      read: true,
      actionRequired: false,
      actionLabel: 'View',
      actionPrimary: false,
      route: 'Documents',
    },
    {
      id: 'alert-5',
      title: 'New task assigned',
      message: 'Site visit and initial sampling for Bhilwara project.',
      dateStr: '5 Oct 2026',
      timeAgo: '1 day ago',
      category: 'Projects',
      badges: [
        { label: 'TASK ASSIGNED', bg: '#eff6ff', text: '#0284c7' },
        { label: 'PROJECTS', bg: '#f1f5f9', text: '#64748b' },
      ],
      iconType: 'task',
      iconBg: '#fff7ed',
      iconColor: '#ea580c',
      read: true,
      actionRequired: false,
      actionLabel: 'Open Task',
      actionPrimary: false,
      route: 'Tasks',
    },
    {
      id: 'alert-6',
      title: 'Expense approval pending',
      message: 'Rohit Meena submitted travel reimbursement claim (₹12,450).',
      dateStr: '5 Oct 2026',
      timeAgo: '1 day ago',
      category: 'Approvals',
      badges: [
        { label: 'PENDING', bg: '#fefce8', text: '#d97706' },
        { label: 'EXPENSES', bg: '#f1f5f9', text: '#64748b' },
      ],
      iconType: 'expense',
      iconBg: '#ecfdf5',
      iconColor: '#059669',
      read: true,
      actionRequired: false,
      actionLabel: 'Review',
      actionPrimary: false,
      route: 'Expenses',
    },
    {
      id: 'alert-7',
      title: 'New employee added',
      message: 'Test Kumar has been added to the system.',
      dateStr: '5 Oct 2026',
      timeAgo: '2 days ago',
      category: 'HR',
      badges: [
        { label: 'INFO', bg: '#eff6ff', text: '#2563eb' },
        { label: 'HR', bg: '#f1f5f9', text: '#64748b' },
      ],
      iconType: 'employee',
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      read: true,
      actionRequired: false,
      actionLabel: 'View Profile',
      actionPrimary: false,
      route: 'EmployeeDirectory',
    },
  ]);

  const handleMarkAllRead = () => {
    markAllAsRead();
    setAlertsList((prev) =>
      prev.map((item) => ({ ...item, read: true, actionRequired: false }))
    );
  };

  const handleAlertPress = (item: AlertItem) => {
    setAlertsList((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, read: true, actionRequired: false } : a))
    );
    markAsRead(item.id);
    navigation.navigate(item.route, item.routeParams);
  };

  const handleActionPress = (item: AlertItem) => {
    setAlertsList((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, read: true, actionRequired: false } : a))
    );
    markAsRead(item.id);
    navigation.navigate(item.route, item.routeParams);
  };

  const unreadAlertsCount = useMemo(() => {
    return alertsList.filter((a) => !a.read).length;
  }, [alertsList]);

  // Tab definitions with dynamic accurate counts
  const filterTabs = useMemo(() => {
    const approvalsCount = alertsList.filter(
      (a) =>
        a.category === 'Approvals' ||
        a.actionRequired ||
        a.badges.some(
          (b) =>
            b.label === 'ACTION REQUIRED' ||
            b.label === 'APPROVED' ||
            b.label === 'PENDING'
        )
    ).length;
    const tasksCount = alertsList.filter(
      (a) => a.category === 'Tasks' || a.category === 'Projects'
    ).length;
    const financeCount = alertsList.filter((a) => a.category === 'Finance').length;
    const hrCount = alertsList.filter((a) => a.category === 'HR').length;
    const vendorCount = alertsList.filter((a) => a.category === 'Vendor').length;
    const docCount = alertsList.filter((a) => a.category === 'Documents').length;

    return [
      {
        id: 'All',
        label: 'All',
        count: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
        countBg: 'rgba(255,255,255,0.25)',
        countColor: '#ffffff',
      },
      {
        id: 'Approvals',
        label: 'Approvals',
        count: approvalsCount > 0 ? approvalsCount : undefined,
        countBg: '#fee2e2',
        countColor: '#ef4444',
      },
      {
        id: 'Tasks',
        label: 'Tasks',
        count: tasksCount > 0 ? tasksCount : undefined,
        countBg: '#e0f2fe',
        countColor: '#0284c7',
      },
      {
        id: 'Finance',
        label: 'Finance',
        count: financeCount > 0 ? financeCount : undefined,
        countBg: '#dcfce7',
        countColor: '#16a34a',
      },
      {
        id: 'HR',
        label: 'HR',
        count: hrCount > 0 ? hrCount : undefined,
        countBg: '#f3e8ff',
        countColor: '#7c3aed',
      },
      {
        id: 'Vendor',
        label: 'Vendor',
        count: vendorCount > 0 ? vendorCount : undefined,
        countBg: '#fff7ed',
        countColor: '#ea580c',
      },
      {
        id: 'Documents',
        label: 'Documents',
        count: docCount > 0 ? docCount : undefined,
        countBg: '#f1f5f9',
        countColor: '#64748b',
      },
    ];
  }, [alertsList, unreadAlertsCount]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'All') return alertsList;
    return alertsList.filter((item) => {
      if (activeFilter === 'Approvals') {
        return (
          item.category === 'Approvals' ||
          item.badges.some((b) => b.label === 'ACTION REQUIRED' || b.label === 'APPROVED' || b.label === 'PENDING')
        );
      }
      return item.category === activeFilter;
    });
  }, [alertsList, activeFilter]);

  const todayItems = useMemo(() => {
    return filteredItems.filter((i) => i.dateStr.includes('6 Oct') || i.timeAgo.includes('hour'));
  }, [filteredItems]);

  const earlierItems = useMemo(() => {
    return filteredItems.filter((i) => !i.dateStr.includes('6 Oct') && !i.timeAgo.includes('hour'));
  }, [filteredItems]);

  const renderIcon = (type: AlertItem['iconType'], color: string) => {
    switch (type) {
      case 'leave':
        return <Users size={22} color={color} strokeWidth={2.3} />;
      case 'quote':
        return <FileText size={22} color={color} strokeWidth={2.3} />;
      case 'vendor':
        return <Building2 size={22} color={color} strokeWidth={2.3} />;
      case 'doc':
        return <FileText size={22} color={color} strokeWidth={2.3} />;
      case 'task':
        return <CheckSquare size={22} color={color} strokeWidth={2.3} />;
      case 'expense':
        return <Receipt size={22} color={color} strokeWidth={2.3} />;
      case 'employee':
      default:
        return <Users size={22} color={color} strokeWidth={2.3} />;
    }
  };

  const renderCard = (item: AlertItem) => {
    const isUnread = !item.read;
    const requiresAction = item.actionRequired && isUnread;

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.85}
        onPress={() => handleAlertPress(item)}
        style={[
          styles.alertCard,
          requiresAction && styles.alertCardActionRequired,
        ]}
      >
        <View style={styles.cardHeaderRow}>
          {/* Left Dot Indicator */}
          <View style={styles.dotContainer}>
            <View
              style={[
                styles.statusDot,
                requiresAction
                  ? styles.dotRed
                  : isUnread
                  ? styles.dotBlue
                  : styles.dotGrey,
              ]}
            />
          </View>

          {/* Icon Box */}
          <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
            {renderIcon(item.iconType, item.iconColor)}
          </View>

          {/* Main Info */}
          <View style={styles.cardInfoCol}>
            {/* Badges line */}
            <View style={styles.badgesLine}>
              {item.badges.map((b, idx) => (
                <View key={idx} style={[styles.pillBadge, { backgroundColor: b.bg }]}>
                  <Text style={[styles.pillBadgeText, { color: b.text }]}>{b.label}</Text>
                </View>
              ))}
              <ChevronRight size={17} color="#94a3b8" style={{ marginLeft: 'auto' }} />
            </View>

            {/* Title */}
            <Text style={styles.cardTitle}>{item.title}</Text>

            {/* Message Description */}
            <Text style={styles.cardMessage}>{item.message}</Text>

            {/* Meta Row (Date & Action Button) */}
            <View style={styles.metaRow}>
              <View style={styles.dateRow}>
                <Calendar size={13} color="#94a3b8" style={{ marginRight: 5 }} />
                <Text style={styles.dateText}>
                  {item.dateStr} • {item.timeAgo}
                </Text>
              </View>

              {/* Contextual Action Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleActionPress(item)}
                style={[
                  styles.actionButton,
                  item.actionPrimary ? styles.actionButtonPrimary : styles.actionButtonSecondary,
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    item.actionPrimary
                      ? styles.actionButtonTextPrimary
                      : styles.actionButtonTextSecondary,
                  ]}
                >
                  {item.actionLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadAlertsCount === 0
              ? '0 unread alerts • All caught up'
              : `${unreadAlertsCount} unread operational alert${unreadAlertsCount > 1 ? 's' : ''}`}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleMarkAllRead}
          style={styles.markAllBtn}
        >
          <Check size={13} color="#0f172a" strokeWidth={2.4} />
          <Text style={styles.markAllText}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;

            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.7}
                onPress={() => setActiveFilter(tab.id)}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
              >
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>

                {tab.count !== undefined ? (
                  <View
                    style={[
                      styles.tabCountCircle,
                      {
                        backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : tab.countBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        { color: isActive ? '#ffffff' : tab.countColor },
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Scrollable Notifications List */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isCompact && { paddingHorizontal: 10 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: TODAY */}
        {todayItems.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleLeft}>
                <Text style={styles.sectionTitleText}>TODAY</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{todayItems.length}</Text>
                </View>
              </View>
              <Text style={styles.sectionDateText}>Tue, 6 Oct 2026</Text>
            </View>

            {todayItems.map((item) => renderCard(item))}
          </View>
        )}

        {/* Section 2: EARLIER */}
        {earlierItems.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleLeft}>
                <Text style={styles.sectionTitleText}>EARLIER</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{earlierItems.length}</Text>
                </View>
              </View>
              <Text style={styles.sectionDateText}>Mon, 5 Oct 2026</Text>
            </View>

            {earlierItems.map((item) => renderCard(item))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  tabsWrapper: {
    backgroundColor: '#ffffff',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabsRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabChipActive: {
    backgroundColor: '#0b2545',
    borderColor: '#0b2545',
  },
  tabChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  tabChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tabCountCircle: {
    marginLeft: 6,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 150,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  sectionBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  sectionBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },
  sectionDateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },

  /* Alert Card */
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
    ...shadows.xs,
  },
  alertCardActionRequired: {
    borderColor: '#fecaca',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dotContainer: {
    width: 14,
    paddingTop: 14,
    alignItems: 'center',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotRed: {
    backgroundColor: '#ef4444',
  },
  dotBlue: {
    backgroundColor: '#2563eb',
  },
  dotGrey: {
    backgroundColor: '#94a3b8',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    marginRight: 12,
  },
  cardInfoCol: {
    flex: 1,
  },
  badgesLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 5,
  },
  pillBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  cardMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#0b2545',
  },
  actionButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonTextPrimary: {
    color: '#ffffff',
  },
  actionButtonTextSecondary: {
    color: '#0f172a',
  },
});
