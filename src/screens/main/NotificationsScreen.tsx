import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle, ShieldAlert, Check } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, EmptyState, SegmentedControl } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useNotifications } from '../../context/NotificationContext';
import { AppNotification } from '../../types';

interface NotificationsScreenProps {
  navigation: any;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filterIndex, setFilterIndex] = useState(0);
  const filterOptions = ['All Alerts', 'Unread', 'Critical'];

  const filteredNotifs = notifications.filter((item) => {
    if (filterIndex === 1) return !item.read;
    if (filterIndex === 2) return item.type === 'danger' || item.type === 'warning';
    return true;
  });

  const getIconData = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={18} color="#059669" strokeWidth={2.2} />,
          bg: '#ecfdf5',
          border: '#a7f3d0',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={18} color="#d97706" strokeWidth={2.2} />,
          bg: '#fffbeb',
          border: '#fde68a',
        };
      case 'danger':
        return {
          icon: <XCircle size={18} color="#dc2626" strokeWidth={2.2} />,
          bg: '#fef2f2',
          border: '#fecaca',
        };
      case 'info':
      default:
        return {
          icon: <Info size={18} color="#0284c7" strokeWidth={2.2} />,
          bg: '#f0f9ff',
          border: '#bae6fd',
        };
    }
  };

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="System Notifications"
          subtitle={`${unreadCount} unread operational alerts`}
          showBack
          scenicBanner
          badge="Security & Alerts"
          onBack={() => navigation.goBack()}
          rightAction={
            unreadCount > 0 ? (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={markAllAsRead}
                style={styles.markAllBtn}
              >
                <CheckCheck size={14} color="#ffffff" strokeWidth={2.2} />
                <Text style={styles.markAllText}>Mark Read</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      }
    >
      <SegmentedControl
        options={filterOptions}
        selectedIndex={filterIndex}
        onSelect={setFilterIndex}
      />

      {filteredNotifs.length === 0 ? (
        <EmptyState
          title="No Alerts Found"
          description={
            filterIndex === 1
              ? 'You have read all current notifications.'
              : 'You are completely caught up with all operational alerts.'
          }
          icon={<Bell size={36} color="#64748b" />}
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
              >
                <View
                  style={[
                    styles.notifCard,
                    item.read ? styles.readCard : styles.unreadCard,
                  ]}
                >
                  <View style={[styles.iconCol, { backgroundColor: bg, borderColor: border }]}>
                    {icon}
                  </View>
                  <View style={styles.contentCol}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.title, !item.read && styles.unreadTitle]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.time}>{item.timestamp}</Text>
                    </View>
                    <Text style={styles.message}>{item.message}</Text>
                  </View>
                  {!item.read ? <View style={styles.unreadDot} /> : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.huge + 20,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(13, 148, 136, 0.85)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  markAllText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '800',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
    position: 'relative',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0d9488',
    backgroundColor: '#ffffff',
  },
  readCard: {
    backgroundColor: '#ffffff',
    opacity: 0.72,
  },
  iconCol: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
    marginBottom: 3,
  },
  title: {
    fontSize: typography.fontSizes.sm,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  time: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  message: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0d9488',
    marginTop: 4,
  },
});
