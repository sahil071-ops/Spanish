import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import WordLookupSheet from '../components/WordLookupSheet.jsx'
import TappableText from '../components/TappableText.jsx'
import { getOrGenerateAmbientStory } from '../utils/anthropic.js'
import { deleteAmbientStory } from '../utils/db.js'
import { speakWithWebSpeech, stopSpeech } from '../utils/audio.js'
import { logActivity, updateStreak } from '../utils/storage.js'
import { useApp } from '../context/AppContext.jsx'
import { Play, Pause, RotateCcw, CheckCircle, XCircle, ArrowRight, Headphones } from 'lucide-react'

export default function AmbientListenPage() {
  const navigate = useNavigate()
  const { refreshProgress } = useApp()

  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [phase, setPhase] = useState('listen') // 'listen' | 'quiz' | 'results'
  const [answers, setAnswers] = useState({})
  const [lookupWord, setLookupWord] = useState(null)
  const [score, setScore] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const s = await getOrGenerateAmbientStory()
        if (s) {
          setStory(s)
        } else {
          setError('Could not load a story. Please check your connection and API key.')
        }
      } catch (e) {
        setError(e.message || 'Failed to load story.')
      } finally {
        setLoading(false)
      }
    }
    load()

    return () => {
      stopSpeech()
    }
  }, [])

  const handlePlay = useCallback(() => {
    if (!story) return
    setIsPlaying(true)
    speakWithWebSpeech(story.story, {
      rate: speed === 0.75 ? 0.65 : 0.85,
      onEnd: () => setIsPlaying(false),
      onStart: () => setIsPlaying(true),
    })
  }, [story, speed])

  const handlePause = useCallback(() => {
    stopSpeech()
    setIsPlaying(false)
  }, [])

  const handleReplay = useCallback(() => {
    stopSpeech()
    setIsPlaying(false)
    setTimeout(handlePlay, 100)
  }, [handlePlay])

  const toggleSpeed = () => {
    const newSpeed = speed === 1 ? 0.75 : 1
    setSpeed(newSpeed)
    if (isPlaying) {
      stopSpeech()
      setIsPlaying(false)
    }
  }

  const handleAnswer = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }))
  }

  const handleFinishQuiz = async () => {
    const correct = story.questions.filter(q => answers[q.id] === q.answer).length
    setScore({ correct, total: story.questions.length })
    setPhase('results')

    // Delete used story from cache
    if (story.id) {
      try {
        await deleteAmbientStory(story.id)
      } catch {}
    }

    updateStreak()
    logActivity()
    refreshProgress()
  }

  const allAnswered = story?.questions?.every(q => answers[q.id])

  if (loading) {
    return (
      <div className="flex flex-col">
        <TopBar title="Ambient Listen" onBack={() => navigate('/practice')} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
          <div className="animate-spin w-8 h-8 border-2 border-[#C60B1E] border-t-transparent rounded-full" />
          <p className="text-sm text-gray-400 text-center">Generating your story…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Ambient Listen" onBack={() => navigate('/practice')} />
        <div className="px-4 max-w-lg mx-auto w-full pt-8 text-center">
          <div className="text-5xl mb-4">🎧</div>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate('/practice')} className="w-full bg-[#C60B1E] text-white font-semibold py-3.5 rounded-2xl">
            Back to Practice
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'results' && score) {
    const pct = Math.round((score.correct / score.total) * 100)
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Ambient Listen" onBack={() => navigate('/practice')} />
        <div className="px-4 max-w-lg mx-auto w-full pt-8 text-center">
          <div className="text-5xl mb-4">{pct >= 70 ? '🎧' : '💪'}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
          <p className="text-gray-500 mb-8">Score: {score.correct}/{score.total} ({pct}%)</p>
          <button
            onClick={() => navigate('/practice/ambient')}
            className="w-full mb-3 bg-amber-500 text-white font-semibold py-3.5 rounded-2xl"
          >
            Another Story
          </button>
          <button onClick={() => navigate('/practice')} className="w-full bg-[#C60B1E] text-white font-semibold py-3.5 rounded-2xl">
            Back to Practice
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Ambient Listen" onBack={() => { stopSpeech(); navigate('/practice') }} />

      <div className="px-4 max-w-lg mx-auto w-full pt-4 space-y-4">
        {/* Metadata */}
        <div className="flex gap-2 flex-wrap">
          <span className="bg-orange-50 text-orange-600 text-xs px-2.5 py-1 rounded-full font-medium capitalize">{story.theme}</span>
          <span className="bg-gray-50 text-gray-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
            <Headphones size={11} />
            Ambient
          </span>
        </div>

        <h2 className="font-bold text-gray-900 text-lg">{story.title}</h2>

        {/* Audio controls */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="w-12 h-12 rounded-full bg-[#C60B1E] text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>
            <button
              onClick={handleReplay}
              className="w-10 h-10 rounded-full border border-gray-200 text-gray-500 flex items-center justify-center active:scale-95 transition-transform"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={toggleSpeed}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                speed < 1 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-gray-200 text-gray-500'
              }`}
            >
              {speed === 0.75 ? '0.75×' : '1×'}
            </button>
            <span className="text-xs text-gray-400 ml-auto">Web Speech</span>
          </div>

          {/* Story text — tappable */}
          <p className="text-sm text-gray-700 leading-relaxed">
            <TappableText text={story.story} onWordTap={setLookupWord} />
          </p>
          <p className="text-xs text-gray-300 mt-3">Tap any word to look it up</p>
        </div>

        {phase === 'listen' && (
          <button
            onClick={() => { stopSpeech(); setIsPlaying(false); setPhase('quiz') }}
            className="w-full bg-[#C60B1E] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2"
          >
            Start Quiz
            <ArrowRight size={18} />
          </button>
        )}

        {phase === 'quiz' && (
          <>
            <h3 className="font-semibold text-gray-800">Comprehension Questions</h3>
            <div className="space-y-4">
              {story.questions.map((q, qi) => {
                const userAnswer = answers[q.id]

                return (
                  <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-3">{qi + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options.map(option => {
                        const isSelected = userAnswer === option
                        return (
                          <button
                            key={option}
                            onClick={() => handleAnswer(q.id, option)}
                            className={`w-full text-left py-2.5 px-3.5 rounded-xl border text-sm transition-colors ${
                              isSelected
                                ? 'border-[#C60B1E] bg-red-50 text-[#C60B1E]'
                                : 'border-gray-200 text-gray-600 bg-white'
                            }`}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={handleFinishQuiz}
              disabled={!allAnswered}
              className={`w-full font-semibold py-3.5 rounded-2xl transition-opacity ${
                allAnswered ? 'bg-[#C60B1E] text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              See Results
            </button>
          </>
        )}
      </div>

      {lookupWord && (
        <WordLookupSheet word={lookupWord} onClose={() => setLookupWord(null)} />
      )}
    </div>
  )
}
