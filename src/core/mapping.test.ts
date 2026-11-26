import { describe, expect, it } from 'vitest'
import { anonymize, createVault, deanonymize } from './mapping'
import { detectRegex, findTerms } from './regex'
import { mergeSpans } from './spans'
import type { Span } from './types'

const at = (text: string, needle: string, category: Span['category'], from = 0): Span => {
  const start = text.indexOf(needle, from)
  return { start, end: start + needle.length, category, text: needle, source: 'ner' }
}

describe('anonymize / deanonymize', () => {
  it('same value -> same tag, counters per category', () => {
    const text = 'Jean Dupont (ACME) écrit à Marie Curie. Jean Dupont signe.'
    const spans = [
      at(text, 'Jean Dupont', 'PERSONNE'),
      at(text, 'ACME', 'ENTREPRISE'),
      at(text, 'Marie Curie', 'PERSONNE'),
      at(text, 'Jean Dupont', 'PERSONNE', 20),
    ]
    const vault = createVault()
    expect(anonymize(text, spans, vault))
      .toBe('[PERSONNE_1] ([ENTREPRISE_1]) écrit à [PERSONNE_2]. [PERSONNE_1] signe.')
  })

  it('vault is shared across calls in a session', () => {
    const vault = createVault()
    const a = 'Paul'
    anonymize(a, [at(a, 'Paul', 'PERSONNE')], vault)
    const b = 'Lea et Paul'
    expect(anonymize(b, [at(b, 'Lea', 'PERSONNE'), at(b, 'Paul', 'PERSONNE')], vault)).toBe('[PERSONNE_2] et [PERSONNE_1]')
  })

  it('rejects overlapping spans', () => {
    expect(() => anonymize('abcdef', [at('abcdef', 'abcd', 'PERSO'), at('abcdef', 'cdef', 'PERSO')], createVault())).toThrow()
  })

  it('deanonymize tolerates LLM spacing and leaves unknown tags alone', () => {
    const vault = createVault()
    anonymize('Paul', [at('Paul', 'Paul', 'PERSONNE')], vault)
    expect(deanonymize('Bonjour [ PERSONNE_1 ], voir [PERSONNE_9].', vault)).toBe('Bonjour Paul, voir [PERSONNE_9].')
  })

  it('full round trip on a realistic text', () => {
    const text = [
      'Contrat entre Jean Dupont et la société Apollo SAS (SIRET 732 829 320 00074).',
      'Contact : jean.dupont@apollo.fr / 06 12 34 56 78.',
      'Montant : 12 500,00 € HT, payable sur FR76 3000 6000 0112 3456 7890 189.',
      'Jean Dupont confirme. Accès admin https://apollo.fr/admin depuis 10.0.0.12.',
    ].join('\n')
    const ner = [at(text, 'Jean Dupont', 'PERSONNE'), at(text, 'Jean Dupont', 'PERSONNE', 30)]
    const spans = mergeSpans([...detectRegex(text), ...findTerms(text, ['Apollo SAS']), ...ner])
    const vault = createVault()
    const anon = anonymize(text, spans, vault)

    for (const secret of ['Jean Dupont', 'Apollo SAS', '732 829 320', 'jean.dupont@', '06 12', '12 500', 'FR76', 'apollo.fr/admin', '10.0.0.12'])
      expect(anon).not.toContain(secret)
    expect(anon.match(/\[PERSONNE_1\]/g)).toHaveLength(2)
    expect(deanonymize(anon, vault)).toBe(text)
  })
})
