import { describe, expect, it } from 'vitest'
import { detectRegex, findTerms, ibanValid, luhn } from './regex'
import { mergeSpans } from './spans'

const found = (text: string) => mergeSpans(detectRegex(text)).map(s => [s.category, s.text])

describe('checksums', () => {
  it('luhn', () => {
    expect(luhn('732829320')).toBe(true)
    expect(luhn('732829321')).toBe(false)
  })
  it('iban mod-97', () => {
    expect(ibanValid('FR76 3000 6000 0112 3456 7890 189')).toBe(true)
    expect(ibanValid('FR76 3000 6000 0112 3456 7890 188')).toBe(false)
  })
})

describe('detectRegex', () => {
  it('emails, without trailing punctuation', () => {
    expect(found('Écrire à jean.dupont+rh@acme-corp.fr.')).toEqual([['EMAIL', 'jean.dupont+rh@acme-corp.fr']])
  })

  it('french and international phones', () => {
    expect(found('Tél : 06 12 34 56 78, fixe 01.23.45.67.89, siège +33 1 42 68 53 00, UK +44 20 7946 0958'))
      .toEqual([
        ['TELEPHONE', '06 12 34 56 78'],
        ['TELEPHONE', '01.23.45.67.89'],
        ['TELEPHONE', '+33 1 42 68 53 00'],
        ['TELEPHONE', '+44 20 7946 0958'],
      ])
  })

  it('IBAN (valid only), FR and DE', () => {
    expect(found('IBAN FR76 3000 6000 0112 3456 7890 189 ou DE89370400440532013000'))
      .toEqual([['IBAN', 'FR76 3000 6000 0112 3456 7890 189'], ['IBAN', 'DE89370400440532013000']])
    expect(found('Ref FR76 3000 6000 0112 3456 7890 188')).toEqual([])
  })

  it('SIRET wins over the SIREN it contains', () => {
    expect(found('SIRET 732 829 320 00074')).toEqual([['SIRET', '732 829 320 00074']])
    expect(found('SIREN : 732829320')).toEqual([['SIREN', '732829320']])
    expect(found('Dossier 123456789')).toEqual([]) // fails Luhn
  })

  it('amounts', () => {
    expect(found('Prix 12 500,00 € HT, acompte 3000 EUR, option $1,200 et 45 000 euros'))
      .toEqual([
        ['MONTANT', '12 500,00 €'],
        ['MONTANT', '3000 EUR'],
        ['MONTANT', '$1,200'],
        ['MONTANT', '45 000 euros'],
      ])
  })

  it('a reference number before an amount is not part of it', () => {
    expect(found("Selon l'article 3 500 € sont dus, art. 12 1 200 EUR, n° 7 45 000 euros"))
      .toEqual([['MONTANT', '500 €'], ['MONTANT', '1 200 EUR'], ['MONTANT', '45 000 euros']])
  })

  it('urls and IPs', () => {
    expect(found('Voir https://intranet.acme.fr/rh?id=4 (serveur 192.168.1.42), pas 999.1.1.1.'))
      .toEqual([['URL', 'https://intranet.acme.fr/rh?id=4'], ['IP', '192.168.1.42']])
  })

  it('returns exact indices', () => {
    const text = 'Contact: a@b.io'
    const [s] = detectRegex(text)
    expect(text.slice(s.start, s.end)).toBe('a@b.io')
  })
})

describe('findTerms', () => {
  it('whole-word, case-insensitive, regex-safe', () => {
    const spans = findTerms('Projet Apollo et apollo-2, pas Apollonius. C++ aussi.', ['apollo', 'C++', ' '])
    expect(spans.map(s => s.text)).toEqual(['Apollo', 'apollo', 'C++'])
  })
})
