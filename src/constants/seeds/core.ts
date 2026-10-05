import { AppNotification } from '../../types';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Quotation Approved',
    message: 'Director approved quotation QT-BGSPL-2026-041 for Hindustan Zinc Ltd (₹47.20 Lakhs).',
    type: 'success',
    timestamp: '2026-09-21 10:30',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'New Leave Request',
    message: 'Neha Gupta applied for 3 days Casual Leave (CL) starting 12-Oct-2026.',
    type: 'info',
    timestamp: '2026-10-01 14:15',
    read: false,
  },
];
