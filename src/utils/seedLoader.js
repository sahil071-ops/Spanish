import { saveContent, getContentCount } from './db.js'
import flashcardsData from '../data/flashcards.json'
import grammarData from '../data/grammar.json'
import readingData from '../data/reading.json'
import listeningData from '../data/listening.json'
import mockExamsData from '../data/mockExams.json'

// Bump this number whenever seed data changes (questions translated, content updated, etc.)
// A version mismatch forces all seed items to be re-written in IndexedDB.
const SEED_VERSION = 4

const SEED_VERSION_KEY = 'spanish-b1-seed-version'

let seedLoaded = false

export async function loadSeedContent() {
  if (seedLoaded) return

  try {
    const storedVersion = parseInt(localStorage.getItem(SEED_VERSION_KEY) || '0', 10)
    const needsRefresh = storedVersion < SEED_VERSION

    const allSeed = [
      ...flashcardsData,
      ...grammarData,
      ...readingData,
      ...listeningData,
      ...mockExamsData,
    ]

    if (needsRefresh) {
      // Force-overwrite all seed items so updated content (e.g. translated questions) is applied
      await saveContent(allSeed)
      localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
      console.log(`[Seed] Refreshed ${allSeed.length} seed items (version ${SEED_VERSION})`)
    } else {
      // Only insert items that don't already exist (normal first-run path)
      const { getDB } = await import('./db.js')
      const db = await getDB()
      const existingIds = new Set((await db.getAllKeys('content')).map(String))
      const newItems = allSeed.filter(item => !existingIds.has(String(item.id)))
      if (newItems.length > 0) {
        await saveContent(newItems)
        console.log(`[Seed] Loaded ${newItems.length} new seed items`)
      }
    }

    seedLoaded = true
  } catch (err) {
    console.error('[Seed] Failed to load seed content:', err)
  }
}

export async function getContentLibrarySize() {
  return getContentCount()
}
