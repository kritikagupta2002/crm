import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  FolderKanban,
  Search,
  Plus,
  ArrowRight,
  Clock,
  Landmark,
  ScrollText,
  CircleDashed,
  X,
  List,
  GanttChart,
  MapPin,
  Users,
  CheckCircle2,
  Calendar,
  DollarSign,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Input, Button } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { formatCurrencyLakhs as formatCurrency } from '../../utils';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { ERM_STAGES, APPROVALS, COORDINATORS, TEAM_LEADS } from '../../constants';
import { Project, ProjectStageNumber } from '../../types';

interface ProjectsScreenProps {
  route?: any;
  navigation: any;
}

const TABS = ['All', 'In progress', 'Awaiting approval', 'Approved', 'Completed', 'Not started'] as const;

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ route, navigation }) => {
  const { projects, createProject, clients } = useCrm();
  const { role } = useAuth();

  const initialStageKey = route?.params?.stageKey;
  const [selectedStageKey, setSelectedStageKey] = useState<string | null>(initialStageKey || null);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>(route?.params?.view || 'list');
  const [createModalVisible, setCreateModalVisible] = useState(Boolean(route?.params?.openCreate));

  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState(clients[0]?.name || 'Hindustan Zinc Ltd');
  const [newService, setNewService] = useState('Mineral Exploration & Resources');
  const [newLocation, setNewLocation] = useState('Bhilwara, Rajasthan');
  const [newBudget, setNewBudget] = useState('3500000');
  const [submitting, setSubmitting] = useState(false);

  const todayISO = new Date().toISOString().split('T')[0];
  const thirtyDaysAgoISO = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const stageIndex = selectedStageKey
    ? ERM_STAGES.findIndex((st) => st.key === selectedStageKey)
    : -1;

  const countByStatus = (status: string) => projects.filter((p) => p.status === status).length;
  const recentLettersCount = projects.reduce((total, p) => {
    const letters = (p.letters || []).filter((l) => l.date >= thirtyDaysAgoISO);
    return total + letters.length;
  }, 0);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (activeTab !== 'All' && p.status !== activeTab) return false;
      if (stageIndex >= 0) {
        const pStageIdx = p.stageIndex !== undefined ? p.stageIndex : (p.currentStage || 1) - 1;
        if (pStageIdx !== stageIndex) return false;
      }
      if (q) {
        const text = `${p.title} ${p.name || ''} ${p.projectCode} ${p.clientName} ${p.authority || ''} ${p.site || p.location}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [projects, activeTab, stageIndex, search]);

  const handleCreateProject = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a project title / block name.');
      return;
    }
    setSubmitting(true);
    try {
      await createProject({
        title: newTitle.trim(),
        clientName: newClient,
        service: newService,
        location: newLocation,
        site: newLocation,
        baselineBudget: Number(newBudget) || 2500000,
      });
      setCreateModalVisible(false);
      setNewTitle('');
      Alert.alert('Success', 'New Exploration Project registered in Stage 1 (Allocation).');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unable to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusTone = (status?: string) => {
    switch (status) {
      case 'Completed':
        return colors.success;
      case 'Approved':
        return colors.accent;
      case 'Awaiting approval':
        return colors.warning;
      case 'In progress':
        return colors.info;
      default:
        return colors.textMuted;
    }
  };

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="Projects & Approvals"
          subtitle={`${projects.length} blocks • ${countByStatus('Awaiting approval')} with authorities`}
          showBack
          onBack={() => navigation.goBack()}
          onNotificationPress={() => navigation.navigate('Notifications')}
          rightAction={
            (role === 'admin' || role === 'lead') ? (
              <TouchableOpacity
                style={styles.headerAddBtn}
                onPress={() => setCreateModalVisible(true)}
              >
                <Plus size={18} color={colors.white} />
              </TouchableOpacity>
            ) : undefined
          }
        />
      }
    >
      <View style={styles.metricsStrip}>
        <TouchableOpacity
          style={styles.metricItem}
          onPress={() => setActiveTab(activeTab === 'In progress' ? 'All' : 'In progress')}
          activeOpacity={0.7}
        >
          <Text style={[styles.metricVal, { color: colors.info }]}>{countByStatus('In progress')}</Text>
          <Text style={styles.metricLbl}>In Progress</Text>
        </TouchableOpacity>
        <View style={styles.metricDivider} />
        <TouchableOpacity
          style={styles.metricItem}
          onPress={() => setActiveTab(activeTab === 'Awaiting approval' ? 'All' : 'Awaiting approval')}
          activeOpacity={0.7}
        >
          <Text style={[styles.metricVal, { color: colors.warning }]}>{countByStatus('Awaiting approval')}</Text>
          <Text style={styles.metricLbl}>With Govt</Text>
        </TouchableOpacity>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, { color: colors.success }]}>{recentLettersCount}</Text>
          <Text style={styles.metricLbl}>Letters</Text>
        </View>
        <View style={styles.metricDivider} />
        <TouchableOpacity
          style={styles.metricItem}
          onPress={() => setActiveTab(activeTab === 'Not started' ? 'All' : 'Not started')}
          activeOpacity={0.7}
        >
          <Text style={styles.metricVal}>{countByStatus('Not started')}</Text>
          <Text style={styles.metricLbl}>Pending</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search block, client, authority, site..."
            placeholderTextColor={colors.textMuted}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.viewSwitchRow}>
          {stageIndex >= 0 && (
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => setSelectedStageKey(null)}
            >
              <Text style={styles.filterChipText}>
                Stage: {ERM_STAGES[stageIndex].label}
              </Text>
              <X size={12} color={colors.primary} />
            </TouchableOpacity>
          )}

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <List size={14} color={viewMode === 'list' ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'timeline' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('timeline')}
            >
              <GanttChart size={14} color={viewMode === 'timeline' ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS as any}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => {
            const count = item === 'All' ? projects.length : countByStatus(item);
            const isSelected = activeTab === item;
            return (
              <TouchableOpacity
                style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                onPress={() => setActiveTab(item)}
              >
                <Text style={[styles.tabBtnText, isSelected && styles.tabBtnTextActive]}>
                  {item}
                </Text>
                <View style={[styles.tabBadge, isSelected && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {filteredProjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FolderKanban size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No projects found</Text>
          <Text style={styles.emptySub}>
            {search ? 'Try adjusting your search criteria.' : 'No projects matching the selected filter.'}
          </Text>
        </View>
      ) : viewMode === 'timeline' ? (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card
              style={styles.timelineCard}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.codeText}>{item.projectCode}</Text>
                <StatusBadge status={item.status || item.stageName} size="sm" />
              </View>
              <Text style={styles.projectTitle}>{item.title}</Text>
              <Text style={styles.clientText}>{item.clientName}</Text>

              <View style={styles.timelineStepsRow}>
                {ERM_STAGES.map((st, idx) => {
                  const stageNum = idx + 1;
                  const isDone = stageNum < (item.currentStage || 1);
                  const isCurrent = stageNum === (item.currentStage || 1);
                  return (
                    <View key={st.key} style={styles.timelineStepWrap}>
                      <View
                        style={[
                          styles.timelineDot,
                          isDone && styles.timelineDotDone,
                          isCurrent && styles.timelineDotCurrent,
                        ]}
                      >
                        {isDone ? (
                          <CheckCircle2 size={10} color={colors.white} />
                        ) : (
                          <Text
                            style={[
                              styles.timelineDotText,
                              isCurrent && styles.timelineDotTextCurrent,
                            ]}
                          >
                            {stageNum}
                          </Text>
                        )}
                      </View>
                      {idx < 6 && (
                        <View
                          style={[
                            styles.timelineConnector,
                            isDone && styles.timelineConnectorDone,
                          ]}
                        />
                      )}
                    </View>
                  );
                })}
              </View>

              <View style={styles.timelineNowAtRow}>
                <Clock size={12} color={colors.textMuted} />
                <Text style={styles.nowAtText}>
                  Now: {item.now?.label || item.stageName}
                </Text>
              </View>
            </Card>
          )}
        />
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const currentStage = item.currentStage || 1;
            const stageLabel = ERM_STAGES[Math.min(6, currentStage - 1)]?.label || item.stageName;
            const milestonesDone = (item.milestones || []).filter((m) => m.done).length;
            const totalMilestones = (item.milestones || []).length || 5;
            const progressPercent = Math.round((milestonesDone / totalMilestones) * 100);

            return (
              <Card
                style={styles.card}
                onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.codeWrap}>
                    <Text style={styles.codeText}>{item.projectCode}</Text>
                    <View style={styles.stageTag}>
                      <Text style={styles.stageTagText}>
                        Stage {currentStage} of 7 · {item.code || 'DMG'}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={item.status || item.stageName} size="sm" />
                </View>

                <Text style={styles.projectTitle}>{item.title}</Text>
                <View style={styles.clientSiteRow}>
                  <Text style={styles.clientName}>{item.clientName}</Text>
                  <Text style={styles.dotDivider}>•</Text>
                  <MapPin size={11} color={colors.textMuted} />
                  <Text style={styles.siteText} numberOfLines={1}>
                    {item.site || item.location}
                  </Text>
                </View>

                <View style={styles.nowAtRow}>
                  <Clock size={12} color={colors.primary} />
                  <Text style={styles.nowAtLabel}>Current:</Text>
                  <Text style={styles.nowAtValue} numberOfLines={1}>
                    {item.now?.label || stageLabel}
                  </Text>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressHeaderRow}>
                    <Text style={styles.progressLabel}>
                      Progress ({milestonesDone}/{totalMilestones} milestones)
                    </Text>
                    <Text style={styles.progressPercent}>{progressPercent}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.max(8, progressPercent))}%`,
                          backgroundColor: getStatusTone(item.status),
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.budgetCol}>
                    <Text style={styles.budgetLabel}>Budget</Text>
                    <Text style={styles.budgetVal}>
                      {formatCurrency(item.baselineBudget)}
                    </Text>
                  </View>

                  <View style={styles.teamCol}>
                    <Users size={12} color={colors.textMuted} />
                    <Text style={styles.teamText} numberOfLines={1}>
                      {item.team?.teamLead || item.team?.coordinator || 'Team Unassigned'}
                    </Text>
                  </View>

                  <View style={styles.actionCol}>
                    <Text style={styles.taskCountText}>
                      {(item.tasks || []).length} Tasks
                    </Text>
                    <ArrowRight size={14} color={colors.primary} />
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}

      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>New Exploration Block</Text>
                <Text style={styles.modalSubtitle}>Register Project into Stage 1: Allocation</Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label="Block / Project Title"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Zawar Lead-Zinc Extension Block"
            />

            <Input
              label="Mining Client"
              value={newClient}
              onChangeText={setNewClient}
              placeholder="e.g. Hindustan Zinc Ltd"
            />

            <Input
              label="Service Line"
              value={newService}
              onChangeText={setNewService}
              placeholder="e.g. Mineral Exploration & Resources"
            />

            <Input
              label="Site Location"
              value={newLocation}
              onChangeText={setNewLocation}
              placeholder="e.g. Udaipur, Rajasthan"
            />

            <Input
              label="Baseline Budget (INR)"
              value={newBudget}
              onChangeText={setNewBudget}
              keyboardType="numeric"
              placeholder="3500000"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setCreateModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Create Project"
                onPress={handleCreateProject}
                loading={submitting}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerAddBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
  },
  toolbar: {
    marginVertical: spacing.xs,
    gap: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    padding: 0,
  },
  viewSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  filterChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xs,
    padding: 2,
    marginLeft: 'auto',
  },
  viewToggleBtn: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 4,
    borderRadius: radius.xs - 2,
  },
  viewToggleBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabsWrap: {
    marginBottom: spacing.xs,
  },
  tabsContent: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeights.bold,
  },
  tabBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  tabBadgeActive: {
    backgroundColor: colors.white + '30',
  },
  tabBadgeText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    fontWeight: typography.fontWeights.semibold,
  },
  tabBadgeTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingBottom: spacing.huge,
  },
  card: {
    marginBottom: spacing.sm,
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  codeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  codeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  stageTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  stageTagText: {
    fontSize: typography.fontSizes.xxs,
    color: '#475569',
    fontWeight: typography.fontWeights.medium,
  },
  projectTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  clientSiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  clientName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
  clientText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  dotDivider: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
  },
  siteText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    flex: 1,
  },
  nowAtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginVertical: 4,
  },
  nowAtLabel: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
  },
  nowAtValue: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  progressContainer: {
    marginTop: 4,
    marginBottom: spacing.xs,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  progressLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  progressPercent: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: 2,
  },
  budgetCol: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: typography.fontSizes.xxs - 2,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  budgetVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  teamCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teamText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskCountText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  timelineCard: {
    marginBottom: spacing.sm,
  },
  timelineStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    justifyContent: 'space-between',
  },
  timelineStepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  timelineDotCurrent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  timelineDotText: {
    fontSize: typography.fontSizes.xxs - 2,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
  },
  timelineDotTextCurrent: {
    color: colors.white,
  },
  timelineConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderLight,
    marginHorizontal: 2,
  },
  timelineConnectorDone: {
    backgroundColor: colors.success,
  },
  timelineNowAtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nowAtText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalBtn: {
    flex: 1,
  },
});
