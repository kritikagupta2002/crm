
export const WORK_CATEGORIES = [
  'Core drilling',
  'Lab testing (NABL)',
  'Drone survey',
  'DGPS & total station survey',
  'Borewell & pumping test',
  'Air, water & noise monitoring',
  'Geotechnical testing',
  'Machinery & equipment hire',
  'Transport & logistics',
  'Other',
];

export const COMPANY_TYPES = [
  'Contractor',
  'Laboratory',
  'Survey Agency',
  'Consultant',
  'Supplier / Equipment Hire',
];

export const LEGAL_STATUS = [
  'Proprietorship',
  'Partnership',
  'LLP',
  'Private Limited Company',
  'Public Limited Company',
  'Joint Venture',
  'Others',
];

export const COMPANY_CATEGORIES = [
  'Micro Unit as per MSME',
  'Small Unit as per MSME',
  'Medium Unit as per MSME',
  'Ancillary Unit',
  'SSI',
  'Others',
];

export const PREFERENCE_CATEGORIES = ['MSME', 'Startup'];
export const TITLES = ['Mr', 'Ms', 'Mrs', 'Dr', 'Sri'];
export const ACCOUNT_TYPES = ['Current', 'Savings'];

export const TENDER_CATEGORIES = ['Services', 'Works', 'Goods'];
export const CONTRACT_FORMS = ['Lump-sum', 'Item rate', 'Percentage'];

export const BID_REJECT_REASONS = [
  'Rate too high against the other bids',
  'Pre-qualification not met',
  'Period of work too long',
  'Documents incomplete',
  'Other',
];

export const REJECT_REASONS = [
  'Already registered (duplicate PAN, GSTIN or bank account)',
  'Work we don’t subcontract',
  'Documents not valid',
  'Not eligible (experience, accreditation or blacklisting)',
  'Other',
];

export const BID_DOCS = [
  { kind: 'Financial quote / BOQ', required: true },
  { kind: 'Technical documents', required: false },
  { kind: 'Experience certificates', required: false },
];

export const VENDOR_DOCS = [
  { kind: 'PAN card', required: true },
  { kind: 'Cancelled cheque', required: true },
  { kind: 'GST certificate', required: 'gst' },
  { kind: 'Registration / Udyam / Startup certificate', required: false },
  { kind: 'Experience / accreditation', required: false },
];

export const TDS_SECTIONS = [
  { section: '194C', rate: 1, label: '194C · contract work · 1% (individual / HUF)' },
  { section: '194C', rate: 2, label: '194C · contract work · 2% (firm / company)' },
  { section: '194J', rate: 2, label: '194J · technical services · 2%' },
  { section: '194J', rate: 10, label: '194J · professional services · 10%' },
];

export const STATE_CODES: Record<string, string> = {
  'Andhra Pradesh': '37',
  Bihar: '10',
  Chhattisgarh: '22',
  Delhi: '07',
  Goa: '30',
  Gujarat: '24',
  Haryana: '06',
  'Himachal Pradesh': '02',
  Jharkhand: '20',
  Karnataka: '29',
  Kerala: '32',
  'Madhya Pradesh': '23',
  Maharashtra: '27',
  Odisha: '21',
  Punjab: '03',
  Rajasthan: '08',
  'Tamil Nadu': '33',
  Telangana: '36',
  'Uttar Pradesh': '09',
  Uttarakhand: '05',
  'West Bengal': '19',
};

export const STATES = Object.keys(STATE_CODES);
import {
  PAN_REGEX as PAN_RE,
  GSTIN_REGEX as GSTIN_RE,
  IFSC_REGEX as IFSC_RE,
  INDIAN_MOBILE_REGEX as MOBILE_RE,
  PIN_REGEX as PIN_RE,
  EMAIL_REGEX as EMAIL_RE,
} from '../utils/validation';

