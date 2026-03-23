import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { getAllContent } from '../utils/db.js'
import { updateSRSItem, logActivity, updateStreak, recordTopicResult, getTopicPerformance } from '../utils/storage.js'
import { useApp } from '../context/AppContext.jsx'
import { CheckCircle, XCircle, ArrowRight, Zap, ChevronRight } from 'lucide-react'

// Pick one question per unique grammarPoint, prioritising untested topics
function buildDiagnosticSet(allExercises, topicPerf, maxQuestions = 20) {
  // Group exercises by grammarPoint
  const byTopic = {}
  for (const ex of allExercises) {
    const t = ex.grammarPoint || 'General'
    if (!byTopic[t]) byTopic[t] = []
    byTopic[t].push(ex)
  }

  // Sort topics: untested first, then fewest-attempts first, shuffle ties
  const topics = Object.keys(byTopic).sort((a, b) => {
    const aAttempts = topicPerf[a]?.total ?? 0
    const bAttempts = topicPerf[b]?.total ?? 0
    if (aAttempts !== bAttempts) return aAttempts - bAttempts
    return Math.random() - 0.5
  })

  const selected = []
  for (const topic of topics) {
    if (selected.length >= maxQuestions) break
    const pool = byTopic[topic]
    const pick = pool[Math.floor(Math.random() * pool.length)]
    selected.push(pick)
  }

  return selected
}

export default function DiagnosticQuizPage() {
  const navigate = useNavigate()
  const { refreshProgress } = useApp()

  const [exercises, setExercises] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [results, setResults] = useState([]) // { topic, correct }
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const all = await getAllContent('grammar')
      const topicPerf = getTopicPerformance()
      const set = buildDiagnosticSet(all, topicPerf, 20)
      setExercises(set)
      setLoading(false)
    }
    load()
  }, [])

  const exercise = exercises[current]

  const handleSelect = (option) => {
    if (selected !== null) return
    setSelected(option)
    setShowExplanation(true)

    const isCorrect = option === exercise.answer
    updateSRSItem(exercise.id, isCorrect ? 4 : 1)
    recordTopicResult(exercise.grammarPoint || 'General', isCorrect)
    setResults(prev => [...prev, { topic: exercise.grammarPoint || 'General', correct: isCorrect }])
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
        <TopBar title="Grammar Diagnostic" onBack={() => navigate('/practice')} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="animate-spin w-8 h-8 border-2 border-[#C60B1E] border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (finished) {
    const correct = results.filter(r => r.correct).length
    const pct = Math.round((correct / results.length) * 100)
    const weak = results.filter(r => !r.correct)
    const strong = results.filter(r => r.correct)

    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Diagnostic Results" onBack={() => navigate('/progress')} />
        <div className="px-4 max-w-lg mx-auto w-full pt-6 space-y-5">
          {/* Score summary */}
          <div className="text-center">
            <div className="text-5xl mb-3">{pct >= 80 ? '🌟' : pct >= 60 ? '💪' : '📚'}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Diagnostic Complete</h2>
            <p className="text-gray-500">{correct}/{results.length} correct ({pct}%)</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{strong.length}</p>
              <p className="text-sm text-gray-500">Topics OK</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-red-500">{weak.length}</p>
              <p className="text-sm text-gray-500">Need Practice</p>
            </div>
          </div>

          {/* Weak topics */}
          {weak.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <XCircle size={16} className="text-red-500" />
                Needs Practice
              </h3>
              <div className="space-y-2">
                {weak.map(({ topic }) => (
                  <button
                    key={topic}
                    onClick={() => navigate(`/practice/grammar?topic=${encodeURIComponent(topic)}`)}
                    className="w-full flex items-center gap-3 bg-red-50 rounded-xl px-3 py-2.5 text-left active:scale-99 transition-transform"
                  >
                    <p className="text-sm text-gray-800 flex-1 truncate">{topic}</p>
                    <ChevronRight size={14} className="text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">These have been added to your Progress page. Tap to practise now.</p>
            </div>
          )}

          {/* Strong topics */}
          {strong.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Looking Good
              </h3>
              <div className="flex flex-wrap gap-2">
                {strong.map(({ topic }) => (
                  <span key={topic} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/progress')}
            className="w-full bg-[#C60B1E] text-white font-semibold py-3.5 rounded-2xl"
          >
            View Full Progress
          </button>

          {weak.length > 0 && (
            <button
              onClick={() => navigate(`/practice/grammar?topic=${encodeURIComponent(weak[0].topic)}`)}
              className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl"
            >
              Practise Weakest Topic Now
            </button>
          )}
        </div>
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Grammar Diagnostic" onBack={() => navigate('/practice')} />
        <div className="px-4 max-w-lg mx-auto w-full pt-8 text-center">
          <p className="text-gray-500">No grammar exercises available.</p>
        </div>
      </div>
    )
  }

  const isCorrect = selected === exercise.answer
  const parts = exercise.sentence.split('___')

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Grammar Diagnostic" onBack={() => navigate('/practice')} />

      <div className="px-4 max-w-lg mx-auto w-full pt-4 space-y-4">
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C60B1E] rounded-full transition-all duration-300"
              style={{ width: `${(current / exercises.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 shrink-0">{current + 1}/{exercises.length}</span>
        </div>

        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-2">
          <Zap size={14} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">1 question per topic — discovering your weak areas</p>
        </div>

        {/* Grammar tag — hidden until answered */}
        <div className="flex gap-2 flex-wrap">
          {selected !== null && (
            <span className="bg-purple-50 text-purple-600 text-xs px-2.5 py-1 rounded-full font-medium">
              {exercise.grammarPoint}
            </span>
          )}
          <span className="bg-gray-50 text-gray-500 text-xs px-2.5 py-1 rounded-full capitalize">
            {exercise.theme}
          </span>
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
            {isCorrect
              ? <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
              : <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />}
            <div>
              <p className={`text-sm font-semibold mb-1 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                {isCorrect ? 'Correct!' : `Answer: ${exercise.answer}`}
              </p>
              <p className="text-sm text-gray-600">{exercise.explanation}</p>
            </div>
          </div>
        )}

        {/* Next */}
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
