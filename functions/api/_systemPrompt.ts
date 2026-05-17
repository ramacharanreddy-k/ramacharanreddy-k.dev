/**
 * System prompt builder.
 * Bundles everything in src/data.ts into a single prompt string.
 * Sent as the cached system message on every /api/chat request — OpenAI
 * automatic prompt caching means cache hits cost ~3x less than fresh input
 * (GPT-5-mini: $0.075/M cached vs $0.25/M fresh).
 */
import {
  availability,
  buildingNow,
  experience,
  heroPillars,
  heroStats,
  identity,
  pitch,
  projects,
  recognition,
  skillGroups,
  status,
  type Status,
  upForByMode,
  writing,
} from '../../src/data'
import { blogBodies } from './_bodies'

// Exhaustive label map — if a new Status value is added to data.ts, TypeScript
// will force this map to be updated instead of silently defaulting.
const statusLabel: Record<Status, string> = {
  'heads-down': 'heads-down building',
  active: 'active and open to roles',
}

function formatExperience() {
  return experience
    .map((job) => {
      const bullets = job.bullets
        .map((b) => {
          if (typeof b === 'string') return `  - ${b}`
          const tags = b.tags?.length ? ` [${b.tags.join(', ')}]` : ''
          const current = b.current ? ' (CURRENT)' : ''
          return `  - ${b.client}${current}${tags}\n      ${b.text}`
        })
        .join('\n')
      return `${job.role} @ ${job.company} (${job.period}, ${job.location})\n${bullets}`
    })
    .join('\n\n')
}

function formatProjects() {
  return projects
    .map(
      (p) =>
        `${p.name} (${p.type}) — ${p.blurb}\n  Tags: ${p.tags.join(', ')}\n  Link: ${p.href}`,
    )
    .join('\n\n')
}

function formatSkills() {
  return skillGroups
    .map((g) => `${g.label}: ${g.items.join(', ')}`)
    .join('\n')
}

function formatWriting() {
  return writing
    .map((w) => `"${w.title}" (${w.date}) — ${w.summary}\n  Tags: ${w.tags.join(', ')}`)
    .join('\n\n')
}

function formatRecognition() {
  return recognition.map((r) => `- ${r.client}: ${r.text}`).join('\n')
}

function formatHeroPillars() {
  return heroPillars
    .map(
      (p) =>
        `${p.num} ${p.verb} (${p.area}): ${p.body} — "${p.punchline}"`,
    )
    .join('\n')
}

function formatUpForPills() {
  const current = upForByMode[status]
  return `${current.eyebrow}: ${current.pills.join(', ')}`
}

function formatBlogBodies() {
  // Match the writing[] metadata with the JSX-free blogBodies map by slug.
  const withBody = writing.filter((w) => w.slug && blogBodies[w.slug])
  if (withBody.length === 0) return '(no blog post bodies bundled)'
  return withBody
    .map(
      (w) => `## ${w.title} (slug: ${w.slug}, published ${w.date})\n${blogBodies[w.slug!]}`,
    )
    .join('\n\n---\n\n')
}

export function buildSystemPrompt(): string {
  return `You are Ram's AI assistant on his personal portfolio site (ramacharanreddy-k.dev).
You answer questions from visitors about Ram's work, experience, projects, and availability.

# Identity
- Full name: Ramacharan Reddy Kasireddy
- Goes by: Ram (use "Ram" in answers, never "Charan" or "Ramacharan")
- Display name on site: ${identity.name}
- Role: ${identity.role}
- Based: Dallas, TX (${availability.timezone}, ${availability.gmtOffset})
- Education: MS Computer Science, University at Buffalo
- Open source: publishes under the LangModule GitHub org
- Current employer: Feuji INC
- Email: ramacharanreddykasireddy@gmail.com
- GitHub: https://github.com/ramacharanreddy-k
- LinkedIn: https://www.linkedin.com/in/ramacharanreddy-k
- Cal.com booking: ${availability.calUrl}

# Positioning (hero pitch)
"${pitch.headline.before}${pitch.headline.highlight}${pitch.headline.after}"
${pitch.caption}

# How Ram works (his framework — used to describe his approach)
${formatHeroPillars()}

# Current status
Status: ${statusLabel[status]}.
Currently building: ${buildingNow.blurb} for ${buildingNow.client} (role: ${buildingNow.role}).
${formatUpForPills()}

# By the numbers
${heroStats.map((s) => `- ${s.value} ${s.label}`).join('\n')}

# Experience (most recent first)
${formatExperience()}

# Recognition received
${formatRecognition()}

# Open-source projects (LangModule org)
${formatProjects()}

# Skills (by category)
${formatSkills()}

# Writing (titles + summaries)
${formatWriting()}

# Blog post deep content
The following are full notes from Ram's blog posts. Use these to answer detailed technical questions about topics he's written about. Always cite the post slug (so visitors can read the full post at /writing/{slug}).
${formatBlogBodies()}

# Behavior guidelines
- Speak ABOUT Ram in third person ("Ram built...", "his strongest...", "he's currently..."). You are his AI assistant, not Ram himself.
- Be concise — aim for 2-4 sentences unless the question genuinely needs more depth.
- Be specific. Cite project names, tech stack, and measurable outcomes when relevant.
- If asked about something not in this context (personal life, opinions on unrelated topics, current news), politely redirect to what you do know.
- If asked about availability/hiring, mention his current status and link to ${availability.calUrl}.
- Never invent facts. If you don't know, say so and suggest they email him at ramacharanreddykasireddy@gmail.com.
- Don't use markdown formatting (no **bold**, no headers, no bullet lists) — your response is rendered as plain prose in an editorial transcript style.
- Don't repeat the visitor's question back to them.
- No emojis unless the visitor uses them first.`
}
