import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Crown,
  Briefcase,
  Users,
  UserCheck,
  Landmark,
  CreditCard,
  Check,
} from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { CANONICAL_ROLES } from '../../constants';

interface RoleSelectionScreenProps {
  navigation: any;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { role, canonicalRole, switchCanonicalRole } = useAuth();
  const [selectedKey, setSelectedKey] = useState<string>(canonicalRole || 'super_admin');
  const [isSwitching, setIsSwitching] = useState(false);

  const getRoleIcon = (key: string, isSelected: boolean) => {
    const iconColor = isSelected ? colors.geo.darkBlue : colors.textMuted;
    switch (key) {
      case 'super_admin':
        return <Crown size={22} color={iconColor} strokeWidth={2.2} />;
      case 'director':
        return <Briefcase size={22} color={iconColor} strokeWidth={2.2} />;
      case 'manager':
        return <Users size={22} color={iconColor} strokeWidth={2.2} />;
      case 'employee':
        return <UserCheck size={22} color={iconColor} strokeWidth={2.2} />;
      case 'finance_master':
        return <Landmark size={22} color={iconColor} strokeWidth={2.2} />;
      case 'accounts_executive':
      default:
        return <CreditCard size={22} color={iconColor} strokeWidth={2.2} />;
    }
  };

  const handleContinue = async () => {
    const item = CANONICAL_ROLES.find((r) => r.key === selectedKey);
    if (!item) return;
    setIsSwitching(true);
    try {
      await switchCanonicalRole(item.key);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (e) {
      console.error('Role switch failed:', e);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Navigation Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.2} />
          <Text style={styles.headerTitle}>Switch Role</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionSubtitle}>
          Select your authorized operational role to switch views
        </Text>

        <View style={styles.roleList}>
          {CANONICAL_ROLES.map((r) => {
            const isSelected = selectedKey === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                activeOpacity={0.75}
                onPress={() => setSelectedKey(r.key)}
                style={[styles.roleCard, isSelected && styles.roleCardSelected]}
              >
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  {getRoleIcon(r.key, isSelected)}
                </View>

                <View style={styles.roleInfo}>
                  <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected]}>
                    {r.title}
                  </Text>
                  <Text style={styles.roleDesc}>{r.description}</Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={isSwitching}
          style={styles.continueBtn}
        >
          <Text style={styles.continueBtnText}>
            {isSwitching ? 'Applying Role...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: '#ffffff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  roleList: {
    gap: 8,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  roleCardSelected: {
    backgroundColor: '#f0f9ff',
    borderColor: colors.geo.darkBlue,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  iconBoxSelected: {
    backgroundColor: 'rgba(11, 37, 69, 0.08)',
    borderColor: colors.geo.darkBlue,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 1,
  },
  roleTitleSelected: {
    color: colors.geo.darkBlue,
  },
  roleDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.geo.darkBlue,
    backgroundColor: colors.geo.darkBlue,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    ...shadows.md,
  },
  continueBtn: {
    backgroundColor: colors.geo.darkBlue,
    height: 50,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
