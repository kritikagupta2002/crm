import React, { useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { FolderKanban, Building2, Users, Clock, FileSignature, Store, FileText, Gavel, Bell, MessageCircleQuestion } from 'lucide-react-native';
import { HomeHeader, HeroBanner } from '../../components/common';
import { StatGrid, ActionList, SectionTitle, Panel, SplitBar, inr, homeStyles, ActionItem, NOTICE_TONE, timeAgo } from '../../components/home/HomeBlocks';
import { colors, fonts } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useHrms } from '../../context/HrmsContext';
import { useNotifications } from '../../context/NotificationContext';
import { questionsFor } from '../../utils/questions';

interface DirectorHomeScreenProps {
  navigation: any;
}

const OPEN_STAGES = ['New Enquiry', 'New', 'Contacted', 'Qualified'];
const QUOTED_STAGES = ['Proposal Sent', 'Negotiation'];
const leadValue = (l: any) => l.quoteValue || l.estimatedValue || 0;

/* Director: sales, projects and sign-offs; no finance. */
export const DirectorHomeScreen: React.FC<DirectorHomeScreenProps> = ({ navigation }) => {
  const { projects, leads, quotes, clients, tenders, vendorApplications, govtDocuments } = useCrm();
  const { employees } = useHrms();
  const { notifications } = useNotifications();

  const running = projects.filter((p) => p.status !== 'Completed');
  const pipeline = useMemo(() => {
    const sum = (stages: string[]) => leads.filter((l) => stages.includes(l.stage)).reduce((s, l) => s + leadValue(l), 0);
    return { open: sum(OPEN_STAGES), quoted: sum(QUOTED_STAGES), won: sum(['Won']) };
  }, [leads]);
  const decided = leads.filter((l) => l.stage === 'Won' || l.stage === 'Lost');
  const winRate = decided.length ? Math.round((decided.filter((l) => l.stage === 'Won').length / decided.length) * 100) : null;

  const waiting = {
    quotes: quotes.filter((q) => q.status === 'Pending Approval').length,
    vendors: (vendorApplications || []).filter((a) => a.status === 'New' || a.status === 'Changes requested').length,
    documents: (govtDocuments || []).filter((d: any) => d.stage === 'To authorize' || d.stage === 'To verify').length,
    questions: questionsFor('director', leads).filter((q) => q.status === 'Open').length,
    tenders: (tenders || []).filter((t: any) => t.status === 'Sealed' || t.status === 'Under Evaluation' || t.status === 'Evaluation').length,
  };
  const waitingTotal = Object.values(waiting).reduce((s, n) => s + n, 0);
  const count = (n: number, word: string): Pick<ActionItem, 'tag' | 'tone'> =>
    n > 0 ? { tag: `${n} ${word}`, tone: 'amber' } : { tag: 'Clear', tone: 'green' };

  return (
    <View style={homeStyles.root}>
      <HomeHeader navigation={navigation} searchTo="WorkspacesTab" />
      <ScrollView contentContainerStyle={homeStyles.body} showsVerticalScrollIndicator={false}>
        <HeroBanner
          title="Geology for a Better Tomorrow"
          caption={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        />

        <Panel>
          <Text style={styles.label}>Sales pipeline</Text>
          <View style={styles.headRow}>
            <Text style={styles.bigValue}>{inr(pipeline.open + pipeline.quoted + pipeline.won)}</Text>
            {winRate != null ? (
              <View style={styles.rate}>
                <Text style={styles.rateValue}>{winRate}%</Text>
                <Text style={styles.rateLabel}>won of decided</Text>
              </View>
            ) : null}
          </View>
          <View style={{ height: 12 }} />
          <SplitBar
            parts={[
              { label: 'Enquiries', value: pipeline.open, display: inr(pipeline.open), tone: 'blue' },
              { label: 'Quoted', value: pipeline.quoted, display: inr(pipeline.quoted), tone: 'amber' },
              { label: 'Won', value: pipeline.won, display: inr(pipeline.won), tone: 'green' },
            ]}
          />
        </Panel>

        <View style={{ height: 12 }} />
        <StatGrid
          items={[
            { label: 'Active projects', value: running.length, sub: `${projects.length} in all`, Icon: FolderKanban, tone: 'teal', onPress: () => navigation.navigate('Projects') },
            { label: 'Clients', value: clients.length, Icon: Building2, tone: 'blue', onPress: () => navigation.navigate('Clients') },
            { label: 'Team', value: employees.length, Icon: Users, tone: 'green', onPress: () => navigation.navigate('EmployeeDirectory') },
            { label: 'Sign-offs', value: waitingTotal, sub: 'Waiting for you', Icon: Clock, tone: waitingTotal ? 'amber' : 'green' },
          ]}
        />

        <SectionTitle title="Sign-offs" count={waitingTotal} />
        <ActionList
          items={[
            { key: 'q', title: 'Quotation approvals', sub: 'Quotes above the approval limit', Icon: FileSignature, ...count(waiting.quotes, 'pending'), onPress: () => navigation.navigate('QuoteApprovals') },
            { key: 'v', title: 'Vendor applications', sub: 'New vendors to approve', Icon: Store, ...count(waiting.vendors, 'new'), onPress: () => navigation.navigate('VendorApplications') },
            { key: 'd', title: 'Government documents', sub: 'Letters to verify and authorise', Icon: FileText, ...count(waiting.documents, 'to check'), onPress: () => navigation.navigate('DocumentInbox') },
            { key: 'cq', title: 'Client questions', sub: 'Asked on the client portal', Icon: MessageCircleQuestion, ...count(waiting.questions, 'waiting'), onPress: () => navigation.navigate('ClientQuestions') },
            { key: 't', title: 'Tenders', sub: 'Bids to open and award', Icon: Gavel, ...count(waiting.tenders, 'to decide'), onPress: () => navigation.navigate('Tenders') },
          ]}
        />

        <SectionTitle title="Projects" action="All projects" onAction={() => navigation.navigate('Projects')} />
        <ActionList
          empty="No projects yet."
          items={running.slice(0, 4).map((p) => ({
            key: p.id,
            title: p.title || p.name || p.projectCode,
            sub: `${p.clientName} · ${p.stageName}`,
            Icon: FolderKanban,
            tone: p.status === 'Awaiting approval' ? 'amber' : 'teal',
            tag: p.status === 'Awaiting approval' ? 'Approval' : `Stage ${p.currentStage}`,
            onPress: () => navigation.navigate('ProjectDetail', { projectId: p.id }),
          }))}
        />

        <SectionTitle title="Recent activity" action="All" onAction={() => navigation.navigate('AlertsTab')} />
        <ActionList
          empty="No new activity."
          items={notifications.slice(0, 4).map((n) => {
            const t = NOTICE_TONE[n.type] || NOTICE_TONE.info;
            return { key: n.id, title: n.title, sub: [n.message, timeAgo(n.timestamp)].filter(Boolean).join(' · '), Icon: t.Icon || Bell, tone: t.tone };
          })}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  headRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 },
  bigValue: { fontFamily: fonts.serif, fontSize: 28, color: colors.textPrimary },
  rate: { alignItems: 'flex-end' },
  rateValue: { fontFamily: fonts.serif, fontSize: 20, color: colors.success },
  rateLabel: { fontSize: 11, color: colors.textMuted },
});
