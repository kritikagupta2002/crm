import { DocumentItem, DispatchRecord } from '../../types';

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-001',
    docNo: 'DOC-BGSPL-2026-0104',
    title: 'Bhilwara Zinc Block Concession Deed & GSI Exploration Data',
    category: 'Mineral Concession Deed',
    projectCode: 'PRJ-GEO-2026-001',
    confidentiality: 'Confidential',
    uploadedBy: 'emp-004',
    uploaderName: 'Vikram Patel',
    uploadDate: '2026-08-02',
    isVerified: true,
    verifiedBy: 'emp-001',
    verifierName: 'Dr. Rajesh Bansal',
    verificationRemarks: 'Verified against authenticated physical deed copy from Rajasthan Mines Dept.',
    accessRoles: ['admin', 'lead'],
  },
  {
    id: 'doc-002',
    docNo: 'DOC-BGSPL-2026-0112',
    title: 'Geotechnical Soil Core Test Reports - Sukinda',
    category: 'Assay Report',
    projectCode: 'PRJ-GEO-2026-002',
    confidentiality: 'Internal',
    uploadedBy: 'emp-005',
    uploaderName: 'Neha Gupta',
    uploadDate: '2026-09-22',
    isVerified: false,
    accessRoles: ['admin', 'lead', 'employee'],
  },
];

export const INITIAL_DISPATCHES: DispatchRecord[] = [
  {
    id: 'disp-001',
    docId: 'doc-001',
    docTitle: 'Bhilwara Zinc Block Concession Deed Hard Copy',
    recipientName: 'Sandeep Mukherjee',
    recipientOrg: 'Tata Steel Mining Corp',
    destination: 'Jajpur Mining Site Office, Odisha',
    courierName: 'Blue Dart Express',
    waybillNumber: 'BLUEDT992837461',
    dispatchDate: '2026-09-25',
    status: 'In Transit',
  },
];
