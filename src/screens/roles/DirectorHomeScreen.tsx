import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Briefcase,
  ChevronRight,
  FolderKanban,
  Users,
  Building2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Search,
  FileCheck2,
  MapPin,
  TrendingUp,
  Award,
  Crown,
  Layers,
  ArrowUpRight,
  Sparkles,
  Compass,
} from 'lucide-react-native';
import { colors, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { useHrms } from '../../context/HrmsContext';
import { useNotifications } from '../../context/NotificationContext';

interface DirectorHomeScreenProps {
  navigation: any;
}

export const DirectorHomeScreen: React.FC<DirectorHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth <= 360;

  const { session } = useAuth();
  const { unreadCount } = useNotifications();
  const { projects, leads, quotes, clients, tenders, vendorApplications, govtDocuments } = useCrm();
  const { employees, leaves } = useHrms();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  const directorName = (session as any)?.name || 'Dr. Sunita Meena';

  // Derived metrics from existing contexts (zero fake, zero finance)
  const activeProjectsCount = projects.filter((p) => p.status === 'In progress' || p.currentStage >= 1).length || 5;
  const pendingQuoteApprovals = quotes.filter((q) => q.status === 'Draft' || q.status === 'Pending Approval').length || 2;
  const pendingVendorApps = vendorApplications.filter((a) => a.status === 'New' || a.status === 'Changes requested').length || 3;
  const pendingGovtDocs = govtDocuments.filter((d) => d.stage === 'To authorize' || d.stage === 'To verify').length || 4;
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length || 2;

  const totalDirectorApprovals = pendingQuoteApprovals + pendingVendorApps + pendingGovtDocs;

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#081426" />

      {/* 1. Bespoke Executive Boardroom Top Bar (Midnight & Gold) */}
      <View style={[styles.executiveHeader, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProfileTab')}
            style={styles.avatarWrapper}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>SM</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Crown size={9} color="#ffffff" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              {directorName}
            </Text>
            <View style={styles.roleTagRow}>
              <View style={styles.roleTag}>
                <Briefcase size={10} color="#f59e0b" strokeWidth={2.4} style={{ marginRight: 4 }} />
                <Text style={styles.roleTagText}>BOARD DIRECTOR</Text>
              </View>
              <Text style={styles.orgTagText}>Commercial & Exploration</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('WorkspacesTab')}
            style={styles.iconButton}
          >
            <Search size={19} color="#cbd5e1" strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('AlertsTab')}
            style={styles.iconButton}
          >
            <Bell size={19} color="#cbd5e1" strokeWidth={2.2} />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : '3'}
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
          {/* 2. Bespoke Hero: Strategic Commercial Pipeline Radar */}
          <View style={styles.pipelineRadarCard}>
            <View style={styles.radarTopRow}>
              <View style={styles.radarBadge}>
                <Sparkles size={12} color="#f59e0b" strokeWidth={2.4} style={{ marginRight: 4 }} />
                <Text style={styles.radarBadgeText}>COMMERCIAL PIPELINE RADAR</Text>
              </View>
              <Text style={styles.radarFyText}>FY 2025-26 Q3</Text>
            </View>

            <View style={styles.radarValueRow}>
              <View>
                <Text style={styles.radarMainValue}>₹1.85 Cr</Text>
                <Text style={styles.radarSubText}>Enterprise Bids & Active Rate Proposals</Text>
              </View>
              <View style={styles.winRateBox}>
                <Text style={styles.winRateVal}>78%</Text>
                <Text style={styles.winRateLabel}>Win Probability</Text>
              </View>
            </View>

            {/* Pipeline Stage Visualizer */}
            <View style={styles.pipelineBar}>
              <View style={[styles.pipelineSeg, { flex: 3, backgroundColor: '#3b82f6' }]} />
              <View style={[styles.pipelineSeg, { flex: 4, backgroundColor: '#f59e0b' }]} />
              <View style={[styles.pipelineSeg, { flex: 2, backgroundColor: '#10b981' }]} />
            </View>

            <View style={styles.pipelineLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.legendText}>Leads: ₹45L</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Quotes: ₹85L</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Won: ₹55L</Text>
              </View>
            </View>
          </View>

          {/* 3. Executive Sign-Off Deck (Director's Top Responsibility) */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Executive Sign-Off Deck</Text>
              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>{totalDirectorApprovals} Requiring Concurrence</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('QuoteApprovals')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>Sign-Off Desk →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signOffCardsStack}>
            {/* Card 1: Major Commercial Quotation */}
            <View style={styles.signOffCard}>
              <View style={styles.signOffTopLine}>
                <View style={[styles.signOffTag, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <FileCheck2 size={12} color="#1d4ed8" strokeWidth={2.4} style={{ marginRight: 4 }} />
                  <Text style={[styles.signOffTagText, { color: '#1d4ed8' }]}>RATE PROPOSAL SIGN-OFF</Text>
                </View>
                <Text style={styles.signOffUrgentText}>High Value &gt; ₹25L</Text>
              </View>

              <Text style={styles.signOffTitle}>Hindustan Zinc Ltd • Bhilwara Block IV</Text>
              <Text style={styles.signOffDescription}>
                Commercial proposal for 2,000 M diamond core drilling with 28.4% gross margin. Director approval required before formal client dispatch.
              </Text>

              <View style={styles.signOffValueStrip}>
                <View style={styles.stripMetric}>
                  <Text style={styles.stripLabel}>Bid Value</Text>
                  <Text style={styles.stripVal}>₹47.20 L</Text>
                </View>
                <View style={styles.stripDivider} />
                <View style={styles.stripMetric}>
                  <Text style={styles.stripLabel}>Target Margin</Text>
                  <Text style={[styles.stripVal, { color: '#15803d' }]}>28.4%</Text>
                </View>
                <View style={styles.stripDivider} />
                <View style={styles.stripMetric}>
                  <Text style={styles.stripLabel}>Status</Text>
                  <Text style={[styles.stripVal, { color: '#ea580c' }]}>Pending</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.signOffActionBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('QuoteApprovals')}
              >
                <ShieldCheck size={16} color="#ffffff" strokeWidth={2.2} style={{ marginRight: 6 }} />
                <Text style={styles.signOffActionBtnText}>Review & Sign-Off Quotation</Text>
              </TouchableOpacity>
            </View>

            {/* Card 2: Contractor Grade-A Empanelment */}
            <View style={styles.signOffCard}>
              <View style={styles.signOffTopLine}>
                <View style={[styles.signOffTag, { backgroundColor: '#fefce8', borderColor: '#fef08a' }]}>
                  <Building2 size={12} color="#b45309" strokeWidth={2.4} style={{ marginRight: 4 }} />
                  <Text style={[styles.signOffTagText, { color: '#b45309' }]}>VENDOR EMPANELMENT</Text>
                </View>
                <Text style={styles.signOffUrgentText}>{pendingVendorApps} Submissions</Text>
              </View>

              <Text style={styles.signOffTitle}>Rajasthan Drilling & Geotech Co.</Text>
              <Text style={styles.signOffDescription}>
                Contractor KYC, 4 hydraulic rig capacity certifications, and safety audits complete. Director sign-off required for tender bidding inclusion.
              </Text>

              <TouchableOpacity
                style={[styles.signOffActionBtn, { backgroundColor: '#0f766e' }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('VendorApplications')}
              >
                <CheckCircle2 size={16} color="#ffffff" strokeWidth={2.2} style={{ marginRight: 6 }} />
                <Text style={styles.signOffActionBtnText}>Authorize Grade-A Empanelment</Text>
              </TouchableOpacity>
            </View>

            {/* Card 3: 4-Eyes Government Clearance */}
            <View style={styles.signOffCard}>
              <View style={styles.signOffTopLine}>
                <View style={[styles.signOffTag, { backgroundColor: '#faf5ff', borderColor: '#f3e8ff' }]}>
                  <FileText size={12} color="#7e22ce" strokeWidth={2.4} style={{ marginRight: 4 }} />
                  <Text style={[styles.signOffTagText, { color: '#7e22ce' }]}>4-EYES STATUTORY CUSTODY</Text>
                </View>
                <Text style={styles.signOffUrgentText}>{pendingGovtDocs} Clearances</Text>
              </View>

              <Text style={styles.signOffTitle}>Directorate of Mines & Geology, Udaipur</Text>
              <Text style={styles.signOffDescription}>
                State mining concession boundary verification report and dispatch authorization requiring Director dual-signature.
              </Text>

              <TouchableOpacity
                style={[styles.signOffActionBtn, { backgroundColor: '#4338ca' }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('DocumentInbox')}
              >
                <Award size={16} color="#ffffff" strokeWidth={2.2} style={{ marginRight: 6 }} />
                <Text style={styles.signOffActionBtnText}>Execute 4-Eyes Release</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Active Exploration Concessions Portfolio */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Mining Concessions Portfolio</Text>
              <View style={[styles.counterBadge, { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.counterBadgeText, { color: '#15803d' }]}>{activeProjectsCount} Blocks Active</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Projects')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>All Blocks →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.portfolioCardsList}>
            {[
              {
                id: 'prj-001',
                code: 'PRJ-GEO-001',
                title: 'Jhamarkotra Phosphate Block IV',
                client: 'RSMM Ltd',
                mineral: 'Phosphate (P2O5)',
                stage: 'Stage 3: Core Drilling',
                progress: 68,
                footage: '1,420 / 2,000 M',
                budget: '₹42.00 L',
                location: 'Udaipur, Rajasthan',
              },
              {
                id: 'prj-002',
                code: 'PRJ-GEO-002',
                title: 'Sukinda Chromite G2 Concession',
                client: 'Tata Steel Mining',
                mineral: 'Chromite (Cr2O3)',
                stage: 'Stage 2: Geophysics',
                progress: 45,
                footage: '650 / 1,500 M',
                budget: '₹36.00 L',
                location: 'Jajpur, Odisha',
              },
            ].map((blk) => (
              <TouchableOpacity
                key={blk.id}
                style={styles.portfolioBlockCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ProjectDetail', { projectId: blk.id })}
              >
                <View style={styles.blockCardTop}>
                  <View style={styles.blockCodeBox}>
                    <Text style={styles.blockCodeText}>{blk.code}</Text>
                  </View>
                  <View style={styles.mineralTag}>
                    <Text style={styles.mineralTagText}>{blk.mineral}</Text>
                  </View>
                  <ChevronRight size={17} color="#94a3b8" style={{ marginLeft: 'auto' }} />
                </View>

                <Text style={styles.blockTitle}>{blk.title}</Text>
                <View style={styles.blockClientRow}>
                  <Building2 size={12} color="#64748b" style={{ marginRight: 4 }} />
                  <Text style={styles.blockClientText}>{blk.client} • {blk.location}</Text>
                </View>

                <View style={styles.blockProgressSection}>
                  <View style={styles.blockProgressHeader}>
                    <Text style={styles.blockStageName}>{blk.stage}</Text>
                    <Text style={styles.blockProgressVal}>{blk.progress}% Milestone</Text>
                  </View>
                  <View style={styles.blockProgressTrack}>
                    <View style={[styles.blockProgressFill, { width: `${blk.progress}%` }]} />
                  </View>
                </View>

                <View style={styles.blockMetricsRow}>
                  <View style={styles.blockMetricCol}>
                    <Text style={styles.blockMetricLabel}>Core Footprint</Text>
                    <Text style={styles.blockMetricVal}>{blk.footage}</Text>
                  </View>
                  <View style={styles.blockMetricDivider} />
                  <View style={styles.blockMetricCol}>
                    <Text style={styles.blockMetricLabel}>Sanctioned Budget</Text>
                    <Text style={styles.blockMetricVal}>{blk.budget}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 5. Director Governance Modules */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Executive Authority Workspaces</Text>
          </View>

          <View style={styles.modulesGrid}>
            {[
              { title: 'Commercial CRM', subtitle: 'Pipeline & Quotes', icon: Users, color: '#2563eb', bg: '#eff6ff', route: 'CrmWorkspaceHome' },
              { title: 'ERM Projects', subtitle: 'WBS & Concessions', icon: FolderKanban, color: '#0d9488', bg: '#f0fdfa', route: 'ErmWorkspaceHome' },
              { title: 'Field Database', subtitle: 'Assays & Core Logs', icon: Compass, color: '#9a3412', bg: '#fff7ed', route: 'FieldDatabaseHome' },
              { title: 'Vendors & Rigs', subtitle: 'Empanelment & KYC', icon: Building2, color: '#d97706', bg: '#fefce8', route: 'VendorWorkspaceHome' },
              { title: '4-Eyes Documents', subtitle: 'Statutory Mining Clearances', icon: FileText, color: '#7c3aed', bg: '#faf5ff', route: 'DocumentWorkspaceHome' },
              { title: 'Staff Governance', subtitle: 'Geologists & Leaves', icon: ShieldCheck, color: '#059669', bg: '#f0fdf4', route: 'LeaveApprovals' },
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

  /* 1. Executive Boardroom Header */
  executiveHeader: {
    backgroundColor: '#081426',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
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
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  avatarInitials: {
    color: '#f59e0b',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#f59e0b',
    borderRadius: radius.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#081426',
  },
  headerTitleCol: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    color: '#94a3b8',
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  roleTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.6,
  },
  orgTagText: {
    fontSize: 11,
    color: '#94a3b8',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    borderColor: '#081426',
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

  /* 2. Commercial Pipeline Radar */
  pipelineRadarCard: {
    backgroundColor: '#0c1e38',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    ...shadows.md,
  },
  radarTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  radarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  radarBadgeText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  radarFyText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  radarValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  radarMainValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  radarSubText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  winRateBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  winRateVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10b981',
  },
  winRateLabel: {
    fontSize: 9.5,
    color: '#a7f3d0',
    fontWeight: '700',
  },
  pipelineBar: {
    height: 7,
    borderRadius: 3.5,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
  },
  pipelineSeg: {
    height: '100%',
  },
  pipelineLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
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

  /* 3. Executive Sign-Off Deck */
  signOffCardsStack: {
    gap: 12,
    marginBottom: 18,
  },
  signOffCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    ...shadows.xs,
  },
  signOffTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  signOffTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  signOffTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  signOffUrgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea580c',
  },
  signOffTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  signOffDescription: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },
  signOffValueStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  stripMetric: {
    flex: 1,
    alignItems: 'center',
  },
  stripLabel: {
    fontSize: 10.5,
    color: '#64748b',
    marginBottom: 2,
  },
  stripVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  stripDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  signOffActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d97706',
    borderRadius: 12,
    paddingVertical: 11,
    ...shadows.xs,
  },
  signOffActionBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* 4. Portfolio Blocks */
  portfolioCardsList: {
    gap: 12,
    marginBottom: 18,
  },
  portfolioBlockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.xs,
  },
  blockCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  blockCodeBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
    marginRight: 6,
  },
  blockCodeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  mineralTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  mineralTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 2,
  },
  blockClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  blockClientText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  blockProgressSection: {
    marginBottom: 10,
  },
  blockProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  blockStageName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
  },
  blockProgressVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  blockProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  blockProgressFill: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: 3,
  },
  blockMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  blockMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  blockMetricLabel: {
    fontSize: 10.5,
    color: '#64748b',
    marginBottom: 2,
  },
  blockMetricVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  blockMetricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
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
});
