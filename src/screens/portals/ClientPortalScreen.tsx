import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import {
  clientTheme,
  useClientPortal,
  ClientPortalHeader,
  ClientBottomNav,
  ClientHomeTab,
  ClientProjectsTab,
  ClientProjectDetailModal,
  ClientDeliverablesTab,
  ClientDeliverableDetailModal,
  ClientInvoicesTab,
  ClientInvoiceDetailModal,
  ClientNotificationsModal,
  ClientProfileTab,
} from './client';
import { Project, Deliverable, FinanceInvoice } from '../../types';

export const ClientPortalScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    session,
    logout,
    activeTab,
    setActiveTab,

    // Client profile details
    currentClientId,
    clientCompanyName,
    clientContactPerson,
    clientMobile,
    clientEmail,
    clientEnquiryId,
    clientGstin,
    clientPan,
    clientAddress,

    // Isolated datasets
    myProjects,
    filteredProjects,
    myDeliverables,
    filteredDeliverables,
    myInvoices,
    filteredInvoices,
    myPayments,

    // Derived KPI numbers
    activeProjectsCount,
    completedProjectsCount,
    pendingDeliverablesCount,
    pendingInvoicesCount,
    totalContractValue,
    totalPaidAmount,
    totalOutstanding,

    // Search and filter state
    projectSearch,
    setProjectSearch,
    deliverableFilter,
    setDeliverableFilter,
    invoiceFilter,
    setInvoiceFilter,

    // Modal states
    selectedProjectForDetail,
    setSelectedProjectForDetail,
    selectedDeliverableForReview,
    setSelectedDeliverableForReview,
    selectedInvoiceForDetail,
    setSelectedInvoiceForDetail,
    selectedInvoiceForUpi,
    setSelectedInvoiceForUpi,
    notificationsVisible,
    setNotificationsVisible,

    // Actions
    handleSignOffDeliverable,
    handleRequestRevision,
    handleSettleInvoiceUpi,
  } = useClientPortal();

  // Calculate unread notifications count
  const unreadNotificationsCount = pendingDeliverablesCount + pendingInvoicesCount;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.container}>
        {/* 1. Executive Portal Header */}
        <ClientPortalHeader
          clientCompanyName={clientCompanyName}
          clientEnquiryId={clientEnquiryId}
          clientContactPerson={clientContactPerson}
          unreadCount={unreadNotificationsCount}
          onOpenNotifications={() => setNotificationsVisible(true)}
          onLogout={logout}
        />

        {/* 2. Active Tab Content Body */}
        <View style={styles.contentBody}>
          {activeTab === 'home' && (
            <ClientHomeTab
              clientCompanyName={clientCompanyName}
              clientContactPerson={clientContactPerson}
              activeProjectsCount={activeProjectsCount}
              completedProjectsCount={completedProjectsCount}
              pendingDeliverablesCount={pendingDeliverablesCount}
              pendingInvoicesCount={pendingInvoicesCount}
              totalContractValue={totalContractValue}
              totalPaidAmount={totalPaidAmount}
              totalOutstanding={totalOutstanding}
              myProjects={myProjects}
              myDeliverables={myDeliverables}
              myInvoices={myInvoices}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenProjectDetail={(p: Project) => setSelectedProjectForDetail(p)}
              onOpenDeliverableReview={(d: Deliverable & { projectTitle: string; projectCode?: string }) =>
                setSelectedDeliverableForReview(d)
              }
              onOpenInvoicePay={(i: FinanceInvoice) => setSelectedInvoiceForUpi(i)}
            />
          )}

          {activeTab === 'projects' && (
            <ClientProjectsTab
              myProjects={myProjects}
              filteredProjects={filteredProjects}
              projectSearch={projectSearch}
              setProjectSearch={setProjectSearch}
              onOpenProjectDetail={(p: Project) => setSelectedProjectForDetail(p)}
            />
          )}

          {activeTab === 'deliverables' && (
            <ClientDeliverablesTab
              myDeliverables={myDeliverables}
              filteredDeliverables={filteredDeliverables}
              deliverableFilter={deliverableFilter}
              setDeliverableFilter={setDeliverableFilter}
              onOpenDeliverableReview={(d: Deliverable & { projectTitle: string; projectCode?: string }) =>
                setSelectedDeliverableForReview(d)
              }
            />
          )}

          {activeTab === 'invoices' && (
            <ClientInvoicesTab
              myInvoices={myInvoices}
              filteredInvoices={filteredInvoices}
              invoiceFilter={invoiceFilter}
              setInvoiceFilter={setInvoiceFilter}
              totalContractValue={totalContractValue}
              totalPaidAmount={totalPaidAmount}
              totalOutstanding={totalOutstanding}
              onOpenInvoiceDetail={(i: FinanceInvoice) => setSelectedInvoiceForDetail(i)}
              onOpenInvoicePay={(i: FinanceInvoice) => setSelectedInvoiceForUpi(i)}
            />
          )}

          {activeTab === 'profile' && (
            <ClientProfileTab
              clientId={currentClientId}
              companyName={clientCompanyName}
              contactPerson={clientContactPerson}
              mobile={clientMobile}
              email={clientEmail}
              enquiryId={clientEnquiryId}
              gstin={clientGstin}
              pan={clientPan}
              address={clientAddress}
              projects={myProjects}
              totalContractValue={totalContractValue}
              totalPaidAmount={totalPaidAmount}
              totalOutstanding={totalOutstanding}
              onLogout={logout}
              onNavigateToEnquiry={() => navigation?.navigate?.('PublicEnquiry')}
            />
          )}
        </View>

        {/* 3. Executive Client Bottom Navigation */}
        <ClientBottomNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          activeProjectsCount={activeProjectsCount}
          pendingDeliverablesCount={pendingDeliverablesCount}
          pendingInvoicesCount={pendingInvoicesCount}
        />

        {/* 4. Project Detail Modal */}
        {selectedProjectForDetail && (
          <ClientProjectDetailModal
            visible={!!selectedProjectForDetail}
            project={selectedProjectForDetail}
            onClose={() => setSelectedProjectForDetail(null)}
            onOpenDeliverableReview={(deliv: Deliverable & { projectTitle: string; projectCode?: string }) => {
              setSelectedProjectForDetail(null);
              setSelectedDeliverableForReview(deliv);
            }}
          />
        )}

        {/* 5. Deliverable Detail & Stage 5 Sign-Off Modal */}
        {selectedDeliverableForReview && (
          <ClientDeliverableDetailModal
            visible={!!selectedDeliverableForReview}
            deliverable={selectedDeliverableForReview}
            clientCompanyName={clientCompanyName}
            clientContactPerson={clientContactPerson}
            onClose={() => setSelectedDeliverableForReview(null)}
            onSignOff={async (projectId: string, deliverableId: string, remarks?: string) => {
              await handleSignOffDeliverable(projectId, deliverableId, remarks);
            }}
            onRequestRevision={async (projectId: string, deliverableId: string, reason: string) => {
              await handleRequestRevision(projectId, deliverableId, reason);
            }}
          />
        )}

        {/* 6. Invoice Detail & Instant UPI Payment Modal */}
        {(selectedInvoiceForDetail || selectedInvoiceForUpi) && (
          <ClientInvoiceDetailModal
            visible={!!(selectedInvoiceForDetail || selectedInvoiceForUpi)}
            invoice={selectedInvoiceForUpi || selectedInvoiceForDetail!}
            initialShowUpi={!!selectedInvoiceForUpi}
            clientCompanyName={clientCompanyName}
            clientGstin={clientGstin}
            clientAddress={clientAddress}
            onClose={() => {
              setSelectedInvoiceForDetail(null);
              setSelectedInvoiceForUpi(null);
            }}
            onSettleUpi={async (invoiceId: string, utrRef?: string) => {
              await handleSettleInvoiceUpi(invoiceId, utrRef);
            }}
          />
        )}

        {/* 7. Client Notifications Modal */}
        <ClientNotificationsModal
          visible={notificationsVisible}
          onClose={() => setNotificationsVisible(false)}
          projects={myProjects}
          deliverables={myDeliverables}
          invoices={myInvoices}
          onSelectDeliverable={(deliv: Deliverable & { projectTitle: string; projectCode?: string }) =>
            setSelectedDeliverableForReview(deliv)
          }
          onSelectInvoice={(inv: FinanceInvoice) => setSelectedInvoiceForDetail(inv)}
          onSelectProject={(proj: Project) => setSelectedProjectForDetail(proj)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: clientTheme.colors.sandstone,
  },
  contentBody: {
    flex: 1,
  },
});
