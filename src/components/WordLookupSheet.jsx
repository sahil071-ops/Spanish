import { useState, useEffect } from 'react'
import { X, BookOpen, Plus, Check } from 'lucide-react'
import { getWordLookup, saveWordLookup } from '../utils/db.js'
import { lookupWord } from '../utils/anthropic.js'
import { saveCapturedWord, getCapturedWords } from '../utils/storage.js'

export default function WordLookupSheet({ word, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!word) return
    const already = getCapturedWords().some(w => w.word === word)
    setAdded(already)

    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Check cache first
        const cached = await getWordLookup(word)
        if (cached) {
          setData(cached)
          setLoading(false)
          return
        }
        // Call Anthropic
        const result = await lookupWord(word)
        if (result) {
          await saveWordLookup(word, result)
          setData(result)
        } else {
          setError('Lookup failed. Check your connection.')
        }
      } catch (e) {
        setError(e.message || 'Lookup failed.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [word])

  const handleAdd = () => {
    if (!data || added) return
    saveCapturedWord({
      word: data.word || word,
      pos: data.pos,
      gender: data.gender,
      english: data.english,
      example: data.example,
    })
    setAdded(true)
  }

  const POS_COLORS = {
    noun: 'bg-blue-50 text-blue-600',
    verb: 'bg-purple-50 text-purple-600',
    adjective: 'bg-green-50 text-green-600',
    adverb: 'bg-orange-50 text-orange-600',
    pronoun: 'bg-pink-50 text-pink-600',
    preposition: 'bg-amber-50 text-amber-600',
    conjunction: 'bg-gray-50 text-gray-600',
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg mx-auto p-6 space-y-4 min-h-48"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-gray-400" />
            <h3 className="font-bold text-gray-900 text-lg">{word}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-3 py-4">
            <div className="w-5 h-5 border-2 border-[#C60B1E] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Looking up…</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 py-2">{error}</p>
        )}

        {data && !loading && (
          <>
            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              {data.pos && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${POS_COLORS[data.pos] || 'bg-gray-50 text-gray-500'}`}>
                  {data.pos}
                </span>
              )}
              {data.gender && data.gender !== 'neutral' && data.gender !== 'null' && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-500">
                  {data.gender === 'masculine' ? 'masc.' : 'fem.'}
                </span>
              )}
              {data.level && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">{data.level}</span>
              )}
            </div>

            {/* English */}
            <div className="bg-gray-50 rounded-2xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">English</p>
              <p className="font-semibold text-gray-900">{data.english}</p>
            </div>

            {/* Example */}
            {data.example && (
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Example</p>
                <p className="text-sm text-gray-700 italic">"{data.example}"</p>
                {data.exampleTranslation && (
                  <p className="text-xs text-gray-400">"{data.exampleTranslation}"</p>
                )}
              </div>
            )}

            {/* Add to Vocabulary */}
            <button
              onClick={handleAdd}
              disabled={added}
              className={`w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                added
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-[#C60B1E] text-white'
              }`}
            >
              {added ? <Check size={18} /> : <Plus size={18} />}
              {added ? 'Added to Vocabulary' : 'Add to Vocabulary Practice'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
