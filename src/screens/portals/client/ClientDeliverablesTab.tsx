import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
  ArrowRight,
} from 'lucide-react-native';
import { clientTheme } from './clientTheme';
import { Deliverable } from '../../../types';

interface ClientDeliverablesTabProps {
  myDeliverables: Array<Deliverable & { projectTitle: string; projectCode?: string }>;
  filteredDeliverables: Array<Deliverable & { projectTitle: string; projectCode?: string }>;
  deliverableFilter: 'all' | 'pending' | 'approved' | 'revision';
  setDeliverableFilter: (v: 'all' | 'pending' | 'approved' | 'revision') => void;
  onOpenDeliverableReview: (d: Deliverable & { projectTitle: string; projectCode?: string }) => void;
}

export const ClientDeliverablesTab: React.FC<ClientDeliverablesTabProps> = ({
  myDeliverables,
  filteredDeliverables,
  deliverableFilter,
  setDeliverableFilter,
  onOpenDeliverableReview,
}) => {
  const pendingCount = myDeliverables.filter((d) => d.status === 'Submitted' || d.status === 'Draft').length;
  const approvedCount = myDeliverables.filter((d) => d.status === 'Client Approved').length;
  const revisionCount = myDeliverables.filter((d) => d.status === 'Revision Requested').length;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      {/* 1. FILTER PILLS ROW */}
      <View style={styles.filterPillsRow}>
        <TouchableOpacity
          style={[styles.filterPill, deliverableFilter === 'all' && styles.filterPillActive]}
          onPress={() => setDeliverableFilter('all')}
        >
          <Text style={[styles.filterPillText, deliverableFilter === 'all' && styles.filterPillTextActive]}>
            All ({myDeliverables.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, deliverableFilter === 'pending' && styles.filterPillActive]}
          onPress={() => setDeliverableFilter('pending')}
        >
          <Text style={[styles.filterPillText, deliverableFilter === 'pending' && styles.filterPillTextActive]}>
            Action Required ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, deliverableFilter === 'approved' && styles.filterPillActive]}
          onPress={() => setDeliverableFilter('approved')}
        >
          <Text style={[styles.filterPillText, deliverableFilter === 'approved' && styles.filterPillTextActive]}>
            Approved ({approvedCount})
          </Text>
        </TouchableOpacity>

        {revisionCount > 0 && (
          <TouchableOpacity
            style={[styles.filterPill, deliverableFilter === 'revision' && styles.filterPillActive]}
            onPress={() => setDeliverableFilter('revision')}
          >
            <Text style={[styles.filterPillText, deliverableFilter === 'revision' && styles.filterPillTextActive]}>
              Revisions ({revisionCount})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. NOTICE BANNER */}
      {pendingCount > 0 && (
        <View style={styles.noticeBanner}>
          <Clock size={18} color={clientTheme.colors.goldDark} />
          <Text style={styles.noticeBannerText}>
            You have {pendingCount} deliverable{pendingCount > 1 ? 's' : ''} awaiting executive client sign-off (Stage 5 approval).
          </Text>
        </View>
      )}

      {/* 3. DELIVERABLES LIST */}
      {filteredDeliverables.length === 0 ? (
        <View style={styles.emptyCard}>
          <ShieldCheck size={44} color={clientTheme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No deliverables in this category</Text>
          <Text style={styles.emptySub}>
            Technical exploration submissions and certified reports will appear here once uploaded by the field crew.
          </Text>
        </View>
      ) : (
        filteredDeliverables.map((deliv) => {
          const isSubmitted = deliv.status === 'Submitted';
          const isApproved = deliv.status === 'Client Approved';
          const isRevision = deliv.status === 'Revision Requested';

          return (
            <View key={deliv.id} style={styles.deliverableCard}>
              {/* Card Top */}
              <View style={styles.cardHeader}>
                <View style={styles.projectPill}>
                  <Text style={styles.projectPillText}>{deliv.projectCode || 'CONCESSION'}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isSubmitted && styles.statusBadgeSubmitted,
                    isApproved && styles.statusBadgeApproved,
                    isRevision && styles.statusBadgeRevision,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isSubmitted && styles.statusBadgeTextSubmitted,
                      isApproved && styles.statusBadgeTextApproved,
                      isRevision && styles.statusBadgeTextRevision,
                    ]}
                  >
                    {isSubmitted ? 'Sign-Off Needed' : deliv.status}
                  </Text>
                </View>
              </View>

              {/* Title & Project */}
              <Text style={styles.delivTitle}>{deliv.title}</Text>
              <Text style={styles.projectSubText}>{deliv.projectTitle}</Text>

              {/* Meta Data Box */}
              <View style={styles.metaBox}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>DOCUMENT FILE</Text>
                  <Text style={styles.metaVal}>{deliv.fileName || 'Report_Lithologs_Attested.pdf'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>SUBMITTED ON</Text>
                  <Text style={styles.metaVal}>{deliv.submissionDate || '2026-09-28'}</Text>
                </View>
                <View style={[styles.metaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={styles.metaLabel}>VERSION & SIZE</Text>
                  <Text style={styles.metaVal}>
                    {deliv.version || 'v1.0'} • {deliv.fileSize || '14.2 MB'}
                  </Text>
                </View>
              </View>

              {/* Primary Action Button */}
              {isSubmitted ? (
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  activeOpacity={0.85}
                  onPress={() => onOpenDeliverableReview(deliv)}
                >
                  <ShieldCheck size={18} color="#ffffff" />
                  <Text style={styles.actionBtnPrimaryText}>Review & Sign Off Technical Report</Text>
                  <ArrowRight size={18} color="#ffffff" />
                </TouchableOpacity>
              ) : isApproved ? (
                <TouchableOpacity
                  style={styles.actionBtnApproved}
                  activeOpacity={0.85}
                  onPress={() => onOpenDeliverableReview(deliv)}
                >
                  <CheckCircle2 size={18} color={clientTheme.colors.emerald} />
                  <Text style={styles.actionBtnApprovedText}>
                    Approved & Signed Off • View Details
                  </Text>
                  <ChevronRight size={16} color={clientTheme.colors.emerald} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.actionBtnRevision}
                  activeOpacity={0.85}
                  onPress={() => onOpenDeliverableReview(deliv)}
                >
                  <AlertCircle size={18} color={clientTheme.colors.crimson} />
                  <Text style={styles.actionBtnRevisionText}>
                    Revision Under Review • View Notes
                  </Text>
                  <ChevronRight size={16} color={clientTheme.colors.crimson} />
                </TouchableOpacity>
              )}
            </View>
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
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: clientTheme.radius.full,
    backgroundColor: clientTheme.colors.surface,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
  },
  filterPillActive: {
    backgroundColor: clientTheme.colors.navy,
    borderColor: clientTheme.colors.navy,
  },
  filterPillText: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '600',
    color: clientTheme.colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: clientTheme.colors.goldSubtle,
    borderRadius: clientTheme.radius.md,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#fde68a',
    gap: 10,
  },
  noticeBannerText: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '700',
    color: clientTheme.colors.goldDark,
    flex: 1,
    lineHeight: 19,
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
  deliverableCard: {
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
  projectPill: {
    backgroundColor: clientTheme.colors.navySubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: clientTheme.radius.sm,
  },
  projectPillText: {
    fontSize: clientTheme.typography.badge,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: clientTheme.radius.sm,
    backgroundColor: clientTheme.colors.sandstoneDark,
  },
  statusBadgeSubmitted: {
    backgroundColor: clientTheme.colors.goldSubtle,
  },
  statusBadgeApproved: {
    backgroundColor: clientTheme.colors.emeraldSubtle,
  },
  statusBadgeRevision: {
    backgroundColor: clientTheme.colors.crimsonSubtle,
  },
  statusBadgeText: {
    fontSize: clientTheme.typography.badge,
    fontWeight: '700',
    color: clientTheme.colors.textSecondary,
  },
  statusBadgeTextSubmitted: {
    color: clientTheme.colors.goldDark,
  },
  statusBadgeTextApproved: {
    color: clientTheme.colors.emeraldDark,
  },
  statusBadgeTextRevision: {
    color: clientTheme.colors.crimson,
  },
  delivTitle: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    lineHeight: 22,
    marginBottom: 4,
  },
  projectSubText: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 14,
  },
  metaBox: {
    backgroundColor: clientTheme.colors.sandstone,
    borderRadius: clientTheme.radius.md,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: clientTheme.colors.sandstoneBorder,
    paddingBottom: 6,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: clientTheme.colors.textMuted,
    letterSpacing: 0.5,
  },
  metaVal: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '700',
    color: clientTheme.colors.textPrimary,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: clientTheme.colors.emerald,
    height: 50,
    borderRadius: clientTheme.radius.md,
  },
  actionBtnPrimaryText: {
    fontSize: clientTheme.typography.bodyMd,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionBtnApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: clientTheme.colors.emeraldSubtle,
    height: 48,
    borderRadius: clientTheme.radius.md,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  actionBtnApprovedText: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '700',
    color: clientTheme.colors.emeraldDark,
  },
  actionBtnRevision: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: clientTheme.colors.crimsonSubtle,
    height: 48,
    borderRadius: clientTheme.radius.md,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  actionBtnRevisionText: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '700',
    color: clientTheme.colors.crimson,
  },
});
