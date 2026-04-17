// ─── App Version History ───────────────────────────────────────────────────────
// Update this file with every push. Add a new entry at the TOP of HISTORY.

export const CURRENT_VERSION = 'v2.1'

export const HISTORY = [
  {
    version: 'v2.1',
    date: '2026-04-17',
    summary: 'Teacher chat content import: 159 flashcards + 10 grammar topics',
    changes: [
      'Added 159 vocabulary flashcards from teacher chat (tc-001 to tc-159), covering idioms, verbs, work, culture, and grammar structures',
      'Added 10 grammar topics from teacher chat with worked exercises: Double Object Pronouns, Temporal Subjunctive, PENDO triggers, Creer/Me parece, Emotion Verbs, Si Clauses, Irregular Future/Conditional, Imperative (Ver/Ser), Llevar+sin, Duration structures (Hace/Desde hace)',
      'New "Content Sources" section in Settings with TeacherImportButton — import or re-import teacher content at any time',
      'Silent first-run background import: teacher content is automatically loaded on the first app launch (no UI blocker)',
      'Import is idempotent — running it again only adds items not yet in the database',
    ],
  },
  {
    version: 'v2.0',
    date: '2026-04-03',
    summary: 'Major feature upgrade: Fresh Drill, Word Lookup, Grammar Mastery Table, Ambient Listen, Adaptive AI',
    changes: [
      'Feature 1 – Fresh Grammar Drill: tap "Fresh Drill" on any grammar session to instantly generate 5 new AI questions tailored to that topic',
      'Feature 2 – Reading rotation extended from 14 to 30 days; "Generate New Story" button creates a fresh AI passage when all content has been seen',
      'Feature 3 – Full Grammar Topic Mastery Table on Progress page: every topic shown with Accuracy%, Attempts, and Status badge (Untested/Weak/OK/Strong); sortable by accuracy, attempts, or name; tap any topic for a detail sheet with drill and practice buttons; top 5 strong topics shown as green chips',
      'Feature 4 – Word Lookup: tap any Spanish word in Reading, Listening, or Ambient stories to open a bottom sheet with POS, gender, English translation, example sentence, and "Add to Vocabulary" button; lookups cached in IndexedDB; "My Captured Words" section added to Vocabulary page',
      'Feature 5 – Ambient Listen mode: AI-generated 400-600 word Spanish stories with Web Speech playback, tappable transcript, 3 comprehension questions; accessible from Practice page; stories pre-cached during daily sync',
      'Feature 6 – Adaptive difficulty: grammar sessions now apply 3× weighting to weak topics (<60%) and exclude mastered topics (>85%) when enough content remains; flashcard new-card queue prioritises themes you struggle with; every AI generation call includes your weak/strong topics as context; "Today\'s focus" chip on Home shows your weakest grammar topic',
      'IndexedDB upgraded to v2 with new word-lookups and ambient-stories stores',
    ],
  },
  {
    version: 'v1.7',
    date: '2026-03-13',
    summary: 'Proper SRS, content rotation, ODP grammar, 400 new flashcards',
    changes: [
      'Flashcard SRS fix: practice mode now shows only cards due for review (SRS interval expired) plus up to 10 new cards per session — you will no longer see the same cards back-to-back every day',
      '"All caught up" screen appears when no cards are due, showing when the next review session is scheduled',
      'Reading & listening 14-day rotation: each passage/audio is hidden for 14 days after you complete it, so you never see the same story twice in a fortnight',
      'Grammar: 20 new exercises (gr-161 to gr-180) covering Direct and Indirect Object Pronouns — lo/la/los/las, me/te/le/nos/os/les, double pronouns (le→se), position rules, gustar-type verbs',
      'Flashcards: 400 new seed words (fc-301 to fc-700) covering health, environment, technology, emotions, housing, food, transport, work/economy, education, sports, and connectors/expressions',
      'Seed version bump (v4) forces all users to receive the new content automatically',
    ],
  },
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
