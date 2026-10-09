import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useCrm, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, ConfirmationModal } from '../../components';
import { ShieldCheck, Key, Lock, Unlock, Award, CheckCircle2, AlertCircle, FileCheck, ArrowRight } from 'lucide-react-native';

export const SealedBiddingScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { tenders, unsealTenderBids, allotTender } = useCrm();
  const tenderId = route?.params?.tenderId || tenders[0]?.id;

  const tender = tenders.find(t => t.id === tenderId);

  const [dirKeyConfirmed, setDirKeyConfirmed] = useState(false);
  const [tmKeyConfirmed, setTmKeyConfirmed] = useState(false);
  const [isUnsealing, setIsUnsealing] = useState(false);
  const [isAllotting, setIsAllotting] = useState(false);
  const [showAllotModal, setShowAllotModal] = useState(false);

  const { role } = useAuth();
  const canAllot = (role as any) === 'director' || (role as any) === 'admin';
  const canUnseal = (role as any) === 'director' || (role as any) === 'tender_manager' || (role as any) === 'admin';

  if (!tender) {
    return (
      <View style={styles.container}>
        <AppHeader title="Dual-Key Unsealing" showBack onBack={() => navigation.goBack()} />
        <Text style={styles.notFoundText}>Tender record not found.</Text>
      </View>
    );
  }

  const tenderEst = tender.estimatedValue || tender.estimate || 0;
  const isAlreadyUnsealed = tender.status === 'Under Evaluation' || tender.status === 'Awarded';
  const bothKeysEngaged = dirKeyConfirmed && tmKeyConfirmed;

  const liveBids = tender.sealedBids.filter((b) => b.status !== 'Withdrawn');
  const rankedBids = [...liveBids].sort((a, b) => a.bidAmount - b.bidAmount);
  const l1Bid = rankedBids[0];

  const handleExecuteUnseal = async () => {
    if (!bothKeysEngaged) {
      Alert.alert('Dual-Key Authentication Required', 'Both Director & Tender Manager must authorize the unsealing ceremony.');
      return;
    }

    try {
      setIsUnsealing(true);
      await unsealTenderBids(tender.id, dirKeyConfirmed, tmKeyConfirmed);
      Alert.alert('Protocol Complete', 'All sealed bids have been successfully decrypted and ranked in the Comparative L1 Matrix.');
    } catch (err: any) {
      Alert.alert('Unsealing Failed', err.message || 'Error occurred while decrypting bids.');
    } finally {
      setIsUnsealing(false);
    }
  };

  const handleConfirmAllotment = async () => {
    if (!l1Bid) return;

    if (!canAllot) {
      Alert.alert('Director Privilege Required', 'Only Managing Director can allot tenders and issue formal subcontract work orders.');
      return;
    }

    try {
      setIsAllotting(true);
      setShowAllotModal(false);
      const newWo = await allotTender(tender.id, l1Bid.vendorId, l1Bid.vendorName, l1Bid.bidAmount, tender.forProject || tender.title);
      Alert.alert(
        'Tender Awarded',
        `Contract successfully allotted to L1 Vendor ${l1Bid.vendorName}. Work Order ${newWo.woNumber} generated.`,
        [
          {
            text: 'View Work Order',
            onPress: () => navigation.navigate('WorkOrderDetail', { woId: newWo.id }),
          },
          { text: 'OK', onPress: () => navigation.goBack() },
        ]
      );
    } catch (err: any) {
      Alert.alert('Allotment Error', err.message || 'Failed to allot tender.');
    } finally {
      setIsAllotting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Dual-Key Sealed Bidding"
        subtitle={`Protocol for ${tender.id}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.tagWrap}>
              <Text style={styles.tenderCode}>{tender.id}</Text>
              <StatusBadge status={tender.status} size="small" />
            </View>
            <Text style={styles.bidCount}>{liveBids.length} Live Bids</Text>
          </View>
          <Text style={styles.tenderTitle}>{tender.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Authority: <Text style={styles.metaValue}>{tender.issuingAuthority || tender.authority?.name || 'Director, BGSPL'}</Text></Text>
            <Text style={styles.metaLabel}>Est. Value: <Text style={styles.metaValue}>₹{(tenderEst / 100000).toFixed(2)} L</Text></Text>
          </View>
        </Card>

        {!isAlreadyUnsealed && (
          <Card style={styles.ceremonyChamber}>
            <View style={styles.ceremonyHeader}>
              <ShieldCheck size={28} color={colors.primary} />
              <View style={styles.chamberTextWrap}>
                <Text style={styles.chamberTitle}>Dual-Key Authorization Protocol</Text>
                <Text style={styles.chamberDesc}>
                  Under Government & Corporate Procurement guidelines, tender unsealing requires simultaneous electronic sign-off by two designated custodians.
                </Text>
              </View>
            </View>

            <View style={styles.keyCards}>
              <TouchableOpacity
                style={[styles.keySlot, dirKeyConfirmed && styles.keySlotActive]}
                onPress={() => setDirKeyConfirmed(!dirKeyConfirmed)}
              >
                <View style={styles.keyIconWrap}>
                  <Key size={20} color={dirKeyConfirmed ? colors.primary : colors.text.tertiary} />
                </View>
                <View style={styles.keyDetails}>
                  <Text style={styles.keyRole}>Key 1: Managing Director</Text>
                  <Text style={styles.keyStatus}>
                    {dirKeyConfirmed ? 'Authenticated & Armed' : 'Awaiting Authorization'}
                  </Text>
                </View>
                {dirKeyConfirmed ? (
                  <CheckCircle2 size={20} color={colors.primary} />
                ) : (
                  <Lock size={18} color={colors.text.tertiary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.keySlot, tmKeyConfirmed && styles.keySlotActive]}
                onPress={() => setTmKeyConfirmed(!tmKeyConfirmed)}
              >
                <View style={styles.keyIconWrap}>
                  <Key size={20} color={tmKeyConfirmed ? colors.primary : colors.text.tertiary} />
                </View>
                <View style={styles.keyDetails}>
                  <Text style={styles.keyRole}>Key 2: Tender Officer / Head</Text>
                  <Text style={styles.keyStatus}>
                    {tmKeyConfirmed ? 'Authenticated & Armed' : 'Awaiting Authorization'}
                  </Text>
                </View>
                {tmKeyConfirmed ? (
                  <CheckCircle2 size={20} color={colors.primary} />
                ) : (
                  <Lock size={18} color={colors.text.tertiary} />
                )}
              </TouchableOpacity>
            </View>

            <Button
              title={bothKeysEngaged ? "Execute Dual-Key Unseal Protocol" : "Dual Keys Required to Unseal"}
              variant={bothKeysEngaged ? "primary" : "secondary"}
              disabled={!bothKeysEngaged}
              loading={isUnsealing}
              onPress={handleExecuteUnseal}
              style={styles.unsealActionBtn}
            />
          </Card>
        )}

        {isAlreadyUnsealed && (
          <Card style={styles.matrixCard}>
            <View style={styles.matrixHeader}>
              <View>
                <Text style={styles.matrixTitle}>Comparative L1 Evaluation Matrix</Text>
                <Text style={styles.matrixSubtitle}>Bids decrypted & ranked in ascending order of price</Text>
              </View>
              <FileCheck size={24} color={colors.primary} />
            </View>

            <View style={styles.matrixTable}>
              {rankedBids.map((bid, index) => {
                const rankNum = index + 1;
                const isL1 = rankNum === 1;
                const diffPct = (((bid.bidAmount - tender.estimatedValue) / tender.estimatedValue) * 100).toFixed(1);

                return (
                  <View key={bid.id} style={[styles.matrixRow, isL1 && styles.matrixRowL1]}>
                    <View style={styles.rankCol}>
                      <View style={[styles.rankCircle, isL1 && styles.rankCircleL1]}>
                        <Text style={[styles.rankCircleText, isL1 && styles.rankCircleTextL1]}>
                          L{rankNum}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.vendorCol}>
                      <Text style={[styles.matrixVendorName, isL1 && styles.matrixVendorNameL1]}>
                        {bid.vendorName}
                      </Text>
                      <Text style={styles.matrixVendorMeta}>
                        Variance vs Est: {diffPct.startsWith('-') ? `${diffPct}%` : `+${diffPct}%`}
                      </Text>
                    </View>

                    <View style={styles.amountCol}>
                      <Text style={[styles.matrixAmount, isL1 && styles.matrixAmountL1]}>
                        ₹{bid.bidAmount.toLocaleString('en-IN')}
                      </Text>
                      {isL1 && (
                        <View style={styles.winnerTag}>
                          <Text style={styles.winnerText}>Lowest Bidder</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {tender.status === 'Under Evaluation' && l1Bid && (
              <View style={styles.allotSection}>
                <View style={styles.allotInfo}>
                  <Award size={20} color={colors.primary} />
                  <Text style={styles.allotInfoText}>
                    L1 Bidder identified: <Text style={{ fontWeight: '700' }}>{l1Bid.vendorName}</Text> at ₹{l1Bid.bidAmount.toLocaleString('en-IN')}.
                  </Text>
                </View>
                <Button
                  title="Award Tender & Issue Work Order to L1"
                  variant="primary"
                  loading={isAllotting}
                  onPress={() => setShowAllotModal(true)}
                />
              </View>
            )}

            {tender.status === 'Awarded' && (
              <View style={styles.alreadyAwardedBanner}>
                <CheckCircle2 size={20} color={colors.semantic.success} />
                <Text style={styles.alreadyAwardedText}>
                  Work Order has been executed with the L1 contractor.
                </Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      <ConfirmationModal
        visible={showAllotModal}
        title="Confirm Tender Award (L1)"
        message={`Are you sure you want to award ${tender.tenderNo} to ${l1Bid?.vendorName} for ₹${l1Bid?.bidAmount.toLocaleString('en-IN')}? This will automatically issue a formal Work Order.`}
        confirmText="Confirm & Issue Work Order"
        cancelText="Cancel"
        onConfirm={handleConfirmAllotment}
        onCancel={() => setShowAllotModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  notFoundText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tenderCode: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  bidCount: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  tenderTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.xs,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  metaValue: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  ceremonyChamber: {
    padding: spacing.md,
    backgroundColor: `${colors.primary}08`,
    borderColor: colors.primary,
  },
  ceremonyHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chamberTextWrap: {
    flex: 1,
  },
  chamberTitle: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: 2,
  },
  chamberDesc: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  keyCards: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  keySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  keySlotActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  keyIconWrap: {
    marginRight: spacing.md,
  },
  keyDetails: {
    flex: 1,
  },
  keyRole: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  keyStatus: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  unsealActionBtn: {
    marginTop: spacing.xs,
  },
  matrixCard: {
    padding: spacing.md,
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: spacing.sm,
  },
  matrixTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  matrixSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  matrixTable: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  matrixRowL1: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  rankCol: {
    marginRight: spacing.md,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankCircleL1: {
    backgroundColor: colors.primary,
  },
  rankCircleText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.secondary,
  },
  rankCircleTextL1: {
    color: '#FFFFFF',
  },
  vendorCol: {
    flex: 1,
  },
  matrixVendorName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  matrixVendorNameL1: {
    color: colors.primary,
    fontWeight: '800',
  },
  matrixVendorMeta: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  matrixAmount: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  matrixAmountL1: {
    color: colors.primary,
    fontWeight: '900',
  },
  winnerTag: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: `${colors.primary}20`,
  },
  winnerText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  allotSection: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.md,
  },
  allotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.primary}10`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  allotInfoText: {
    ...typography.bodySmall,
    color: colors.primary,
    flex: 1,
  },
  alreadyAwardedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.semantic.success}10`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  alreadyAwardedText: {
    ...typography.bodySmall,
    color: colors.semantic.success,
    fontWeight: '600',
  },
});
