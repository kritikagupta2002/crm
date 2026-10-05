import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Plus,
  Trash2,
  Calculator,
  ShieldAlert,
  CheckCircle,
  Building2,
  FileCheck,
} from 'lucide-react-native';
import {
  ScreenContainer,
  AppHeader,
  Card,
  Input,
  Button,
} from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { formatExactCurrency as formatCurrency } from '../../utils';
import { useCrm } from '../../context/CrmContext';
import { QUOTATION_RULES } from '../../constants';

interface QuoteBuilderScreenProps {
  navigation: any;
  route?: any;
}

interface LineItemForm {
  id: string;
  description: string;
  qty: string;
  rate: string;
}

export const QuoteBuilderScreen: React.FC<QuoteBuilderScreenProps> = ({ navigation, route }) => {
  const { leads, saveLeadQuotation } = useCrm();

  const paramLeadId = route?.params?.leadId;
  const isRevision = route?.params?.isRevision;

  const openLeads = leads.filter((l) => l.stage !== 'Won' && l.stage !== 'Lost');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    paramLeadId || (openLeads[0]?.id ?? '')
  );

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    {
      id: 'li-1',
      description: selectedLead?.serviceDetail || 'Geological Diamond Core Drilling',
      qty: '1',
      rate: selectedLead?.quoteValue ? String(Math.round(selectedLead.quoteValue * 0.65)) : '350000',
    },
    {
      id: 'li-2',
      description: 'Field survey & site visits',
      qty: '1',
      rate: selectedLead?.quoteValue ? String(Math.round(selectedLead.quoteValue * 0.25)) : '120000',
    },
    {
      id: 'li-3',
      description: 'Report preparation & submission',
      qty: '1',
      rate: selectedLead?.quoteValue ? String(Math.round(selectedLead.quoteValue * 0.1)) : '50000',
    },
  ]);

  const [discountPct, setDiscountPct] = useState('0');
  const [validDays, setValidDays] = useState('30');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedLead && !paramLeadId) {
      setLineItems([
        {
          id: 'li-1',
          description: selectedLead.serviceDetail || selectedLead.title || 'Technical Geological Service',
          qty: '1',
          rate: selectedLead.quoteValue ? String(Math.round(selectedLead.quoteValue * 0.65)) : '300000',
        },
        {
          id: 'li-2',
          description: 'Field survey & site visits',
          qty: '1',
          rate: selectedLead.quoteValue ? String(Math.round(selectedLead.quoteValue * 0.25)) : '100000',
        },
        {
          id: 'li-3',
          description: 'Report preparation & submission',
          qty: '1',
          rate: selectedLead.quoteValue ? String(Math.round(selectedLead.quoteValue * 0.1)) : '50000',
        },
      ]);
    }
  }, [selectedLeadId]);

  const updateItem = (index: number, field: keyof LineItemForm, value: string) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const addItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: 'li-' + Date.now(),
        description: '',
        qty: '1',
        rate: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (lineItems.length <= 1) {
      Alert.alert('Required', 'A quotation must contain at least 1 line item.');
      return;
    }
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const parsedItems = lineItems.map((i) => ({
    description: i.description,
    qty: Number(i.qty) || 0,
    rate: Number(i.rate) || 0,
    amount: (Number(i.qty) || 0) * (Number(i.rate) || 0),
  }));

  const grossSubtotal = parsedItems.reduce((sum, item) => sum + item.amount, 0);
  const discountPercent = Number(discountPct) || 0;
  const discountVal = Math.round((grossSubtotal * discountPercent) / 100);
  const taxableNet = Math.max(0, grossSubtotal - discountVal);
  const gstAmount = Math.round(taxableNet * 0.18);
  const grandTotal = taxableNet + gstAmount;

  const requiresDirectorApproval =
    grandTotal > QUOTATION_RULES.directorApprovalAmountThreshold ||
    discountPercent > QUOTATION_RULES.directorApprovalDiscountThreshold;

  const handleSaveQuote = async () => {
    if (!selectedLead) {
      Alert.alert('Selection Required', 'Please select an open enquiry for this quotation.');
      return;
    }

    const validLines = parsedItems.filter((i) => i.description.trim() && i.rate > 0);
    if (validLines.length === 0) {
      Alert.alert('Invalid Items', 'Add at least one line item with a service description and unit rate.');
      return;
    }

    setLoading(true);
    try {
      const sentDate = new Date();
      const validUntilDate = new Date(sentDate.getTime() + (Number(validDays) || 30) * 86400000);

      const quoteData = {
        items: validLines.map((l) => ({
          description: l.description.trim(),
          qty: l.qty,
          rate: l.rate,
        })),
        gross: grossSubtotal,
        discountPct: discountPercent,
        discount: discountVal,
        net: taxableNet,
        gstPct: 18,
        gst: gstAmount,
        total: grandTotal,
        validDays: Number(validDays) || 30,
        validUntil: validUntilDate.toISOString().split('T')[0],
      };

      const result = await saveLeadQuotation(selectedLead.id, quoteData);

      Alert.alert(
        'Quotation Generated',
        requiresDirectorApproval
          ? `Quotation ${result.quote.quoteNo} exceeds threshold (₹${grandTotal.toLocaleString('en-IN')}) and has been sent to the Director Approval queue.`
          : `Quotation ${result.quote.quoteNo} generated and sent. Lead moved to Proposal Sent.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title={isRevision ? 'Revise Quotation' : 'New Quotation Builder'}
          subtitle="Itemized pricing engine with automated GST & Director checks"
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Card>
        <Text style={styles.cardTitle}>Enquiry & Client Scope</Text>
        <Text style={styles.inputLabel}>Select Open Enquiry *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leadScroll}>
          {openLeads.map((l) => {
            const isSel = selectedLeadId === l.id;
            return (
              <TouchableOpacity
                key={l.id}
                activeOpacity={0.8}
                disabled={Boolean(paramLeadId)}
                onPress={() => setSelectedLeadId(l.id)}
                style={[styles.leadChip, isSel && styles.leadChipSelected]}
              >
                <Text style={[styles.leadChipText, isSel && styles.leadChipTextSelected]}>
                  {l.company}
                </Text>
                <Text style={[styles.leadChipSub, isSel && styles.leadChipSubSelected]}>
                  {l.id} · {l.serviceDetail || l.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {selectedLead && (
          <View style={styles.selectedLeadDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Client Entity:</Text>
              <Text style={styles.detailVal}>{selectedLead.company}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact Person:</Text>
              <Text style={styles.detailVal}>
                {selectedLead.contactPerson} ({selectedLead.phone})
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Primary Service:</Text>
              <Text style={styles.detailVal}>{selectedLead.serviceDetail || selectedLead.title}</Text>
            </View>
          </View>
        )}
      </Card>

      <Card>
        <View style={styles.lineHeader}>
          <Text style={styles.cardTitle}>Technical Line Items</Text>
          <TouchableOpacity onPress={addItem} style={styles.addItemBtn}>
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addItemText}>Add Line</Text>
          </TouchableOpacity>
        </View>

        {lineItems.map((item, idx) => {
          const rowAmount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
          return (
            <View key={item.id} style={styles.itemRowCard}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemIndex}>Line #{idx + 1}</Text>
                {lineItems.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(idx)} style={styles.trashBtn}>
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>

              <Input
                label="Service / Deliverable Description *"
                placeholder="e.g. Diamond Core Drilling or Geotech Logging"
                value={item.description}
                onChangeText={(val) => updateItem(idx, 'description', val)}
              />

              <View style={styles.fieldGrid}>
                <Input
                  label="Quantity"
                  value={item.qty}
                  onChangeText={(val) => updateItem(idx, 'qty', val)}
                  keyboardType="numeric"
                  containerStyle={styles.halfField}
                />
                <Input
                  label="Unit Rate (₹) *"
                  placeholder="0"
                  value={item.rate}
                  onChangeText={(val) => updateItem(idx, 'rate', val)}
                  keyboardType="numeric"
                  containerStyle={styles.halfField}
                />
              </View>

              <View style={styles.lineTotalRow}>
                <Text style={styles.lineTotalLabel}>Line Item Total:</Text>
                <Text style={styles.lineTotalVal}>{formatCurrency(rowAmount)}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Commercial Parameters & Breakdown</Text>

        <View style={styles.fieldGrid}>
          <Input
            label="Special Discount (%)"
            placeholder="0"
            value={discountPct}
            onChangeText={setDiscountPct}
            keyboardType="decimal-pad"
            helperText={discountPercent > 10 ? 'Discount > 10% requires Director Approval' : undefined}
            containerStyle={styles.halfField}
          />
          <Input
            label="Validity Period (Days)"
            placeholder="30"
            value={validDays}
            onChangeText={setValidDays}
            keyboardType="numeric"
            containerStyle={styles.halfField}
          />
        </View>

        <View style={styles.summaryTable}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Line Items Subtotal:</Text>
            <Text style={styles.sumVal}>{formatCurrency(grossSubtotal)}</Text>
          </View>
          {discountVal > 0 && (
            <View style={styles.sumRow}>
              <Text style={[styles.sumLabel, { color: colors.warningText }]}>
                Discount ({discountPercent}%):
              </Text>
              <Text style={[styles.sumVal, { color: colors.warningText }]}>
                - {formatCurrency(discountVal)}
              </Text>
            </View>
          )}
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Taxable Net:</Text>
            <Text style={styles.sumVal}>{formatCurrency(taxableNet)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Standard GST (18%):</Text>
            <Text style={styles.sumVal}>+ {formatCurrency(gstAmount)}</Text>
          </View>
          <View style={[styles.sumRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Quotation Grand Total:</Text>
            <Text style={styles.totalVal}>{formatCurrency(grandTotal)}</Text>
          </View>
        </View>

        {requiresDirectorApproval ? (
          <View style={styles.approvalNotice}>
            <ShieldAlert size={20} color={colors.warningText} />
            <View style={{ flex: 1 }}>
              <Text style={styles.approvalNoticeTitle}>Director Approval Required</Text>
              <Text style={styles.approvalNoticeText}>
                {grandTotal > QUOTATION_RULES.directorApprovalAmountThreshold
                  ? `Grand total (${formatCurrency(grandTotal)}) exceeds the ₹5,00,000 threshold.`
                  : `Discount (${discountPercent}%) exceeds the 10% commercial limit.`}
                {' '}Requires executive sign-off before client delivery.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.approvedNotice}>
            <CheckCircle size={20} color={colors.successText} />
            <View style={{ flex: 1 }}>
              <Text style={styles.approvedNoticeTitle}>Standard Commercial Parameters</Text>
              <Text style={styles.approvedNoticeText}>
                Within delegated limits. Quotation will be issued immediately upon saving.
              </Text>
            </View>
          </View>
        )}

        <Button
          title={isRevision ? 'Save & Send Revision' : 'Save & Send Quotation'}
          onPress={handleSaveQuote}
          loading={loading}
          size="lg"
          style={styles.saveBtn}
        />
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  leadScroll: {
    marginBottom: spacing.sm,
  },
  leadChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: spacing.xs,
    maxWidth: 200,
  },
  leadChipSelected: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
  },
  leadChipText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  leadChipTextSelected: {
    color: colors.primary,
  },
  leadChipSub: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 2,
  },
  leadChipSubSelected: {
    color: colors.primaryDark,
  },
  selectedLeadDetails: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  detailVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryBg,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  addItemText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  itemRowCard: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemIndex: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
  },
  trashBtn: {
    padding: 4,
  },
  fieldGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  lineTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: 4,
  },
  lineTotalLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  lineTotalVal: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  summaryTable: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    gap: 6,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sumLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  sumVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  totalVal: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primary,
  },
  approvalNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningBg,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warningLight,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  approvalNoticeTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.warningText,
  },
  approvalNoticeText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textPrimary,
    marginTop: 2,
    lineHeight: 16,
  },
  approvedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.successBg,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.successLight,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  approvedNoticeTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.successText,
  },
  approvedNoticeText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textPrimary,
    marginTop: 2,
    lineHeight: 16,
  },
  saveBtn: {
    marginTop: spacing.xs,
  },
});
