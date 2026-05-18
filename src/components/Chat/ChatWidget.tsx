import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { starterPrompts } from './chat'
import { useChatStream } from './useChatStream'
import { useModalClose } from './useModalClose'

/**
 * Spotlight behavior + paper-card visual language.
 * - Desktop: top-center summoned panel, ~620px wide.
 * - Mobile (<sm): full-width bottom sheet so the on-screen keyboard doesn't push it off.
 */
export function ChatWidget({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { messages, isLoading, error, send, reset } = useChatStream()
  const [input, setInput] = useState('')
  const widgetRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useModalClose(isOpen, onClose)

  // click-outside-to-close (skip the chat trigger so it can toggle properly)
  useEffect(() => {
    if (!isOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-chat-trigger]')) return
      if (widgetRef.current && !widgetRef.current.contains(target as Node)) {
        onClose()
      }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', onMouseDown), 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [isOpen, onClose])

  // focus trap — keep Tab cycling inside the widget
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !widgetRef.current) return
      const focusables = widgetRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  // auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // focus the input when the widget opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const isEmpty = messages.length === 0

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return
    const prompt = input
    setInput('')
    void send(prompt)
  }

  const onInputKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const startWithPrompt = (prompt: string) => {
    if (isLoading) return
    void send(prompt)
  }

  return (
    <>
      <style>{`
        @keyframes chat-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes chat-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes chat-glow {
          0%, 100% {
            box-shadow:
              0 40px 100px -10px rgba(0,0,0,0.6),
              0 0 0 1px rgba(6,182,212,0.18),
              0 0 80px -10px rgba(6,182,212,0.22);
          }
          50% {
            box-shadow:
              0 40px 100px -10px rgba(0,0,0,0.6),
              0 0 0 1px rgba(6,182,212,0.28),
              0 0 110px -10px rgba(6,182,212,0.4);
          }
        }
        @keyframes chat-dot {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0) }
          40% { opacity: 1; transform: translateY(-2px) }
        }
        .chat-backdrop { animation: chat-backdrop-in 200ms ease-out both }
        .chat-widget {
          animation: chat-fade-in 200ms ease-out both,
                     chat-glow 4.5s ease-in-out 200ms infinite;
        }
        .chat-scroll::-webkit-scrollbar { width: 6px; height: 6px }
        .chat-scroll::-webkit-scrollbar-track { background: transparent }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(6,182,212,0.25);
          border-radius: 999px;
        }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.5) }
        .chat-scroll { scrollbar-width: thin; scrollbar-color: rgba(6,182,212,0.25) transparent }
        .chat-dot { animation: chat-dot 1.2s ease-in-out infinite }
        .chat-dot:nth-child(2) { animation-delay: 0.15s }
        .chat-dot:nth-child(3) { animation-delay: 0.3s }
      `}</style>

      {/* soft dim — pointer-events-none so scroll + clicks still work */}
      <div
        className="chat-backdrop pointer-events-none fixed inset-0 z-40 bg-black/25"
        aria-hidden
      />

      <div
        ref={widgetRef}
        className="chat-widget bg-paper text-ink fixed right-0 bottom-0 left-0 z-50 flex max-h-[88vh] w-full flex-col rounded-t-2xl sm:top-[14vh] sm:right-auto sm:bottom-auto sm:left-1/2 sm:max-h-[72vh] sm:w-[92vw] sm:max-w-[620px] sm:-translate-x-1/2 sm:rounded-md"
      >
        {/* mobile drag handle */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="bg-ink/20 h-1 w-10 rounded-full" />
        </div>

        {/* TopTab accent — desktop only */}
        <div className="bg-ink absolute -top-1.5 left-7 hidden h-2 w-12 rounded-t-sm sm:block" />

        <header className="flex items-center justify-between px-5 pt-3 pb-3 sm:px-7 sm:pt-6">
          <h2
            className="text-ink text-xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Chat with Ram
          </h2>
          <div className="flex items-center gap-2">
            <kbd className="border-ink/20 text-ink-soft hidden rounded border px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
              esc
            </kbd>
            <button
              onClick={onClose}
              className="text-ink-soft hover:text-ink hover:bg-ink/5 flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </header>

        {/* input row */}
        <div className="border-ink/15 mx-5 border-t pt-3 pb-3 sm:mx-7">
          <div className="border-ink/20 focus-within:border-accent flex items-center gap-3 rounded-lg border bg-white px-4 py-3 transition-all focus-within:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="text-ink-soft"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKey}
              placeholder="Ask me anything…"
              maxLength={2000}
              className="placeholder:text-ink-soft/60 text-ink flex-1 bg-transparent text-[15px] outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              aria-label="Send"
              className="bg-ink text-paper hover:bg-accent hover:text-ink flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold transition-colors disabled:opacity-40"
            >
              →
            </button>
          </div>
          <p className="text-ink-soft/70 mt-2 flex items-center gap-2 px-1 text-[10.5px]">
            <span>AI · trained on Ram's portfolio · responses may be inaccurate</span>
            <span className="ml-auto hidden items-center gap-1 sm:flex">
              <kbd className="border-ink/20 rounded border bg-white px-1 py-0.5 text-[9px] font-medium">
                ⌘K
              </kbd>
              <span className="text-ink-soft/60">to toggle</span>
            </span>
          </p>
        </div>

        {/* body */}
        <div
          ref={scrollRef}
          className="chat-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6 sm:px-7"
        >
          {isEmpty ? (
            <>
              <div className="text-ink-soft mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase">
                <span className="bg-ink/30 h-px w-4" />
                suggested
              </div>

              <div className="space-y-0.5">
                {starterPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => startWithPrompt(p)}
                    disabled={isLoading}
                    className="group hover:bg-accent-soft/40 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors disabled:opacity-50"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                      className="text-ink-soft group-hover:text-accent-deep"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <span className="text-ink flex-1 text-[13.5px]">{p}</span>
                    <kbd className="border-ink/20 text-ink-soft hidden rounded border bg-white px-1 py-0.5 text-[10px] opacity-0 group-hover:opacity-100 sm:inline-block">
                      ⏎
                    </kbd>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => {
                const isStreamingThis =
                  i === messages.length - 1 &&
                  m.role === 'assistant' &&
                  isLoading &&
                  m.content === ''
                return (
                  <div key={i}>
                    <div className="text-ink-soft mb-1.5 flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase">
                      <span className="bg-ink/30 h-px w-4" />
                      {m.role === 'user' ? 'you' : 'ram (ai)'}
                    </div>
                    {isStreamingThis ? (
                      <div className="text-ink-soft inline-flex items-center gap-1">
                        <span className="chat-dot bg-ink-soft inline-block h-1.5 w-1.5 rounded-full" />
                        <span className="chat-dot bg-ink-soft inline-block h-1.5 w-1.5 rounded-full" />
                        <span className="chat-dot bg-ink-soft inline-block h-1.5 w-1.5 rounded-full" />
                      </div>
                    ) : (
                      <p
                        className={
                          m.role === 'user'
                            ? 'text-ink text-[14.5px] leading-relaxed font-semibold'
                            : 'text-ink text-[14px] leading-[1.65] whitespace-pre-wrap'
                        }
                      >
                        {m.content}
                      </p>
                    )}
                  </div>
                )
              })}

              {error && (
                <div className="border-red-300/60 bg-red-50/80 text-red-700 rounded-md border px-3 py-2 text-[12px]">
                  ⚠ {error}
                </div>
              )}

              <div className="border-ink/15 mt-2 flex items-center justify-between border-t pt-3">
                <button
                  onClick={reset}
                  disabled={isLoading}
                  className="text-ink-soft hover:text-accent-deep text-[11.5px] underline underline-offset-2 transition-colors disabled:opacity-50"
                >
                  ← ask another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
