import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { ScreenContainer, AppHeader, Input, Button, Card } from '../../components/common';
import { colors, spacing, typography } from '../../theme';
import { useCrm } from '../../context/CrmContext';

interface PublicEnquiryScreenProps {
  navigation: any;
}

export const PublicEnquiryScreen: React.FC<PublicEnquiryScreenProps> = ({ navigation }) => {
  const { addLead } = useCrm();

  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!company.trim() || !contactName.trim() || !phone.trim() || !title.trim()) {
      Alert.alert('Required Fields', 'Please complete Company Name, Project Title, Contact Name, and Phone Number.');
      return;
    }

    setLoading(true);
    try {
      await addLead({
        title: title.trim(),
        company: company.trim(),
        contactName: contactName.trim(),
        email: email.trim() || 'contact@client.com',
        phone: phone.trim(),
        estimatedValue: Number(estimatedValue) || 1000000,
        stage: 'New',
        notes: notes.trim() || 'Public web exploration enquiry submission.',
        assignedTo: 'Unassigned',
      });
      setSubmitted(true);
    } catch (e: any) {
      Alert.alert('Submission Error', e.message || 'Failed to submit enquiry.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ScreenContainer scrollable={false}>
        <AppHeader title="Enquiry Received" showBack onBack={() => navigation.goBack()} />
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Enquiry Successfully Submitted!</Text>
          <Text style={styles.successDesc}>
            Thank you for contacting Bansal Geosurveys Pvt Ltd. Our commercial geological team has received your inquiry for "{title}" and will contact you within 24 hours.
          </Text>
          <Button
            title="Return to Sign In"
            onPress={() => navigation.goBack()}
            size="lg"
            style={styles.returnBtn}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title="Public Geological Enquiry"
        subtitle="Submit exploration project requirements"
        showBack
        onBack={() => navigation.goBack()}
      />

      <Card style={styles.card}>
        <Text style={styles.cardHeader}>Exploration Enquiry Form</Text>
        <Text style={styles.cardSubtitle}>
          Provide your mining block or geological survey details for technical feasibility estimation.
        </Text>

        <Input
          label="Company / Mining Concessionaire *"
          placeholder="e.g. Rajasthan Mineral Ventures Pvt Ltd"
          value={company}
          onChangeText={setCompany}
        />

        <Input
          label="Exploration Project Scope / Title *"
          placeholder="e.g. Diamond Core Drilling & Assay - Bhilwara"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Authorized Point of Contact *"
          placeholder="e.g. Rajesh Meena"
          value={contactName}
          onChangeText={setContactName}
        />

        <Input
          label="Contact Phone Number *"
          placeholder="e.g. 9829012345"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Input
          label="Corporate Email Address"
          placeholder="e.g. r.meena@minerals.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Estimated Budget / Value (INR)"
          placeholder="e.g. 2500000"
          value={estimatedValue}
          onChangeText={setEstimatedValue}
          keyboardType="numeric"
        />

        <Input
          label="Technical Scope & Notes"
          placeholder="Specify drilling depth, target minerals, geological terrain..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        <Button
          title="Submit Geological Enquiry"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
  },
  cardHeader: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.successText,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  successDesc: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  returnBtn: {
    minWidth: 220,
  },
});
