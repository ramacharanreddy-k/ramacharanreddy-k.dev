/**
 * Generates functions/api/_bodies.ts from JSX blog posts. Colocated with its
 * consumer (_systemPrompt.ts). Underscore prefix = not a Pages Function route.
 * The Pages Function can't load .tsx directly (no React runtime), so we
 * render to HTML then convert to markdown at build time.
 * Run via: npm run build:bodies
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isValidElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TurndownService from 'turndown'

import { blogPosts } from '../src/blog'

const td = new TurndownService({
  codeBlockStyle: 'fenced',
  headingStyle: 'atx',
  bulletListMarker: '-',
})

// Escape a string so it's safe inside a JS template literal.
const esc = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

const entries: string[] = []
for (const p of blogPosts) {
  if (!isValidElement(p.body)) continue
  const md = td.turndown(renderToStaticMarkup(p.body)).trim()
  entries.push(`  ${JSON.stringify(p.slug)}: \`\n${esc(md)}\n\`,`)
}

const out = `// GENERATED — do not edit. Regenerate: npm run build:bodies
export const blogBodies: Record<string, string> = {
${entries.join('\n\n')}
}
`

const file = resolve(dirname(fileURLToPath(import.meta.url)), '../functions/api/_bodies.ts')
writeFileSync(file, out, 'utf8')
console.log(`✓ ${entries.length} post(s) → functions/api/_bodies.ts`)
