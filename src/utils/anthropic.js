import { saveContent, markGenerated, getGeneratedBatches, saveAmbientStory, getAmbientStories } from './db.js'
import { getUserContext } from './storage.js'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const MODEL = 'claude-sonnet-4-6'

const THEMES = ['travel & transport', 'work & professional', 'everyday life', 'news & culture']

const GRAMMAR_TOPICS = [
  'Pretérito indefinido – irregular verbs (ser/ir, hacer, tener, estar, poder, poner, querer, venir, decir, saber, dar, ver, traer, oír)',
  'Indefinido vs imperfecto – completed events vs background states and habits',
  'Imperativo afirmativo – tú regular and irregular (ven, di, haz, ten, pon, sal, sé, ve)',
  'Imperativo negativo – tú uses present subjunctive (no hables, no vayas, no hagas)',
  'Condicional simple – polite requests, advice (en tu lugar), hypothetical conditions',
  'Present subjunctive – triggers (querer que, esperar que, dudar que, cuando + future)',
  'Present subjunctive – irregular forms (sea, tenga, haga, vaya, sepa, pueda)',
  'Ser vs estar – permanent vs temporary states',
  'Por vs para – purpose, cause, duration vs destination, deadline, opinion',
  'Direct and Indirect Object Pronouns – lo/la/los/las, me/te/le/les/nos, double pronouns le→se',
]

function getBatchId() {
  const today = new Date().toISOString().split('T')[0]
  return `generated-${today}`
}

function userContextBlock(ctx) {
  if (!ctx) return ''
  const lines = []
  if (ctx.weakGrammarTopics?.length) lines.push(`Learner's weak grammar topics: ${ctx.weakGrammarTopics.join(', ')}`)
  if (ctx.strongGrammarTopics?.length) lines.push(`Learner's strong grammar topics (avoid over-testing): ${ctx.strongGrammarTopics.join(', ')}`)
  if (ctx.recentMistakes?.length) lines.push(`Recent mistake areas: ${ctx.recentMistakes.join(', ')}`)
  lines.push(`Learner level: ${ctx.level || 'B1'}`)
  return lines.length ? `\nLEARNER CONTEXT:\n${lines.join('\n')}\n` : ''
}

export async function generateDailyContent() {
  if (!navigator.onLine || !API_KEY) return null

  const batchId = getBatchId()
  const batches = await getGeneratedBatches()
  const alreadyGenerated = batches.find(b => b.id === batchId)
  if (alreadyGenerated) return null

  console.log('[AI] Generating daily content batch...')

  const ctx = getUserContext()

  try {
    const prompt = buildDailyPrompt(ctx)
    const response = await callClaude(prompt)
    const content = parseGeneratedContent(response)

    if (content && content.length > 0) {
      await saveContent(content)
      await markGenerated(batchId, { count: content.length, themes: THEMES })
      console.log(`[AI] Generated and saved ${content.length} items`)

      // Proactively cache 2 ambient stories if fewer than 3 are cached
      try {
        const existing = await getAmbientStories()
        if (existing.length < 3) {
          const storyCount = Math.min(2, 3 - existing.length)
          for (let i = 0; i < storyCount; i++) {
            await generateAndCacheAmbientStory(ctx)
          }
        }
      } catch (e) {
        console.warn('[AI] Ambient story pre-cache failed:', e)
      }

      return content
    }
  } catch (err) {
    console.error('[AI] Content generation failed:', err)
  }

  return null
}

