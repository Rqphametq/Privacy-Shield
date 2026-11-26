import { chunkText } from './chunk'
import { detectRegex, findTerms } from './regex'
import { mergeSpans } from './spans'
import type { Category, Span } from './types'

/** Output of Transformers.js token-classification with aggregation_strategy: 'simple' (no char offsets). */
export interface NerEntity {
  entity_group: string
  score: number
  word: string
}

const LABELS: Record<string, Category> = { PER: 'PERSONNE', ORG: 'ENTREPRISE', LOC: 'LIEU' }
const isWordChar = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c)
const esc = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Find each entity in the chunk, in order, ignoring whitespace differences introduced by
 * the tokenizer's decode ("Jean - Pierre" -> "Jean-Pierre"), and widen to whole words.
 */
export function locateEntities(entities: NerEntity[], chunk: string, offset: number): Span[] {
  const out: Span[] = []
  let cursor = 0
  for (const ent of entities) {
    const category = LABELS[ent.entity_group]
    const chars = [...ent.word.replace(/\s+/g, '')]
    if (!category || chars.length === 0) continue
    const re = new RegExp(chars.map(esc).join('\\s*'), 'gu')
    re.lastIndex = cursor
    const m = re.exec(chunk)
    if (!m) continue
    let start = m.index, end = start + m[0].length
    while (isWordChar(chunk[start - 1])) start--
    while (isWordChar(chunk[end])) end++
    out.push({ start: start + offset, end: end + offset, category, text: chunk.slice(start, end), source: 'ner' })
    cursor = end
  }
  return out
}

/** Run the model chunk by chunk and return global, de-duplicated spans. `run` is injected so this stays testable. */
export async function detectNer(
  text: string,
  run: (chunk: string) => Promise<NerEntity[]>,
  { maxChars = 1000, overlap = 200 } = {},
): Promise<Span[]> {
  const spans: Span[] = []
  for (const c of chunkText(text, maxChars, overlap)) spans.push(...locateEntities(await run(c.text), c.text, c.offset))
  return mergeSpans(spans)
}

/** Final detection: manual terms > regex > NER, overlaps resolved by mergeSpans. */
export function detectAll(text: string, nerSpans: Span[], terms: string[]): Span[] {
  return mergeSpans([...findTerms(text, terms), ...detectRegex(text), ...nerSpans])
}
