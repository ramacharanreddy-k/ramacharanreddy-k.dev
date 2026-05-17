/**
 * POST /api/chat — streams GPT-5-mini responses for the portfolio chat widget.
 *
 * Request body: { messages: Array<{ role: 'user' | 'assistant'; content: string }> }
 * Response: text/event-stream
 *   - `data: {"delta":"...text..."}` per token chunk
 *   - `data: [DONE]` when complete
 *   - `data: {"error":"..."}` on failure
 *
 * Caching: the system prompt is identical across requests, so OpenAI's automatic
 * prompt caching kicks in (cache hits cost ~3x less than fresh input —
 * GPT-5-mini: $0.075/M cached vs $0.25/M fresh).
 */
import OpenAI from 'openai'
import { buildSystemPrompt } from './_systemPrompt'

interface Env {
  OPENAI_API_KEY: string
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type RequestBody = { messages: ChatMessage[] }

const MODEL = 'gpt-5-mini'
const MAX_USER_MESSAGES = 12 // keep history bounded — visitor convos shouldn't sprawl
const MAX_MESSAGE_LENGTH = 2000 // protect against giant pasted blocks

// Build the system prompt once per Worker instance and reuse.
// Crucial for OpenAI's automatic prompt cache to hit: the system message must be
// byte-identical across requests. We pin it in module scope so every request inside
// the same Worker uses the exact same string — no accidental whitespace drift, etc.
let cachedSystemPrompt: string | null = null
function getSystemPrompt(): string {
  if (cachedSystemPrompt === null) cachedSystemPrompt = buildSystemPrompt()
  return cachedSystemPrompt
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.OPENAI_API_KEY) {
    return jsonError(500, 'OPENAI_API_KEY not configured')
  }

  let body: RequestBody
  try {
    body = await request.json<RequestBody>()
  } catch {
    return jsonError(400, 'Invalid JSON body')
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonError(400, 'messages array required')
  }

  // sanitize: cap message count, cap message length, ensure shape
  const messages = body.messages
    .slice(-MAX_USER_MESSAGES)
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }))

  if (messages.length === 0) {
    return jsonError(400, 'No valid messages')
  }

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

  let openaiStream
  try {
    openaiStream = await openai.chat.completions.create({
      model: MODEL,
      stream: true,
      stream_options: { include_usage: true }, // surface cached_tokens for cache verification
      messages: [{ role: 'system', content: getSystemPrompt() }, ...messages],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OpenAI request failed'
    return jsonError(502, message)
  }

  const encoder = new TextEncoder()
  const sse = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of openaiStream) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`))
          }
          // final chunk (after include_usage) carries token accounting
          if (chunk.usage) {
            const cached = chunk.usage.prompt_tokens_details?.cached_tokens ?? 0
            const total = chunk.usage.prompt_tokens ?? 0
            const hitRate = total > 0 ? Math.round((cached / total) * 100) : 0
            console.log(
              `[chat] tokens prompt=${total} cached=${cached} (${hitRate}%) completion=${chunk.usage.completion_tokens}`,
            )
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Stream interrupted'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(sse, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
