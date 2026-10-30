import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Globe,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Clock,
  Check,
} from 'lucide-react-native';

interface LanguageScreenProps {
  navigation: any;
}

export const LanguageScreen: React.FC<LanguageScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const [selectedLanguage, setSelectedLanguage] = useState<'en'>('en');
  const [currencyFormat, setCurrencyFormat] = useState<'in' | 'intl'>('in');
  const [dateFormat, setDateFormat] = useState<'dmy' | 'ymd' | 'dMy'>('dmy');
  const [savedToast, setSavedToast] = useState(false);

  const triggerToast = useCallback(() => {
    setSavedToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSavedToast(false), 2000);
  }, []);

  const handleSelectLang = useCallback(
    (code: 'en') => {
      setSelectedLanguage(code);
      triggerToast();
    },
    [triggerToast]
  );

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
            <Text style={styles.headerTitle} numberOfLines={1}>Language & Regional</Text>
            <Text style={styles.headerSub} numberOfLines={1}>Language, currency & date formats</Text>
          </View>
        </View>
      </View>

      {savedToast && (
        <View style={styles.toastCard}>
          <CheckCircle2 size={16} color="#2e9e6b" strokeWidth={2.4} />
          <Text style={styles.toastText}>Regional preferences saved</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Globe size={18} color="#2f6fb3" strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>INTERFACE LANGUAGE</Text>
          </View>

          <TouchableOpacity
            style={[styles.langRow, styles.langRowSelected]}
            onPress={() => handleSelectLang('en')}
            activeOpacity={0.8}
          >
            <View style={styles.langRadio}>
              <View style={styles.langRadioDot} />
            </View>
            <View style={styles.langTextCol}>
              <Text style={styles.langTitle}>English (India)</Text>
              <Text style={styles.langNative}>Corporate standard interface</Text>
            </View>
            <Check size={18} color="#2f6fb3" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <IndianRupee size={18} color="#2e9e6b" strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>FINANCIAL NUMBER SYSTEM</Text>
          </View>

          <TouchableOpacity
            style={[styles.formatOption, currencyFormat === 'in' && styles.formatOptionSelected]}
            onPress={() => {
              setCurrencyFormat('in');
              triggerToast();
            }}
            activeOpacity={0.75}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.formatTitle}>Indian Lakhs & Crores (₹)</Text>
              <Text style={styles.formatExample}>Example: ₹ 38,20,000 (₹ 38.20 Lakhs)</Text>
            </View>
            {currencyFormat === 'in' && <Check size={18} color="#2e9e6b" strokeWidth={2.5} />}
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.formatOption, currencyFormat === 'intl' && styles.formatOptionSelected]}
            onPress={() => {
              setCurrencyFormat('intl');
              triggerToast();
            }}
            activeOpacity={0.75}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.formatTitle}>International System (Millions)</Text>
              <Text style={styles.formatExample}>Example: ₹ 3,820,000 (3.82M)</Text>
            </View>
            {currencyFormat === 'intl' && <Check size={18} color="#2e9e6b" strokeWidth={2.5} />}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Calendar size={18} color="#c27a12" strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>DATE DISPLAY FORMAT</Text>
          </View>

          <TouchableOpacity
            style={[styles.formatOption, dateFormat === 'dmy' && styles.formatOptionSelected]}
            onPress={() => {
              setDateFormat('dmy');
              triggerToast();
            }}
            activeOpacity={0.75}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.formatTitle}>DD/MM/YYYY (Standard Indian)</Text>
              <Text style={styles.formatExample}>09/10/2026</Text>
            </View>
            {dateFormat === 'dmy' && <Check size={18} color="#c27a12" strokeWidth={2.5} />}
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.formatOption, dateFormat === 'dMy' && styles.formatOptionSelected]}
            onPress={() => {
              setDateFormat('dMy');
              triggerToast();
            }}
            activeOpacity={0.75}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.formatTitle}>DD MMM YYYY (Expanded Month)</Text>
              <Text style={styles.formatExample}>09 Oct 2026</Text>
            </View>
            {dateFormat === 'dMy' && <Check size={18} color="#c27a12" strokeWidth={2.5} />}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Clock size={18} color="#627079" strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>TIME ZONE</Text>
          </View>
          <View style={styles.timeZoneRow}>
            <Text style={styles.timeZoneTitle}>Indian Standard Time (IST)</Text>
            <View style={styles.tzBadge}>
              <Text style={styles.tzBadgeText}>UTC +05:30</Text>
            </View>
          </View>
          <Text style={styles.timeZoneSub}>
            All borehole footage logs and DPR dispatches are synchronized with IST.
          </Text>
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
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfe3d0',
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#237a53',
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
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  langRowSelected: {
    backgroundColor: '#e6effa',
  },
  langRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2f6fb3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2f6fb3',
  },
  langTextCol: {
    flex: 1,
  },
  langTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f2a3d',
  },
  langNative: {
    fontSize: 11.5,
    color: '#627079',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#edf1f3',
    marginVertical: 8,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  formatOptionSelected: {
    backgroundColor: '#f4f7f8',
  },
  formatTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f2a3d',
  },
  formatExample: {
    fontSize: 11.5,
    color: '#627079',
    marginTop: 2,
  },
  timeZoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeZoneTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f2a3d',
  },
  tzBadge: {
    backgroundColor: '#edf1f3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e1e8eb',
  },
  tzBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4a5b68',
  },
  timeZoneSub: {
    fontSize: 11.5,
    color: '#627079',
    marginTop: 4,
  },
});
