import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, BookOpen, Brain, Headphones, FileText, ChevronRight, Zap } from 'lucide-react'
import TopBar from '../components/TopBar.jsx'
import OfflineBanner from '../components/OfflineBanner.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { useApp } from '../context/AppContext.jsx'
import { getAllContent } from '../utils/db.js'
import { getDueItems, getSRSData, getMasteryPercent } from '../utils/storage.js'

export default function HomePage() {
  const navigate = useNavigate()
  const { streak, progress, contentCounts } = useApp()
  const [dueItems, setDueItems] = useState([])
  const [masteryData, setMasteryData] = useState({ vocabulary: 0, grammar: 0, reading: 0, listening: 0 })

  useEffect(() => {
    async function loadDueItems() {
      const [flashcards, grammar] = await Promise.all([
        getAllContent('flashcard'),
        getAllContent('grammar'),
      ])
      const allIds = [...flashcards.map(f => f.id), ...grammar.map(g => g.id)]
      const due = getDueItems(allIds)
      setDueItems(due.slice(0, 5))

      // Mastery percentages
      setMasteryData({
        vocabulary: getMasteryPercent(flashcards.map(f => f.id)),
        grammar: getMasteryPercent(grammar.map(g => g.id)),
        reading: 0,
        listening: 0,
      })
    }
    loadDueItems()
  }, [])

  const skillCards = [
    { label: 'Vocabulary', icon: BookOpen, path: '/practice/flashcards', color: 'bg-blue-50 text-blue-600', pct: masteryData.vocabulary },
    { label: 'Grammar', icon: Brain, path: '/practice/grammar', color: 'bg-purple-50 text-purple-600', pct: masteryData.grammar },
    { label: 'Reading', icon: FileText, path: '/practice/reading', color: 'bg-green-50 text-green-600', pct: masteryData.reading },
    { label: 'Listening', icon: Headphones, path: '/practice/listening', color: 'bg-orange-50 text-orange-600', pct: masteryData.listening },
  ]

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Spanish B1" />
      <OfflineBanner />

      <div className="px-4 max-w-lg mx-auto w-full space-y-5 pt-4">
        {/* Streak */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
            <Flame size={28} className="text-orange-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{streak.current || 0}</p>
            <p className="text-sm text-gray-500">day streak{streak.current !== 1 ? 's' : ''}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-medium text-gray-700">{streak.longest || 0} best</p>
            <p className="text-xs text-gray-400">all time</p>
          </div>
        </div>

        {/* Due for review */}
        {dueItems.length > 0 && (
          <div className="bg-[#C60B1E] rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={18} />
              <h2 className="font-semibold">Due for Review</h2>
            </div>
            <p className="text-sm text-red-100 mb-4">
              {dueItems.length} item{dueItems.length !== 1 ? 's' : ''} waiting
            </p>
            <button
              onClick={() => navigate('/practice/flashcards?mode=review')}
              className="w-full bg-white text-[#C60B1E] font-semibold py-2.5 rounded-xl text-sm active:opacity-90 transition-opacity"
            >
              Start Review Session
            </button>
          </div>
        )}

        {/* Skill cards */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Skills</h2>
          <div className="grid grid-cols-2 gap-3">
            {skillCards.map(({ label, icon: Icon, path, color, pct }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="bg-white rounded-2xl border border-gray-100 p-4 text-left active:scale-98 transition-transform"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={18} />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{label}</p>
                <ProgressBar value={pct} max={100} />
                <p className="text-xs text-gray-400 mt-1">{pct}% mastered</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content library */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Content Library</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Flashcards', count: contentCounts.flashcard || 0 },
              { label: 'Grammar', count: contentCounts.grammar || 0 },
              { label: 'Reading', count: contentCounts.reading || 0 },
              { label: 'Listening', count: contentCounts.listening || 0 },
            ].map(({ label, count }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick start mock exam */}
        <button
          onClick={() => navigate('/practice/mock-exam')}
          className="w-full bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 active:scale-99 transition-transform"
        >
          <div className="w-11 h-11 bg-[#C60B1E] bg-opacity-10 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-[#C60B1E]" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-gray-800">Mock Exam</p>
            <p className="text-xs text-gray-400">Full B1 simulation test</p>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
      </div>
    </div>
  )
}
