import { saveContent, markGenerated, getGeneratedBatches } from './db.js'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const MODEL = 'claude-sonnet-4-20250514'

const WEAK_AREAS = ['Grammar & verb conjugations', 'Vocabulary', 'Reading comprehension', 'Listening & speaking']
const THEMES = ['travel & transport', 'work & professional', 'everyday life', 'news & culture']

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
  return `You are generating Spanish B1 exam preparation content. Create fresh, varied content for a language learning app.

User's weak areas: ${WEAK_AREAS.join(', ')}
Topics to cover: ${THEMES.join(', ')}

Generate the following as a valid JSON object with these exact keys:

{
  "flashcards": [ /* 20 items */ ],
  "grammar": [ /* 10 items */ ],
  "reading": [ /* 2 items */ ],
  "listening": [ /* 1 item */ ]
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

GRAMMAR format (10 items, fill-in-the-blank):
{
  "id": "gen-gr-${timestamp}-1",
  "type": "grammar",
  "theme": "travel|work|everyday|culture",
  "sentence": "Spanish sentence with ___ for the blank",
  "options": ["option1", "option2", "option3", "option4"],
  "answer": "correct option",
  "explanation": "English explanation of why this is correct",
  "grammarPoint": "grammar concept name",
  "difficulty": 1-3,
  "source": "generated"
}

READING format (2 items):
{
  "id": "gen-rd-${timestamp}-1",
  "type": "reading",
  "theme": "travel|work|everyday|culture",
  "title": "Passage title",
  "passage": "150-250 word Spanish passage",
  "questions": [
    {
      "id": "gen-rd-${timestamp}-1-q1",
      "question": "English question",
      "options": ["A", "B", "C", "D"],
      "answer": "correct option"
    }
  ],
  "difficulty": 1-3,
  "source": "generated"
}

LISTENING format (1 item):
{
  "id": "gen-ls-${timestamp}-1",
  "type": "listening",
  "theme": "travel|work|everyday|culture",
  "title": "Title",
  "format": "dialogue|monologue",
  "script": "150-250 word Spanish text",
  "transcript": "same as script",
  "duration": 90,
  "questions": [
    {
      "id": "gen-ls-${timestamp}-1-q1",
      "question": "English question",
      "options": ["A", "B", "C", "D"],
      "answer": "correct option"
    }
  ],
  "difficulty": 1-3,
  "source": "generated"
}

IMPORTANT:
- Respond with ONLY the JSON object, no markdown, no explanation
- Make content varied, interesting, and genuinely B1 appropriate
- Ensure all Spanish text is grammatically correct
- Include at least 3 reading comprehension questions per passage
- Include at least 3 questions per listening script`
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
