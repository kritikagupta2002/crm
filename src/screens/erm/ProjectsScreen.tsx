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
      noPadding
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
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={18} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search block, client, authority, site..."
              placeholderTextColor="#94a3b8"
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <List size={18} color={viewMode === 'list' ? colors.primary : '#64748b'} strokeWidth={2.3} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[styles.viewToggleBtn, viewMode === 'timeline' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('timeline')}
            >
              <GanttChart size={18} color={viewMode === 'timeline' ? colors.primary : '#64748b'} strokeWidth={2.3} />
            </TouchableOpacity>
          </View>
        </View>

        {stageIndex >= 0 && (
          <View style={styles.activeFiltersRow}>
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => setSelectedStageKey(null)}
            >
              <Text style={styles.filterChipText}>
                Stage: {ERM_STAGES[stageIndex].label}
              </Text>
              <X size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
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
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
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

      <Modal statusBarTranslucent
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
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: spacing.xs,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    ...shadows.xs,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricDivider: {
    width: 1.2,
    height: 38,
    backgroundColor: '#e2e8f0',
  },
  toolbar: {
    marginVertical: 8,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
  },
  viewToggle: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
  },
  viewToggleBtn: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  viewToggleBtnActive: {
    backgroundColor: '#ffffff',
    ...shadows.xs,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 12.5,
    color: colors.primary,
    fontWeight: '700',
  },
  tabsWrap: {
    marginBottom: 8,
  },
  tabsContent: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 16,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '800',
  },
  tabBadgeTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: spacing.huge,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: spacing.md,
    ...shadows.xs,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  stageTag: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stageTagText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  projectTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 21,
    marginBottom: 4,
  },
  clientSiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  clientName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  clientText: {
    fontSize: 12.5,
    color: '#334155',
  },
  dotDivider: {
    color: '#94a3b8',
    fontSize: 12,
  },
  siteText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  nowAtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginVertical: 6,
  },
  nowAtLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  nowAtValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 10,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  progressBarBg: {
    height: 7,
    backgroundColor: '#f1f5f9',
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
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 4,
  },
  budgetCol: {
    flex: 1.2,
  },
  budgetLabel: {
    fontSize: 9.5,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  budgetVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  teamCol: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  teamText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '500',
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  taskCountText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
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
