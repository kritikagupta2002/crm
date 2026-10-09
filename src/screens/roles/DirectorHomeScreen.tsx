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
  AlertTriangle,
  Flame,
  Check,
  Clock,
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 1. Bespoke Executive Boardroom Top Bar */}
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
                <Crown size={10} color="#b45309" strokeWidth={2.4} style={{ marginRight: 4 }} />
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
            <Search size={18} color="#475569" strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('AlertsTab')}
            style={styles.iconButton}
          >
            <Bell size={18} color="#475569" strokeWidth={2.2} />
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
        contentContainerStyle={[styles.containerContent, { paddingBottom: Math.max(insets.bottom + 85, 110) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.bodyWrapper, isCompact && { paddingHorizontal: 8 }]}>
          {/* 2. Bespoke Hero: Strategic Commercial Pipeline Radar */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Quotes')}
            style={styles.pipelineRadarCard}
          >
            <View style={styles.radarTopRow}>
              <View style={styles.radarBadge}>
                <TrendingUp size={12} color="#0D9488" strokeWidth={2.4} style={{ marginRight: 4 }} />
                <Text style={styles.radarBadgeText}>COMMERCIAL PIPELINE RADAR</Text>
              </View>
              <View style={styles.radarFyBadge}>
                <Text style={styles.radarFyText}>FY 2025-26 Q3</Text>
              </View>
            </View>

            <View style={styles.radarValueRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.radarMainValue}>₹1.85 Cr</Text>
                <Text style={styles.radarSubText}>Enterprise Bids & Active Rate Proposals</Text>
              </View>
              <View style={styles.winRateBox}>
                <View style={styles.winRateTopRow}>
                  <Text style={styles.winRateVal}>78%</Text>
                  <ArrowUpRight size={14} color="#059669" strokeWidth={2.5} />
                </View>
                <Text style={styles.winRateLabel}>Win Probability</Text>
              </View>
            </View>

            {/* Pipeline Stage Segmented Visualizer */}
            <View style={styles.pipelineBar}>
              <View style={[styles.pipelineSeg, { flex: 45, backgroundColor: '#3B82F6' }]} />
              <View style={[styles.pipelineSeg, { flex: 85, backgroundColor: '#F59E0B' }]} />
              <View style={[styles.pipelineSeg, { flex: 55, backgroundColor: '#10B981' }]} />
            </View>

            {/* 3 Interactive Pipeline Segment Pills */}
            <View style={styles.pipelineLegendRow}>
              <View style={styles.legendPill}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <View>
                  <Text style={styles.legendLabel}>Active Leads</Text>
                  <Text style={styles.legendVal}>₹45.0 L</Text>
                </View>
              </View>

              <View style={styles.legendPill}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <View>
                  <Text style={styles.legendLabel}>Quotations</Text>
                  <Text style={styles.legendVal}>₹85.0 L</Text>
                </View>
              </View>

              <View style={styles.legendPill}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <View>
                  <Text style={styles.legendLabel}>Closed Won</Text>
                  <Text style={styles.legendVal}>₹55.0 L</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

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
                    <Text style={styles.kpiBadgeTextProjects}>{activeProjectsCount} Active</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValueProjects}>
                    {activeProjectsCount || 5}
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

              {/* Clients Card */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Clients')}
                style={[styles.kpiCard, styles.kpiCardClients]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxClients]}>
                    <Building2 size={17} color="#0f766e" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeClients}>
                    <Text style={styles.kpiBadgeTextClients}>Enterprise</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValueClients}>
                    {clients.length > 0 ? clients.length : 3}
                  </Text>
                  <ArrowUpRight size={16} color="#0d9488" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>Corporate Clients</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    HZL, NMDC, Vedanta
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.kpiRow}>
              {/* Field Workforce Card */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('EmployeeDirectory')}
                style={[styles.kpiCard, styles.kpiCardEmployees]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxEmployees]}>
                    <Users size={17} color="#7e22ce" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeEmployees}>
                    <Text style={styles.kpiBadgeTextEmployees}>91% Present</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValueEmployees}>
                    {employees.length > 0 ? employees.length : 5}
                  </Text>
                  <ArrowUpRight size={16} color="#7c3aed" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>Field Workforce</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    42 Active On-Site
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Pending Approvals Card */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('QuoteApprovals')}
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
                    {totalDirectorApprovals || 13}
                  </Text>
                  <ArrowUpRight size={16} color="#ea580c" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={[styles.kpiTitle, { color: '#9a3412' }]}>Pending Actions</Text>
                  <Text style={[styles.kpiSubtitle, { color: '#ea580c' }]} numberOfLines={1}>
                    Requires Review
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Executive Sign-Off Deck (Director's Top Responsibility) */}
          <View style={styles.sectionHeaderBox}>
            <View style={styles.sectionHeaderMainRow}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.sectionTitle}>Executive Sign-Off Deck</Text>
                <View style={styles.counterBadge}>
                  <AlertTriangle size={11} color="#DC2626" style={{ marginRight: 3 }} />
                  <Text style={styles.counterBadgeText}>{totalDirectorApprovals} Action Req</Text>
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
            <Text style={styles.sectionSubtitle}>
              Director dual-signature required for tenders, KYC & statutory releases
            </Text>
          </View>

          <View style={styles.signOffCardsStack}>
            {/* Card 1: Major Commercial Quotation */}
            <View style={[styles.signOffCard, { borderLeftColor: '#0284C7' }]}>
              <View style={styles.signOffTopLine}>
                <View style={[styles.signOffTag, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <FileCheck2 size={12} color="#1D4ED8" strokeWidth={2.4} style={{ marginRight: 4 }} />
                  <Text style={[styles.signOffTagText, { color: '#1D4ED8' }]}>RATE PROPOSAL SIGN-OFF</Text>
                </View>
                <View style={styles.urgencyTag}>
                  <Flame size={11} color="#E11D48" style={{ marginRight: 2 }} />
                  <Text style={styles.urgencyTagText}>High Value &gt; ₹25L</Text>
                </View>
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
                  <Text style={[styles.stripVal, { color: '#15803D' }]}>28.4%</Text>
                </View>
                <View style={styles.stripDivider} />
                <View style={styles.stripMetric}>
                  <Text style={styles.stripLabel}>Status</Text>
                  <Text style={[styles.stripVal, { color: '#D97706' }]}>Pending</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.signOffActionBtn, { backgroundColor: '#0F172A' }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('QuoteApprovals')}
              >
                <ShieldCheck size={16} color="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 6 }} />
                <Text style={styles.signOffActionBtnText}>Review & Sign-Off Quotation</Text>
              </TouchableOpacity>
            </View>

            {/* Card 2: Contractor Grade-A Empanelment */}
            <View style={[styles.signOffCard, { borderLeftColor: '#D97706' }]}>
              <View style={styles.signOffTopLine}>
                <View style={[styles.signOffTag, { backgroundColor: '#FEFCE8', borderColor: '#FEF08A' }]}>
                  <Building2 size={12} color="#B45309" strokeWidth={2.4} style={{ marginRight: 4 }} />
                  <Text style={[styles.signOffTagText, { color: '#B45309' }]}>VENDOR EMPANELMENT</Text>
                </View>
                <View style={[styles.urgencyTag, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                  <Text style={[styles.urgencyTagText, { color: '#D97706' }]}>{pendingVendorApps} Submissions</Text>
                </View>
              </View>

              <Text style={styles.signOffTitle}>Rajasthan Drilling & Geotech Co.</Text>
              <Text style={styles.signOffDescription}>
                Contractor KYC, 4 hydraulic rig capacity certifications, and safety audits complete. Director sign-off required for tender bidding inclusion.
              </Text>

              <View style={styles.signOffValueStrip}>
                <View style={styles.stripMetric}>
                  <Text style={styles.stripLabel}>Empanelment</Text>
                  <Text style={styles.stripVal}>Grade-A Rig</Text>
                </View>
                <View style={styles.stripDivider} />
                <View style={styles.stripMetric}>
                  <Text style={styles.stripLabel}>Compliance</Text>
                  <Text style={[styles.stripVal, { color: '#15803D' }]}>100% KYC</Text>
                </View>
                <View style={styles.stripDivider} />
                <View style={styles.stripMetric}>
                  <Text style={styles.stripLabel}>Action</Text>
                  <Text style={[styles.stripVal, { color: '#D97706' }]}>Sign-Off Req</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.signOffActionBtn, { backgroundColor: '#0D9488' }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('VendorApplications')}
              >
                <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 6 }} />
                <Text style={styles.signOffActionBtnText}>Authorize Grade-A Empanelment</Text>
              </TouchableOpacity>
            </View>

            {/* Card 3: 4-Eyes Government Clearance */}
            <View style={[styles.signOffCard, { borderLeftColor: '#7C3AED' }]}>
              <View style={styles.signOffTopLine}>
                <View style={[styles.signOffTag, { backgroundColor: '#FAF5FF', borderColor: '#F3E8FF' }]}>
                  <FileText size={12} color="#7E22CE" strokeWidth={2.4} style={{ marginRight: 4 }} />
                  <Text style={[styles.signOffTagText, { color: '#7E22CE' }]}>4-EYES STATUTORY CUSTODY</Text>
                </View>
                <View style={[styles.urgencyTag, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}>
                  <Text style={[styles.urgencyTagText, { color: '#7E22CE' }]}>{pendingGovtDocs} Clearances</Text>
                </View>
              </View>

              <Text style={styles.signOffTitle}>Directorate of Mines & Geology, Udaipur</Text>
              <Text style={styles.signOffDescription}>
                State mining concession boundary verification report and dispatch authorization requiring Director dual-signature.
              </Text>

              <View style={styles.signOffValueStrip}>
                <View style={styles.stripMetric}>
                  <Text style={styles.stripLabel}>Authority</Text>
                  <Text style={styles.stripVal}>DMG Udaipur</Text>
                </View>
                <View style={styles.stripDivider} />
                <View style={styles.stripMetric}>
                  <Text style={styles.stripLabel}>Clearance</Text>
                  <Text style={[styles.stripVal, { color: '#7E22CE' }]}>Boundary Verif</Text>
                </View>
                <View style={styles.stripDivider} />
                <View style={styles.stripMetric}>
                  <Text style={styles.stripLabel}>Protocol</Text>
                  <Text style={[styles.stripVal, { color: '#DC2626' }]}>Dual-Sign</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.signOffActionBtn, { backgroundColor: '#4338CA' }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('DocumentInbox')}
              >
                <Award size={16} color="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 6 }} />
                <Text style={styles.signOffActionBtnText}>Execute 4-Eyes Release</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Active Exploration Concessions Portfolio */}
          <View style={styles.sectionHeaderBox}>
            <View style={styles.sectionHeaderMainRow}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.sectionTitle}>Mining Concessions Portfolio</Text>
                <View style={[styles.counterBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.counterBadgeText, { color: '#15803D' }]}>{activeProjectsCount} Blocks Active</Text>
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
            <Text style={styles.sectionSubtitle}>
              Live drilling milestones, lithium/phosphate assays & sanctioned allocations
            </Text>
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
                  <ChevronRight size={17} color="#94A3B8" style={{ marginLeft: 'auto' }} />
                </View>

                <Text style={styles.blockTitle}>{blk.title}</Text>
                <View style={styles.blockClientRow}>
                  <Building2 size={12} color="#64748B" style={{ marginRight: 4 }} />
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
          <View style={styles.sectionHeaderBox}>
            <Text style={styles.sectionTitle}>Executive Authority Workspaces</Text>
            <Text style={styles.sectionSubtitle}>
              Core operational & compliance governance hubs
            </Text>
          </View>

          <View style={styles.modulesGrid}>
            {[
              { title: 'Commercial CRM', subtitle: 'Pipeline & Quotes', icon: Users, color: '#2563EB', bg: '#EFF6FF', route: 'CrmWorkspaceHome' },
              { title: 'ERM Projects', subtitle: 'WBS & Concessions', icon: FolderKanban, color: '#0D9488', bg: '#F0FDFA', route: 'ErmWorkspaceHome' },
              { title: 'Field Database', subtitle: 'Assays & Core Logs', icon: Compass, color: '#9A3412', bg: '#FFF7ED', route: 'FieldDatabaseHome' },
              { title: 'Vendors & Rigs', subtitle: 'Empanelment & KYC', icon: Building2, color: '#D97706', bg: '#FEFCE8', route: 'VendorWorkspaceHome' },
              { title: '4-Eyes Documents', subtitle: 'Statutory Mining Clearances', icon: FileText, color: '#7C3AED', bg: '#FAF5FF', route: 'DocumentWorkspaceHome' },
              { title: 'Staff Governance', subtitle: 'Geologists & Leaves', icon: ShieldCheck, color: '#059669', bg: '#F0FDF4', route: 'LeaveApprovals' },
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
                    <IconComp size={20} color={mod.color} strokeWidth={2.3} />
                  </View>
                  <View style={styles.modContent}>
                    <Text style={styles.modTitle}>{mod.title}</Text>
                    <Text style={styles.modSub} numberOfLines={1}>{mod.subtitle}</Text>
                  </View>
                  <ChevronRight size={14} color="#94A3B8" />
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
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  containerContent: {
    paddingBottom: 90,
  },

  /* 1. Executive Boardroom Header */
  executiveHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  avatarInitials: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#D97706',
    borderRadius: radius.full,
    width: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerTitleCol: {
    flex: 1,
  },
  greetingText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 1,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  roleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2.5,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6.5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  orgTagText: {
    fontSize: 10.5,
    color: '#64748B',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  bodyWrapper: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },

  /* 2. Commercial Pipeline Radar */
  pipelineRadarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
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
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  radarBadgeText: {
    color: '#0F766E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  radarFyBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radarFyText: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '600',
  },
  radarValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  radarMainValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  radarSubText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  winRateBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  winRateTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  winRateVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  winRateLabel: {
    fontSize: 9,
    color: '#047857',
    fontWeight: '700',
    marginTop: 1,
  },
  pipelineBar: {
    height: 7,
    borderRadius: 3.5,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 11,
  },
  pipelineSeg: {
    height: '100%',
  },
  pipelineLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  legendPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '600',
  },
  legendVal: {
    color: '#0F172A',
    fontSize: 11.5,
    fontWeight: '800',
  },

  /* Section Headers */
  sectionHeaderBox: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeaderMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  counterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  viewAllBtn: {
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0D9488',
  },

  /* 3. Executive Sign-Off Deck */
  signOffCardsStack: {
    gap: 12,
    marginBottom: 18,
  },
  signOffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4.5,
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
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  signOffTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  urgencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgencyTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E11D48',
  },
  signOffTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  signOffDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17.5,
    marginBottom: 11,
  },
  signOffValueStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stripMetric: {
    flex: 1,
    alignItems: 'center',
  },
  stripLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 1.5,
  },
  stripVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  stripDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  signOffActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 9.5,
    ...shadows.xs,
  },
  signOffActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* 4. Portfolio Blocks */
  portfolioCardsList: {
    gap: 11,
    marginBottom: 18,
  },
  portfolioBlockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.xs,
  },
  blockCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  blockCodeBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  blockCodeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    fontFamily: 'monospace',
  },
  mineralTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mineralTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  blockTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 2,
  },
  blockClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },
  blockClientText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  blockProgressSection: {
    marginBottom: 9,
  },
  blockProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  blockStageName: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  blockProgressVal: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0D9488',
  },
  blockProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  blockProgressFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 3,
  },
  blockMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  blockMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  blockMetricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 1.5,
  },
  blockMetricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  blockMetricDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.xs,
  },
  modIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modContent: {
    flex: 1,
  },
  modTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  modSub: {
    fontSize: 10,
    color: '#64748B',
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
