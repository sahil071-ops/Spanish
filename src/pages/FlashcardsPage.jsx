import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import FlashCard from '../components/FlashCard.jsx'
import { getAllContent } from '../utils/db.js'
import { getDueItems, logActivity, updateStreak } from '../utils/storage.js'
import { useApp } from '../context/AppContext.jsx'

export default function FlashcardsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshProgress } = useApp()
  const isReviewMode = searchParams.get('mode') === 'review'

  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ known: 0, review: 0 })
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCards() {
      const allCards = await getAllContent('flashcard')
      let toShow = allCards

      if (isReviewMode) {
        const dueIds = getDueItems(allCards.map(c => c.id))
        toShow = allCards.filter(c => dueIds.includes(c.id))
      }

      // Shuffle
      const shuffled = [...toShow].sort(() => Math.random() - 0.5)
      setCards(shuffled.slice(0, 20))
      setLoading(false)
    }
    loadCards()
  }, [isReviewMode])

  const handleNext = (result) => {
    setSessionStats(prev => ({
      ...prev,
      [result]: prev[result] + 1,
    }))

    if (currentIndex + 1 >= cards.length) {
      setFinished(true)
      updateStreak()
      logActivity()
      refreshProgress()
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <TopBar title="Flashcards" onBack={() => navigate('/practice')} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="animate-spin w-8 h-8 border-2 border-[#C60B1E] border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (finished || cards.length === 0) {
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Flashcards" onBack={() => navigate('/practice')} />
        <div className="px-4 max-w-lg mx-auto w-full pt-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {cards.length === 0 ? 'No cards available' : 'Session complete!'}
          </h2>
          {cards.length > 0 && (
            <>
              <p className="text-gray-500 mb-8">You reviewed {cards.length} cards</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-green-50 rounded-2xl p-4">
                  <p className="text-3xl font-bold text-green-600">{sessionStats.known}</p>
                  <p className="text-sm text-gray-500">Got it</p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-4">
                  <p className="text-3xl font-bold text-amber-600">{sessionStats.review}</p>
                  <p className="text-sm text-gray-500">Review again</p>
                </div>
              </div>
            </>
          )}
          <button
            onClick={() => navigate('/practice')}
            className="w-full bg-[#C60B1E] text-white font-semibold py-3.5 rounded-2xl"
          >
            Back to Practice
          </button>
        </div>
      </div>
    )
  }

  const card = cards[currentIndex]

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Flashcards" onBack={() => navigate('/practice')} />

      <div className="px-4 max-w-lg mx-auto w-full pt-4 space-y-4">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C60B1E] rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / cards.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 shrink-0">{currentIndex + 1}/{cards.length}</span>
        </div>

        <FlashCard key={card.id} card={card} onNext={handleNext} />
      </div>
    </div>
  )
}
