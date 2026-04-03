import { openDB } from 'idb'

const DB_NAME = 'spanish-b1-db'
const DB_VERSION = 2

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Content library store
        if (!db.objectStoreNames.contains('content')) {
          const contentStore = db.createObjectStore('content', { keyPath: 'id' })
          contentStore.createIndex('type', 'type')
          contentStore.createIndex('theme', 'theme')
          contentStore.createIndex('source', 'source')
        }
        // Audio cache store
        if (!db.objectStoreNames.contains('audio')) {
          db.createObjectStore('audio', { keyPath: 'id' })
        }
        // Generated content tracker
        if (!db.objectStoreNames.contains('generated')) {
          db.createObjectStore('generated', { keyPath: 'id' })
        }
        // Word lookup cache (v2)
        if (!db.objectStoreNames.contains('word-lookups')) {
          db.createObjectStore('word-lookups', { keyPath: 'word' })
        }
        // Ambient story cache (v2)
        if (!db.objectStoreNames.contains('ambient-stories')) {
          db.createObjectStore('ambient-stories', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllContent(type) {
  const db = await getDB()
  if (type) {
    return db.getAllFromIndex('content', 'type', type)
  }
  return db.getAll('content')
}

export async function getContentById(id) {
  const db = await getDB()
  return db.get('content', id)
}

export async function saveContent(items) {
  const db = await getDB()
  const tx = db.transaction('content', 'readwrite')
  for (const item of items) {
    await tx.store.put(item)
  }
  await tx.done
}

export async function getContentCount() {
  const db = await getDB()
  const counts = {}
  const types = ['flashcard', 'grammar', 'reading', 'listening', 'mockExam']
  for (const type of types) {
    const items = await db.getAllFromIndex('content', 'type', type)
    counts[type] = items.length
  }
  return counts
}

export async function saveAudio(id, blob) {
  const db = await getDB()
  await db.put('audio', { id, blob, createdAt: Date.now() })
}

export async function getAudio(id) {
  const db = await getDB()
  const record = await db.get('audio', id)
  return record?.blob || null
}

export async function markGenerated(batchId, meta) {
  const db = await getDB()
  await db.put('generated', { id: batchId, ...meta, timestamp: Date.now() })
}

export async function getGeneratedBatches() {
  const db = await getDB()
  return db.getAll('generated')
}

export async function contentExists(id) {
  const db = await getDB()
  const item = await db.get('content', id)
  return !!item
}

// ─── Word Lookups ─────────────────────────────────────────────────────────────

export async function getWordLookup(word) {
  const db = await getDB()
  return db.get('word-lookups', word.toLowerCase())
}

export async function saveWordLookup(word, data) {
  const db = await getDB()
  await db.put('word-lookups', { word: word.toLowerCase(), ...data, cachedAt: Date.now() })
}

// ─── Ambient Stories ──────────────────────────────────────────────────────────

export async function getAmbientStories() {
  const db = await getDB()
  return db.getAll('ambient-stories')
}

export async function saveAmbientStory(story) {
  const db = await getDB()
  await db.put('ambient-stories', story)
}

export async function deleteAmbientStory(id) {
  const db = await getDB()
  await db.delete('ambient-stories', id)
}
