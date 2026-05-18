import type { MouseEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPostBySlug } from '../blog'

export function BlogPost() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const post = getPostBySlug(slug)

  // URL-clean back navigation: go home + smooth-scroll to Writing section without
  // a `#writing` hash sticking in the address bar. `ScrollToHash` in App.tsx picks
  // up the `scrollTo` location state.
  const backToWriting = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    navigate('/', { state: { scrollTo: 'writing' } })
  }

  if (!post) {
    return (
      <section className="py-20 text-center">
        <p className="text-muted mb-4 font-mono text-xs tracking-widest uppercase">
          <span className="text-accent">//</span> 404
        </p>
        <h1 className="text-fg text-3xl font-bold">Post not found</h1>
        <Link
          to="/"
          onClick={backToWriting}
          className="text-accent-deep mt-6 inline-block text-sm font-semibold underline"
        >
          ← Back to writing
        </Link>
      </section>
    )
  }

  return (
    <article className="py-10 md:py-14">
      <Link
        to="/"
        onClick={backToWriting}
        className="text-muted hover:text-accent-deep mb-8 inline-flex items-center gap-1 text-sm font-semibold transition-colors"
      >
        ← Back to writing
      </Link>

      <header className="mb-10">
        <p className="text-muted mb-4 font-mono text-[10px] font-semibold tracking-widest uppercase">
          <span className="text-accent">//</span> {post.date} · {post.readingTime}
        </p>
        <h1
          className="text-fg text-3xl leading-tight font-bold tracking-tight md:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {post.title}
        </h1>
        {post.subtitle && (
          <p className="text-muted mt-4 text-lg leading-relaxed md:text-xl">{post.subtitle}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <span
              key={t}
              className="border-accent/40 bg-accent-soft text-accent-deep rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide"
            >
              {t}
            </span>
          ))}
        </div>
      </header>

      <div className="bg-paper text-ink rounded-md p-6 shadow-md md:p-10">
        <div className="prose">{post.body}</div>
        {post.externalUrl && (
          <p className="text-muted border-ink/15 mt-10 border-t pt-6 text-xs">
            Originally published{' '}
            <a
              href={post.externalUrl}
              className="text-accent-deep font-semibold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              here ↗
            </a>
            .
          </p>
        )}
      </div>
    </article>
  )
}