export { PAN_RE, GSTIN_RE, IFSC_RE, MOBILE_RE, PIN_RE, EMAIL_RE };

export const clean = (v: any) => String(v ?? '').replace(/\s+/g, '').toUpperCase();
export const digitsOf = (v: any) => String(v ?? '').replace(/\D/g, '');

export const msmeOf = (firm: any) => firm.category?.match(/^(Micro|Small|Medium) Unit/)?.[1] ?? null;

export const closingOf = (tender: any) => tender.closedEarlyAt ?? tender.closesAt ?? tender.submissionDeadline;

export function tenderPhase(tender: any, now = Date.now()): 'Open' | 'Evaluation' | 'Allotted' | 'Cancelled' {
  if (tender.status === 'Allotted' || tender.status === 'Awarded') return 'Allotted';
  if (tender.status === 'Cancelled') return 'Cancelled';
  const closeStr = tender.closedEarlyAt ?? tender.closesAt ?? tender.submissionDeadline;
  if (!closeStr) return 'Open';
  const closes = new Date(closeStr).getTime();
  if (isNaN(closes)) return 'Open';
  return now < closes ? 'Open' : 'Evaluation';
}

export {
  formatDateTime,
  formatDateOnly,
  formatRelativeDays as daysFrom,
} from '../utils/date';

export const requiredDocs = (app: any) =>
  VENDOR_DOCS.filter((d) => d.required === true || (d.required === 'gst' && app.tax?.gstRegistered)).map((d) => d.kind);

export function validateApplication(app: any, files: any[] = []): Record<string, string> {
  const e: Record<string, string> = {};
  const need = (path: string, value: any, message: string) => {
    if (!String(value ?? '').trim()) e[path] = message;
  };

  if (!EMAIL_RE.test(String(app.contact?.email ?? '').trim())) e['contact.email'] = 'Enter a valid email address.';
  const mobile = digitsOf(app.contact?.mobile).slice(-10);
  if (!MOBILE_RE.test(mobile)) e['contact.mobile'] = 'Enter a 10-digit mobile number.';
  else if (!app.contact?.mobileVerified) e['contact.mobile'] = 'Verify the mobile number with the code.';

  need('firm.name', app.firm?.name, 'Enter company name or license holder name.');
  if (app.firm?.preferential) need('firm.preference', app.firm?.preference, 'Choose preference category.');
  need('firm.regNo', app.firm?.regNo, 'Enter registration number.');
  need('address.line', app.address?.line, 'Enter registered address.');
  need('firm.companyType', app.firm?.companyType, 'Choose company type.');
  need('address.city', app.address?.city, 'Enter city.');
  need('address.state', app.address?.state, 'Choose state.');
  if (!PIN_RE.test(digitsOf(app.address?.pincode))) e['address.pincode'] = 'Enter valid 6-digit postal code.';
  need('firm.nature', app.firm?.nature, 'Describe nature of business.');
  need('firm.legalStatus', app.firm?.legalStatus, 'Choose legal status.');
  need('firm.category', app.firm?.category, 'Choose company category.');
  if (!app.work?.categories?.length) e['work.categories'] = 'Choose at least one category of work.';

  need('contact.name', app.contact?.name, 'Enter contact person name.');
  need('contact.dob', app.contact?.dob, 'Enter date of birth.');

  const pan = clean(app.tax?.pan);
  if (!PAN_RE.test(pan)) e['tax.pan'] = 'PAN must have 10 characters, e.g. ABCDE1234F.';

  if (app.tax?.gstRegistered) {
    const gstin = clean(app.tax?.gstin);
    if (!GSTIN_RE.test(gstin)) e['tax.gstin'] = 'GSTIN must have 15 characters, e.g. 08ABCDE1234F1Z5.';
    else if (PAN_RE.test(pan) && gstin.slice(2, 12) !== pan) e['tax.gstin'] = 'GSTIN must contain your PAN (chars 3 to 12).';
  }

  need('bank.holder', app.bank?.holder, 'Enter bank account holder name.');
  need('bank.bank', app.bank?.bank, 'Enter bank name.');
  if (digitsOf(app.bank?.accountNo).length < 9) e['bank.accountNo'] = 'Enter full bank account number.';
  else if (app.bank?.accountConfirm && digitsOf(app.bank?.accountNo) !== digitsOf(app.bank?.accountConfirm)) {
    e['bank.accountConfirm'] = 'The two account numbers do not match.';
  }
  if (!IFSC_RE.test(clean(app.bank?.ifsc))) e['bank.ifsc'] = 'IFSC must have 11 characters, e.g. SBIN0001234.';

  const kinds = new Set([...(app.documents ?? []).map((d: any) => d.kind), ...files.map((f: any) => f.kind)]);
  const missing = requiredDocs(app).filter((k) => !kinds.has(k));
  if (missing.length) e.documents = `Still to upload: ${missing.join(', ')}.`;

  if (!app.declared) e.declared = 'Please confirm the statutory declaration.';
  if (!app.captchaOk) e.captcha = 'Please solve the verification challenge.';

  return e;
}

