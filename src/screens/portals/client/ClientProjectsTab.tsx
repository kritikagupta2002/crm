import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  Search,
  X,
  Layers,
  MapPin,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { clientTheme } from './clientTheme';
import { Project } from '../../../types';

interface ClientProjectsTabProps {
  myProjects: Project[];
  filteredProjects: Project[];
  projectSearch: string;
  setProjectSearch: (v: string) => void;
  onOpenProjectDetail: (p: Project) => void;
}

export const ClientProjectsTab: React.FC<ClientProjectsTabProps> = ({
  myProjects,
  filteredProjects,
  projectSearch,
  setProjectSearch,
  onOpenProjectDetail,
}) => {
  const [filterStage, setFilterStage] = useState<'all' | 'progress' | 'approval' | 'completed'>('all');

  const displayedProjects = useMemo(() => {
    return filteredProjects.filter((p) => {
      const stage = p.currentStage || 1;
      if (filterStage === 'progress') return stage < 5;
      if (filterStage === 'approval') return stage === 5;
      if (filterStage === 'completed') return stage >= 6;
      return true;
    });
  }, [filteredProjects, filterStage]);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      {/* 1. SEARCH INPUT */}
      <View style={styles.searchBar}>
        <Search size={20} color={clientTheme.colors.navy} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects by name, code, service, site..."
          placeholderTextColor={clientTheme.colors.textTertiary}
          value={projectSearch}
          onChangeText={setProjectSearch}
        />
        {projectSearch.length > 0 && (
          <TouchableOpacity
            onPress={() => setProjectSearch('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={clientTheme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. FILTER CHIPS (HORIZONTAL SCROLL) */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[styles.filterChip, filterStage === 'all' && styles.filterChipActive]}
            onPress={() => setFilterStage('all')}
          >
            <Text style={[styles.filterChipText, filterStage === 'all' && styles.filterChipTextActive]}>
              All ({filteredProjects.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterStage === 'progress' && styles.filterChipActive]}
            onPress={() => setFilterStage('progress')}
          >
            <Text style={[styles.filterChipText, filterStage === 'progress' && styles.filterChipTextActive]}>
              In Progress
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterStage === 'approval' && styles.filterChipActive]}
            onPress={() => setFilterStage('approval')}
          >
            <Text style={[styles.filterChipText, filterStage === 'approval' && styles.filterChipTextActive]}>
              Stage 5 Approval
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterStage === 'completed' && styles.filterChipActive]}
            onPress={() => setFilterStage('completed')}
          >
            <Text style={[styles.filterChipText, filterStage === 'completed' && styles.filterChipTextActive]}>
              Completed / Billed
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 3. PROJECTS LIST */}
      {displayedProjects.length === 0 ? (
        <View style={styles.emptyCard}>
          <Layers size={44} color={clientTheme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No matching exploration projects</Text>
          <Text style={styles.emptySub}>
            Try adjusting your search query or switching the category filter above.
          </Text>
        </View>
      ) : (
        displayedProjects.map((proj) => {
          const currentStage = proj.currentStage || 1;
          const progressPercent = Math.min(100, Math.round((currentStage / 7) * 100));
          const isCompleted = currentStage >= 6;
          const isApprovalStage = currentStage === 5;

          return (
            <TouchableOpacity
              key={proj.id}
              style={styles.projectCard}
              activeOpacity={0.88}
              onPress={() => onOpenProjectDetail(proj)}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.codePill}>
                  <Text style={styles.codeText}>{proj.projectCode || proj.id}</Text>
                </View>
                <View
                  style={[
                    styles.stageBadge,
                    isApprovalStage && styles.stageBadgeApproval,
                    isCompleted && styles.stageBadgeDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.stageBadgeText,
                      isApprovalStage && styles.stageBadgeTextApproval,
                      isCompleted && styles.stageBadgeTextDone,
                    ]}
                  >
                    Stage {currentStage}: {
                      ['', 'Allocation', 'Planning', 'Execution', 'Submission', 'Client Approval', 'Invoicing', 'Closure'][currentStage]
                    }
                  </Text>
                </View>
              </View>

              {/* Title & Service */}
              <Text style={styles.projectTitle}>{proj.title}</Text>
              <Text style={styles.serviceSubText}>
                {proj.service || 'Mineral Exploration & Core Drilling'}
              </Text>

              {/* Location */}
              <View style={styles.locationRow}>
                <MapPin size={15} color={clientTheme.colors.textMuted} />
                <Text style={styles.locationText}>{proj.location || 'Rajasthan Concession'}</Text>
              </View>

              {/* 7-Stage Progress Bar */}
              <View style={styles.progSection}>
                <View style={styles.progLabelRow}>
                  <Text style={styles.progLabel}>Lifecycle Progress</Text>
                  <Text style={styles.progValue}>{progressPercent}% (Stage {currentStage}/7)</Text>
                </View>
                <View style={styles.progTrack}>
                  <View style={[styles.progFill, { width: `${progressPercent}%` }]} />
                </View>
              </View>

              {/* Financial & Timeline Metrics */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>BUDGET</Text>
                  <Text style={styles.metricVal}>
                    ₹{((proj.baselineBudget || 0) / 100000).toFixed(1)}L
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>DELIVERABLES</Text>
                  <Text style={styles.metricVal}>
                    {(proj.deliverables || []).length} reports
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>TARGET DATE</Text>
                  <Text style={styles.metricVal}>
                    {proj.dueOn || proj.endDate || '2026-11-20'}
                  </Text>
                </View>
              </View>

              {/* Card Primary Action Button */}
              <View style={styles.cardActionBtn}>
                <Text style={styles.cardActionBtnText}>Inspect Project Details</Text>
                <ArrowRight size={17} color={clientTheme.colors.navy} />
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: clientTheme.colors.sandstone,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
    gap: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: clientTheme.colors.surface,
    height: 52,
    borderRadius: clientTheme.radius.md,
    paddingHorizontal: 16,
    borderWidth: 1.2,
    borderColor: clientTheme.colors.sandstoneBorderDark,
    gap: 10,
    ...clientTheme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: clientTheme.typography.bodyMd,
    color: clientTheme.colors.graphite,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: clientTheme.radius.full,
    backgroundColor: clientTheme.colors.surface,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
  },
  filterChipActive: {
    backgroundColor: clientTheme.colors.navy,
    borderColor: clientTheme.colors.navy,
  },
  filterChipText: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '600',
    color: clientTheme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    marginTop: 12,
  },
  emptySub: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 280,
  },
  projectCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 18,
    borderWidth: 1.2,
    borderColor: clientTheme.colors.sandstoneBorder,
    ...clientTheme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  codePill: {
    backgroundColor: clientTheme.colors.navySubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: clientTheme.radius.sm,
  },
  codeText: {
    fontSize: clientTheme.typography.badge,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  stageBadge: {
    backgroundColor: clientTheme.colors.tealSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: clientTheme.radius.sm,
  },
  stageBadgeApproval: {
    backgroundColor: clientTheme.colors.goldSubtle,
  },
  stageBadgeDone: {
    backgroundColor: clientTheme.colors.emeraldSubtle,
  },
  stageBadgeText: {
    fontSize: clientTheme.typography.badge,
    fontWeight: '700',
    color: clientTheme.colors.tealDark,
  },
  stageBadgeTextApproval: {
    color: clientTheme.colors.goldDark,
  },
  stageBadgeTextDone: {
    color: clientTheme.colors.emeraldDark,
  },
  projectTitle: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    lineHeight: 24,
    marginBottom: 4,
  },
  serviceSubText: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  locationText: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textMuted,
    fontWeight: '500',
  },
  progSection: {
    marginBottom: 14,
  },
  progLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progLabel: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textSecondary,
    fontWeight: '600',
  },
  progValue: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '800',
    color: clientTheme.colors.tealDark,
  },
  progTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: clientTheme.colors.navySubtle,
    overflow: 'hidden',
  },
  progFill: {
    height: '100%',
    backgroundColor: clientTheme.colors.teal,
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: clientTheme.colors.sandstone,
    padding: 12,
    borderRadius: clientTheme.radius.md,
    marginBottom: 14,
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: clientTheme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: clientTheme.radius.md,
    backgroundColor: clientTheme.colors.navySubtle,
  },
  cardActionBtnText: {
    fontSize: clientTheme.typography.bodyMd,
    fontWeight: '700',
    color: clientTheme.colors.navy,
  },
});
