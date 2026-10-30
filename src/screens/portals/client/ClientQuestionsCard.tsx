import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MessageCircleQuestion, Send } from 'lucide-react-native';
import { clientTheme } from './clientTheme';
import { useCrm } from '../../../context/CrmContext';
import { QUERY_TOPICS, QueryTopic, answeredByLabel, queriesOf } from '../../../utils/questions';

const C = clientTheme.colors;
const date = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/*
 * The client's questions to Bansal Geo, as on the web portal: ask under a topic, and see the reply here.
 * The question reaches whoever answers that topic (Accounts for billing, the project team for the work).
 */
export function ClientQuestionsCard({ companyName }: { companyName: string }) {
  const { leads, updateLead } = useCrm();
  // The client's enquiry: the won one if there is one, else the latest.
  const lead = useMemo(() => {
    const first = (companyName || '').split(' ')[0].toLowerCase();
    const theirs = leads.filter((l) => (l.company || '').toLowerCase().startsWith(first));
    return theirs.find((l) => l.stage === 'Won') || theirs[theirs.length - 1];
  }, [leads, companyName]);
  const [topic, setTopic] = useState<QueryTopic>(QUERY_TOPICS[0]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  if (!lead) return null;
  const queries = [...queriesOf(lead)].sort((a, b) => b.at.localeCompare(a.at));

  const ask = async () => {
    if (!message.trim()) return;
    setBusy(true);
    try {
      const q = { id: `Q-${Date.now()}`, topic, message: message.trim(), at: new Date().toISOString(), status: 'Open' as const };
      await updateLead(lead.id, { queries: [...queriesOf(lead), q] });
      setMessage('');
    } catch (e: any) {
      Alert.alert('Question', e?.message || 'Could not send your question.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <MessageCircleQuestion size={22} color={C.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Ask Bansal Geo</Text>
          <Text style={styles.sub}>Your question goes to the right team; the reply shows here.</Text>
        </View>
      </View>

      <View style={styles.topics}>
        {QUERY_TOPICS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setTopic(t)} style={[styles.topic, topic === t && styles.topicOn]}>
            <Text style={[styles.topicText, topic === t && styles.topicTextOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Write your question"
        placeholderTextColor={C.textTertiary}
        multiline
        maxLength={500}
      />
      <TouchableOpacity style={[styles.send, (!message.trim() || busy) && { opacity: 0.5 }]} disabled={!message.trim() || busy} onPress={ask} activeOpacity={0.85}>
        <Send size={16} color={C.surface} />
        <Text style={styles.sendText}>Send question</Text>
      </TouchableOpacity>

      {queries.length ? <Text style={styles.listTitle}>Your questions</Text> : null}
      {queries.map((q) => (
        <View key={q.id} style={styles.q}>
          <View style={styles.qHead}>
            <Text style={styles.qMeta}>
              {q.topic} · {date(q.at)}
            </Text>
            <Text style={[styles.qStatus, { color: q.status === 'Open' ? C.goldDark : C.emeraldDark }]}>{q.status === 'Open' ? 'Waiting' : 'Answered'}</Text>
          </View>
          <Text style={styles.qText}>{q.message}</Text>
          {q.status === 'Open' ? (
            <Text style={styles.qWait}>With {answeredByLabel(lead, q.topic)}.</Text>
          ) : (
            <View style={styles.reply}>
              <Text style={styles.qText}>
                <Text style={{ fontWeight: '700' }}>{q.repliedBy}: </Text>
                {q.reply}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.sandstoneBorder, padding: 16, marginBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.tealSubtle, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  sub: { fontSize: 12.5, color: C.textMuted, marginTop: 2 },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  topic: { paddingHorizontal: 12, height: 32, justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: C.sandstoneBorder },
  topicOn: { backgroundColor: C.teal, borderColor: C.teal },
  topicText: { fontSize: 12.5, fontWeight: '600', color: C.textSecondary },
  topicTextOn: { color: C.surface },
  input: { marginTop: 10, minHeight: 80, borderWidth: 1, borderColor: C.sandstoneBorder, borderRadius: 10, padding: 10, fontSize: 14, color: C.textPrimary, textAlignVertical: 'top' },
  send: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 10, backgroundColor: C.teal },
  sendText: { color: C.surface, fontWeight: '700', fontSize: 14 },
  listTitle: { marginTop: 18, marginBottom: 6, fontSize: 13, fontWeight: '700', color: C.textSecondary },
  q: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.sandstoneBorder, gap: 4 },
  qHead: { flexDirection: 'row', justifyContent: 'space-between' },
  qMeta: { fontSize: 12, color: C.textMuted },
  qStatus: { fontSize: 12, fontWeight: '700' },
  qText: { fontSize: 13.5, color: C.textPrimary, lineHeight: 19 },
  qWait: { fontSize: 12, color: C.textMuted },
  reply: { backgroundColor: C.tealSubtle, borderRadius: 8, padding: 8, marginTop: 2 },
});
