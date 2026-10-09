import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Map,
  Layers,
  FlaskConical,
  Pickaxe,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';

interface FieldDatabaseHomeScreenProps {
  navigation: any;
}

export const FieldDatabaseHomeScreen: React.FC<FieldDatabaseHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { projects } = useCrm();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'p-1');
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const fieldModules = [
    {
      id: 'geo_mapping',
      title: 'Geological Mapping',
      subtitle: 'Lithology, strike/dip & formation outcrop logs',
      icon: <Map size={20} color="#9a3412" />,
      badge: '1:5000',
      onPress: () => navigation.navigate('GeologicalMapping'),
    },
    {
      id: 'trench_mapping',
      title: 'Trench Mapping',
      subtitle: 'Pit profile, vein contacts & channel widths',
      icon: <Pickaxe size={20} color="#9a3412" />,
      badge: 'Active',
      onPress: () => navigation.navigate('GeologicalMapping'),
    },
    {
      id: 'soil_sampling',
      title: 'Soil Sampling',
      subtitle: 'Geochemical grid collection & B-horizon logs',
      icon: <FlaskConical size={20} color="#9a3412" />,
      badge: '320 Pts',
      onPress: () => navigation.navigate('SamplingActivity', { type: 'soil' }),
    },
    {
      id: 'stream_sampling',
      title: 'Stream Sediment Sampling',
      subtitle: 'Drainage catchment basin reconnaissance',
      icon: <Layers size={20} color="#9a3412" />,
      badge: '48 Pts',
      onPress: () => navigation.navigate('SamplingActivity', { type: 'stream' }),
    },
    {
      id: 'channel_sampling',
      title: 'Channel Sampling',
      subtitle: 'Mineralized bench & trench chip samples',
      icon: <Pickaxe size={20} color="#9a3412" />,
      badge: '94 Pts',
      onPress: () => navigation.navigate('SamplingActivity', { type: 'channel' }),
    },
    {
      id: 'core_dpr',
      title: 'Core Drilling DPR',
      subtitle: 'Diamond drill daily progress, run depth & RQD',
      icon: <Compass size={20} color="#9a3412" />,
      badge: 'BH-04 Live',
      onPress: () => navigation.navigate('DrillingDpr', { type: 'core' }),
    },
    {
      id: 'core_logging',
      title: 'Drill Core Logging',
      subtitle: 'Stratigraphy, mineral zone & core photo archive',
      icon: <Layers size={20} color="#9a3412" />,
      badge: '1,420 M',
      onPress: () => navigation.navigate('DrillingDpr', { type: 'core' }),
    },
    {
      id: 'non_core_dpr',
      title: 'Non-Core DPR',
      subtitle: 'Reverse circulation / DTH drilling logs',
      icon: <Compass size={20} color="#9a3412" />,
      badge: 'Standby',
      onPress: () => navigation.navigate('DrillingDpr', { type: 'non-core' }),
    },
    {
      id: 'dispatch_db',
      title: 'Dispatch Database',
      subtitle: 'Chain of custody to NABL accredited assay labs',
      icon: <Send size={20} color="#9a3412" />,
      badge: 'Batch #14',
      onPress: () => navigation.navigate('DispatchDatabase'),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.2} />
          <Text style={styles.headerTitle}>Field Database</Text>
        </TouchableOpacity>
        <View style={styles.geologyBadge}>
          <Text style={styles.geologyBadgeText}>GEOLOGY OS</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Exploration Block Selector & Field Telemetry Hero */}
        <View style={styles.projectContextCard}>
          <View style={styles.telemetryTopRow}>
            <View>
              <Text style={styles.contextCardLabel}>ACTIVE EXPLORATION BLOCK</Text>
              <Text style={styles.contextProjectName}>
                {activeProject?.title || 'Bhilwara Lead-Zinc Exploration Block'}
              </Text>
            </View>
            <View style={styles.telemetryLiveBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.livePulseText}>LIVE RIGS</Text>
            </View>
          </View>

          <View style={styles.contextMetaRow}>
            <Text style={styles.contextMetaText}>
              Client: {activeProject?.clientName || 'Hindustan Zinc Ltd'}
            </Text>
            <Text style={styles.contextMetaDot}>•</Text>
            <Text style={styles.contextMetaText}>
              Location: {activeProject?.location || 'Rajasthan'}
            </Text>
          </View>

          {/* Geological Telemetry Metrics */}
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryItemLabel}>Active Rigs</Text>
              <Text style={styles.telemetryItemValue}>4 Rigs</Text>
              <Text style={styles.telemetryItemSub}>BH-01 to BH-04</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryItemLabel}>Core Drilled</Text>
              <Text style={styles.telemetryItemValue}>1,420 M</Text>
              <Text style={styles.telemetryItemSub}>71% of 2,000 M</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryItemLabel}>Samples Logged</Text>
              <Text style={styles.telemetryItemValue}>462 Pts</Text>
              <Text style={styles.telemetryItemSub}>Soil & Channel</Text>
            </View>
          </View>
        </View>

        {/* Quick Field Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('GeologicalMapping')}
            activeOpacity={0.8}
          >
            <Map size={16} color="#c2410c" />
            <Text style={styles.quickActionText}>+ Geological Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('SamplingActivity', { type: 'soil' })}
            activeOpacity={0.8}
          >
            <FlaskConical size={16} color="#c2410c" />
            <Text style={styles.quickActionText}>+ Soil Sample</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('DrillingDpr', { type: 'core' })}
            activeOpacity={0.8}
          >
            <Compass size={16} color="#c2410c" />
            <Text style={styles.quickActionText}>+ Core DPR</Text>
          </TouchableOpacity>
        </View>

        {/* Geological Field Workflows List Header */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Field Activity Modules</Text>
          <Text style={styles.sectionSubtitle}>Standardized Logging, Drilling & Dispatch OS</Text>
        </View>

        {/* Expansive Standalone Cards */}
        <View style={styles.modulesContainer}>
          {fieldModules.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={item.onPress}
              style={styles.expansiveModuleCard}
            >
              <View style={styles.moduleCardTop}>
                <View style={styles.iconBox}>{item.icon}</View>

                <View style={styles.infoCol}>
                  <View style={styles.titleLine}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.badge && (
                      <View style={styles.badgePill}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                </View>

                <View style={styles.arrowCircle}>
                  <ChevronRight size={15} color="#64748b" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.xs,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  geologyBadge: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  geologyBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#9a3412',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  projectContextCard: {
    backgroundColor: '#0f172a',
    borderRadius: radius.xl,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  telemetryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  contextCardLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  contextProjectName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  telemetryLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(234, 88, 12, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.4)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ea580c',
  },
  livePulseText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fed7aa',
    letterSpacing: 0.4,
  },
  contextMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  contextMetaText: {
    fontSize: 11.5,
    color: '#94a3b8',
  },
  contextMetaDot: {
    color: '#64748b',
  },
  telemetryGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  telemetryItemLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 2,
  },
  telemetryItemValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 1,
  },
  telemetryItemSub: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#ea580c',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.xs,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionTitleRow: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  modulesContainer: {
    gap: 10,
  },
  expansiveModuleCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.xs,
  },
  moduleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  infoCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  badgePill: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  badgeText: {
    color: '#9a3412',
    fontSize: 10,
    fontWeight: '700',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
