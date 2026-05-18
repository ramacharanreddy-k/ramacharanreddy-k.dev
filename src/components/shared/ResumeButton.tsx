import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Eyebrow } from './Eyebrow'

const RESUME_URL = '/resume.pdf'

export function ResumeButton() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-ink-soft hover:text-ink inline-flex items-center gap-1.5 bg-transparent px-2 py-2.5 text-sm font-semibold underline-offset-4 transition-colors hover:underline"
      >
        Resume ↗
      </button>
      {open &&
        createPortal(<ResumeModal onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}

function ResumeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Resume preview"
      className="bg-ink/50 fixed inset-0 z-[100] flex items-stretch justify-center p-3 backdrop-blur md:items-center md:p-8"
      onClick={onClose}
    >
      <div
        className="bg-paper text-ink relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-ink/15 flex items-center justify-between gap-3 border-b px-5 py-3">
          <Eyebrow>resume</Eyebrow>
          <div className="flex items-center gap-2">
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-ink/15 text-ink-soft hover:border-ink hover:bg-ink hover:text-paper rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              Open ↗
            </a>
            <a
              href={RESUME_URL}
              download="Ramacharan-Reddy-Kasireddy-Resume.pdf"
              className="bg-accent text-ink hover:bg-accent-deep hover:text-paper rounded-md px-3 py-1.5 text-xs font-bold transition-colors"
            >
              Download ↓
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-muted hover:text-ink ml-1 text-xl leading-none transition-colors"
            >
              ✕
            </button>
          </div>
        </header>
        <iframe
          src={`${RESUME_URL}#view=FitH&toolbar=0`}
          title="Ramacharan Reddy Kasireddy — Resume"
          className="bg-bg-soft/5 h-full w-full flex-1"
        />
      </div>
    </div>
  )
}
