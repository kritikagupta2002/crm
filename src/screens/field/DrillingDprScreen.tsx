import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Compass,
  Layers,
  Save,
  CheckCircle,
} from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { Button } from '../../components/common';

interface DrillingDprScreenProps {
  route?: any;
  navigation: any;
}

export const DrillingDprScreen: React.FC<DrillingDprScreenProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dprType = route?.params?.type === 'non-core' ? 'Non-Core Drilling DPR' : 'Core Drilling Daily Progress (DPR)';

  const [holeId, setHoleId] = useState('BH-BHL-04');
  const [rigNumber, setRigNumber] = useState('RIG-02 (Hydraulic Diamond Core)');
  const [shift, setShift] = useState('Day Shift (08:00 - 20:00)');
  const [depthFrom, setDepthFrom] = useState('140.00');
  const [depthTo, setDepthTo] = useState('168.50');
  const [recoveryPct, setRecoveryPct] = useState('96.5%');
  const [rqdPct, setRqdPct] = useState('88%');
  const [lithology, setLithology] = useState('Biotite-Garnet Schist with stringer Galena & Sphalerite mineralization.');
  const [drillerName, setDrillerName] = useState('Omprakash Sharma');
  const [isSaved, setIsSaved] = useState(false);

  const metersDrilled = (parseFloat(depthTo) - parseFloat(depthFrom)).toFixed(2);

  const handleSave = () => {
    setIsSaved(true);
    Alert.alert('Drilling DPR Stored', `Borehole ${holeId} logged with ${metersDrilled}m drilled today.`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.2} />
          <Text style={styles.headerTitle}>{dprType}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldCard}>
          <Text style={styles.cardHeader}>BOREHOLE SHIFT REPORT</Text>

          <View style={styles.rowTwoCols}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Borehole ID</Text>
              <TextInput
                style={styles.input}
                value={holeId}
                onChangeText={setHoleId}
                placeholder="BH-01"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Rig Machine</Text>
              <TextInput
                style={styles.input}
                value={rigNumber}
                onChangeText={setRigNumber}
                placeholder="Rig ID"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Operating Shift</Text>
            <TextInput
              style={styles.input}
              value={shift}
              onChangeText={setShift}
              placeholder="Shift timing"
            />
          </View>

          <View style={styles.rowTwoCols}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>From Depth (m)</Text>
              <TextInput
                style={styles.input}
                value={depthFrom}
                onChangeText={setDepthFrom}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>To Depth (m)</Text>
              <TextInput
                style={styles.input}
                value={depthTo}
                onChangeText={setDepthTo}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.metersBadge}>
            <Text style={styles.metersBadgeText}>
              Shift Progress: {isNaN(parseFloat(metersDrilled)) ? '0' : metersDrilled} Meters Drilled
            </Text>
          </View>

          <View style={styles.rowTwoCols}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Core Recovery %</Text>
              <TextInput
                style={styles.input}
                value={recoveryPct}
                onChangeText={setRecoveryPct}
                placeholder="95%"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>RQD %</Text>
              <TextInput
                style={styles.input}
                value={rqdPct}
                onChangeText={setRqdPct}
                placeholder="85%"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lithology & Core Logging Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={lithology}
              onChangeText={setLithology}
              multiline
              numberOfLines={3}
              placeholder="Formation, visual mineralization, core fractures..."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lead Driller / Rig Operator</Text>
            <TextInput
              style={styles.input}
              value={drillerName}
              onChangeText={setDrillerName}
              placeholder="Driller name"
            />
          </View>

          <Button
            title={isSaved ? "DPR Certified & Saved" : "Save Daily Progress Report"}
            onPress={handleSave}
            variant="primary"
            icon={isSaved ? <CheckCircle size={16} color="#ffffff" /> : <Save size={16} color="#ffffff" />}
            style={styles.saveBtn}
          />
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.xs,
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  fieldCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    ...shadows.xs,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9a3412',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    fontSize: 13.5,
    color: colors.textPrimary,
    backgroundColor: '#f8fafc',
  },
  metersBadge: {
    backgroundColor: '#fff7ed',
    borderRadius: radius.md,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  metersBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#9a3412',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: spacing.xs,
    backgroundColor: '#9a3412',
  },
});
