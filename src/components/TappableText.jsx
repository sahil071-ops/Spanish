import { useState, useRef, useCallback } from 'react'

/**
 * Renders Spanish text where:
 * - Single tap on a word opens the WordLookupSheet
 * - On flashcards: long-press (500ms) triggers onLongPress(word)
 */
export default function TappableText({ text, className = '', onWordTap, onLongPress }) {
  const pressTimer = useRef(null)
  const [pressedWord, setPressedWord] = useState(null)

  const words = text ? text.split(/(\s+)/) : []

  const handlePointerDown = useCallback((word) => {
    if (!onLongPress) return
    setPressedWord(word)
    pressTimer.current = setTimeout(() => {
      onLongPress(word)
      setPressedWord(null)
    }, 500)
  }, [onLongPress])

  const handlePointerUp = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    setPressedWord(null)
  }, [])

  return (
    <span className={className}>
      {words.map((token, i) => {
        const isWhitespace = /^\s+$/.test(token)
        if (isWhitespace) return <span key={i}>{token}</span>

        // Strip punctuation for lookup but keep it rendered
        const clean = token.replace(/[¿?¡!.,;:«»"()]/g, '').trim()
        if (!clean) return <span key={i}>{token}</span>

        return (
          <span
            key={i}
            role="button"
            tabIndex={0}
            className={`cursor-pointer rounded px-0.5 transition-colors select-none ${
              pressedWord === clean ? 'bg-yellow-200' : 'hover:bg-yellow-100 active:bg-yellow-200'
            }`}
            onClick={() => onWordTap && onWordTap(clean)}
            onPointerDown={() => handlePointerDown(clean)}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {token}
          </span>
        )
      })}
    </span>
  )
}
