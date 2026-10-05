export const COMPANY_BANK_DETAILS = {
  companyName: 'Bansal Geo Services Pvt Ltd',
  upiId: 'bansalgeo@hdfcbank',
  bankName: 'HDFC Bank Ltd',
  branch: 'Jaipur Corporate Branch, C-Scheme, Jaipur',
  accountNumber: '50200049108821',
  accountType: 'Current Account',
  ifscCode: 'HDFC0000491',
  gstin: '08AABCB1182K1ZM',
  pan: 'AAACB1182K',
};

export function generateInvoiceUpiLink(
  invoiceNumber: string,
  amount: number,
  clientName?: string
): string {
  const note = `Inv ${invoiceNumber}${clientName ? ' - ' + clientName : ''}`.slice(0, 50);
  const roundedAmount = Math.max(0, Math.round(amount));

  return (
    `upi://pay?pa=${encodeURIComponent(COMPANY_BANK_DETAILS.upiId)}` +
    `&pn=${encodeURIComponent(COMPANY_BANK_DETAILS.companyName)}` +
    `&am=${roundedAmount}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(note)}`
  );
}
