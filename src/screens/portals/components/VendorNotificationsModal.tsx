import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import {
  X,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Gavel,
  ShieldCheck,
  ChevronRight,
  IndianRupee,
} from 'lucide-react-native';
import { vendorTheme } from './vendorTheme';
import { Tender, WorkOrder, SealedBid } from '../../../types';
import { closingOf } from '../../../constants/vendor';

export interface VendorNotificationItem {
  id: string;
  type: 'tender' | 'bid' | 'order' | 'bill' | 'clarification';
  title: string;
  message: string;
  time: string;
  read: boolean;
  targetScreen?: 'TenderDetail' | 'WorkOrderDetail';
  targetParams?: { tenderId?: string; woId?: string };
}

interface VendorNotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  openTenders: Tender[];
  myBids: Array<{ tender: Tender; bid: SealedBid }>;
  myWorkOrders: WorkOrder[];
  navigation: any;
}

export const VendorNotificationsModal: React.FC<VendorNotificationsModalProps> = ({
  visible,
  onClose,
  openTenders,
  myBids,
  myWorkOrders,
  navigation,
}) => {
  const [filter, setFilter] = useState<'all' | 'tenders' | 'orders' | 'bills'>('all');

  // Build real contextual notifications from active vendor records
  const notifications: VendorNotificationItem[] = [];

  // 1. Tenders closing soon
  openTenders.slice(0, 3).forEach((t) => {
    const closeStr = closingOf(t);
    const hoursLeft = Math.round((new Date(closeStr).getTime() - Date.now()) / (1000 * 3600));
    notifications.push({
      id: `notif-tender-${t.id}`,
      type: 'tender',
      title: hoursLeft <= 48 ? 'Tender Closing Soon' : 'Active Procurement Notice',
      message: `${t.title} (${t.tenderNo || t.id}) submission deadline approaching.`,
      time: hoursLeft > 0 ? `${hoursLeft} hrs left` : 'Closed',
      read: false,
      targetScreen: 'TenderDetail',
      targetParams: { tenderId: t.id },
    });
  });

  // 2. Bids status
  myBids.forEach(({ tender, bid }) => {
    notifications.push({
      id: `notif-bid-${bid.id}`,
      type: 'bid',
      title: bid.status === 'Allotted' ? 'Tender Allotted To Your Firm' : 'Sealed Bid Escrow Confirmation',
      message:
        bid.status === 'Allotted'
          ? `Congratulations! Your bid ${bid.id} for ${tender.title} has been accepted.`
          : `Bid ${bid.id} is encrypted in dual-key escrow. Opening scheduled on tender opening date.`,
      time: bid.submissionDate || 'Recently',
      read: true,
      targetScreen: 'TenderDetail',
      targetParams: { tenderId: tender.id },
    });
  });

  // 3. Work Orders
  myWorkOrders.forEach((wo) => {
    if (wo.currentStage === 'Issued') {
      notifications.push({
        id: `notif-wo-issued-${wo.id}`,
        type: 'order',
        title: 'Work Order Issued - Mobilization Required',
        message: `${wo.woNumber}: Please confirm site mobilization and equipment deployment.`,
        time: wo.issuedOn || 'Recent',
        read: false,
        targetScreen: 'WorkOrderDetail',
        targetParams: { woId: wo.id },
      });
    } else if (wo.currentStage === 'Billed' || wo.currentStage === 'Verified') {
      notifications.push({
        id: `notif-wo-bill-${wo.id}`,
        type: 'bill',
        title: wo.currentStage === 'Verified' ? 'Invoice 3-Way Verified' : 'Invoice Under Audit',
        message: `${wo.woNumber}: Milestone bill ₹${(wo.billedAmount || 0).toLocaleString('en-IN')} queued for Accounts verification.`,
        time: 'In Progress',
        read: false,
        targetScreen: 'WorkOrderDetail',
        targetParams: { woId: wo.id },
      });
    } else if (wo.currentStage === 'Paid') {
      notifications.push({
        id: `notif-wo-paid-${wo.id}`,
        type: 'bill',
        title: 'Payment Disbursed via NEFT',
        message: `${wo.woNumber}: Net ₹${(wo.paidAmount || 0).toLocaleString('en-IN')} remitted. 2% Section 194C TDS certificate available.`,
        time: 'Settled',
        read: true,
        targetScreen: 'WorkOrderDetail',
        targetParams: { woId: wo.id },
      });
    }
  });

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'tenders') return n.type === 'tender' || n.type === 'bid';
    if (filter === 'orders') return n.type === 'order';
    if (filter === 'bills') return n.type === 'bill';
    return true;
  });

  const handleNotificationPress = (item: VendorNotificationItem) => {
    onClose();
    if (item.targetScreen && item.targetParams) {
      navigation.navigate(item.targetScreen, item.targetParams);
    }
  };

  const getIcon = (type: VendorNotificationItem['type']) => {
    switch (type) {
      case 'tender':
        return <Gavel size={20} color={vendorTheme.colors.amberDark} />;
      case 'bid':
        return <ShieldCheck size={20} color={vendorTheme.colors.tealDark} />;
      case 'order':
        return <AlertCircle size={20} color={vendorTheme.colors.navy} />;
      case 'bill':
        return <IndianRupee size={20} color={vendorTheme.colors.emerald} />;
      default:
        return <Bell size={20} color={vendorTheme.colors.textMuted} />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleCol}>
              <Text style={styles.sheetTitle}>Vendor Alerts & Inquiries</Text>
              <Text style={styles.sheetSubtitle}>
                Procurement deadlines, work orders & billing updates
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={vendorTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {(['all', 'tenders', 'orders', 'bills'] as const).map((tabKey) => {
              const active = filter === tabKey;
              const labels = {
                all: 'All',
                tenders: 'Tenders & Bids',
                orders: 'Orders',
                bills: 'Billing & TDS',
              };
              return (
                <TouchableOpacity
                  key={tabKey}
                  onPress={() => setFilter(tabKey)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                    {labels[tabKey]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notifications List */}
          <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Bell size={40} color={vendorTheme.colors.textTertiary} />
                <Text style={styles.emptyTitle}>No pending alerts</Text>
                <Text style={styles.emptySub}>
                  All procurement notices and invoices are up to date.
                </Text>
              </View>
            ) : (
              filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  onPress={() => handleNotificationPress(item)}
                  style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                >
                  <View style={styles.notifIconBox}>{getIcon(item.type)}</View>

                  <View style={styles.notifContent}>
                    <View style={styles.notifTopLine}>
                      <Text style={styles.notifTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.notifTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.notifMessage} numberOfLines={2}>
                      {item.message}
                    </Text>
                  </View>

                  <ChevronRight size={18} color={vendorTheme.colors.textTertiary} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 26, 50, 0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: vendorTheme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 18,
    maxHeight: '82%',
    ...vendorTheme.shadows.lg,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: vendorTheme.colors.sandstoneBorderDark,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleCol: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
    letterSpacing: -0.2,
  },
  sheetSubtitle: {
    fontSize: 12.5,
    color: vendorTheme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: vendorTheme.colors.sandstoneDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: vendorTheme.colors.sandstoneDark,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
  },
  filterPillActive: {
    backgroundColor: vendorTheme.colors.navy,
    borderColor: vendorTheme.colors.navy,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: vendorTheme.colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listScroll: {
    marginBottom: 20,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: vendorTheme.colors.sandstone,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    marginBottom: 10,
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: '#ffffff',
    borderColor: vendorTheme.colors.navy,
  },
  notifIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: vendorTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
  },
  notifContent: {
    flex: 1,
  },
  notifTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    fontSize: 11.5,
    fontWeight: '700',
    color: vendorTheme.colors.amberDark,
  },
  notifMessage: {
    fontSize: 12.5,
    color: vendorTheme.colors.textSecondary,
    lineHeight: 17,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 44,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginTop: 6,
  },
  emptySub: {
    fontSize: 13,
    color: vendorTheme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
});
