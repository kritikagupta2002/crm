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
  Send,
  Truck,
  CheckCircle,
  Save,
  Building,
} from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { Button } from '../../components/common';

interface DispatchDatabaseScreenProps {
  navigation: any;
}

export const DispatchDatabaseScreen: React.FC<DispatchDatabaseScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [batchNo, setBatchNo] = useState('DISP-BHL-2026-014');
  const [labName, setLabName] = useState('Shiva Analyticals & Assay Labs (NABL)');
  const [sampleCount, setSampleCount] = useState('124 Core Half-Splits');
  const [elementsRequested, setElementsRequested] = useState('Multi-element ICP-MS (48 elements) + Fire Assay for Gold');
  const [courierWaybill, setCourierWaybill] = useState('GATI-EXP-88992144');
  const [securitySealNumbers, setSecuritySealNumbers] = useState('BG-SEAL-8041 to BG-SEAL-8052 (12 Core Boxes)');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    Alert.alert('Dispatch Manifest Generated', `Batch ${batchNo} dispatched to laboratory with active chain-of-custody.`);
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
          <Text style={styles.headerTitle}>Dispatch Database</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldCard}>
          <Text style={styles.cardHeader}>ASSAY LABORATORY DISPATCH MANIFEST</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dispatch Batch ID</Text>
            <TextInput
              style={styles.input}
              value={batchNo}
              onChangeText={setBatchNo}
              placeholder="e.g. DISP-001"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Destination Assay Lab</Text>
            <TextInput
              style={styles.input}
              value={labName}
              onChangeText={setLabName}
              placeholder="Laboratory name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sample Quantity & Type</Text>
            <TextInput
              style={styles.input}
              value={sampleCount}
              onChangeText={setSampleCount}
              placeholder="Count and sample type"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Analytical Method / Elements</Text>
            <TextInput
              style={styles.input}
              value={elementsRequested}
              onChangeText={setElementsRequested}
              placeholder="ICP-MS, XRF, Fire Assay..."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Courier Waybill / Docket No</Text>
            <TextInput
              style={styles.input}
              value={courierWaybill}
              onChangeText={setCourierWaybill}
              placeholder="Tracking number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Security Seal Numbers (Chain of Custody)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={securitySealNumbers}
              onChangeText={setSecuritySealNumbers}
              multiline
              numberOfLines={2}
              placeholder="Security seal serials"
            />
          </View>

          <Button
            title={isSaved ? "Manifest Dispatched & Logged" : "Generate Dispatch Manifest"}
            onPress={handleSave}
            variant="primary"
            icon={isSaved ? <CheckCircle size={16} color="#ffffff" /> : <Send size={16} color="#ffffff" />}
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
    minHeight: 56,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: spacing.xs,
    backgroundColor: '#9a3412',
  },
});
