// localStorage utilities for progress, streak, and spaced repetition

const PROGRESS_KEY = 'spanish-b1-progress'
const STREAK_KEY = 'spanish-b1-streak'
const SRS_KEY = 'spanish-b1-srs'
const SETTINGS_KEY = 'spanish-b1-settings'

// ─── Settings ────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  sessionLength: 'flexible', // '5-10', '15-20', '30-45', 'flexible'
  voicePreference: 'female', // 'male' | 'female'
  showTranscript: true,
  autoSync: true,
  showHints: true,
  elevenLabsApiKey: '',
  preferredThemes: ['travel', 'work', 'everyday', 'culture'],
}

export function getSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export const DEFAULT_PROGRESS = {
  vocabulary: { mastered: 0, total: 0, reviewed: 0 },
  grammar: { mastered: 0, total: 0, reviewed: 0 },
  reading: { mastered: 0, total: 0, reviewed: 0 },
  listening: { mastered: 0, total: 0, reviewed: 0 },
  totalSessions: 0,
  lastSession: null,
}

export function getProgress() {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY)
    return stored ? { ...DEFAULT_PROGRESS, ...JSON.parse(stored) } : { ...DEFAULT_PROGRESS }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}

export function updateSkillProgress(skill, delta) {
  const progress = getProgress()
  if (!progress[skill]) progress[skill] = { mastered: 0, total: 0, reviewed: 0 }
  progress[skill].reviewed += 1
  if (delta > 0) progress[skill].mastered = Math.min(progress[skill].mastered + delta, progress[skill].total)
  saveProgress(progress)
  return progress
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export function getStreak() {
  try {
    const stored = localStorage.getItem(STREAK_KEY)
    return stored ? JSON.parse(stored) : { current: 0, longest: 0, lastDate: null, history: [] }
  } catch {
    return { current: 0, longest: 0, lastDate: null, history: [] }
  }
}

export function updateStreak() {
  const streak = getStreak()
  const today = new Date().toISOString().split('T')[0]

  if (streak.lastDate === today) return streak

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (streak.lastDate === yesterday) {
    streak.current += 1
  } else if (streak.lastDate !== today) {
    streak.current = 1
  }

  streak.longest = Math.max(streak.longest, streak.current)
  streak.lastDate = today

  if (!streak.history) streak.history = []
  streak.history = [...streak.history.filter(d => d !== today), today].slice(-90)

  localStorage.setItem(STREAK_KEY, JSON.stringify(streak))
  return streak
}

// ─── Spaced Repetition (SM-2) ─────────────────────────────────────────────────

export function getSRSData() {
  try {
    const stored = localStorage.getItem(SRS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function saveSRSData(data) {
  localStorage.setItem(SRS_KEY, JSON.stringify(data))
}

/**
 * SM-2 algorithm
 * @param {string} itemId
 * @param {number} quality - 0 to 5 (0-1 = fail, 2 = hard, 3 = ok, 4 = good, 5 = easy)
 */
export function updateSRSItem(itemId, quality) {
  const data = getSRSData()
  const item = data[itemId] || { ef: 2.5, interval: 1, repetitions: 0, nextReview: Date.now() }

  if (quality >= 3) {
    if (item.repetitions === 0) {
      item.interval = 1
    } else if (item.repetitions === 1) {
      item.interval = 6
    } else {
      item.interval = Math.round(item.interval * item.ef)
    }
    item.repetitions += 1
    item.ef = Math.max(1.3, item.ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  } else {
    item.repetitions = 0
    item.interval = 1
  }

  item.nextReview = Date.now() + item.interval * 24 * 60 * 60 * 1000
  item.lastQuality = quality
  item.lastReviewed = Date.now()

  data[itemId] = item
  saveSRSData(data)
  return item
}

export function getSRSItem(itemId) {
  const data = getSRSData()
  return data[itemId] || null
}

export function getDueItems(allItemIds) {
  const data = getSRSData()
  const now = Date.now()
  return allItemIds.filter(id => {
    const item = data[id]
    if (!item) return true // never reviewed
    return item.nextReview <= now
  })
}

export function getMasteryPercent(itemIds) {
  const data = getSRSData()
  if (!itemIds.length) return 0
  const mastered = itemIds.filter(id => {
    const item = data[id]
    return item && item.repetitions >= 3 && item.ef >= 2.0
  }).length
  return Math.round((mastered / itemIds.length) * 100)
}

// ─── Weekly Activity ──────────────────────────────────────────────────────────

const ACTIVITY_KEY = 'spanish-b1-activity'

export function logActivity() {
  const today = new Date().toISOString().split('T')[0]
  try {
    const stored = localStorage.getItem(ACTIVITY_KEY)
    const activity = stored ? JSON.parse(stored) : {}
    activity[today] = (activity[today] || 0) + 1
    // Keep only last 90 days
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]
    for (const date of Object.keys(activity)) {
      if (date < cutoff) delete activity[date]
    }
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity))
  } catch {}
}

export function getActivityData() {
  try {
    const stored = localStorage.getItem(ACTIVITY_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// ─── Topic Performance (adaptive grammar) ────────────────────────────────────

const TOPIC_KEY = 'spanish-b1-topic-perf'

export function getTopicPerformance() {
  try {
    const stored = localStorage.getItem(TOPIC_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function recordTopicResult(grammarPoint, isCorrect) {
  const data = getTopicPerformance()
  if (!data[grammarPoint]) {
    data[grammarPoint] = { correct: 0, total: 0, lastSeen: null }
  }
  data[grammarPoint].total += 1
  if (isCorrect) data[grammarPoint].correct += 1
  data[grammarPoint].lastSeen = Date.now()
  localStorage.setItem(TOPIC_KEY, JSON.stringify(data))
}

/**
 * Returns topics sorted by accuracy (worst first).
 * Only includes topics with at least minAttempts attempts.
 */
export function getWeakTopics(minAttempts = 2) {
  const data = getTopicPerformance()
  return Object.entries(data)
    .filter(([, v]) => v.total >= minAttempts)
    .map(([topic, v]) => ({
      topic,
      accuracy: Math.round((v.correct / v.total) * 100),
      correct: v.correct,
      total: v.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
}

// ─── Content Rotation (reading & listening) ───────────────────────────────────

const CONTENT_SEEN_KEY = 'spanish-b1-content-seen'
const ROTATION_DAYS = 30

export function markContentSeen(itemId) {
  try {
    const stored = localStorage.getItem(CONTENT_SEEN_KEY)
    const data = stored ? JSON.parse(stored) : {}
    data[itemId] = Date.now()
    localStorage.setItem(CONTENT_SEEN_KEY, JSON.stringify(data))
  } catch {}
}

export function getUnseenContent(allItems) {
  try {
    const stored = localStorage.getItem(CONTENT_SEEN_KEY)
    const seen = stored ? JSON.parse(stored) : {}
    const cutoff = Date.now() - ROTATION_DAYS * 24 * 60 * 60 * 1000
    const unseen = allItems.filter(item => {
      const seenAt = seen[item.id]
      return !seenAt || seenAt < cutoff
    })
    return unseen.length > 0 ? unseen : allItems // fallback: show all if all recently seen
  } catch {
    return allItems
  }
}

export function getNextContentAvailableDate(allItems) {
  try {
    const stored = localStorage.getItem(CONTENT_SEEN_KEY)
    const seen = stored ? JSON.parse(stored) : {}
    const cutoff = Date.now() - ROTATION_DAYS * 24 * 60 * 60 * 1000
    // Find the earliest time an item will become available again
    const seenTimes = allItems.map(item => seen[item.id]).filter(Boolean)
    if (seenTimes.length < allItems.length) return null // some items never seen
    const earliestExpiry = Math.min(...seenTimes) + ROTATION_DAYS * 24 * 60 * 60 * 1000
    if (earliestExpiry <= Date.now()) return null
    return new Date(earliestExpiry)
  } catch {
    return null
  }
}

// ─── User Context (for adaptive AI prompts) ───────────────────────────────────

export function getUserContext() {
  const topicPerf = getTopicPerformance()
  const weak = []
  const strong = []
  const recentMistakes = []

  for (const [topic, v] of Object.entries(topicPerf)) {
    if (v.total < 1) continue
    const acc = Math.round((v.correct / v.total) * 100)
    if (acc < 60) weak.push(topic)
    else if (acc >= 85) strong.push(topic)
    if (acc < 50 && v.total >= 2) recentMistakes.push(topic)
  }

  return {
    level: 'B1',
    weakGrammarTopics: weak,
    strongGrammarTopics: strong,
    recentMistakes: recentMistakes.slice(0, 5),
  }
}

// ─── Captured Vocabulary (word-lookup → flashcard) ────────────────────────────

const CAPTURED_KEY = 'spanish-b1-captured-words'

export function getCapturedWords() {
  try {
    const stored = localStorage.getItem(CAPTURED_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveCapturedWord(word) {
  const words = getCapturedWords()
  const exists = words.find(w => w.word === word.word)
  if (!exists) {
    words.unshift({ ...word, capturedAt: Date.now() })
    localStorage.setItem(CAPTURED_KEY, JSON.stringify(words))
  }
}

export function removeCapturedWord(wordStr) {
  const words = getCapturedWords().filter(w => w.word !== wordStr)
  localStorage.setItem(CAPTURED_KEY, JSON.stringify(words))
}

// ─── Export / Import ──────────────────────────────────────────────────────────

export function exportAllData() {
  return {
    progress: getProgress(),
    streak: getStreak(),
    srs: getSRSData(),
    settings: getSettings(),
    activity: getActivityData(),
    exportedAt: new Date().toISOString(),
  }
}

export function importAllData(data) {
  if (data.progress) localStorage.setItem(PROGRESS_KEY, JSON.stringify(data.progress))
  if (data.streak) localStorage.setItem(STREAK_KEY, JSON.stringify(data.streak))
  if (data.srs) localStorage.setItem(SRS_KEY, JSON.stringify(data.srs))
  if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings))
  if (data.activity) localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data.activity))
}

export function resetAllProgress() {
  localStorage.removeItem(PROGRESS_KEY)
  localStorage.removeItem(STREAK_KEY)
  localStorage.removeItem(SRS_KEY)
  localStorage.removeItem(ACTIVITY_KEY)
  localStorage.removeItem(TOPIC_KEY)
  localStorage.removeItem(CONTENT_SEEN_KEY)
}