export function applicationChecks(app: any, vendors: any[] = [], applications: any[] = []): Array<{ label: string; ok: boolean; note: string }> {
  const pan = clean(app.tax?.pan);
  const gstin = clean(app.tax?.gstin);
  const account = digitsOf(app.bank?.accountNo);
  const checks: Array<{ label: string; ok: boolean; note: string }> = [];

  checks.push({
    label: 'PAN',
    ok: PAN_RE.test(pan),
    note: PAN_RE.test(pan) ? `${pan} · Valid PAN structure` : `${pan || 'Missing'} · Invalid PAN format`,
  });

  if (!app.tax?.gstRegistered) {
    checks.push({ label: 'GSTIN', ok: true, note: 'Not GST registered (Unregistered entity declaration)' });
  } else if (!GSTIN_RE.test(gstin)) {
    checks.push({ label: 'GSTIN', ok: false, note: `${gstin || 'Missing'} · Invalid GSTIN format` });
  } else {
    const stateCode = STATE_CODES[app.address?.state];
    const issues = [
      gstin.slice(2, 12) !== pan && 'Does not contain applicant PAN',
      stateCode && gstin.slice(0, 2) !== stateCode && `State code ${gstin.slice(0, 2)} does not match ${app.address?.state} (${stateCode})`,
    ].filter(Boolean);
    checks.push({
      label: 'GSTIN',
      ok: !issues.length,
      note: issues.length ? `${gstin} · ${issues.join('; ')}` : `${gstin} · Matches PAN and state ${app.address?.state}`,
    });
  }

  const ifsc = clean(app.bank?.ifsc);
  checks.push({
    label: 'Bank IFSC',
    ok: IFSC_RE.test(ifsc),
    note: IFSC_RE.test(ifsc) ? `${ifsc} · ${app.bank?.bank || 'Bank verified'}` : 'Invalid IFSC code',
  });

  const kinds = new Set((app.documents ?? []).map((d: any) => d.kind));
  const missing = requiredDocs(app).filter((k) => !kinds.has(k));
  checks.push({
    label: 'Documents',
    ok: !missing.length,
    note: missing.length ? `Missing: ${missing.join(', ')}` : `${app.documents?.length || 0} papers uploaded, required present`,
  });

  const clashes: string[] = [];
  vendors.forEach((v) => {
    if (clean(v.pan) === pan) clashes.push(`PAN already registered with ${v.id || v.vendorCode} (${v.name})`);
    else if (gstin && clean(v.gstin) === gstin) clashes.push(`GSTIN registered with ${v.id || v.vendorCode} (${v.name})`);
    else if (account && digitsOf(v.bank?.accountNo) === account) clashes.push(`Bank account in use by ${v.name}`);
  });
  applications
    .filter((a) => a.id !== app.id && a.status !== 'Rejected')
    .forEach((a) => {
      if (clean(a.tax?.pan) === pan || (gstin && clean(a.tax?.gstin) === gstin) || (account && digitsOf(a.bank?.accountNo) === account)) {
        clashes.push(`Same credentials found in live application ${a.id}`);
      }
    });

  checks.push({
    label: 'Duplicate Check',
    ok: !clashes.length,
    note: clashes.length ? clashes.join('; ') : 'No duplicate PAN, GSTIN or Bank Account found in registry',
  });

  return checks;
}

