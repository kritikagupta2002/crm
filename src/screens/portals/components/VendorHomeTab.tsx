import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  HardHat,
  Gavel,
  ShieldCheck,
  FileSpreadsheet,
  IndianRupee,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import { Card, StatusBadge, Button } from '../../../components';
import { colors, spacing } from '../../../theme';
import { Tender, WorkOrder, SealedBid } from '../../../types';
import { closingOf, daysFrom } from '../../../constants/vendor';
import { styles } from './vendorPortalStyles';
import { PortalTab } from './VendorPortalHeader';

interface VendorHomeTabProps {
  vendorName: string;
  currentVendor: any;
  onOpenAccountModal: () => void;
  freshTenders: Tender[];
  myBids: { tender: Tender; bid: SealedBid }[];
  waitingOrders: WorkOrder[];
  totalPaid: number;
  setActiveTab: (tab: PortalTab) => void;
  myWorkOrders: WorkOrder[];
  handleStartWork: (wo: WorkOrder) => void;
  handleOpenDelivery: (wo: WorkOrder) => void;
  handleOpenBilling: (wo: WorkOrder) => void;
  navigation: any;
}

export const VendorHomeTab: React.FC<VendorHomeTabProps> = ({
  vendorName,
  currentVendor,
  onOpenAccountModal,
  freshTenders,
  myBids,
  waitingOrders,
  totalPaid,
  setActiveTab,
  myWorkOrders,
  handleStartWork,
  handleOpenDelivery,
  handleOpenBilling,
  navigation,
}) => {
  return (
    <View style={{ gap: spacing.md }}>
      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroBadge}>
            <HardHat size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{vendorName}</Text>
            <Text style={styles.heroSub}>
              Category: {currentVendor.workCategory || 'Geotechnical'}
            </Text>
            <View style={styles.heroMetaRow}>
              <StatusBadge
                status={currentVendor.approvalStatus || 'approved'}
                size="small"
              />
              <Text style={styles.heroMetaText}>
                GSTIN: {currentVendor.gstin || 'Registered'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.heroActionBtn}
          onPress={onOpenAccountModal}
        >
          <Text style={styles.heroActionText}>
            View Banking & Compliance Profile →
          </Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.kpiGrid}>
        <Card style={styles.kpiCard}>
          <View
            style={[
              styles.kpiIconWrap,
              { backgroundColor: `${colors.semantic.info}15` },
            ]}
          >
            <Gavel size={18} color={colors.semantic.info} />
          </View>
          <Text style={styles.kpiValue}>{freshTenders.length}</Text>
          <Text style={styles.kpiLabel}>Open to Bid</Text>
        </Card>

        <Card style={styles.kpiCard}>
          <View
            style={[
              styles.kpiIconWrap,
              { backgroundColor: `${colors.primary}15` },
            ]}
          >
            <ShieldCheck size={18} color={colors.primary} />
          </View>
          <Text style={styles.kpiValue}>{myBids.length}</Text>
          <Text style={styles.kpiLabel}>My Active Bids</Text>
        </Card>

        <Card style={styles.kpiCard}>
          <View
            style={[
              styles.kpiIconWrap,
              { backgroundColor: `${colors.semantic.warning}15` },
            ]}
          >
            <FileSpreadsheet size={18} color={colors.semantic.warning} />
          </View>
          <Text style={styles.kpiValue}>{waitingOrders.length}</Text>
          <Text style={styles.kpiLabel}>Action Required</Text>
        </Card>

        <Card style={styles.kpiCard}>
          <View
            style={[
              styles.kpiIconWrap,
              { backgroundColor: `${colors.semantic.success}15` },
            ]}
          >
            <IndianRupee size={18} color={colors.semantic.success} />
          </View>
          <Text style={styles.kpiValue}>₹{(totalPaid / 100000).toFixed(1)}L</Text>
          <Text style={styles.kpiLabel}>Disbursed</Text>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Subcontracts Requiring Action</Text>
        <TouchableOpacity onPress={() => setActiveTab('workOrders')}>
          <Text style={styles.linkText}>View All ({myWorkOrders.length})</Text>
        </TouchableOpacity>
      </View>

      {waitingOrders.length === 0 ? (
        <Card style={styles.emptyNoteCard}>
          <CheckCircle2 size={24} color={colors.semantic.success} />
          <Text style={styles.emptyNoteTitle}>
            All Subcontracts are Up to Date
          </Text>
          <Text style={styles.emptyNoteSub}>
            No pending mobilization, delivery, or milestone invoicing actions.
          </Text>
        </Card>
      ) : (
        waitingOrders.map((wo) => (
          <Card key={wo.id} style={styles.orderActionCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.woCode}>{wo.woNumber}</Text>
              <StatusBadge status={wo.currentStage} size="small" />
            </View>
            <Text style={styles.woTitle}>{wo.projectTitle}</Text>
            <Text style={styles.woScope}>{wo.scopeOfWork}</Text>

            <View style={styles.woDivider} />

            <View style={styles.actionBtnRow}>
              {wo.currentStage === 'Issued' && (
                <Button
                  title="Confirm Mobilization / Start Work"
                  variant="primary"
                  size="small"
                  onPress={() => handleStartWork(wo)}
                  style={{ flex: 1 }}
                />
              )}
              {wo.currentStage === 'Started' && (
                <Button
                  title="Submit Field Delivery Report"
                  variant="primary"
                  size="small"
                  onPress={() => handleOpenDelivery(wo)}
                  style={{ flex: 1 }}
                />
              )}
              {wo.currentStage === 'Delivered' && (
                <Button
                  title="Submit Milestone Invoice"
                  variant="primary"
                  size="small"
                  onPress={() => handleOpenBilling(wo)}
                  style={{ flex: 1 }}
                />
              )}
              <Button
                title="Details"
                variant="outline"
                size="small"
                onPress={() =>
                  navigation.navigate('WorkOrderDetail', { woId: wo.id })
                }
              />
            </View>
          </Card>
        ))
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Open Tenders</Text>
        <TouchableOpacity onPress={() => setActiveTab('tenders')}>
          <Text style={styles.linkText}>Explore ({freshTenders.length})</Text>
        </TouchableOpacity>
      </View>

      {freshTenders.slice(0, 3).map((t) => {
        const closingTime = closingOf(t);
        const daysDiff = Math.round(
          (new Date(closingTime).getTime() - Date.now()) / 86400000
        );
        const daysLabel = daysFrom(closingTime);
        return (
          <Card
            key={t.id}
            style={styles.tenderCard}
            onPress={() =>
              navigation.navigate('TenderDetail', { tenderId: t.id })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.woCode}>{t.tenderNo || t.id}</Text>
              <View style={styles.timeTag}>
                <Clock size={11} color={colors.semantic.warning} />
                <Text style={styles.timeTagText}>
                  {daysDiff > 0 ? daysLabel : 'Closes Today'}
                </Text>
              </View>
            </View>
            <Text style={styles.woTitle}>{t.title}</Text>
            <Text style={styles.woScope} numberOfLines={2}>
              {t.description ||
                t.prequal ||
                'Field exploration & sampling work order'}
            </Text>

            <View style={styles.metaPillsRow}>
              <View style={styles.metaPill}>
                <Text style={styles.metaPillLabel}>Est. Value</Text>
                <Text style={styles.metaPillVal}>
                  ₹{(t.estimatedValue / 100000).toFixed(1)} L
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaPillLabel}>EMD</Text>
                <Text style={styles.metaPillVal}>
                  ₹{t.emdAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaPillLabel}>Bids Locked</Text>
                <Text style={styles.metaPillVal}>
                  {t.sealedBids.length} in Vault
                </Text>
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
};
