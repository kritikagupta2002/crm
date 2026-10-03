import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { User, Shield, Briefcase, Mail, Phone, LogOut, RefreshCw } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, Button, StatusBadge, ConfirmationModal } from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { TeamRole } from '../../types';
import { TEAM_PERSONAS } from '../../constants';
import { mobileStorage } from '../../storage';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { session, role, switchTeamRole, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetDemoData = async () => {
    Alert.alert(
      'Reset Demo Storage',
      'This will reset all local CRM, HRMS, and Finance data back to factory defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await mobileStorage.resetAllToDefaults();
              Alert.alert('Reset Complete', 'Local data re-initialized.');
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleRoleSwitch = (targetRole: TeamRole) => {
    switchTeamRole(targetRole);
    Alert.alert('Role Switched', `Switched active persona to ${targetRole.toUpperCase()}`);
  };

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title="Account & Settings"
          subtitle="User profile & operational role switcher"
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      {/* 1. User Profile Card */}
      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {((session as any)?.name || (session as any)?.companyName)
              ? ((session as any)?.name || (session as any)?.companyName)
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .slice(0, 2)
              : 'BG'}
          </Text>
        </View>

        <Text style={styles.name}>{(session as any)?.name || (session as any)?.companyName || 'Bansal Geo User'}</Text>
        <Text style={styles.designation}>
          {(session as any)?.designation || 'Operational User'}
        </Text>
        <Text style={styles.department}>
          {(session as any)?.department || 'Bansal Geosurveys Pvt Ltd'}
        </Text>

        <View style={styles.badgeRow}>
          <StatusBadge status={`Role: ${role.toUpperCase()}`} />
          {session?.accountType === 'team' ? (
            <StatusBadge status={`ID: ${(session as any).employeeId}`} />
          ) : null}
        </View>
      </Card>

      {/* 2. Contact Details */}
      <Card>
        <Text style={styles.cardHeader}>User Credentials</Text>
        <View style={styles.infoRow}>
          <Mail size={16} color={colors.textMuted} />
          <Text style={styles.infoText}>{(session as any)?.email || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Shield size={16} color={colors.textMuted} />
          <Text style={styles.infoText}>
            Account Type: {session?.accountType.toUpperCase()}
          </Text>
        </View>
      </Card>

      {/* 3. Fast Role Persona Switcher (For Demo & Verification) */}
      {session?.accountType === 'team' ? (
        <Card>
          <Text style={styles.cardHeader}>Switch Team Persona</Text>
          <Text style={styles.cardSubtitle}>
            Test role-based workspace permissions & module guards instantly:
          </Text>

          {(['admin', 'hr', 'accountant', 'lead', 'employee'] as TeamRole[]).map((r) => {
            const isCurrent = role === r;
            const p = TEAM_PERSONAS[r];
            return (
              <TouchableOpacity
                key={r}
                activeOpacity={0.7}
                onPress={() => handleRoleSwitch(r)}
                style={[styles.roleOption, isCurrent ? styles.roleOptionActive : null]}
              >
                <View style={styles.roleCol}>
                  <Text style={[styles.roleTitle, isCurrent ? styles.roleTitleActive : null]}>
                    {r.toUpperCase()} — {p.name}
                  </Text>
                  <Text style={styles.roleSub}>{p.designation}</Text>
                </View>
                {isCurrent ? <StatusBadge status="ACTIVE" size="sm" /> : null}
              </TouchableOpacity>
            );
          })}
        </Card>
      ) : null}

      {/* 4. Maintenance & Reset */}
      <Card>
        <Text style={styles.cardHeader}>Storage & Data Controls</Text>
        <Button
          title="Reset Local Storage to Seed Defaults"
          variant="outline"
          size="sm"
          onPress={handleResetDemoData}
          loading={resetting}
          icon={<RefreshCw size={16} color={colors.primary} />}
          style={styles.resetBtn}
        />
      </Card>

      {/* 5. Logout */}
      <Button
        title="Sign Out of Session"
        variant="danger"
        size="lg"
        onPress={() => setShowLogoutModal(true)}
        icon={<LogOut size={18} color={colors.textInverse} />}
        style={styles.logoutBtn}
      />

      <ConfirmationModal
        visible={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to end your active session?"
        confirmText="Sign Out"
        confirmVariant="danger"
        onConfirm={async () => {
          setShowLogoutModal(false);
          await logout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.textInverse,
  },
  name: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  designation: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  department: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  cardHeader: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cardSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  infoText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  roleOptionActive: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  roleCol: {
    flex: 1,
  },
  roleTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  roleTitleActive: {
    color: colors.primary,
  },
  roleSub: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  resetBtn: {
    marginTop: spacing.xs,
  },
  logoutBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
