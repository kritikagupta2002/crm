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
  FlaskConical,
  MapPin,
  Save,
  CheckCircle,
  Tag,
} from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { Button } from '../../components/common';

interface SamplingActivityScreenProps {
  route?: any;
  navigation: any;
}

export const SamplingActivityScreen: React.FC<SamplingActivityScreenProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const initialType = route?.params?.type || 'soil';

  const [samplingType, setSamplingType] = useState<string>(
    initialType === 'stream' ? 'Stream Sediment' : initialType === 'channel' ? 'Channel Chip' : 'Soil Sampling'
  );
  const [sampleId, setSampleId] = useState('SMP-BHL-2026-042');
  const [gridStation, setGridStation] = useState('L1200E / Stn 450N');
  const [depthFromTo, setDepthFromTo] = useState('0.25 - 0.40 m (B-Horizon)');
  const [weightGrams, setWeightGrams] = useState('500');
  const [meshSize, setMeshSize] = useState('-80 mesh (<180 µm)');
  const [matrixDesc, setMatrixDesc] = useState('Brownish red sandy loam with ferricrete fragments.');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    Alert.alert('Geochemical Sample Logged', `Sample ${sampleId} stored in field register.`);
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
          <Text style={styles.headerTitle}>{samplingType}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldCard}>
          <Text style={styles.cardHeader}>GEOCHEMICAL SAMPLE ENTRY</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Barcode / Sample Tag ID</Text>
            <TextInput
              style={styles.input}
              value={sampleId}
              onChangeText={setSampleId}
              placeholder="e.g. SMP-001"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Grid Coordinate / Station</Text>
            <TextInput
              style={styles.input}
              value={gridStation}
              onChangeText={setGridStation}
              placeholder="Line / Peg Station"
            />
          </View>

          <View style={styles.rowTwoCols}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Depth / Horizon</Text>
              <TextInput
                style={styles.input}
                value={depthFromTo}
                onChangeText={setDepthFromTo}
                placeholder="0.2 - 0.4m"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Weight (Grams)</Text>
              <TextInput
                style={styles.input}
                value={weightGrams}
                onChangeText={setWeightGrams}
                keyboardType="numeric"
                placeholder="500"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sieve Fraction / Mesh</Text>
            <TextInput
              style={styles.input}
              value={meshSize}
              onChangeText={setMeshSize}
              placeholder="-80 mesh"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Matrix Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={matrixDesc}
              onChangeText={setMatrixDesc}
              multiline
              numberOfLines={3}
              placeholder="Soil color, moisture, gravel content..."
            />
          </View>

          <Button
            title={isSaved ? "Sample Tagged & Saved" : "Save Sample Record"}
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
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: spacing.xs,
    backgroundColor: '#9a3412',
  },
});
