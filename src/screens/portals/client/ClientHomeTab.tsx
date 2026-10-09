import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Layers,
  ShieldCheck,
  Receipt,
  CreditCard,
  ChevronRight,
  Clock,
  Compass,
  ArrowRight,
  MapPin,
  Flame,
  User,
  Sparkles,
} from 'lucide-react-native';
import { clientTheme } from './clientTheme';
import { Project, Deliverable, FinanceInvoice } from '../../../types';
import { ClientTabKey } from './useClientPortal';

interface ClientHomeTabProps {
  clientCompanyName: string;
  clientContactPerson: string;
  activeProjectsCount: number;
  completedProjectsCount: number;
  pendingDeliverablesCount: number;
  pendingInvoicesCount: number;
  totalContractValue: number;
  totalPaidAmount: number;
  totalOutstanding: number;
  myProjects: Project[];
  myDeliverables: Array<Deliverable & { projectTitle: string; projectCode?: string }>;
  myInvoices: FinanceInvoice[];
  onNavigateTab: (tab: ClientTabKey) => void;
  onOpenProjectDetail: (p: Project) => void;
  onOpenDeliverableReview: (d: Deliverable & { projectTitle: string; projectCode?: string }) => void;
  onOpenInvoicePay: (i: FinanceInvoice) => void;
}

