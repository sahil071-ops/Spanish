import { saveAudio, getAudio } from './db.js'
import { getSettings } from './storage.js'

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1'

// Voice IDs for ElevenLabs Spanish voices
const VOICE_IDS = {
  female: 'pFZP5JQG7iQjIQuC4Bku', // Lily — natural Spanish
  male: 'VR6AewLTigWG4xSOukaG',   // Arnold — fallback male
}

export async function generateElevenLabsAudio(text, voicePreference = 'female') {
  const settings = getSettings()
  const apiKey = settings.elevenLabsApiKey
  if (!apiKey) throw new Error('No ElevenLabs API key configured')

  const voiceId = VOICE_IDS[voicePreference] || VOICE_IDS.female

  const response = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })

  if (!response.ok) throw new Error(`ElevenLabs API error: ${response.status}`)
  return response.blob()
}

// ─── Audio Cache ──────────────────────────────────────────────────────────────

export async function getOrGenerateAudio(contentId, text) {
  // Check IndexedDB cache first
  const cached = await getAudio(contentId)
  if (cached) {
    return URL.createObjectURL(cached)
  }

  // Try ElevenLabs if online
  if (navigator.onLine) {
    const settings = getSettings()
    if (settings.elevenLabsApiKey) {
      try {
        const blob = await generateElevenLabsAudio(text, settings.voicePreference)
        await saveAudio(contentId, blob)
        return URL.createObjectURL(blob)
      } catch (err) {
        console.warn('[Audio] ElevenLabs failed, falling back to Web Speech:', err.message)
      }
    }
  }

  return null // Signal to use Web Speech API fallback
}

// ─── Web Speech API (offline fallback) ────────────────────────────────────────

let currentUtterance = null

export function speakWithWebSpeech(text, { rate = 1, onStart, onEnd, onBoundary } = {}) {
  if (!('speechSynthesis' in window)) return null

  // Cancel any current speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'es-ES'
  utterance.rate = rate
  utterance.pitch = 1.0

  // Try to find a Spanish voice
  const voices = window.speechSynthesis.getVoices()
  const spanishVoice = voices.find(v => v.lang.startsWith('es-ES') || v.lang.startsWith('es'))
  if (spanishVoice) utterance.voice = spanishVoice

  if (onStart) utterance.onstart = onStart
  if (onEnd) utterance.onend = onEnd
  if (onBoundary) utterance.onboundary = onBoundary

  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
  return utterance
}

export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  currentUtterance = null
}

export function pauseSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.pause()
  }
}

export function resumeSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.resume()
  }
}

// ─── Pre-fetch audio ──────────────────────────────────────────────────────────

export async function prefetchAudioBatch(listeningItems) {
  if (!navigator.onLine) return
  const settings = getSettings()
  if (!settings.elevenLabsApiKey) return

  const toFetch = listeningItems.slice(0, 10)
  for (const item of toFetch) {
    try {
      const cached = await getAudio(item.id)
      if (!cached && item.script) {
        const blob = await generateElevenLabsAudio(item.script, settings.voicePreference)
        await saveAudio(item.id, blob)
        console.log(`[Audio] Pre-cached: ${item.id}`)
      }
    } catch (err) {
      console.warn(`[Audio] Pre-fetch failed for ${item.id}:`, err.message)
    }
  }
}
