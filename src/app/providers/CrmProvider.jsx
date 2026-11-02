import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CrmContext, DEFAULT_SETTINGS } from '../../core/permissions/crm'
import { api, SESSION_EXPIRED_EVENT } from '../../hrms/core/api/apiClient'
import { resetLocalData } from '../../hrms/core/storage/storage'

const SETTINGS_KEY = 'bansal-crm:settings'

/* The portal's view of the signed-in person, built from the server's profile. `id` is the employee ID. */
function toUser(profile) {
  if (!profile) return null
  return {
    accountId: profile.id,
    id: profile.employeeId,
    employeeId: profile.employeeId,
    name: profile.name,
    email: profile.email,
    title: profile.title,
    department: profile.department,
    phone: profile.phone,
    avatarUrl: profile.avatarUrl,
    mustChangePassword: profile.mustChangePassword,
    permissions: profile.permissions || [],
  }
}

/*
 * The session: who is signed in and with which role, as decided by the server. On load the stored token is
 * checked with /auth/me; an invalid or expired token sends the person back to the sign-in page.
 */
export function CrmProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState(() => (api.getToken() ? 'loading' : 'anonymous'))

  const [settings, setSettingsState] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const clearSession = useCallback(() => {
    api.setToken('')
    resetLocalData()
    setProfile(null)
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    if (!api.getToken()) return undefined
    let cancelled = false
    api
      .get('/auth/me')
      .then((res) => {
        if (cancelled) return
        setProfile(res.user)
        setStatus('authenticated')
      })
      .catch((err) => {
        if (cancelled) return
        // A network failure keeps the token so a page refresh can recover; a rejected token ends the session.
        if (err.status === 0) setStatus('offline')
        else clearSession()
      })
    return () => {
      cancelled = true
    }
  }, [clearSession])

  useEffect(() => {
    const onExpired = () => clearSession()
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [clearSession])

  const signIn = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    // Data cached by a previous user on this device must never be shown to the next one.
    resetLocalData()
    api.setToken(res.token)
    setProfile(res.user)
    setStatus('authenticated')
    return res.user
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Signing out locally is enough if the server can't be reached.
    }
    clearSession()
  }, [clearSession])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword })
    api.setToken(res.token)
    setProfile(res.user)
    return res.user
  }, [])

  const updateSettings = useCallback((updates) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...updates }
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      } catch {
        // Only a convenience.
      }
      return next
    })
  }, [])

  const user = useMemo(() => toUser(profile), [profile])

  const contextValue = useMemo(
    () => ({
      status,
      teamSignedIn: status === 'authenticated',
      role: profile?.role ?? null,
      user,
      signIn,
      signOut,
      changePassword,
      settings,
      updateSettings,
    }),
    [status, profile, user, signIn, signOut, changePassword, settings, updateSettings],
  )

  return <CrmContext.Provider value={contextValue}>{children}</CrmContext.Provider>
}

export default CrmProvider
