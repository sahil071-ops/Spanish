import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import FlashCard from '../components/FlashCard.jsx'
import { getAllContent } from '../utils/db.js'
import { getDueItems, getSRSData, logActivity, updateStreak } from '../utils/storage.js'
import { useApp } from '../context/AppContext.jsx'

export default function FlashcardsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshProgress } = useApp()
  const isReviewMode = searchParams.get('mode') === 'review'

  const NEW_CARDS_PER_SESSION = 10

  const [cards, setCards] = useState([])
  const [srsMap, setSrsMap] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ known: 0, review: 0 })
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [nextDueDate, setNextDueDate] = useState(null)
  const [dueCount, setDueCount] = useState(0)
  const [newCount, setNewCount] = useState(0)

  useEffect(() => {
    async function loadCards() {
      const allCards = await getAllContent('flashcard')
      const srs = getSRSData()
      setSrsMap(srs)

      let toShow

      if (isReviewMode) {
        // Review mode: all cards due for SRS review
        const dueIds = getDueItems(allCards.map(c => c.id))
        toShow = allCards.filter(c => dueIds.includes(c.id))
      } else {
        const now = Date.now()
        // Cards due for review: previously seen, interval has expired, not yet mastered
        const dueForReview = allCards.filter(c => {
          const item = srs[c.id]
          return item && item.nextReview <= now && item.repetitions < 3
        })
        // New cards: never seen before
        const newCards = allCards.filter(c => !srs[c.id])
        const shuffledNew = [...newCards].sort(() => Math.random() - 0.5)
        const newBatch = shuffledNew.slice(0, NEW_CARDS_PER_SESSION)

        setDueCount(dueForReview.length)
        setNewCount(newCards.length)

        toShow = [...dueForReview, ...newBatch]

        if (toShow.length === 0) {
          // Nothing due — find when next card becomes due
          const scheduled = allCards
            .map(c => srs[c.id])
            .filter(item => item && item.repetitions < 3 && item.nextReview > now)
          if (scheduled.length > 0) {
            const earliest = Math.min(...scheduled.map(i => i.nextReview))
            setNextDueDate(new Date(earliest))
          }
        }
      }

      const shuffled = [...toShow].sort(() => Math.random() - 0.5)
      setCards(shuffled.slice(0, 30))
      setLoading(false)
    }
    loadCards()
  }, [isReviewMode])

  const handleNext = (result) => {
    // Refresh SRS map so the next card gets updated dots
    setSrsMap(getSRSData())
    setSessionStats(prev => ({ ...prev, [result]: prev[result] + 1 }))

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

  if (!loading && cards.length === 0 && !isReviewMode) {
    // Nothing due today — show next due time
    const formatDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Flashcards" onBack={() => navigate('/practice')} />
        <div className="px-4 max-w-lg mx-auto w-full pt-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
          <p className="text-gray-500 mb-4">
            You've reviewed all your due cards for now. New cards will appear daily (up to {NEW_CARDS_PER_SESSION} per session).
          </p>
          {nextDueDate && (
            <div className="bg-amber-50 rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-amber-700">Next review due</p>
              <p className="text-sm text-amber-600">{formatDate(nextDueDate)}</p>
            </div>
          )}
          <button onClick={() => navigate('/practice')} className="w-full bg-[#C60B1E] text-white font-semibold py-3.5 rounded-2xl">
            Back to Practice
          </button>
        </div>
      </div>
    )
  }

  if (finished || cards.length === 0) {
    const total = sessionStats.known + sessionStats.review
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Flashcards" onBack={() => navigate('/practice')} />
        <div className="px-4 max-w-lg mx-auto w-full pt-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session complete!</h2>
          {total > 0 && (
            <>
              <p className="text-gray-500 mb-8">You reviewed {total} cards</p>
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

        <FlashCard key={card.id} card={card} onNext={handleNext} srsData={srsMap[card.id]} />
      </div>
    </div>
  )
}
