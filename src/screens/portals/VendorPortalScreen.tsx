import React from 'react';
import { View, ScrollView } from 'react-native';
import { useVendorPortal } from './useVendorPortal';
import {
  styles,
  VendorPortalHeader,
  VendorHomeTab,
  VendorTendersTab,
  VendorBidsTab,
  VendorWorkOrdersTab,
  VendorPaymentsTab,
  VendorPortalModals,
} from './components';

export const VendorPortalScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const {
    logout,
    activeTab,
    setActiveTab,
    tenderSearch,
    setTenderSearch,
    selectedCategory,
    setSelectedCategory,
    filteredTenders,
    vendorName,
    vendorCode,
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

  return (
    <View style={styles.container}>
      <VendorPortalHeader
        vendorName={vendorName}
        vendorCode={vendorCode}
        onOpenAccountModal={() => setAccountModalVisible(true)}
        onLogout={logout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openTendersCount={openTenders.length}
        myBidsCount={myBids.length}
        myWorkOrdersCount={myWorkOrders.length}
        hasWaitingOrders={waitingOrders.length > 0}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'home' && (
          <VendorHomeTab
            vendorName={vendorName}
            currentVendor={currentVendor}
            onOpenAccountModal={() => setAccountModalVisible(true)}
            freshTenders={freshTenders}
            myBids={myBids}
            waitingOrders={waitingOrders}
            totalPaid={totalPaid}
            setActiveTab={setActiveTab}
            myWorkOrders={myWorkOrders}
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
            savedTenders={savedTenders}
            toggleSavedTender={toggleSavedTender}
            handleOpenClarification={handleOpenClarification}
            navigation={navigation}
          />
        )}

        {activeTab === 'bids' && (
          <VendorBidsTab
            myBids={myBids}
            vendorCode={vendorCode}
            setActiveTab={setActiveTab}
            handleWithdrawBid={handleWithdrawBid}
            clarifications={clarifications}
            navigation={navigation}
          />
        )}

        {activeTab === 'workOrders' && (
          <VendorWorkOrdersTab
            myWorkOrders={myWorkOrders}
            handleStartWork={handleStartWork}
            handleOpenDelivery={handleOpenDelivery}
            handleOpenBilling={handleOpenBilling}
            navigation={navigation}
          />
        )}

        {activeTab === 'payments' && (
          <VendorPaymentsTab
            totalContract={totalContract}
            totalPaid={totalPaid}
            myWorkOrders={myWorkOrders}
          />
        )}
      </ScrollView>

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
