import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  Layers,
  Calendar,
  Clock,
  Lock,
  Unlock,
  ShieldCheck,
  FileText,
  MessageSquare,
  HelpCircle,
  Plus,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Building2,
  ChevronRight,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button, EmptyState } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import {
  tenderPhase,
  closingOf,
  daysFrom,
  formatDateTime,
  formatDateOnly,
} from '../../constants/vendor';

interface TenderDetailScreenProps {
  route: { params: { tenderId: string } };
  navigation: any;
}

export const TenderDetailScreen: React.FC<TenderDetailScreenProps> = ({ route, navigation }) => {
  const { tenderId } = route.params;
  const {
    tenders,
    clarifications,
    askClarification,
    answerClarification,
    submitBidWithDetails,
    withdrawBid,
    vendors,
    savedTenders,
    toggleSavedTender,
  } = useCrm();
  const { role, session } = useAuth();

  const isDirector = (role as any) === 'director' || (role as any) === 'admin';
  const isTenderManager = (role as any) === 'tender_manager' || (role as any) === 'director' || (role as any) === 'admin';
  const isVendorUser = session?.accountType === 'vendor' || (role as any) === 'vendor';

  const tender = tenders.find((t) => t.id === tenderId);

  // Active Tab: 'spec' | 'bids' | 'clarifications' | 'documents'
  const [activeTab, setActiveTab] = useState<'spec' | 'bids' | 'clarifications' | 'documents'>('spec');

  // Submit Bid Modal State
  const [showBidModal, setShowBidModal] = useState<boolean>(false);
  const [selectedBidVendorId, setSelectedBidVendorId] = useState<string>(
    (session as any)?.vendorId || (vendors[0]?.id ?? 'VN-01')
  );
  const [bidAmount, setBidAmount] = useState<string>('');
  const [timelineWeeks, setTimelineWeeks] = useState<string>('4');
  const [techSpecs, setTechSpecs] = useState<string>('');
  const [bidDeclaration, setBidDeclaration] = useState<boolean>(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState<boolean>(false);

  // Clarification Modals
  const [showAskModal, setShowAskModal] = useState<boolean>(false);
  const [askQuestionText, setAskQuestionText] = useState<string>('');
  const [showAnswerModal, setShowAnswerModal] = useState<boolean>(false);
  const [selectedClarificationId, setSelectedClarificationId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<string>('');

  const tenderClarifications = useMemo(() => {
    return clarifications.filter((c) => c.tenderId === tenderId);
  }, [clarifications, tenderId]);

  if (!tender) {
    return (
      <ScreenContainer
        scrollable={false}
        header={<AppHeader title="Tender Details" showBack onBack={() => navigation.goBack()} />}
      >
        <View style={styles.centerContainer}>
          <Text style={styles.notFoundText}>Tender notice not found.</Text>
          <Button title="Back to Tenders" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </ScreenContainer>
    );
  }

  const phase = tenderPhase(tender);
  const closingTime = closingOf(tender);
  const daysDiff = Math.round((new Date(closingTime).getTime() - Date.now()) / 86400000);
  const daysLabel = daysFrom(closingTime);
  const liveBids = tender.sealedBids.filter((b) => b.status !== 'Withdrawn');
  const sealedCount = liveBids.filter((b) => b.isSealed).length;
  const isSaved = savedTenders.includes(tender.id);

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  const handleBidSubmit = async () => {
    const amt = Number(bidAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Quotation', 'Please enter a valid commercial bid quotation amount.');
      return;
    }
    if (!bidDeclaration) {
      Alert.alert('Declaration Required', 'Please confirm the commercial quotation and adherence to tender terms.');
      return;
    }

    const bidderVendor = vendors.find((v) => v.id === selectedBidVendorId) || vendors[0];

    setIsSubmittingBid(true);
    try {
      await submitBidWithDetails(tender.id, {
        vendorId: bidderVendor.id,
        vendorName: bidderVendor.name,
        bidAmount: amt,
        technicalSpecs: techSpecs,
        timelineWeeks: Number(timelineWeeks) || 4,
        contactPerson: bidderVendor.contact,
        contactPhone: bidderVendor.phone,
      });

      setShowBidModal(false);
      setBidAmount('');
      setTechSpecs('');
      Alert.alert('Sealed Bid Lodged', 'Your quotation has been encrypted and placed into the dual-key sealed chamber.');
    } catch (e: any) {
      Alert.alert('Bid Submission Error', e.message || 'Unable to submit sealed bid.');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleAskSubmit = async () => {
    if (!askQuestionText.trim()) return;
    const vendorObj = vendors.find((v) => v.id === selectedBidVendorId) || vendors[0];
    try {
      await askClarification(tender.id, askQuestionText.trim(), vendorObj.id, vendorObj.name);
      setShowAskModal(false);
      setAskQuestionText('');
      Alert.alert('Clarification Asked', 'Your question has been forwarded to the Tender Committee.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!selectedClarificationId || !answerText.trim()) return;
    try {
      await answerClarification(selectedClarificationId, answerText.trim(), (session as any)?.name || 'Tender Manager');
      setShowAnswerModal(false);
      setAnswerText('');
      setSelectedClarificationId(null);
      Alert.alert('Clarification Answered', 'Official clarification response broadcasted.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title={tender.id}
          subtitle={tender.refNo || 'Subcontract Procurement'}
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      {/* Header Info Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.tenderIdBadge}>{tender.id}</Text>
          <StatusBadge
            status={phase === 'Evaluation' ? 'Under Evaluation' : phase}
            size="small"
          />
        </View>

        <Text style={styles.tenderMainTitle}>{tender.title}</Text>
        <Text style={styles.categorySub}>{tender.category || 'General Exploration Subcontract'}</Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>ESTIMATED CEILING</Text>
            <Text style={styles.kpiVal}>{formatCurrency(tender.estimatedValue || tender.estimate || 0)}</Text>
          </View>
          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>EMD DEPOSIT</Text>
            <Text style={styles.kpiVal}>₹{(tender.emdAmount || tender.emd || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>CLOSING TIMELINE</Text>
            <Text style={[styles.kpiVal, { color: daysDiff <= 2 ? colors.warning : colors.textPrimary }]}>
              {daysDiff >= 0 ? daysLabel : 'Bidding Closed'}
            </Text>
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.headerActionRow}>
          {phase === 'Open' && (
            <Button
              title="Submit Bid Quotation"
              variant="primary"
              size="small"
              style={{ flex: 1 }}
              onPress={() => setShowBidModal(true)}
            />
          )}

          {phase === 'Evaluation' && isTenderManager && (
            <Button
              title="Open Dual-Key Chamber"
              variant="primary"
              size="small"
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('SealedBidding', { tenderId: tender.id })}
            />
          )}

          <TouchableOpacity
            style={[styles.bookmarkBtn, isSaved && styles.bookmarkBtnActive]}
            onPress={() => toggleSavedTender(tender.id)}
          >
            <Text style={[styles.bookmarkBtnText, isSaved && styles.bookmarkBtnTextActive]}>
              {isSaved ? 'Bookmarked' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'spec' && styles.tabBtnActive]}
          onPress={() => setActiveTab('spec')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'spec' && styles.tabBtnTextActive]}>
            Specifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bids' && styles.tabBtnActive]}
          onPress={() => setActiveTab('bids')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'bids' && styles.tabBtnTextActive]}>
            Sealed Bids ({liveBids.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'clarifications' && styles.tabBtnActive]}
          onPress={() => setActiveTab('clarifications')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'clarifications' && styles.tabBtnTextActive]}>
            Clarifications ({tenderClarifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'documents' && styles.tabBtnActive]}
          onPress={() => setActiveTab('documents')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'documents' && styles.tabBtnTextActive]}>
            Notice Docs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content: Specifications */}
      {activeTab === 'spec' && (
        <View style={styles.tabSection}>
          <Card style={styles.contentCard}>
            <Text style={styles.cardHeading}>Key Procurement Dates & Protocol</Text>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Published On</Text>
              <Text style={styles.specVal}>{formatDateTime(tender.publishedAt || '')}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Bidding Closes At</Text>
              <Text style={styles.specVal}>{formatDateTime(tender.closesAt || tender.submissionDeadline || '')}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Dual-Key Opening Date</Text>
              <Text style={styles.specVal}>{formatDateTime(tender.openingDate || tender.opensAt || '')}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Issuing Authority</Text>
              <Text style={styles.specVal}>{tender.authority?.name || 'Director, BGSPL'}</Text>
            </View>
          </Card>

          <Card style={styles.contentCard}>
            <Text style={styles.cardHeading}>Technical Scope & Work Description</Text>
            <Text style={styles.descText}>
              {tender.description ||
                'Exploration core drilling and associated field sampling in designated geological concessions. Mobilization turnaround within 14 days of Work Order issuance.'}
            </Text>

            <Text style={[styles.cardHeading, { marginTop: spacing.md }]}>Prequalification Criteria</Text>
            <Text style={styles.descText}>
              {tender.prequal ||
                'Empanelled vendors must possess certified rigs capable of HQ/NQ wireline coring to 300m depth, with valid DGMS compliance certifications.'}
            </Text>
          </Card>
        </View>
      )}

      {/* Tab Content: Sealed Bids (Security Chamber) */}
      {activeTab === 'bids' && (
        <View style={styles.tabSection}>
          {sealedCount > 0 && phase !== 'Allotted' && (
            <Card style={styles.chamberWarningCard}>
              <View style={styles.chamberWarningHeader}>
                <Lock size={20} color={colors.accent} />
                <Text style={styles.chamberWarningTitle}>Dual-Key Cryptographic Vault</Text>
              </View>
              <Text style={styles.chamberWarningDesc}>
                In accordance with sealed bidding protocols, vendor quotation amounts remain masked and strictly inaccessible to all staff until the official closing date and dual-key ceremony.
              </Text>
              {isTenderManager && (
                <Button
                  title="Go to Dual-Key Unsealing Ceremony"
                  variant="primary"
                  size="small"
                  style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
                  onPress={() => navigation.navigate('SealedBidding', { tenderId: tender.id })}
                />
              )}
            </Card>
          )}

          {liveBids.length === 0 ? (
            <Card style={styles.contentCard}>
              <Text style={styles.mutedText}>No vendor bids lodged on this tender yet.</Text>
            </Card>
          ) : (
            liveBids.map((b) => (
              <Card key={b.id} style={styles.bidCard}>
                <View style={styles.bidTop}>
                  <View>
                    <Text style={styles.bidIdText}>{b.id}</Text>
                    <Text style={styles.bidVendorName}>{b.vendorName}</Text>
                  </View>
                  <StatusBadge status={b.status || 'Submitted'} size="small" />
                </View>

                <View style={styles.bidAmountRow}>
                  <Text style={styles.bidAmountLabel}>COMMERCIAL QUOTATION:</Text>
                  {b.isSealed ? (
                    <View style={styles.sealedMaskBadge}>
                      <Lock size={12} color={colors.accent} />
                      <Text style={styles.sealedMaskText}>SEALED ENCRYPTED QUOTATION</Text>
                    </View>
                  ) : (
                    <Text style={styles.unsealedAmountText}>{formatCurrency(b.bidAmount)}</Text>
                  )}
                </View>

                <View style={styles.bidFooter}>
                  <Text style={styles.bidTimeText}>
                    Submitted: {b.submissionDate || b.submittedAt?.slice(0, 10)}
                  </Text>
                  {phase === 'Open' && (isVendorUser || isDirector) && (
                    <TouchableOpacity onPress={() => withdrawBid(tender.id, b.vendorId)}>
                      <Text style={styles.withdrawLink}>Withdraw Bid</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {/* Tab Content: Clarifications (Q&A Thread) */}
      {activeTab === 'clarifications' && (
        <View style={styles.tabSection}>
          <View style={styles.clarificationHeaderRow}>
            <Text style={styles.clarificationSubtitle}>
              Pre-Bid Technical Inquiries & Official Responses
            </Text>
            {phase === 'Open' && (
              <Button
                title="Ask Question"
                variant="outline"
                size="small"
                onPress={() => setShowAskModal(true)}
              />
            )}
          </View>

          {tenderClarifications.length === 0 ? (
            <Card style={styles.contentCard}>
              <Text style={styles.mutedText}>
                No clarification inquiries posted yet. Any bidder may ask technical questions prior to bidding closure.
              </Text>
            </Card>
          ) : (
            tenderClarifications.map((c) => (
              <Card key={c.id} style={styles.clarificationCard}>
                <View style={styles.qHeader}>
                  <Text style={styles.qBadge}>Q: {c.id}</Text>
                  <Text style={styles.qDate}>{c.askedAt?.slice(0, 10)}</Text>
                </View>
                <Text style={styles.questionBody}>{c.question}</Text>

                {c.answer ? (
                  <View style={styles.answerBox}>
                    <View style={styles.answerHeader}>
                      <CheckCircle2 size={14} color={colors.success} />
                      <Text style={styles.answerAuthor}>Official Reply ({c.answeredBy || 'Tender Manager'})</Text>
                    </View>
                    <Text style={styles.answerBody}>{c.answer}</Text>
                  </View>
                ) : (
                  <View style={styles.unansweredRow}>
                    <Text style={styles.unansweredText}>Awaiting official clarification reply.</Text>
                    {isTenderManager && (
                      <Button
                        title="Provide Answer"
                        variant="primary"
                        size="small"
                        onPress={() => {
                          setSelectedClarificationId(c.id);
                          setShowAnswerModal(true);
                        }}
                      />
                    )}
                  </View>
                )}
              </Card>
            ))
          )}
        </View>
      )}

      {/* Tab Content: Notice Documents */}
      {activeTab === 'documents' && (
        <View style={styles.tabSection}>
          <Card style={styles.contentCard}>
            <Text style={styles.cardHeading}>Official Tender Document Packets</Text>
            <View style={styles.docItemRow}>
              <FileText size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.xs }}>
                <Text style={styles.docItemTitle}>Tender_Notice_NIT_Detailed.pdf</Text>
                <Text style={styles.docItemSub}>Notice Inviting Tender & Schedule of Quantities</Text>
              </View>
              <Text style={styles.docItemAction}>Download</Text>
            </View>

            <View style={styles.docItemRow}>
              <FileText size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.xs }}>
                <Text style={styles.docItemTitle}>Technical_Specifications_Logistics.pdf</Text>
                <Text style={styles.docItemSub}>Field borehole layout, sampling protocol & QA/QC</Text>
              </View>
              <Text style={styles.docItemAction}>Download</Text>
            </View>
          </Card>
        </View>
      )}

      {/* Submit Bid Modal */}
      {showBidModal && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Submit Commercial & Technical Bid</Text>
                <TouchableOpacity onPress={() => setShowBidModal(false)} style={styles.closeBtn}>
                  <X size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.sheetContent}>
                <Text style={styles.fieldLabel}>BIDDING FIRM *</Text>
                <View style={styles.vendorSelectorWrap}>
                  {vendors.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.vendorSelectChip, selectedBidVendorId === v.id && styles.vendorSelectChipActive]}
                      onPress={() => setSelectedBidVendorId(v.id)}
                    >
                      <Text style={[styles.vendorSelectText, selectedBidVendorId === v.id && styles.vendorSelectTextActive]}>
                        {v.name} ({v.id})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>TOTAL QUOTATION AMOUNT (EXCLUDING GST) (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 2150000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={bidAmount}
                  onChangeText={setBidAmount}
                />

                <Text style={styles.fieldLabel}>ESTIMATED COMPLETION TIMELINE (WEEKS)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 4"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={timelineWeeks}
                  onChangeText={setTimelineWeeks}
                />

                <Text style={styles.fieldLabel}>TECHNICAL DEPLOYMENT SPECIFICATIONS</Text>
                <TextInput
                  style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
                  placeholder="Rigs to be deployed, core barrel specs, camp logistics..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={techSpecs}
                  onChangeText={setTechSpecs}
                />

                <TouchableOpacity
                  style={styles.declarationCheck}
                  onPress={() => setBidDeclaration(!bidDeclaration)}
                >
                  <View style={[styles.checkbox, bidDeclaration && styles.checkboxActive]}>
                    {bidDeclaration && <CheckCircle2 size={12} color={colors.surface} />}
                  </View>
                  <Text style={styles.declarationText}>
                    I confirm this bid is firm and legally binding. The bid shall be locked into the sealed chamber until the official unsealing date.
                  </Text>
                </TouchableOpacity>

                <View style={styles.sheetActions}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    style={{ flex: 1 }}
                    onPress={() => setShowBidModal(false)}
                  />
                  <Button
                    title={isSubmittingBid ? 'Encrypting & Lodging...' : 'Lodge Sealed Bid'}
                    variant="primary"
                    style={{ flex: 1 }}
                    disabled={isSubmittingBid}
                    onPress={handleBidSubmit}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Ask Clarification Modal */}
      {showAskModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdropCenter}>
            <Card style={styles.centerModalCard}>
              <Text style={styles.sheetTitle}>Ask Clarification Question</Text>
              <Text style={styles.fieldLabel}>YOUR TECHNICAL / LOGISTICAL QUESTION *</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 80, textAlignVertical: 'top', marginTop: 4 }]}
                placeholder="Type your technical question for the procurement committee..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={askQuestionText}
                onChangeText={setAskQuestionText}
              />

              <View style={styles.sheetActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => setShowAskModal(false)}
                />
                <Button
                  title="Submit Question"
                  variant="primary"
                  style={{ flex: 1 }}
                  onPress={handleAskSubmit}
                />
              </View>
            </Card>
          </View>
        </Modal>
      )}

      {/* Answer Clarification Modal */}
      {showAnswerModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdropCenter}>
            <Card style={styles.centerModalCard}>
              <Text style={styles.sheetTitle}>Publish Official Clarification Reply</Text>
              <Text style={styles.fieldLabel}>OFFICIAL RESPONSE (BROADCAST TO ALL BIDDERS) *</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 80, textAlignVertical: 'top', marginTop: 4 }]}
                placeholder="Type official clarification response..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={answerText}
                onChangeText={setAnswerText}
              />

              <View style={styles.sheetActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => setShowAnswerModal(false)}
                />
                <Button
                  title="Publish Reply"
                  variant="primary"
                  style={{ flex: 1 }}
                  onPress={handleAnswerSubmit}
                />
              </View>
            </Card>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  headerCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tenderIdBadge: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  tenderMainTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  categorySub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceMuted,
    marginBottom: spacing.sm,
  },
  kpiCol: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  kpiVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  headerActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  bookmarkBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  bookmarkBtnActive: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
  },
  bookmarkBtnText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  bookmarkBtnTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.bold,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
  },
  tabSection: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  contentCard: {
    padding: spacing.md,
  },
  cardHeading: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  specLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  specVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  descText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  chamberWarningCard: {
    backgroundColor: colors.accentBg,
    borderColor: colors.accent,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  chamberWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chamberWarningTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.accent,
  },
  chamberWarningDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  bidCard: {
    padding: spacing.md,
  },
  bidTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bidIdText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  bidVendorName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  bidAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceMuted,
    marginVertical: 4,
  },
  bidAmountLabel: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
  },
  sealedMaskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    gap: 4,
  },
  sealedMaskText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: colors.accent,
  },
  unsealedAmountText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primary,
  },
  bidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  bidTimeText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  withdrawLink: {
    fontSize: typography.fontSizes.xs,
    color: colors.danger,
    fontWeight: typography.fontWeights.semibold,
  },
  clarificationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clarificationSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    flex: 1,
  },
  clarificationCard: {
    padding: spacing.md,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  qBadge: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  qDate: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  questionBody: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  answerBox: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: 4,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  answerAuthor: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.successText,
  },
  answerBody: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  unansweredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  unansweredText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.warningText,
    fontStyle: 'italic',
  },
  docItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  docItemTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  docItemSub: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  docItemAction: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  mutedText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  sheetTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  sheetContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
  },
  vendorSelectorWrap: {
    gap: spacing.xs,
  },
  vendorSelectChip: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surfaceMuted,
  },
  vendorSelectChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  vendorSelectText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  vendorSelectTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.bold,
  },
  declarationCheck: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  declarationText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  centerModalCard: {
    width: '100%',
    padding: spacing.lg,
  },
});