export function suggestedTds(app: any): { section: string; rate: number } {
  if (['Laboratory', 'Survey Agency', 'Consultant'].includes(app.firm?.companyType)) {
    return { section: '194J', rate: 2 };
  }
  return { section: '194C', rate: app.firm?.legalStatus === 'Proprietorship' ? 1 : 2 };
}

export function validateBid(bid: any, tender: any, files: any[] = []): Record<string, string> {
  const e: Record<string, string> = {};
  if (!(Number(bid.amount) > 0)) e.amount = 'Enter your quoted amount.';
  if (!(Number(bid.days) > 0)) e.days = 'Enter the execution days needed.';
  if (!bid.startFrom) e.startFrom = 'Select earliest start date.';
  if (!String(bid.note ?? '').trim()) e.note = 'Describe methodology, equipment deployment, and field crew.';
  if (tender.emdAmount > 0 && !String(bid.emdRef ?? '').trim()) e.emdRef = 'Enter EMD payment / DD / BG reference.';

  const kinds = new Set([...(bid.documents ?? []).map((d: any) => d.kind), ...files.map((f: any) => f.kind)]);
  const missing = BID_DOCS.filter((d) => d.required && !kinds.has(d.kind)).map((d) => d.kind);
  if (missing.length) e.documents = `Still to attach: ${missing.join(', ')}.`;

  if (!bid.declared) e.declared = 'Please confirm the commercial bidder declaration.';
  return e;
}

export function statusNote(w: any): string {
  const status = w.status ?? w.currentStage;
  if (status === 'Bill received' || status === 'Billed') {
    return w.check?.ok ? 'Checked by Accounts · ready to pay' : 'Bill under technical & accounts check';
  }
  if (status === 'Completed' || status === 'Delivered') {
    return w.returned?.length ? 'Bill returned · waiting for corrected invoice' : 'Delivered · waiting for bill';
  }
  if (status === 'Issued') return 'Not started by vendor';
  if (status === 'In progress' || status === 'Started') {
    return w.late ? 'Past execution due date' : `Due by ${w.dueOn || 'schedule'}`;
  }
  return `Paid · Ref: ${w.payment?.ref || 'NEFT'}`;
}

export function vendorStats(vendor: any, orders: any[] = []) {
  const mine = orders.filter((w) => w.vendor === vendor.name || w.vendorName === vendor.name || w.vendorId === vendor.id);
  const delivered = mine.filter((w) => w.delivery || w.currentStage === 'Delivered' || w.currentStage === 'Billed' || w.currentStage === 'Paid');
  const onTime = delivered.filter((w) => (w.delayDays ?? 0) <= 0).length;
  const late = delivered.filter((w) => (w.delayDays ?? 0) > 0);
  return {
    orders: mine,
    open: mine.filter((w) => w.currentStage !== 'Paid' && w.status !== 'Paid').length,
    delivered: delivered.length,
    onTimePct: delivered.length ? Math.round((onTime / delivered.length) * 100) : null,
    avgDelay: late.length ? Math.round(late.reduce((s, w) => s + (w.delayDays || 0), 0) / late.length) : 0,
    value: mine.reduce((s, w) => s + (w.contractValue || w.amount || 0), 0),
    returned: mine.reduce((s, w) => s + (w.returned?.length ?? 0), 0),
  };
}
