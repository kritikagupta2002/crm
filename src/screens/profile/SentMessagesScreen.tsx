import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Radio,
  RadioTower,
  MessageSquare,
} from 'lucide-react-native';

interface SentMessagesScreenProps {
  navigation: any;
}

interface BroadcastItem {
  id: string;
  title: string;
  body: string;
  target: string;
  priority: 'routine' | 'urgent' | 'emergency';
  timestamp: string;
  deliveredCount: number;
}

const INITIAL_MESSAGES: BroadcastItem[] = [
  {
    id: 'BC-2026-104',
    title: 'Monsoon Heavy Rainfall Field Safety & Rig Stoppage Protocol',
    body: 'All active drilling sites in Zawar and Dariba belt are advised to halt night-shift coring during active cloudburst alerts.',
    target: 'All Field Geologists & Rig Operators',
    priority: 'urgent',
    timestamp: 'Today, 09:30 AM',
    deliveredCount: 42,
  },
  {
    id: 'BC-2026-103',
    title: 'Submission Deadline for October First Fortnight DPRs',
    body: 'Ensure all Stage 2 borehole lithology logs and core box photographs are submitted via Bansal Geo App by 15th October.',
    target: 'Exploration Division',
    priority: 'routine',
    timestamp: 'Yesterday, 02:15 PM',
    deliveredCount: 65,
  },
  {
    id: 'BC-2026-102',
    title: 'GST Invoice Clearance Window Before Financial Audit',
    body: 'Vendor bills pending for mechanical drilling mobilization must be forwarded to Accounts desk by Monday.',
    target: 'Accounts & Commercial Vendors',
    priority: 'routine',
    timestamp: '05 Oct 2026, 11:00 AM',
    deliveredCount: 28,
  },
];

const DispatchCard = React.memo(({ item }: { item: BroadcastItem }) => (
  <View style={styles.dispatchCard}>
    <View style={styles.dispatchTopRow}>
      <View style={styles.idBadge}>
        <RadioTower size={12} color="#2f6fb3" />
        <Text style={styles.idBadgeText}>{item.id}</Text>
      </View>

      <View
        style={[
          styles.priorityPill,
          item.priority === 'urgent' && styles.priorityPillUrgent,
          item.priority === 'emergency' && styles.priorityPillEmergency,
        ]}
      >
        <Text
          style={[
            styles.priorityText,
            item.priority === 'urgent' && styles.priorityTextUrgent,
            item.priority === 'emergency' && styles.priorityTextEmergency,
          ]}
        >
          {item.priority.toUpperCase()}
        </Text>
      </View>
    </View>

    <Text style={styles.dispatchTitle}>{item.title}</Text>
    <Text style={styles.dispatchBody}>{item.body}</Text>

    <View style={styles.divider} />

    <View style={styles.dispatchFooter}>
      <View style={styles.metaRow}>
        <Users size={13} color="#627079" />
        <Text style={styles.metaText}>{item.target}</Text>
      </View>

      <View style={styles.metaRow}>
        <Clock size={13} color="#627079" />
        <Text style={styles.metaText}>{item.timestamp}</Text>
      </View>
    </View>
  </View>
));

