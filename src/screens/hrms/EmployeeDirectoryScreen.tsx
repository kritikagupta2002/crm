import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Input, EmptyState, Button } from '../../components';
import { Employee } from '../../types';
import {
  Users,
  Search,
  ChevronRight,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  UserPlus,
  Briefcase,
  MapPin,
  Filter,
  CheckCircle2,
  ShieldAlert,
  Edit2,
  Trash2,
  Award,
} from 'lucide-react-native';

export const EmployeeDirectoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { employees, departments, designations, refreshHrms, deleteEmployee, isLoading } = useHrms();
  const { userRole, hasRole, session } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const canAccessDirectory = hasRole(['Admin', 'HR', 'Manager', 'Executive']);
  const canManageStaff = hasRole(['Admin', 'HR']);

  const activeEmployeeId = session?.accountType === 'team' ? (session as any).employeeId : 'BGS-2021-001';

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHrms();
    setRefreshing(false);
  };

  const deptList = useMemo(() => {
    const list = departments.map(d => d.name);
    return ['All', ...list];
  }, [departments]);

  const statusOptions = ['All', 'Active', 'On Leave', 'Notice Period', 'Probation'];
  const roleOptions = ['All', 'admin', 'hr', 'manager', 'employee'];

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        (emp.email && emp.email.toLowerCase().includes(q)) ||
        (emp.employment?.designation && emp.employment.designation.toLowerCase().includes(q)) ||
        (emp.employment?.department && emp.employment.department.toLowerCase().includes(q));

      const matchesDept =
        selectedDept === 'All' ||
        emp.employment?.department?.toLowerCase() === selectedDept.toLowerCase();

      const matchesStatus =
        selectedStatus === 'All' ||
        emp.employment?.status?.toLowerCase() === selectedStatus.toLowerCase();

      const matchesRole =
        selectedRole === 'All' ||
        emp.role?.toLowerCase() === selectedRole.toLowerCase();

      return matchesSearch && matchesDept && matchesStatus && matchesRole;
    });
  }, [employees, search, selectedDept, selectedStatus, selectedRole]);

  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.employment?.status === 'Active').length;
  const onLeaveCount = employees.filter(e => e.employment?.status === 'On Leave').length;
  const kycVerifiedCount = employees.filter(e => e.kyc?.status === 'Verified').length;

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'Employee has no contact number recorded.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call.');
    });
  };

  const handleEmail = (email?: string) => {
    if (!email) {
      Alert.alert('No Email', 'Employee has no email address recorded.');
      return;
    }
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open mail client.');
    });
  };

  const handleDelete = (emp: Employee) => {
    if (!canManageStaff) {
      Alert.alert('Access Denied', 'Only HR and Admin personnel can remove employee records.');
      return;
    }

    Alert.alert(
      'Remove Staff Record',
      `Are you sure you want to remove "${emp.name}" (${emp.employeeId}) from the staff directory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmployee(emp.id);
              Alert.alert('Success', `${emp.name} has been removed from the directory.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove employee.');
            }
          },
        },
      ]
    );
  };

  if (!canAccessDirectory) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="Staff Directory"
          subtitle="Organization Staff & Profiles"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedIconWrap}>
            <ShieldAlert size={48} color={colors.warning} />
          </View>
          <Text style={styles.restrictedTitle}>Access Restricted</Text>
          <Text style={styles.restrictedMessage}>
            Organization-wide Employee Directory is reserved for HR, Management, and Department Supervisors.
            {'\n\n'}
            You may view and update your own personal 360° employee profile below.
          </Text>
          <Button
            title="View My 360° Profile"
            variant="primary"
            style={styles.restrictedBtn}
            onPress={() => navigation.navigate('EmployeeDetail', { employeeId: activeEmployeeId })}
          />
        </View>
      </View>
    );
  }

  const renderEmpCard = ({ item }: { item: Employee }) => {
    const isKycVerified = item.kyc?.status === 'Verified';
    const deptName = item.employment?.department || 'Geology & Mineral Exploration';
    const desigTitle = item.employment?.designation || 'Specialist';
    const status = item.employment?.status || 'Active';

    const initials = item.name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.nameBlock}>
              <View style={styles.nameAndBadge}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                {isKycVerified && (
                  <View style={styles.kycVerifiedChip}>
                    <CheckCircle2 size={12} color={colors.success} />
                    <Text style={styles.kycVerifiedText}>KYC</Text>
                  </View>
                )}
              </View>
              <View style={styles.metaRow}>
                <View style={styles.empIdBadge}>
                  <Text style={styles.empIdText}>{item.employeeId}</Text>
                </View>
                <Text style={styles.roleBadge}>{(item.role || 'employee').toUpperCase()}</Text>
              </View>
            </View>
          </View>

          <StatusBadge status={status} size="small" />
        </View>

        <View style={styles.jobInfo}>
          <View style={styles.jobRow}>
            <Briefcase size={13} color={colors.primary} />
            <Text style={styles.jobText} numberOfLines={1}>{desigTitle}</Text>
          </View>
          <View style={styles.jobRow}>
            <Building2 size={13} color={colors.text.tertiary} />
            <Text style={styles.deptText} numberOfLines={1}>{deptName}</Text>
          </View>
          {item.employment?.workLocation ? (
            <View style={styles.jobRow}>
              <MapPin size={13} color={colors.text.tertiary} />
              <Text style={styles.locationText} numberOfLines={1}>{item.employment.workLocation}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.contactActions}>
            {item.phone ? (
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => handleCall(item.phone)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Phone size={13} color={colors.primary} />
                <Text style={styles.contactBtnText}>{item.phone}</Text>
              </TouchableOpacity>
            ) : null}
            {item.email ? (
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => handleEmail(item.email)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Mail size={13} color={colors.text.tertiary} />
                <Text style={styles.contactBtnText} numberOfLines={1}>{item.email}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.manageActions}>
            {canManageStaff && (
              <>
                <TouchableOpacity
                  style={styles.iconActionBtn}
                  onPress={() => navigation.navigate('EditEmployee', { employeeId: item.id })}
                >
                  <Edit2 size={14} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconActionBtn}
                  onPress={() => handleDelete(item)}
                >
                  <Trash2 size={14} color={colors.danger} />
                </TouchableOpacity>
              </>
            )}
            <ChevronRight size={16} color={colors.text.tertiary} />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Employee Directory"
        subtitle="Staff Master, KYC & 360° Profiles"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          canManageStaff ? (
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={() => navigation.navigate('AddEmployee')}
            >
              <UserPlus size={18} color="#FFFFFF" />
              <Text style={styles.headerAddBtnText}>Add</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total Staff</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{onLeaveCount}</Text>
          <Text style={styles.statLabel}>On Leave</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{kycVerifiedCount}</Text>
          <Text style={styles.statLabel}>KYC Done</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by name, ID, designation, email..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.text.secondary} />}
        />
      </View>

      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={deptList}
          keyExtractor={item => `dept-${item}`}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedDept === item && styles.filterChipActive]}
              onPress={() => setSelectedDept(item)}
            >
              <Text style={[styles.filterChipText, selectedDept === item && styles.filterChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusOptions}
          keyExtractor={item => `status-${item}`}
          contentContainerStyle={[styles.filterList, { paddingTop: 6 }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.smallFilterChip, selectedStatus === item && styles.smallFilterChipActive]}
              onPress={() => setSelectedStatus(item)}
            >
              <Text style={[styles.smallFilterChipText, selectedStatus === item && styles.smallFilterChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredEmployees}
        keyExtractor={item => item.id}
        renderItem={renderEmpCard}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            title="No Staff Found"
            message={
              search
                ? `No employees match query "${search}".`
                : 'No employees found under the selected filters.'
            }
            icon={<Users size={44} color={colors.text.tertiary} />}
            actionLabel={search || selectedDept !== 'All' || selectedStatus !== 'All' ? 'Reset Filters' : undefined}
            onAction={() => {
              setSearch('');
              setSelectedDept('All');
              setSelectedStatus('All');
              setSelectedRole('All');
            }}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  headerAddBtnText: {
    ...typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h4,
    fontWeight: '800',
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.subtle,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  filterSection: {
    paddingBottom: spacing.xs,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  smallFilterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  smallFilterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  smallFilterChipText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  smallFilterChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.body,
    fontWeight: '800',
    color: colors.primary,
  },
  nameBlock: {
    flex: 1,
  },
  nameAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.primary,
    flexShrink: 1,
  },
  kycVerifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  kycVerifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  empIdBadge: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  empIdText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  roleBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  jobInfo: {
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    gap: 4,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 1,
  },
  deptText: {
    ...typography.caption,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  locationText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
    flexShrink: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '48%',
  },
  contactBtnText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
  manageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconActionBtn: {
    padding: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
  },
  restrictedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  restrictedIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  restrictedTitle: {
    ...typography.h3,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  restrictedMessage: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  restrictedBtn: {
    width: '100%',
  },
});
