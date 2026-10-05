import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
  Modal,
} from 'react-native';
import {
  Building,
  Phone,
  Mail,
  UserPlus,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Clock,
  FileText,
  Plus,
  ArrowRight,
  XCircle,
  HelpCircle,
  FileCheck,
  Send,
  X,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button, Input, SegmentedControl } from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { formatCurrency, normalisePhone } from '../../utils';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { LeadStage, FollowUp } from '../../types';

interface LeadDetailScreenProps {
  route: any;
  navigation: any;
}

export const LeadDetailScreen: React.FC<LeadDetailScreenProps> = ({ route, navigation }) => {
  const { leadId } = route.params;
  const { leads, followUps, quotes, updateLeadStage, scheduleFollowUp, completeFollowUp } = useCrm();
  const { can } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'followups' | 'queries'>('overview');
  const tabs = ['Overview', 'Quotation', 'Follow-ups', 'Queries'];

  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [fuType, setFuType] = useState<'Call' | 'Meeting' | 'Site Visit' | 'Presentation' | 'Review'>('Call');
  const [fuDate, setFuDate] = useState(new Date().toISOString().split('T')[0]);
  const [fuTime, setFuTime] = useState('11:00');
  const [fuNote, setFuNote] = useState('');

  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');

  const lead = leads.find((l) => l.id === leadId);

  if (!lead) {
    return (
      <ScreenContainer scrollable={false}>
        <AppHeader title="Lead Details" showBack onBack={() => navigation.goBack()} />
        <View style={styles.notFound}>
          <Text style={{ color: colors.textSecondary }}>Lead record not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const STAGES: LeadStage[] = [
    'New Enquiry' as LeadStage,
    'Contacted',
    'Qualified',
    'Proposal Sent',
    'Negotiation',
    'Won',
    'Lost',
  ];

  const leadFollowUps = followUps.filter((f) => f.leadId === lead.id);
  const leadQuote = quotes.find((q) => q.leadId === lead.id || q.clientName === lead.company);

  const openDialer = (ph: string) => {
    Linking.openURL(`tel:+91${normalisePhone(ph)}`);
  };

  const openWhatsApp = (ph: string, name: string) => {
    const text = encodeURIComponent(
      `Hello ${name}, this is ${lead.assignedTo || 'Bansal Geo'} regarding your exploration enquiry.`
    );
    Linking.openURL(`whatsapp://send?phone=91${normalisePhone(ph)}&text=${text}`);
  };

  const handleStageSelect = async (st: LeadStage) => {
    if (st === 'Lost') {
      setShowLostModal(true);
      return;
    }
    try {
      await updateLeadStage(leadId, st);
      Alert.alert('Stage Updated', `Lead moved to ${st}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleConfirmLost = async () => {
    if (!lostReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason why this lead was lost.');
      return;
    }
    try {
      await updateLeadStage(leadId, 'Lost', { lostReason: lostReason.trim() });
      setShowLostModal(false);
      setLostReason('');
      Alert.alert('Lead Updated', 'Lead has been marked as Lost.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAddFollowUp = async () => {
    if (!fuNote.trim()) {
      Alert.alert('Note Required', 'Please enter follow-up objective or discussion notes.');
      return;
    }
    try {
      await scheduleFollowUp({
        leadId: lead.id,
        clientName: lead.company,
        title: `${fuType} with ${lead.contactPerson || lead.contactName}`,
        date: fuDate,
        time: fuTime,
        interactionType: fuType as any,
        type: fuType,
        note: fuNote.trim(),
        notes: fuNote.trim(),
      });
      setShowAddFollowUp(false);
      setFuNote('');
      Alert.alert('Follow-Up Scheduled', `Follow-up set for ${fuDate} at ${fuTime}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title={lead.company}
          subtitle={`${lead.id} • ${lead.assignedTo}`}
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Card style={styles.topCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.leadTitle}>{lead.title}</Text>
          <StatusBadge status={lead.stage} />
        </View>

        <Text style={styles.serviceLineText}>{lead.serviceDetail || lead.service || 'Mineral Exploration'}</Text>

        <View style={styles.factsGrid}>
          <View style={styles.factCol}>
            <Text style={styles.factLabel}>EST. VALUE</Text>
            <Text style={styles.factVal}>{formatCurrency(lead.quoteValue || lead.estimatedValue)}</Text>
          </View>
          <View style={styles.factCol}>
            <Text style={styles.factLabel}>MINERAL</Text>
            <Text style={styles.factVal}>{lead.mineral || 'Base Metals'}</Text>
          </View>
          <View style={styles.factCol}>
            <Text style={styles.factLabel}>PRIORITY</Text>
            <Text style={[styles.factVal, { color: lead.priority === 'High' ? colors.danger : colors.primary }]}>
              {lead.priority || 'Medium'}
            </Text>
          </View>
        </View>
      </Card>

      {(lead.stage === 'Qualified' || lead.stage === 'Proposal Sent' || lead.stage === 'Won') && (
        <Card style={styles.convertCard}>
          <View style={styles.convertRow}>
            <View style={styles.convertInfo}>
              <Text style={styles.convertTitle}>Ready for Project Conversion?</Text>
              <Text style={styles.convertSubtitle}>
                Convert this lead into an official Client Master record and auto-create an ERM Project execution draft.
              </Text>
            </View>
          </View>
          <Button
            title="Convert to Client & Project Draft"
            onPress={() => navigation.navigate('LeadConversion', { leadId: lead.id })}
            variant="primary"
            size="md"
            icon={<UserPlus size={16} color={colors.textInverse} />}
            style={styles.convertBtn}
          />
        </Card>
      )}

      <View style={styles.tabBar}>
        {tabs.map((t, idx) => {
          const key = (['overview', 'quotes', 'followups', 'queries'] as const)[idx];
          const isSelected = activeTab === key;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabItem, isSelected ? styles.tabItemActive : null]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[styles.tabText, isSelected ? styles.tabTextActive : null]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'overview' && (
        <>
          <Card>
            <Text style={styles.sectionTitle}>Client Point of Contact</Text>
            <View style={styles.contactDetailsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactPersonName}>{lead.contactPerson || lead.contactName}</Text>
                <Text style={styles.contactClientType}>{lead.clientType || 'Corporate'} • {lead.location || 'Rajasthan'}</Text>
                <Text style={styles.contactSubText}>{lead.email}</Text>
                <Text style={styles.contactPhone}>+91 {normalisePhone(lead.phone)}</Text>
              </View>

              <View style={styles.contactActionCol}>
                <TouchableOpacity style={styles.dialBtn} onPress={() => openDialer(lead.phone)}>
                  <Phone size={16} color={colors.primary} />
                  <Text style={styles.dialBtnText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.waBtn} onPress={() => openWhatsApp(lead.phone, lead.contactName)}>
                  <MessageCircle size={16} color="#ffffff" />
                  <Text style={styles.waBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Pipeline Stage Progression</Text>
            <View style={styles.stageChipsRow}>
              {STAGES.map((st) => {
                const isCurrent = lead.stage === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.stageChip, isCurrent ? styles.stageChipActive : null]}
                    onPress={() => handleStageSelect(st)}
                  >
                    <Text style={[styles.stageChipText, isCurrent ? styles.stageChipTextActive : null]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Exploration Requirements & Description</Text>
            <Text style={styles.descText}>{lead.description || lead.notes || 'No description entered.'}</Text>
          </Card>
        </>
      )}

      {activeTab === 'quotes' && (
        <Card>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Commercial Quotation</Text>
            <Button
              title={leadQuote ? "Revise Quote" : "Create Quote"}
              size="sm"
              onPress={() => navigation.navigate('QuoteBuilder', { initialQuoteId: leadQuote?.id })}
            />
          </View>

          {leadQuote ? (
            <View style={styles.quoteDetails}>
              <View style={styles.quoteHeaderRow}>
                <Text style={styles.quoteNumber}>{leadQuote.quoteNo}</Text>
                <StatusBadge status={leadQuote.status} size="sm" />
              </View>
              <Text style={styles.quoteDate}>Date: {leadQuote.date}</Text>

              <View style={styles.quoteTable}>
                {leadQuote.lineItems.map((li, idx) => (
                  <View key={li.id || idx} style={styles.quoteRow}>
                    <Text style={styles.quoteItemDesc} numberOfLines={1}>{li.description}</Text>
                    <Text style={styles.quoteItemRate}>{li.quantity || li.qty || 1} × ₹{(li.rate || 0).toLocaleString('en-IN')}</Text>
                    <Text style={styles.quoteItemAmount}>₹{(li.amount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.quoteTotals}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal Net:</Text>
                  <Text style={styles.totalVal}>₹{leadQuote.subtotal.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>GST (18%):</Text>
                  <Text style={styles.totalVal}>₹{leadQuote.gstAmount.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: colors.border.default, paddingTop: 4 }]}>
                  <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Grand Total:</Text>
                  <Text style={[styles.totalVal, { color: colors.primary, fontWeight: 'bold' }]}>₹{leadQuote.total.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noQuoteBox}>
              <FileText size={32} color={colors.textMuted} />
              <Text style={styles.noQuoteText}>No quotation generated for this enquiry yet.</Text>
              <Button
                title="Open Quotation Builder Wizard"
                size="sm"
                onPress={() => navigation.navigate('QuoteBuilder')}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          )}
        </Card>
      )}

      {activeTab === 'followups' && (
        <Card>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Scheduled Follow-ups ({leadFollowUps.length})</Text>
            <TouchableOpacity
              style={styles.addFuBtn}
              onPress={() => setShowAddFollowUp(true)}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addFuBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {leadFollowUps.map((fu) => (
            <View key={fu.id} style={styles.fuItem}>
              <View style={styles.fuHeader}>
                <Text style={styles.fuTitle}>{fu.title || fu.interactionType}</Text>
                <StatusBadge status={fu.status} size="sm" />
              </View>
              <Text style={styles.fuDate}><Calendar size={12} color={colors.textMuted} /> {fu.date} {fu.time || '11:00'}</Text>
              <Text style={styles.fuNotes}>{fu.notes || fu.note}</Text>

              {fu.status === 'Pending' && (
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => completeFollowUp(fu.id, 'Follow-up marked completed via mobile')}
                >
                  <CheckCircle2 size={14} color={colors.primary} />
                  <Text style={styles.doneBtnText}>Mark Done</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {leadFollowUps.length === 0 && (
            <Text style={styles.noItemsText}>No follow-ups scheduled for this client.</Text>
          )}
        </Card>
      )}

      {activeTab === 'queries' && (
        <Card>
          <Text style={styles.sectionTitle}>Client Portal Inquiries</Text>
          <Text style={styles.noItemsText}>All queries from client portal will appear here with instant reply thread.</Text>
        </Card>
      )}

      <Modal visible={showAddFollowUp} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.fuModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Follow-up</Text>
              <TouchableOpacity onPress={() => setShowAddFollowUp(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Interaction Type</Text>
            <View style={styles.fuTypeRow}>
              {(['Call', 'Meeting', 'Site Visit', 'Review'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.fuTypeBtn, fuType === t ? styles.fuTypeBtnActive : null]}
                  onPress={() => setFuType(t)}
                >
                  <Text style={[styles.fuTypeText, fuType === t ? styles.fuTypeTextActive : null]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Scheduled Date (YYYY-MM-DD)"
              value={fuDate}
              onChangeText={setFuDate}
            />

            <Input
              label="Time"
              value={fuTime}
              onChangeText={setFuTime}
            />

            <Input
              label="Objective / Discussion Note"
              placeholder="e.g. Discuss revised line items rate..."
              value={fuNote}
              onChangeText={setFuNote}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Schedule Follow-up"
              onPress={handleAddFollowUp}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showLostModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.fuModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark Lead as Lost</Text>
              <TouchableOpacity onPress={() => setShowLostModal(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label="Reason for Lost Deal"
              placeholder="e.g. Client opted for lower rate competitor..."
              value={lostReason}
              onChangeText={setLostReason}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Confirm Mark as Lost"
              variant="danger"
              onPress={handleConfirmLost}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCard: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  leadTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  serviceLineText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing.md,
  },
  factsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  factCol: {
    flex: 1,
    alignItems: 'center',
  },
  factLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 2,
  },
  factVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  convertCard: {
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: spacing.sm,
  },
  convertRow: {
    marginBottom: spacing.xs,
  },
  convertInfo: {
    flex: 1,
  },
  convertTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  convertSubtitle: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    lineHeight: 14,
  },
  convertBtn: {
    marginTop: spacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.sm,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  tabTextActive: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  contactDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactPersonName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  contactClientType: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactSubText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 2,
  },
  contactPhone: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    marginTop: 4,
  },
  contactActionCol: {
    gap: spacing.xs,
    justifyContent: 'center',
  },
  dialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  dialBtnText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  waBtnText: {
    fontSize: typography.fontSizes.xs,
    color: '#ffffff',
    fontWeight: typography.fontWeights.bold,
  },
  stageChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  stageChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  stageChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stageChipText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
  },
  stageChipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
  },
  descText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quoteDetails: {
    marginTop: spacing.xs,
  },
  quoteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteNumber: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  quoteDate: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  quoteTable: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.xs,
    marginVertical: spacing.xs,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  quoteItemDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    flex: 2,
  },
  quoteItemRate: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    flex: 1,
    textAlign: 'center',
  },
  quoteItemAmount: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  quoteTotals: {
    marginTop: spacing.xs,
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  totalVal: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
  },
  noQuoteBox: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noQuoteText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  addFuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addFuBtnText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  fuItem: {
    backgroundColor: colors.background.primary,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  fuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  fuTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  fuDate: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginBottom: 4,
  },
  fuNotes: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  doneBtnText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  noItemsText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  fuModalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  formLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fuTypeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  fuTypeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  fuTypeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  fuTypeText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
  },
  fuTypeTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});