function buildDailyPrompt(ctx) {
  const timestamp = Date.now()
  const ctxBlock = userContextBlock(ctx)

  // Weight grammar topic toward weak topics
  let grammarTopics
  if (ctx?.weakGrammarTopics?.length) {
    // 3× weak topics in pool
    const weakMatches = GRAMMAR_TOPICS.filter(t =>
      ctx.weakGrammarTopics.some(w => t.toLowerCase().includes(w.toLowerCase().split(' ')[0]))
    )
    grammarTopics = weakMatches.length > 0
      ? [...weakMatches, ...weakMatches, ...weakMatches, ...GRAMMAR_TOPICS].slice(0, 12)
      : GRAMMAR_TOPICS
  } else {
    grammarTopics = GRAMMAR_TOPICS
  }

  const randomTopic = grammarTopics[Math.floor(Math.random() * grammarTopics.length)]
  const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)]

  return `You are generating Spanish B1 exam preparation content. Create fresh, varied content for a language learning app.
${ctxBlock}
Today's grammar focus: ${randomTopic}
Today's theme focus: ${randomTheme}

Generate the following as a valid JSON object with these exact keys:

{
  "flashcards": [ /* 20 items */ ],
  "grammar": [ /* 10 items */ ],
  "reading": [ /* 4 items */ ],
  "listening": [ /* 3 items */ ]
}

FLASHCARD format (20 items, B1 level Spanish vocabulary):
{
  "id": "gen-fc-${timestamp}-1",
  "type": "flashcard",
  "theme": "travel|work|everyday|culture",
  "front": "Spanish word or phrase",
  "back": "English translation",
  "example": "Example sentence in Spanish using this word",
  "difficulty": 1-3,
  "source": "generated"
}

GRAMMAR format (10 items, fill-in-the-blank). Focus today's grammar exercises on: ${randomTopic}
{
  "id": "gen-gr-${timestamp}-1",
  "type": "grammar",
  "theme": "travel|work|everyday|culture",
  "sentence": "Spanish sentence with ___ for the blank",
  "options": ["option1", "option2", "option3", "option4"],
  "answer": "correct option",
  "explanation": "English explanation of why this is correct and what the grammar rule is",
  "grammarPoint": "specific grammar concept name matching the focus topic",
  "difficulty": 1-3,
  "source": "generated"
}

READING format (4 items, 150-250 word passages on varied topics):
{
  "id": "gen-rd-${timestamp}-1",
  "type": "reading",
  "theme": "travel|work|everyday|culture",
  "title": "Título del texto en español",
  "passage": "150-250 word Spanish passage",
  "questions": [
    {
      "id": "gen-rd-${timestamp}-1-q1",
      "question": "Pregunta en español sobre el texto",
      "options": ["Opción A en español", "Opción B en español", "Opción C en español", "Opción D en español"],
      "answer": "La opción correcta (must match one of the options exactly)"
    }
  ],
  "difficulty": 1-3,
  "source": "generated"
}

LISTENING format (3 items, 150-250 word scripts — mix of dialogues and monologues):
{
  "id": "gen-ls-${timestamp}-1",
  "type": "listening",
  "theme": "travel|work|everyday|culture",
  "title": "Título en español",
  "format": "dialogue|monologue",
  "script": "150-250 word Spanish dialogue or monologue",
  "transcript": "same as script",
  "duration": 90,
  "questions": [
    {
      "id": "gen-ls-${timestamp}-1-q1",
      "question": "Pregunta en español sobre el audio",
      "options": ["Opción A en español", "Opción B en español", "Opción C en español", "Opción D en español"],
      "answer": "La opción correcta (must match one of the options exactly)"
    }
  ],
  "difficulty": 1-3,
  "source": "generated"
}

CRITICAL RULES:
- Respond with ONLY the JSON object, no markdown, no explanation
- ALL reading and listening questions, options, and answers MUST be written in Spanish
- Grammar explanations should be in English (to help the learner understand the rule)
- Make content varied, interesting, and genuinely B1 appropriate
- Ensure all Spanish text is grammatically correct
- Include exactly 4 questions per reading passage
- Include exactly 4 questions per listening script
- The "answer" field must exactly match one of the "options" strings`
}

// ─── Feature 1: Fresh Grammar Drill ──────────────────────────────────────────

export async function generateFreshDrill(topic) {
  if (!navigator.onLine || !API_KEY) throw new Error('No connection or API key')

  const timestamp = Date.now()
  const ctx = getUserContext()
  const ctxBlock = userContextBlock(ctx)

  const prompt = `You are generating Spanish B1 grammar exercises.
${ctxBlock}
Generate exactly 5 fill-in-the-blank grammar exercises focused on: ${topic}

Return ONLY a valid JSON array of 5 objects with this format:
[
  {
    "id": "drill-${timestamp}-1",
    "type": "grammar",
    "theme": "everyday",
    "sentence": "Spanish sentence with ___ for the blank",
    "options": ["option1", "option2", "option3", "option4"],
    "answer": "correct option",
    "explanation": "English explanation of the grammar rule",
    "grammarPoint": "${topic}",
    "difficulty": 2,
    "source": "generated"
  }
]

RULES:
- Respond with ONLY the JSON array, no markdown, no preamble
- All Spanish must be grammatically correct and B1 appropriate
- Make each exercise test a different aspect of the topic
- The "answer" must exactly match one of the "options"`

  const response = await callClaude(prompt)
  return parseDrillExercises(response)
}

function parseDrillExercises(text) {
  try {
    const arrMatch = text.match(/\[[\s\S]*\]/)
    if (!arrMatch) throw new Error('No JSON array in response')
    const parsed = JSON.parse(arrMatch[0])
    return parsed.filter(item => item.id && item.type === 'grammar')
  } catch (err) {
    console.error('[AI] Failed to parse drill exercises:', err)
    return []
  }
}

// ─── Feature 2: Generate Reading Passage ─────────────────────────────────────

