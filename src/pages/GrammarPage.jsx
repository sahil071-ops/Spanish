import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { getAllContent } from '../utils/db.js'
import { updateSRSItem, logActivity, updateStreak, recordTopicResult, getWeakTopics, getTopicPerformance } from '../utils/storage.js'
import { generateFreshDrill } from '../utils/anthropic.js'
import { useApp } from '../context/AppContext.jsx'
import { CheckCircle, XCircle, ArrowRight, Zap } from 'lucide-react'

export default function GrammarPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshProgress } = useApp()
  const focusTopic = searchParams.get('topic') // optional: focus on a specific grammarPoint

  const [exercises, setExercises] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [stats, setStats] = useState({ correct: 0, wrong: 0 })
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [drilling, setDrilling] = useState(false)

  useEffect(() => {
    async function load() {
      const all = await getAllContent('grammar')

      let toShow
      if (focusTopic) {
        // Focused practice on a specific weak topic
        const focused = all.filter(e => e.grammarPoint === focusTopic)
        const others = all.filter(e => e.grammarPoint !== focusTopic)
        const shuffledOthers = [...others].sort(() => Math.random() - 0.5)
        toShow = [...focused.sort(() => Math.random() - 0.5), ...shuffledOthers.slice(0, 5)]
      } else {
        // Adaptive: 3× weight for weak topics (<60%), exclude strong (>85%)
        const topicPerf = getTopicPerformance()
        const weakTopics = []
        const strongTopics = []
        for (const [topic, v] of Object.entries(topicPerf)) {
          if (v.total < 2) continue
          const acc = Math.round((v.correct / v.total) * 100)
          if (acc < 60) weakTopics.push(topic)
          else if (acc >= 85) strongTopics.push(topic)
        }
        const weak = all.filter(e => weakTopics.includes(e.grammarPoint))
        const strong = all.filter(e => strongTopics.includes(e.grammarPoint))
        const rest = all.filter(e => !weakTopics.includes(e.grammarPoint) && !strongTopics.includes(e.grammarPoint))
        // Weak topics get 3× representation; strong topics excluded if enough rest content
        const excluded = rest.length + weak.length >= 10 ? strong : []
        const available = all.filter(e => !excluded.includes(e))
        const pool = [...weak, ...weak, ...weak, ...rest, ...available.filter(e => !weak.includes(e) && !rest.includes(e))].sort(() => Math.random() - 0.5)
        toShow = pool.slice(0, 15)
      }

      setExercises(toShow)
      setLoading(false)
    }
    load()
  }, [focusTopic])

  const exercise = exercises[current]

  const handleSelect = (option) => {
    if (selected !== null) return
    setSelected(option)
    setShowExplanation(true)

    const isCorrect = option === exercise.answer
    updateSRSItem(exercise.id, isCorrect ? 4 : 1)
    recordTopicResult(exercise.grammarPoint, isCorrect)
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
    }))
  }

  const handleNext = () => {
    if (current + 1 >= exercises.length) {
      setFinished(true)
      updateStreak()
      logActivity()
      refreshProgress()
    } else {
      setCurrent(i => i + 1)
      setSelected(null)
      setShowExplanation(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <TopBar title="Grammar" onBack={() => navigate('/practice')} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="animate-spin w-8 h-8 border-2 border-[#C60B1E] border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  const handleFreshDrill = async () => {
    const topic = focusTopic || (getWeakTopics(1)[0]?.topic)
    if (!topic) return
    setDrilling(true)
    try {
      const newExercises = await generateFreshDrill(topic)
      if (newExercises.length > 0) {
        setExercises(newExercises)
        setCurrent(0)
        setSelected(null)
        setShowExplanation(false)
        setStats({ correct: 0, wrong: 0 })
        setFinished(false)
      }
    } catch (e) {
      console.error('[Drill]', e)
    } finally {
      setDrilling(false)
    }
  }

  if (finished || exercises.length === 0) {
    const pct = exercises.length > 0 ? Math.round((stats.correct / exercises.length) * 100) : 0
    const drillTopic = focusTopic || (getWeakTopics(1)[0]?.topic)
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Grammar" onBack={() => navigate('/practice')} />
        <div className="px-4 max-w-lg mx-auto w-full pt-8 text-center">
          <div className="text-5xl mb-4">{pct >= 70 ? '🌟' : '💪'}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
          <p className="text-gray-500 mb-8">Score: {stats.correct}/{exercises.length} ({pct}%)</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 rounded-2xl p-4">
              <p className="text-3xl font-bold text-green-600">{stats.correct}</p>
              <p className="text-sm text-gray-500">Correct</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4">
              <p className="text-3xl font-bold text-red-500">{stats.wrong}</p>
              <p className="text-sm text-gray-500">Incorrect</p>
            </div>
          </div>
          {drillTopic && (
            <button
              onClick={handleFreshDrill}
              disabled={drilling}
              className="w-full mb-3 bg-amber-500 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {drilling ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap size={18} />}
              {drilling ? 'Generating…' : 'Fresh Drill (5 new AI questions)'}
            </button>
          )}
          <button onClick={() => navigate('/practice')} className="w-full bg-[#C60B1E] text-white font-semibold py-3.5 rounded-2xl">
            Back to Practice
          </button>
        </div>
      </div>
    )
  }

  const parts = exercise.sentence.split('___')
  const isCorrect = selected === exercise.answer

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Grammar" onBack={() => navigate('/practice')} />

      <div className="px-4 max-w-lg mx-auto w-full pt-4 space-y-4">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#C60B1E] rounded-full transition-all duration-300"
              style={{ width: `${(current / exercises.length) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-400 shrink-0">{current + 1}/{exercises.length}</span>
          {focusTopic && (
            <button
              onClick={handleFreshDrill}
              disabled={drilling}
              className="shrink-0 flex items-center gap-1 bg-amber-50 text-amber-600 text-xs px-2.5 py-1 rounded-full border border-amber-200 disabled:opacity-50"
            >
              <Zap size={11} />
              {drilling ? '…' : 'Fresh Drill'}
            </button>
          )}
        </div>

        {/* Grammar tag — grammarPoint hidden until answered to avoid spoilers */}
        <div className="flex gap-2 flex-wrap">
          {selected !== null && (
            <span className="bg-purple-50 text-purple-600 text-xs px-2.5 py-1 rounded-full font-medium">{exercise.grammarPoint}</span>
          )}
          <span className="bg-gray-50 text-gray-500 text-xs px-2.5 py-1 rounded-full capitalize">{exercise.theme}</span>
        </div>

        {/* Sentence */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Complete the sentence</p>
          <p className="text-lg text-gray-800 leading-relaxed">
            {parts[0]}
            <span className={`inline-block min-w-16 border-b-2 text-center font-bold mx-1 px-2 ${
              selected === null ? 'border-gray-300 text-gray-300' :
              isCorrect ? 'border-green-500 text-green-600' : 'border-red-400 text-red-500'
            }`}>
              {selected || '___'}
            </span>
            {parts[1] || ''}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-2.5">
          {exercise.options.map(option => {
            let cls = 'bg-white border border-gray-200 text-gray-700'
            if (selected === option) {
              cls = isCorrect ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-400 text-red-700'
            } else if (selected !== null && option === exercise.answer) {
              cls = 'bg-green-50 border-green-500 text-green-700'
            }

            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={selected !== null}
                className={`py-3 px-4 rounded-xl text-sm font-medium text-center transition-all active:scale-98 ${cls}`}
              >
                {option}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className={`rounded-2xl p-4 flex gap-3 animate-fade-in ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            {isCorrect ? <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" /> : <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />}
            <div>
              <p className={`text-sm font-semibold mb-1 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                {isCorrect ? 'Correct!' : `Answer: ${exercise.answer}`}
              </p>
              <p className="text-sm text-gray-600">{exercise.explanation}</p>
            </div>
          </div>
        )}

        {/* Next button */}
        {selected !== null && (
          <button
            onClick={handleNext}
            className="w-full bg-[#C60B1E] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 animate-fade-in"
          >
            {current + 1 >= exercises.length ? 'See Results' : 'Next Question'}
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
