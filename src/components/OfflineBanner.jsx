import { useApp } from '../context/AppContext.jsx'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const { isOnline } = useApp()
  if (isOnline) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="max-w-lg mx-auto flex items-center gap-2 text-amber-700 text-xs">
        <WifiOff size={14} />
        <span>Offline mode — using cached content and offline voice</span>
      </div>
    </div>
  )
}
