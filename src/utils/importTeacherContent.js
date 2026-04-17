// Imports teacher chat content into the existing 'content' IndexedDB store.
// Adapted to match the actual DB: name='spanish-b1-db', version=2, store='content'.
import { saveContent, contentExists } from './db.js'
import teacherFlashcardsRaw from '../data/teacher-flashcards.json'
import teacherGrammarRaw from '../data/teacher-grammar.json'

const IMPORT_LOG_KEY = 'spanish-b1-import-log'
const IMPORT_VERSION = 'teacher-chat-v1'

// ─── Flashcard Adapter ────────────────────────────────────────────────────────

function adaptFlashcard(card) {
  return {
    id: card.id,
    type: 'flashcard',
    theme: card.theme,
    front: card.spanish,
    back: card.english,
    example: card.example,
    difficulty: 2,
    source: card.source,
  }
}

// ─── Grammar Options Generator ────────────────────────────────────────────────
// Grammar exercises from the teacher JSON don't have MCQ options arrays.
// This map provides 3 plausible distractors for each exercise answer so they
// can be rendered as multiple-choice in GrammarPage.

const DISTRACTORS = {
  // tcg-001 Double Object Pronouns
  'se lo':  ['le lo', 'me lo', 'te lo'],
  'se las': ['les las', 'se los', 'me las'],
  'te la':  ['me la', 'se la', 'le la'],
  // tcg-002 Temporal subjunctive
  'llegues':  ['llegas', 'llegué', 'llegara'],
  'termines': ['terminas', 'terminé', 'terminara'],
  'vuelva':   ['vuelve', 'volverá', 'volvió'],
  'hace':     ['haga', 'hará', 'hizo'],
  // tcg-003 PENDO subjunctive
  'tenga': ['tiene', 'tendrá', 'tenía'],
  'sepa':  ['sabe', 'sabrá', 'sabía'],
  'sea':   ['es', 'será', 'fue'],
  'es':    ['sea', 'será', 'fue'],
  // tcg-004 Creer / Me parece
  'está':  ['esté', 'estará', 'estaba'],
  'pueda': ['puede', 'podrá', 'podía'],
  // tcg-005 Emotion verbs
  'hayas aprobado': ['has aprobado', 'habías aprobado', 'aprobaste'],
  'llegue': ['llega', 'llegará', 'llegó'],
  // tcg-006 Si clauses
  'tuviera / aprendería': ['tendría / aprendería', 'tuviera / aprendió', 'tiene / aprenderá'],
  'pudiera / viviría':    ['podría / viviría', 'pudiera / vivió', 'puede / vivirá'],
  'harías / ganaras':     ['haría / ganaras', 'harías / ganarías', 'hacías / ganabas'],
  // tcg-007 Irregular future/conditional
  'saldré':  ['salgo', 'salía', 'saldría'],
  'vendría': ['vendrá', 'vine', 'vendré'],
  'podrás':  ['puedes', 'podrías', 'podías'],
  'sabré':   ['sé', 'sabría', 'sabía'],
  // tcg-008 Imperative
  'veas': ['ves', 'verás', 'vieras'],
  'sé':   ['sea', 'seas', 'ser'],
  // tcg-009 Llevar + sin
  'Llevo':  ['Desde', 'Hace', 'Desde hace'],
  'desde':  ['desde hace', 'hace', 'para'],
  // tcg-010 Duration structures
  'Hace / que':    ['Desde hace / que', 'Desde / que', 'Llevo / que'],
  'desde hace':    ['desde', 'hace', 'llevar'],
  'Cuánto / hace': ['Cuánto / desde', 'Cuánto / llevo', 'Desde / hace'],
}

function makeOptions(answer) {
  const distractors = DISTRACTORS[answer]
  if (distractors && distractors.length >= 3) {
    const opts = [answer, ...distractors]
    return opts.sort(() => Math.random() - 0.5)
  }
  // Generic fallback — answer is always included
  return [answer, answer + ' (incorrecto)', 'ninguna de estas opciones', 'no aplica'].sort(() => Math.random() - 0.5)
}

// ─── Grammar Adapter ──────────────────────────────────────────────────────────

function adaptGrammarExercise(exercise, topic) {
  return {
    id: exercise.id,
    type: 'grammar',
    theme: 'everyday',
    sentence: exercise.sentence,
    options: makeOptions(exercise.answer),
    answer: exercise.answer,
    explanation: exercise.explanation,
    grammarPoint: topic.topic,
    difficulty: 2,
    source: topic.source,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function importTeacherFlashcards(flashcards) {
  let added = 0
  let skipped = 0
  const toSave = []

  for (const card of flashcards) {
    const exists = await contentExists(card.id)
    if (!exists) {
      toSave.push(adaptFlashcard(card))
      added++
    } else {
      skipped++
    }
  }

  if (toSave.length > 0) {
    await saveContent(toSave)
  }

  return { added, skipped }
}

export async function importTeacherGrammar(grammarTopics) {
  let added = 0
  let skipped = 0
  const toSave = []

  for (const topic of grammarTopics) {
    for (const exercise of topic.exercises) {
      const exists = await contentExists(exercise.id)
      if (!exists) {
        toSave.push(adaptGrammarExercise(exercise, topic))
        added++
      } else {
        skipped++
      }
    }
  }

  if (toSave.length > 0) {
    await saveContent(toSave)
  }

  return { added, skipped }
}

export async function importAllTeacherContent() {
  const fcResult = await importTeacherFlashcards(teacherFlashcardsRaw)
  const grResult = await importTeacherGrammar(teacherGrammarRaw)

  const log = JSON.parse(localStorage.getItem(IMPORT_LOG_KEY) || '{}')
  log[IMPORT_VERSION] = {
    importedAt: new Date().toISOString(),
    flashcardsAdded: fcResult.added,
    grammarExercisesAdded: grResult.added,
  }
  localStorage.setItem(IMPORT_LOG_KEY, JSON.stringify(log))

  return { flashcards: fcResult, grammar: grResult }
}
