import { useCallback, useRef, useState } from 'react'
import type { Msg } from './chat'

/**
 * Streams chat completions from POST /api/chat (SSE).
 * Wire format per chunk: `data: {"delta":"...text..."}\n\n`
 * Terminator: `data: [DONE]\n\n`
 * Errors: `data: {"error":"..."}\n\n` mid-stream, or non-2xx JSON body.
 */
export function useChatStream() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(
    async (raw: string) => {
      const content = raw.trim()
      if (!content || isLoading) return

      const userMsg: Msg = { role: 'user', content }
      const history = [...messages, userMsg]
      // Optimistically render the user message + an empty assistant slot for the typing indicator
      setMessages([...history, { role: 'assistant', content: '' }])
      setIsLoading(true)
      setError(null)

      const ctrl = new AbortController()
      abortRef.current = ctrl

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: ctrl.signal,
        })

        if (!res.ok) {
          const body: { error?: string } = await res.json().catch(() => ({}))
          throw new Error(body.error || `Request failed (${res.status})`)
        }
        if (!res.body) throw new Error('No response stream')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let assistant = ''

        outer: while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const chunks = buffer.split('\n\n')
          buffer = chunks.pop() ?? ''

          for (const chunk of chunks) {
            if (!chunk.startsWith('data: ')) continue
            const data = chunk.slice(6).trim()
            if (data === '[DONE]') break outer
            if (!data) continue

            let parsed: { delta?: string; error?: string }
            try {
              parsed = JSON.parse(data)
            } catch {
              // Malformed SSE chunk (truncated, garbled) — skip silently
              continue
            }
            if (parsed.error) throw new Error(parsed.error)
            if (typeof parsed.delta === 'string') {
              assistant += parsed.delta
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = { role: 'assistant', content: assistant }
                return next
              })
            }
          }
        }
      } catch (err) {
        // Aborted requests are intentional (close, reset); don't surface as errors.
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Something went wrong')
        // Drop the empty assistant slot if we never received any content
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.content === '') return prev.slice(0, -1)
          return prev
        })
      } finally {
        setIsLoading(false)
        abortRef.current = null
      }
    },
    [messages, isLoading],
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    setIsLoading(false)
  }, [])

  return { messages, isLoading, error, send, reset }
}
