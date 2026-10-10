import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  Search,
  Bell,
  MapPin,
  Receipt,
  Radio,
  Gauge,
  HardHat,
  Building2,
} from 'lucide-react-native';
import { colors, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { useHrms } from '../../context/HrmsContext';
import { useNotifications } from '../../context/NotificationContext';

interface ManagerHomeScreenProps {
  navigation: any;
}

export const ManagerHomeScreen: React.FC<ManagerHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth <= 360;

  const { session } = useAuth();
  const { unreadCount } = useNotifications();
  const { projects } = useCrm();
  const { employees, leaves, expenses, approveLeave, rejectLeave } = useHrms();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  const managerName = (session as any)?.name || 'Kavita Rawat';

  // State for interactive manager approvals
  const [localLeaves, setLocalLeaves] = useState(leaves);

  // Derived real data
  const pendingLeaves = useMemo(() => {
    return localLeaves.filter((l) => l.status === 'Pending');
  }, [localLeaves]);

  const activeProjects = useMemo(() => {
    return projects.filter((p) => p.status === 'In progress' || p.currentStage >= 1);
  }, [projects]);

  const totalTeamCount = employees.length || 18;
  const staffPresentCount = Math.round(totalTeamCount * 0.85);

  const [activeTasks, setActiveTasks] = useState([
    { id: 'tsk-101', title: 'Verify BH-04 Core Depth Logs', project: 'Jhamarkotra Phosphate', time: '02:00 PM', priority: 'High', done: false },
    { id: 'tsk-102', title: 'Review Sukinda Field Drill Shift Rosters', project: 'Sukinda Chromite', time: '04:30 PM', priority: 'Medium', done: false },
    { id: 'tsk-103', title: 'Dispatch Core Assay Batches to NABL Lab', project: 'Banswara Gold Block', time: '06:00 PM', priority: 'High', done: false },
  ]);

  const pendingTasksCount = activeTasks.filter((t) => !t.done).length;

  const toggleTask = (taskId: string) => {
    setActiveTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
    );
  };

  const handleApproveLeave = (leaveId: string, employeeName: string) => {
    Alert.alert(
      'Approve Leave Request',
      `Confirm approval of leave for ${employeeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            if (approveLeave) {
              await approveLeave(leaveId, 'Approved by Manager');
            }
            setLocalLeaves((prev) =>
              prev.map((l) => (l.id === leaveId ? { ...l, status: 'Approved' } : l))
            );
          },
        },
      ]
    );
  };

  const handleRejectLeave = (leaveId: string, employeeName: string) => {
    Alert.alert(
      'Reject Leave Request',
      `Reject leave request for ${employeeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            if (rejectLeave) {
              await rejectLeave(leaveId, 'Operational constraints');
            }
            setLocalLeaves((prev) =>
              prev.map((l) => (l.id === leaveId ? { ...l, status: 'Rejected' } : l))
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 1. Tactical Command Center Header (Light Theme & Emerald Radar) */}
      <View style={[styles.commandHeader, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProfileTab')}
            style={styles.avatarWrapper}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>KR</Text>
            </View>
            <View style={styles.avatarBadge}>
              <HardHat size={9} color="#ffffff" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <View style={styles.radarStatusPill}>
              <View style={styles.pulseDot} />
              <Text style={styles.radarStatusText}>3 RIGS ACTIVE ON-SITE</Text>
            </View>
            <Text style={styles.userNameText} numberOfLines={1}>
              {managerName}
            </Text>
            <Text style={styles.orgTagText}>Operations Commander • Field WBS</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Tasks')}
            style={styles.iconButton}
          >
            <Search size={19} color="#475569" strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('AlertsTab')}
            style={styles.iconButton}
          >
            <Bell size={19} color="#475569" strokeWidth={2.2} />
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
          {/* 2. Bespoke Hero: Live Field Site Rig Telemetry Console */}
          <View style={styles.telemetryCard}>
            <View style={styles.telemetryHeader}>
              <View style={styles.telemetryTitleRow}>
                <Radio size={15} color="#10b981" strokeWidth={2.4} />
                <Text style={styles.telemetryTitle}>LIVE RIG TELEMETRY</Text>
              </View>
              <Text style={styles.telemetryTimestamp}>Sync: 2m ago</Text>
            </View>

            {/* Rig List */}
            <View style={styles.rigsList}>
              {/* Rig 1 */}
              <View style={styles.rigItem}>
                <View style={styles.rigStatusDotActive} />
                <View style={styles.rigDetails}>
                  <View style={styles.rigNameRow}>
                    <Text style={styles.rigName}>Rig #1 • Jhamarkotra Block IV</Text>
                    <Text style={styles.rigDrilledVal}>1,420 / 2,000 M</Text>
                  </View>
                  <Text style={styles.rigSubText}>Shift 1 Active • Core Recovery: 96%</Text>
                </View>
              </View>

              <View style={styles.rigDivider} />

              {/* Rig 2 */}
              <View style={styles.rigItem}>
                <View style={styles.rigStatusDotActive} />
                <View style={styles.rigDetails}>
                  <View style={styles.rigNameRow}>
                    <Text style={styles.rigName}>Rig #2 • Sukinda Chromite</Text>
                    <Text style={styles.rigDrilledVal}>650 / 1,500 M</Text>
                  </View>
                  <Text style={styles.rigSubText}>Geophysical Logging • Safety Passed</Text>
                </View>
              </View>

              <View style={styles.rigDivider} />

              {/* Rig 3 */}
              <View style={styles.rigItem}>
                <View style={styles.rigStatusDotStandby} />
                <View style={styles.rigDetails}>
                  <View style={styles.rigNameRow}>
                    <Text style={styles.rigName}>Rig #3 • Banswara Gold Block</Text>
                    <Text style={[styles.rigDrilledVal, { color: '#f59e0b' }]}>Standby</Text>
                  </View>
                  <Text style={styles.rigSubText}>Rig Mobilization • Spud Scheduled</Text>
                </View>
              </View>
            </View>

            {/* Tactical Shift Strip */}
            <View style={styles.shiftStrip}>
              <View style={styles.shiftCol}>
                <Text style={styles.shiftLabel}>On-Site Crew</Text>
                <Text style={styles.shiftVal}>{staffPresentCount} Staff</Text>
              </View>
              <View style={styles.shiftDivider} />
              <View style={styles.shiftCol}>
                <Text style={styles.shiftLabel}>Present Rate</Text>
                <Text style={[styles.shiftVal, { color: '#10b981' }]}>85% Live</Text>
              </View>
              <View style={styles.shiftDivider} />
              <View style={styles.shiftCol}>
                <Text style={styles.shiftLabel}>Safety Record</Text>
                <Text style={[styles.shiftVal, { color: '#10b981' }]}>0 Incidents</Text>
              </View>
            </View>
          </View>

          {/* Executive Bento KPI Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              {/* Projects Card */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Projects')}
                style={[styles.kpiCard, styles.kpiCardProjects]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxProjects]}>
                    <FolderKanban size={17} color="#2563eb" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeProjects}>
                    <Text style={styles.kpiBadgeTextProjects}>Live Sites</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValueProjects}>
                    {activeProjects.length || 4}
                  </Text>
                  <ArrowUpRight size={16} color="#2563eb" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>Active Projects</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    Exploration & Mining
                  </Text>
                </View>
              </TouchableOpacity>

              {/* On-Site Crew Card */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('EmployeeDirectory')}
                style={[styles.kpiCard, styles.kpiCardClients]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxClients]}>
                    <Users size={17} color="#0f766e" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeClients}>
                    <Text style={styles.kpiBadgeTextClients}>85% Live</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValueClients}>
                    {staffPresentCount}
                  </Text>
                  <ArrowUpRight size={16} color="#0d9488" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>On-Site Rig Crew</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    42 Active On-Site
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.kpiRow}>
              {/* Core Drilled Card */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('DrillingDpr')}
                style={[styles.kpiCard, styles.kpiCardEmployees]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxEmployees]}>
                    <Compass size={17} color="#7e22ce" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeEmployees}>
                    <Text style={styles.kpiBadgeTextEmployees}>HQ Wireline</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValueEmployees}>
                    1,420
                  </Text>
                  <ArrowUpRight size={16} color="#7c3aed" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>Core Drilled (M)</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    Target: 2,000 Meters
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Pending WBS Tasks Card */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Tasks')}
                style={[styles.kpiCard, styles.kpiCardPending]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPending]}>
                    <Clock size={17} color="#ea580c" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgePending}>
                    <Text style={styles.kpiBadgeTextPending}>Urgent</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValuePending}>
                    {pendingTasksCount}
                  </Text>
                  <ArrowUpRight size={16} color="#ea580c" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={[styles.kpiTitle, { color: '#9a3412' }]}>Pending Tasks</Text>
                  <Text style={[styles.kpiSubtitle, { color: '#ea580c' }]} numberOfLines={1}>
                    Field WBS Action
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Today's Field WBS Dispatch Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Operational WBS Tasks</Text>
              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>{pendingTasksCount} Pending</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Tasks')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>WBS Desk →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tasksCardContainer}>
            {activeTasks.map((t, idx) => (
              <React.Fragment key={t.id}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleTask(t.id)}
                  style={styles.taskRow}
                >
                  <View
                    style={[
                      styles.taskCheckbox,
                      t.done && styles.taskCheckboxDone,
                    ]}
                  >
                    {t.done ? (
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    ) : null}
                  </View>

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
                    <View style={styles.taskMetaRow}>
                      <Text style={styles.taskProjectText} numberOfLines={1}>
                        {t.project}
                      </Text>
                      <Text style={styles.taskTimeText}> • Due {t.time}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.priorityPill,
                      t.done
                        ? { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }
                        : t.priority === 'High'
                        ? { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }
                        : { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityPillText,
                        {
                          color: t.done
                            ? '#94A3B8'
                            : t.priority === 'High'
                            ? '#DC2626'
                            : '#2563EB',
                        },
                      ]}
                    >
                      {t.priority}
                    </Text>
                  </View>
                </TouchableOpacity>
                {idx < activeTasks.length - 1 && <View style={styles.taskDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* 4. Crew Leave Approvals Queue (Direct Actionable Desk) */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Crew Leave Approvals Queue</Text>
              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>{pendingLeaves.length} Requests</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('LeaveApprovals')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>All Roster →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.leaveQueueContainer}>
            {pendingLeaves.length > 0 ? (
              pendingLeaves.slice(0, 2).map((lr: any, idx: number) => (
                <View key={lr.id || idx} style={styles.leaveCard}>
                  <View style={styles.leaveCardTop}>
                    <View style={styles.leaveAvatarBox}>
                      <Text style={styles.leaveAvatarInitials}>
                        {(lr.employeeName || 'NG').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.leaveInfo}>
                      <Text style={styles.leaveEmpName}>{lr.employeeName || 'Neha Gupta'}</Text>
                      <Text style={styles.leaveSubText}>
                        {lr.type || 'Casual Leave'} • {lr.startDate || '12 Oct 2026'} ({lr.days || 2} days)
                      </Text>
                    </View>
                    <View style={styles.leavePendingPill}>
                      <Text style={styles.leavePendingPillText}>Pending</Text>
                    </View>
                  </View>

                  {lr.reason ? (
                    <Text style={styles.leaveReasonText} numberOfLines={2}>
                      "{lr.reason}"
                    </Text>
                  ) : null}

                  <View style={styles.leaveActionsRow}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      activeOpacity={0.8}
                      onPress={() => handleRejectLeave(lr.id, lr.employeeName || 'Staff')}
                    >
                      <X size={15} color="#dc2626" strokeWidth={2.4} style={{ marginRight: 4 }} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.approveBtn}
                      activeOpacity={0.8}
                      onPress={() => handleApproveLeave(lr.id, lr.employeeName || 'Staff')}
                    >
                      <Check size={15} color="#ffffff" strokeWidth={2.4} style={{ marginRight: 4 }} />
                      <Text style={styles.approveBtnText}>Approve Leave</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateBox}>
                <CheckCircle2 size={24} color="#059669" />
                <Text style={styles.emptyStateText}>All field staff leaves reviewed & clear.</Text>
              </View>
            )}
          </View>

          {/* 5. Field Operations Modules */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Operations Command Desks</Text>
          </View>

          <View style={styles.modulesGrid}>
            {[
              { title: 'ERM Projects', subtitle: 'Drill Footages & Rigs', icon: FolderKanban, color: '#0d9488', bg: '#f0fdfa', route: 'ErmWorkspaceHome' },
              { title: 'Field Database', subtitle: 'Core Logs & DPRs', icon: Compass, color: '#9a3412', bg: '#fff7ed', route: 'FieldDatabaseHome' },
              { title: 'Crew Directory', subtitle: 'Staff Roster & Presence', icon: Users, color: '#1d4ed8', bg: '#eff6ff', route: 'EmployeeDirectory' },
              { title: 'Leave Approvals', subtitle: 'Duty Regularization', icon: Calendar, color: '#059669', bg: '#ecfdf5', route: 'LeaveApprovals' },
              { title: 'Expense Review', subtitle: 'Field Claims Audit', icon: Receipt, color: '#ea580c', bg: '#fff7ed', route: 'ExpenseReview' },
              { title: 'WBS Milestones', subtitle: 'Daily Task Dispatch', icon: CheckCircle2, color: '#7c3aed', bg: '#faf5ff', route: 'Tasks' },
            ].map((mod, idx) => {
              const IconComp = mod.icon;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.modTile}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate(mod.route)}
                >
                  <View style={[styles.modIconWrap, { backgroundColor: mod.bg }]}>
                    <IconComp size={22} color={mod.color} strokeWidth={2.3} />
                  </View>
                  <View style={styles.modContent}>
                    <Text style={styles.modTitle}>{mod.title}</Text>
                    <Text style={styles.modSub} numberOfLines={1}>{mod.subtitle}</Text>
                  </View>
                  <ChevronRight size={15} color="#94a3b8" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
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

  /* 1. Tactical Command Header */
  /* 1. Tactical Command Header */
  commandHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    ...shadows.sm,
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
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0d9488',
  },
  avatarInitials: {
    color: '#0f766e',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#059669',
    borderRadius: radius.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerTitleCol: {
    flex: 1,
  },
  radarStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#059669',
  },
  radarStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
  },
  userNameText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  orgTagText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    borderColor: '#ffffff',
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  bodyWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  /* 2. Live Rig Telemetry Console */
  telemetryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  telemetryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  telemetryTitle: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  telemetryTimestamp: {
    color: '#64748b',
    fontSize: 11,
  },
  rigsList: {
    gap: 10,
    marginBottom: 14,
  },
  rigItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rigStatusDotActive: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#059669',
    marginRight: 10,
  },
  rigStatusDotStandby: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#f59e0b',
    marginRight: 10,
  },
  rigDetails: {
    flex: 1,
  },
  rigNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rigName: {
    color: '#0f172a',
    fontSize: 13.5,
    fontWeight: '700',
  },
  rigDrilledVal: {
    color: '#059669',
    fontSize: 12.5,
    fontWeight: '800',
  },
  rigSubText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 1,
  },
  rigDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 19,
  },
  shiftStrip: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shiftCol: {
    flex: 1,
    alignItems: 'center',
  },
  shiftLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  shiftVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  shiftDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
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
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    ...shadows.xs,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: '#94a3b8',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskCheckboxDone: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  taskInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2.5,
  },
  taskProjectText: {
    fontSize: 12,
    color: '#0d9488',
    fontWeight: '600',
    flexShrink: 1,
  },
  taskTimeText: {
    fontSize: 11.5,
    color: '#64748b',
    flexShrink: 0,
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
    marginHorizontal: 14,
  },

  /* 4. Leave Queue */
  leaveQueueContainer: {
    gap: 10,
    marginBottom: 16,
  },
  leaveCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    ...shadows.xs,
  },
  leaveCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaveAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  leaveAvatarInitials: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '800',
  },
  leaveInfo: {
    flex: 1,
  },
  leaveEmpName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  leaveSubText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  leavePendingPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  leavePendingPillText: {
    color: '#b45309',
    fontSize: 10.5,
    fontWeight: '800',
  },
  leaveReasonText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    color: '#475569',
    marginBottom: 10,
    lineHeight: 17,
  },
  leaveActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  rejectBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyStateBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
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

  /* Bento KPI Grid */
  kpiGrid: {
    gap: 10,
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 124,
  },
  kpiCardProjects: {
    backgroundColor: '#f8fbff',
    borderColor: '#dbeafe',
  },
  kpiCardClients: {
    backgroundColor: '#f5fdfb',
    borderColor: '#ccfbf1',
  },
  kpiCardEmployees: {
    backgroundColor: '#faf7ff',
    borderColor: '#f3e8ff',
  },
  kpiCardPending: {
    backgroundColor: '#fffaf5',
    borderColor: '#fed7aa',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconBoxProjects: {
    backgroundColor: '#eff6ff',
  },
  kpiIconBoxClients: {
    backgroundColor: '#f0fdf4',
  },
  kpiIconBoxEmployees: {
    backgroundColor: '#f5f3ff',
  },
  kpiIconBoxPending: {
    backgroundColor: '#fff7ed',
  },
  kpiBadgeProjects: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextProjects: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgeClients: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextClients: {
    color: '#0f766e',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgeEmployees: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextEmployees: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgePending: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextPending: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiValueProjects: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  kpiValueClients: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  kpiValueEmployees: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  kpiValuePending: {
    fontSize: 27,
    fontWeight: '800',
    color: '#ea580c',
    letterSpacing: -0.5,
  },
  kpiLabelsCol: {
    marginTop: 2,
  },
  kpiTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
    marginBottom: 1,
  },
  kpiSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
});
