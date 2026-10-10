import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFinance, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, Input, EmptyState } from '../../components';
import { GstTransaction, GstReturn } from '../../types';
import { formatDate } from '../../utils/date';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Download,
  X,
  FileCheck2,
  Calendar,
  Building,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Filter,
} from 'lucide-react-native';

const SUPPLY_TYPES = ['All', 'Outward (B2B Taxable)', 'Inward (Contractor B2B)'] as const;

export const GstOverviewScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { gstTransactions, gstReturns } = useFinance();
  const { hasRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'ledger' | 'returns'>('ledger');
  const [search, setSearch] = useState('');
  const [selectedSupplyType, setSelectedSupplyType] = useState<string>('All');
  const [selectedTransaction, setSelectedTransaction] = useState<GstTransaction | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<GstReturn | null>(null);

  const outputTxns = useMemo(
    () => gstTransactions.filter(g => g.supplyType.includes('Outward')),
    [gstTransactions]
  );
  const inputTxns = useMemo(
    () => gstTransactions.filter(g => g.supplyType.includes('Inward')),
    [gstTransactions]
  );

  const totalOutputGst = useMemo(
    () => outputTxns.reduce((sum, g) => sum + g.totalGst, 0),
    [outputTxns]
  );
  const totalInputItc = useMemo(
    () =>
      inputTxns
        .filter(g => g.itcEligibility === 'Eligible')
        .reduce((sum, g) => sum + g.totalGst, 0),
    [inputTxns]
  );
  const netGstLiability = Math.max(0, totalOutputGst - totalInputItc);

  const outputCgst = useMemo(() => outputTxns.reduce((sum, g) => sum + g.cgst, 0), [outputTxns]);
  const outputSgst = useMemo(() => outputTxns.reduce((sum, g) => sum + g.sgst, 0), [outputTxns]);
  const outputIgst = useMemo(() => outputTxns.reduce((sum, g) => sum + g.igst, 0), [outputTxns]);

  const inputCgst = useMemo(() => inputTxns.reduce((sum, g) => sum + g.cgst, 0), [inputTxns]);
  const inputSgst = useMemo(() => inputTxns.reduce((sum, g) => sum + g.sgst, 0), [inputTxns]);
  const inputIgst = useMemo(() => inputTxns.reduce((sum, g) => sum + g.igst, 0), [inputTxns]);

  const filteredTransactions = useMemo(() => {
    return gstTransactions.filter(g => {
      const q = search.toLowerCase();
      const matchesSearch =
        g.docNumber.toLowerCase().includes(q) ||
        g.counterPartyName.toLowerCase().includes(q) ||
        g.counterPartyGstin.toLowerCase().includes(q);
      const matchesType =
        selectedSupplyType === 'All' || g.supplyType.includes(selectedSupplyType.split(' ')[0]);

      return matchesSearch && matchesType;
    });
  }, [gstTransactions, search, selectedSupplyType]);

  const renderGstTransactionCard = ({ item }: { item: GstTransaction }) => {
    const isOutward = item.supplyType.includes('Outward');

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedTransaction(item)}
      >
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.tagWrap}>
              <Text style={styles.docNumber}>{item.docNumber}</Text>
              <View
                style={[
                  styles.supplyBadge,
                  isOutward ? styles.outwardBadge : styles.inwardBadge,
                ]}
              >
                <Text
                  style={[
                    styles.supplyBadgeText,
                    isOutward ? styles.outwardText : styles.inwardText,
                  ]}
                >
                  {isOutward ? 'Outward (Sales)' : 'Inward (ITC)'}
                </Text>
              </View>
            </View>
            <Text style={styles.dateText}>{item.invoiceDate}</Text>
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.partyName} numberOfLines={1}>
              {item.counterPartyName}
            </Text>
            <Text style={styles.gstinText}>GSTIN: {item.counterPartyGstin}</Text>
          </View>

          <View style={styles.taxGrid}>
            <View style={styles.taxCol}>
              <Text style={styles.taxLabel}>TAXABLE VAL</Text>
              <Text style={styles.taxVal}>₹{item.taxableValue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.taxCol}>
              <Text style={styles.taxLabel}>
                {item.igst > 0 ? 'IGST (18%)' : 'CGST+SGST'}
              </Text>
              <Text style={styles.taxVal}>
                {item.igst > 0
                  ? `₹${item.igst.toLocaleString('en-IN')}`
                  : `₹${(item.cgst + item.sgst).toLocaleString('en-IN')}`}
              </Text>
            </View>
            <View style={styles.taxCol}>
              <Text style={styles.taxLabel}>TOTAL TAX</Text>
              <Text
                style={[
                  styles.taxVal,
                  { color: isOutward ? colors.primary : colors.semantic.success, fontWeight: '800' },
                ]}
              >
                ₹{item.totalGst.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.supplySub}>{item.supplyType}</Text>
            <View
              style={[
                styles.itcBadge,
                item.itcEligibility === 'Eligible' ? styles.itcEligible : styles.itcIneligible,
              ]}
            >
              <Text
                style={[
                  styles.itcBadgeText,
                  item.itcEligibility === 'Eligible'
                    ? styles.itcEligibleText
                    : styles.itcIneligibleText,
                ]}
              >
                ITC: {item.itcEligibility}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderReturnCard = ({ item }: { item: GstReturn }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setSelectedReturn(item)}
    >
      <Card style={styles.returnCard}>
        <View style={styles.returnHeader}>
          <View style={styles.returnTypeBadge}>
            <Text style={styles.returnTypeText}>{item.returnType}</Text>
          </View>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <Text style={styles.returnPeriod}>{item.period}</Text>
        <Text style={styles.returnDueDate}>Due Date: {item.dueDate}</Text>

        {item.arnNumber ? (
          <View style={styles.arnBox}>
            <Text style={styles.arnLabel}>ARN: </Text>
            <Text style={styles.arnVal}>{item.arnNumber}</Text>
          </View>
        ) : (
          <Text style={styles.pendingFilingText}>Filing schedule pending portal upload</Text>
        )}

        <View style={styles.returnCardFooter}>
          <Text style={styles.viewReturnLink}>View Filing Acknowledgement →</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="GST Compliance & Ledger"
        subtitle="GSTR-1, GSTR-3B liability & Input Tax Credit (ITC)"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.gstr1Btn}
            onPress={() =>
              Alert.alert(
                'GSTR-1 JSON Payload Export',
                `Official GSTR-1 JSON export payload prepared with ${outputTxns.length} B2B outward invoices. Ready for upload on GST Portal.`
              )
            }
          >
            <Download size={15} color={colors.primary} />
            <Text style={styles.gstr1BtnText}>GSTR-1 JSON</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 40, 72) }}
      >
        <View style={styles.formulaBanner}>
          <View style={styles.formulaHeader}>
            <ShieldCheck size={20} color={colors.primary} />
            <Text style={styles.formulaTitle}>GST Offset Reconciliation</Text>
          </View>
          <Text style={styles.formulaMath}>
            OUTPUT GST (₹{totalOutputGst.toLocaleString('en-IN')}) - INPUT CREDIT (₹{totalInputItc.toLocaleString('en-IN')}) = NET LIABILITY (₹{netGstLiability.toLocaleString('en-IN')})
          </Text>
        </View>

        <View style={styles.kpiContainer}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>NET GST PAYABLE</Text>
              <Text style={[styles.kpiVal, { color: colors.primary }]}>
                ₹{netGstLiability.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.kpiSub}>GSTR-3B cash liability</Text>
            </View>

            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>OUTPUT GST (SALES)</Text>
              <Text style={styles.kpiVal}>₹{totalOutputGst.toLocaleString('en-IN')}</Text>
              <Text style={styles.kpiSub}>From client invoices</Text>
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>INPUT CREDIT (ITC)</Text>
              <Text style={[styles.kpiVal, { color: colors.semantic.success }]}>
                ₹{totalInputItc.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.kpiSub}>On vendor/contractor bills</Text>
            </View>

            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>B2B TRANSACTIONS</Text>
              <Text style={styles.kpiVal}>{gstTransactions.length}</Text>
              <Text style={styles.kpiSub}>Audited tax entries</Text>
            </View>
          </View>
        </View>

        <View style={styles.matrixCard}>
          <Text style={styles.matrixTitle}>TAX COMPONENT BREAKDOWN (CGST / SGST / IGST)</Text>
          <View style={styles.matrixTable}>
            <View style={styles.matrixHeaderRow}>
              <Text style={[styles.matrixColHead, { flex: 2 }]}>FLOW</Text>
              <Text style={[styles.matrixColHead, { flex: 1, textAlign: 'right' }]}>CGST (₹)</Text>
              <Text style={[styles.matrixColHead, { flex: 1, textAlign: 'right' }]}>SGST (₹)</Text>
              <Text style={[styles.matrixColHead, { flex: 1, textAlign: 'right' }]}>IGST (₹)</Text>
              <Text style={[styles.matrixColHead, { flex: 1.2, textAlign: 'right' }]}>TOTAL (₹)</Text>
            </View>

            <View style={styles.matrixRow}>
              <Text style={[styles.matrixFlowLabel, { flex: 2, color: colors.text.primary }]}>
                Outward (Output)
              </Text>
              <Text style={[styles.matrixCell, { flex: 1 }]}>
                {outputCgst > 0 ? `₹${outputCgst.toLocaleString('en-IN')}` : '-'}
              </Text>
              <Text style={[styles.matrixCell, { flex: 1 }]}>
                {outputSgst > 0 ? `₹${outputSgst.toLocaleString('en-IN')}` : '-'}
              </Text>
              <Text style={[styles.matrixCell, { flex: 1 }]}>
                {outputIgst > 0 ? `₹${outputIgst.toLocaleString('en-IN')}` : '-'}
              </Text>
              <Text style={[styles.matrixCellBold, { flex: 1.2 }]}>
                ₹{totalOutputGst.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.matrixRow}>
              <Text style={[styles.matrixFlowLabel, { flex: 2, color: colors.semantic.success }]}>
                Inward (ITC)
              </Text>
              <Text style={[styles.matrixCell, { flex: 1 }]}>
                {inputCgst > 0 ? `₹${inputCgst.toLocaleString('en-IN')}` : '-'}
              </Text>
              <Text style={[styles.matrixCell, { flex: 1 }]}>
                {inputSgst > 0 ? `₹${inputSgst.toLocaleString('en-IN')}` : '-'}
              </Text>
              <Text style={[styles.matrixCell, { flex: 1 }]}>
                {inputIgst > 0 ? `₹${inputIgst.toLocaleString('en-IN')}` : '-'}
              </Text>
              <Text style={[styles.matrixCellBold, { flex: 1.2, color: colors.semantic.success }]}>
                ₹{totalInputItc.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={[styles.matrixRow, styles.matrixNetRow]}>
              <Text style={[styles.matrixNetHead, { flex: 2 }]}>Net Liability</Text>
              <Text style={[styles.matrixNetCell, { flex: 1 }]}>
                ₹{Math.max(0, outputCgst - inputCgst).toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.matrixNetCell, { flex: 1 }]}>
                ₹{Math.max(0, outputSgst - inputSgst).toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.matrixNetCell, { flex: 1 }]}>
                ₹{Math.max(0, outputIgst - inputIgst).toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.matrixNetTotal, { flex: 1.2 }]}>
                ₹{netGstLiability.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ledger' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ledger')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'ledger' && styles.tabBtnTextActive]}>
              Taxable Supply Register ({filteredTransactions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'returns' && styles.tabBtnActive]}
            onPress={() => setActiveTab('returns')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'returns' && styles.tabBtnTextActive]}>
              Filing Calendar ({gstReturns.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'ledger' ? (
          <View style={styles.sectionWrap}>
            <View style={styles.searchContainer}>
              <Input
                placeholder="Search doc #, counterparty, GSTIN..."
                value={search}
                onChangeText={setSearch}
                leftIcon={<Search size={18} color={colors.text.secondary} />}
              />
            </View>

            <View style={styles.filterScroll}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
                {SUPPLY_TYPES.map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.filterChip, selectedSupplyType === st && styles.filterChipActive]}
                    onPress={() => setSelectedSupplyType(st)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedSupplyType === st && styles.filterChipTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {filteredTransactions.length > 0 ? (
              <View style={styles.txnsList}>
                {filteredTransactions.map(item => (
                  <View key={item.id} style={{ marginBottom: spacing.md }}>
                    {renderGstTransactionCard({ item })}
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                title="No GST Transactions Found"
                message="No taxable supplies match your filters. GST records are automatically generated when client invoices or vendor bills are created."
                icon={<FileSpreadsheet size={42} color={colors.text.tertiary} />}
              />
            )}
          </View>
        ) : (
          <View style={styles.returnsContainer}>
            <Text style={styles.returnsTitle}>Statutory GST Filing Schedule & Status</Text>
            <View style={styles.returnsGrid}>
              {gstReturns.map(item => (
                <View key={item.returnType + item.period} style={{ marginBottom: spacing.md }}>
                  {renderReturnCard({ item })}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {selectedTransaction && (
        <Modal
          visible={!!selectedTransaction}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setSelectedTransaction(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.detailModalContent, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.detailDocNo}>{selectedTransaction.docNumber}</Text>
                  <Text style={styles.detailSupplyType}>{selectedTransaction.supplyType}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTransaction(null)}>
                  <X size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <View style={styles.detailCardBox}>
                  <Text style={styles.detailCardHead}>COUNTERPARTY INFORMATION</Text>
                  <Text style={styles.detailPartyName}>{selectedTransaction.counterPartyName}</Text>
                  <Text style={styles.detailGstin}>GSTIN: {selectedTransaction.counterPartyGstin}</Text>
                  <Text style={styles.detailDate}>Document Date: {selectedTransaction.invoiceDate}</Text>
                </View>

                <View style={styles.detailCalcBox}>
                  <Text style={styles.detailCardHead}>TAX ALLOCATION MATRIX</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Taxable Base Value</Text>
                    <Text style={styles.detailVal}>
                      ₹{selectedTransaction.taxableValue.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Central GST (CGST)</Text>
                    <Text style={styles.detailVal}>
                      {selectedTransaction.cgst > 0
                        ? `₹${selectedTransaction.cgst.toLocaleString('en-IN')}`
                        : 'N/A (Inter-State)'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>State GST (SGST)</Text>
                    <Text style={styles.detailVal}>
                      {selectedTransaction.sgst > 0
                        ? `₹${selectedTransaction.sgst.toLocaleString('en-IN')}`
                        : 'N/A (Inter-State)'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Integrated GST (IGST)</Text>
                    <Text style={styles.detailVal}>
                      {selectedTransaction.igst > 0
                        ? `₹${selectedTransaction.igst.toLocaleString('en-IN')}`
                        : 'N/A (Intra-State)'}
                    </Text>
                  </View>
                  <View style={[styles.detailRow, styles.totalRow]}>
                    <Text style={styles.detailTotalLabel}>Total GST Charged / Credited</Text>
                    <Text style={styles.detailTotalVal}>
                      ₹{selectedTransaction.totalGst.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItcBox}>
                  <Text style={styles.detailCardHead}>INPUT TAX CREDIT COMPLIANCE</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ITC Eligibility Status</Text>
                    <Text
                      style={[
                        styles.detailVal,
                        {
                          color:
                            selectedTransaction.itcEligibility === 'Eligible'
                              ? colors.semantic.success
                              : colors.text.tertiary,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {selectedTransaction.itcEligibility}
                    </Text>
                  </View>
                  <Text style={styles.itcNoticeText}>
                    {selectedTransaction.itcEligibility === 'Eligible'
                      ? 'Eligible for set-off against monthly outward GST liability under Section 16 of CGST Act.'
                      : 'Outward invoice supply — GST collected is accounted in Output Tax liability.'}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  title="Close"
                  variant="secondary"
                  onPress={() => setSelectedTransaction(null)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {selectedReturn && (
        <Modal
          visible={!!selectedReturn}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setSelectedReturn(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.detailModalContent, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.detailDocNo}>{selectedReturn.returnType}</Text>
                  <Text style={styles.detailSupplyType}>{selectedReturn.period}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedReturn(null)}>
                  <X size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailCardBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Filing Period</Text>
                  <Text style={styles.detailValBold}>{selectedReturn.period}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Statutory Due Date</Text>
                  <Text style={styles.detailVal}>{selectedReturn.dueDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <StatusBadge status={selectedReturn.status} size="sm" />
                </View>
                {selectedReturn.arnNumber && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Acknowledgement Reference (ARN)</Text>
                    <Text style={[styles.detailValBold, { color: colors.semantic.success }]}>
                      {selectedReturn.arnNumber}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Close"
                  variant="secondary"
                  onPress={() => setSelectedReturn(null)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Download Return Summary"
                  variant="primary"
                  onPress={() => {
                    Alert.alert(
                      'GST Return Export',
                      `Statutory ${selectedReturn.returnType} summary document for ${selectedReturn.period} downloaded to device.`
                    );
                    setSelectedReturn(null);
                  }}
                  style={{ flex: 1.5 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  gstr1Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
  },
  gstr1BtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  formulaBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    gap: 4,
  },
  formulaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  formulaTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  formulaMath: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
    lineHeight: 16,
  },
  kpiContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  kpiLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  kpiVal: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: 2,
  },
  kpiSub: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.secondary,
    marginTop: 2,
  },
  matrixCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
  },
  matrixTitle: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  matrixTable: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 6,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: 4,
  },
  matrixColHead: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  matrixFlowLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  matrixCell: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  matrixCellBold: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  matrixNetRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 6,
    marginTop: 2,
  },
  matrixNetHead: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  matrixNetCell: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  matrixNetTotal: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabBtnActive: {
    backgroundColor: colors.background.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  sectionWrap: {
    paddingTop: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  filterList: {
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  txnsList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  docNumber: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  supplyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  outwardBadge: {
    backgroundColor: `${colors.primary}15`,
  },
  inwardBadge: {
    backgroundColor: `${colors.semantic.warning}15`,
  },
  supplyBadgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
  },
  outwardText: {
    color: colors.primary,
  },
  inwardText: {
    color: colors.semantic.warning,
  },
  dateText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  partyBox: {
    marginTop: 2,
  },
  partyName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  gstinText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },
  taxGrid: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: 4,
  },
  taxCol: {
    flex: 1,
  },
  taxLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  taxVal: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  supplySub: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
  },
  itcBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itcEligible: {
    backgroundColor: `${colors.semantic.success}15`,
  },
  itcIneligible: {
    backgroundColor: colors.background.tertiary,
  },
  itcBadgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
  },
  itcEligibleText: {
    color: colors.semantic.success,
  },
  itcIneligibleText: {
    color: colors.text.tertiary,
  },
  returnsContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  returnsTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  returnsGrid: {
    gap: spacing.sm,
  },
  returnCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  returnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  returnTypeBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  returnTypeText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
  },
  returnPeriod: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 4,
  },
  returnDueDate: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  arnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  arnLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  arnVal: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.semantic.success,
    fontFamily: 'monospace',
  },
  pendingFilingText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.semantic.warning,
    fontStyle: 'italic',
    marginTop: 4,
  },
  returnCardFooter: {
    marginTop: spacing.xs,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    alignItems: 'flex-end',
  },
  viewReturnLink: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '92%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  detailDocNo: {
    ...typography.h3,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  detailSupplyType: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  detailCardBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailCardHead: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailPartyName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  detailGstin: {
    ...typography.caption,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  detailDate: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  detailCalcBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  detailVal: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  detailValBold: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 6,
    marginTop: 4,
  },
  detailTotalLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  detailTotalVal: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.primary,
  },
  detailItcBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  itcNoticeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
    lineHeight: 14,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
