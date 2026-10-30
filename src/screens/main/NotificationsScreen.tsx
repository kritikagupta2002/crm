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

  const [alertsList, setAlertsList] = useState<AlertItem[]>([
    {
      id: 'alert-1',
      title: 'New Leave Request',
      message: 'Neha Gupta applied for 3 days Casual Leave (CL) starting 12-Oct-2026.',
      dateStr: '6 Oct 2026',
      timeAgo: '2 hours ago',
      category: 'HR',
      badges: [
        { label: 'ACTION REQUIRED', bg: '#fbe5e4', text: '#d24c47' },
        { label: 'HR', bg: '#edf1f3', text: '#627079' },
      ],
      iconType: 'leave',
      iconBg: '#e3f4ec',
      iconColor: '#2e9e6b',
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
        { label: 'APPROVED', bg: '#e3f4ec', text: '#2e9e6b' },
        { label: 'FINANCE', bg: '#edf1f3', text: '#627079' },
      ],
      iconType: 'quote',
      iconBg: '#e6effa',
      iconColor: '#2f6fb3',
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
        { label: 'NEW', bg: '#e6effa', text: '#2f6fb3' },
        { label: 'VENDOR', bg: '#f7ebd5', text: '#b07d27' },
      ],
      iconType: 'vendor',
      iconBg: '#fcf0dc',
      iconColor: '#c27a12',
      read: true,
      actionRequired: false,
      actionLabel: 'Review',
      actionPrimary: false,
      route: 'VendorApplications',
    },

    {
      id: 'alert-4',
      title: 'Document verified',
      message: 'Geological mapping report INV-2026-001 has been verified and moved to archive.',
      dateStr: '5 Oct 2026',
      timeAgo: '1 day ago',
      category: 'Documents',
      badges: [
        { label: 'UPDATED', bg: '#f1f5f7', text: '#3d5a6c' },
        { label: 'DOCUMENTS', bg: '#edf1f3', text: '#627079' },
      ],
      iconType: 'doc',
      iconBg: '#f1f5f7',
      iconColor: '#3d5a6c',
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
        { label: 'TASK ASSIGNED', bg: '#e6effa', text: '#2f6fb3' },
        { label: 'PROJECTS', bg: '#edf1f3', text: '#627079' },
      ],
      iconType: 'task',
      iconBg: '#f7ebd5',
      iconColor: '#b07d27',
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
        { label: 'PENDING', bg: '#fcf0dc', text: '#c27a12' },
        { label: 'EXPENSES', bg: '#edf1f3', text: '#627079' },
      ],
      iconType: 'expense',
      iconBg: '#e3f4ec',
      iconColor: '#2e9e6b',
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
        { label: 'INFO', bg: '#e6effa', text: '#2f6fb3' },
        { label: 'HR', bg: '#edf1f3', text: '#627079' },
      ],
      iconType: 'employee',
      iconBg: '#e6effa',
      iconColor: '#2f6fb3',
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
        countBg: '#fbe5e4',
        countColor: '#d24c47',
      },
      {
        id: 'Tasks',
        label: 'Tasks',
        count: tasksCount > 0 ? tasksCount : undefined,
        countBg: '#e6effa',
        countColor: '#2f6fb3',
      },
      {
        id: 'Finance',
        label: 'Finance',
        count: financeCount > 0 ? financeCount : undefined,
        countBg: '#e3f4ec',
        countColor: '#2e9e6b',
      },
      {
        id: 'HR',
        label: 'HR',
        count: hrCount > 0 ? hrCount : undefined,
        countBg: '#e8eef1',
        countColor: '#3d5a6c',
      },
      {
        id: 'Vendor',
        label: 'Vendor',
        count: vendorCount > 0 ? vendorCount : undefined,
        countBg: '#f7ebd5',
        countColor: '#b07d27',
      },
      {
        id: 'Documents',
        label: 'Documents',
        count: docCount > 0 ? docCount : undefined,
        countBg: '#edf1f3',
        countColor: '#627079',
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

          <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
            {renderIcon(item.iconType, item.iconColor)}
          </View>

          <View style={styles.cardInfoCol}>
            <View style={styles.badgesLine}>
              {item.badges.map((b, idx) => (
                <View key={idx} style={[styles.pillBadge, { backgroundColor: b.bg }]}>
                  <Text style={[styles.pillBadgeText, { color: b.text }]}>{b.label}</Text>
                </View>
              ))}
              <ChevronRight size={17} color="#7c8b96" style={{ marginLeft: 'auto' }} />
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>

            <Text style={styles.cardMessage}>{item.message}</Text>

            <View style={styles.metaRow}>
              <View style={styles.dateRow}>
                <Calendar size={13} color="#7c8b96" style={{ marginRight: 5 }} />
                <Text style={styles.dateText}>
                  {item.dateStr} • {item.timeAgo}
                </Text>
              </View>

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
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HomeTab')}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={22} color="#0f2a3d" strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {unreadAlertsCount === 0
                ? '0 unread alerts • All caught up'
                : `${unreadAlertsCount} unread operational alert${unreadAlertsCount > 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleMarkAllRead}
          style={styles.markAllBtn}
        >
          <Check size={13} color="#0f2a3d" strokeWidth={2.4} />
          <Text style={styles.markAllText}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isCompact && { paddingHorizontal: 10 },
        ]}
        showsVerticalScrollIndicator={false}
      >
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
    backgroundColor: '#f4f7f8',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f3',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f4f7f8',
    borderWidth: 1,
    borderColor: '#e1e8eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 26,
    color: '#0f2a3d',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#627079',
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
    borderColor: '#e1e8eb',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f2a3d',
  },
  tabsWrapper: {
    backgroundColor: '#ffffff',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f3',
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
    borderColor: '#e1e8eb',
  },
  tabChipActive: {
    backgroundColor: '#0f2a3d',
    borderColor: '#0f2a3d',
  },
  tabChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4a5b68',
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#627079',
    letterSpacing: 0.8,
  },
  sectionBadge: {
    backgroundColor: '#e1e8eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  sectionBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4a5b68',
  },
  sectionDateText: {
    fontSize: 12,
    color: '#627079',
    fontWeight: '600',
  },

  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#e1e8eb',
    padding: 14,
    marginBottom: 12,
    ...shadows.xs,
  },
  alertCardActionRequired: {
    borderColor: '#f2c4c2',
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
    backgroundColor: '#d24c47',
  },
  dotBlue: {
    backgroundColor: '#2f6fb3',
  },
  dotGrey: {
    backgroundColor: '#7c8b96',
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
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f2a3d',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  cardMessage: {
    fontSize: 13,
    color: '#4a5b68',
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
    color: '#7c8b96',
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#0f2a3d',
  },
  actionButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e8eb',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonTextPrimary: {
    color: '#ffffff',
  },
  actionButtonTextSecondary: {
    color: '#0f2a3d',
  },
});
