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
  MapPin,
  Compass,
  Layers,
  Save,
  CheckCircle,
} from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { Button } from '../../components/common';

interface GeologicalMappingScreenProps {
  navigation: any;
}

export const GeologicalMappingScreen: React.FC<GeologicalMappingScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [stationId, setStationId] = useState('STA-GEO-104');
  const [rockType, setRockType] = useState('Calc-silicate / Dolomitic Marble');
  const [formation, setFormation] = useState('Bhilwara Supergroup');
  const [strike, setStrike] = useState('045°');
  const [dipAmount, setDipAmount] = useState('65°');
  const [dipDirection, setDipDirection] = useState('SE');
  const [coordinates, setCoordinates] = useState('25.3478° N, 74.6342° E (El: 420m)');
  const [notes, setNotes] = useState('Disseminated galena and sphalerite mineralization along quartz veins.');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    Alert.alert('Outcrop Record Saved', `Station ${stationId} successfully recorded and geotagged.`);
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
          <Text style={styles.headerTitle}>Geological Mapping</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldCard}>
          <Text style={styles.cardHeader}>OUTCROP OBSERVATION DATA</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Station / Exposure ID</Text>
            <TextInput
              style={styles.input}
              value={stationId}
              onChangeText={setStationId}
              placeholder="e.g. STA-GEO-101"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Rock Type / Lithology</Text>
            <TextInput
              style={styles.input}
              value={rockType}
              onChangeText={setRockType}
              placeholder="Lithological classification"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Stratigraphic Formation</Text>
            <TextInput
              style={styles.input}
              value={formation}
              onChangeText={setFormation}
              placeholder="Geological group or formation"
            />
          </View>

          <View style={styles.rowTwoCols}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Bedding Strike</Text>
              <TextInput
                style={styles.input}
                value={strike}
                onChangeText={setStrike}
                placeholder="045°"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Dip & Direction</Text>
              <TextInput
                style={styles.input}
                value={`${dipAmount} ${dipDirection}`}
                onChangeText={(v) => {
                  setDipAmount(v);
                }}
                placeholder="65° SE"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>GPS Coordinates & Elevation</Text>
            <View style={styles.coordBox}>
              <MapPin size={15} color="#9a3412" />
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 4 }]}
                value={coordinates}
                onChangeText={setCoordinates}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Field Observations & Mineralization</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="Visual observations, alterations, vein density..."
            />
          </View>

          <Button
            title={isSaved ? "Outcrop Log Synchronized" : "Save Outcrop Observation"}
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
  coordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#f8fafc',
  },
  saveBtn: {
    marginTop: spacing.xs,
    backgroundColor: '#9a3412',
  },
});
