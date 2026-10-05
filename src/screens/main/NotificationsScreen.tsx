import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react-native';
import { ScreenContainer, AppHeader, EmptyState, SegmentedControl } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useNotifications } from '../../context/NotificationContext';
import { AppNotification } from '../../types';

interface NotificationsScreenProps {
  navigation: any;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filterIndex, setFilterIndex] = useState(0);

  const criticalCount = useMemo(
    () => notifications.filter((n) => n.type === 'danger' || n.type === 'warning').length,
    [notifications]
  );

  const filterOptions = useMemo(
    () => [
      `All (${notifications.length})`,
      `Unread (${unreadCount})`,
      `Critical (${criticalCount})`,
    ],
    [notifications.length, unreadCount, criticalCount]
  );

  const filteredNotifs = useMemo(() => {
    return notifications.filter((item) => {
      if (filterIndex === 1) return !item.read;
      if (filterIndex === 2) return item.type === 'danger' || item.type === 'warning';
      return true;
    });
  }, [notifications, filterIndex]);

  const getIconData = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={16} color={colors.success} strokeWidth={2.2} />,
          bg: colors.successBg,
          border: colors.successLight,
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={16} color={colors.warning} strokeWidth={2.2} />,
          bg: colors.warningBg,
          border: colors.warningLight,
        };
      case 'danger':
        return {
          icon: <XCircle size={16} color={colors.danger} strokeWidth={2.2} />,
          bg: colors.dangerBg,
          border: colors.dangerLight,
        };
      case 'info':
      default:
        return {
          icon: <Info size={16} color={colors.info} strokeWidth={2.2} />,
          bg: colors.infoBg,
          border: colors.infoLight,
        };
    }
  };

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="Notifications"
          subtitle={`${unreadCount} unread operational alerts`}
          showBack
          badge="Alert Center"
          onBack={() => navigation.goBack()}
          rightAction={
            unreadCount > 0 ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={markAllAsRead}
                style={styles.markAllBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CheckCheck size={14} color={colors.primaryDark} strokeWidth={2.2} />
                <Text style={styles.markAllText}>Mark Read</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      }
    >
      <View style={styles.filterWrap}>
        <SegmentedControl
          options={filterOptions}
          selectedIndex={filterIndex}
          onSelect={setFilterIndex}
          style={styles.segmented}
        />
      </View>

      {filteredNotifs.length === 0 ? (
        <EmptyState
          title="No Alerts Found"
          description={
            filterIndex === 1
              ? 'You have read all current notifications.'
              : 'You are completely caught up with all operational alerts.'
          }
          icon={<Bell size={36} color={colors.textMuted} />}
        />
      ) : (
        <FlatList
          data={filteredNotifs}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const { icon, bg, border } = getIconData(item.type);
            return (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => markAsRead(item.id)}
                style={[
                  styles.notifItem,
                  !item.read ? styles.notifUnread : styles.notifRead,
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: bg, borderColor: border }]}>
                  {icon}
                </View>

                <View style={styles.contentCol}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.timestampText}>{item.timestamp}</Text>
                  </View>
                  <Text style={styles.messageText}>{item.message}</Text>
                </View>

                {!item.read ? <View style={styles.unreadDot} /> : null}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  filterWrap: {
    paddingTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  segmented: {
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.huge + 32,
    gap: spacing.xs + 3,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.primaryBg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  markAllText: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    padding: spacing.md - 2,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.xs,
  },
  notifUnread: {
    borderLeftWidth: 3.5,
    borderLeftColor: colors.primaryDark,
    backgroundColor: '#ffffff',
  },
  notifRead: {
    opacity: 0.7,
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderLight,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
    borderWidth: 1,
  },
  contentCol: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  itemTitleUnread: {
    fontWeight: '700',
  },
  timestampText: {
    fontSize: 10,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryDark,
    marginTop: 4,
    marginLeft: 4,
  },
});
