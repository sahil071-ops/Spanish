import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { useApp } from '../context/AppContext.jsx'
import { getActivityData, getSRSData, getWeakTopics, getTopicPerformance } from '../utils/storage.js'
import { generateFreshDrill } from '../utils/anthropic.js'
import { getAllContent } from '../utils/db.js'
import { BookOpen, Brain, FileText, Headphones, Flame, Calendar, AlertTriangle, ChevronRight, Zap, X, ArrowUpDown, CheckCircle } from 'lucide-react'

function ActivityHeatmap() {
  const activity = getActivityData()
  const days = []
  for (let i = 89; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000)
    const key = date.toISOString().split('T')[0]
    days.push({ date: key, count: activity[key] || 0, day: date.getDay() })
  }

  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const getColor = (count) => {
    if (count === 0) return 'bg-gray-100'
    if (count === 1) return 'bg-red-200'
    if (count <= 3) return 'bg-red-300'
    return 'bg-[#C60B1E]'
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-3.5 h-3.5 rounded-sm ${getColor(day.count)}`}
                title={`${day.date}: ${day.count} sessions`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ accuracy, total }) {
  if (total === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Untested</span>
  if (accuracy >= 85) return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Strong</span>
  if (accuracy >= 60) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">OK</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Weak</span>
}

function TopicDetailModal({ topic, data, onClose, onDrill, onNavigate }) {
  const [drilling, setDrilling] = useState(false)

  const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0

  const handleDrill = async () => {
    setDrilling(true)
    try {
      await onDrill(topic)
    } finally {
      setDrilling(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg mx-auto p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-gray-900 text-base flex-1">{topic}</h3>
          <button onClick={onClose} className="shrink-0 p-1 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-gray-900">{accuracy}%</p>
            <p className="text-xs text-gray-400">Accuracy</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-gray-900">{data.correct}</p>
            <p className="text-xs text-gray-400">Correct</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-gray-900">{data.total}</p>
            <p className="text-xs text-gray-400">Attempts</p>
          </div>
        </div>

        {data.lastSeen && (
          <p className="text-xs text-gray-400">
            Last practised: {new Date(data.lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}

        <button
          onClick={() => { onNavigate(topic); onClose() }}
          className="w-full bg-[#C60B1E] text-white font-semibold py-3 rounded-2xl"
        >
          Practise This Topic
        </button>

        <button
          onClick={handleDrill}
          disabled={drilling}
          className="w-full bg-amber-500 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {drilling ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap size={18} />}
          {drilling ? 'Generating…' : 'Fresh Drill (5 AI questions)'}
        </button>
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const navigate = useNavigate()
  const { streak, contentCounts } = useApp()
  const [masteryData, setMasteryData] = useState({})
  const [weakTopics, setWeakTopics] = useState([])
  const [allTopics, setAllTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('accuracy') // 'accuracy' | 'attempts' | 'name'
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [drillExercises, setDrillExercises] = useState(null)
  const [drillTopic, setDrillTopic] = useState(null)

  useEffect(() => {
    async function load() {
      const [flashcards, grammar, reading, listening] = await Promise.all([
        getAllContent('flashcard'),
        getAllContent('grammar'),
        getAllContent('reading'),
        getAllContent('listening'),
      ])

      const srs = getSRSData()

      const calcMastery = (items) => {
        if (!items.length) return { mastered: 0, total: items.length, pct: 0 }
        const mastered = items.filter(item => {
          const s = srs[item.id]
          return s && s.repetitions >= 3 && s.ef >= 2.0
        }).length
        return { mastered, total: items.length, pct: Math.round((mastered / items.length) * 100) }
      }

      setMasteryData({
        vocabulary: calcMastery(flashcards),
        grammar: calcMastery(grammar),
        reading: calcMastery(reading),
        listening: calcMastery(listening),
      })

      // Build full topic list from both seed data and performance data
      const topicPerf = getTopicPerformance()
      const grammarTopics = [...new Set(grammar.map(g => g.grammarPoint).filter(Boolean))]
      const allTopicNames = [...new Set([...grammarTopics, ...Object.keys(topicPerf)])]

      const topics = allTopicNames.map(topic => {
        const perf = topicPerf[topic] || { correct: 0, total: 0, lastSeen: null }
        const accuracy = perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0
        return { topic, accuracy, correct: perf.correct, total: perf.total, lastSeen: perf.lastSeen }
      })

      setAllTopics(topics)
      setWeakTopics(getWeakTopics(1).slice(0, 8))
      setLoading(false)
    }
    load()
  }, [])

  const sortedTopics = [...allTopics].sort((a, b) => {
    if (sortBy === 'accuracy') {
      if (a.total === 0 && b.total === 0) return a.topic.localeCompare(b.topic)
      if (a.total === 0) return 1
      if (b.total === 0) return -1
      return a.accuracy - b.accuracy
    }
    if (sortBy === 'attempts') return b.total - a.total
    return a.topic.localeCompare(b.topic)
  })

  const strongTopics = allTopics.filter(t => t.total >= 3 && t.accuracy >= 85)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5)

  const skills = [
    { key: 'vocabulary', label: 'Vocabulary', icon: BookOpen, color: 'text-blue-600' },
    { key: 'grammar', label: 'Grammar', icon: Brain, color: 'text-purple-600' },
    { key: 'reading', label: 'Reading', icon: FileText, color: 'text-green-600' },
    { key: 'listening', label: 'Listening', icon: Headphones, color: 'text-orange-600' },
  ]

  const handleDrillFromModal = async (topic) => {
    const exercises = await generateFreshDrill(topic)
    if (exercises.length > 0) {
      setDrillExercises(exercises)
      setDrillTopic(topic)
      setSelectedTopic(null)
      navigate(`/practice/grammar?topic=${encodeURIComponent(topic)}`)
    }
  }

  const selectedTopicData = selectedTopic
    ? (allTopics.find(t => t.topic === selectedTopic) || { correct: 0, total: 0 })
    : null

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Progress" />

      <div className="px-4 max-w-lg mx-auto w-full pt-4 space-y-5">
        {/* Streak */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <Flame size={20} className="text-orange-500" />
            <h2 className="font-semibold text-gray-800">Streak</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{streak.current || 0}</p>
              <p className="text-xs text-gray-400">Current</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{streak.longest || 0}</p>
              <p className="text-xs text-gray-400">Best</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{streak.history?.length || 0}</p>
              <p className="text-xs text-gray-400">Total days</p>
            </div>
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={20} className="text-gray-500" />
            <h2 className="font-semibold text-gray-800">Activity (90 days)</h2>
          </div>
          <ActivityHeatmap />
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-400">Less</span>
            {['bg-gray-100', 'bg-red-200', 'bg-red-300', 'bg-[#C60B1E]'].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span className="text-xs text-gray-400">More</span>
          </div>
        </div>

        {/* Skills mastery */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Skill Mastery</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {skills.map(({ key, label, icon: Icon, color }) => {
                const data = masteryData[key] || { mastered: 0, total: 0, pct: 0 }
                return (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={16} className={color} />
                      <span className="text-sm text-gray-600 flex-1">{label}</span>
                      <span className="text-sm font-semibold text-gray-800">{data.pct}%</span>
                    </div>
                    <ProgressBar value={data.pct} max={100} />
                    <p className="text-xs text-gray-400 mt-1">{data.mastered}/{data.total} mastered</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Diagnostic CTA */}
        <button
          onClick={() => navigate('/practice/diagnostic')}
          className="w-full bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4 active:scale-99 transition-transform"
        >
          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Zap size={20} className="text-amber-600" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-gray-800">Grammar Diagnostic</p>
            <p className="text-xs text-gray-500 mt-0.5">Test yourself across all topics to find gaps</p>
          </div>
          <ChevronRight size={18} className="text-gray-300 shrink-0" />
        </button>

        {/* Strengths */}
        {strongTopics.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} className="text-green-600" />
              <h2 className="font-semibold text-gray-800">Strengths</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {strongTopics.map(({ topic, accuracy }) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full border border-green-200"
                >
                  {topic} · {accuracy}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full Grammar Topic Mastery Table */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-purple-600" />
              <h2 className="font-semibold text-gray-800">Grammar Topics</h2>
            </div>
            <button
              onClick={() => setSortBy(s => s === 'accuracy' ? 'attempts' : s === 'attempts' ? 'name' : 'accuracy')}
              className="flex items-center gap-1 text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded-full"
            >
              <ArrowUpDown size={11} />
              {sortBy === 'accuracy' ? 'By accuracy' : sortBy === 'attempts' ? 'By attempts' : 'A–Z'}
            </button>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
            </div>
          ) : allTopics.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Complete the Grammar Diagnostic to populate this table</p>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-xs text-gray-400 px-3 pb-2 border-b border-gray-100">
                <span>Topic</span>
                <span className="text-center w-12">Acc%</span>
                <span className="text-center w-12">Tries</span>
                <span className="w-16 text-right">Status</span>
              </div>
              <div className="space-y-1 mt-2">
                {sortedTopics.map(({ topic, accuracy, total }) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className="w-full grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-3 py-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 text-left"
                  >
                    <span className="text-xs text-gray-700 truncate">{topic}</span>
                    <span className="text-xs font-semibold text-gray-800 text-center w-12">
                      {total > 0 ? `${accuracy}%` : '—'}
                    </span>
                    <span className="text-xs text-gray-400 text-center w-12">{total}</span>
                    <div className="w-16 flex justify-end">
                      <StatusBadge accuracy={accuracy} total={total} />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Weak grammar topics */}
        {weakTopics.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="font-semibold text-gray-800">Needs Practice</h2>
            </div>
            <div className="space-y-2">
              {weakTopics.map(({ topic, accuracy, correct, total }) => (
                <button
                  key={topic}
                  onClick={() => navigate(`/practice/grammar?topic=${encodeURIComponent(topic)}`)}
                  className="w-full flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-3 text-left active:scale-99 transition-transform"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{topic}</p>
                    <p className="text-xs text-gray-400">{correct}/{total} correct ({accuracy}%)</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      accuracy < 40 ? 'bg-red-100 text-red-600' :
                      accuracy < 70 ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>{accuracy}%</span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Tap a topic to practise it now</p>
          </div>
        )}

        {/* Content library */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Content Library</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Flashcards', count: contentCounts.flashcard || 0 },
              { label: 'Grammar', count: contentCounts.grammar || 0 },
              { label: 'Reading', count: contentCounts.reading || 0 },
              { label: 'Listening', count: contentCounts.listening || 0 },
              { label: 'Mock Exams', count: contentCounts.mockExam || 0 },
            ].map(({ label, count }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{label} available offline</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topic Detail Modal */}
      {selectedTopic && selectedTopicData && (
        <TopicDetailModal
          topic={selectedTopic}
          data={selectedTopicData}
          onClose={() => setSelectedTopic(null)}
          onDrill={handleDrillFromModal}
          onNavigate={(topic) => navigate(`/practice/grammar?topic=${encodeURIComponent(topic)}`)}
        />
      )}
    </div>
  )
}
