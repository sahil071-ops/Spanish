import { saveContent, contentExists, getContentCount } from './db.js'
import flashcardsData from '../data/flashcards.json'
import grammarData from '../data/grammar.json'
import readingData from '../data/reading.json'
import listeningData from '../data/listening.json'
import mockExamsData from '../data/mockExams.json'

let seedLoaded = false

export async function loadSeedContent() {
  if (seedLoaded) return

  try {
    const allSeed = [
      ...flashcardsData,
      ...grammarData,
      ...readingData,
      ...listeningData,
      ...mockExamsData,
    ]

    // Only insert items that don't already exist
    const newItems = []
    for (const item of allSeed) {
      const exists = await contentExists(item.id)
      if (!exists) newItems.push(item)
    }

    if (newItems.length > 0) {
      await saveContent(newItems)
      console.log(`[Seed] Loaded ${newItems.length} new seed items`)
    }

    seedLoaded = true
  } catch (err) {
    console.error('[Seed] Failed to load seed content:', err)
  }
}

export async function getContentLibrarySize() {
  return getContentCount()
}
