import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Printer } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { colors, fonts, radius } from '../../theme';
import { useFieldDatabase } from '../../context/FieldDatabaseContext';
import { letterHtml, letterOf } from '../../fieldDatabase/utils/letter';
import { FdButton, Empty, fd } from '../../fieldDatabase/components/ui';

/*
 * The client's DISPATCH FORMAT sheet, filled from the batch, to print or share as a PDF and send with the boxes.
 */
export const DispatchLetterScreen: React.FC<{ navigation: any; route: any }> = ({ route }) => {
  const { fieldRecords } = useFieldDatabase();
  const record = fieldRecords.find((r: any) => r.id === route.params?.recordId);
  const [busy, setBusy] = useState(false);
  if (!record) {
    return (
      <View style={fd.root}>
        <AppHeader title="Dispatch letter" />
        <Empty text="This batch is not available." />
      </View>
    );
  }
  const l = letterOf(record);

  const share = async () => {
    setBusy(true);
    try {
      const html = letterHtml(record);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: `Dispatch ${l.v.BATCH_ID || record.id}` });
      }
    } catch (e: any) {
      Alert.alert('Dispatch letter', e?.message || 'Could not make the PDF.');
    } finally {
      setBusy(false);
    }
  };

  const Line = ({ label, value }: { label: string; value?: string }) => (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value || '—'}</Text>
    </View>
  );

  return (
    <View style={fd.root}>
      <AppHeader title="Dispatch letter" subtitle={l.v.BATCH_ID || record.id} />
      <ScrollView contentContainerStyle={fd.body}>
        <FdButton title="Print / Save as PDF" Icon={Printer} onPress={share} busy={busy} style={{ marginBottom: 12 }} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Sample Dispatch, Preparation & Analysis Format</Text>
          <Line label="Date of Dispatch:" value={l.date} />
          <Line label="Batch ID:" value={l.v.BATCH_ID} />
          {l.top.map(([label, value], i) => (
            <Line key={`${label}-${i}`} label={label} value={value} />
          ))}

          <Text style={styles.sub}>Sample Details:</Text>
          <View style={[styles.gridRow, styles.gridHead]}>
            {['Box No', 'Half Core', 'Rock Chip', 'Pulp', 'Total'].map((h) => (
              <Text key={h} style={[styles.cell, styles.cellHead]}>
                {h}
              </Text>
            ))}
          </View>
          {l.boxes.map((r: any) => (
            <View key={r.box} style={styles.gridRow}>
              {[r.box, r['Half Core'] || '', r['Rock Chip'] || '', r.Pulp || '', r.total].map((c, i) => (
                <Text key={i} style={styles.cell}>
                  {c}
                </Text>
              ))}
            </View>
          ))}
          <View style={[styles.gridRow, styles.gridTotal]}>
            {['Grand Total', l.total['Half Core'] || '', l.total['Rock Chip'] || '', l.total.Pulp || '', l.total.total].map((c, i) => (
              <Text key={i} style={[styles.cell, { fontWeight: '700' }]}>
                {c}
              </Text>
            ))}
          </View>

          {l.bottom.map(([label, value], i) => (
            <Line key={`${label}-${i}`} label={label} value={value} />
          ))}
          <View style={styles.sign}>
            <Text style={styles.signText}>Project Manager</Text>
            <Text style={styles.signText}>Geologist</Text>
          </View>
        </View>
        <Text style={[fd.muted, { marginTop: 10, textAlign: 'center' }]}>The PDF also lists all {l.samples.length} samples of the batch.</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderDark, borderRadius: radius.md, padding: 14 },
  title: { fontFamily: fonts.serif, fontSize: 17, textAlign: 'center', color: colors.textPrimary, marginBottom: 12 },
  line: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingVertical: 7, gap: 10 },
  lineLabel: { width: '40%', fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  lineValue: { flex: 1, fontSize: 13, color: colors.textPrimary },
  sub: { marginTop: 14, marginBottom: 6, fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  gridRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  gridHead: { backgroundColor: colors.primaryBg },
  gridTotal: { backgroundColor: colors.surfaceMuted },
  cell: { flex: 1, textAlign: 'center', paddingVertical: 7, fontSize: 12.5, color: colors.textPrimary },
  cellHead: { fontWeight: '700', fontSize: 11.5, color: colors.textSecondary },
  sign: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 34 },
  signText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
});
