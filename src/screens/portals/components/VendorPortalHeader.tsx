import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Building2, LogOut } from 'lucide-react-native';
import { AppHeader } from '../../../components';
import { colors, spacing } from '../../../theme';
import { styles } from './vendorPortalStyles';

export type PortalTab = 'home' | 'tenders' | 'bids' | 'workOrders' | 'payments';

interface VendorPortalHeaderProps {
  vendorName: string;
  vendorCode: string;
  onOpenAccountModal: () => void;
  onLogout: () => void;
  activeTab: PortalTab;
  setActiveTab: (tab: PortalTab) => void;
  openTendersCount: number;
  myBidsCount: number;
  myWorkOrdersCount: number;
  hasWaitingOrders: boolean;
}

export const VendorPortalHeader: React.FC<VendorPortalHeaderProps> = ({
  vendorName,
  vendorCode,
  onOpenAccountModal,
  onLogout,
  activeTab,
  setActiveTab,
  openTendersCount,
  myBidsCount,
  myWorkOrdersCount,
  hasWaitingOrders,
}) => {
  return (
    <>
      <AppHeader
        title={vendorName}
        subtitle={`Empanelled Contractor #${vendorCode}`}
        rightAction={
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={onOpenAccountModal}
              accessibilityLabel="View Account Profile"
            >
              <Building2 size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.headerIconBtn,
                { backgroundColor: `${colors.semantic.danger}15` },
              ]}
              onPress={onLogout}
              accessibilityLabel="Sign Out"
            >
              <LogOut size={16} color={colors.semantic.danger} />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.navBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
            onPress={() => setActiveTab('home')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'home' && styles.tabLabelActive,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'tenders' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('tenders')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'tenders' && styles.tabLabelActive,
              ]}
            >
              Tenders ({openTendersCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'bids' && styles.tabItemActive]}
            onPress={() => setActiveTab('bids')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'bids' && styles.tabLabelActive,
              ]}
            >
              My Bids ({myBidsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'workOrders' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('workOrders')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'workOrders' && styles.tabLabelActive,
              ]}
            >
              Work Orders ({myWorkOrdersCount})
            </Text>
            {hasWaitingOrders && <View style={styles.badgeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'payments' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('payments')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'payments' && styles.tabLabelActive,
              ]}
            >
              Payments
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
};