export async function generateReadingPassage(theme) {
  if (!navigator.onLine || !API_KEY) throw new Error('No connection or API key')

  const timestamp = Date.now()
  const ctx = getUserContext()
  const ctxBlock = userContextBlock(ctx)
  const chosenTheme = theme || THEMES[Math.floor(Math.random() * THEMES.length)]

  const prompt = `You are generating a Spanish B1 reading comprehension exercise.
${ctxBlock}
Theme: ${chosenTheme}

Return ONLY a valid JSON object:
{
  "id": "gen-rd-${timestamp}",
  "type": "reading",
  "theme": "${chosenTheme.split(' ')[0]}",
  "title": "Título del texto en español",
  "passage": "200-250 word Spanish passage on the theme",
  "questions": [
    {
      "id": "gen-rd-${timestamp}-q1",
      "question": "Pregunta en español sobre el texto",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "answer": "La opción correcta (must match one of the options exactly)"
    },
    {
      "id": "gen-rd-${timestamp}-q2",
      "question": "Segunda pregunta en español",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "answer": "La opción correcta"
    },
    {
      "id": "gen-rd-${timestamp}-q3",
      "question": "Tercera pregunta en español",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "answer": "La opción correcta"
    },
    {
      "id": "gen-rd-${timestamp}-q4",
      "question": "Cuarta pregunta en español",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "answer": "La opción correcta"
    }
  ],
  "difficulty": 2,
  "source": "generated"
}

ALL questions and options must be in Spanish. Respond with ONLY the JSON object.`

  const response = await callClaude(prompt)
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const item = JSON.parse(jsonMatch[0])
    if (item.id && item.type === 'reading') {
      await saveContent([item])
      return item
    }
    return null
  } catch (err) {
    console.error('[AI] Failed to parse reading passage:', err)
    return null
  }
}

// ─── Feature 4: Word Lookup ───────────────────────────────────────────────────

export async function lookupWord(word) {
  if (!navigator.onLine || !API_KEY) throw new Error('No connection or API key')

  const prompt = `Look up the Spanish word or phrase: "${word}"

Return ONLY a valid JSON object:
{
  "word": "${word}",
  "pos": "noun|verb|adjective|adverb|pronoun|preposition|conjunction",
  "gender": "masculine|feminine|neutral|null",
  "english": "English translation",
  "example": "Example sentence in Spanish using this word",
  "exampleTranslation": "English translation of the example",
  "level": "A1|A2|B1|B2|C1"
}

Respond with ONLY the JSON object, no markdown.`

  const response = await callClaude(prompt, 500)
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('[AI] Failed to parse word lookup:', err)
    return null
  }
}

// ─── Feature 5: Ambient Story ─────────────────────────────────────────────────

async function generateAndCacheAmbientStory(ctx) {
  const timestamp = Date.now()
  const ctxBlock = userContextBlock(ctx)
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)]

  const prompt = `Generate a Spanish B1 listening story for ambient learning.
${ctxBlock}
Theme: ${theme}

Return ONLY a valid JSON object:
{
  "id": "ambient-${timestamp}",
  "theme": "${theme}",
  "title": "Título en español",
  "story": "400-600 word Spanish story or monologue, natural spoken style, B1 level",
  "questions": [
    {
      "id": "ambient-${timestamp}-q1",
      "question": "Pregunta en español sobre la historia",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "answer": "La opción correcta"
    },
    {
      "id": "ambient-${timestamp}-q2",
      "question": "Segunda pregunta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "answer": "La opción correcta"
    },
    {
      "id": "ambient-${timestamp}-q3",
      "question": "Tercera pregunta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "answer": "La opción correcta"
    }
  ],
  "cachedAt": ${timestamp}
}

ALL questions and options in Spanish. Respond with ONLY the JSON object.`

  const response = await callClaude(prompt, 2000)
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const story = JSON.parse(jsonMatch[0])
    if (story.id && story.story) {
      await saveAmbientStory(story)
      return story
    }
    return null
  } catch (err) {
    console.error('[AI] Ambient story parse failed:', err)
    return null
  }
}

export async function getOrGenerateAmbientStory() {
  if (!API_KEY) throw new Error('No API key')
  const stories = await getAmbientStories()
  if (stories.length > 0) {
    // Use the oldest cached story and rotate
    stories.sort((a, b) => (a.cachedAt || 0) - (b.cachedAt || 0))
    return stories[0]
  }
  // Nothing cached — generate now
  const ctx = getUserContext()
  return generateAndCacheAmbientStory(ctx)
}

// ─── Core API call ────────────────────────────────────────────────────────────

async function callClaude(prompt, maxTokens = 8000) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0]?.text || ''
}

function parseGeneratedContent(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    const parsed = JSON.parse(jsonMatch[0])
    const items = []

    if (parsed.flashcards) items.push(...parsed.flashcards)
    if (parsed.grammar) items.push(...parsed.grammar)
    if (parsed.reading) items.push(...parsed.reading)
    if (parsed.listening) items.push(...parsed.listening)

    return items.filter(item => item.id && item.type)
  } catch (err) {
    console.error('[AI] Failed to parse generated content:', err)
    return []
  }
}
