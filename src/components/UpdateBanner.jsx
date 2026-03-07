import { useApp } from '../context/AppContext.jsx'
import { X, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function UpdateBanner() {
  const { updateAvailable, setUpdateAvailable } = useApp()
  const [dismissed, setDismissed] = useState(false)

  if (!updateAvailable || dismissed) return null

  const handleReloadNow = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      })
    }
    window.location.reload()
  }

  return (
    <div className="fixed top-14 left-0 right-0 z-50 px-4 pt-2">
      <div className="max-w-lg mx-auto bg-gray-900 text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg animate-fade-in">
        <RefreshCw size={16} className="text-green-400 shrink-0" />
        <p className="text-sm flex-1">App updated — changes will apply on next launch.</p>
        <button
          onClick={handleReloadNow}
          className="text-sm font-medium text-[#C60B1E] shrink-0 hover:opacity-80"
        >
          Reload now
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-white p-0.5"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
