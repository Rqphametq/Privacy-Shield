import type { Span } from './types'

/** Session vault, RAM only. byTag: "[PERSONNE_1]" -> original; byValue: "PERSONNE|jean dupont" -> tag. */
export interface Vault {
  byTag: Map<string, string>
  byValue: Map<string, string>
  counters: Map<string, number>
}

export const createVault = (): Vault => ({ byTag: new Map(), byValue: new Map(), counters: new Map() })

/** Identity of a value: same category + same text (case/space-insensitive) -> same tag. */
export const spanKey = (s: Pick<Span, 'category' | 'text'>) => `${s.category}|${s.text.trim().replace(/\s+/g, ' ').toLowerCase()}`
const key = spanKey

export interface EntityRow { key: string; category: Span['category']; text: string; count: number }

/** Distinct values for the entity panel, in order of first appearance. */
export function groupEntities(spans: Span[]): EntityRow[] {
  const rows = new Map<string, EntityRow>()
  for (const s of spans) {
    const k = spanKey(s)
    const row = rows.get(k)
    if (row) row.count++
    else rows.set(k, { key: k, category: s.category, text: s.text, count: 1 })
  }
  return [...rows.values()]
}

const TAG_RE = /\[\s*([A-Z]+_\d+)\s*\]/g

/** How many tags in an LLM answer we can restore, and which ones we don't know. */
export function findTags(text: string, vault: Vault): { known: number; unknown: string[] } {
  let known = 0
  const unknown: string[] = []
  for (const [, id] of text.matchAll(TAG_RE)) {
    if (vault.byTag.has(`[${id}]`)) known++
    else unknown.push(`[${id}]`)
  }
  return { known, unknown }
}

/** Replace each span with a stable tag. `spans` must be non-overlapping (see mergeSpans). Mutates `vault`. */
export function anonymize(text: string, spans: Span[], vault: Vault): string {
  let out = ''
  let cursor = 0
  for (const s of [...spans].sort((a, b) => a.start - b.start)) {
    if (s.start < cursor) throw new Error('anonymize: overlapping spans, call mergeSpans first')
    let tag = vault.byValue.get(key(s))
    if (!tag) {
      const n = (vault.counters.get(s.category) ?? 0) + 1
      vault.counters.set(s.category, n)
      tag = `[${s.category}_${n}]`
      vault.byValue.set(key(s), tag)
      vault.byTag.set(tag, s.text)
    }
    out += text.slice(cursor, s.start) + tag
    cursor = s.end
  }
  return out + text.slice(cursor)
}

/** Put originals back. Tolerates LLM spacing like "[ PERSONNE_1 ]"; unknown tags are left as-is. */
export function deanonymize(text: string, vault: Vault): string {
  return text.replace(TAG_RE, (m, id) => vault.byTag.get(`[${id}]`) ?? m)
}
