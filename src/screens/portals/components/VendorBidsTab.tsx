import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  ShieldCheck,
  Undo2,
  MessageCircleQuestion,
  Clock,
} from 'lucide-react-native';
import { Card, StatusBadge, Button, EmptyState } from '../../../components';
import { colors, spacing } from '../../../theme';
import { Tender, SealedBid, TenderClarification } from '../../../types';
import { tenderPhase, formatDateTime } from '../../../constants/vendor';
import { styles } from './vendorPortalStyles';
import { PortalTab } from './VendorPortalHeader';

interface VendorBidsTabProps {
  myBids: { tender: Tender; bid: SealedBid }[];
  vendorCode: string;
  setActiveTab: (tab: PortalTab) => void;
  handleWithdrawBid: (tender: Tender) => void;
  clarifications: TenderClarification[];
  navigation: any;
}

export const VendorBidsTab: React.FC<VendorBidsTabProps> = ({
  myBids,
  vendorCode,
  setActiveTab,
  handleWithdrawBid,
  clarifications,
  navigation,
}) => {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Bid Escrow Vault</Text>
        <Text style={styles.sectionSub}>
          Bids remain cryptographically sealed until official committee opening
        </Text>
      </View>

      {myBids.length === 0 ? (
        <EmptyState
          title="No Submitted Bids"
          message="You have not lodged commercial bids for any active tenders yet."
          icon={<ShieldCheck size={40} color={colors.text.tertiary} />}
          actionLabel="Explore Open Tenders"
          onAction={() => setActiveTab('tenders')}
        />
      ) : (
        myBids.map(({ tender, bid }) => {
          const isOpen = tenderPhase(tender) === 'Open';
          const isShortlisted = bid.status === 'Shortlisted';
          const isAwarded = tender.awardedToVendorId === vendorCode;

          return (
            <Card key={tender.id} style={styles.bidCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.woCode}>{tender.tenderNo || tender.id}</Text>
                <StatusBadge
                  status={
                    isAwarded
                      ? 'Allotted'
                      : isShortlisted
                      ? 'Shortlisted'
                      : bid.status || 'Submitted'
                  }
                  size="small"
                />
              </View>

              <Text style={styles.woTitle}>{tender.title}</Text>
              <Text style={styles.tenderOrg}>{tender.issuingAuthority}</Text>

              <View style={styles.bidFinancialsBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bidBoxLabel}>YOUR LODGED QUOTATION</Text>
                  <Text style={styles.bidBoxVal}>
                    ₹{bid.bidAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bidBoxLabel}>ESCROW STATUS</Text>
                  <Text
                    style={[
                      styles.bidBoxVal,
                      {
                        color: bid.isSealed
                          ? colors.primary
                          : colors.semantic.success,
                      },
                    ]}
                  >
                    {bid.isSealed
                      ? '🔒 Sealed in Chamber'
                      : '🔓 Unsealed / Evaluated'}
                  </Text>
                </View>
              </View>

              {bid.remarks ? (
                <Text style={styles.bidRemarksText}>Note: {bid.remarks}</Text>
              ) : null}

              <View style={styles.bidActionsRow}>
                <Button
                  title="Tender Details"
                  variant="outline"
                  size="small"
                  onPress={() =>
                    navigation.navigate('TenderDetail', {
                      tenderId: tender.id,
                    })
                  }
                  style={{ flex: 1 }}
                />

                {isOpen &&
                  (bid.status === 'Submitted' || (bid as any).isSealed) && (
                    <TouchableOpacity
                      style={styles.withdrawBtn}
                      onPress={() => handleWithdrawBid(tender)}
                    >
                      <Undo2 size={14} color={colors.semantic.danger} />
                      <Text style={styles.withdrawBtnText}>Withdraw</Text>
                    </TouchableOpacity>
                  )}
              </View>
            </Card>
          );
        })
      )}

      <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
        <Text style={styles.sectionTitle}>My Pre-Bid Clarifications</Text>
      </View>

      {clarifications.filter((c) => c.vendorId === vendorCode).length === 0 ? (
        <Card style={styles.emptyNoteCard}>
          <MessageCircleQuestion size={24} color={colors.text.tertiary} />
          <Text style={styles.emptyNoteTitle}>No Pre-bid Queries Raised</Text>
          <Text style={styles.emptyNoteSub}>
            You can submit questions on technical specs directly from any
            tender card.
          </Text>
        </Card>
      ) : (
        clarifications
          .filter((c) => c.vendorId === vendorCode)
          .map((c) => (
            <Card key={c.id} style={styles.clarificationCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.clarificationTenderId}>
                  Query #{c.id.substring(0, 8)}
                </Text>
                <Text style={styles.clarificationDate}>
                  {c.at ? formatDateTime(c.at) : c.date || 'Recent'}
                </Text>
              </View>
              <Text style={styles.clarificationQuestion}>Q: {c.question}</Text>
              {c.answer ? (
                <View style={styles.clarificationAnswerBox}>
                  <Text style={styles.answerHeader}>
                    Official Response ({c.answeredBy || 'Tender Committee'}):
                  </Text>
                  <Text style={styles.answerBody}>{c.answer}</Text>
                </View>
              ) : (
                <View style={styles.pendingAnswerBox}>
                  <Clock size={12} color={colors.semantic.warning} />
                  <Text style={styles.pendingAnswerText}>
                    Under review by Lead Project Engineer
                  </Text>
                </View>
              )}
            </Card>
          ))
      )}
    </View>
  );
};
