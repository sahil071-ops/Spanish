import { saveContent, markGenerated, getGeneratedBatches } from './db.js'

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
  'Pluperfect subjunctive – si clauses with past unreal conditions',
]

function getBatchId() {
  const today = new Date().toISOString().split('T')[0]
  return `generated-${today}`
}

export async function generateDailyContent() {
  if (!navigator.onLine || !API_KEY) return null

  const batchId = getBatchId()
  const batches = await getGeneratedBatches()
  const alreadyGenerated = batches.find(b => b.id === batchId)
  if (alreadyGenerated) return null

  console.log('[AI] Generating daily content batch...')

  try {
    const prompt = buildPrompt()
    const response = await callClaude(prompt)
    const content = parseGeneratedContent(response)

    if (content && content.length > 0) {
      await saveContent(content)
      await markGenerated(batchId, { count: content.length, themes: THEMES })
      console.log(`[AI] Generated and saved ${content.length} items`)
      return content
    }
  } catch (err) {
    console.error('[AI] Content generation failed:', err)
  }

  return null
}

function buildPrompt() {
  const timestamp = Date.now()
  const randomTopic = GRAMMAR_TOPICS[Math.floor(Math.random() * GRAMMAR_TOPICS.length)]
  const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)]
  return `You are generating Spanish B1 exam preparation content. Create fresh, varied content for a language learning app.

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

async function callClaude(prompt) {
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
      max_tokens: 8000,
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
    // Extract JSON from response
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
