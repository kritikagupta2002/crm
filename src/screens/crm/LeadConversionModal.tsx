import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { UserCheck, Building, FileCheck2, ArrowRight } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, Input, Button } from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { useCrm } from '../../context/CrmContext';

interface LeadConversionModalProps {
  route: any;
  navigation: any;
}

export const LeadConversionModal: React.FC<LeadConversionModalProps> = ({ route, navigation }) => {
  const { leadId } = route.params;
  const { leads, convertLead } = useCrm();

  const lead = leads.find((l) => l.id === leadId);

  const [gstin, setGstin] = useState('08AAACT1234Q1Z5');
  const [pan, setPan] = useState('AAACT1234Q');
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!gstin.trim() || gstin.trim().length !== 15) {
      Alert.alert('Validation Error', 'Please enter a valid 15-character Indian GSTIN.');
      return;
    }
    if (!pan.trim() || pan.trim().length !== 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-character Permanent Account Number (PAN).');
      return;
    }

    setLoading(true);
    try {
      const res = await convertLead(leadId, gstin.trim(), pan.trim());
      Alert.alert(
        'Lead Successfully Converted!',
        `1. Created Client: ${res.client.name}\n2. Instantiated Project ERM: ${res.project.projectCode}\n3. Updated Lead Stage to 'Won'`,
        [
          {
            text: 'View Project Workspace',
            onPress: () => {
              navigation.replace('ProjectDetail', { projectId: res.project.id });
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Conversion Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!lead) {
    return (
      <ScreenContainer scrollable={false}>
        <AppHeader title="Convert Lead" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text>Lead not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title="Convert Lead"
          subtitle={lead.company}
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Card style={styles.bannerCard}>
        <View style={styles.bannerHeader}>
          <UserCheck size={24} color={colors.primary} />
          <Text style={styles.bannerTitle}>Commercial Onboarding & ERM Link</Text>
        </View>
        <Text style={styles.bannerDesc}>
          Converting this lead executes an automated two-way cross-module integration:
        </Text>
        <View style={styles.checkItem}>
          <FileCheck2 size={16} color={colors.success} />
          <Text style={styles.checkText}>
            Enrolls <Text style={styles.bold}>{lead.company}</Text> into the corporate Client Master directory.
          </Text>
        </View>
        <View style={styles.checkItem}>
          <FileCheck2 size={16} color={colors.success} />
          <Text style={styles.checkText}>
            Initializes a 7-stage geological project draft with baseline budget ₹{lead.estimatedValue.toLocaleString('en-IN')}.
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Client Tax & Compliance Identification</Text>

        <Input
          label="Corporate Client Name"
          value={lead.company}
          editable={false}
        />

        <Input
          label="GST Identification Number (GSTIN) *"
          placeholder="e.g. 08AAACT1234Q1Z5"
          value={gstin}
          onChangeText={setGstin}
          autoCapitalize="characters"
          maxLength={15}
          helperText="15-character alphanumeric Indian state tax code"
        />

        <Input
          label="Permanent Account Number (PAN) *"
          placeholder="e.g. AAACT1234Q"
          value={pan}
          onChangeText={setPan}
          autoCapitalize="characters"
          maxLength={10}
          helperText="10-character corporate income tax PAN"
        />

        <Button
          title="Execute Lead Conversion"
          onPress={handleConvert}
          loading={loading}
          size="lg"
          style={styles.convertBtn}
        />
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCard: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primaryLight,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  bannerTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  bannerDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  checkText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  bold: {
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  convertBtn: {
    marginTop: spacing.md,
  },
});
