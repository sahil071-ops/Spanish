import { openDB } from 'idb'

const DB_NAME = 'spanish-b1-db'
const DB_VERSION = 1

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
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
