import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Headphones,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  ExternalLink,
} from 'lucide-react-native';

interface HelpSupportScreenProps {
  navigation: any;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How do I log drilling footage when offline in remote sites?',
    answer:
      'The app automatically caches all DPR logs and core box photos locally. Once your device enters cellular range or Wi-Fi coverage, automatic background synchronization pushes records to the enterprise database.',
  },
  {
    id: 'faq-2',
    question: 'How does Stage 5 Technical Deliverable Sign-Off work?',
    answer:
      'Only users with Director or Super Admin roles possess authority to sign off Stage 5 deliverables. Once signed off, cryptographic hash stamps are generated and the deliverable is unlocked for client preview.',
  },
  {
    id: 'faq-3',
    question: 'Where can I access GST invoices and TDS registers?',
    answer:
      'Navigate to Workspaces > Finance > Invoices or TDS Register. Detailed breakdown, payment receipts, and Form 16A links are accessible for Accounts Executive and Finance Master roles.',
  },
  {
    id: 'faq-4',
    question: 'How do I switch between different operational roles?',
    answer:
      'Tap Profile > Switch Role in the Administration section. You can preview perspectives as Super Admin, Director, Manager, Employee, Finance Master, or Accounts Executive.',
  },
  {
    id: 'faq-5',
    question: 'What to do if biometric fingerprint punch-in fails?',
    answer:
      'Ensure camera/sensor lens is clean. If authentication fails after 3 attempts, enter your corporate PIN or submit an Attendance Correction request under Workspaces > HRMS.',
  },
];