export const SentMessagesScreen: React.FC<SentMessagesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const [messages, setMessages] = useState<BroadcastItem[]>(INITIAL_MESSAGES);
  const [composeModalVisible, setComposeModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newTarget, setNewTarget] = useState('All Staff & Field Crews');
  const [newPriority, setNewPriority] = useState<'routine' | 'urgent' | 'emergency'>('routine');
  const [sentToast, setSentToast] = useState(false);

  const handleSendBroadcast = useCallback(() => {
    if (!newTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a broadcast subject.');
      return;
    }
    if (!newBody.trim()) {
      Alert.alert('Required Field', 'Please enter message content.');
      return;
    }

    const newDispatch: BroadcastItem = {
      id: `BC-2026-${Math.floor(105 + Math.random() * 50)}`,
      title: newTitle.trim(),
      body: newBody.trim(),
      target: newTarget,
      priority: newPriority,
      timestamp: 'Just now',
      deliveredCount: 87,
    };

    setMessages((prev) => [newDispatch, ...prev]);
    setComposeModalVisible(false);
    setNewTitle('');
    setNewBody('');
    setSentToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSentToast(false), 3000);
  }, [newTitle, newBody, newTarget, newPriority]);

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
            <Text style={styles.headerTitle} numberOfLines={1}>Sent Broadcasts</Text>
            <Text style={styles.headerSub} numberOfLines={1}>Operational circulars & dispatches</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.composeBtn}
          onPress={() => setComposeModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#ffffff" strokeWidth={2.4} />
          <Text style={styles.composeBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {sentToast && (
        <View style={styles.toastCard}>
          <CheckCircle2 size={16} color="#2e9e6b" strokeWidth={2.4} />
          <Text style={styles.toastText}>Broadcast dispatched to 87 recipients successfully!</Text>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DispatchCard item={item} />}
        ListHeaderComponent={
          <Text style={styles.sectionHeaderTitle}>RECENT OPERATIONAL DISPATCHES</Text>
        }
        contentContainerStyle={styles.scrollContent}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
      />

      <Modal statusBarTranslucent
        visible={composeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setComposeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Compose Operational Broadcast</Text>
                <Text style={styles.modalSub}>Push notification & alert to staff</Text>
              </View>
              <TouchableOpacity
                onPress={() => setComposeModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <X size={20} color="#627079" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>TARGET RECIPIENTS</Text>
              <View style={styles.targetRow}>
                {[
                  'All Staff & Field Crews',
                  'Exploration Division',
                  'Accounts Desk',
                ].map((aud) => (
                  <TouchableOpacity
                    key={aud}
                    style={[styles.targetBtn, newTarget === aud && styles.targetBtnSelected]}
                    onPress={() => setNewTarget(aud)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.targetBtnText,
                        newTarget === aud && styles.targetBtnTextSelected,
                      ]}
                    >
                      {aud}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>PRIORITY LEVEL</Text>
              <View style={styles.targetRow}>
                {[
                  { key: 'routine', label: 'Routine' },
                  { key: 'urgent', label: 'Urgent Alert' },
                  { key: 'emergency', label: 'Emergency SOS' },
                ].map((p) => (
                  <TouchableOpacity
                    key={p.key}
                    style={[
                      styles.targetBtn,
                      newPriority === p.key && styles.targetBtnSelected,
                    ]}
                    onPress={() => setNewPriority(p.key as any)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.targetBtnText,
                        newPriority === p.key && styles.targetBtnTextSelected,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>SUBJECT</Text>
              <TextInput
                style={styles.inputField}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Enter circular subject..."
                placeholderTextColor="#7c8b96"
              />

              <Text style={styles.inputLabel}>MESSAGE BODY</Text>
              <TextInput
                style={[styles.inputField, styles.textArea]}
                value={newBody}
                onChangeText={setNewBody}
                placeholder="Write instructions, advisory, or bulletin details..."
                placeholderTextColor="#7c8b96"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={styles.dispatchActionBtn}
                onPress={handleSendBroadcast}
                activeOpacity={0.8}
              >
                <Send size={16} color="#ffffff" strokeWidth={2.4} />
                <Text style={styles.dispatchActionBtnText}>Dispatch Broadcast</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  composeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2f6fb3',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
  },
  composeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
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
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#627079',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  dispatchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e1e8eb',
    marginBottom: 12,
    shadowColor: '#0f2a3d',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dispatchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e6effa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c9dcf1',
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2f6fb3',
  },
  priorityPill: {
    backgroundColor: '#edf1f3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityPillUrgent: {
    backgroundColor: '#fcf0dc',
  },
  priorityPillEmergency: {
    backgroundColor: '#fbe5e4',
  },
  priorityText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#627079',
  },
  priorityTextUrgent: {
    color: '#c27a12',
  },
  priorityTextEmergency: {
    color: '#d24c47',
  },
  dispatchTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f2a3d',
    lineHeight: 20,
    marginBottom: 6,
  },
  dispatchBody: {
    fontSize: 13,
    color: '#4a5b68',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#edf1f3',
    marginVertical: 10,
  },
  dispatchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11.5,
    color: '#627079',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0f2a3d',
  },
  modalSub: {
    fontSize: 12,
    color: '#627079',
    marginTop: 2,
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#edf1f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#627079',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  targetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  targetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#edf1f3',
    borderWidth: 1,
    borderColor: '#e1e8eb',
  },
  targetBtnSelected: {
    backgroundColor: '#2f6fb3',
    borderColor: '#2f6fb3',
  },
  targetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4a5b68',
  },
  targetBtnTextSelected: {
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
  dispatchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2f6fb3',
    height: 48,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  dispatchActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
