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

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [instantUrgentEmail, setInstantUrgentEmail] = useState(true);

  const [projectMilestones, setProjectMilestones] = useState(true);
  const [stage5SignOffs, setStage5SignOffs] = useState(true);
  const [financeInvoices, setFinanceInvoices] = useState(true);
  const [shiftAttendance, setShiftAttendance] = useState(false);
  const [vendorTenders, setVendorTenders] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

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
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ProfileTab'))}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color="#0f2a3d" strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>Notification Preferences</Text>
            <Text style={styles.headerSub} numberOfLines={1}>Push alerts, email digests & quiet hours</Text>
          </View>
        </View>
      </View>

      {savedToast && (
        <View style={styles.toastCard}>
          <CheckCircle2 size={16} color="#2e9e6b" strokeWidth={2.4} />
          <Text style={styles.toastText}>Preferences updated automatically</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <View style={styles.masterRow}>
            <View style={styles.masterIconBox}>
              <Bell size={22} color="#2f6fb3" strokeWidth={2.4} />
            </View>
            <View style={styles.masterTextCol}>
              <Text style={styles.masterTitle}>Push Notifications</Text>
              <Text style={styles.masterSub}>Receive instant mobile alerts on your device</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={() => handleToggle(setPushEnabled, pushEnabled)}
              trackColor={{ false: '#d3dce1', true: '#c9dcf1' }}
              thumbColor={pushEnabled ? '#2f6fb3' : '#f4f7f8'}
            />
          </View>
        </View>

        <View style={[styles.sectionCard, !pushEnabled && styles.sectionDisabled]}>
          <Text style={styles.sectionTitle}>NOTIFICATION CATEGORIES</Text>

          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#e6effa' }]}>
              <FolderKanban size={18} color="#2f6fb3" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Project & Drilling Progress</Text>
              <Text style={styles.channelSub}>Daily DPR updates, rig shifts, and depth milestones</Text>
            </View>
            <Switch
              disabled={!pushEnabled}
              value={projectMilestones}
              onValueChange={() => handleToggle(setProjectMilestones, projectMilestones)}
              trackColor={{ false: '#d3dce1', true: '#c9dcf1' }}
              thumbColor={projectMilestones ? '#2f6fb3' : '#f4f7f8'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#fcf0dc' }]}>
              <FileCheck size={18} color="#c27a12" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Stage 5 Technical Sign-Offs</Text>
              <Text style={styles.channelSub}>Final geological reports awaiting technical approval</Text>
            </View>
            <Switch
              disabled={!pushEnabled}
              value={stage5SignOffs}
              onValueChange={() => handleToggle(setStage5SignOffs, stage5SignOffs)}
              trackColor={{ false: '#d3dce1', true: '#ecd6ae' }}
              thumbColor={stage5SignOffs ? '#c27a12' : '#f4f7f8'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#e3f4ec' }]}>
              <Receipt size={18} color="#2e9e6b" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Invoices & Treasury</Text>
              <Text style={styles.channelSub}>Client invoice payments, vendor disbursements & TDS</Text>
            </View>
            <Switch
              disabled={!pushEnabled}
              value={financeInvoices}
              onValueChange={() => handleToggle(setFinanceInvoices, financeInvoices)}
              trackColor={{ false: '#d3dce1', true: '#bfe3d0' }}
              thumbColor={financeInvoices ? '#2e9e6b' : '#f4f7f8'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#f4f7f8' }]}>
              <Users size={18} color="#4a5b68" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Attendance & Shift Roster</Text>
              <Text style={styles.channelSub}>Daily punch reminders & leave approval requests</Text>
            </View>
            <Switch
              disabled={!pushEnabled}
              value={shiftAttendance}
              onValueChange={() => handleToggle(setShiftAttendance, shiftAttendance)}
              trackColor={{ false: '#d3dce1', true: '#d3dce1' }}
              thumbColor={shiftAttendance ? '#2f6fb3' : '#f4f7f8'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#fbe5e4' }]}>
              <ShieldAlert size={18} color="#d24c47" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Security & Account Alerts</Text>
              <Text style={styles.channelSub}>New logins, 2FA codes, password updates</Text>
            </View>
            <Switch
              disabled={!pushEnabled}
              value={securityAlerts}
              onValueChange={() => handleToggle(setSecurityAlerts, securityAlerts)}
              trackColor={{ false: '#d3dce1', true: '#f2c4c2' }}
              thumbColor={securityAlerts ? '#d24c47' : '#f4f7f8'}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>EMAIL NOTIFICATIONS</Text>

          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#e6effa' }]}>
              <Mail size={18} color="#2f6fb3" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Morning summary</Text>
              <Text style={styles.channelSub}>Consolidated summary sent at 08:00 AM IST</Text>
            </View>
            <Switch
              value={emailDigest}
              onValueChange={() => handleToggle(setEmailDigest, emailDigest)}
              trackColor={{ false: '#d3dce1', true: '#c9dcf1' }}
              thumbColor={emailDigest ? '#2f6fb3' : '#f4f7f8'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.channelRow}>
            <View style={[styles.iconBox, { backgroundColor: '#e6effa' }]}>
              <Volume2 size={18} color="#2f6fb3" strokeWidth={2.2} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Instant High Priority Dispatches</Text>
              <Text style={styles.channelSub}>Immediate email notification on urgent approvals</Text>
            </View>
            <Switch
              value={instantUrgentEmail}
              onValueChange={() => handleToggle(setInstantUrgentEmail, instantUrgentEmail)}
              trackColor={{ false: '#d3dce1', true: '#c9dcf1' }}
              thumbColor={instantUrgentEmail ? '#2f6fb3' : '#f4f7f8'}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.masterRow}>
            <View style={[styles.iconBox, { backgroundColor: '#fcf0dc' }]}>
              <Moon size={20} color="#c27a12" strokeWidth={2.2} />
            </View>
            <View style={styles.masterTextCol}>
              <Text style={styles.masterTitle}>Quiet Hours (Do Not Disturb)</Text>
              <Text style={styles.masterSub}>Mute non-urgent notifications at night</Text>
            </View>
            <Switch
              value={quietHoursEnabled}
              onValueChange={() => handleToggle(setQuietHoursEnabled, quietHoursEnabled)}
              trackColor={{ false: '#d3dce1', true: '#ecd6ae' }}
              thumbColor={quietHoursEnabled ? '#c27a12' : '#f4f7f8'}
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
    backgroundColor: '#f4f7f8',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8eb',
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
    backgroundColor: '#edf1f3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e1e8eb',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f2a3d',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11.5,
    color: '#627079',
    fontWeight: '500',
    marginTop: 1,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e3f4ec',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfe3d0',
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#237a53',
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
    borderColor: '#e1e8eb',
    marginBottom: 16,
    shadowColor: '#0f2a3d',
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
    fontWeight: '700',
    color: '#627079',
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
    backgroundColor: '#e6effa',
    borderWidth: 1,
    borderColor: '#c9dcf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterTextCol: {
    flex: 1,
  },
  masterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f2a3d',
  },
  masterSub: {
    fontSize: 12,
    color: '#627079',
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
    backgroundColor: '#f4f7f8',
    borderWidth: 1,
    borderColor: '#e1e8eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelTextCol: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f2a3d',
  },
  channelSub: {
    fontSize: 11.5,
    color: '#627079',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#edf1f3',
    marginVertical: 10,
  },
  quietHoursTimePill: {
    marginTop: 12,
    backgroundColor: '#fcf0dc',
    borderWidth: 1,
    borderColor: '#ecd6ae',
    borderRadius: 10,
    padding: 12,
  },
  quietHoursTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9a5f0c',
  },
  quietHoursSubText: {
    fontSize: 11.5,
    color: '#9a5f0c',
    marginTop: 2,
  },
});
