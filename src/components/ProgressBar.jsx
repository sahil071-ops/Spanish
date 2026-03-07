export default function ProgressBar({ value = 0, max = 100, label, color = 'bg-[#C60B1E]', className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-sm font-semibold text-gray-800">{pct}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
