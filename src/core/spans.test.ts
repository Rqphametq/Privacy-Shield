import { describe, expect, it } from 'vitest'
import { mergeSpans } from './spans'
import type { Span } from './types'

const sp = (start: number, end: number, source: Span['source'], category: Span['category'] = 'PERSONNE'): Span =>
  ({ start, end, source, category, text: '' })

describe('mergeSpans', () => {
  it('regex beats a partially overlapping NER span', () => {
    const out = mergeSpans([sp(0, 12, 'ner', 'ENTREPRISE'), sp(5, 15, 'regex', 'EMAIL')])
    expect(out).toEqual([sp(5, 15, 'regex', 'EMAIL')])
  })

  it('manual beats a partially overlapping regex span', () => {
    expect(mergeSpans([sp(0, 10, 'regex', 'EMAIL'), sp(8, 14, 'manual', 'PERSO')])).toEqual([sp(8, 14, 'manual', 'PERSO')])
  })

  it('a lower-priority span that fully contains higher-priority ones replaces them (masks more)', () => {
    // manual "Dupont" inside NER "Jean Dupont": keeping only "Dupont" would leak "Jean".
    expect(mergeSpans([sp(5, 11, 'manual', 'PERSO'), sp(0, 11, 'ner')])).toEqual([sp(0, 11, 'ner')])
    expect(mergeSpans([sp(2, 4, 'manual', 'PERSO'), sp(6, 8, 'regex', 'EMAIL'), sp(0, 10, 'ner')])).toEqual([sp(0, 10, 'ner')])
  })

  it('an identical lower-priority span does not replace the higher one', () => {
    expect(mergeSpans([sp(0, 5, 'regex', 'EMAIL'), sp(0, 5, 'ner')])).toEqual([sp(0, 5, 'regex', 'EMAIL')])
  })

  it('same source: longer wins, ties go to the earlier one', () => {
    expect(mergeSpans([sp(0, 9, 'regex'), sp(0, 14, 'regex')])).toEqual([sp(0, 14, 'regex')])
    expect(mergeSpans([sp(3, 8, 'ner'), sp(0, 5, 'ner')])).toEqual([sp(0, 5, 'ner')])
  })

  it('keeps adjacent spans, drops empty ones, sorts by start', () => {
    expect(mergeSpans([sp(5, 10, 'ner'), sp(0, 5, 'regex'), sp(7, 7, 'manual')]))
      .toEqual([sp(0, 5, 'regex'), sp(5, 10, 'ner')])
  })

  it('a lower-priority span is kept when it overlaps nothing that was kept', () => {
    // NER 0-10 loses to regex 8-12; NER 20-25 is untouched.
    expect(mergeSpans([sp(0, 10, 'ner'), sp(8, 12, 'regex'), sp(20, 25, 'ner')]))
      .toEqual([sp(8, 12, 'regex'), sp(20, 25, 'ner')])
  })
})
