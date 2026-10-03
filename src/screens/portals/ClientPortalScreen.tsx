import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useCrm, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, EmptyState } from '../../components';
import { Project, Quote, Deliverable } from '../../types';
import { Compass, FileText, CheckCircle2, ShieldCheck, LogOut, ChevronRight } from 'lucide-react-native';

export const ClientPortalScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { session, logout } = useAuth();
  const { projects, quotes, documents } = useCrm();

  const [activeTab, setActiveTab] = useState<'projects' | 'quotes' | 'deliverables'>('projects');

  const clientName = session?.accountType === 'client' ? (session as any).name : 'Mining Exploration Client';
  const clientEnquiryId = session?.accountType === 'client' ? (session as any).enquiryId : 'ENQ-2026-081';

  const clientProjects = projects;
  const clientQuotes = quotes;

  // Flatten deliverables from all projects
  const allDeliverables: (Deliverable & { projectTitle: string })[] = [];
  projects.forEach(p => {
    p.deliverables.forEach(d => {
      allDeliverables.push({ ...d, projectTitle: p.title });
    });
  });

  const handleApproveDeliverable = (delivTitle: string) => {
    Alert.alert(
      'Deliverable Approved',
      `You have electronically signed off on technical deliverable "${delivTitle}". Bansal Geo Project Lead notified.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={clientName}
        subtitle={`Enquiry Custody #${clientEnquiryId}`}
        rightAction={
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={16} color={colors.semantic.danger} />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'projects' && styles.tabActive]}
          onPress={() => setActiveTab('projects')}
        >
          <Text style={[styles.tabText, activeTab === 'projects' && styles.tabTextActive]}>
            Projects ({clientProjects.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'quotes' && styles.tabActive]}
          onPress={() => setActiveTab('quotes')}
        >
          <Text style={[styles.tabText, activeTab === 'quotes' && styles.tabTextActive]}>
            Quotes ({clientQuotes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'deliverables' && styles.tabActive]}
          onPress={() => setActiveTab('deliverables')}
        >
          <Text style={[styles.tabText, activeTab === 'deliverables' && styles.tabTextActive]}>
            Deliverables ({allDeliverables.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <>
            {clientProjects.map(p => (
              <Card key={p.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.codeText}>{p.projectCode}</Text>
                  <StatusBadge status={`Stage ${p.currentStage}`} size="small" />
                </View>

                <Text style={styles.title}>{p.title}</Text>
                <Text style={styles.subText}>{p.location} • {p.stageName}</Text>

                <View style={styles.progressRow}>
                  <Text style={styles.progLabel}>Completion Stage {p.currentStage} of 7</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${(p.currentStage / 7) * 100}%` }]} />
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Quotes Tab */}
        {activeTab === 'quotes' && (
          <>
            {clientQuotes.map(q => (
              <Card key={q.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.codeText}>{q.quoteNo}</Text>
                  <StatusBadge status={q.status} size="small" />
                </View>

                <Text style={styles.title}>{q.projectTitle}</Text>
                <Text style={styles.subText}>Date: {q.date}</Text>

                <View style={styles.quoteFinRow}>
                  <Text style={styles.quoteFinLabel}>Total Commercial Value (Inc. GST):</Text>
                  <Text style={styles.quoteFinVal}>₹{q.total.toLocaleString('en-IN')}</Text>
                </View>

                {q.status === 'Sent' && (
                  <Button
                    title="Accept & Confirm Quotation"
                    variant="primary"
                    size="small"
                    onPress={() => Alert.alert('Quotation Accepted', 'Thank you! Contract agreement generated.')}
                    style={{ marginTop: spacing.sm }}
                  />
                )}
              </Card>
            ))}
          </>
        )}

        {/* Deliverables Tab */}
        {activeTab === 'deliverables' && (
          <>
            {allDeliverables.map(d => (
              <Card key={d.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.codeText}>{d.version}</Text>
                  <StatusBadge status={d.status} size="small" />
                </View>

                <Text style={styles.title}>{d.title}</Text>
                <Text style={styles.subText}>{d.projectTitle}</Text>
                <Text style={styles.fileMeta}>File: {d.fileName} ({d.fileSize || '14.2 MB'})</Text>

                {d.status === 'Submitted' && (
                  <Button
                    title="Review & Sign Off Deliverable"
                    variant="primary"
                    size="small"
                    leftIcon={<ShieldCheck size={16} color="#FFFFFF" />}
                    onPress={() => handleApproveDeliverable(d.title)}
                    style={{ marginTop: spacing.sm }}
                  />
                )}
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  logoutBtn: {
    padding: spacing.xs,
    backgroundColor: `${colors.semantic.danger}15`,
    borderRadius: borderRadius.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing.lg,
  },
  tab: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  codeText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.tertiary,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 2,
  },
  subText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  progressRow: {
    marginTop: spacing.xs,
    gap: 4,
  },
  progLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  track: {
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  quoteFinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  quoteFinLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  quoteFinVal: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.primary,
  },
  fileMeta: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});
