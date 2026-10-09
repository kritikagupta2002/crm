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

  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'gu' | 'mr'>('en');
  const [currencyFormat, setCurrencyFormat] = useState<'in' | 'intl'>('in');
  const [dateFormat, setDateFormat] = useState<'dmy' | 'ymd' | 'dMy'>('dmy');
  const [savedToast, setSavedToast] = useState(false);

  const triggerToast = useCallback(() => {
    setSavedToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSavedToast(false), 2000);
  }, []);

  const handleSelectLang = useCallback(
    (code: 'en' | 'hi' | 'gu' | 'mr') => {
      setSelectedLanguage(code);
      triggerToast();
    },
    [triggerToast]
  );

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
            <Text style={styles.headerTitle} numberOfLines={1}>Language & Regional</Text>
            <Text style={styles.headerSub} numberOfLines={1}>Language, currency & date formats</Text>
          </View>
        </View>
      </View>

      {/* Auto-saved feedback */}
      {savedToast && (
        <View style={styles.toastCard}>
          <CheckCircle2 size={16} color="#059669" strokeWidth={2.4} />
          <Text style={styles.toastText}>Regional preferences saved</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Interface Language */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Globe size={18} color="#0284c7" strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>INTERFACE LANGUAGE</Text>
          </View>

          {/* English */}
          <TouchableOpacity
            style={[styles.langRow, selectedLanguage === 'en' && styles.langRowSelected]}
            onPress={() => handleSelectLang('en')}
            activeOpacity={0.75}
          >
            <View style={styles.langRadio}>
              {selectedLanguage === 'en' && <View style={styles.langRadioDot} />}
            </View>
            <View style={styles.langTextCol}>
              <Text style={styles.langTitle}>English (India)</Text>
              <Text style={styles.langNative}>Corporate standard interface</Text>
            </View>
            {selectedLanguage === 'en' && <Check size={18} color="#0284c7" strokeWidth={2.5} />}
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Hindi */}
          <TouchableOpacity
            style={[styles.langRow, selectedLanguage === 'hi' && styles.langRowSelected]}
            onPress={() => handleSelectLang('hi')}
            activeOpacity={0.75}
          >
            <View style={styles.langRadio}>
              {selectedLanguage === 'hi' && <View style={styles.langRadioDot} />}
            </View>
            <View style={styles.langTextCol}>
              <Text style={styles.langTitle}>हिन्दी (Hindi)</Text>
              <Text style={styles.langNative}>भारत • राष्ट्रीय भाषा समर्थन</Text>
            </View>
            {selectedLanguage === 'hi' && <Check size={18} color="#0284c7" strokeWidth={2.5} />}
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Gujarati */}
          <TouchableOpacity
            style={[styles.langRow, selectedLanguage === 'gu' && styles.langRowSelected]}
            onPress={() => handleSelectLang('gu')}
            activeOpacity={0.75}
          >
            <View style={styles.langRadio}>
              {selectedLanguage === 'gu' && <View style={styles.langRadioDot} />}
            </View>
            <View style={styles.langTextCol}>
              <Text style={styles.langTitle}>ગુજરાતી (Gujarati)</Text>
              <Text style={styles.langNative}>પશ્ચિમ ભારત ખનન ક્ષેત્ર</Text>
            </View>
            {selectedLanguage === 'gu' && <Check size={18} color="#0284c7" strokeWidth={2.5} />}
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Marathi */}
          <TouchableOpacity
            style={[styles.langRow, selectedLanguage === 'mr' && styles.langRowSelected]}
            onPress={() => handleSelectLang('mr')}
            activeOpacity={0.75}
          >
            <View style={styles.langRadio}>
              {selectedLanguage === 'mr' && <View style={styles.langRadioDot} />}
            </View>
            <View style={styles.langTextCol}>
              <Text style={styles.langTitle}>मराठी (Marathi)</Text>
              <Text style={styles.langNative}>महाराष्ट्र भूवैज्ञानिक सर्वेक्षण</Text>
            </View>
            {selectedLanguage === 'mr' && <Check size={18} color="#0284c7" strokeWidth={2.5} />}
          </TouchableOpacity>
        </View>

        {/* 2. Number & Currency Display */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <IndianRupee size={18} color="#059669" strokeWidth={2.4} />
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
            {currencyFormat === 'in' && <Check size={18} color="#059669" strokeWidth={2.5} />}
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
            {currencyFormat === 'intl' && <Check size={18} color="#059669" strokeWidth={2.5} />}
          </TouchableOpacity>
        </View>

        {/* 3. Date & Time Format */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Calendar size={18} color="#d97706" strokeWidth={2.4} />
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
            {dateFormat === 'dmy' && <Check size={18} color="#d97706" strokeWidth={2.5} />}
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
            {dateFormat === 'dMy' && <Check size={18} color="#d97706" strokeWidth={2.5} />}
          </TouchableOpacity>
        </View>

        {/* 4. Time Zone */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Clock size={18} color="#64748b" strokeWidth={2.4} />
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
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  toastText: {
    fontSize: 12,
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
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748b',
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
    backgroundColor: '#f0f9ff',
  },
  langRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284c7',
  },
  langTextCol: {
    flex: 1,
  },
  langTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  langNative: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
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
    backgroundColor: '#f8fafc',
  },
  formatTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  formatExample: {
    fontSize: 11.5,
    color: '#64748b',
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
    color: '#0f172a',
  },
  tzBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tzBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  timeZoneSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 4,
  },
});
