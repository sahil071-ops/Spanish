import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import AudioPlayer from '../components/AudioPlayer.jsx'
import { getAllContent } from '../utils/db.js'
import { logActivity, updateStreak } from '../utils/storage.js'
import { Timer, ChevronRight, CheckCircle, XCircle } from 'lucide-react'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MockExamPage() {
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [phase, setPhase] = useState('select') // 'select' | 'exam' | 'review'
  const [currentSection, setCurrentSection] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    async function load() {
      const all = await getAllContent('mockExam')
      setExams(all)
      setLoading(false)
    }
    load()
  }, [])

  const startExam = (exam) => {
    setSelectedExam(exam)
    setPhase('exam')
    setCurrentSection(0)
    setCurrentQuestion(0)
    setAnswers({})
    const totalSeconds = exam.duration * 60
    setTimeLeft(totalSeconds)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setPhase('review')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleAnswer = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const handleFinish = () => {
    clearInterval(timerRef.current)
    setPhase('review')
    updateStreak()
    logActivity()
  }

  // Flatten all questions for review
  const getAllQuestions = () => {
    if (!selectedExam) return []
    return selectedExam.sections.flatMap(s => s.questions.map(q => ({ ...q, sectionTitle: s.title })))
  }

  const getScore = () => {
    const questions = getAllQuestions()
    const correct = questions.filter(q => answers[q.id] === q.answer).length
    return { correct, total: questions.length, pct: Math.round((correct / questions.length) * 100) }
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  if (loading) {
    return (
      <div className="flex flex-col">
        <TopBar title="Mock Exam" onBack={() => navigate('/practice')} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="animate-spin w-8 h-8 border-2 border-[#C60B1E] border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (phase === 'select') {
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Mock Exam" onBack={() => navigate('/practice')} />
        <div className="px-4 max-w-lg mx-auto w-full pt-4 space-y-4">
          <p className="text-sm text-gray-500">Choose a timed exam to simulate real B1 test conditions.</p>
          {exams.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No exams available yet.</div>
          ) : (
            exams.map(exam => (
              <button
                key={exam.id}
                onClick={() => startExam(exam)}
                className="w-full bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 active:scale-99 transition-transform text-left"
              >
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <Timer size={22} className="text-[#C60B1E]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{exam.title}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {exam.duration} min · {exam.sections?.length || 0} sections · {exam.sections?.reduce((a, s) => a + (s.questions?.length || 0), 0)} questions
                  </p>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  if (phase === 'review') {
    const score = getScore()
    const allQuestions = getAllQuestions()

    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Exam Results" onBack={() => { setPhase('select'); setSelectedExam(null) }} />
        <div className="px-4 max-w-lg mx-auto w-full pt-4 space-y-4">
          {/* Score card */}
          <div className={`rounded-2xl p-6 text-center text-white ${score.pct >= 70 ? 'bg-green-500' : 'bg-[#C60B1E]'}`}>
            <p className="text-5xl font-bold mb-1">{score.pct}%</p>
            <p className="text-lg">{score.correct}/{score.total} correct</p>
            <p className="text-sm opacity-80 mt-2">{score.pct >= 70 ? 'B1 level passed! ✓' : 'Keep practising!'}</p>
          </div>

          {/* Section breakdown */}
          {selectedExam.sections.map(section => {
            const sectionQ = section.questions || []
            const sectionCorrect = sectionQ.filter(q => answers[q.id] === q.answer).length
            const pct = sectionQ.length > 0 ? Math.round((sectionCorrect / sectionQ.length) * 100) : 0
            return (
              <div key={section.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">{section.title}</p>
                  <p className="text-sm text-gray-500">{sectionCorrect}/{sectionQ.length}</p>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pct >= 70 ? 'bg-green-500' : 'bg-[#C60B1E]'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}

          {/* Question review */}
          <h3 className="font-semibold text-gray-800">Question Review</h3>
          {allQuestions.map((q, i) => {
            const userAns = answers[q.id]
            const isCorrect = userAns === q.answer
            return (
              <div key={q.id} className={`bg-white rounded-2xl border p-4 ${isCorrect ? 'border-green-100' : 'border-red-100'}`}>
                <div className="flex items-start gap-2 mb-2">
                  {isCorrect ? <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> : <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />}
                  <p className="text-sm text-gray-700">{i + 1}. {q.question}</p>
                </div>
                {!isCorrect && (
                  <div className="ml-6 space-y-1">
                    {userAns && <p className="text-xs text-red-500">Your answer: {userAns}</p>}
                    <p className="text-xs text-green-600">Correct: {q.answer}</p>
                    {q.explanation && <p className="text-xs text-gray-500 mt-1">{q.explanation}</p>}
                  </div>
                )}
              </div>
            )
          })}

          <button onClick={() => { setPhase('select'); setSelectedExam(null) }} className="w-full bg-[#C60B1E] text-white font-semibold py-3.5 rounded-2xl">
            Back to Exams
          </button>
        </div>
      </div>
    )
  }

  // Exam phase
  const section = selectedExam.sections[currentSection]
  const question = section?.questions[currentQuestion]
  const totalSections = selectedExam.sections.length

  if (!section || !question) return null

  const sectionQuestionCount = section.questions.length
  const userAnswer = answers[question.id]

  return (
    <div className="flex flex-col pb-28">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">{section.title}</p>
            <p className="text-xs text-gray-400">Q{currentQuestion + 1}/{sectionQuestionCount}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono font-bold ${timeLeft < 300 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
            <Timer size={14} />
            {formatTime(timeLeft)}
          </div>
        </div>
        {/* Section progress dots */}
        <div className="flex gap-1 px-4 pb-2 max-w-lg mx-auto">
          {selectedExam.sections.map((s, i) => (
            <div key={s.id} className={`h-1 flex-1 rounded-full ${i < currentSection ? 'bg-green-400' : i === currentSection ? 'bg-[#C60B1E]' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <div className="px-4 max-w-lg mx-auto w-full pt-4 space-y-4">
        {/* Listening script if applicable */}
        {question.script && (
          <AudioPlayer
            contentId={`me-${question.id}`}
            text={question.script}
            transcript={question.transcript}
          />
        )}

        {/* Reading passage if applicable */}
        {question.passage && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm text-gray-700 leading-relaxed">{question.passage}</p>
          </div>
        )}

        {/* Question */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">{question.question}</p>
          <div className="space-y-2">
            {question.options.map(option => (
              <button
                key={option}
                onClick={() => handleAnswer(question.id, option)}
                className={`w-full text-left py-2.5 px-3.5 rounded-xl border text-sm transition-colors ${
                  userAnswer === option
                    ? 'border-[#C60B1E] bg-red-50 text-[#C60B1E]'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentQuestion < sectionQuestionCount - 1 ? (
            <button
              onClick={() => setCurrentQuestion(q => q + 1)}
              className="flex-1 bg-[#C60B1E] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : currentSection < totalSections - 1 ? (
            <button
              onClick={() => { setCurrentSection(s => s + 1); setCurrentQuestion(0) }}
              className="flex-1 bg-[#C60B1E] text-white font-semibold py-3 rounded-xl"
            >
              Next Section →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex-1 bg-green-500 text-white font-semibold py-3 rounded-xl"
            >
              Submit Exam
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
