import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { getOrGenerateAudio, speakWithWebSpeech, stopSpeech } from '../utils/audio.js'
import { useApp } from '../context/AppContext.jsx'

export default function AudioPlayer({ contentId, text, transcript, showTranscriptToggle = true }) {
  const { isOnline, settings } = useApp()
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [showTranscript, setShowTranscript] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [usingOfflineVoice, setUsingOfflineVoice] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)
  const audioRef = useRef(null)
  const intervalRef = useRef(null)
  const words = transcript ? transcript.split(/\s+/) : []

  // Load audio on mount
  useEffect(() => {
    async function loadAudio() {
      const url = await getOrGenerateAudio(contentId, text)
      if (url) {
        setAudioUrl(url)
        setUsingOfflineVoice(false)
      } else {
        setUsingOfflineVoice(true)
      }
    }
    loadAudio()

    return () => {
      stopSpeech()
      if (audioRef.current) {
        audioRef.current.pause()
      }
      clearInterval(intervalRef.current)
    }
  }, [contentId, text])

  const handlePlay = useCallback(() => {
    setHasStarted(true)
    if (audioUrl) {
      // Play cached/generated audio
      const audio = audioRef.current
      if (!audio) return
      audio.playbackRate = speed
      audio.play()
      setIsPlaying(true)

      intervalRef.current = setInterval(() => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100)
        }
      }, 200)
    } else {
      // Web Speech API fallback
      setIsPlaying(true)
      speakWithWebSpeech(text, {
        rate: speed === 0.75 ? 0.75 : 1,
        onStart: () => setIsPlaying(true),
        onEnd: () => {
          setIsPlaying(false)
          setCurrentWordIndex(-1)
          setProgress(100)
        },
        onBoundary: (e) => {
          if (e.name === 'word') {
            // Find word index by char position
            const spokenSoFar = text.slice(0, e.charIndex + e.charLength)
            const wordCount = spokenSoFar.split(/\s+/).length - 1
            setCurrentWordIndex(wordCount)
          }
        },
      })
    }
  }, [audioUrl, text, speed])

  const handlePause = useCallback(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.pause()
    } else {
      stopSpeech()
    }
    setIsPlaying(false)
    clearInterval(intervalRef.current)
  }, [audioUrl])

  const handleReplay = useCallback(() => {
    setProgress(0)
    setCurrentWordIndex(-1)
    if (audioUrl && audioRef.current) {
      audioRef.current.currentTime = 0
    } else {
      stopSpeech()
      setIsPlaying(false)
    }
    handlePlay()
  }, [audioUrl, handlePlay])

  const toggleSpeed = () => {
    const newSpeed = speed === 1 ? 0.75 : 1
    setSpeed(newSpeed)
    if (audioUrl && audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Waveform / progress */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-1.5 mb-3 h-8">
          {isPlaying ? (
            Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.15}s` }} />
            ))
          ) : (
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C60B1E] rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
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
              speed < 1
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            {speed === 0.75 ? '0.75×' : '1×'}
          </button>

          {usingOfflineVoice && (
            <span className="text-xs text-gray-400 ml-auto">Offline voice</span>
          )}
        </div>
      </div>

      {/* Transcript toggle */}
      {showTranscriptToggle && transcript && hasStarted && (
        <>
          <button
            onClick={() => setShowTranscript(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-500 border-t border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <span>Show transcript</span>
            {showTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showTranscript && (
            <div className="px-5 pb-5 text-sm text-gray-700 leading-relaxed">
              {words.map((word, i) => (
                <span
                  key={i}
                  className={`transition-colors ${
                    i === currentWordIndex ? 'bg-[#C60B1E] text-white rounded px-0.5' : ''
                  }`}
                >
                  {word}{' '}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* Hidden audio element for cached audio */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => {
            setIsPlaying(false)
            setProgress(100)
            clearInterval(intervalRef.current)
          }}
          onTimeUpdate={(e) => {
            const el = e.target
            if (el.duration) setProgress((el.currentTime / el.duration) * 100)
          }}
        />
      )}
    </div>
  )
}
