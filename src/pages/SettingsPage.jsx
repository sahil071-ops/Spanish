import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { useApp } from '../context/AppContext.jsx'
import { exportAllData, importAllData, resetAllProgress } from '../utils/storage.js'
import { getDB } from '../utils/db.js'
import { Eye, EyeOff, Download, Upload, Trash2, Key, ChevronDown, ChevronUp } from 'lucide-react'
import { CURRENT_VERSION, HISTORY } from '../version.js'
import TeacherImportButton from '../components/TeacherImportButton.jsx'

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-[#C60B1E]' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      <div className="divide-y divide-gray-50 px-5 pb-4 space-y-3">
        {children}
      </div>
    </div>
  )
}

function VersionHistory() {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-700">Version History</p>
          <p className="text-xs text-gray-400 mt-0.5">Current: {CURRENT_VERSION}</p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {HISTORY.map((entry, i) => (
            <div key={entry.version} className="px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  i === 0 ? 'bg-[#C60B1E] text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {entry.version}
                  {i === 0 && ' · latest'}
                </span>
                <span className="text-xs text-gray-400">{entry.date}</span>
              </div>
              <p className="text-xs font-medium text-gray-600 mb-2">{entry.summary}</p>
              <ul className="space-y-1">
                {entry.changes.map((c, ci) => (
                  <li key={ci} className="text-xs text-gray-500 flex gap-2">
                    <span className="text-gray-300 shrink-0">–</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { settings, updateSettings } = useApp()
  const [showKey, setShowKey] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [importStatus, setImportStatus] = useState('')

  const handleExport = async () => {
    const data = exportAllData()

    // Also export content from IndexedDB
    try {
      const db = await getDB()
      const content = await db.getAll('content')
      data.content = content
    } catch {}

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spanish-b1-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        importAllData(data)

        // Restore content library if present
        if (data.content && Array.isArray(data.content)) {
          const db = await getDB()
          const tx = db.transaction('content', 'readwrite')
          for (const item of data.content) {
            await tx.store.put(item)
          }
          await tx.done
        }

        setImportStatus('✓ Import successful! Refresh to see changes.')
      } catch {
        setImportStatus('✗ Import failed — invalid file format.')
      }
    }
    reader.readAsText(file)
  }

  const handleReset = () => {
    resetAllProgress()
    setShowResetConfirm(false)
    window.location.reload()
  }

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Settings" />

      <div className="px-4 max-w-lg mx-auto w-full pt-4 space-y-4">
        {/* Session */}
        <Section title="Session">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Default Session Length</p>
            <div className="flex gap-2">
              {[
                { value: '5-10', label: '5–10 min' },
                { value: '15-20', label: '15–20 min' },
                { value: '30-45', label: '30–45 min' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSettings({ sessionLength: value })}
                  className={`flex-1 py-2 rounded-xl text-sm border transition-all ${
                    settings.sessionLength === value
                      ? 'border-[#C60B1E] bg-red-50 text-[#C60B1E] font-semibold'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Voice */}
        <Section title="Audio & Voice">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Spanish Voice</p>
            <div className="flex gap-2">
              {['female', 'male'].map(v => (
                <button
                  key={v}
                  onClick={() => updateSettings({ voicePreference: v })}
                  className={`flex-1 py-2 rounded-xl text-sm border capitalize transition-all ${
                    settings.voicePreference === v
                      ? 'border-[#C60B1E] bg-red-50 text-[#C60B1E] font-semibold'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <Toggle
            checked={settings.showTranscript}
            onChange={v => updateSettings({ showTranscript: v })}
            label="Show transcript button"
            description="Display transcript toggle in listening exercises"
          />
        </Section>

        {/* Learning */}
        <Section title="Learning">
          <Toggle
            checked={settings.autoSync}
            onChange={v => updateSettings({ autoSync: v })}
            label="Auto-sync content"
            description="Generate new exercises when online"
          />
          <Toggle
            checked={settings.showHints}
            onChange={v => updateSettings({ showHints: v })}
            label="Show English hints"
            description="Display English translations and hints"
          />
        </Section>

        {/* API Keys */}
        <Section title="API Keys">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key size={14} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-700">ElevenLabs API Key</p>
            </div>
            <p className="text-xs text-gray-400 mb-2">Stored locally, only sent to ElevenLabs for audio generation</p>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.elevenLabsApiKey || ''}
                onChange={e => updateSettings({ elevenLabsApiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm pr-10 focus:outline-none focus:border-[#C60B1E]"
              />
              <button
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400">
              Anthropic API key is set via environment variable (VITE_ANTHROPIC_API_KEY). See README for setup.
            </p>
          </div>
        </Section>

        {/* Content Sources */}
        <Section title="Content Sources">
          <TeacherImportButton />
        </Section>

        {/* Data */}
        <Section title="Data">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 py-1"
          >
            <Download size={18} className="text-gray-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700">Export data</p>
              <p className="text-xs text-gray-400">Save all progress and content as JSON</p>
            </div>
          </button>

          <div>
            <label className="w-full flex items-center gap-3 py-1 cursor-pointer">
              <Upload size={18} className="text-gray-500" />
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-gray-700">Import data</p>
                <p className="text-xs text-gray-400">Restore from a backup JSON file</p>
              </div>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            {importStatus && (
              <p className={`text-xs mt-1 ${importStatus.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                {importStatus}
              </p>
            )}
          </div>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center gap-3 py-1"
            >
              <Trash2 size={18} className="text-red-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-red-500">Reset all progress</p>
                <p className="text-xs text-gray-400">Clears streaks, SRS data, and progress</p>
              </div>
            </button>
          ) : (
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-sm text-red-600 font-medium mb-2">Are you sure? This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={handleReset} className="flex-1 bg-red-500 text-white text-sm py-2 rounded-lg font-medium">
                  Yes, reset
                </button>
                <button onClick={() => setShowResetConfirm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Version history */}
        <VersionHistory />

        <p className="text-center text-xs text-gray-400 pb-2">Spanish B1 Prep · Fully offline capable</p>
      </div>
    </div>
  )
}
