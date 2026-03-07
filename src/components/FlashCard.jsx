import { useState } from 'react'
import { updateSRSItem } from '../utils/storage.js'
import { Check, X, RotateCcw } from 'lucide-react'

export default function FlashCard({ card, onNext }) {
  const [flipped, setFlipped] = useState(false)
  const [result, setResult] = useState(null) // 'known' | 'review'

  const handleFlip = () => setFlipped(f => !f)

  const handleKnown = () => {
    updateSRSItem(card.id, 5)
    setResult('known')
    setTimeout(() => {
      setFlipped(false)
      setResult(null)
      onNext?.('known')
    }, 500)
  }

  const handleReview = () => {
    updateSRSItem(card.id, 1)
    setResult('review')
    setTimeout(() => {
      setFlipped(false)
      setResult(null)
      onNext?.('review')
    }, 500)
  }

  const themeColors = {
    travel: 'bg-blue-50 text-blue-600',
    work: 'bg-purple-50 text-purple-600',
    everyday: 'bg-green-50 text-green-600',
    culture: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Theme badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${themeColors[card.theme] || 'bg-gray-50 text-gray-500'}`}>
          {card.theme}
        </span>
        <span className="text-xs text-gray-400">
          {'★'.repeat(card.difficulty || 1)}{'☆'.repeat(3 - (card.difficulty || 1))}
        </span>
      </div>

      {/* Card */}
      <div
        className={`card-flip cursor-pointer select-none`}
        style={{ height: '280px' }}
        onClick={handleFlip}
      >
        <div className={`card-flip-inner ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="card-front bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-8 text-center">
            <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">Spanish</p>
            <p className="text-3xl font-bold text-gray-900 mb-3">{card.front}</p>
            <p className="text-sm text-gray-400 mt-4">Tap to reveal</p>
          </div>

          {/* Back */}
          <div className="card-back bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-8 text-center">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">English</p>
            <p className="text-2xl font-bold text-gray-900 mb-4">{card.back}</p>
            {card.example && (
              <div className="mt-2 pt-4 border-t border-gray-100 w-full">
                <p className="text-xs text-gray-400 mb-1">Example</p>
                <p className="text-sm text-gray-600 italic">"{card.example}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons (only shown when flipped) */}
      {flipped && !result && (
        <div className="flex gap-3 animate-fade-in">
          <button
            onClick={handleReview}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium active:scale-98 transition-all"
          >
            <X size={18} />
            Needs Review
          </button>
          <button
            onClick={handleKnown}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#C60B1E] text-white font-medium active:scale-98 transition-all shadow-sm"
          >
            <Check size={18} />
            Got It
          </button>
        </div>
      )}

      {result && (
        <div className={`text-center py-3 rounded-2xl font-medium animate-fade-in ${
          result === 'known' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {result === 'known' ? '✓ Marked as known' : '↻ Added to review queue'}
        </div>
      )}

      {!flipped && (
        <button
          onClick={handleFlip}
          className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500"
        >
          <RotateCcw size={14} />
          Tap card to flip
        </button>
      )}
    </div>
  )
}
