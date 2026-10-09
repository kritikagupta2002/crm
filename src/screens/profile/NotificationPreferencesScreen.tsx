import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  Mail,
  Moon,
  FolderKanban,
  FileCheck,
  Receipt,
  Users,
  ShieldAlert,
  CheckCircle2,
  Volume2,
} from 'lucide-react-native';

interface NotificationPreferencesScreenProps {
  navigation: any;
}

export const NotificationPreferencesScreen: React.FC<NotificationPreferencesScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Master switches
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [instantUrgentEmail, setInstantUrgentEmail] = useState(true);

  // Category notification switches
  const [projectMilestones, setProjectMilestones] = useState(true);
  const [stage5SignOffs, setStage5SignOffs] = useState(true);
  const [financeInvoices, setFinanceInvoices] = useState(true);
  const [shiftAttendance, setShiftAttendance] = useState(false);
  const [vendorTenders, setVendorTenders] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  // Quiet Hours (Do Not Disturb)
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const handleToggle = useCallback(
    (setter: React.Dispatch<React.SetStateAction<boolean>>, current: boolean) => {
      setter(!current);
      setSavedToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setSavedToast(false), 2000);
    },
    []
  );

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
            <Text style={styles.headerTitle} numberOfLines={1}>Notification Preferences</Text>
            <Text style={styles.headerSub} numberOfLines={1}>Push alerts, email digests & quiet hours</Text>
          </View>
        </View>
      </View>

      {/* Auto-saved feedback */}
      {savedToast && (
        <View style={styles.toastCard}>
          <CheckCircle2 size={16} color="#059669" strokeWidth={2.4} />
          <Text style={styles.toastText}>Preferences updated automatically</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Master Push Notification Toggle */}
        <View style={styles.sectionCard}>
          <View style={styles.masterRow}>
            <View style={styles.masterIconBox}>
              <Bell size={22} color="#0284c7" strokeWidth={2.4} />
            </View>
            <View style={styles.masterTextCol}>
              <Text style={styles.masterTitle}>Push Notifications</Text>
              <Text style={styles.masterSub}>Receive instant mobile alerts on your device</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={() => handleToggle(setPushEnabled, pushEnabled)}
              trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
              thumbColor={pushEnabled ? '#0284c7' : '#f8fafc'}
            />
          </View>
        </View>

        {/* 2. Alert Channels */}
        <View style={[styles.sectionCard, !pushEnabled && styles.sectionDisabled]}>
          <Text style={styles.sectionTitle}>NOTIFICATION CATEGORIES</Text>

          {/* Project Milestones */}
          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#f0f9ff' }]}>
              <FolderKanban size={18} color="#0284c7" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Project & Drilling Progress</Text>
              <Text style={styles.channelSub}>Daily DPR updates, rig shifts, and depth milestones</Text>
            </View>
            <Switch
              disabled={!pushEnabled}
              value={projectMilestones}
              onValueChange={() => handleToggle(setProjectMilestones, projectMilestones)}
              trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
              thumbColor={projectMilestones ? '#0284c7' : '#f8fafc'}
            />
          </View>

          <View style={styles.divider} />

          {/* Stage 5 Sign-offs */}
          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#fefce8' }]}>
              <FileCheck size={18} color="#d97706" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Stage 5 Technical Sign-Offs</Text>
              <Text style={styles.channelSub}>Final geological reports awaiting technical approval</Text>
            </View>
            <Switch
              disabled={!pushEnabled}
              value={stage5SignOffs}
              onValueChange={() => handleToggle(setStage5SignOffs, stage5SignOffs)}
              trackColor={{ false: '#cbd5e1', true: '#fde68a' }}
              thumbColor={stage5SignOffs ? '#d97706' : '#f8fafc'}
            />
          </View>

          <View style={styles.divider} />

          {/* Finance & Invoices */}
          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
              <Receipt size={18} color="#059669" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Invoices & Treasury</Text>
              <Text style={styles.channelSub}>Client invoice payments, vendor disbursements & TDS</Text>
            </View>
            <Switch
              disabled={!pushEnabled}
              value={financeInvoices}
              onValueChange={() => handleToggle(setFinanceInvoices, financeInvoices)}
              trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
              thumbColor={financeInvoices ? '#059669' : '#f8fafc'}
            />
          </View>

          <View style={styles.divider} />

          {/* Attendance & Shift */}
          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#f8fafc' }]}>
              <Users size={18} color="#475569" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Attendance & Shift Roster</Text>
              <Text style={styles.channelSub}>Daily punch reminders & leave approval requests</Text>
            </View>
            <Switch
              disabled={!pushEnabled}
              value={shiftAttendance}
              onValueChange={() => handleToggle(setShiftAttendance, shiftAttendance)}
              trackColor={{ false: '#cbd5e1', true: '#cbd5e1' }}
              thumbColor={shiftAttendance ? '#0284c7' : '#f8fafc'}
            />
          </View>

          <View style={styles.divider} />

          {/* Security & Role Switch */}
          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
              <ShieldAlert size={18} color="#dc2626" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Security & Account Alerts</Text>
              <Text style={styles.channelSub}>New logins, 2FA codes, password updates</Text>
            </View>
            <Switch
              disabled={!pushEnabled}
              value={securityAlerts}
              onValueChange={() => handleToggle(setSecurityAlerts, securityAlerts)}
              trackColor={{ false: '#cbd5e1', true: '#fca5a5' }}
              thumbColor={securityAlerts ? '#dc2626' : '#f8fafc'}
            />
          </View>
        </View>

        {/* 3. Email Notification Configuration */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>EMAIL NOTIFICATIONS</Text>

          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#f0f9ff' }]}>
              <Mail size={18} color="#0284c7" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Daily Morning Executive Digest</Text>
              <Text style={styles.channelSub}>Consolidated summary sent at 08:00 AM IST</Text>
            </View>
            <Switch
              value={emailDigest}
              onValueChange={() => handleToggle(setEmailDigest, emailDigest)}
              trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
              thumbColor={emailDigest ? '#0284c7' : '#f8fafc'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#f0f9ff' }]}>
              <Volume2 size={18} color="#0284c7" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Instant High Priority Dispatches</Text>
              <Text style={styles.channelSub}>Immediate email notification on urgent approvals</Text>
            </View>
            <Switch
              value={instantUrgentEmail}
              onValueChange={() => handleToggle(setInstantUrgentEmail, instantUrgentEmail)}
              trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
              thumbColor={instantUrgentEmail ? '#0284c7' : '#f8fafc'}
            />
          </View>
        </View>

        {/* 4. Quiet Hours */}
        <View style={styles.sectionCard}>
          <View style={styles.masterRow}>
            <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
              <Moon size={20} color="#d97706" strokeWidth={2.2} />
            </View>
            <View style={styles.masterTextCol}>
              <Text style={styles.masterTitle}>Quiet Hours (Do Not Disturb)</Text>
              <Text style={styles.masterSub}>Mute non-urgent notifications at night</Text>
            </View>
            <Switch
              value={quietHoursEnabled}
              onValueChange={() => handleToggle(setQuietHoursEnabled, quietHoursEnabled)}
              trackColor={{ false: '#cbd5e1', true: '#fde68a' }}
              thumbColor={quietHoursEnabled ? '#d97706' : '#f8fafc'}
            />
          </View>

          {quietHoursEnabled && (
            <View style={styles.quietHoursTimePill}>
              <Text style={styles.quietHoursTimeText}>
                Active Window: 10:00 PM – 07:00 AM IST
              </Text>
              <Text style={styles.quietHoursSubText}>
                Critical safety and SOS alerts will bypass quiet hours.
              </Text>
            </View>
          )}
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
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  sectionDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  masterIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterTextCol: {
    flex: 1,
  },
  masterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  masterSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelTextCol: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  channelSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  quietHoursTimePill: {
    marginTop: 12,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 12,
  },
  quietHoursTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
  },
  quietHoursSubText: {
    fontSize: 11.5,
    color: '#92400e',
    marginTop: 2,
  },
});
