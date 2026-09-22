import { BarChart3, Building2, CalendarDays, ClipboardCheck, FileSignature, FileText, FolderKanban, Gauge, Home, ListTodo, ShieldCheck, UserRound, Users, UsersRound } from 'lucide-react'

/* Two workspaces in one app: sales (CRM) and project delivery (ERM). Each role sees only what it can open; `only` limits an item to the roles it is for. */
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
      { label: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'ERM Workspace',
    items: [
      { label: 'ERM Dashboard', path: '/erm', icon: Gauge },
      { label: 'Projects', path: '/projects', icon: FolderKanban },
      { label: 'Tasks', path: '/tasks', icon: ListTodo },
      { label: 'My Tasks', path: '/my-tasks', icon: ClipboardCheck, only: ['Field Member'] },
      { label: 'Team', path: '/team', icon: UsersRound },
      { label: 'Subcontracts', path: '/subcontracts', icon: FileSignature },
    ],
  },
]

/* Settings lives in the profile menu; it is listed here so the page still gets its title. */
export const NAV_ITEMS = [...NAV_GROUPS.flatMap((group) => group.items), { label: 'Settings', path: '/settings' }]
