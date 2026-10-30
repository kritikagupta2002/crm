import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CrmContext, DEFAULT_SETTINGS, ROLE_ACCESS, ROLE_USERS } from '../../core/permissions/crm'
import { FIELD_MEMBERS } from '../../core/constants/staff'
import { api } from '../../hrms/core/api/apiClient'

const ROLE_KEY = 'bansal-crm:role'
const FIELD_KEY = 'bansal-crm:field-member'
const SESSION_KEY = 'bansal-crm:session'
const SETTINGS_KEY = 'bansal-crm:settings'

// Default equipment & field assets allocated to Bansal Geo team members
const INITIAL_ASSETS = [
  { id: 'asg-1', itemName: 'Leica TS07 Total Station', itemCode: 'EQ-SRV-001', category: 'Survey Equipment', serialNumber: 'SN-TS-98214', condition: 'Good', assignedDate: '2025-10-15', status: 'Assigned', employeeId: 'BGS/04', employeeName: 'Vikas Verma' },
  { id: 'asg-2', itemName: 'Garmin GPSMAP 66sr Handheld GPS', itemCode: 'EQ-GPS-004', category: 'GPS & Navigation', serialNumber: 'SN-GM-44102', condition: 'Excellent', assignedDate: '2025-11-01', status: 'Assigned', employeeId: 'BGS/05', employeeName: 'Kuldip Singh' },
  { id: 'asg-3', itemName: 'Geological Pick Hammer & Lens Kit', itemCode: 'EQ-GEO-008', category: 'Geology Tools', serialNumber: 'SN-GH-1092', condition: 'Good', assignedDate: '2025-09-20', status: 'Assigned', employeeId: 'BGS/09', employeeName: 'Balveer Singh Yadav' },
  { id: 'asg-4', itemName: 'Trimble R12i GNSS Rover Receiver', itemCode: 'EQ-SRV-005', category: 'Survey Equipment', serialNumber: 'SN-TR-88129', condition: 'Excellent', assignedDate: '2025-12-05', status: 'Assigned', employeeId: 'BGS/10', employeeName: 'Vishal Kumawat' },
  { id: 'asg-5', itemName: 'Automatic Optical Level Kit 32X', itemCode: 'EQ-SRV-009', category: 'Survey Equipment', serialNumber: 'SN-AL-33120', condition: 'Good', assignedDate: '2026-01-08', status: 'Assigned', employeeId: 'BGS/11', employeeName: 'Pradeep Chand' },
  { id: 'asg-6', itemName: 'Dell Precision 7760 GIS Workstation', itemCode: 'IT-WS-002', category: 'Computing Hardware', serialNumber: 'SN-DL-99214', condition: 'Excellent', assignedDate: '2025-08-10', status: 'Assigned', employeeId: 'BGS/12', employeeName: 'Madhurika Saini' },
]

export function CrmProvider({ children }) {
  // 1. Role State
  const [role, setRoleState] = useState(() => {
    try {
      const saved = localStorage.getItem(ROLE_KEY)
      return saved && ROLE_ACCESS[saved] ? saved : 'Managing Director'
    } catch {
      return 'Managing Director'
    }
  })

  // 2. Field Member State (when Role === 'Employee')
  const [fieldMember, setFieldMemberState] = useState(() => {
    try {
      const saved = localStorage.getItem(FIELD_KEY)
      return FIELD_MEMBERS.some((m) => m.name === saved) ? saved : FIELD_MEMBERS[0]?.name || 'Vikas Verma'
    } catch {
      return FIELD_MEMBERS[0]?.name || 'Vikas Verma'
    }
  })

  // 3. Team Session
  const [teamSignedIn, setTeamSignedIn] = useState(() => {
    try {
      return localStorage.getItem(SESSION_KEY) === 'true'
    } catch {
      return true
    }
  })

  // 4. Company & System Settings
  const [settings, setSettingsState] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const [changeCount, setChangeCount] = useState(0)

  // Persist role changes
  const setRole = useCallback((newRole) => {
    setRoleState(newRole)
    try {
      localStorage.setItem(ROLE_KEY, newRole)
    } catch (e) {
      console.error(e)
    }
    setChangeCount((c) => c + 1)
  }, [])

  // Persist field member changes
  const setFieldMember = useCallback((memberName) => {
    setFieldMemberState(memberName)
    try {
      localStorage.setItem(FIELD_KEY, memberName)
    } catch (e) {
      console.error(e)
    }
    setChangeCount((c) => c + 1)
  }, [])

  // Update Settings
  const updateSettings = useCallback((updates) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...updates }
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      } catch (e) {
        console.error(e)
      }
      return next
    })
    setChangeCount((c) => c + 1)
  }, [])

  // Sign in handler
  const signIn = useCallback((targetRole = 'Managing Director', memberName) => {
    const validRole = ROLE_ACCESS[targetRole] ? targetRole : 'Managing Director'
    setRole(validRole)
    if (memberName) {
      setFieldMember(memberName)
    }
    setTeamSignedIn(true)
    try {
      localStorage.setItem(SESSION_KEY, 'true')
    } catch (e) {
      console.error(e)
    }
    setChangeCount((c) => c + 1)
  }, [setRole, setFieldMember])

  // Sign out handler
  const signOut = useCallback(() => {
    setTeamSignedIn(false)
    try {
      localStorage.removeItem(SESSION_KEY)
      api.setToken('')
    } catch (e) {
      console.error(e)
    }
    setChangeCount((c) => c + 1)
    window.location.href = '/login'
  }, [])

  // Reset demo data handler
  const resetDemoData = useCallback(() => {
    try {
      localStorage.clear()
    } catch (e) {
      console.error(e)
    }
    window.location.reload()
  }, [])

  // Active User object
  const user = useMemo(() => {
    if (role === 'Employee') {
      const member = FIELD_MEMBERS.find((m) => m.name === fieldMember) || FIELD_MEMBERS[0]
      return {
        name: member?.name || 'Vikas Verma',
        title: member?.title || 'Surveyor',
        email: member?.email || 'vikas.verma@bansalgeo.com',
        id: member?.id || 'BGS/04',
        employeeId: member?.id || 'BGS/04',
        phone: member?.phone || '',
        department: member?.department || 'Mining & Survey',
      }
    }
    const defaultUser = ROLE_USERS[role] || ROLE_USERS['Managing Director']
    return {
      ...defaultUser,
      employeeId: defaultUser.id,
    }
  }, [role, fieldMember])

  const contextValue = useMemo(() => ({
    role,
    setRole,
    fieldMember,
    setFieldMember,
    user,
    teamSignedIn,
    signIn,
    signOut,
    settings,
    updateSettings,
    resetDemoData,
    changeCount,
    inventoryAssignments: INITIAL_ASSETS,
    leads: [],
    activities: [],
    outbox: [],
  }), [role, setRole, fieldMember, setFieldMember, user, teamSignedIn, signIn, signOut, settings, updateSettings, resetDemoData, changeCount])

  return (
    <CrmContext.Provider value={contextValue}>
      {children}
    </CrmContext.Provider>
  )
}

export default CrmProvider
