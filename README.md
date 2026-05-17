# ramacharanreddy-k.dev

Personal portfolio of Ramacharan Reddy Kasireddy — Senior AI Engineer building production LangGraph agents, RAG pipelines, and multi-agent systems.

Includes an AI chat widget ("Chat with me") that streams responses about Ram's work, projects, and writing — backed by GPT-5-mini via a Cloudflare Pages Function. OpenAI prompt caching keeps per-message cost around $0.001.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 8** — dev server and bundler
- **Tailwind CSS v4** — styling, with Prettier class sorter
- **React Router 7** — `/` portfolio + `/writing/:slug` blog post routes
- **OpenAI SDK** — GPT-5-mini, streaming
- **Cloudflare Pages Functions** — serverless `/api/chat` endpoint
- **Wrangler** — local Functions dev + deploy CLI
- **Turndown** — renders JSX blog bodies to markdown at build time so the AI can read them
- **ESLint** + **Prettier**

## Getting Started

```bash
npm install
npm run dev          # frontend only at :5173 (chat won't work)
```

For full stack with the chat working locally, you need an OpenAI API key:

```bash
cp .dev.vars.example .dev.vars
# edit .dev.vars and paste your OPENAI_API_KEY=sk-...
npm run dev:fn       # build + wrangler at :8788
```

## Scripts

| Command                | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Vite dev server at `:5173` (frontend only, no Functions)   |
| `npm run dev:fn`       | Build + wrangler at `:8788` (full stack, chat works)       |
| `npm run build`        | `build:bodies` + type-check + production build to `dist/`  |
| `npm run build:bodies` | Regenerate `functions/api/_bodies.ts` from blog JSX        |
| `npm run typecheck`    | Type-check frontend + functions + scripts (no emit)        |
| `npm run lint`         | Run ESLint                                                 |
| `npm run format`       | Format all files with Prettier                             |
| `npm run deploy`       | Manual deploy to Cloudflare Pages (CLI fallback)           |
| `npm run logs`         | Tail live production Function logs (cache-hit stats, etc.) |

## Project Structure

```
.
├── public/                                # Static assets (logos, photo, resume PDF, favicon)
│   └── _redirects                         # Cloudflare SPA fallback — load-bearing, do not delete
├── functions/
│   ├── api/
│   │   ├── chat.ts                        # POST /api/chat — streams GPT-5-mini via SSE
│   │   ├── _systemPrompt.ts               # Bundles data.ts + blog bodies into cached system prompt
│   │   └── _bodies.ts                     # GENERATED — markdown extracted from JSX blog posts
│   └── tsconfig.json                      # Cloudflare Workers types
├── scripts/
│   └── build-bodies.ts                    # Renders JSX → HTML → markdown for the AI's knowledge
├── src/
│   ├── blog/                              # Blog posts (JSX bodies)
│   │   ├── index.ts                       # Registry + getPostBySlug
│   │   └── from-sqlite-to-cosmos-db.tsx   # Post content as JSX
│   ├── components/
│   │   ├── Chat/                          # Spotlight-style chat widget
│   │   │   ├── ChatProvider.tsx           # Provider component + global ⌘K toggle
│   │   │   ├── ChatWidget.tsx             # The widget UI
│   │   │   ├── useChat.ts                 # Context + hook (consumer-facing API)
│   │   │   ├── useChatStream.ts           # SSE streaming hook
│   │   │   ├── useModalClose.ts           # Esc-to-close hook
│   │   │   └── chat.ts                    # Msg type + starter prompts
│   │   ├── Hero/                          # Hero composition + sub-cards
│   │   ├── shared/                        # Reusable primitives (Cta, Eyebrow, TopTab, …)
│   │   ├── Nav.tsx
│   │   ├── Footer.tsx
│   │   ├── Experience.tsx
│   │   ├── Projects.tsx
│   │   ├── Writing.tsx
│   │   ├── Skills.tsx
│   │   └── Contact.tsx
│   ├── pages/
│   │   ├── Portfolio.tsx                  # `/` — composed sections
│   │   └── BlogPost.tsx                   # `/writing/:slug` — post detail
│   ├── App.tsx                            # BrowserRouter + ChatProvider + ScrollToHash
│   ├── main.tsx                           # Entry point
│   ├── data.ts                            # All site copy: nav, hero, experience, projects, writing, skills
│   └── index.css                          # Tailwind entry + theme tokens + .prose blog styles
├── index.html                             # HTML shell with SEO + Open Graph meta
├── vite.config.ts                         # Vite + Tailwind plugin config
├── .dev.vars.example                      # Template for local secrets (copy to .dev.vars)
└── package.json
```

## Adding a new blog post

1. Create `src/blog/<slug>.tsx` exporting a const with `slug`, `title`, `date`, `tags`, `summary`, and JSX `body`.
2. Register it in `src/blog/index.ts` by appending to the `blogPosts` array.
3. Add a matching entry to `writing[]` in `src/data.ts` with the same `slug` so it appears in the Writing section.

That's it. `npm run build:bodies` (chained into `npm run build`) extracts the JSX body to markdown automatically so the AI chat knows the new post's content.

## How the chat works

The "Chat with me" widget POSTs to `/api/chat`, which streams from OpenAI GPT-5-mini.

1. **System prompt** — `_systemPrompt.ts` bundles every export from `src/data.ts` (experience, projects, skills, recognition, hero pillars, etc.) plus the blog markdown from `_bodies.ts` into a single ~5-10K-token system message.
2. **Prompt caching** — OpenAI's automatic cache kicks in (~3× cheaper on cache hits) because the system prompt is byte-identical across requests.
3. **Streaming** — SSE delivers tokens to the frontend, rendered into the chat with a typing indicator.
4. **Knowledge stays in sync** — edit `data.ts` or any blog post → next build regenerates `_bodies.ts` → next deploy → AI knows the new content. No separate KB to maintain.

Per-message cost: **~$0.001**. Watch live token / cache-hit stats with `npm run logs`.

## Deploy (Cloudflare Pages)

The site auto-deploys via Git push. Initial setup:

1. Push the repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Pick the repo, then set:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables:**
     - `NODE_VERSION = 22`
     - `OPENAI_API_KEY = sk-...` (required for chat — mark as encrypted secret, add to **both** Production and Preview)
4. Save and deploy. First build takes ~60s.
5. Add the custom domain in the **Custom domains** tab — Cloudflare auto-creates the CNAME if the domain is in the same account.

Every `git push` to `main` triggers an auto-deploy. PRs get preview URLs.

**Manual deploy** (skips Git):

```bash
npm run deploy
```

**Watch production logs** (cache-hit %, token counts, errors):

```bash
npm run logs
```

## Important notes

- `.dev.vars` (gitignored) holds your local `OPENAI_API_KEY` for wrangler. `.env` is NOT used by this project.
- `functions/api/_bodies.ts` is a generated artifact — gitignored, regenerated on every build via `scripts/build-bodies.ts`.
- `public/_redirects` makes blog URLs like `/writing/from-sqlite-to-cosmos-db` work on direct load/refresh — Cloudflare reads it and serves `index.html` for unknown paths so React Router can take over.
- The chat is rendered globally via `<ChatProvider>` in `App.tsx` and triggered by any `<Cta href="#chat">` button. `⌘K` / `Ctrl+K` toggles it from anywhere on the site.