const FaqAccordionItem = React.memo(
  ({
    faq,
    isExpanded,
    onToggle,
  }: {
    faq: FaqItem;
    isExpanded: boolean;
    onToggle: (id: string) => void;
  }) => (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqQuestionRow}
        onPress={() => onToggle(faq.id)}
        activeOpacity={0.75}
      >
        <Text style={styles.faqQuestionText}>{faq.question}</Text>
        {isExpanded ? (
          <ChevronUp size={18} color="#2f6fb3" />
        ) : (
          <ChevronDown size={18} color="#7c8b96" />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.faqAnswerBox}>
          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
        </View>
      )}
    </View>
  )
);

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const ticketTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (ticketTimerRef.current) clearTimeout(ticketTimerRef.current);
    };
  }, []);

  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');

  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Field Data & GPS');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  const toggleFaq = useCallback((id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  }, []);

  const handleCall = useCallback(() => {
    Linking.openURL('tel:+911412984436').catch(() =>
      Alert.alert('Call IT Helpdesk', 'Helpline: +91 (0141) 2984-GEO')
    );
  }, []);

  const handleEmail = useCallback(() => {
    Linking.openURL('mailto:it-ops@bansalgeo.com?subject=Support Request').catch(() =>
      Alert.alert('Email IT Ops', 'Email: it-ops@bansalgeo.com')
    );
  }, []);

  const handleSubmitTicket = useCallback(() => {
    if (!ticketSubject.trim()) {
      Alert.alert('Missing Field', 'Please enter a ticket subject.');
      return;
    }
    if (!ticketMessage.trim()) {
      Alert.alert('Missing Field', 'Please describe the issue in detail.');
      return;
    }

    const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketSuccess(ticketId);
    setTicketSubject('');
    setTicketMessage('');

    if (ticketTimerRef.current) clearTimeout(ticketTimerRef.current);
    ticketTimerRef.current = setTimeout(() => {
      setTicketSuccess(null);
    }, 4500);
  }, [ticketSubject, ticketMessage]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ProfileTab'))}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color="#0f2a3d" strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>Help & Support</Text>
            <Text style={styles.headerSub} numberOfLines={1}>Knowledge base, FAQs & IT helpdesk</Text>
          </View>
        </View>
      </View>

      {ticketSuccess && (
        <View style={styles.toastCard}>
          <CheckCircle2 size={18} color="#2e9e6b" strokeWidth={2.4} />
          <Text style={styles.toastText}>
            Ticket #{ticketSuccess} logged successfully! IT Ops will respond within 2 hours.
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={handleCall} activeOpacity={0.8}>
            <View style={[styles.contactIconBox, { backgroundColor: '#e6effa' }]}>
              <Phone size={20} color="#2f6fb3" strokeWidth={2.4} />
            </View>
            <Text style={styles.contactCardTitle}>Call Helpline</Text>
            <Text style={styles.contactCardSub}>+91 141 2984-GEO</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmail} activeOpacity={0.8}>
            <View style={[styles.contactIconBox, { backgroundColor: '#e3f4ec' }]}>
              <Mail size={20} color="#2e9e6b" strokeWidth={2.4} />
            </View>
            <Text style={styles.contactCardTitle}>Email Support</Text>
            <Text style={styles.contactCardSub}>it-ops@bansalgeo.com</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <FileQuestion size={18} color="#2f6fb3" strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
          </View>

          {FAQS.map((faq) => (
            <FaqAccordionItem
              key={faq.id}
              faq={faq}
              isExpanded={expandedFaqId === faq.id}
              onToggle={toggleFaq}
            />
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Headphones size={18} color="#0f2a3d" strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>RAISE A SUPPORT TICKET</Text>
          </View>

          <Text style={styles.inputLabel}>CATEGORY</Text>
          <View style={styles.categoryRow}>
            {[
              'Field Data & GPS',
              'Financial Ledger',
              'Account & 2FA',
              'Rig Hardware',
            ].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBtn,
                  ticketCategory === cat && styles.categoryBtnSelected,
                ]}
                onPress={() => setTicketCategory(cat)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.categoryBtnText,
                    ticketCategory === cat && styles.categoryBtnTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>SUBJECT</Text>
          <TextInput
            style={styles.inputField}
            value={ticketSubject}
            onChangeText={setTicketSubject}
            placeholder="Brief summary of the issue..."
            placeholderTextColor="#7c8b96"
          />

          <Text style={styles.inputLabel}>DETAILED DESCRIPTION</Text>
          <TextInput
            style={[styles.inputField, styles.textArea]}
            value={ticketMessage}
            onChangeText={setTicketMessage}
            placeholder="Describe what happened, error message, or site location..."
            placeholderTextColor="#7c8b96"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.submitTicketBtn}
            onPress={handleSubmitTicket}
            activeOpacity={0.8}
          >
            <Send size={16} color="#ffffff" strokeWidth={2.4} />
            <Text style={styles.submitTicketBtnText}>Submit Helpdesk Ticket</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f8',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#edf1f3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e1e8eb',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f2a3d',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11.5,
    color: '#627079',
    fontWeight: '500',
    marginTop: 1,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e3f4ec',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfe3d0',
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#237a53',
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e1e8eb',
    alignItems: 'center',
    shadowColor: '#0f2a3d',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  contactIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f2a3d',
  },
  contactCardSub: {
    fontSize: 11,
    color: '#627079',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e8eb',
    marginBottom: 16,
    shadowColor: '#0f2a3d',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#627079',
    letterSpacing: 0.8,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f3',
    paddingVertical: 10,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  faqQuestionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f2a3d',
    flex: 1,
    lineHeight: 18,
  },
  faqAnswerBox: {
    backgroundColor: '#f4f7f8',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e1e8eb',
  },
  faqAnswerText: {
    fontSize: 12.5,
    color: '#4a5b68',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#627079',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#edf1f3',
    borderWidth: 1,
    borderColor: '#e1e8eb',
  },
  categoryBtnSelected: {
    backgroundColor: '#2f6fb3',
    borderColor: '#2f6fb3',
  },
  categoryBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4a5b68',
  },
  categoryBtnTextSelected: {
    color: '#ffffff',
  },
  inputField: {
    backgroundColor: '#f4f7f8',
    borderWidth: 1,
    borderColor: '#d3dce1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13.5,
    color: '#0f2a3d',
    fontWeight: '600',
    marginBottom: 8,
  },
  textArea: {
    height: 90,
    paddingTop: 10,
  },
  submitTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2f6fb3',
    height: 46,
    borderRadius: 12,
    marginTop: 10,
  },
  submitTicketBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },
});
