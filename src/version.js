// ─── App Version History ───────────────────────────────────────────────────────
// Update this file with every push. Add a new entry at the TOP of HISTORY.

export const CURRENT_VERSION = 'v1.6'

export const HISTORY = [
  {
    version: 'v1.6',
    date: '2026-03-09',
    summary: 'Massive content expansion + grammar topics from teacher',
    changes: [
      'Grammar: 50 new exercises (gr-111 to gr-160) covering teacher\'s requested topics — pretérito indefinido irregulars (ser/ir, hacer, tener, estar, poder, poner, querer, venir, decir, saber, dar, ver, traer, oír), indefinido vs imperfecto contrasts, affirmative & negative imperatives (regular + all 8 irregular tú forms), and extra condicional simple',
      'Reading: expanded from 5 to 15 passages (el flamenco, dieta mediterránea, emprendimiento joven, sistema educativo, La Tomatina, Camino de Santiago, beneficios del deporte, Sagrada Familia, plástico, Islas Canarias)',
      'Listening: expanded from 6 to 16 exercises (en el médico, reservando hotel, festival de cine, conversación entre vecinos, podcast sobre teletrabajo, tienda de ropa, visita al Prado, vacaciones en familia, negociando aumento, Slow Food)',
      'Auto-generator fix: questions and answers in reading/listening now generated in Spanish; grammar focus cycles through teacher\'s topics; volume tripled (4 reading + 3 listening per day)',
      'Seed version bump (v3) forces all users to receive the new content automatically',
    ],
  },
  {
    version: 'v1.5',
    date: '2026-03-08',
    summary: 'Translate reading and listening questions to Spanish',
    changes: [
      'All reading comprehension questions and answer options are now in Spanish',
      'All listening comprehension questions and answer options are now in Spanish',
      'Listening exercise titles also translated to Spanish',
      'Seed version bump (v2) forces existing users to receive the updated questions automatically',
    ],
  },
  {
    version: 'v1.4',
    date: '2026-03-08',
    summary: 'Fix version history visibility + grammar answer spoiler',
    changes: [
      'Version history now opens expanded by default so it is immediately visible in Settings',
      'Grammar exercises no longer show the grammarPoint badge (e.g. "irregular (hacer → haga)") before you answer — it was giving away the answer; badge now appears only after submitting',
    ],
  },
  {
    version: 'v1.3',
    date: '2026-03-08',
    summary: 'Fix PWA auto-update banner',
    changes: [
      'UpdateBanner now correctly fires when a new version is deployed — previously setUpdateAvailable was never called so the banner never showed',
      'SW registration moved to main.jsx using registerSW() from virtual:pwa-register; fires pwa-update-available custom event',
      'AppContext listens for that event to set updateAvailable state',
      'Added version history changelog section to Settings page',
    ],
  },
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
