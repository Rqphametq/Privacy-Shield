import type { Source, Span } from './types'

const RANK: Record<Source, number> = { manual: 0, regex: 1, ner: 2 }

/**
 * Resolve overlaps: higher-priority source wins (manual > regex > ner),
 * then the longer span, then the earlier one. Exception: a span that strictly contains every
 * span it overlaps replaces them, so a short manual term never un-masks the rest of a name.
 * Returns non-overlapping spans sorted by start.
 */
export function mergeSpans(spans: Span[]): Span[] {
  const ordered = [...spans].sort((a, b) =>
    RANK[a.source] - RANK[b.source] || (b.end - b.start) - (a.end - a.start) || a.start - b.start)
  let kept: Span[] = []
  for (const s of ordered) {
    if (s.end <= s.start) continue
    const hits = kept.filter(k => s.start < k.end && k.start < s.end)
    if (hits.length === 0) kept.push(s)
    else if (hits.every(k => s.start <= k.start && k.end <= s.end && s.end - s.start > k.end - k.start)) {
      kept = kept.filter(k => !hits.includes(k)).concat(s)
    }
  }
  return kept.sort((a, b) => a.start - b.start)
}
