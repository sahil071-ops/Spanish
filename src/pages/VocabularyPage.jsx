import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { getAllContent } from '../utils/db.js'
import { getSRSData, getCapturedWords, removeCapturedWord } from '../utils/storage.js'
import { Search, CheckCircle, Circle, Clock, BookOpen, Trash2 } from 'lucide-react'

const THEME_COLORS = {
  travel: 'bg-blue-50 text-blue-600',
  work: 'bg-purple-50 text-purple-600',
  everyday: 'bg-green-50 text-green-600',
  culture: 'bg-orange-50 text-orange-600',
}

function formatNextReview(ts) {
  if (!ts) return null
  const diff = ts - Date.now()
  if (diff <= 0) return 'Due now'
  const days = Math.ceil(diff / 86400000)
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

function MasteryDots({ reps }) {
  const dots = Math.min(reps, 3)
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${i < dots ? 'bg-[#C60B1E]' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

export default function VocabularyPage() {
  const navigate = useNavigate()
  const [cards, setCards] = useState([])
  const [srs, setSrs] = useState({})
  const [query, setQuery] = useState('')
  const [filterTheme, setFilterTheme] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'mastered' | 'learning' | 'new'
  const [loading, setLoading] = useState(true)
  const [capturedWords, setCapturedWords] = useState([])
  const [showCaptured, setShowCaptured] = useState(false)

  useEffect(() => {
    async function load() {
      const all = await getAllContent('flashcard')
      const srsData = getSRSData()
      all.sort((a, b) => a.front.localeCompare(b.front, 'es'))
      setCards(all)
      setSrs(srsData)
      setCapturedWords(getCapturedWords())
      setLoading(false)
    }
    load()
  }, [])

  const handleRemoveCaptured = (word) => {
    removeCapturedWord(word)
    setCapturedWords(getCapturedWords())
  }

  const themes = useMemo(() => {
    const set = new Set(cards.map(c => c.theme).filter(Boolean))
    return Array.from(set).sort()
  }, [cards])

  const filtered = useMemo(() => {
    return cards.filter(c => {
      // Search
      if (query) {
        const q = query.toLowerCase()
        if (!c.front.toLowerCase().includes(q) && !c.back.toLowerCase().includes(q)) return false
      }
      // Theme filter
      if (filterTheme !== 'all' && c.theme !== filterTheme) return false
      // Status filter
      if (filterStatus !== 'all') {
        const item = srs[c.id]
        const reps = item?.repetitions ?? 0
        if (filterStatus === 'mastered' && reps < 3) return false
        if (filterStatus === 'learning' && (reps === 0 || reps >= 3)) return false
        if (filterStatus === 'new' && reps > 0) return false
      }
      return true
    })
  }, [cards, query, filterTheme, filterStatus, srs])

  // Stats
  const stats = useMemo(() => {
    const total = cards.length
    const mastered = cards.filter(c => (srs[c.id]?.repetitions ?? 0) >= 3).length
    const learning = cards.filter(c => {
      const r = srs[c.id]?.repetitions ?? 0
      return r > 0 && r < 3
    }).length
    return { total, mastered, learning, newCount: total - mastered - learning }
  }, [cards, srs])

  if (loading) {
    return (
      <div className="flex flex-col">
        <TopBar title="Vocabulary" onBack={() => navigate('/practice')} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="animate-spin w-8 h-8 border-2 border-[#C60B1E] border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Vocabulary" onBack={() => navigate('/practice')} />

      <div className="px-4 max-w-lg mx-auto w-full pt-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Mastered', value: stats.mastered, color: 'text-[#C60B1E]' },
            { label: 'Learning', value: stats.learning, color: 'text-amber-600' },
            { label: 'New', value: stats.newCount, color: 'text-gray-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Spanish or English…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C60B1E]"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {/* Status */}
          {[
            { value: 'all', label: 'All' },
            { value: 'new', label: 'New' },
            { value: 'learning', label: 'Learning' },
            { value: 'mastered', label: 'Mastered' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterStatus === value
                  ? 'bg-[#C60B1E] text-white border-[#C60B1E]'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="w-px bg-gray-200 shrink-0 my-1" />
          {/* Themes */}
          {themes.map(theme => (
            <button
              key={theme}
              onClick={() => setFilterTheme(filterTheme === theme ? 'all' : theme)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
                filterTheme === theme
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>

        {/* My Captured Words */}
        {capturedWords.length > 0 && (
          <div className="bg-amber-50 rounded-2xl border border-amber-100 overflow-hidden">
            <button
              onClick={() => setShowCaptured(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">My Captured Words</span>
                <span className="bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full">{capturedWords.length}</span>
              </div>
              <span className="text-xs text-amber-600">{showCaptured ? 'Hide' : 'Show'}</span>
            </button>
            {showCaptured && (
              <div className="px-4 pb-4 space-y-2">
                {capturedWords.map(w => (
                  <div key={w.word} className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{w.word}</p>
                      <p className="text-xs text-gray-500">{w.english}{w.pos ? ` · ${w.pos}` : ''}</p>
                      {w.example && <p className="text-xs text-gray-400 italic mt-0.5 truncate">"{w.example}"</p>}
                    </div>
                    <button
                      onClick={() => handleRemoveCaptured(w.word)}
                      className="shrink-0 p-1 text-gray-300 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Count */}
        <p className="text-xs text-gray-400">{filtered.length} word{filtered.length !== 1 ? 's' : ''}</p>

        {/* Word list */}
        <div className="space-y-2">
          {filtered.map(card => {
            const item = srs[card.id]
            const reps = item?.repetitions ?? 0
            const mastered = reps >= 3
            const nextReview = formatNextReview(item?.nextReview)

            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3"
              >
                {/* Mastery icon */}
                <div className="shrink-0">
                  {mastered
                    ? <CheckCircle size={18} className="text-[#C60B1E]" />
                    : reps > 0
                    ? <Clock size={18} className="text-amber-400" />
                    : <Circle size={18} className="text-gray-300" />
                  }
                </div>

                {/* Words */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{card.front}</p>
                  <p className="text-xs text-gray-500 truncate">{card.back}</p>
                </div>

                {/* Right side */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <MasteryDots reps={reps} />
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${THEME_COLORS[card.theme] || 'bg-gray-50 text-gray-500'}`}>
                      {card.theme}
                    </span>
                  </div>
                  {nextReview && (
                    <p className="text-xs text-gray-400">{nextReview}</p>
                  )}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No words match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
