import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  X,
  Compass,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  CreditCard,
  User,
  ArrowRight,
  Receipt,
  Layers,
  ChevronRight,
} from 'lucide-react-native';
import { clientTheme } from './clientTheme';
import { Project, Deliverable } from '../../../types';

interface ClientProjectDetailModalProps {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onOpenDeliverableReview: (d: Deliverable & { projectTitle: string; projectCode?: string }) => void;
}

export const ClientProjectDetailModal: React.FC<ClientProjectDetailModalProps> = ({
  visible,
  project,
  onClose,
  onOpenDeliverableReview,
}) => {
  if (!project) return null;

  const STAGES = [
    { num: 1, name: 'Allocation', desc: 'Concession setup, mobilization notice, statutory authority filing' },
    { num: 2, name: 'Planning', desc: 'Survey grid design, borehole siting, team allocation' },
    { num: 3, name: 'Task Execution', desc: 'Diamond core drilling, lithology logging, geochemical sampling' },
    { num: 4, name: 'Deliverable Submission', desc: 'Draft technical report compilation & QA scrutiny' },
    { num: 5, name: 'Client Approval', desc: 'Executive client review, sign-off & technical acceptance' },
    { num: 6, name: 'Invoicing', desc: 'Milestone tax invoicing, GST breakdown & payment reconciliation' },
    { num: 7, name: 'Project Closure', desc: 'Final DMG handover, certificate of completion, closure archiving' },
  ];

  const currentStage = project.currentStage || 1;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <View style={styles.codeRow}>
              <View style={styles.codePill}>
                <Text style={styles.codeText}>{project.projectCode || project.id}</Text>
              </View>
              <View style={styles.stagePill}>
                <Text style={styles.stagePillText}>
                  {project.stageName || `Stage ${currentStage}: Active`}
                </Text>
              </View>
            </View>
            <Text style={styles.projectTitle} numberOfLines={2}>
              {project.title}
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={clientTheme.colors.navy} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* 1. PROJECT OVERVIEW CARD */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Compass size={18} color={clientTheme.colors.navy} />
              <Text style={styles.sectionHeading}>Concession & Authority Overview</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nodal Authority</Text>
              <Text style={styles.detailVal}>
                {project.authority || 'Department of Mines & Geology, Rajasthan'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Concession Block</Text>
              <Text style={styles.detailVal}>{project.location || 'Bhilwara, Rajasthan'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Drill Pad / Site</Text>
              <Text style={styles.detailVal}>{project.site || 'North Block · Pit 2'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service Line</Text>
              <Text style={styles.detailVal}>
                {project.service || 'Mineral Exploration & Resources'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Baseline Budget</Text>
              <Text style={[styles.detailVal, { color: clientTheme.colors.navy, fontWeight: '800' }]}>
                ₹{(project.baselineBudget || 0).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Team Coordinator</Text>
              <Text style={styles.detailVal}>
                {project.team?.coordinator || 'Kritika Gupta'} (Bansal Geo)
              </Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Target Timeline</Text>
              <Text style={styles.detailVal}>
                {project.startDate || '2026-08-01'} to {project.endDate || project.dueOn || '2026-12-15'}
              </Text>
            </View>
          </View>

          {/* 2. 7-STAGE OPERATIONAL LIFECYCLE STEPPER */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Layers size={18} color={clientTheme.colors.navy} />
              <Text style={styles.sectionHeading}>7-Stage Operational Lifecycle</Text>
            </View>

            <View style={styles.stepperWrap}>
              {STAGES.map((s) => {
                const isDone = currentStage > s.num;
                const isCurrent = currentStage === s.num;

                return (
                  <View key={s.num} style={styles.stepItemRow}>
                    <View style={styles.stepIndicatorCol}>
                      <View
                        style={[
                          styles.stepNode,
                          isDone && styles.stepNodeDone,
                          isCurrent && styles.stepNodeCurrent,
                        ]}
                      >
                        {isDone ? (
                          <CheckCircle2 size={16} color="#ffffff" strokeWidth={2.6} />
                        ) : (
                          <Text
                            style={[
                              styles.stepNodeText,
                              isCurrent && styles.stepNodeTextCurrent,
                            ]}
                          >
                            {s.num}
                          </Text>
                        )}
                      </View>
                      {s.num < 7 && <View style={[styles.stepConnector, isDone && styles.stepConnectorDone]} />}
                    </View>

                    <View style={styles.stepContentCol}>
                      <View style={styles.stepTitleRow}>
                        <Text
                          style={[
                            styles.stepName,
                            isCurrent && styles.stepNameCurrent,
                            isDone && styles.stepNameDone,
                          ]}
                        >
                          Stage {s.num}: {s.name}
                        </Text>
                        <View
                          style={[
                            styles.stepStatusPill,
                            isDone && styles.stepStatusPillDone,
                            isCurrent && styles.stepStatusPillCurrent,
                          ]}
                        >
                          <Text
                            style={[
                              styles.stepStatusText,
                              isDone && styles.stepStatusTextDone,
                              isCurrent && styles.stepStatusTextCurrent,
                            ]}
                          >
                            {isDone ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.stepDescText}>{s.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 3. GEOLOGICAL & DRILLING HIGHLIGHTS */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color={clientTheme.colors.navy} />
              <Text style={styles.sectionHeading}>Geological & Drilling Status</Text>
            </View>

            <View style={styles.geologyGrid}>
              <View style={styles.geologyCol}>
                <Text style={styles.geologyLabel}>BOREHOLE CORING</Text>
                <Text style={styles.geologyVal}>HQ Size (0-150m)</Text>
              </View>
              <View style={styles.geologyCol}>
                <Text style={styles.geologyLabel}>CORE RECOVERY</Text>
                <Text style={[styles.geologyVal, { color: clientTheme.colors.emerald }]}>92% Mineralized</Text>
              </View>
              <View style={styles.geologyCol}>
                <Text style={styles.geologyLabel}>DRILL PAD</Text>
                <Text style={styles.geologyVal}>Pad BH-04 Active</Text>
              </View>
            </View>

            {(project.fieldVisits || []).map((fv) => (
              <View key={fv.id} style={styles.fieldVisitRow}>
                <View style={styles.fieldVisitHeader}>
                  <Text style={styles.fieldVisitDate}>{fv.date} • {fv.by}</Text>
                  <Text style={styles.fieldVisitActivity}>{fv.activity}</Text>
                </View>
                <Text style={styles.fieldVisitNotes}>{fv.notes}</Text>
              </View>
            ))}
          </View>

          {/* 4. PROJECT DELIVERABLES */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ShieldCheck size={18} color={clientTheme.colors.navy} />
              <Text style={styles.sectionHeading}>
                Project Technical Deliverables ({(project.deliverables || []).length})
              </Text>
            </View>

            {(project.deliverables || []).length === 0 ? (
              <Text style={styles.emptyNotice}>
                Deliverables will be compiled and uploaded upon completion of field sampling.
              </Text>
            ) : (
              (project.deliverables || []).map((deliv) => {
                const isApproved = deliv.status === 'Client Approved';
                const isSubmitted = deliv.status === 'Submitted';

                return (
                  <View key={deliv.id} style={styles.delivItem}>
                    <View style={styles.delivHeader}>
                      <Text style={styles.delivTitle}>{deliv.title}</Text>
                      <View
                        style={[
                          styles.delivStatusPill,
                          isApproved && styles.delivStatusPillApproved,
                          isSubmitted && styles.delivStatusPillSubmitted,
                        ]}
                      >
                        <Text
                          style={[
                            styles.delivStatusText,
                            isApproved && styles.delivStatusTextApproved,
                            isSubmitted && styles.delivStatusTextSubmitted,
                          ]}
                        >
                          {deliv.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.delivMeta}>
                      File: {deliv.fileName} • {deliv.fileSize || '14.2 MB'} • Version {deliv.version}
                    </Text>

                    <TouchableOpacity
                      style={styles.reviewBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        onClose();
                        onOpenDeliverableReview({
                          ...deliv,
                          projectTitle: project.title,
                          projectCode: project.projectCode || project.id,
                        });
                      }}
                    >
                      <ShieldCheck size={16} color={clientTheme.colors.navy} />
                      <Text style={styles.reviewBtnText}>
                        {isSubmitted ? 'Inspect & Sign Off Deliverable' : 'View Attested Deliverable'}
                      </Text>
                      <ChevronRight size={16} color={clientTheme.colors.navy} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: clientTheme.colors.sandstone,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: clientTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: clientTheme.colors.sandstoneBorder,
    ...clientTheme.shadows.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  codePill: {
    backgroundColor: clientTheme.colors.navySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  stagePill: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  stagePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: clientTheme.colors.tealDark,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: clientTheme.colors.sandstoneDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 16,
    paddingBottom: 80,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
    ...clientTheme.shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: clientTheme.colors.sandstoneBorder,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 13,
    color: clientTheme.colors.textMuted,
  },
  detailVal: {
    fontSize: 13.5,
    fontWeight: '600',
    color: clientTheme.colors.graphite,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  stepperWrap: {
    paddingVertical: 4,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 10,
  },
  stepNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: clientTheme.colors.sandstoneDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: clientTheme.colors.sandstoneBorderDark,
  },
  stepNodeDone: {
    backgroundColor: clientTheme.colors.emerald,
    borderColor: clientTheme.colors.emerald,
  },
  stepNodeCurrent: {
    backgroundColor: clientTheme.colors.teal,
    borderColor: clientTheme.colors.teal,
  },
  stepNodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: clientTheme.colors.textSecondary,
  },
  stepNodeTextCurrent: {
    color: '#ffffff',
  },
  stepConnector: {
    width: 2.5,
    height: 44,
    backgroundColor: clientTheme.colors.sandstoneBorderDark,
    marginVertical: 2,
  },
  stepConnectorDone: {
    backgroundColor: clientTheme.colors.emerald,
  },
  stepContentCol: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  stepName: {
    fontSize: 14,
    fontWeight: '700',
    color: clientTheme.colors.graphite,
  },
  stepNameCurrent: {
    color: clientTheme.colors.tealDark,
    fontWeight: '800',
  },
  stepNameDone: {
    color: clientTheme.colors.emeraldDark,
  },
  stepStatusPill: {
    backgroundColor: clientTheme.colors.sandstoneDark,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  stepStatusPillDone: {
    backgroundColor: '#ecfdf5',
  },
  stepStatusPillCurrent: {
    backgroundColor: '#f0fdfa',
  },
  stepStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: clientTheme.colors.textMuted,
  },
  stepStatusTextDone: {
    color: clientTheme.colors.emerald,
  },
  stepStatusTextCurrent: {
    color: clientTheme.colors.tealDark,
  },
  stepDescText: {
    fontSize: 12,
    color: clientTheme.colors.textMuted,
    lineHeight: 16,
  },
  geologyGrid: {
    flexDirection: 'row',
    backgroundColor: clientTheme.colors.sandstone,
    padding: 12,
    borderRadius: clientTheme.radius.md,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
    marginBottom: 10,
  },
  geologyCol: {
    flex: 1,
  },
  geologyLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: clientTheme.colors.textMuted,
    marginBottom: 2,
  },
  geologyVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: clientTheme.colors.graphite,
  },
  fieldVisitRow: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fieldVisitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fieldVisitDate: {
    fontSize: 11.5,
    fontWeight: '700',
    color: clientTheme.colors.textSecondary,
  },
  fieldVisitActivity: {
    fontSize: 11.5,
    fontWeight: '800',
    color: clientTheme.colors.tealDark,
  },
  fieldVisitNotes: {
    fontSize: 12,
    color: clientTheme.colors.textMuted,
    lineHeight: 16,
  },
  emptyNotice: {
    fontSize: 12.5,
    color: clientTheme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  delivItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  delivHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  delivTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: clientTheme.colors.graphite,
    flex: 1,
    marginRight: 8,
  },
  delivStatusPill: {
    backgroundColor: clientTheme.colors.sandstoneDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  delivStatusPillApproved: {
    backgroundColor: '#ecfdf5',
  },
  delivStatusPillSubmitted: {
    backgroundColor: '#fef3c7',
  },
  delivStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: clientTheme.colors.textMuted,
  },
  delivStatusTextApproved: {
    color: clientTheme.colors.emerald,
  },
  delivStatusTextSubmitted: {
    color: clientTheme.colors.goldDark,
  },
  delivMeta: {
    fontSize: 12,
    color: clientTheme.colors.textMuted,
    marginBottom: 8,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: clientTheme.colors.sandstoneDark,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorderDark,
  },
  reviewBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: clientTheme.colors.navy,
    flex: 1,
    marginLeft: 6,
  },
});
