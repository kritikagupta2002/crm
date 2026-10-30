import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MessageCircleQuestion, Send } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { colors, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { FdButton, Empty, fd } from '../../fieldDatabase/components/ui';
import { formatDate } from '../../fieldDatabase/utils/date';
import { answeredByLabel, canAnswer, queriesOf, questionsFor } from '../../utils/questions';

const TABS = {
  Waiting: (q: any) => q.status === 'Open',
  Answered: (q: any) => q.status !== 'Open',
  All: () => true,
} as const;
type Tab = keyof typeof TABS;

/* One question with its reply, or a box to reply when this person's role answers it. */
function QuestionCard({ q }: { q: any }) {
  const { session, canonicalRole } = useAuth();
  const { updateLead } = useCrm();
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const open = q.status === 'Open';

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const queries = queriesOf(q.lead).map((x) =>
        x.id === q.id ? { ...x, status: 'Answered' as const, reply: reply.trim(), repliedAt: new Date().toISOString(), repliedBy: (session as any)?.name || '' } : x,
      );
      await updateLead(q.lead.id, { queries });
      setReply('');
    } catch (e: any) {
      Alert.alert('Reply', e?.message || 'Could not send the reply.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[fd.card, styles.card, open && styles.cardOpen]}>
      <View style={styles.head}>
        <View style={[styles.pill, { backgroundColor: open ? colors.warningBg : colors.successBg }]}>
          <Text style={[styles.pillText, { color: open ? colors.warningText : colors.successText }]}>{q.status}</Text>
        </View>
        <Text style={styles.company} numberOfLines={1}>
          {q.lead.company}
        </Text>
      </View>
      <Text style={fd.muted}>
        {q.topic} · asked {formatDate(q.at.slice(0, 10))}
      </Text>
      <Text style={styles.message}>{q.message}</Text>
      {open ? (
        canAnswer(canonicalRole, q.lead, q.topic) ? (
          <View style={styles.replyRow}>
            <TextInput style={styles.input} value={reply} onChangeText={setReply} placeholder="Write a reply the client will see" placeholderTextColor={colors.textTertiary} multiline />
            <FdButton title="Send" Icon={Send} onPress={send} busy={busy} disabled={!reply.trim()} style={{ height: 44 }} />
          </View>
        ) : (
          <Text style={[fd.muted, { marginTop: 8 }]}>Waiting for a reply from {answeredByLabel(q.lead, q.topic)}.</Text>
        )
      ) : (
        <View style={styles.answer}>
          <Text style={styles.answerText}>
            <Text style={{ fontWeight: '700' }}>{q.repliedBy}: </Text>
            {q.reply}
          </Text>
          {q.repliedAt ? <Text style={fd.muted}>{formatDate(q.repliedAt.slice(0, 10))}</Text> : null}
        </View>
      )}
    </View>
  );
}

/* Questions clients asked on the portal, in one place, sent to whoever answers them. */
export const ClientQuestionsScreen: React.FC<{ navigation: any }> = () => {
  const { canonicalRole } = useAuth();
  const { leads } = useCrm();
  const [tab, setTab] = useState<Tab>('Waiting');
  const mine = questionsFor(canonicalRole, leads);
  const shown = mine.filter(TABS[tab]).sort((a, b) => (tab === 'Waiting' ? a.at.localeCompare(b.at) : b.at.localeCompare(a.at)));

  return (
    <View style={fd.root}>
      <AppHeader title="Client Questions" subtitle={`${mine.filter(TABS.Waiting).length} waiting for a reply`} />
      <ScrollView contentContainerStyle={fd.body} keyboardShouldPersistTaps="handled">
        <View style={styles.tabs}>
          {(Object.keys(TABS) as Tab[]).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>
                {t} {mine.filter(TABS[t]).length}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {shown.length === 0 ? (
          <View style={styles.empty}>
            <MessageCircleQuestion size={18} color={colors.textMuted} />
            <Empty text={tab === 'Waiting' ? 'Nothing waiting. New questions from the client portal come here.' : 'No questions here.'} />
          </View>
        ) : (
          shown.map((q) => <QuestionCard key={q.id} q={q} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.surface },
  tabOn: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextOn: { color: colors.textInverse },
  card: { marginBottom: 10, gap: 3 },
  cardOpen: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  company: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  message: { fontSize: 14, color: colors.textPrimary, lineHeight: 20, marginTop: 6 },
  replyRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginTop: 10 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textPrimary },
  answer: { marginTop: 10, backgroundColor: colors.primaryBg, borderRadius: radius.md, padding: 10, gap: 4 },
  answerText: { fontSize: 13.5, color: colors.textPrimary, lineHeight: 19 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
