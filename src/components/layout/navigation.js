import { BarChart3, Building2, CalendarDays, FileText, Home, Landmark, Settings, ShieldCheck, UserRound, Users } from 'lucide-react'

/* One workspace list, in the order the work flows: enquiry → quotation → approval → client. */
export const NAV_GROUPS = [
  {
    title: 'CRM Workspace',
    items: [
      { label: 'Dashboard', path: '/', icon: Home },
      { label: 'Leads & Enquiries', path: '/leads', icon: Users },
      { label: 'Follow-ups', path: '/follow-ups', icon: CalendarDays, badge: 'followUpsDue' },
      { label: 'Quotations & Proposals', path: '/quotations', icon: FileText },
      { label: 'Client Approval', path: '/client-approval', icon: ShieldCheck },
      { label: 'Client Onboarding', path: '/client-onboarding', icon: UserRound },
      { label: 'Client Master', path: '/clients', icon: Building2 },
      { label: 'Projects & Approvals', path: '/projects', icon: Landmark },
      { label: 'Reports', path: '/reports', icon: BarChart3 },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)
