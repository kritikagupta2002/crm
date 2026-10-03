import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, Button, EmptyState } from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { useNotifications } from '../../context/NotificationContext';
import { AppNotification } from '../../types';

interface NotificationsScreenProps {
  navigation: any;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color={colors.success} />;
      case 'warning':
        return <AlertTriangle size={20} color={colors.warning} />;
      case 'danger':
        return <XCircle size={20} color={colors.danger} />;
      case 'info':
      default:
        return <Info size={20} color={colors.info} />;
    }
  };

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="Notifications"
          subtitle={`${unreadCount} unread system alerts`}
          showBack
          onBack={() => navigation.goBack()}
          rightAction={
            unreadCount > 0 ? (
              <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                <CheckCheck size={18} color={colors.primary} />
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      }
    >
      {notifications.length === 0 ? (
        <EmptyState
          title="No Notifications"
          description="You are completely caught up with all operational alerts."
          icon={<Bell size={48} color={colors.textMuted} />}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => markAsRead(item.id)}
            >
              <Card
                style={{
                  ...styles.notifCard,
                  ...(item.read ? styles.readCard : styles.unreadCard),
                }}
              >
                <View style={styles.iconCol}>{getIcon(item.type)}</View>
                <View style={styles.contentCol}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                      {item.title}
                    </Text>
                    <Text style={styles.time}>{item.timestamp}</Text>
                  </View>
                  <Text style={styles.message}>{item.message}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.huge,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.xs,
  },
  markAllText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  unreadCard: {
    backgroundColor: colors.surface,
    borderLeftWidth: 3.5,
    borderLeftColor: colors.primary,
  },
  readCard: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.85,
  },
  iconCol: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: typography.fontWeights.bold,
  },
  time: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  message: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