export const ClientHomeTab: React.FC<ClientHomeTabProps> = ({
  clientCompanyName,
  clientContactPerson,
  activeProjectsCount,
  completedProjectsCount,
  pendingDeliverablesCount,
  pendingInvoicesCount,
  totalContractValue,
  totalPaidAmount,
  totalOutstanding,
  myProjects,
  myDeliverables,
  myInvoices,
  onNavigateTab,
  onOpenProjectDetail,
  onOpenDeliverableReview,
  onOpenInvoicePay,
}) => {
  // Urgent deliverables needing client approval
  const urgentDeliverable = myDeliverables.find((d) => d.status === 'Submitted');

  // Urgent unpaid invoice
  const pendingInvoice = myInvoices.find((i) => i.status !== 'Paid');

  // Primary active project
  const featuredProject = myProjects.find((p) => (p.currentStage || 1) < 7) || myProjects[0];

  // Recent timeline events aggregated across client projects
  const recentUpdates = (featuredProject?.history || []).slice(0, 4);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      {/* 1. EXECUTIVE WELCOME HERO */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTopRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveBadgeText}>Active Exploration Client</Text>
            </View>
            <Text style={styles.contactNameText}>{clientContactPerson}</Text>
            <Text style={styles.orgSubText}>{clientCompanyName}</Text>
          </View>

          <View style={styles.clientAvatarWrap}>
            <Text style={styles.clientAvatarText}>
              {clientCompanyName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.welcomeDesc}>
          Welcome to your Bansal Geo Executive Command Center. Inspect drilling footage, review certified reports, and approve technical deliverables.
        </Text>
      </View>

      {/* 2. 4 EXECUTIVE KPI STAT CARDS */}
      <View style={styles.kpiGrid}>
        {/* Active Projects */}
        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.8}
          onPress={() => onNavigateTab('projects')}
        >
          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconWrap, { backgroundColor: clientTheme.colors.navySubtle }]}>
              <Layers size={19} color={clientTheme.colors.navy} />
            </View>
            <View style={[styles.kpiMiniPill, { backgroundColor: clientTheme.colors.navySubtle }]}>
              <Text style={[styles.kpiMiniPillText, { color: clientTheme.colors.navy }]}>Active</Text>
            </View>
          </View>
          <Text style={styles.kpiValueText}>{activeProjectsCount}</Text>
          <Text style={styles.kpiTitle}>My Projects</Text>
          <Text style={styles.kpiSub}>
            {completedProjectsCount > 0 ? `${completedProjectsCount} completed` : 'All in progress'}
          </Text>
        </TouchableOpacity>

        {/* Deliverables Requiring Sign-Off */}
        <TouchableOpacity
          style={[styles.kpiCard, pendingDeliverablesCount > 0 && styles.kpiCardHighlightGold]}
          activeOpacity={0.8}
          onPress={() => onNavigateTab('deliverables')}
        >
          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconWrap, { backgroundColor: clientTheme.colors.goldSubtle }]}>
              <ShieldCheck size={19} color={clientTheme.colors.goldDark} />
            </View>
            <View style={[styles.kpiMiniPill, { backgroundColor: clientTheme.colors.goldSubtle }]}>
              <Text style={[styles.kpiMiniPillText, { color: clientTheme.colors.goldDark }]}>Stage 5</Text>
            </View>
          </View>
          <Text
            style={[
              styles.kpiValueText,
              pendingDeliverablesCount > 0 && { color: clientTheme.colors.goldDark },
            ]}
          >
            {pendingDeliverablesCount}
          </Text>
          <Text style={styles.kpiTitle}>Sign-Off Needed</Text>
          <Text style={styles.kpiSub}>
            {pendingDeliverablesCount > 0 ? 'Action required' : 'All approved'}
          </Text>
        </TouchableOpacity>

        {/* Pending Invoices */}
        <TouchableOpacity
          style={[styles.kpiCard, pendingInvoicesCount > 0 && styles.kpiCardHighlightCrimson]}
          activeOpacity={0.8}
          onPress={() => onNavigateTab('invoices')}
        >
          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#fee2e2' }]}>
              <Receipt size={19} color={clientTheme.colors.crimson} />
            </View>
            <View style={[styles.kpiMiniPill, { backgroundColor: '#fee2e2' }]}>
              <Text style={[styles.kpiMiniPillText, { color: clientTheme.colors.crimson }]}>Due</Text>
            </View>
          </View>
          <Text
            style={[
              styles.kpiValueText,
              pendingInvoicesCount > 0 && { color: clientTheme.colors.crimson },
            ]}
          >
            {pendingInvoicesCount}
          </Text>
          <Text style={styles.kpiTitle}>Pending Invoices</Text>
          <Text style={styles.kpiSub}>
            ₹{(totalOutstanding / 100000).toFixed(1)}L due
          </Text>
        </TouchableOpacity>

        {/* Remitted Payments */}
        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.8}
          onPress={() => onNavigateTab('invoices')}
        >
          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconWrap, { backgroundColor: clientTheme.colors.emeraldSubtle }]}>
              <CreditCard size={19} color={clientTheme.colors.emerald} />
            </View>
            <View style={[styles.kpiMiniPill, { backgroundColor: clientTheme.colors.emeraldSubtle }]}>
              <Text style={[styles.kpiMiniPillText, { color: clientTheme.colors.emerald }]}>Paid</Text>
            </View>
          </View>
          <Text style={[styles.kpiValueText, { color: clientTheme.colors.emerald }]}>
            ₹{(totalPaidAmount / 100000).toFixed(1)}L
          </Text>
          <Text style={styles.kpiTitle}>Settled Total</Text>
          <Text style={styles.kpiSub}>Corporate Vouchers</Text>
        </TouchableOpacity>
      </View>

      {/* 3. URGENT ACTION SPOTLIGHT (DELIVERABLE SIGN-OFF OR INVOICE DUE) */}
      {urgentDeliverable ? (
        <View style={styles.spotlightCard}>
          <View style={styles.spotlightTopRow}>
            <View style={styles.spotlightTagGold}>
              <Flame size={14} color={clientTheme.colors.goldDark} />
              <Text style={styles.spotlightTagTextGold}>STAGE 5 CLIENT SIGN-OFF REQUIRED</Text>
            </View>
            <Text style={styles.spotlightDate}>{urgentDeliverable.submissionDate}</Text>
          </View>

          <Text style={styles.spotlightTitle}>{urgentDeliverable.title}</Text>
          <Text style={styles.spotlightSub}>
            Project: {urgentDeliverable.projectTitle}
          </Text>
          <Text style={styles.spotlightBody}>
            Bansal Geo technical team has submitted this deliverable for executive client acceptance. Please inspect the borehole intervals and approve.
          </Text>

          <TouchableOpacity
            style={styles.spotlightActionBtn}
            activeOpacity={0.85}
            onPress={() => onOpenDeliverableReview(urgentDeliverable)}
          >
            <ShieldCheck size={18} color="#ffffff" />
            <Text style={styles.spotlightActionBtnText}>Review & Sign Off Now</Text>
            <ArrowRight size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ) : pendingInvoice ? (
        <View style={[styles.spotlightCard, styles.spotlightCardInvoice]}>
          <View style={styles.spotlightTopRow}>
            <View style={styles.spotlightTagNavy}>
              <Receipt size={14} color={clientTheme.colors.navy} />
              <Text style={styles.spotlightTagTextNavy}>TAX INVOICE PAYMENT DUE</Text>
            </View>
            <Text style={styles.spotlightDate}>Due: {pendingInvoice.dueDate}</Text>
          </View>

          <Text style={styles.spotlightTitle}>
            Invoice #{pendingInvoice.invoiceNo} — ₹{pendingInvoice.totalAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.spotlightSub}>
            {pendingInvoice.projectTitle || 'Geological Exploration Services'}
          </Text>

          <TouchableOpacity
            style={[styles.spotlightActionBtn, { backgroundColor: clientTheme.colors.navy }]}
            activeOpacity={0.85}
            onPress={() => onOpenInvoicePay(pendingInvoice)}
          >
            <CreditCard size={18} color="#ffffff" />
            <Text style={styles.spotlightActionBtnText}>Settle Instantly via UPI QR</Text>
            <ArrowRight size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 4. QUICK ACTION SHORTCUTS (EASY ACCESS) */}
      <View style={styles.quickActionsBlock}>
        <Text style={styles.blockTitle}>Quick Portals</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionTile}
            activeOpacity={0.8}
            onPress={() => onNavigateTab('projects')}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#e0f2fe' }]}>
              <Compass size={22} color="#0284c7" />
            </View>
            <Text style={styles.quickActionLabel}>Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            activeOpacity={0.8}
            onPress={() => onNavigateTab('deliverables')}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#fef3c7' }]}>
              <ShieldCheck size={22} color="#d97706" />
            </View>
            <Text style={styles.quickActionLabel}>Sign-Off</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            activeOpacity={0.8}
            onPress={() => onNavigateTab('invoices')}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#fee2e2' }]}>
              <Receipt size={22} color="#dc2626" />
            </View>
            <Text style={styles.quickActionLabel}>Invoices</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            activeOpacity={0.8}
            onPress={() => onNavigateTab('profile')}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#f3e8ff' }]}>
              <User size={22} color="#7c3aed" />
            </View>
            <Text style={styles.quickActionLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. ACTIVE GEOLOGICAL PROJECT SPOTLIGHT */}
      {featuredProject && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Compass size={20} color={clientTheme.colors.navy} />
              <Text style={styles.sectionTitle}>Featured Concession</Text>
            </View>
            <TouchableOpacity
              onPress={() => onNavigateTab('projects')}
              style={styles.seeAllBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>View All ({myProjects.length})</Text>
              <ChevronRight size={16} color={clientTheme.colors.teal} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.projectSpotlightCard}
            activeOpacity={0.85}
            onPress={() => onOpenProjectDetail(featuredProject)}
          >
            <View style={styles.projectCardTop}>
              <View style={styles.projectCodePill}>
                <Text style={styles.projectCodeText}>
                  {featuredProject.projectCode || featuredProject.id}
                </Text>
              </View>
              <View style={styles.stagePill}>
                <Text style={styles.stagePillText}>
                  Stage {featuredProject.currentStage || 1}: {
                    ['', 'Allocation', 'Planning', 'Execution', 'Submission', 'Client Approval', 'Invoicing', 'Closure'][featuredProject.currentStage || 1]
                  }
                </Text>
              </View>
            </View>

            <Text style={styles.projectCardTitle}>{featuredProject.title}</Text>
            <View style={styles.projectMetaRow}>
              <MapPin size={15} color={clientTheme.colors.textMuted} />
              <Text style={styles.projectLocationText}>{featuredProject.location}</Text>
            </View>

            {/* 7-Stage Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Lifecycle Progress</Text>
                <Text style={styles.progressValue}>
                  {Math.round(((featuredProject.currentStage || 1) / 7) * 100)}% (Stage {featuredProject.currentStage || 1}/7)
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${((featuredProject.currentStage || 1) / 7) * 100}%` },
                  ]}
                />
              </View>
            </View>

            {/* Technical Highlights */}
            <View style={styles.techHighlightsRow}>
              <View style={styles.techCol}>
                <Text style={styles.techColLabel}>BUDGET</Text>
                <Text style={styles.techColVal}>
                  ₹{((featuredProject.baselineBudget || 0) / 100000).toFixed(1)}L
                </Text>
              </View>
              <View style={styles.techCol}>
                <Text style={styles.techColLabel}>CORING TARGET</Text>
                <Text style={styles.techColVal}>HQ Diamond Coring</Text>
              </View>
              <View style={styles.techCol}>
                <Text style={styles.techColLabel}>CORE RECOVERY</Text>
                <Text style={[styles.techColVal, { color: clientTheme.colors.emerald }]}>~94% High</Text>
              </View>
            </View>

            <View style={styles.projectCardFooter}>
              <Text style={styles.projectCardFooterText}>
                {featuredProject.authority || 'Department of Mines & Geology'}
              </Text>
              <View style={styles.inspectLinkRow}>
                <Text style={styles.inspectLinkText}>Inspect Concession</Text>
                <ChevronRight size={16} color={clientTheme.colors.navy} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* 6. RECENT PROJECT TIMELINE UPDATES */}
      {recentUpdates.length > 0 && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Clock size={20} color={clientTheme.colors.navy} />
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
          </View>

          <View style={styles.timelineCard}>
            {recentUpdates.map((hItem, idx) => (
              <View
                key={hItem.id || idx}
                style={[
                  styles.timelineItem,
                  idx === recentUpdates.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 },
                ]}
              >
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDateText}>{hItem.date}</Text>
                  <Text style={styles.timelineItemText}>{hItem.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
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
    gap: 16,
  },
  welcomeCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
    ...clientTheme.shadows.sm,
  },
  welcomeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: clientTheme.radius.full,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: clientTheme.colors.emerald,
  },
  liveBadgeText: {
    fontSize: clientTheme.typography.badge,
    fontWeight: '700',
    color: clientTheme.colors.emeraldDark,
  },
  contactNameText: {
    fontSize: clientTheme.typography.titleXl,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    letterSpacing: -0.3,
  },
  orgSubText: {
    fontSize: clientTheme.typography.bodyMd,
    fontWeight: '600',
    color: clientTheme.colors.textSecondary,
    marginTop: 2,
  },
  clientAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: clientTheme.radius.md,
    backgroundColor: clientTheme.colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  clientAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  welcomeDesc: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textSecondary,
    lineHeight: 20,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 16,
    borderWidth: 1.2,
    borderColor: clientTheme.colors.sandstoneBorder,
    ...clientTheme.shadows.sm,
  },
  kpiCardHighlightGold: {
    borderColor: '#fde68a',
    backgroundColor: '#fffdf5',
  },
  kpiCardHighlightCrimson: {
    borderColor: '#fecaca',
    backgroundColor: '#fffbfa',
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  kpiIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiMiniPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: clientTheme.radius.full,
  },
  kpiMiniPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  kpiValueText: {
    fontSize: 26,
    fontWeight: '900',
    color: clientTheme.colors.navy,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  kpiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: clientTheme.colors.textPrimary,
  },
  kpiSub: {
    fontSize: 11.5,
    color: clientTheme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  spotlightCard: {
    backgroundColor: '#fffbeb',
    borderRadius: clientTheme.radius.lg,
    padding: 18,
    borderWidth: 1.2,
    borderColor: '#fde68a',
    ...clientTheme.shadows.sm,
  },
  spotlightCardInvoice: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  spotlightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  spotlightTagGold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: clientTheme.radius.full,
  },
  spotlightTagTextGold: {
    fontSize: 10.5,
    fontWeight: '800',
    color: clientTheme.colors.goldDark,
    letterSpacing: 0.4,
  },
  spotlightTagNavy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: clientTheme.radius.full,
  },
  spotlightTagTextNavy: {
    fontSize: 10.5,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    letterSpacing: 0.4,
  },
  spotlightDate: {
    fontSize: clientTheme.typography.badge,
    color: clientTheme.colors.textMuted,
    fontWeight: '600',
  },
  spotlightTitle: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    lineHeight: 22,
    marginTop: 4,
  },
  spotlightSub: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  spotlightBody: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
  },
  spotlightActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: clientTheme.colors.emerald,
    height: 50,
    borderRadius: clientTheme.radius.md,
    marginTop: 14,
  },
  spotlightActionBtnText: {
    fontSize: clientTheme.typography.bodyMd,
    fontWeight: '700',
    color: '#ffffff',
  },
  quickActionsBlock: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
  },
  blockTitle: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionTile: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIconWrap: {
    width: 50,
    height: 50,
    borderRadius: clientTheme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '700',
    color: clientTheme.colors.textPrimary,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '700',
    color: clientTheme.colors.teal,
  },
  projectSpotlightCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
    ...clientTheme.shadows.sm,
  },
  projectCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  projectCodePill: {
    backgroundColor: clientTheme.colors.navySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: clientTheme.radius.sm,
  },
  projectCodeText: {
    fontSize: clientTheme.typography.badge,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  stagePill: {
    backgroundColor: clientTheme.colors.tealSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: clientTheme.radius.sm,
  },
  stagePillText: {
    fontSize: clientTheme.typography.badge,
    fontWeight: '700',
    color: clientTheme.colors.tealDark,
  },
  projectCardTitle: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    lineHeight: 22,
    marginBottom: 6,
  },
  projectMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  projectLocationText: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textMuted,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textSecondary,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '800',
    color: clientTheme.colors.tealDark,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: clientTheme.colors.navySubtle,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: clientTheme.colors.teal,
    borderRadius: 4,
  },
  techHighlightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: clientTheme.colors.sandstone,
    padding: 12,
    borderRadius: clientTheme.radius.md,
    marginBottom: 14,
  },
  techCol: {
    alignItems: 'center',
    flex: 1,
  },
  techColLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: clientTheme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  techColVal: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  projectCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: clientTheme.colors.sandstoneBorder,
    paddingTop: 12,
  },
  projectCardFooterText: {
    fontSize: clientTheme.typography.badge,
    color: clientTheme.colors.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  inspectLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inspectLinkText: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '700',
    color: clientTheme.colors.navy,
  },
  timelineCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: clientTheme.colors.sandstoneBorder,
    paddingBottom: 12,
    marginBottom: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: clientTheme.colors.teal,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDateText: {
    fontSize: clientTheme.typography.badge,
    color: clientTheme.colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineItemText: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textPrimary,
    lineHeight: 18,
    fontWeight: '500',
  },
});
