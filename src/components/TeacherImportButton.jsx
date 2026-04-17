import { useState } from 'react'
import { importAllTeacherContent } from '../utils/importTeacherContent.js'

export default function TeacherImportButton() {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const importLog = JSON.parse(localStorage.getItem('spanish-b1-import-log') || '{}')
  const alreadyImported = !!importLog['teacher-chat-v1']

  async function handleImport() {
    setStatus('loading')
    try {
      const res = await importAllTeacherContent()
      setResult(res)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-800">Import complete ✓</p>
        <p className="mt-1 text-xs text-green-600">
          {result.flashcards.added} new flashcards and {result.grammar.added} grammar
          exercises added to your practice queue.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-semibold text-gray-800">Teacher Chat Content</p>
      <p className="mt-1 text-xs text-gray-500">
        Import 159 vocabulary flashcards and 10 grammar topics from your Spanish
        teacher's chat messages into your SRS practice queue.
      </p>
      {alreadyImported && (
        <p className="mt-2 text-xs text-gray-400">
          Last imported: {new Date(importLog['teacher-chat-v1'].importedAt).toLocaleDateString()}
        </p>
      )}
      <button
        onClick={handleImport}
        disabled={status === 'loading'}
        className="mt-3 w-full rounded-lg bg-[#C60B1E] py-2 text-sm font-medium
                   text-white disabled:opacity-50 active:opacity-80"
      >
        {status === 'loading'
          ? 'Importing...'
          : alreadyImported
          ? 'Re-import (add new items only)'
          : 'Import from teacher chat'}
      </button>
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-500">
          Something went wrong. Check the console.
        </p>
      )}
    </div>
  )
}
