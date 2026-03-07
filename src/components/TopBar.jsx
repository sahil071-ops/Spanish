import { useApp } from '../context/AppContext.jsx'
import { RefreshCw } from 'lucide-react'

export default function TopBar({ title, onBack }) {
  const { isOnline, syncStatus } = useApp()

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto gap-3">
        {onBack && (
          <button onClick={onBack} className="text-gray-500 hover:text-gray-800 p-1 -ml-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
        )}
        <h1 className="font-semibold text-gray-900 flex-1 truncate">{title}</h1>
        <div className="flex items-center gap-1.5">
          {syncStatus === 'syncing' && (
            <RefreshCw size={14} className="text-[#C60B1E] animate-spin" />
          )}
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
            title={isOnline ? 'Online' : 'Offline'}
          />
        </div>
      </div>
    </header>
  )
}
