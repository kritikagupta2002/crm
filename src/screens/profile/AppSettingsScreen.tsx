import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Settings,
  Sun,
  Wifi,
  HardDrive,
  Trash2,
  RefreshCw,
  Smartphone,
  Check,
  CheckCircle2,
  Layers,
  Database,
  Radio,
} from 'lucide-react-native';

interface AppSettingsScreenProps {
  navigation: any;
}

const MAX_STORAGE_MB = 250;

export const AppSettingsScreen: React.FC<AppSettingsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheOpTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (cacheOpTimerRef.current) clearTimeout(cacheOpTimerRef.current);
    };
  }, []);

  // Theme selection: Strictly light themes
  const [selectedTheme, setSelectedTheme] = useState<'system' | 'mineral' | 'sandstone'>('system');

  // Offline sync settings
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);
  const [syncInterval, setSyncInterval] = useState<'5m' | '15m' | '30m'>('15m');

  // Network & data saving
  const [lowDataMode, setLowDataMode] = useState(false);
  const [autoDownloadReports, setAutoDownloadReports] = useState(true);

  // Cache storage state
  const [cacheSizeMb, setCacheSizeMb] = useState(42.8);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheToast, setCacheToast] = useState(false);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cached Data',
      'This will delete cached offline maps and borehole photos. Unsynced DPRs will NOT be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: () => {
            setClearingCache(true);
            if (cacheOpTimerRef.current) clearTimeout(cacheOpTimerRef.current);
            cacheOpTimerRef.current = setTimeout(() => {
              setCacheSizeMb(4.1);
              setClearingCache(false);
              setCacheToast(true);
              if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
              toastTimerRef.current = setTimeout(() => setCacheToast(false), 3000);
            }, 600);
          },
        },
      ]
    );
  }, []);

  const storagePercent = Math.min(100, Math.round((cacheSizeMb / MAX_STORAGE_MB) * 100));

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
            <Text style={styles.headerTitle} numberOfLines={1}>App Settings</Text>
            <Text style={styles.headerSub} numberOfLines={1}>Theme, offline sync & storage limit</Text>
          </View>
        </View>
      </View>

      {/* Cache Cleared Toast */}
      {cacheToast && (
        <View style={styles.toastCard}>
          <CheckCircle2 size={18} color="#059669" strokeWidth={2.4} />
          <Text style={styles.toastText}>Cache cleared successfully! 38.7 MB reclaimed.</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Theme Configuration (Strictly Light Theme Palette) */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Sun size={18} color="#d97706" strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>APPLICATION THEME (100% LIGHT PALETTE)</Text>
          </View>

          {/* Theme Option 1: System Light */}
          <TouchableOpacity
            style={[styles.themeOptionRow, selectedTheme === 'system' && styles.themeOptionSelected]}
            onPress={() => setSelectedTheme('system')}
            activeOpacity={0.75}
          >
            <View style={styles.themeRadioCircle}>
              {selectedTheme === 'system' && <View style={styles.themeRadioDot} />}
            </View>
            <View style={styles.themeTextCol}>
              <Text style={styles.themeTitle}>Enterprise Pure Light (Default)</Text>
              <Text style={styles.themeSub}>Crisp white canvas, slate text & Bansal Geo blue accents</Text>
            </View>
            <View style={[styles.colorPreviewBox, { backgroundColor: '#ffffff', borderColor: '#0284c7' }]} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Theme Option 2: Mineral White */}
          <TouchableOpacity
            style={[styles.themeOptionRow, selectedTheme === 'mineral' && styles.themeOptionSelected]}
            onPress={() => setSelectedTheme('mineral')}
            activeOpacity={0.75}
          >
            <View style={styles.themeRadioCircle}>
              {selectedTheme === 'mineral' && <View style={styles.themeRadioDot} />}
            </View>
            <View style={styles.themeTextCol}>
              <Text style={styles.themeTitle}>Mineral Clean Light</Text>
              <Text style={styles.themeSub}>Subtle cool tint with geological teal highlights</Text>
            </View>
            <View style={[styles.colorPreviewBox, { backgroundColor: '#f0fdfa', borderColor: '#0d9488' }]} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Theme Option 3: Sandstone Light */}
          <TouchableOpacity
            style={[styles.themeOptionRow, selectedTheme === 'sandstone' && styles.themeOptionSelected]}
            onPress={() => setSelectedTheme('sandstone')}
            activeOpacity={0.75}
          >
            <View style={styles.themeRadioCircle}>
              {selectedTheme === 'sandstone' && <View style={styles.themeRadioDot} />}
            </View>
            <View style={styles.themeTextCol}>
              <Text style={styles.themeTitle}>Sandstone Warm Light</Text>
              <Text style={styles.themeSub}>Warm earthy tones for comfortable outdoor readability</Text>
            </View>
            <View style={[styles.colorPreviewBox, { backgroundColor: '#faf8f5', borderColor: '#d97706' }]} />
          </TouchableOpacity>
        </View>

        {/* 2. Offline Synchronization */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Wifi size={18} color="#0284c7" strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>OFFLINE SYNCHRONIZATION</Text>
          </View>

          {/* Master Offline Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Enable Offline Data Caching</Text>
              <Text style={styles.toggleSub}>Store field DPRs & maps locally when off-grid</Text>
            </View>
            <Switch
              value={offlineSyncEnabled}
              onValueChange={setOfflineSyncEnabled}
              trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
              thumbColor={offlineSyncEnabled ? '#0284c7' : '#f8fafc'}
            />
          </View>

          <View style={styles.divider} />

          {/* Wi-Fi only toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Sync Over Wi-Fi Only</Text>
              <Text style={styles.toggleSub}>Conserve mobile cellular data in remote exploration sites</Text>
            </View>
            <Switch
              value={wifiOnly}
              onValueChange={setWifiOnly}
              trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
              thumbColor={wifiOnly ? '#0284c7' : '#f8fafc'}
            />
          </View>

          <View style={styles.divider} />

          {/* Sync frequency selector */}
          <Text style={styles.subOptionHeader}>AUTO-SYNC FREQUENCY</Text>
          <View style={styles.frequencyRow}>
            {(['5m', '15m', '30m'] as const).map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[styles.freqBtn, syncInterval === freq && styles.freqBtnSelected]}
                onPress={() => setSyncInterval(freq)}
                activeOpacity={0.75}
              >
                <Text style={[styles.freqBtnText, syncInterval === freq && styles.freqBtnTextSelected]}>
                  {freq === '5m' ? '5 Minutes' : freq === '15m' ? '15 Minutes' : '30 Minutes'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. Storage & Cache Management */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderBetween}>
            <View style={styles.cardHeaderRow}>
              <HardDrive size={18} color="#059669" strokeWidth={2.4} />
              <Text style={styles.sectionTitle}>STORAGE & CACHE LIMIT</Text>
            </View>
            <Text style={styles.storageFractionText}>
              {cacheSizeMb.toFixed(1)} MB / {MAX_STORAGE_MB} MB
            </Text>
          </View>

          {/* Storage Progress Bar */}
          <View style={styles.storageBarBg}>
            <View style={[styles.storageBarFill, { width: `${storagePercent}%` }]} />
          </View>
          <Text style={styles.storageNoticeText}>
            {storagePercent}% allocated storage used. Auto-cleanup occurs above 230 MB.
          </Text>

          {/* Breakdown Pills */}
          <View style={styles.storageBreakdown}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: '#0284c7' }]} />
              <Text style={styles.breakdownLabel}>Offline Maps (18.2 MB)</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.breakdownLabel}>Core Scans (16.4 MB)</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: '#d97706' }]} />
              <Text style={styles.breakdownLabel}>Reports & Invoices (8.2 MB)</Text>
            </View>
          </View>

          {/* Clear Cache Button */}
          <TouchableOpacity
            style={styles.clearCacheBtn}
            onPress={handleClearCache}
            disabled={clearingCache}
            activeOpacity={0.8}
          >
            <Trash2 size={16} color="#dc2626" strokeWidth={2.2} />
            <Text style={styles.clearCacheBtnText}>
              {clearingCache ? 'Clearing Cache...' : 'Clear Cached Maps & Scans'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Network Optimization */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DATA CONSERVATION</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Low Bandwidth Optimization</Text>
              <Text style={styles.toggleSub}>Compress photos captured at remote drill rigs</Text>
            </View>
            <Switch
              value={lowDataMode}
              onValueChange={setLowDataMode}
              trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
              thumbColor={lowDataMode ? '#0284c7' : '#f8fafc'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Auto-Download Stage 5 PDF Deliverables</Text>
              <Text style={styles.toggleSub}>Pre-fetch certified reports for offline preview</Text>
            </View>
            <Switch
              value={autoDownloadReports}
              onValueChange={setAutoDownloadReports}
              trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
              thumbColor={autoDownloadReports ? '#0284c7' : '#f8fafc'}
            />
          </View>
        </View>

        {/* 5. Software Build Info */}
        <View style={styles.buildInfoCard}>
          <Text style={styles.buildTitle}>Bansal Geo Mobile Suite</Text>
          <Text style={styles.buildVersion}>Enterprise Production Build v2.4.0</Text>
          <Text style={styles.buildMeta}>Environment: Production • Architecture: Universal Native</Text>
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
  cardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  themeOptionSelected: {
    backgroundColor: '#f0f9ff',
  },
  themeRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284c7',
  },
  themeTextCol: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  themeSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  colorPreviewBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  toggleTextCol: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  subOptionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  freqBtnSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  freqBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  freqBtnTextSelected: {
    color: '#ffffff',
  },
  storageFractionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  storageBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    marginBottom: 6,
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  storageNoticeText: {
    fontSize: 11.5,
    color: '#64748b',
    marginBottom: 10,
  },
  storageBreakdown: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  clearCacheBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearCacheBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  buildInfoCard: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  buildTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  buildVersion: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '700',
    marginTop: 2,
  },
  buildMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
});
