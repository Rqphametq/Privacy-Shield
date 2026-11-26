import { describe, expect, it } from 'vitest'
import { anonymize, createVault, findTags, groupEntities, spanKey } from './mapping'
import { detectAll } from './ner'
import { SAMPLE_CONTRACT } from '../sample'
import type { Span } from './types'

const s = (text: string, category: Span['category'], start = 0): Span => ({ start, end: start + text.length, category, text, source: 'ner' })

describe('groupEntities', () => {
  it('one row per distinct value (case/space-insensitive), with counts, in order of appearance', () => {
    const rows = groupEntities([s('Jean Dupont', 'PERSONNE'), s('ACME', 'ENTREPRISE', 20), s('jean  dupont', 'PERSONNE', 40)])
    expect(rows).toEqual([
      { key: spanKey(s('Jean Dupont', 'PERSONNE')), category: 'PERSONNE', text: 'Jean Dupont', count: 2 },
      { key: spanKey(s('ACME', 'ENTREPRISE')), category: 'ENTREPRISE', text: 'ACME', count: 1 },
    ])
  })

  it('same text in two categories gives two rows', () => {
    expect(groupEntities([s('Paris', 'LIEU'), s('Paris', 'PERSO', 10)])).toHaveLength(2)
  })
})

describe('findTags', () => {
  it('counts known tags and lists unknown ones', () => {
    const vault = createVault()
    anonymize('Paul', [s('Paul', 'PERSONNE')], vault)
    expect(findTags('[PERSONNE_1] et [ PERSONNE_1 ], mais [EMAIL_3]', vault)).toEqual({ known: 2, unknown: ['[EMAIL_3]'] })
  })
})

describe('sample contract (demo)', () => {
  it('regex alone catches every deterministic category', () => {
    const cats = new Set(detectAll(SAMPLE_CONTRACT, [], []).map(x => x.category))
    for (const c of ['EMAIL', 'TELEPHONE', 'IBAN', 'SIRET', 'MONTANT', 'URL', 'IP'] as const) expect(cats).toContain(c)
  })
})
