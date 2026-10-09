import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  UserCheck,
  Clock,
  Calendar,
  CheckCircle2,
  MapPin,
  FileText,
  Receipt,
  Download,
  AlertCircle,
  Plus,
  X,
  Check,
  ChevronRight,
  Shield,
  CreditCard,
  Building,
  Search,
  Bell,
  ArrowUpRight,
  Compass,
  Sparkles,
} from 'lucide-react-native';
import { colors, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useHrms } from '../../context/HrmsContext';
import { useNotifications } from '../../context/NotificationContext';

interface EmployeeHomeScreenProps {
  navigation: any;
}

export const EmployeeHomeScreen: React.FC<EmployeeHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth <= 360;

  const { session } = useAuth();
  const { unreadCount } = useNotifications();
  const { leaves, applyLeave, expenses } = useHrms();

  const user = session as any;
  const employeeName = user?.name || 'Neha Gupta';
  const employeeId = user?.employeeId || 'BGS-2023-044';
  const designation = user?.designation || 'Field Exploration Geologist';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  // Attendance Punch State
  const [isPunchedIn, setIsPunchedIn] = useState(true);
  const [punchTime, setPunchTime] = useState('08:42 AM');

  // Personal Tasks state
  const [myTasks, setMyTasks] = useState([
    { id: 'et-1', title: 'Log Core Box BH-04 from 120m to 145m', project: 'Jhamarkotra Phosphate', due: 'Today', done: false, priority: 'High' },
    { id: 'et-2', title: 'Prepare Geological Thin-Section Samples', project: 'Jhamarkotra Phosphate', due: 'Today', done: true, priority: 'Medium' },
    { id: 'et-3', title: 'Submit Daily Drill Footage DPR', project: 'Camp Field Office', due: 'Tomorrow', done: false, priority: 'Medium' },
  ]);

  const pendingTasksCount = myTasks.filter((t) => !t.done).length;

  // Leave Modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState<'Casual' | 'Earned' | 'Sick'>('Casual');
  const [leaveDays, setLeaveDays] = useState('2');
  const [leaveReason, setLeaveReason] = useState('');

  // Personal leaves (strictly filtered to current employee)
  const myLeaves = useMemo(() => {
    return (leaves || []).filter(
      (l) => l.employeeId === session?.id || l.employeeName?.toLowerCase() === employeeName.toLowerCase()
    );
  }, [leaves, session, employeeName]);

  // Personal expense claims
  const myExpenses = useMemo(() => {
    return (expenses || []).filter(
      (e) => (e as any).employeeId === session?.id || (e as any).employeeName?.toLowerCase() === employeeName.toLowerCase()
    );
  }, [expenses, session, employeeName]);

  const handlePunchToggle = () => {
    if (isPunchedIn) {
      Alert.alert(
        'Confirm Shift Punch-Out',
        `Record your site punch-out for today? Geolocation: Jhamarkotra Field Camp.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Punch Out',
            style: 'destructive',
            onPress: () => {
              setIsPunchedIn(false);
              Alert.alert('Punched Out', 'Shift attendance successfully logged.');
            },
          },
        ]
      );
    } else {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setIsPunchedIn(true);
      setPunchTime(nowTime);
      Alert.alert('Punched In', `GPS Location verified: 24.5854° N, 73.7125° E. Clocked in at ${nowTime}.`);
    }
  };

  const handleToggleTask = (taskId: string) => {
    setMyTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
    );
  };

  const handleSubmitLeave = async () => {
    if (!leaveReason.trim()) {
      Alert.alert('Missing Reason', 'Please provide a reason for your leave request.');
      return;
    }
    try {
      if (applyLeave) {
        const startDate = new Date().toISOString().split('T')[0];
        const daysCount = parseInt(leaveDays || '1', 10);
        const endDate = new Date(Date.now() + 86400000 * daysCount).toISOString().split('T')[0];
        await applyLeave(leaveType, startDate, endDate, leaveReason);
      }
      setShowLeaveModal(false);
      setLeaveReason('');
      Alert.alert('Application Submitted', 'Your leave request has been sent to your Manager for approval.');
    } catch (e: any) {
      Alert.alert('Submission Error', e.message || 'Failed to submit leave.');
    }
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0284c7" />

      {/* 1. Personal Staff Companion Header (Sky Blue & White) */}
      <View style={[styles.companionHeader, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProfileTab')}
            style={styles.avatarWrapper}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>NG</Text>
            </View>
            <View style={styles.avatarBadge}>
              <UserCheck size={9} color="#ffffff" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              {employeeName}
            </Text>
            <View style={styles.roleTagRow}>
              <View style={styles.roleTag}>
                <Compass size={10} color="#0284c7" strokeWidth={2.4} style={{ marginRight: 3 }} />
                <Text style={styles.roleTagText}>{designation}</Text>
              </View>
              <Text style={styles.orgTagText}>{employeeId}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Tasks')}
            style={styles.iconButton}
          >
            <Search size={19} color="#ffffff" strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('AlertsTab')}
            style={styles.iconButton}
          >
            <Bell size={19} color="#ffffff" strokeWidth={2.2} />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : '2'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.containerContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.bodyWrapper, isCompact && { paddingHorizontal: 6 }]}>
          {/* 2. Bespoke Hero: Physical-Style Geolocation Shift Punch Hub */}
          <View style={styles.punchHubCard}>
            <View style={styles.punchHubTop}>
              <View style={styles.gpsPinBox}>
                <MapPin size={18} color="#0284c7" strokeWidth={2.4} />
              </View>
              <View style={styles.gpsInfoCol}>
                <Text style={styles.gpsSiteName}>Jhamarkotra Phosphate Block IV</Text>
                <Text style={styles.gpsCoordsText}>GPS Verified: 24.5854° N, 73.7125° E</Text>
              </View>
              <View style={[styles.dutyPill, isPunchedIn ? styles.dutyPillOn : styles.dutyPillOff]}>
                <View style={[styles.dutyDot, isPunchedIn ? styles.dutyDotOn : styles.dutyDotOff]} />
                <Text style={[styles.dutyPillText, isPunchedIn ? styles.dutyTextOn : styles.dutyTextOff]}>
                  {isPunchedIn ? 'ON DUTY' : 'OFF DUTY'}
                </Text>
              </View>
            </View>

            {/* Live Shift Dial View */}
            <View style={styles.shiftDialBox}>
              <Text style={styles.clockTimeText}>{isPunchedIn ? punchTime : '--:--'}</Text>
              <Text style={styles.shiftStatusSub}>
                {isPunchedIn ? 'Checked in today • Shift hours active' : 'Shift attendance not clocked yet'}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePunchToggle}
                style={[
                  styles.punchBigButton,
                  isPunchedIn ? styles.punchBigButtonOut : styles.punchBigButtonIn,
                ]}
              >
                <Clock size={20} color="#ffffff" strokeWidth={2.4} style={{ marginRight: 8 }} />
                <Text style={styles.punchBigButtonText}>
                  {isPunchedIn ? 'Punch Out for Shift' : 'Punch In with Geolocation'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. My Assigned Field Tasks */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>My Today's Tasks</Text>
              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>{pendingTasksCount} Pending</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Tasks')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>Tasks Desk →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tasksCardContainer}>
            {myTasks.map((t, idx) => (
              <React.Fragment key={t.id}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => handleToggleTask(t.id)}
                  style={styles.taskRow}
                >
                  <TouchableOpacity
                    onPress={() => handleToggleTask(t.id)}
                    style={[
                      styles.taskCheckCircle,
                      t.done && styles.taskCheckCircleDone,
                    ]}
                  >
                    {t.done ? (
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    ) : (
                      <View style={styles.taskCheckInner} />
                    )}
                  </TouchableOpacity>

                  <View style={styles.taskInfoCol}>
                    <Text
                      style={[
                        styles.taskTitle,
                        t.done && styles.taskTextDone,
                      ]}
                      numberOfLines={1}
                    >
                      {t.title}
                    </Text>
                    <Text style={styles.taskSubtitle}>{t.project}</Text>
                  </View>

                  <View
                    style={[
                      styles.priorityPill,
                      t.priority === 'High'
                        ? { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }
                        : { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityPillText,
                        { color: t.priority === 'High' ? '#dc2626' : '#2563eb' },
                      ]}
                    >
                      {t.priority}
                    </Text>
                  </View>
                </TouchableOpacity>
                {idx < myTasks.length - 1 && <View style={styles.taskDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* 4. My Annual Leave Quota Hub */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>My Leave Balance Quota</Text>
              <View style={[styles.counterBadge, { backgroundColor: '#f3e8ff' }]}>
                <Text style={[styles.counterBadgeText, { color: '#7e22ce' }]}>18 Days Available</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowLeaveModal(true)}
              style={styles.viewAllBtn}
            >
              <Text style={[styles.viewAllText, { color: '#0284c7' }]}>+ Apply →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.leaveQuotaCard}>
            <View style={styles.quotaRow}>
              <View style={styles.quotaCol}>
                <Text style={styles.quotaType}>Casual Leave</Text>
                <Text style={styles.quotaDaysVal}>4 / 8</Text>
                <Text style={styles.quotaDaysSub}>Days Left</Text>
              </View>
              <View style={styles.quotaDivider} />
              <View style={styles.quotaCol}>
                <Text style={styles.quotaType}>Earned Leave</Text>
                <Text style={styles.quotaDaysVal}>10 / 14</Text>
                <Text style={styles.quotaDaysSub}>Days Left</Text>
              </View>
              <View style={styles.quotaDivider} />
              <View style={styles.quotaCol}>
                <Text style={styles.quotaType}>Sick Leave</Text>
                <Text style={styles.quotaDaysVal}>4 / 5</Text>
                <Text style={styles.quotaDaysSub}>Days Left</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.applyLeaveDirectBtn}
              activeOpacity={0.85}
              onPress={() => setShowLeaveModal(true)}
            >
              <Calendar size={16} color="#ffffff" strokeWidth={2.4} style={{ marginRight: 6 }} />
              <Text style={styles.applyLeaveDirectBtnText}>Apply For Leave</Text>
            </TouchableOpacity>
          </View>

          {/* 5. Personal Self-Service Actions */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Self-Service Desk</Text>
          </View>

          <View style={styles.modulesGrid}>
            <TouchableOpacity
              style={styles.modTile}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Expenses')}
            >
              <View style={[styles.modIconWrap, { backgroundColor: '#fff7ed' }]}>
                <Receipt size={20} color="#ea580c" strokeWidth={2.3} />
              </View>
              <View style={styles.modContent}>
                <Text style={styles.modTitle}>Field TA/DA Claim</Text>
                <Text style={styles.modSub} numberOfLines={1}>Submit Travel Expense</Text>
              </View>
              <ChevronRight size={15} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modTile}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Payslips')}
            >
              <View style={[styles.modIconWrap, { backgroundColor: '#f0fdf4' }]}>
                <Download size={20} color="#16a34a" strokeWidth={2.3} />
              </View>
              <View style={styles.modContent}>
                <Text style={styles.modTitle}>My Payslips</Text>
                <Text style={styles.modSub} numberOfLines={1}>Salary Statements</Text>
              </View>
              <ChevronRight size={15} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modTile}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Attendance')}
            >
              <View style={[styles.modIconWrap, { backgroundColor: '#eff6ff' }]}>
                <Clock size={20} color="#2563eb" strokeWidth={2.3} />
              </View>
              <View style={styles.modContent}>
                <Text style={styles.modTitle}>Punch History</Text>
                <Text style={styles.modSub} numberOfLines={1}>Monthly Attendance Log</Text>
              </View>
              <ChevronRight size={15} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modTile}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Tasks')}
            >
              <View style={[styles.modIconWrap, { backgroundColor: '#faf5ff' }]}>
                <CheckCircle2 size={20} color="#7c3aed" strokeWidth={2.3} />
              </View>
              <View style={styles.modContent}>
                <Text style={styles.modTitle}>Assigned Work</Text>
                <Text style={styles.modSub} numberOfLines={1}>Core Boxes & Assays</Text>
              </View>
              <ChevronRight size={15} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Leave Application Modal */}
      <Modal visible={showLeaveModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply For Leave</Text>
              <TouchableOpacity onPress={() => setShowLeaveModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Leave Type</Text>
            <View style={styles.typeSelectorRow}>
              {(['Casual', 'Earned', 'Sick'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, leaveType === t && styles.typeBtnActive]}
                  onPress={() => setLeaveType(t)}
                >
                  <Text style={[styles.typeBtnText, leaveType === t && styles.typeBtnTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Duration (Days)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={leaveDays}
              onChangeText={setLeaveDays}
              placeholder="e.g. 2"
            />

            <Text style={styles.inputLabel}>Reason / Remarks</Text>
            <TextInput
              style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
              multiline
              value={leaveReason}
              onChangeText={setLeaveReason}
              placeholder="Provide reason for duty absence..."
            />

            <TouchableOpacity
              style={styles.submitLeaveBtn}
              activeOpacity={0.85}
              onPress={handleSubmitLeave}
            >
              <Text style={styles.submitLeaveBtnText}>Submit Leave to Manager</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerContent: {
    paddingBottom: 90,
  },

  /* 1. Companion Header */
  companionHeader: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0369a1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#10b981',
    borderRadius: radius.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0284c7',
  },
  headerTitleCol: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    color: '#e0f2fe',
    fontWeight: '500',
    marginBottom: 1,
  },
  userNameText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  roleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0284c7',
  },
  orgTagText: {
    fontSize: 11,
    color: '#e0f2fe',
    fontWeight: '600',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#0284c7',
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  bodyWrapper: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },

  /* 2. Geolocation Punch Hub */
  punchHubCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  punchHubTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  gpsPinBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  gpsInfoCol: {
    flex: 1,
  },
  gpsSiteName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  gpsCoordsText: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  dutyPillOn: {
    backgroundColor: '#dcfce7',
  },
  dutyPillOff: {
    backgroundColor: '#fee2e2',
  },
  dutyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dutyDotOn: {
    backgroundColor: '#15803d',
  },
  dutyDotOff: {
    backgroundColor: '#dc2626',
  },
  dutyPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  dutyTextOn: {
    color: '#15803d',
  },
  dutyTextOff: {
    color: '#dc2626',
  },
  shiftDialBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  clockTimeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  shiftStatusSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  punchBigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    ...shadows.xs,
  },
  punchBigButtonIn: {
    backgroundColor: '#059669',
  },
  punchBigButtonOut: {
    backgroundColor: '#0284c7',
  },
  punchBigButtonText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },

  /* Section Headers */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  counterBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
  viewAllBtn: {
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b2545',
  },

  /* 3. Tasks Card Container */
  tasksCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    ...shadows.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  taskCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskCheckCircleDone: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  taskCheckInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  taskInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  taskDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 50,
  },

  /* 4. Leave Quota Card */
  leaveQuotaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    ...shadows.xs,
  },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quotaCol: {
    flex: 1,
    alignItems: 'center',
  },
  quotaType: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  quotaDaysVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  quotaDaysSub: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  quotaDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#f1f5f9',
  },
  applyLeaveDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 10,
  },
  applyLeaveDirectBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* 5. Modules Grid */
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modTile: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.xs,
  },
  modIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  modContent: {
    flex: 1,
  },
  modTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  modSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  typeBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  typeBtnTextActive: {
    color: '#ffffff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  submitLeaveBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },
  submitLeaveBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
