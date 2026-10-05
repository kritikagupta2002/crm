import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  FinanceInvoice,
  VendorBill,
  FinanceVoucher,
  TdsRecord,
  GstReturn,
  GstTransaction,
  FinanceOverviewMetrics,
} from '../types';
import { financeService } from '../services';

export interface FinanceContextType {
  invoices: FinanceInvoice[];
  vendorBills: VendorBill[];
  vouchers: FinanceVoucher[];
  taxRecords: TdsRecord[];
  gstReturns: GstReturn[];
  gstTransactions: GstTransaction[];
  isLoading: boolean;
  refreshFinance: () => Promise<void>;
  createInvoice: (data: any) => Promise<FinanceInvoice>;
  updateInvoiceStatus: (id: string, status: any, paidAmount?: number, paymentMode?: string) => Promise<FinanceInvoice>;
  recordVendorBill: (data: any) => Promise<VendorBill>;
  updateVendorBillStatus: (id: string, status: any, paymentDetails?: any) => Promise<VendorBill>;
  createVoucher: (data: any) => Promise<FinanceVoucher>;
  updateTaxStatus: (id: string, status: 'Deposited' | 'Pending Deposit', challanDetails?: any) => Promise<TdsRecord>;
  getOverviewMetrics: () => Promise<FinanceOverviewMetrics>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [vouchers, setVouchers] = useState<FinanceVoucher[]>([]);
  const [taxRecords, setTaxRecords] = useState<TdsRecord[]>([]);
  const [gstReturns, setGstReturns] = useState<GstReturn[]>([]);
  const [gstTransactions, setGstTransactions] = useState<GstTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const [
        invoicesData,
        vendorBillsData,
        vouchersData,
        taxData,
        gstData,
        gstTxData,
      ] = await Promise.all([
        financeService.getInvoices(),
        financeService.getVendorBills(),
        financeService.getVouchers(),
        financeService.getTaxRecords(),
        financeService.getGstReturns(),
        financeService.getGstTransactions(),
      ]);

      setInvoices(invoicesData);
      setVendorBills(vendorBillsData);
      setVouchers(vouchersData);
      setTaxRecords(taxData);
      setGstReturns(gstData);
      setGstTransactions(gstTxData);
    } catch (e) {
      console.error('Error loading Finance data:', e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const createInvoice = useCallback(async (data: any) => {
    const inv = await financeService.createInvoice(data);
    await loadData();
    return inv;
  }, [loadData]);

  const updateInvoiceStatus = useCallback(async (id: string, status: any, paidAmount?: number, paymentMode?: string) => {
    const inv = await financeService.updateInvoiceStatus(id, status, paidAmount, paymentMode);
    await loadData();
    return inv;
  }, [loadData]);

  const recordVendorBill = useCallback(async (data: any) => {
    const b = await financeService.recordVendorBill(data);
    await loadData();
    return b;
  }, [loadData]);

  const updateVendorBillStatus = useCallback(async (id: string, status: any, paymentDetails?: any) => {
    const b = await financeService.updateVendorBillStatus(id, status, paymentDetails);
    await loadData();
    return b;
  }, [loadData]);

  const createVoucher = useCallback(async (data: any) => {
    const v = await financeService.createVoucher(data);
    await loadData();
    return v;
  }, [loadData]);

  const updateTaxStatus = useCallback(async (id: string, status: 'Deposited' | 'Pending Deposit', challanDetails?: any) => {
    const t = await financeService.updateTaxStatus(id, status, challanDetails);
    await loadData();
    return t;
  }, [loadData]);

  const getOverviewMetrics = useCallback(async () => {
    return financeService.getOverviewMetrics();
  }, []);

  const value = useMemo<FinanceContextType>(() => ({
    invoices,
    vendorBills,
    vouchers,
    taxRecords,
    gstReturns,
    gstTransactions,
    isLoading,
    refreshFinance: loadData,
    createInvoice,
    updateInvoiceStatus,
    recordVendorBill,
    updateVendorBillStatus,
    createVoucher,
    updateTaxStatus,
    getOverviewMetrics,
  }), [
    invoices,
    vendorBills,
    vouchers,
    taxRecords,
    gstReturns,
    gstTransactions,
    isLoading,
    loadData,
    createInvoice,
    updateInvoiceStatus,
    recordVendorBill,
    updateVendorBillStatus,
    createVoucher,
    updateTaxStatus,
    getOverviewMetrics,
  ]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
