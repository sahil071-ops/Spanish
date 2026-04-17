import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loadSeedContent } from '../utils/seedLoader.js'
import { generateDailyContent } from '../utils/anthropic.js'
import { getSettings, saveSettings, getProgress, getStreak, updateStreak, logActivity } from '../utils/storage.js'
import { getContentCount } from '../utils/db.js'
import { importAllTeacherContent } from '../utils/importTeacherContent.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [settings, setSettings] = useState(getSettings())
  const [progress, setProgress] = useState(getProgress())
  const [streak, setStreak] = useState(getStreak())
  const [contentCounts, setContentCounts] = useState({})
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'done' | 'error'
  const [updateAvailable, setUpdateAvailable] = useState(false)

  const refreshContentCounts = useCallback(async () => {
    const counts = await getContentCount()
    setContentCounts(counts)
  }, [])

  const refreshProgress = useCallback(() => {
    setProgress(getProgress())
    setStreak(getStreak())
  }, [])

  const syncContent = useCallback(async () => {
    if (!navigator.onLine || !settings.autoSync) return
    setSyncStatus('syncing')
    try {
      const newContent = await generateDailyContent()
      if (newContent) await refreshContentCounts()
      setSyncStatus('done')
    } catch {
      setSyncStatus('error')
    }
    setTimeout(() => setSyncStatus('idle'), 3000)
  }, [settings.autoSync, refreshContentCounts])

  // Initialize
  useEffect(() => {
    async function init() {
      await loadSeedContent()
      await refreshContentCounts()
      updateStreak()
      setStreak(getStreak())
      logActivity()
      await syncContent()

      // Silent first-run import of teacher chat content (non-blocking)
      try {
        const log = JSON.parse(localStorage.getItem('spanish-b1-import-log') || '{}')
        if (!log['teacher-chat-v1']) {
          importAllTeacherContent().then(() => refreshContentCounts()).catch(() => {})
        }
      } catch {}
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for SW update signal fired from main.jsx
  useEffect(() => {
    const handler = () => setUpdateAvailable(true)
    window.addEventListener('pwa-update-available', handler)
    return () => window.removeEventListener('pwa-update-available', handler)
  }, [])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      await syncContent()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncContent])

  const updateSettings = useCallback((newSettings) => {
    const merged = { ...settings, ...newSettings }
    saveSettings(merged)
    setSettings(merged)
  }, [settings])

  return (
    <AppContext.Provider value={{
      isOnline,
      settings,
      updateSettings,
      progress,
      refreshProgress,
      streak,
      contentCounts,
      refreshContentCounts,
      syncStatus,
      updateAvailable,
      setUpdateAvailable,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
