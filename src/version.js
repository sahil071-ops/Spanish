// ─── App Version History ───────────────────────────────────────────────────────
// Update this file with every push. Add a new entry at the TOP of HISTORY.

export const CURRENT_VERSION = 'v1.2'

export const HISTORY = [
  {
    version: 'v1.2',
    date: '2026-03-08',
    summary: 'Audio, flashcard mastery, vocabulary list, grammar content, adaptive tracking',
    changes: [
      'Audio: smarter Spanish voice selection (Google Español / Mónica preferred), slower default rate (0.85×)',
      'Flashcards: cards now require 3 correct reviews (●●○ dots) before leaving practice queue',
      'New Vocabulary list: searchable/filterable word list with mastery dots and due-date info',
      'Grammar: 50 new exercises — subjunctive (all uses + irregular forms), preterite vs imperfect, conditional, future, lo que / lo de',
      'Adaptive: GrammarPage double-weights your weakest topics automatically',
      'Progress page: "Needs Practice" section shows your worst grammar topics with one-tap focused practice',
    ],
  },
  {
    version: 'v1.1',
    date: '2026-03-08',
    summary: 'Fix app shell and build',
    changes: [
      'Fixed App.jsx: was showing Vite starter template instead of the real app',
      'Added missing reading.json seed data (5 B1 reading passages) — build was failing without it',
    ],
  },
  {
    version: 'v1.0',
    date: '2026-03-08',
    summary: 'Initial project setup',
    changes: [
      'Spanish B1 PWA with flashcards, grammar, reading, listening, and mock exams',
      'Spaced repetition (SM-2), streak tracking, offline support, activity heatmap',
      'Seed content: 60+ grammar exercises, flashcards, reading passages, listening exercises',
    ],
  },
]
