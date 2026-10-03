import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useCrm, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, Input, EmptyState } from '../../components';
import { GovtDocument, DispatchRecord } from '../../types';
import {
  Send,
  Truck,
  Search,
  Plus,
  MapPin,
  Hash,
  Package,
  PackageCheck,
  Clock,
  X,
  ChevronRight,
  Calendar,
  Building,
} from 'lucide-react-native';
import { DISPATCH_MODES, DISPATCH_TONE } from '../../constants';

const TABS = ['To dispatch', 'On the way', 'Received', 'All'] as const;

export const DispatchRegisterScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
  route,
}) => {
  const {
    govtDocuments,
    dispatches,
    dispatchGovtDocument,
    receiveGovtDocument,
    logDispatch,
    refreshGovtDocuments,
    isLoading,
  } = useCrm();
  const { session } = useAuth();
  const currentUserName = (session as any)?.name || (session as any)?.contactPerson || 'Active User';


  const initialTab = route?.params?.tab || 'To dispatch';
  const [selectedTab, setSelectedTab] = useState<string>(initialTab);
  const [search, setSearch] = useState('');

  // Modals for actions
  const [activeDispatchDoc, setActiveDispatchDoc] = useState<GovtDocument | null>(null);
  const [activeReceiveDoc, setActiveReceiveDoc] = useState<GovtDocument | null>(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // Dispatch action form state
  const [courierMode, setCourierMode] = useState<string>(DISPATCH_MODES[0]);
  const [waybillDocket, setWaybillDocket] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);

  // Receive action form state
  const [receivedByName, setReceivedByName] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);

  // Custom dispatch form state
  const [customTitle, setCustomTitle] = useState('');
  const [customRecipient, setCustomRecipient] = useState('');
  const [customOrg, setCustomOrg] = useState('');
  const [customDest, setCustomDest] = useState('');
  const [customCourier, setCustomCourier] = useState('DTDC Express');
  const [customDocket, setCustomDocket] = useState('');

  // Physical originals from govtDocuments that have dispatch status
  const originals = useMemo(() => {
    return govtDocuments.filter(
      (d) =>
        d.record.access &&
        ['To dispatch', 'Dispatched', 'Received'].includes(d.record.dispatch?.status || '')
    );
  }, [govtDocuments]);

  // Metrics
  const toDispatchCount = originals.filter((d) => d.record.dispatch?.status === 'To dispatch').length;
  const inTransitCount = originals.filter((d) => d.record.dispatch?.status === 'Dispatched').length;
  const receivedCount = originals.filter((d) => d.record.dispatch?.status === 'Received').length;

  // Filtered documents
  const filteredOriginals = useMemo(() => {
    return originals.filter((d) => {
      const status = d.record.dispatch?.status;
      if (selectedTab === 'To dispatch' && status !== 'To dispatch') return false;
      if (selectedTab === 'On the way' && status !== 'Dispatched') return false;
      if (selectedTab === 'Received' && status !== 'Received') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = [
          d.letter.title,
          d.letter.ref,
          d.lead.company,
          d.lead.contactPerson,
          d.project.id,
          d.record.dispatch?.docket,
          d.record.dispatch?.mode,
        ].some((v) => v && v.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [originals, selectedTab, search]);

  const handleConfirmDispatch = async () => {
    if (!activeDispatchDoc) return;
    if (!waybillDocket.trim() && courierMode !== 'By hand') {
      Alert.alert('Docket Required', 'Please enter docket / consignment tracking number.');
      return;
    }

    try {
      await dispatchGovtDocument(
        activeDispatchDoc.id,
        {
          mode: courierMode,
          docket: waybillDocket.trim() || 'By hand messenger',
          on: dispatchDate,
        },
        currentUserName
      );
      setActiveDispatchDoc(null);
      setWaybillDocket('');
      Alert.alert('Dispatched', 'Consignment has been recorded and marked as In Transit.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!activeReceiveDoc) return;
    if (!receivedByName.trim()) {
      Alert.alert('Recipient Required', 'Please enter recipient name.');
      return;
    }

    try {
      await receiveGovtDocument(
        activeReceiveDoc.id,
        {
          receivedBy: receivedByName.trim(),
          on: receivedDate,
        },
        currentUserName
      );
      setActiveReceiveDoc(null);
      setReceivedByName('');
      Alert.alert('Acknowledged', 'Delivery acknowledgement recorded successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCreateCustomDispatch = async () => {
    if (!customTitle.trim() || !customRecipient.trim() || !customDocket.trim()) {
      Alert.alert('Incomplete Form', 'Please provide Document Title, Recipient, and Docket #.');
      return;
    }

    try {
      await logDispatch({
        docId: `DOC-${Date.now()}`,
        docTitle: customTitle.trim(),
        recipientName: customRecipient.trim(),
        recipientOrg: customOrg.trim() || 'Client Office',
        destination: customDest.trim() || 'Office',
        courierName: customCourier.trim(),
        waybillNumber: customDocket.trim(),
        dispatchDate: new Date().toISOString().split('T')[0],
      });

      setShowAddCustomModal(false);
      setCustomTitle('');
      setCustomRecipient('');
      setCustomOrg('');
      setCustomDest('');
      setCustomDocket('');
      Alert.alert('Dispatch Recorded', 'Consignment logged into dispatch register.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const renderOriginalCard = ({ item }: { item: GovtDocument }) => {
    const disp = item.record.dispatch;
    const status = disp?.status || 'To dispatch';
    const isDispatched = status === 'Dispatched';
    const isToDispatch = status === 'To dispatch';

    return (
      <Card style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('DocumentDetail', { docId: item.id })}
        >
          <View style={styles.cardHeader}>
            <View style={styles.tagWrap}>
              <Truck size={14} color={colors.primary} />
              <Text style={styles.courierName}>{disp?.mode || 'Pending Courier'}</Text>
            </View>
            <StatusBadge
              status={status === 'Dispatched' ? 'In Transit' : status}
              size="small"
            />
          </View>

          <Text style={styles.docTitle} numberOfLines={2}>{item.letter.title}</Text>
          <Text style={styles.refSub}>{item.letter.ref} • {item.project.id}</Text>

          <View style={styles.recipientBlock}>
            <Building size={14} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.recipientName}>{item.lead.company}</Text>
              <Text style={styles.recipientSub}>
                Attn: {item.lead.contactPerson} ({item.lead.location || 'HQ'})
              </Text>
            </View>
          </View>

          {/* Transit Details */}
          {disp?.on && (
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Calendar size={12} color={colors.text.tertiary} />
                <Text style={styles.metaText}>Sent: {disp.on}</Text>
              </View>
              <View style={styles.metaItem}>
                <Hash size={12} color={colors.text.tertiary} />
                <Text style={styles.metaText}>Docket: {disp.docket || '—'}</Text>
              </View>
            </View>
          )}

          {disp?.receivedOn && (
            <View style={styles.receivedNotice}>
              <PackageCheck size={14} color={colors.semantic.success} />
              <Text style={styles.receivedNoticeText}>
                Received by {disp.receivedBy} on {disp.receivedOn}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quick Action Footer */}
        {isToDispatch && (
          <View style={styles.cardActionFooter}>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => {
                setActiveDispatchDoc(item);
                setDispatchDate(new Date().toISOString().split('T')[0]);
                setWaybillDocket('');
              }}
            >
              <Truck size={14} color={colors.text.inverse} />
              <Text style={styles.actionBtnPrimaryText}>Record Dispatch</Text>
            </TouchableOpacity>
          </View>
        )}

        {isDispatched && (
          <View style={styles.cardActionFooter}>
            <TouchableOpacity
              style={styles.actionBtnSuccess}
              onPress={() => {
                setActiveReceiveDoc(item);
                setReceivedByName(item.lead.contactPerson || '');
                setReceivedDate(new Date().toISOString().split('T')[0]);
              }}
            >
              <PackageCheck size={14} color={colors.text.inverse} />
              <Text style={styles.actionBtnPrimaryText}>Mark Received by Client</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Dispatch Register"
        subtitle="Physical Consignments & Waybill Tracking"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={

          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => setShowAddCustomModal(true)}
          >
            <Plus size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <TouchableOpacity
          style={[styles.kpiCard, selectedTab === 'To dispatch' && styles.kpiCardActive]}
          onPress={() => setSelectedTab('To dispatch')}
        >
          <Text style={styles.kpiNum}>{toDispatchCount}</Text>
          <Text style={styles.kpiTitle}>To Dispatch</Text>
          <Text style={styles.kpiSub}>In office</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, selectedTab === 'On the way' && styles.kpiCardActive]}
          onPress={() => setSelectedTab('On the way')}
        >
          <Text style={[styles.kpiNum, { color: colors.semantic.info }]}>{inTransitCount}</Text>
          <Text style={styles.kpiTitle}>On the Way</Text>
          <Text style={styles.kpiSub}>In transit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, selectedTab === 'Received' && styles.kpiCardActive]}
          onPress={() => setSelectedTab('Received')}
        >
          <Text style={[styles.kpiNum, { color: colors.semantic.success }]}>{receivedCount}</Text>
          <Text style={styles.kpiTitle}>Received</Text>
          <Text style={styles.kpiSub}>Acknowledged</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={16} color={colors.text.tertiary} style={{ marginRight: spacing.xs }} />
        <Input
          placeholder="Search letter, client, or docket no..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {TABS.map((tab) => {
          const isSelected = selectedTab === tab;
          const count =
            tab === 'To dispatch'
              ? toDispatchCount
              : tab === 'On the way'
              ? inTransitCount
              : tab === 'Received'
              ? receivedCount
              : originals.length;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPill, isSelected && styles.tabPillActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabPillText, isSelected && styles.tabPillTextActive]}>
                {tab}
              </Text>
              <View style={[styles.tabPillBadge, isSelected && styles.tabPillBadgeActive]}>
                <Text style={[styles.tabPillBadgeText, isSelected && styles.tabPillBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Originals FlatList */}
      <FlatList
        data={filteredOriginals}
        keyExtractor={(item) => item.id}
        renderItem={renderOriginalCard}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={refreshGovtDocuments}
        ListEmptyComponent={
          <EmptyState
            icon={<Truck size={48} color={colors.text.tertiary} />}
            title="No dispatches found"
            description={
              selectedTab === 'To dispatch'
                ? 'Every verified original document has already gone out.'
                : 'No consignments match your search.'
            }
          />
        }
      />

      {/* Record Dispatch Modal */}
      <Modal
        visible={Boolean(activeDispatchDoc)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveDispatchDoc(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeadRow}>
              <Text style={styles.modalTitle}>Record Physical Dispatch</Text>
              <TouchableOpacity onPress={() => setActiveDispatchDoc(null)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDocSub}>
              {activeDispatchDoc?.letter.title}
            </Text>
            <Text style={styles.modalRecipient}>
              Deliver to: {activeDispatchDoc?.lead.contactPerson}, {activeDispatchDoc?.lead.company}
            </Text>

            <Text style={styles.inputLabel}>Transit Mode:</Text>
            <View style={styles.modeRow}>
              {DISPATCH_MODES.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeChip, courierMode === m && styles.modeChipActive]}
                  onPress={() => setCourierMode(m)}
                >
                  <Text style={[styles.modeChipText, courierMode === m && styles.modeChipTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label={courierMode === 'By hand' ? 'Carried By (Messenger)' : 'Docket / Consignment No. *'}
              placeholder={courierMode === 'By hand' ? 'e.g. Office Runner A. Kumar' : 'e.g. DTDC D40018873'}
              value={waybillDocket}
              onChangeText={setWaybillDocket}
            />

            <Input
              label="Dispatch Date (YYYY-MM-DD)"
              value={dispatchDate}
              onChangeText={setDispatchDate}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setActiveDispatchDoc(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Dispatch"
                variant="primary"
                onPress={handleConfirmDispatch}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Receipt Modal */}
      <Modal
        visible={Boolean(activeReceiveDoc)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveReceiveDoc(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeadRow}>
              <Text style={styles.modalTitle}>Acknowledge Delivery</Text>
              <TouchableOpacity onPress={() => setActiveReceiveDoc(null)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDocSub}>
              {activeReceiveDoc?.letter.title}
            </Text>

            <Input
              label="Received By (Recipient Name) *"
              value={receivedByName}
              onChangeText={setReceivedByName}
            />

            <Input
              label="Date Received (YYYY-MM-DD) *"
              value={receivedDate}
              onChangeText={setReceivedDate}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setActiveReceiveDoc(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Mark Received"
                variant="primary"
                onPress={handleConfirmReceipt}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Manual Custom Dispatch Modal */}
      <Modal
        visible={showAddCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeadRow}>
              <Text style={styles.modalTitle}>Log Physical Consignment</Text>
              <TouchableOpacity onPress={() => setShowAddCustomModal(false)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, marginBottom: spacing.sm }}>
              <Input
                label="Document / Consignment Title *"
                placeholder="e.g. Original Mining Lease Agreement"
                value={customTitle}
                onChangeText={setCustomTitle}
              />
              <Input
                label="Recipient Name *"
                placeholder="e.g. Shri R. K. Sharma"
                value={customRecipient}
                onChangeText={setCustomRecipient}
              />
              <Input
                label="Recipient Organization"
                placeholder="e.g. Department of Mines & Geology"
                value={customOrg}
                onChangeText={setCustomOrg}
              />
              <Input
                label="Destination Location"
                placeholder="e.g. Udaipur Regional Office"
                value={customDest}
                onChangeText={setCustomDest}
              />
              <Input
                label="Courier Service"
                placeholder="e.g. Speed Post / Blue Dart"
                value={customCourier}
                onChangeText={setCustomCourier}
              />
              <Input
                label="Docket / Waybill Number *"
                placeholder="e.g. ED123456789IN"
                value={customDocket}
                onChangeText={setCustomDocket}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowAddCustomModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Dispatch"
                variant="primary"
                onPress={handleCreateCustomDispatch}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerAddBtn: {
    padding: spacing.xs,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.md,
    paddingBottom: spacing.xs,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
  },
  kpiCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  kpiNum: {
    ...typography.h3,
    color: colors.primary,
  },
  kpiTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: spacing.xs,
  },
  tabsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabPillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabPillTextActive: {
    color: colors.text.inverse,
  },
  tabPillBadge: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },

  tabPillBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabPillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  tabPillBadgeTextActive: {
    color: colors.text.inverse,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courierName: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  docTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  refSub: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  recipientBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
  },
  recipientName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  recipientSub: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
  receivedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  receivedNoticeText: {
    ...typography.caption,
    color: colors.semantic.success,
    fontWeight: '600',
  },
  cardActionFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
  },
  actionBtnSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.semantic.success,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
  },
  actionBtnPrimaryText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    maxHeight: '85%',
  },
  modalHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalDocSub: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalRecipient: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  modeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
  },

  modeChipActive: {
    backgroundColor: colors.primary,
  },
  modeChipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  modeChipTextActive: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
