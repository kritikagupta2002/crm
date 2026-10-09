import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Bell,
  X,
  FileText,
  Receipt,
  GitCommit,
  CheckCircle2,
  ArrowRight,
  BellOff,
} from 'lucide-react-native';
import { clientTheme } from './clientTheme';
import { Project, Deliverable, FinanceInvoice } from '../../../types';

export interface ClientNotificationItem {
  id: string;
  type: 'deliverable' | 'invoice' | 'milestone' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  isUnread: boolean;
  priority: 'high' | 'normal';
  targetId?: string;
  deliverableData?: Deliverable & { projectTitle: string; projectCode?: string };
  invoiceData?: FinanceInvoice;
  projectData?: Project;
}

interface ClientNotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  projects: Project[];
  deliverables: Array<Deliverable & { projectTitle: string; projectCode?: string }>;
  invoices: FinanceInvoice[];
  onSelectDeliverable: (d: Deliverable & { projectTitle: string; projectCode?: string }) => void;
  onSelectInvoice: (inv: FinanceInvoice) => void;
  onSelectProject: (p: Project) => void;
}

export function ClientNotificationsModal({
  visible,
  onClose,
  projects,
  deliverables,
  invoices,
  onSelectDeliverable,
  onSelectInvoice,
  onSelectProject,
}: ClientNotificationsModalProps) {
  const [filterType, setFilterType] = useState<'all' | 'deliverable' | 'invoice' | 'milestone'>('all');

  // Derive genuine client notifications dynamically from isolated datasets
  const notifications = useMemo<ClientNotificationItem[]>(() => {
    const list: ClientNotificationItem[] = [];

    // 1. Deliverables awaiting client sign-off
    deliverables.forEach((d) => {
      if (d.status === 'Submitted' || d.status === 'Draft') {
        list.push({
          id: `notif-del-${d.id}`,
          type: 'deliverable',
          title: 'Deliverable Awaiting Sign-Off',
          description: `"${d.title}" for ${d.projectTitle} has been submitted by Bansal Geo for your review and approval.`,
          timestamp: d.submissionDate || 'Recently',
          isUnread: true,
          priority: 'high',
          targetId: d.id,
          deliverableData: d,
        });
      } else if (d.status === 'Client Approved') {
        list.push({
          id: `notif-del-app-${d.id}`,
          type: 'deliverable',
          title: 'Sign-Off Recorded',
          description: `Deliverable "${d.title}" is officially approved and signed off for ${d.projectTitle}.`,
          timestamp: d.submissionDate || 'Completed',
          isUnread: false,
          priority: 'normal',
          targetId: d.id,
          deliverableData: d,
        });
      }
    });

    // 2. Pending Invoices & Due dates
    invoices.forEach((inv) => {
      if (inv.status !== 'Paid') {
        list.push({
          id: `notif-inv-${inv.id}`,
          type: 'invoice',
          title: `Tax Invoice Pending: ₹${inv.totalAmount.toLocaleString('en-IN')}`,
          description: `Invoice #${inv.invoiceNo} due on ${inv.dueDate}. Instant UPI settlement is available.`,
          timestamp: inv.date,
          isUnread: true,
          priority: 'high',
          targetId: inv.id,
          invoiceData: inv,
        });
      } else {
        list.push({
          id: `notif-inv-pd-${inv.id}`,
          type: 'payment',
          title: `Payment Receipt: ${inv.invoiceNo}`,
          description: `Remittance of ₹${inv.totalAmount.toLocaleString('en-IN')} confirmed. Bank payment voucher issued.`,
          timestamp: inv.date,
          isUnread: false,
          priority: 'normal',
          targetId: inv.id,
          invoiceData: inv,
        });
      }
    });

    // 3. Project Milestones & Lifecycle stages
    projects.forEach((p) => {
      const stageName = [
        '',
        'Allocation',
        'Planning',
        'Task Execution',
        'Deliverable Submission',
        'Client Approval',
        'Invoicing',
        'Project Closure',
      ][p.currentStage || 1];

      list.push({
        id: `notif-proj-${p.id}`,
        type: 'milestone',
        title: `Stage ${p.currentStage || 1}: ${stageName}`,
        description: `${p.title} (${p.projectCode || p.id}) is actively progressing at ${p.location || 'site'}.`,
        timestamp: p.startDate || 'Active',
        isUnread: false,
        priority: 'normal',
        targetId: p.id,
        projectData: p,
      });
    });

    return list;
  }, [deliverables, invoices, projects]);

  const filteredNotifications = useMemo(() => {
    if (filterType === 'all') return notifications;
    return notifications.filter((n) => n.type === filterType);
  }, [notifications, filterType]);

  const handleNotificationPress = (item: ClientNotificationItem) => {
    onClose();
    if (item.deliverableData) {
      onSelectDeliverable(item.deliverableData);
    } else if (item.invoiceData) {
      onSelectInvoice(item.invoiceData);
    } else if (item.projectData) {
      onSelectProject(item.projectData);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={styles.modalCard}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.iconBadge}>
                <Bell size={20} color={clientTheme.colors.navy} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Portal Notifications</Text>
                <Text style={styles.headerSubtitle}>
                  {notifications.filter((n) => n.isUnread).length} unread updates requiring attention
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color={clientTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.filterPill, filterType === 'all' && styles.filterPillActive]}
                onPress={() => setFilterType('all')}
              >
                <Text style={[styles.filterPillText, filterType === 'all' && styles.filterPillTextActive]}>
                  All Updates ({notifications.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, filterType === 'deliverable' && styles.filterPillActive]}
                onPress={() => setFilterType('deliverable')}
              >
                <FileText
                  size={14}
                  color={filterType === 'deliverable' ? clientTheme.colors.surface : clientTheme.colors.gold}
                />
                <Text style={[styles.filterPillText, filterType === 'deliverable' && styles.filterPillTextActive]}>
                  Deliverables
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, filterType === 'invoice' && styles.filterPillActive]}
                onPress={() => setFilterType('invoice')}
              >
                <Receipt
                  size={14}
                  color={filterType === 'invoice' ? clientTheme.colors.surface : clientTheme.colors.crimson}
                />
                <Text style={[styles.filterPillText, filterType === 'invoice' && styles.filterPillTextActive]}>
                  Invoices
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, filterType === 'milestone' && styles.filterPillActive]}
                onPress={() => setFilterType('milestone')}
              >
                <GitCommit
                  size={14}
                  color={filterType === 'milestone' ? clientTheme.colors.surface : clientTheme.colors.teal}
                />
                <Text style={[styles.filterPillText, filterType === 'milestone' && styles.filterPillTextActive]}>
                  Milestones
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Notifications List */}
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyWrap}>
                <BellOff size={48} color={clientTheme.colors.textTertiary} />
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptyDesc}>You are completely up to date with your exploration portfolio.</Text>
              </View>
            ) : (
              filteredNotifications.map((notif) => {
                const getIconConfig = () => {
                  switch (notif.type) {
                    case 'deliverable':
                      return { icon: FileText, color: clientTheme.colors.gold, bg: clientTheme.colors.goldSubtle };
                    case 'invoice':
                      return { icon: Receipt, color: clientTheme.colors.crimson, bg: clientTheme.colors.crimsonSubtle };
                    case 'milestone':
                      return { icon: GitCommit, color: clientTheme.colors.teal, bg: clientTheme.colors.tealSubtle };
                    case 'payment':
                      return { icon: CheckCircle2, color: clientTheme.colors.emerald, bg: clientTheme.colors.emeraldSubtle };
                  }
                };
                const iconCfg = getIconConfig();
                const IconComponent = iconCfg.icon;

                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={[
                      styles.notifCard,
                      notif.isUnread && styles.notifCardUnread,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleNotificationPress(notif)}
                  >
                    <View style={[styles.cardIconWrap, { backgroundColor: iconCfg.bg }]}>
                      <IconComponent size={22} color={iconCfg.color} />
                    </View>

                    <View style={styles.cardContent}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {notif.title}
                        </Text>
                        {notif.isUnread && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {notif.description}
                      </Text>
                      <View style={styles.cardFooterRow}>
                        <Text style={styles.cardTime}>{notif.timestamp}</Text>
                        <View style={styles.actionPrompt}>
                          <Text style={styles.actionPromptText}>Inspect</Text>
                          <ArrowRight size={12} color={clientTheme.colors.navy} />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 37, 69, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: clientTheme.colors.surface,
    borderTopLeftRadius: clientTheme.radius.xl,
    borderTopRightRadius: clientTheme.radius.xl,
    maxHeight: '85%',
    minHeight: '55%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: clientTheme.colors.sandstoneBorder,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: clientTheme.radius.md,
    backgroundColor: clientTheme.colors.navySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: clientTheme.typography.titleLg,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  headerSubtitle: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: clientTheme.radius.full,
    backgroundColor: clientTheme.colors.sandstone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: clientTheme.colors.sandstoneBorder,
    backgroundColor: clientTheme.colors.sandstone,
  },
  filterScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    color: clientTheme.colors.surface,
    fontWeight: '700',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: 18,
    gap: 12,
  },
  notifCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: clientTheme.radius.md,
    backgroundColor: clientTheme.colors.surface,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: '#f8fafc',
    borderColor: clientTheme.colors.teal,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: clientTheme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '700',
    color: clientTheme.colors.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: clientTheme.colors.teal,
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTime: {
    fontSize: clientTheme.typography.badge,
    color: clientTheme.colors.textMuted,
    fontWeight: '500',
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionPromptText: {
    fontSize: clientTheme.typography.badge,
    fontWeight: '700',
    color: clientTheme.colors.navy,
  },
  emptyWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: clientTheme.typography.titleLg,
    fontWeight: '700',
    color: clientTheme.colors.navy,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  doneBtn: {
    height: 48,
    borderRadius: clientTheme.radius.md,
    backgroundColor: clientTheme.colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: clientTheme.typography.bodyMd,
    fontWeight: '700',
    color: clientTheme.colors.surface,
  },
});
