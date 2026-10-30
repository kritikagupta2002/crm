import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, BackHandler } from 'react-native';
import { useVendorPortal } from './useVendorPortal';
import {
  vendorTheme,
  VendorPortalHeader,
  VendorBottomNav,
  VendorNotificationsModal,
  VendorHomeTab,
  VendorTendersTab,
  VendorWorkTab,
  VendorProfileTab,
  VendorPortalModals,
} from './components';

export const VendorPortalScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const {
    logout,
    activeTab,
    setActiveTab,
    notificationsVisible,
    setNotificationsVisible,
    tenderSearch,
    setTenderSearch,
    selectedCategory,
    setSelectedCategory,
    filteredTenders,
    vendorName,
    vendorCode,
    vendorCategory,
    currentVendor,
    myWorkOrders,
    myBids,
    openTenders,
    freshTenders,
    waitingOrders,
    totalPaid,
    totalContract,
    clarifications,
    savedTenders,
    toggleSavedTender,
    accountModalVisible,
    setAccountModalVisible,
    deliveryModalVisible,
    setDeliveryModalVisible,
    selectedWoForDelivery,
    deliveryNotes,
    setDeliveryNotes,
    attachedFiles,
    setAttachedFiles,
    handleSubmitDelivery,
    billingModalVisible,
    setBillingModalVisible,
    selectedWoForBilling,
    invoiceNo,
    setInvoiceNo,
    billAmount,
    setBillAmount,
    billRemarks,
    setBillRemarks,
    handleSubmitBill,
    askModalVisible,
    setAskModalVisible,
    selectedTenderForAsk,
    questionText,
    setQuestionText,
    handleSubmitClarification,
    handleStartWork,
    handleOpenDelivery,
    handleOpenBilling,
    handleWithdrawBid,
    handleOpenClarification,
  } = useVendorPortal();

  const unreadCount =
    waitingOrders.length +
    freshTenders.filter((t) => {
      const closing = new Date(t.submissionDeadline || t.closesAt || '').getTime();
      const diff = (closing - Date.now()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 3;
    }).length;

  useEffect(() => {
    const onBackPress = () => {
      if (
        notificationsVisible ||
        accountModalVisible ||
        deliveryModalVisible ||
        billingModalVisible ||
        askModalVisible
      ) {
        setNotificationsVisible(false);
        setAccountModalVisible(false);
        setDeliveryModalVisible(false);
        setBillingModalVisible(false);
        setAskModalVisible(false);
        return true;
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [
    notificationsVisible,
    accountModalVisible,
    deliveryModalVisible,
    billingModalVisible,
    askModalVisible,
    activeTab,
    setNotificationsVisible,
    setAccountModalVisible,
    setDeliveryModalVisible,
    setBillingModalVisible,
    setAskModalVisible,
    setActiveTab,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <VendorPortalHeader
        vendorName={vendorName}
        vendorCode={vendorCode}
        category={currentVendor?.workCategory || currentVendor?.work || vendorCategory}
        empanelledStatus={currentVendor?.empanelledStatus || 'Empanelled'}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setNotificationsVisible(true)}
        onLogout={logout}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'home' && (
          <VendorHomeTab
            vendorName={vendorName}
            vendorCode={vendorCode}
            currentVendor={currentVendor}
            freshTenders={freshTenders}
            myBids={myBids}
            waitingOrders={waitingOrders}
            myWorkOrders={myWorkOrders}
            clarifications={clarifications}
            totalPaid={totalPaid}
            totalContract={totalContract}
            onNavigateTab={(tab) => setActiveTab(tab)}
            handleStartWork={handleStartWork}
            handleOpenDelivery={handleOpenDelivery}
            handleOpenBilling={handleOpenBilling}
            navigation={navigation}
          />
        )}

        {activeTab === 'tenders' && (
          <VendorTendersTab
            tenderSearch={tenderSearch}
            setTenderSearch={setTenderSearch}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            filteredTenders={filteredTenders}
            vendorCode={vendorCode}
            myBids={myBids}
            savedTenders={savedTenders}
            toggleSavedTender={toggleSavedTender}
            navigation={navigation}
          />
        )}

        {activeTab === 'work' && (
          <VendorWorkTab
            myWorkOrders={myWorkOrders}
            myBids={myBids}
            vendorCode={vendorCode}
            vendorName={vendorName}
            handleStartWork={handleStartWork}
            handleOpenDelivery={handleOpenDelivery}
            handleOpenBilling={handleOpenBilling}
            handleWithdrawBid={handleWithdrawBid}
            navigation={navigation}
          />
        )}

        {activeTab === 'profile' && (
          <VendorProfileTab
            vendorName={vendorName}
            vendorCode={vendorCode}
            currentVendor={currentVendor}
            onLogout={logout}
            navigation={navigation}
          />
        )}
      </ScrollView>

      <VendorBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        openTendersCount={freshTenders.length}
        activeWorkCount={waitingOrders.length}
      />

      <VendorNotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        openTenders={openTenders}
        myBids={myBids}
        myWorkOrders={myWorkOrders}
        navigation={navigation}
      />

      <VendorPortalModals
        accountModalVisible={accountModalVisible}
        setAccountModalVisible={setAccountModalVisible}
        currentVendor={currentVendor}
        deliveryModalVisible={deliveryModalVisible}
        setDeliveryModalVisible={setDeliveryModalVisible}
        selectedWoForDelivery={selectedWoForDelivery}
        deliveryNotes={deliveryNotes}
        setDeliveryNotes={setDeliveryNotes}
        attachedFiles={attachedFiles}
        setAttachedFiles={setAttachedFiles}
        handleSubmitDelivery={handleSubmitDelivery}
        billingModalVisible={billingModalVisible}
        setBillingModalVisible={setBillingModalVisible}
        selectedWoForBilling={selectedWoForBilling}
        invoiceNo={invoiceNo}
        setInvoiceNo={setInvoiceNo}
        billAmount={billAmount}
        setBillAmount={setBillAmount}
        billRemarks={billRemarks}
        setBillRemarks={setBillRemarks}
        handleSubmitBill={handleSubmitBill}
        askModalVisible={askModalVisible}
        setAskModalVisible={setAskModalVisible}
        selectedTenderForAsk={selectedTenderForAsk}
        questionText={questionText}
        setQuestionText={setQuestionText}
        handleSubmitClarification={handleSubmitClarification}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vendorTheme.colors.sandstone,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
});
