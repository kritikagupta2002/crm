import { BarChart3, Building2, CalendarClock, FileText, LayoutDashboard, Settings, ShieldCheck, UserPlus, Users } from 'lucide-react'

export const NAV_GROUPS = [
  {
    title: null,
    items: [{ label: 'Dashboard', path: '/', icon: LayoutDashboard }],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Leads & Enquiries', path: '/leads', icon: Users },
      { label: 'Follow-ups', path: '/follow-ups', icon: CalendarClock, badge: 'followUpsDue' },
      { label: 'Quotations', path: '/quotations', icon: FileText },
    ],
  },
  {
    title: 'Clients',
    items: [
      { label: 'Client Approval', path: '/client-approval', icon: ShieldCheck },
      { label: 'Onboarding', path: '/client-onboarding', icon: UserPlus },
      { label: 'Client Master', path: '/clients', icon: Building2 },
    ],
  },
  {
    title: 'General',
    items: [
      { label: 'Reports', path: '/reports', icon: BarChart3 },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)
