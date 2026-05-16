# ramacharanreddy-k.dev

Personal portfolio of Ramacharan Reddy Kasireddy — Senior AI Engineer building production LangGraph agents, RAG pipelines, and multi-agent systems.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 8** — dev server and bundler
- **Tailwind CSS v4** — styling, with Prettier class sorter
- **React Router 7** — `/` portfolio + `/writing/:slug` blog post routes
- **ESLint** + **Prettier**

## Getting Started

```bash
npm install
npm run dev
```

The site runs at [http://localhost:5173](http://localhost:5173).

## Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the dev server with HMR        |
| `npm run build`        | Type-check and build for production  |
| `npm run preview`      | Preview the production build locally |
| `npm run lint`         | Run ESLint over the project          |
| `npm run format`       | Format all files with Prettier       |
| `npm run format:check` | Check formatting without writing     |

## Project Structure

```
.
├── public/              # Static assets (logos, photo, resume PDF, favicon)
│   └── _redirects       # Cloudflare SPA fallback — load-bearing, do not delete
├── src/
│   ├── blog/            # Blog post components + registry
│   │   ├── index.ts                       # Registry + getPostBySlug
│   │   └── from-sqlite-to-cosmos-db.tsx   # Post content as JSX
│   ├── components/
│   │   ├── Hero/        # Hero composition + sub-cards
│   │   ├── shared/      # Reusable primitives (Cta, Eyebrow, TopTab, PaperCard, …)
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
│   ├── App.tsx          # BrowserRouter + ScrollToHash
│   ├── main.tsx         # Entry point
│   ├── data.ts          # All site copy: nav, hero, experience, projects, writing, skills
│   └── index.css        # Tailwind entry + theme tokens + `.prose` blog styles
├── index.html           # HTML shell with SEO + Open Graph meta
└── vite.config.ts       # Vite + Tailwind plugin config
```

## Adding a new blog post

1. Create `src/blog/<slug>.tsx` exporting a const with `slug`, `title`, `date`, `tags`, `summary`, and JSX `body`.
2. Register it in `src/blog/index.ts` by adding it to the `blogPosts` array.
3. Add a matching entry to `writing[]` in `src/data.ts` with the same `slug` so it appears in the Writing section.

## Deploy (Cloudflare Pages)

The site is set up for one-click deploy on Cloudflare Pages.

1. Push the repo to GitHub.
2. In the Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Pick the repo, then set:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variable:** `NODE_VERSION = 22`
4. Save and deploy. First build takes ~60s and gives you a `*.pages.dev` URL.
5. Add the custom domain (`ramacharanreddy-k.dev`) in the **Custom domains** tab — Cloudflare auto-creates the CNAME if the domain is in the same account.

Every `git push` to `main` triggers an auto-deploy. PRs get preview URLs.

`public/_redirects` is what makes blog URLs like `/writing/from-sqlite-to-cosmos-db` work on direct load/refresh — Cloudflare reads it and serves `index.html` for unknown paths so React Router can route client-side.
