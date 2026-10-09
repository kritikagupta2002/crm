import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Shield,
  KeyRound,
  Fingerprint,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Clock,
  Lock,
} from 'lucide-react-native';

interface AccountSecurityScreenProps {
  navigation: any;
}

interface SessionInfo {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
}

const INITIAL_SESSIONS: SessionInfo[] = [
  {
    id: 'sess-2',
    device: 'MacBook Pro 16" (Safari)',
    ip: '122.161.48.15',
    location: 'Jaipur HQ Office',
    lastActive: '3 hours ago',
  },
];

export const AccountSecurityScreen: React.FC<AccountSecurityScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordToast, setPasswordToast] = useState(false);

  // Other sessions state
  const [otherSessions, setOtherSessions] = useState<SessionInfo[]>(INITIAL_SESSIONS);

  const handleUpdatePassword = useCallback(() => {
    if (!currentPassword) {
      Alert.alert('Validation Error', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirm password do not match.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setPasswordToast(false);
    }, 3500);
  }, [currentPassword, newPassword, confirmPassword]);

  const handleRevokeSessions = useCallback(() => {
    Alert.alert(
      'Revoke Other Sessions',
      'Are you sure you want to log out from all other web and mobile devices?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: () => {
            setOtherSessions([]);
            Alert.alert('Success', 'All remote sessions have been revoked.');
          },
        },
      ]
    );
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color="#0f172a" strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>Account & Security</Text>
            <Text style={styles.headerSub} numberOfLines={1}>Biometrics, passwords & active sessions</Text>
          </View>
        </View>
      </View>

      {/* Password Updated Toast */}
      {passwordToast && (
        <View style={styles.toastCard}>
          <CheckCircle2 size={18} color="#059669" strokeWidth={2.4} />
          <Text style={styles.toastText}>Password updated successfully! Next login will require new password.</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Security Shield Banner */}
        <View style={styles.statusBanner}>
          <View style={styles.shieldIconWrap}>
            <Shield size={22} color="#0284c7" strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusBannerTitle}>Security Status: High</Text>
            <Text style={styles.statusBannerSub}>
              2FA enabled • Biometric authentication active • Device encrypted
            </Text>
          </View>
        </View>

        {/* 1. Biometrics & 2FA Toggles */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>AUTHENTICATION METHODS</Text>

          {/* Biometrics */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleIconWrap}>
              <Fingerprint size={20} color="#0284c7" strokeWidth={2.2} />
            </View>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Biometric Unlock</Text>
              <Text style={styles.toggleSub}>Use Fingerprint or Face ID for fast login</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
              thumbColor={biometricsEnabled ? '#0284c7' : '#f8fafc'}
            />
          </View>

          <View style={styles.divider} />

          {/* 2FA */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleIconWrap}>
              <Smartphone size={20} color="#059669" strokeWidth={2.2} />
            </View>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Two-Factor Authentication (2FA)</Text>
              <Text style={styles.toggleSub}>OTP verification via registered mobile (+91 •••• 12345)</Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={setTwoFactorEnabled}
              trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
              thumbColor={twoFactorEnabled ? '#059669' : '#f8fafc'}
            />
          </View>
        </View>

        {/* 2. Change Password */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <KeyRound size={18} color="#0f172a" strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>CHANGE ACCOUNT PASSWORD</Text>
          </View>

          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.passwordInputWrap}>
              <TextInput
                style={styles.inputField}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeBtn}
              >
                {showCurrentPassword ? (
                  <EyeOff size={18} color="#64748b" />
                ) : (
                  <Eye size={18} color="#64748b" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordInputWrap}>
              <TextInput
                style={styles.inputField}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeBtn}
              >
                {showNewPassword ? (
                  <EyeOff size={18} color="#64748b" />
                ) : (
                  <Eye size={18} color="#64748b" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.passwordInputWrap}>
              <TextInput
                style={styles.inputField}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showNewPassword}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.updatePasswordBtn}
            onPress={handleUpdatePassword}
            activeOpacity={0.8}
          >
            <Lock size={16} color="#ffffff" strokeWidth={2.4} />
            <Text style={styles.updatePasswordBtnText}>Update Password</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Active Sessions */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderBetween}>
            <Text style={styles.sectionTitle}>ACTIVE LOGIN SESSIONS</Text>
            {otherSessions.length > 0 && (
              <TouchableOpacity onPress={handleRevokeSessions} activeOpacity={0.7}>
                <Text style={styles.revokeAllText}>Revoke Other</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Current Device */}
          <View style={styles.sessionItem}>
            <View style={[styles.sessionIconWrap, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
              <Smartphone size={20} color="#059669" strokeWidth={2.2} />
            </View>
            <View style={styles.sessionTextCol}>
              <View style={styles.sessionTitleRow}>
                <Text style={styles.sessionDeviceText}>Android Mobile App (This Device)</Text>
                <View style={styles.activeNowBadge}>
                  <Text style={styles.activeNowText}>Current</Text>
                </View>
              </View>
              <Text style={styles.sessionMetaText}>Jaipur, Rajasthan • IP 122.161.48.12</Text>
              <Text style={styles.sessionTimeText}>Active right now</Text>
            </View>
          </View>

          {/* Other Sessions */}
          {otherSessions.map((sess) => (
            <React.Fragment key={sess.id}>
              <View style={styles.divider} />
              <View style={styles.sessionItem}>
                <View style={styles.sessionIconWrap}>
                  <Laptop size={20} color="#64748b" strokeWidth={2.2} />
                </View>
                <View style={styles.sessionTextCol}>
                  <Text style={styles.sessionDeviceText}>{sess.device}</Text>
                  <Text style={styles.sessionMetaText}>{sess.location} • IP {sess.ip}</Text>
                  <Text style={styles.sessionTimeText}>Last active {sess.lastActive}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* 4. Security Audit Log snippet */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>RECENT SECURITY EVENTS</Text>
          <View style={styles.eventRow}>
            <Clock size={16} color="#64748b" strokeWidth={2.2} />
            <Text style={styles.eventText}>
              Successful biometric login from Android device (Today, 08:32 AM)
            </Text>
          </View>
          <View style={styles.eventRow}>
            <Clock size={16} color="#64748b" strokeWidth={2.2} />
            <Text style={styles.eventText}>
              2FA verification code sent to registered number (Yesterday, 09:14 AM)
            </Text>
          </View>
        </View>
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#047857',
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  shieldIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusBannerSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  revokeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  toggleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTextCol: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputField: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 6,
  },
  updatePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    height: 44,
    borderRadius: 10,
    marginTop: 4,
  },
  updatePasswordBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTextCol: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionDeviceText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  activeNowBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  activeNowText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  sessionMetaText: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  sessionTimeText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
    fontWeight: '500',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  eventText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    flex: 1,
  },
});
