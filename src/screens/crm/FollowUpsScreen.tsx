import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import {
  CalendarClock,
  Clock,
  CalendarDays,
  CalendarCheck2,
  AlertTriangle,
  Search,
  Check,
  Phone,
  Plus,
  X,
  MessageCircle,
  Calendar,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatCard, StatusBadge, Button, Input } from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { FollowUp } from '../../types';

interface FollowUpsScreenProps {
  navigation: any;
}

export const FollowUpsScreen: React.FC<FollowUpsScreenProps> = ({ navigation }) => {
  const { followUps, leads, completeFollowUp, rescheduleFollowUp, scheduleFollowUp } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [completingItem, setCompletingItem] = useState<FollowUp | null>(null);
  const [outcomeText, setOutcomeText] = useState('');
  const [reschedulingItem, setReschedulingItem] = useState<FollowUp | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('11:00');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newLeadId, setNewLeadId] = useState(leads[0]?.id || '');
  const [newType, setNewType] = useState<'Call' | 'Meeting' | 'Site Visit' | 'Presentation' | 'Review'>('Call');
  const [newFuDate, setNewFuDate] = useState(new Date().toISOString().split('T')[0]);
  const [newFuTime, setNewFuTime] = useState('11:00');
  const [newFuNote, setNewFuNote] = useState('');

  const todayISO = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const types = ['All', 'Call', 'Meeting', 'Site Visit', 'Presentation', 'Review'];

  const GROUPS = [
    { id: 'overdue', label: 'Overdue', color: colors.danger, test: (d: string) => d < todayISO },
    { id: 'today', label: 'Today', color: colors.warning, test: (d: string) => d === todayISO },
    { id: 'tomorrow', label: 'Tomorrow', color: colors.info, test: (d: string) => d === tomorrow },
    { id: 'week', label: 'This Week', color: colors.primary, test: (d: string) => d > tomorrow && d <= weekEnd },
    { id: 'later', label: 'Later', color: colors.textSecondary, test: (d: string) => d > weekEnd },
  ];

  const counts = useMemo(() => {
    const overdue = followUps.filter((f) => f.status === 'Pending' && f.date < todayISO).length;
    const today = followUps.filter((f) => f.status === 'Pending' && f.date === todayISO).length;
    const next7Days = followUps.filter((f) => f.status === 'Pending' && f.date > todayISO && f.date <= weekEnd).length;
    const completed = followUps.filter((f) => f.status === 'Completed').length;
    return { overdue, today, next7Days, completed };
  }, [followUps, todayISO, weekEnd]);

  const filteredFollowUps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return followUps
      .filter((f) => {
        const typeMatch = selectedType === 'All' || f.type === selectedType || f.interactionType === selectedType;
        const searchMatch =
          !q ||
          f.clientName.toLowerCase().includes(q) ||
          (f.note || f.notes || '').toLowerCase().includes(q) ||
          (f.title || '').toLowerCase().includes(q) ||
          (f.leadId || '').toLowerCase().includes(q);
        return typeMatch && searchMatch;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [followUps, selectedType, searchQuery]);

  const handleMarkDone = async () => {
    if (!completingItem) return;
    try {
      await completeFollowUp(completingItem.id, outcomeText.trim() || 'Follow-up marked completed via mobile.');
      setCompletingItem(null);
      setOutcomeText('');
      Alert.alert('Follow-Up Completed', 'Outcome has been recorded.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleReschedule = async () => {
    if (!reschedulingItem) return;
    if (!newDate.trim()) {
      Alert.alert('Date Required', 'Please enter a valid date (YYYY-MM-DD).');
      return;
    }
    try {
      await rescheduleFollowUp(reschedulingItem.id, newDate.trim(), newTime.trim() || '11:00');
      setReschedulingItem(null);
      setNewDate('');
      Alert.alert('Rescheduled', `Follow-up moved to ${newDate}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCreateFollowUp = async () => {
    if (!newFuNote.trim()) {
      Alert.alert('Note Required', 'Please enter follow-up objective or discussion note.');
      return;
    }
    const lead = leads.find((l) => l.id === newLeadId) || leads[0];
    try {
      await scheduleFollowUp({
        leadId: lead?.id,
        clientName: lead?.company || 'Exploration Client',
        title: `${newType} with ${lead?.contactPerson || lead?.contactName || 'Representative'}`,
        date: newFuDate,
        time: newFuTime,
        interactionType: newType as any,
        type: newType,
        note: newFuNote.trim(),
        notes: newFuNote.trim(),
      });
      setShowAddModal(false);
      setNewFuNote('');
      Alert.alert('Follow-Up Added', 'New interaction scheduled.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title="Client Follow-ups"
          subtitle="Scheduled client interactions & communication logs"
          showBack
          onBack={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity
              style={styles.addHeaderBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={18} color={colors.textInverse} />
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={styles.statGrid}>
        <StatCard
          title="Overdue"
          value={counts.overdue}
          subtitle="Need attention first"
          icon={<AlertTriangle size={18} color={colors.danger} />}
          color={colors.danger}
        />
        <StatCard
          title="Due Today"
          value={counts.today}
          subtitle={todayISO}
          icon={<Clock size={18} color={colors.warning} />}
          color={colors.warning}
        />
      </View>

      <View style={styles.statGrid}>
        <StatCard
          title="Next 7 Days"
          value={counts.next7Days}
          subtitle="Upcoming schedule"
          icon={<CalendarDays size={18} color={colors.info} />}
          color={colors.info}
        />
        <StatCard
          title="Completed"
          value={counts.completed}
          subtitle="Interactions logged"
          icon={<CalendarCheck2 size={18} color={colors.primary} />}
          color={colors.primary}
        />
      </View>

      <Input
        placeholder="Search client, note or enquiry ID..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={<Search size={16} color={colors.textMuted} />}
        containerStyle={styles.searchBar}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeFilterRow}>
        {types.map((t) => {
          const isSelected = selectedType === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, isSelected ? styles.typeChipActive : null]}
              onPress={() => setSelectedType(t)}
            >
              <Text style={[styles.typeChipText, isSelected ? styles.typeChipTextActive : null]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {GROUPS.map((grp) => {
        const items = filteredFollowUps.filter((f) => f.status === 'Pending' && grp.test(f.date));
        if (items.length === 0) return null;

        return (
          <View key={grp.id} style={styles.groupSection}>
            <View style={styles.groupHeaderRow}>
              <View style={[styles.groupDot, { backgroundColor: grp.color }]} />
              <Text style={styles.groupTitle}>{grp.label}</Text>
              <Text style={styles.groupCountBadge}>({items.length})</Text>
            </View>

            {items.map((item) => {
              const matchedLead = leads.find((l) => l.id === item.leadId);

              return (
                <Card key={item.id} style={styles.followUpCard}>
                  <View style={styles.fuCardHeader}>
                    <Text style={styles.fuClientName}>{item.clientName}</Text>
                    <View style={styles.typeBadgePill}>
                      <Text style={styles.typeBadgeText}>{item.type || item.interactionType}</Text>
                    </View>
                  </View>

                  <Text style={styles.fuTitleText}>{item.title}</Text>
                  <Text style={styles.fuNoteText}>{item.notes || item.note}</Text>

                  <View style={styles.fuMetaRow}>
                    <View style={styles.timeTag}>
                      <Clock size={12} color={grp.color} />
                      <Text style={[styles.timeTagText, { color: grp.color }]}>
                        {item.date === todayISO ? 'Today' : item.date}, {item.time || '11:00'}
                      </Text>
                    </View>
                    <Text style={styles.assignedText}>{matchedLead?.assignedTo || 'Vikram Patel'}</Text>
                  </View>

                  <View style={styles.fuActionsRow}>
                    {matchedLead?.phone ? (
                      <TouchableOpacity
                        style={styles.actionBtnOutline}
                        onPress={() => Linking.openURL(`tel:+91${matchedLead.phone}`)}
                      >
                        <Phone size={13} color={colors.primary} />
                        <Text style={styles.actionBtnOutlineText}>Call</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={styles.actionBtnOutline}
                      onPress={() => {
                        setReschedulingItem(item);
                        setNewDate(item.date);
                        setNewTime(item.time || '11:00');
                      }}
                    >
                      <Text style={styles.actionBtnOutlineText}>Reschedule</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnDone}
                      onPress={() => {
                        setCompletingItem(item);
                        setOutcomeText('');
                      }}
                    >
                      <Check size={13} color="#ffffff" />
                      <Text style={styles.actionBtnDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </View>
        );
      })}

      {filteredFollowUps.filter((f) => f.status === 'Completed').length > 0 && (
        <View style={styles.groupSection}>
          <View style={styles.groupHeaderRow}>
            <View style={[styles.groupDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.groupTitle}>Completed Interactions</Text>
            <Text style={styles.groupCountBadge}>
              ({filteredFollowUps.filter((f) => f.status === 'Completed').length})
            </Text>
          </View>

          {filteredFollowUps
            .filter((f) => f.status === 'Completed')
            .map((item) => (
              <Card key={item.id} style={[styles.followUpCard, { opacity: 0.8 }]}>
                <View style={styles.fuCardHeader}>
                  <Text style={styles.fuClientName}>{item.clientName}</Text>
                  <StatusBadge status="Completed" size="sm" />
                </View>
                <Text style={styles.fuTitleText}>{item.title}</Text>
                {item.outcome ? (
                  <View style={styles.outcomeBanner}>
                    <Text style={styles.outcomeLabel}>OUTCOME:</Text>
                    <Text style={styles.outcomeText}>{item.outcome}</Text>
                  </View>
                ) : null}
              </Card>
            ))}
        </View>
      )}

      <Modal visible={Boolean(completingItem)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark Follow-Up Complete</Text>
              <TouchableOpacity onPress={() => setCompletingItem(null)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Record the outcome of your interaction with {completingItem?.clientName}:
            </Text>

            <Input
              placeholder="e.g. Client requested revised quotation with 5% discount..."
              value={outcomeText}
              onChangeText={setOutcomeText}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="sm"
                onPress={() => setCompletingItem(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save & Mark Done"
                variant="primary"
                size="sm"
                onPress={handleMarkDone}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(reschedulingItem)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Follow-Up</Text>
              <TouchableOpacity onPress={() => setReschedulingItem(null)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label="New Date (YYYY-MM-DD)"
              value={newDate}
              onChangeText={setNewDate}
            />

            <Input
              label="New Time"
              value={newTime}
              onChangeText={setNewTime}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="sm"
                onPress={() => setReschedulingItem(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Move Follow-up"
                variant="primary"
                size="sm"
                onPress={handleReschedule}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule New Follow-up</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Select Enquiry / Client</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
              {leads.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.leadSelectChip, newLeadId === l.id ? styles.leadSelectChipActive : null]}
                  onPress={() => setNewLeadId(l.id)}
                >
                  <Text style={[styles.leadSelectText, newLeadId === l.id ? styles.leadSelectTextActive : null]}>
                    {l.company}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Interaction Type</Text>
            <View style={styles.typeSelectionRow}>
              {(['Call', 'Meeting', 'Site Visit', 'Review'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.miniTypeBtn, newType === t ? styles.miniTypeBtnActive : null]}
                  onPress={() => setNewType(t)}
                >
                  <Text style={[styles.miniTypeText, newType === t ? styles.miniTypeTextActive : null]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Scheduled Date (YYYY-MM-DD)"
              value={newFuDate}
              onChangeText={setNewFuDate}
            />

            <Input
              label="Scheduled Time"
              value={newFuTime}
              onChangeText={setNewFuTime}
            />

            <Input
              label="Objective / Notes"
              placeholder="e.g. Discuss exploration drilling timeline..."
              value={newFuNote}
              onChangeText={setNewFuNote}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Schedule Follow-Up"
              onPress={handleCreateFollowUp}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  addHeaderBtn: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchBar: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  typeFilterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  typeChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  typeChipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
  },
  groupSection: {
    marginBottom: spacing.md,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  groupTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  groupCountBadge: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginLeft: 4,
  },
  followUpCard: {
    marginBottom: spacing.xs,
    padding: spacing.md,
  },
  fuCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fuClientName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  typeBadgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  fuTitleText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fuNoteText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  fuMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.semibold,
  },
  assignedText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  fuActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.xs,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  actionBtnOutlineText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.semibold,
  },
  actionBtnDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  actionBtnDoneText: {
    fontSize: typography.fontSizes.xxs,
    color: '#ffffff',
    fontWeight: typography.fontWeights.bold,
  },
  outcomeBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: spacing.xs,
    borderRadius: radius.sm,
    marginTop: 4,
  },
  outcomeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  outcomeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    marginTop: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
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
  modalDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  leadSelectChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.xs,
  },
  leadSelectChipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  leadSelectText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
  },
  leadSelectTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  typeSelectionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  miniTypeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  miniTypeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  miniTypeText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  miniTypeTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});
