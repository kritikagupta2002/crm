import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Shield, Mail, LogOut, RefreshCw, Check, Building2 } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Button, ConfirmationModal } from '../../components/common';
import { colors, spacing, radius, shadows } from '../../theme';
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
          subtitle="User settings & operational security"
          badge="Executive Profile"
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      {/* Profile Identity Header Block */}
      <View style={styles.identityCard}>
        <Image source={drRajeshImg} style={styles.avatarImage} />
        <View style={styles.identityInfoCol}>
          <Text style={styles.nameText}>
            {(session as any)?.name || 'Dr. Rajesh Bansal'}
          </Text>
          <Text style={styles.designationText} numberOfLines={1}>
            {(session as any)?.designation || 'Managing Director & Chief Geoscientist'}
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{role.toUpperCase()}</Text>
            </View>
            <View style={styles.idTag}>
              <Text style={styles.idTagText}>ID: {(session as any).employeeId || 'EMP-001'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Account Information Settings Group */}
      <Text style={styles.groupHeader}>Account Information</Text>
      <View style={styles.settingsGroup}>
        <View style={styles.settingsRow}>
          <View style={styles.rowIconBox}>
            <Mail size={16} color={colors.primaryDark} strokeWidth={2} />
          </View>
          <View style={styles.rowTextCol}>
            <Text style={styles.rowLabel}>Work Email</Text>
            <Text style={styles.rowValue}>{(session as any)?.email || 'rajesh.bansal@bansalgeo.com'}</Text>
          </View>
        </View>

        <View style={styles.rowDivider} />

        <View style={styles.settingsRow}>
          <View style={styles.rowIconBox}>
            <Building2 size={16} color={colors.primaryDark} strokeWidth={2} />
          </View>
          <View style={styles.rowTextCol}>
            <Text style={styles.rowLabel}>Organization</Text>
            <Text style={styles.rowValue}>Bansal Geological Services Pvt Ltd</Text>
          </View>
        </View>

        <View style={styles.rowDivider} />

        <View style={styles.settingsRow}>
          <View style={styles.rowIconBox}>
            <Shield size={16} color={colors.primaryDark} strokeWidth={2} />
          </View>
          <View style={styles.rowTextCol}>
            <Text style={styles.rowLabel}>Access Tier</Text>
            <Text style={styles.rowValue}>Executive Level • 8 Workspaces Authorized</Text>
          </View>
        </View>
      </View>

      {/* Persona Switcher (Administrative / Testing) */}
      {session?.accountType === 'team' ? (
        <>
          <Text style={styles.groupHeader}>TESTING / DEMO / ROLE PREVIEW</Text>
          <View style={styles.settingsGroup}>
            {(['admin', 'hr', 'accountant', 'lead', 'employee'] as TeamRole[]).map((r, idx) => {
              const isCurrent = role === r;
              const p = TEAM_PERSONAS[r];
              const isLast = idx === 4;

              return (
                <React.Fragment key={r}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleRoleSwitch(r)}
                    style={[styles.personaRow, isCurrent && styles.personaRowActive]}
                  >
                    <View style={styles.personaTextCol}>
                      <View style={styles.personaTitleRow}>
                        <Text style={[styles.personaRoleTitle, isCurrent && styles.personaRoleTitleActive]}>
                          {r.toUpperCase()}
                        </Text>
                        <Text style={styles.personaName} numberOfLines={1} ellipsizeMode="tail">
                          — {p.name}
                        </Text>
                      </View>
                      <Text style={styles.personaDesignation} numberOfLines={1}>
                        {p.designation} • {p.department}
                      </Text>
                    </View>

                    {isCurrent ? (
                      <View style={styles.activeCheckPill}>
                        <Check size={12} color="#ffffff" strokeWidth={3} />
                      </View>
                    ) : (
                      <View style={styles.inactiveDot} />
                    )}
                  </TouchableOpacity>
                  {!isLast ? <View style={styles.rowDivider} /> : null}
                </React.Fragment>
              );
            })}
          </View>
        </>
      ) : null}

      {/* Demo Data Management */}
      <Text style={styles.groupHeader}>Data & Storage</Text>
      <View style={styles.settingsGroup}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleResetDemoData}
          style={styles.settingsActionRow}
          disabled={resetting}
        >
          <View style={styles.rowIconBox}>
            <RefreshCw size={16} color={colors.warning} strokeWidth={2} />
          </View>
          <View style={styles.rowTextCol}>
            <Text style={styles.rowLabelDanger}>Reset Local Mock Storage</Text>
            <Text style={styles.rowSub}>Restore local factory default mock state</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* About Application */}
      <Text style={styles.groupHeader}>About Application</Text>
      <View style={styles.settingsGroup}>
        <View style={styles.settingsRow}>
          <View style={styles.rowTextCol}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>v2.4.1 (Enterprise Native Build)</Text>
          </View>
        </View>
        <View style={styles.rowDivider} />
        <View style={styles.settingsRow}>
          <View style={styles.rowTextCol}>
            <Text style={styles.rowLabel}>Governance & Security</Text>
            <Text style={styles.rowValue}>Offline-First • ISO 9001:2015 & DGMS Compliant</Text>
          </View>
        </View>
      </View>

      {/* Session Sign Out */}
      <Button
        title="Sign Out of Session"
        variant="secondary"
        size="md"
        onPress={() => setShowLogoutModal(true)}
        icon={<LogOut size={16} color={colors.danger} />}
        textStyle={{ color: colors.danger }}
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
  /* Identity Card */
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
    ...shadows.xs,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    marginRight: spacing.md,
  },
  identityInfoCol: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  designationText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
    fontWeight: '400',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  roleTag: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  roleTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  idTag: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: radius.sm,
  },
  idTagText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.textMuted,
  },

  /* Group Header */
  groupHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs + 2,
    marginLeft: 2,
  },

  /* Settings Group Container */
  settingsGroup: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.xs,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 3,
    paddingHorizontal: spacing.md,
  },
  settingsActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
  },
  rowIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md - 2,
  },
  rowTextCol: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rowLabelDanger: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 1,
  },
  rowSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.md + 32,
  },

  /* Persona Row */
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  personaRowActive: {
    backgroundColor: colors.primaryBg,
  },
  personaTextCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  personaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  personaRoleTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  personaRoleTitleActive: {
    color: colors.primaryDark,
  },
  personaName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  personaDesignation: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  activeCheckPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
  },

  logoutBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
    borderColor: colors.border.default,
  },
});
