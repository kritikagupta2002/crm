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
          <ChevronUp size={18} color="#0284c7" />
        ) : (
          <ChevronDown size={18} color="#94a3b8" />
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

  // Ticket form state
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color="#0f172a" strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>Help & Support</Text>
            <Text style={styles.headerSub} numberOfLines={1}>Knowledge base, FAQs & IT helpdesk</Text>
          </View>
        </View>
      </View>

      {/* Ticket created toast */}
      {ticketSuccess && (
        <View style={styles.toastCard}>
          <CheckCircle2 size={18} color="#059669" strokeWidth={2.4} />
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
        {/* 1. Quick Contact Channels */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={handleCall} activeOpacity={0.8}>
            <View style={[styles.contactIconBox, { backgroundColor: '#f0f9ff' }]}>
              <Phone size={20} color="#0284c7" strokeWidth={2.4} />
            </View>
            <Text style={styles.contactCardTitle}>Call Helpline</Text>
            <Text style={styles.contactCardSub}>+91 141 2984-GEO</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmail} activeOpacity={0.8}>
            <View style={[styles.contactIconBox, { backgroundColor: '#ecfdf5' }]}>
              <Mail size={20} color="#059669" strokeWidth={2.4} />
            </View>
            <Text style={styles.contactCardTitle}>Email Support</Text>
            <Text style={styles.contactCardSub}>it-ops@bansalgeo.com</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Knowledge Base & FAQs */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <FileQuestion size={18} color="#0284c7" strokeWidth={2.4} />
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

        {/* 3. Raise Support Ticket */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Headphones size={18} color="#0f172a" strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>RAISE A SUPPORT TICKET</Text>
          </View>

          {/* Category Chips */}
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

          {/* Subject */}
          <Text style={styles.inputLabel}>SUBJECT</Text>
          <TextInput
            style={styles.inputField}
            value={ticketSubject}
            onChangeText={setTicketSubject}
            placeholder="Brief summary of the issue..."
            placeholderTextColor="#94a3b8"
          />

          {/* Description */}
          <Text style={styles.inputLabel}>DETAILED DESCRIPTION</Text>
          <TextInput
            style={[styles.inputField, styles.textArea]}
            value={ticketMessage}
            onChangeText={setTicketMessage}
            placeholder="Describe what happened, error message, or site location..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Submit Button */}
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
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#047857',
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
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#0f172a',
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
    fontWeight: '800',
    color: '#0f172a',
  },
  contactCardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#0f172a',
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
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    color: '#0f172a',
    flex: 1,
    lineHeight: 18,
  },
  faqAnswerBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  faqAnswerText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
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
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryBtnSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  categoryBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  categoryBtnTextSelected: {
    color: '#ffffff',
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13.5,
    color: '#0f172a',
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
    backgroundColor: '#0284c7',
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
