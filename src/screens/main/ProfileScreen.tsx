import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { User, Shield, Briefcase, Mail, Phone, LogOut, RefreshCw, Crown, Check, Building2 } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, Button, StatusBadge, ConfirmationModal } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { TeamRole } from '../../types';
import { TEAM_PERSONAS } from '../../constants';

const drRajeshImg = require('../../../assets/dr-rajesh-bansal.jpg');

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { session, role, switchTeamRole, logout, resetAppData } = useAuth();
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
              await resetAppData();
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
          title="Account & Profile"
          subtitle="User settings & operational role switcher"
          scenicBanner
          badge="Executive Profile"
          badgeIcon={<Crown size={11} color="#ffffff" strokeWidth={2.4} />}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image source={drRajeshImg} style={styles.avatarImage} />
          <View style={styles.avatarCrownBadge}>
            <Crown size={11} color="#ffffff" strokeWidth={2.4} />
            <Text style={styles.avatarCrownText}>{role.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.name}>
          {(session as any)?.name || 'Dr. Rajesh Bansal'}
        </Text>
        <Text style={styles.designation}>
          {(session as any)?.designation || 'Managing Director & Chief Geoscientist'}
        </Text>
        <View style={styles.companyRow}>
          <Building2 size={13} color="#0d9488" />
          <Text style={styles.department}>
            {(session as any)?.department ? `Bansal Geo • ${(session as any).department}` : 'Bansal Geological Services Pvt Ltd'}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>ROLE: {role.toUpperCase()}</Text>
          </View>
          {session?.accountType === 'team' ? (
            <View style={styles.idTag}>
              <Text style={styles.idTagText}>ID: {(session as any).employeeId || 'EMP-001'}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Card>
        <Text style={styles.cardHeader}>User Credentials</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrapper}>
            <Mail size={16} color="#0d9488" strokeWidth={2} />
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Work Email</Text>
            <Text style={styles.infoText}>{(session as any)?.email || 'rajesh.bansal@bansalgeo.com'}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrapper}>
            <Shield size={16} color="#0d9488" strokeWidth={2} />
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Account Authorization</Text>
            <Text style={styles.infoText}>
              {session?.accountType.toUpperCase()} • All 8 Workspaces Unlocked
            </Text>
          </View>
        </View>
      </Card>

      {session?.accountType === 'team' ? (
        <Card>
          <Text style={styles.cardHeader}>Switch Active Persona</Text>
          <Text style={styles.cardSubtitle}>
            Test role-based workspace permissions & module guards instantly:
          </Text>

          {(['admin', 'hr', 'accountant', 'lead', 'employee'] as TeamRole[]).map((r) => {
            const isCurrent = role === r;
            const p = TEAM_PERSONAS[r];
            return (
              <TouchableOpacity
                key={r}
                activeOpacity={0.75}
                onPress={() => handleRoleSwitch(r)}
                style={[styles.roleOption, isCurrent ? styles.roleOptionActive : null]}
              >
                <View style={styles.roleCol}>
                  <Text style={[styles.roleTitle, isCurrent ? styles.roleTitleActive : null]}>
                    {r.toUpperCase()} — {p.name}
                  </Text>
                  <Text style={styles.roleSub}>{p.designation} • {p.department}</Text>
                </View>
                {isCurrent ? (
                  <View style={styles.activeCheckWrapper}>
                    <Check size={14} color="#0d9488" strokeWidth={2.8} />
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.cardHeader}>Demo Data Management</Text>
        <Text style={styles.cardSubtitle}>
          Reset all mock records back to factory defaults:
        </Text>
        <Button
          title="Reset Local Storage to Defaults"
          variant="outline"
          size="sm"
          onPress={handleResetDemoData}
          loading={resetting}
          icon={<RefreshCw size={16} color="#0d9488" />}
          style={styles.resetBtn}
        />
      </Card>

      <Button
        title="Sign Out of Session"
        variant="danger"
        size="lg"
        onPress={() => setShowLogoutModal(true)}
        icon={<LogOut size={18} color="#ffffff" />}
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
    backgroundColor: '#ffffff',
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#0d9488',
  },
  avatarCrownBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0d9488',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    ...shadows.xs,
  },
  avatarCrownText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  designation: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  department: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginTop: spacing.md,
  },
  roleTag: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f766e',
  },
  idTag: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  idTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  cardHeader: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  cardSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: '#64748b',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    gap: spacing.md,
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: typography.fontSizes.sm,
    color: '#0f172a',
    fontWeight: '700',
    marginTop: 1,
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleOptionActive: {
    backgroundColor: '#f0fdfa',
    borderColor: '#99f6e4',
  },
  roleCol: {
    flex: 1,
  },
  roleTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '800',
    color: '#0f172a',
  },
  roleTitleActive: {
    color: '#0f766e',
  },
  roleSub: {
    fontSize: typography.fontSizes.xxs,
    color: '#64748b',
    marginTop: 2,
  },
  activeCheckWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0d9488',
  },
  resetBtn: {
    marginTop: spacing.xs,
  },
  logoutBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
