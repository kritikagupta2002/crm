import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Shield,
  Settings,
  Bell,
  Globe,
  Crown,
  FileText,
  Send,
  HelpCircle,
  LogOut,
  ChevronRight,
  AlertTriangle,
  Briefcase,
  Users,
  Headphones,
} from 'lucide-react-native';
import { colors, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { ConfirmationModal, Avatar } from '../../components/common';

const heroBannerImg = require('../../../assets/hero-banner.jpg');

interface ProfileScreenProps {
  navigation: any;
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  super_admin: 'Super Admin',
  director: 'Director',
  manager: 'Manager',
  employee: 'Employee',
  finance_master: 'Finance Master',
  accounts_executive: 'Accounts Exec',
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth <= 360;

  const { logout, session, canonicalRole } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const activeRoleBadge = useMemo(
    () => ROLE_DISPLAY_NAMES[canonicalRole] || 'Super Admin',
    [canonicalRole]
  );
  const userName = useMemo(
    () => (session && 'name' in session ? session.name : ''),
    [session]
  );

  const navigateToPersonalInfo = useCallback(() => navigation.navigate('PersonalInfo'), [navigation]);
  const navigateToAccountSecurity = useCallback(() => navigation.navigate('AccountSecurity'), [navigation]);
  const navigateToAppSettings = useCallback(() => navigation.navigate('AppSettings'), [navigation]);
  const navigateToNotificationPreferences = useCallback(() => navigation.navigate('NotificationPreferences'), [navigation]);
  const navigateToLanguage = useCallback(() => navigation.navigate('Language'), [navigation]);
  const navigateToRoleSelection = useCallback(() => navigation.navigate('RoleSelection'), [navigation]);
  const navigateToAuditLog = useCallback(() => navigation.navigate('AuditLog'), [navigation]);
  const navigateToSentMessages = useCallback(() => navigation.navigate('SentMessages'), [navigation]);
  const navigateToHelpSupport = useCallback(() => navigation.navigate('HelpSupport'), [navigation]);
  const handleOpenLogout = useCallback(() => setShowLogoutModal(true), []);
  const handleCloseLogout = useCallback(() => setShowLogoutModal(false), []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={heroBannerImg}
          style={[styles.heroBanner, { paddingTop: Math.max(insets.top + 12, 38) }]}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay} />

          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarWrapper}>
              <Avatar name={userName} size={68} />
              <View style={styles.avatarBadge}>
                <Crown size={11} color="#ffffff" strokeWidth={2.4} />
              </View>
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.profileName}>{userName}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>{activeRoleBadge.toUpperCase()}</Text>
              </View>
              <Text style={styles.companyName}>Bansal Geo Solutions Pvt. Ltd.</Text>
            </View>

            <View style={styles.headerMetricsRow}>
              <View style={styles.headerMetricCol}>
                <Briefcase size={16} color="#d3dce1" strokeWidth={2.2} style={{ marginBottom: 2 }} />
                <Text style={styles.headerMetricVal}>5</Text>
                <Text style={styles.headerMetricLabel}>Projects</Text>
              </View>

              <View style={styles.headerMetricDivider} />

              <View style={styles.headerMetricCol}>
                <Users size={16} color="#d3dce1" strokeWidth={2.2} style={{ marginBottom: 2 }} />
                <Text style={styles.headerMetricVal}>87</Text>
                <Text style={styles.headerMetricLabel}>Employees</Text>
              </View>
            </View>
          </View>

          <Text style={styles.heroMotto}>“Exploring Sustainable Opportunities”</Text>
        </ImageBackground>

        <View style={[styles.bodyContent, isCompact && { paddingHorizontal: 8 }]}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <User size={15} color="#627079" strokeWidth={2.2} />
              <Text style={styles.sectionHeaderText}>ACCOUNT</Text>
            </View>

            <View style={styles.cardContainer}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={navigateToPersonalInfo}
                style={styles.menuRow}
              >
                <View style={[styles.iconBox, { backgroundColor: '#e6effa' }]}>
                  <User size={22} color="#2f6fb3" strokeWidth={2.3} />
                </View>
                <View style={styles.menuInfoCol}>
                  <Text style={styles.menuTitle}>Personal Information</Text>
                  <Text style={styles.menuSubtitle}>Contact details, profile photo, designation</Text>
                </View>
                <ChevronRight size={18} color="#7c8b96" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={navigateToAccountSecurity}
                style={styles.menuRow}
              >
                <View style={[styles.iconBox, { backgroundColor: '#e6effa' }]}>
                  <Shield size={22} color="#2f6fb3" strokeWidth={2.3} />
                </View>
                <View style={styles.menuInfoCol}>
                  <Text style={styles.menuTitle}>Account & Security</Text>
                  <Text style={styles.menuSubtitle}>
                    Password, biometrics, 2FA, active sessions
                  </Text>
                </View>
                <ChevronRight size={18} color="#7c8b96" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Settings size={16} color="#627079" strokeWidth={2.3} />
              <Text style={styles.sectionHeaderText}>APP PREFERENCES</Text>
            </View>

            <View style={styles.cardContainer}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={navigateToAppSettings}
                style={styles.menuRow}
              >
                <View style={[styles.iconBox, { backgroundColor: '#e6effa' }]}>
                  <Settings size={22} color="#2f6fb3" strokeWidth={2.3} />
                </View>
                <View style={styles.menuInfoCol}>
                  <Text style={styles.menuTitle}>App Settings</Text>
                  <Text style={styles.menuSubtitle}>
                    Theme, offline sync, storage limit (250MB)
                  </Text>
                </View>
                <ChevronRight size={18} color="#7c8b96" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={navigateToNotificationPreferences}
                style={styles.menuRow}
              >
                <View style={[styles.iconBox, { backgroundColor: '#e6effa' }]}>
                  <Bell size={22} color="#2f6fb3" strokeWidth={2.3} />
                </View>
                <View style={styles.menuInfoCol}>
                  <Text style={styles.menuTitle}>Notifications</Text>
                  <Text style={styles.menuSubtitle}>
                    Push alerts, email notifications, quiet hours
                  </Text>
                </View>
                <ChevronRight size={18} color="#7c8b96" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={navigateToLanguage}
                style={styles.menuRow}
              >
                <View style={[styles.iconBox, { backgroundColor: '#e6effa' }]}>
                  <Globe size={22} color="#2f6fb3" strokeWidth={2.3} />
                </View>
                <View style={styles.menuInfoCol}>
                  <Text style={styles.menuTitle}>Language</Text>
                  <Text style={styles.menuSubtitle}>System language and regional</Text>
                </View>
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>English</Text>
                </View>
                <ChevronRight size={18} color="#7c8b96" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Crown size={16} color="#627079" strokeWidth={2.3} />
              <Text style={styles.sectionHeaderText}>ADMINISTRATION</Text>
            </View>

            <View style={styles.cardContainer}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={navigateToRoleSelection}
                style={styles.menuRow}
              >
                <View style={[styles.iconBox, { backgroundColor: '#fcf0dc' }]}>
                  <Users size={22} color="#c27a12" strokeWidth={2.3} />
                </View>
                <View style={styles.menuInfoCol}>
                  <Text style={styles.menuTitle}>Switch Role</Text>
                  <Text style={styles.menuSubtitle}>Change operational perspective</Text>
                </View>
                <View style={[styles.badgePill, { backgroundColor: '#fcf0dc' }]}>
                  <Text style={[styles.badgeText, { color: '#9a5f0c' }]}>{activeRoleBadge}</Text>
                </View>
                <ChevronRight size={18} color="#7c8b96" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={navigateToAuditLog}
                style={styles.menuRow}
              >
                <View style={[styles.iconBox, { backgroundColor: '#e6effa' }]}>
                  <FileText size={22} color="#2f6fb3" strokeWidth={2.3} />
                </View>
                <View style={styles.menuInfoCol}>
                  <Text style={styles.menuTitle}>Audit Log</Text>
                  <Text style={styles.menuSubtitle}>System activities & compliance trail</Text>
                </View>
                <ChevronRight size={18} color="#7c8b96" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={navigateToSentMessages}
                style={styles.menuRow}
              >
                <View style={[styles.iconBox, { backgroundColor: '#e6effa' }]}>
                  <Send size={22} color="#2f6fb3" strokeWidth={2.3} />
                </View>
                <View style={styles.menuInfoCol}>
                  <Text style={styles.menuTitle}>Sent Messages</Text>
                  <Text style={styles.menuSubtitle}>Broadcast logs & operational dispatches</Text>
                </View>
                <ChevronRight size={18} color="#7c8b96" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <HelpCircle size={16} color="#627079" strokeWidth={2.3} />
              <Text style={styles.sectionHeaderText}>SUPPORT</Text>
            </View>

            <View style={styles.cardContainer}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={navigateToHelpSupport}
                style={styles.menuRow}
              >
                <View style={[styles.iconBox, { backgroundColor: '#e6effa' }]}>
                  <Headphones size={22} color="#2f6fb3" strokeWidth={2.3} />
                </View>
                <View style={styles.menuInfoCol}>
                  <Text style={styles.menuTitle}>Help & Support</Text>
                  <Text style={styles.menuSubtitle}>Knowledge base, FAQs & IT helpdesk</Text>
                </View>
                <ChevronRight size={18} color="#7c8b96" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <AlertTriangle size={16} color="#d24c47" strokeWidth={2.3} />
              <Text style={[styles.sectionHeaderText, { color: '#d24c47' }]}>DANGER ZONE</Text>
            </View>

            <View style={[styles.cardContainer, styles.dangerCardContainer]}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleOpenLogout}
                style={styles.menuRow}
              >
                <View style={[styles.iconBox, { backgroundColor: '#fbe5e4' }]}>
                  <LogOut size={22} color="#d24c47" strokeWidth={2.3} />
                </View>
                <View style={styles.menuInfoCol}>
                  <Text style={[styles.menuTitle, { color: '#d24c47' }]}>Sign Out</Text>
                  <Text style={styles.menuSubtitle}>Sign out from your account</Text>
                </View>
                <ChevronRight size={18} color="#d24c47" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={showLogoutModal}
        title="Sign Out"
        message={`Are you sure you want to end your ${activeRoleBadge} session?`}
        confirmText="Sign Out"
        confirmVariant="danger"
        onConfirm={async () => {
          handleCloseLogout();
          await logout();
        }}
        onCancel={handleCloseLogout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f8',
  },
  scrollContent: {
    paddingBottom: 110,
  },

  heroBanner: {
    paddingHorizontal: 12,
    paddingBottom: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 25, 47, 0.78)',
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 11,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#c27a12',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfoCol: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 21,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  roleTag: {
    backgroundColor: '#fcf0dc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 3,
    marginBottom: 3,
  },
  roleTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#9a5f0c',
    letterSpacing: 0.5,
  },
  companyName: {
    fontSize: 13,
    color: '#d3dce1',
    fontWeight: '600',
  },
  headerMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 6,
  },
  headerMetricCol: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerMetricVal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerMetricLabel: {
    fontSize: 11,
    color: '#d3dce1',
    fontWeight: '700',
  },
  headerMetricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 4,
  },
  heroMotto: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#e1e8eb',
    marginTop: 12,
    zIndex: 1,
  },

  bodyContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#627079',
    letterSpacing: 0.9,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#e1e8eb',
    overflow: 'hidden',
    ...shadows.xs,
  },
  dangerCardContainer: {
    borderColor: '#fbe5e4',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#edf1f3',
    marginLeft: 78,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f2a3d',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#627079',
    marginTop: 3,
    lineHeight: 18,
  },
  badgePill: {
    backgroundColor: '#edf1f3',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f2a3d',
  },
});
