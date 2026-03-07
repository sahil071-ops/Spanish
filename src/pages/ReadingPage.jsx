import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { getAllContent } from '../utils/db.js'
import { updateSRSItem, logActivity, updateStreak } from '../utils/storage.js'
import { useApp } from '../context/AppContext.jsx'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'

export default function ReadingPage() {
  const navigate = useNavigate()
  const { refreshProgress } = useApp()
  const [passages, setPassages] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [totalScore, setTotalScore] = useState({ correct: 0, total: 0 })

  useEffect(() => {
    async function load() {
      const all = await getAllContent('reading')
      const shuffled = [...all].sort(() => Math.random() - 0.5)
      setPassages(shuffled.slice(0, 3))
      setLoading(false)
    }
    load()
  }, [])

  const passage = passages[current]

  const handleAnswer = (qId, option) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qId]: option }))
  }

  const handleSubmit = () => {
    setSubmitted(true)
    const correct = passage.questions.filter(q => answers[q.id] === q.answer).length
    updateSRSItem(passage.id, correct >= passage.questions.length * 0.7 ? 4 : 2)
    setTotalScore(prev => ({ correct: prev.correct + correct, total: prev.total + passage.questions.length }))
  }

  const handleNext = () => {
    if (current + 1 >= passages.length) {
      setFinished(true)
      updateStreak()
      logActivity()
      refreshProgress()
    } else {
      setCurrent(i => i + 1)
      setAnswers({})
      setSubmitted(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <TopBar title="Reading" onBack={() => navigate('/practice')} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="animate-spin w-8 h-8 border-2 border-[#C60B1E] border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (finished || passages.length === 0) {
    const pct = totalScore.total > 0 ? Math.round((totalScore.correct / totalScore.total) * 100) : 0
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Reading" onBack={() => navigate('/practice')} />
        <div className="px-4 max-w-lg mx-auto w-full pt-8 text-center">
          <div className="text-5xl mb-4">{pct >= 70 ? '📚' : '💪'}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
          <p className="text-gray-500 mb-8">Score: {totalScore.correct}/{totalScore.total} ({pct}%)</p>
          <button onClick={() => navigate('/practice')} className="w-full bg-[#C60B1E] text-white font-semibold py-3.5 rounded-2xl">
            Back to Practice
          </button>
        </div>
      </div>
    )
  }

  const allAnswered = passage.questions.every(q => answers[q.id])

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Reading" onBack={() => navigate('/practice')} />

      <div className="px-4 max-w-lg mx-auto w-full pt-4 space-y-4">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#C60B1E] rounded-full transition-all duration-300"
              style={{ width: `${(current / passages.length) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-400">{current + 1}/{passages.length}</span>
        </div>

        {/* Theme/difficulty */}
        <div className="flex gap-2">
          <span className="bg-green-50 text-green-600 text-xs px-2.5 py-1 rounded-full font-medium">{passage.theme}</span>
          <span className="bg-gray-50 text-gray-500 text-xs px-2.5 py-1 rounded-full">
            {'★'.repeat(passage.difficulty || 1)}
          </span>
        </div>

        {/* Passage */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-3">{passage.title}</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{passage.passage}</p>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {passage.questions.map((q, qi) => {
            const userAnswer = answers[q.id]
            const isCorrect = userAnswer === q.answer

            return (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  {qi + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map(option => {
                    let cls = 'border-gray-200 text-gray-600 bg-white'
                    if (submitted) {
                      if (option === q.answer) cls = 'border-green-500 bg-green-50 text-green-700'
                      else if (option === userAnswer && !isCorrect) cls = 'border-red-400 bg-red-50 text-red-600'
                    } else if (userAnswer === option) {
                      cls = 'border-[#C60B1E] bg-red-50 text-[#C60B1E]'
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleAnswer(q.id, option)}
                        disabled={submitted}
                        className={`w-full text-left py-2.5 px-3.5 rounded-xl border text-sm transition-colors ${cls}`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
                {submitted && (
                  <div className={`mt-3 flex items-center gap-2 text-sm ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                    {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span>{isCorrect ? 'Correct' : `Correct answer: ${q.answer}`}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Submit / Next */}
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`w-full font-semibold py-3.5 rounded-2xl transition-opacity ${
              allAnswered ? 'bg-[#C60B1E] text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            Check Answers
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full bg-[#C60B1E] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 animate-fade-in"
          >
            {current + 1 >= passages.length ? 'See Results' : 'Next Passage'}
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
