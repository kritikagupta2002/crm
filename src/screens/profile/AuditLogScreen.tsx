import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  FileText,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Clock,
  User,
  KeyRound,
  FileCheck,
  Receipt,
  AlertCircle,
  Share2,
} from 'lucide-react-native';

interface AuditLogScreenProps {
  navigation: any;
}

interface AuditRecord {
  id: string;
  action: string;
  category: 'security' | 'finance' | 'project' | 'role' | 'system';
  actor: string;
  role: string;
  timestamp: string;
  ip: string;
  device: string;
  hash: string;
  status: 'Verified' | 'Flagged';
}

const INITIAL_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'AUD-8821',
    action: 'Executive Role Switch to Director & Technical Head',
    category: 'role',
    actor: 'Dr. Rajesh Bansal',
    role: 'Super Admin',
    timestamp: 'Today, 01:42 PM',
    ip: '122.161.48.12',
    device: 'Android 14 Native App',
    hash: 'SHA256:7f9a...3c21',
    status: 'Verified',
  },
  {
    id: 'AUD-8820',
    action: 'Stage 5 Geological Sign-Off Approved for Rajpura Dariba Lead-Zinc Core',
    category: 'project',
    actor: 'Director Technical',
    role: 'Director',
    timestamp: 'Today, 11:15 AM',
    ip: '122.161.48.12',
    device: 'Android 14 Native App',
    hash: 'SHA256:4a8b...9e10',
    status: 'Verified',
  },
  {
    id: 'AUD-8819',
    action: 'Commercial Invoice #INV-2024-092 Generated (₹ 4,80,000)',
    category: 'finance',
    actor: 'Accounts Executive',
    role: 'Accounts Executive',
    timestamp: 'Today, 10:04 AM',
    ip: '122.161.48.15',
    device: 'Web Corporate Portal',
    hash: 'SHA256:e3d1...881f',
    status: 'Verified',
  },
  {
    id: 'AUD-8818',
    action: 'Fingerprint Biometric Authentication Profile Re-Verified',
    category: 'security',
    actor: 'Dr. Rajesh Bansal',
    role: 'Super Admin',
    timestamp: 'Yesterday, 08:32 PM',
    ip: '122.161.48.12',
    device: 'Android 14 Native App',
    hash: 'SHA256:c112...09ab',
    status: 'Verified',
  },
  {
    id: 'AUD-8817',
    action: 'Vendor Tender Disqualification Override (Hindustan Drilling Works)',
    category: 'project',
    actor: 'Director Technical',
    role: 'Director',
    timestamp: 'Yesterday, 04:50 PM',
    ip: '122.161.48.12',
    device: 'Android 14 Native App',
    hash: 'SHA256:99de...41a3',
    status: 'Verified',
  },
  {
    id: 'AUD-8816',
    action: 'Treasury Disbursement Voucher #VOU-048 Authorized (₹ 3,45,000)',
    category: 'finance',
    actor: 'Finance Master',
    role: 'Finance Master',
    timestamp: '07 Oct 2026, 03:22 PM',
    ip: '122.161.48.15',
    device: 'Enterprise Finance Console',
    hash: 'SHA256:10ba...7f62',
    status: 'Verified',
  },
  {
    id: 'AUD-8815',
    action: 'Employee Attendance Shift Roster October 2026 Published',
    category: 'system',
    actor: 'Operations Manager',
    role: 'Manager',
    timestamp: '06 Oct 2026, 09:30 AM',
    ip: '122.161.48.20',
    device: 'Field Operations Tab',
    hash: 'SHA256:55cc...81ee',
    status: 'Verified',
  },
];

// Memoized Audit Card Component for smooth 60fps rendering
const AuditLogCard = React.memo(({ log }: { log: AuditRecord }) => (
  <View style={styles.logCard}>
    <View style={styles.logTopRow}>
      <View style={styles.logIdBadge}>
        <Text style={styles.logIdText}>{log.id}</Text>
      </View>
      <View style={styles.statusPill}>
        <ShieldCheck size={12} color="#059669" strokeWidth={2.5} />
        <Text style={styles.statusPillText}>{log.status}</Text>
      </View>
    </View>

    <Text style={styles.logActionText}>{log.action}</Text>

    <View style={styles.logMetaRow}>
      <View style={styles.metaItem}>
        <User size={13} color="#64748b" />
        <Text style={styles.metaItemText}>
          {log.actor} ({log.role})
        </Text>
      </View>
      <View style={styles.metaItem}>
        <Clock size={13} color="#64748b" />
        <Text style={styles.metaItemText}>{log.timestamp}</Text>
      </View>
    </View>

    <View style={styles.divider} />

    <View style={styles.logFooterRow}>
      <Text style={styles.deviceText}>
        {log.device} • IP {log.ip}
      </Text>
      <Text style={styles.hashText}>{log.hash}</Text>
    </View>
  </View>
));

export const AuditLogScreen: React.FC<AuditLogScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'security' | 'finance' | 'project' | 'role'>('all');

  const filteredLogs = useMemo(() => {
    return INITIAL_AUDIT_LOGS.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  const handleExport = useCallback(() => {
    Alert.alert(
      'Export Audit Trail',
      'Download cryptographic audit ledger report in signed PDF or CSV format?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export CSV',
          onPress: () => Alert.alert('Success', 'Audit ledger CSV exported to local Downloads folder.'),
        },
        {
          text: 'Export PDF',
          onPress: () => Alert.alert('Success', 'Digitally signed Audit PDF generated successfully.'),
        },
      ]
    );
  }, []);

  const renderItem = useCallback(({ item }: { item: AuditRecord }) => {
    return <AuditLogCard log={item} />;
  }, []);

  const keyExtractor = useCallback((item: AuditRecord) => item.id, []);

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
            <Text style={styles.headerTitle} numberOfLines={1}>System Audit Log</Text>
            <Text style={styles.headerSub} numberOfLines={1}>Cryptographic compliance & activity trail</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.8}>
          <Download size={16} color="#0284c7" strokeWidth={2.4} />
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Sticky Top Controls: Search Bar & Filter Chips (Never loses focus on typing) */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search action, actor, or audit ID..."
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Filter Category Chips */}
      <View style={styles.filterChipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all', label: 'All Activities' },
            { key: 'role', label: 'Role Swaps' },
            { key: 'project', label: 'Stage 5 Sign-Offs' },
            { key: 'finance', label: 'Finance & Invoices' },
            { key: 'security', label: 'Security & 2FA' },
          ].map((chip) => (
            <TouchableOpacity
              key={chip.key}
              style={[
                styles.chipBtn,
                selectedCategory === chip.key && styles.chipBtnSelected,
              ]}
              onPress={() => setSelectedCategory(chip.key as any)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipBtnText,
                  selectedCategory === chip.key && styles.chipBtnTextSelected,
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* High performance FlatList */}
      <FlatList
        data={filteredLogs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          <Text style={styles.resultsCountText}>
            Showing {filteredLogs.length} verified audit records
          </Text>
        }
        contentContainerStyle={styles.scrollContent}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertCircle size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Matching Audit Records</Text>
            <Text style={styles.emptySub}>Try searching for a different keyword or category.</Text>
          </View>
        }
      />
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
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  exportBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284c7',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  filterChipsContainer: {
    backgroundColor: '#ffffff',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipBtnSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  chipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  chipBtnTextSelected: {
    color: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  resultsCountText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  logTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logIdBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  logIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  logActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 20,
    marginBottom: 8,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaItemText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  logFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  deviceText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  hashText: {
    fontSize: 10,
    color: '#0284c7',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
  },
});
