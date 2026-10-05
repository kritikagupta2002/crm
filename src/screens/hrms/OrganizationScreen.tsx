import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, Button, Input, EmptyState, StatusBadge } from '../../components';
import { Designation, Department } from '../../types';
import { HierarchyNode } from '../../services';
import {
  Building2,
  Plus,
  Trash2,
  ShieldAlert,
  Users,
  Award,
  Edit2,
  Network,
  ChevronDown,
  ChevronRight,
  MapPin,
  Search,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Layers,
} from 'lucide-react-native';

export const OrganizationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    departments,
    designations,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createDesignation,
    updateDesignation,
    deleteDesignation,
    getOrganizationHierarchy,
    refreshHrms,
    employees,
  } = useHrms();

  const { hasRole } = useAuth();
  const canManageOrg = hasRole(['Admin', 'HR']);

  const [activeTab, setActiveTab] = useState<'designations' | 'departments' | 'hierarchy'>('designations');
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('All');

  const [showDesigModal, setShowDesigModal] = useState(false);
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null);
  const [desigTitle, setDesigTitle] = useState('');
  const [desigCode, setDesigCode] = useState('');
  const [desigDept, setDesigDept] = useState('');
  const [desigLevel, setDesigLevel] = useState('L3');
  const [desigMinExp, setDesigMinExp] = useState('3-5 Years');
  const [desigErrors, setDesigErrors] = useState<Record<string, string>>({});

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptLocation, setDeptLocation] = useState('Jaipur Corporate HQ');
  const [deptDescription, setDeptDescription] = useState('');
  const [deptErrors, setDeptErrors] = useState<Record<string, string>>({});

  const [hierarchyData, setHierarchyData] = useState<HierarchyNode[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHrms();
    await loadHierarchy();
    setRefreshing(false);
  };

  const loadHierarchy = async () => {
    try {
      const tree = await getOrganizationHierarchy();
      setHierarchyData(tree);
      const initialExpanded: Record<string, boolean> = {};
      tree.slice(0, 2).forEach(t => {
        initialExpanded[t.department.id] = true;
      });
      setExpandedDepts(initialExpanded);
    } catch (e) {
      console.error('Error loading org hierarchy:', e);
    }
  };

  useEffect(() => {
    loadHierarchy();
  }, [departments, designations, employees]);

  const getLiveStaffCount = (desig: Designation) => {
    return employees.filter(
      e =>
        (e.employment?.designation?.toLowerCase() === desig.title.toLowerCase() ||
          e.employment?.designationCode?.toUpperCase() === desig.code.toUpperCase()) &&
        e.employment?.status === 'Active'
    ).length;
  };

  const filteredDesignations = useMemo(() => {
    return designations.filter(d => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.department && d.department.toLowerCase().includes(q));

      const matchesDept =
        selectedDeptFilter === 'All' ||
        (d.department && d.department.toLowerCase() === selectedDeptFilter.toLowerCase()) ||
        (d.departmentName && d.departmentName.toLowerCase() === selectedDeptFilter.toLowerCase());

      const matchesLevel =
        selectedLevelFilter === 'All' ||
        d.level === selectedLevelFilter ||
        d.grade === selectedLevelFilter;

      return matchesSearch && matchesDept && matchesLevel;
    });
  }, [designations, search, selectedDeptFilter, selectedLevelFilter]);

  const filteredDepartments = useMemo(() => {
    return departments.filter(d => {
      const q = search.trim().toLowerCase();
      return (
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.headName && d.headName.toLowerCase().includes(q))
      );
    });
  }, [departments, search]);

  const getLevelColor = (lvl?: string) => {
    switch (lvl) {
      case 'L6':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' }; // Amber
      case 'L5':
        return { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE' }; // Purple
      case 'L4':
        return { bg: '#E0E7FF', text: '#3730A3', border: '#A5B4FC' }; // Indigo
      case 'L3':
        return { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' }; // Blue
      case 'L2':
        return { bg: '#CCFBF1', text: '#115E59', border: '#5EEAD4' }; // Teal
      case 'L1':
      default:
        return { bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' }; // Slate
    }
  };

  const handleDeleteDesignation = async (desig: Designation) => {
    const liveStaff = getLiveStaffCount(desig);

    if (liveStaff > 0) {
      Alert.alert(
        'Deletion Blocked by Safety Guard',
        `Cannot delete designation with active staff assigned.\n\nThere are ${liveStaff} active employee(s) currently assigned to "${desig.title}".\n\nPlease reassign or update staff records first.`,
        [{ text: 'Understood', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Confirm Designation Deletion',
      `Are you sure you want to permanently delete designation "${desig.title}" (${desig.code})?\n\nThis designation has 0 active staff assigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDesignation(desig.id);
              Alert.alert('Deleted', `Designation "${desig.title}" has been deleted.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete designation.');
            }
          },
        },
      ]
    );
  };

  const openAddDesig = () => {
    setEditingDesig(null);
    setDesigTitle('');
    setDesigCode('');
    setDesigDept(departments[0]?.name || 'Geology & Mineral Exploration');
    setDesigLevel('L3');
    setDesigMinExp('3-5 Years');
    setDesigErrors({});
    setShowDesigModal(true);
  };

  const openEditDesig = (desig: Designation) => {
    setEditingDesig(desig);
    setDesigTitle(desig.title);
    setDesigCode(desig.code);
    setDesigDept(desig.departmentName || desig.department || departments[0]?.name || '');
    setDesigLevel(desig.level || desig.grade || 'L3');
    setDesigMinExp(desig.minExperience || '3-5 Years');
    setDesigErrors({});
    setShowDesigModal(true);
  };

  const validateDesig = (): boolean => {
    const errs: Record<string, string> = {};
    const title = desigTitle.trim();
    const code = desigCode.trim().toUpperCase();

    if (!title) {
      errs.title = 'Designation Title is required.';
    } else if (title.length < 3) {
      errs.title = 'Title must be at least 3 characters.';
    } else if (title.length > 60) {
      errs.title = 'Title cannot exceed 60 characters.';
    } else {
      const dup = designations.find(
        d => d.title.toLowerCase() === title.toLowerCase() && d.id !== editingDesig?.id
      );
      if (dup) {
        errs.title = `A designation titled "${title}" already exists.`;
      }
    }

    if (!code) {
      errs.code = 'Designation Code is required.';
    } else if (code.length < 2) {
      errs.code = 'Code must be at least 2 characters.';
    } else if (code.length > 12) {
      errs.code = 'Code cannot exceed 12 characters.';
    } else if (!/^[A-Z0-9-]+$/.test(code)) {
      errs.code = 'Code must contain only uppercase letters, digits, and hyphens (e.g. SR-GEO).';
    } else {
      const dup = designations.find(
        d => d.code.toUpperCase() === code && d.id !== editingDesig?.id
      );
      if (dup) {
        errs.code = `Code "${code}" is already in use by "${dup.title}".`;
      }
    }

    setDesigErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDesig = async () => {
    if (!validateDesig()) {
      Alert.alert('Validation Error', 'Please resolve highlighted designation errors.');
      return;
    }

    try {
      const deptObj = departments.find(
        d => d.name.toLowerCase() === desigDept.toLowerCase()
      );

      const payload = {
        title: desigTitle.trim(),
        code: desigCode.trim().toUpperCase(),
        department: desigDept,
        departmentName: desigDept,
        departmentId: deptObj?.id || 'dept-geo',
        level: desigLevel,
        grade: desigLevel,
        minExperience: desigMinExp.trim() || '3-5 Years',
        status: 'Active' as const,
      };

      if (editingDesig) {
        await updateDesignation(editingDesig.id, payload);
        Alert.alert('Success', `Designation "${payload.title}" updated.`);
      } else {
        await createDesignation(payload);
        Alert.alert('Success', `Designation "${payload.title}" created.`);
      }

      setShowDesigModal(false);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save designation.');
    }
  };

  const openAddDept = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptCode('');
    setDeptHead('Dr. Amit Kumar Bansal');
    setDeptLocation('Jaipur Corporate HQ');
    setDeptDescription('');
    setDeptErrors({});
    setShowDeptModal(true);
  };

  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDeptHead(dept.headName || '');
    setDeptLocation(dept.location || 'Jaipur Corporate HQ');
    setDeptDescription(dept.description || '');
    setDeptErrors({});
    setShowDeptModal(true);
  };

  const validateDept = (): boolean => {
    const errs: Record<string, string> = {};
    const name = deptName.trim();
    const code = deptCode.trim().toUpperCase();

    if (!name || name.length < 2) {
      errs.name = 'Department Name must be at least 2 characters.';
    } else {
      const dup = departments.find(
        d => d.name.toLowerCase() === name.toLowerCase() && d.id !== editingDept?.id
      );
      if (dup) {
        errs.name = `Department "${name}" already exists.`;
      }
    }

    if (!code || code.length < 2 || code.length > 10) {
      errs.code = 'Department Code must be 2 to 10 characters.';
    } else {
      const dup = departments.find(
        d => d.code.toUpperCase() === code && d.id !== editingDept?.id
      );
      if (dup) {
        errs.code = `Code "${code}" is already in use by "${dup.name}".`;
      }
    }

    setDeptErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDept = async () => {
    if (!validateDept()) {
      Alert.alert('Validation Error', 'Please resolve department validation errors.');
      return;
    }

    try {
      const payload = {
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
        headName: deptHead.trim() || 'Dr. Amit Kumar Bansal',
        location: deptLocation.trim() || 'Jaipur Corporate HQ',
        description: deptDescription.trim(),
      };

      if (editingDept) {
        await updateDepartment(editingDept.id, payload);
        Alert.alert('Success', `Department "${payload.name}" updated.`);
      } else {
        await createDepartment(payload);
        Alert.alert('Success', `Department "${payload.name}" created.`);
      }

      setShowDeptModal(false);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save department.');
    }
  };

  const handleDeleteDept = async (dept: Department) => {
    const assignedStaff = employees.filter(
      e =>
        e.employment?.department?.toLowerCase() === dept.name.toLowerCase() &&
        e.employment?.status === 'Active'
    ).length;

    if (assignedStaff > 0) {
      Alert.alert(
        'Deletion Blocked',
        `Cannot delete department "${dept.name}" because ${assignedStaff} active employee(s) belong to it. Reassign staff first.`
      );
      return;
    }

    Alert.alert(
      'Confirm Department Deletion',
      `Are you sure you want to delete department "${dept.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDepartment(dept.id);
              Alert.alert('Deleted', `Department "${dept.name}" deleted.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete department.');
            }
          },
        },
      ]
    );
  };

  const toggleDeptExpand = (deptId: string) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  if (!canManageOrg) {
    return (
      <View style={styles.container}>
        <AppHeader title="Organization Management" showBack onBack={() => navigation.goBack()} />
        <View style={styles.restrictedContainer}>
          <ShieldAlert size={56} color={colors.warning} />
          <Text style={styles.restrictedTitle}>Access Restricted</Text>
          <Text style={styles.restrictedMessage}>
            Organization Master, Department configuration, and Designation governance are reserved
            for HR and Senior Management.
          </Text>
          <Button
            title="Return to Home"
            variant="primary"
            style={{ width: '100%', marginTop: spacing.lg }}
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Organization"
        subtitle="Departments, Designations & Hierarchy"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          activeTab === 'designations' ? (
            <TouchableOpacity style={styles.addBtn} onPress={openAddDesig}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Designation</Text>
            </TouchableOpacity>
          ) : activeTab === 'departments' ? (
            <TouchableOpacity style={styles.addBtn} onPress={openAddDept}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Department</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'designations' && styles.tabItemActive]}
          onPress={() => setActiveTab('designations')}
        >
          <Award size={16} color={activeTab === 'designations' ? colors.primary : colors.text.tertiary} />
          <Text style={[styles.tabText, activeTab === 'designations' && styles.tabTextActive]}>
            Designations ({designations.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'departments' && styles.tabItemActive]}
          onPress={() => setActiveTab('departments')}
        >
          <Building2 size={16} color={activeTab === 'departments' ? colors.primary : colors.text.tertiary} />
          <Text style={[styles.tabText, activeTab === 'departments' && styles.tabTextActive]}>
            Departments ({departments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'hierarchy' && styles.tabItemActive]}
          onPress={() => setActiveTab('hierarchy')}
        >
          <Network size={16} color={activeTab === 'hierarchy' ? colors.primary : colors.text.tertiary} />
          <Text style={[styles.tabText, activeTab === 'hierarchy' && styles.tabTextActive]}>
            Hierarchy
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'designations' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBar}>
            <Input
              placeholder="Search designation or code..."
              value={search}
              onChangeText={setSearch}
              leftIcon={<Search size={18} color={colors.text.secondary} />}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {['All', 'L6', 'L5', 'L4', 'L3', 'L2', 'L1'].map(lvl => (
              <TouchableOpacity
                key={lvl}
                style={[
                  styles.filterChip,
                  selectedLevelFilter === lvl && styles.filterChipActive,
                ]}
                onPress={() => setSelectedLevelFilter(lvl)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLevelFilter === lvl && styles.filterChipTextActive,
                  ]}
                >
                  {lvl === 'All' ? 'All Levels' : `Level ${lvl}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredDesignations}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => {
              const liveCount = getLiveStaffCount(item);
              const lvlTheme = getLevelColor(item.level || item.grade);

              return (
                <Card style={styles.desigCard}>
                  <View style={styles.desigHeader}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <View style={styles.titleRow}>
                        <Text style={styles.desigTitle}>{item.title}</Text>
                        <View
                          style={[
                            styles.levelPill,
                            {
                              backgroundColor: lvlTheme.bg,
                              borderColor: lvlTheme.border,
                            },
                          ]}
                        >
                          <Text style={[styles.levelPillText, { color: lvlTheme.text }]}>
                            {item.level || item.grade || 'L3'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.desigDept}>
                        {item.departmentName || item.department || 'Exploration'}
                      </Text>
                    </View>

                    <View style={styles.codeBadge}>
                      <Text style={styles.codeBadgeText}>{item.code}</Text>
                    </View>
                  </View>

                  <View style={styles.desigFooter}>
                    <View style={styles.staffCountWrap}>
                      <Users size={14} color={liveCount > 0 ? colors.primary : colors.text.tertiary} />
                      <Text
                        style={[
                          styles.staffCountText,
                          liveCount > 0 && { color: colors.primary, fontWeight: '700' },
                        ]}
                      >
                        {liveCount} Staff Assigned
                      </Text>
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openEditDesig(item)}
                      >
                        <Edit2 size={15} color={colors.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDeleteDesignation(item)}
                      >
                        <Trash2
                          size={15}
                          color={liveCount > 0 ? colors.text.tertiary : colors.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                title="No Designations Found"
                message="No designations match the active filter or query."
                icon={<Award size={40} color={colors.text.tertiary} />}
              />
            }
          />
        </View>
      )}

      {activeTab === 'departments' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBar}>
            <Input
              placeholder="Search departments..."
              value={search}
              onChangeText={setSearch}
              leftIcon={<Search size={18} color={colors.text.secondary} />}
            />
          </View>

          <FlatList
            data={filteredDepartments}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => {
              const liveCount = employees.filter(
                e =>
                  e.employment?.department?.toLowerCase() === item.name.toLowerCase() &&
                  e.employment?.status === 'Active'
              ).length;

              return (
                <Card style={styles.deptCard}>
                  <View style={styles.deptHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deptName}>{item.name}</Text>
                      <Text style={styles.deptHead}>HOD: {item.headName || 'Dr. Amit Kumar Bansal'}</Text>
                    </View>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeBadgeText}>{item.code}</Text>
                    </View>
                  </View>

                  <View style={styles.deptMetaRow}>
                    <View style={styles.locationItem}>
                      <MapPin size={13} color={colors.text.tertiary} />
                      <Text style={styles.locationText}>{item.location || 'Jaipur Corporate HQ'}</Text>
                    </View>
                    <View style={styles.staffCountWrap}>
                      <Users size={13} color={colors.primary} />
                      <Text style={[styles.staffCountText, { color: colors.primary, fontWeight: '700' }]}>
                        {liveCount} Staff
                      </Text>
                    </View>
                  </View>

                  {item.description ? (
                    <Text style={styles.deptDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  <View style={styles.deptFooter}>
                    <StatusBadge status={item.status || 'Active'} size="small" />
                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => openEditDept(item)}>
                        <Edit2 size={15} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteDept(item)}>
                        <Trash2 size={15} color={liveCount > 0 ? colors.text.tertiary : colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                title="No Departments Found"
                message="No departments match your query."
                icon={<Building2 size={40} color={colors.text.tertiary} />}
              />
            }
          />
        </View>
      )}

      {activeTab === 'hierarchy' && (
        <ScrollView
          contentContainerStyle={styles.hierarchyContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Card style={styles.companyApexCard}>
            <Building2 size={24} color={colors.primary} />
            <Text style={styles.companyApexTitle}>Bansal Geo-Services Corporate</Text>
            <Text style={styles.companyApexSub}>Corporate HQ • Jaipur, Rajasthan</Text>
            <View style={styles.apexStatsPill}>
              <Text style={styles.apexStatsText}>
                {departments.length} Departments • {designations.length} Designations • {employees.length} Staff
              </Text>
            </View>
          </Card>

          <View style={styles.treeContainer}>
            {hierarchyData.map(node => {
              const isExpanded = expandedDepts[node.department.id];
              return (
                <View key={node.department.id} style={styles.deptTreeNode}>
                  <TouchableOpacity
                    style={styles.deptNodeCard}
                    onPress={() => toggleDeptExpand(node.department.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.deptNodeLeft}>
                      <Building2 size={18} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deptNodeTitle}>{node.department.name}</Text>
                        <Text style={styles.deptNodeSub}>HOD: {node.department.headName}</Text>
                      </View>
                    </View>

                    <View style={styles.deptNodeRight}>
                      <View style={styles.deptStaffBadge}>
                        <Users size={12} color={colors.primary} />
                        <Text style={styles.deptStaffBadgeText}>{node.totalStaff} Staff</Text>
                      </View>
                      {isExpanded ? (
                        <ChevronDown size={18} color={colors.text.tertiary} />
                      ) : (
                        <ChevronRight size={18} color={colors.text.tertiary} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.desigBranchContainer}>
                      {node.designations.length === 0 ? (
                        <Text style={styles.noBranchText}>No designations under this department.</Text>
                      ) : (
                        node.designations.map(desigGroup => {
                          const lvlTheme = getLevelColor(desigGroup.designation.level || desigGroup.designation.grade);
                          return (
                            <View key={desigGroup.designation.id} style={styles.desigSubNode}>
                              <View style={styles.desigSubHeader}>
                                <View style={styles.desigSubLeft}>
                                  <View
                                    style={[
                                      styles.levelDot,
                                      { backgroundColor: lvlTheme.text },
                                    ]}
                                  />
                                  <Text style={styles.desigSubTitle}>
                                    {desigGroup.designation.title}
                                  </Text>
                                </View>
                                <View
                                  style={[
                                    styles.levelPill,
                                    { backgroundColor: lvlTheme.bg, borderColor: lvlTheme.border },
                                  ]}
                                >
                                  <Text style={[styles.levelPillText, { color: lvlTheme.text }]}>
                                    {desigGroup.designation.level || desigGroup.designation.grade || 'L3'}
                                  </Text>
                                </View>
                              </View>

                              {desigGroup.employees.length === 0 ? (
                                <Text style={styles.noStaffBranchText}>
                                  No staff currently active in this role.
                                </Text>
                              ) : (
                                <View style={styles.staffListContainer}>
                                  {desigGroup.employees.map(emp => {
                                    const initials = emp.name
                                      .split(' ')
                                      .map(n => n[0])
                                      .slice(0, 2)
                                      .join('')
                                      .toUpperCase();

                                    return (
                                      <TouchableOpacity
                                        key={emp.id}
                                        style={styles.staffItemCard}
                                        onPress={() =>
                                          navigation.navigate('EmployeeDetail', {
                                            employeeId: emp.id,
                                          })
                                        }
                                      >
                                        <View style={styles.staffMiniAvatar}>
                                          <Text style={styles.staffMiniAvatarText}>{initials}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                          <Text style={styles.staffName}>{emp.name}</Text>
                                          <Text style={styles.staffEmpId}>{emp.employeeId}</Text>
                                        </View>
                                        <ChevronRight size={14} color={colors.text.tertiary} />
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              )}
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <Modal visible={showDesigModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDesig ? 'Edit Designation' : 'New Corporate Designation'}
              </Text>
              <TouchableOpacity onPress={() => setShowDesigModal(false)}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.sm }}>
              <Input
                label="Designation Title (3–60 chars) *"
                placeholder="Senior Field Geologist"
                value={desigTitle}
                onChangeText={setDesigTitle}
                error={desigErrors.title}
              />

              <Input
                label="Designation Code (2–12 uppercase chars) *"
                placeholder="SR-GEO"
                autoCapitalize="characters"
                maxLength={12}
                value={desigCode}
                onChangeText={v => setDesigCode(v.toUpperCase())}
                error={desigErrors.code}
              />

              <Text style={styles.inputLabel}>Department *</Text>
              <View style={styles.modalPillRow}>
                {departments.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.modalPill, desigDept === d.name && styles.modalPillActive]}
                    onPress={() => setDesigDept(d.name)}
                  >
                    <Text
                      style={[
                        styles.modalPillText,
                        desigDept === d.name && styles.modalPillTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {d.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Corporate Level / Grade</Text>
              <View style={styles.modalPillRow}>
                {['L6', 'L5', 'L4', 'L3', 'L2', 'L1'].map(lvl => (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.modalPill, desigLevel === lvl && styles.modalPillActive]}
                    onPress={() => setDesigLevel(lvl)}
                  >
                    <Text
                      style={[
                        styles.modalPillText,
                        desigLevel === lvl && styles.modalPillTextActive,
                      ]}
                    >
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Minimum Experience"
                placeholder="3-5 Years"
                value={desigMinExp}
                onChangeText={setDesigMinExp}
              />

              <Button
                title={editingDesig ? 'Update Designation' : 'Create Designation'}
                variant="primary"
                onPress={handleSaveDesig}
                style={{ marginTop: spacing.sm }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showDeptModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDept ? 'Edit Department' : 'New Department'}
              </Text>
              <TouchableOpacity onPress={() => setShowDeptModal(false)}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.sm }}>
              <Input
                label="Department Name *"
                placeholder="Geophysics & Mineral Survey"
                value={deptName}
                onChangeText={setDeptName}
                error={deptErrors.name}
              />

              <Input
                label="Department Code (2–10 chars) *"
                placeholder="GEOPHYS"
                autoCapitalize="characters"
                maxLength={10}
                value={deptCode}
                onChangeText={v => setDeptCode(v.toUpperCase())}
                error={deptErrors.code}
              />

              <Input
                label="Head of Department (HOD)"
                placeholder="Dr. Amit Kumar Bansal"
                value={deptHead}
                onChangeText={setDeptHead}
              />

              <Input
                label="Location"
                placeholder="Jaipur Corporate HQ"
                value={deptLocation}
                onChangeText={setDeptLocation}
              />

              <Input
                label="Description"
                placeholder="Core activities, rig operations, mineral survey responsibilities"
                value={deptDescription}
                onChangeText={setDeptDescription}
                multiline
                numberOfLines={3}
              />

              <Button
                title={editingDept ? 'Update Department' : 'Create Department'}
                variant="primary"
                onPress={handleSaveDept}
                style={{ marginTop: spacing.sm }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  addBtnText: {
    ...typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  searchBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
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
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  desigCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  desigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  desigTitle: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.primary,
  },
  levelPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  levelPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  desigDept: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  codeBadge: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  codeBadgeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  desigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  staffCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  staffCountText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtn: {
    padding: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
  },
  deptCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  deptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deptName: {
    ...typography.bodyLarge,
    fontWeight: '800',
    color: colors.text.primary,
  },
  deptHead: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  deptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  deptDesc: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 16,
    marginTop: 4,
  },
  deptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  hierarchyContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  companyApexCard: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: 4,
  },
  companyApexTitle: {
    ...typography.h4,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
  companyApexSub: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  apexStatsPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  apexStatsText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  treeContainer: {
    gap: spacing.md,
  },
  deptTreeNode: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  deptNodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  deptNodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  deptNodeTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  deptNodeSub: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
  deptNodeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deptStaffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  deptStaffBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  desigBranchContainer: {
    backgroundColor: colors.background.primary,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    marginLeft: spacing.lg,
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  noBranchText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  desigSubNode: {
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  desigSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  desigSubLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  desigSubTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  noStaffBranchText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  staffListContainer: {
    marginTop: spacing.xs,
    gap: 4,
  },
  staffItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.primary,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  staffMiniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffMiniAvatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  staffName: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  staffEmpId: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: colors.text.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h4,
    fontWeight: '800',
    color: colors.text.primary,
  },
  modalClose: {
    ...typography.caption,
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  modalPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  modalPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  modalPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  modalPillText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  modalPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  restrictedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  restrictedTitle: {
    ...typography.h3,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  restrictedMessage: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.xs,
  },
});
