import { describe, expect, it } from 'vitest'
import { detectAll, detectNer, locateEntities, type NerEntity } from './ner'

const e = (entity_group: string, word: string, score = 0.99): NerEntity => ({ entity_group, word, score })
const view = (text: string, spans: { start: number; end: number; category: string }[]) =>
  spans.map(s => [s.category, text.slice(s.start, s.end)])

describe('locateEntities', () => {
  it('maps labels and finds exact indices, with offset', () => {
    const chunk = 'Jean Dupont travaille chez Airbus à Toulouse.'
    const spans = locateEntities([e('PER', 'Jean Dupont'), e('ORG', 'Airbus'), e('LOC', 'Toulouse')], chunk, 100)
    expect(spans.map(s => [s.category, s.start, s.end, s.text, s.source])).toEqual([
      ['PERSONNE', 100, 111, 'Jean Dupont', 'ner'],
      ['ENTREPRISE', 127, 133, 'Airbus', 'ner'],
      ['LIEU', 136, 144, 'Toulouse', 'ner'],
    ])
  })

  it('repeated names map to successive occurrences', () => {
    const chunk = 'Marie appelle Paul, puis Marie rappelle.'
    expect(view(chunk, locateEntities([e('PER', 'Marie'), e('PER', 'Paul'), e('PER', 'Marie')], chunk, 0)).length).toBe(3)
    const [a, , c] = locateEntities([e('PER', 'Marie'), e('PER', 'Paul'), e('PER', 'Marie')], chunk, 0)
    expect([a.start, c.start]).toEqual([0, 25])
  })

  it('tolerates tokenizer spacing differences ("Jean - Pierre", "L \' Oréal")', () => {
    const chunk = "Jean-Pierre rejoint L'Oréal."
    expect(view(chunk, locateEntities([e('PER', 'Jean - Pierre'), e('ORG', "L ' Oréal")], chunk, 0)))
      .toEqual([['PERSONNE', 'Jean-Pierre'], ['ENTREPRISE', "L'Oréal"]])
  })

  it('expands a sub-word hit to the whole word', () => {
    const chunk = 'Signé par Dupontel hier.'
    expect(view(chunk, locateEntities([e('PER', 'Dupont')], chunk, 0))).toEqual([['PERSONNE', 'Dupontel']])
  })

  it('drops MISC, unknown labels and entities not found in the text', () => {
    const chunk = 'Le RGPD protège Jean.'
    expect(view(chunk, locateEntities([e('MISC', 'RGPD'), e('PER', 'Zorro'), e('PER', 'Jean')], chunk, 0)))
      .toEqual([['PERSONNE', 'Jean']])
  })
})

describe('detectNer over chunks', () => {
  it('runs the model per chunk and returns global, de-duplicated spans', async () => {
    const filler = Array.from({ length: 40 }, (_, i) => `Clause ${i} applicable.`).join(' ')
    const text = `${filler} Contact : Jean Dupont. ${filler} Fin, Jean Dupont.`
    // Fake model: finds "Jean Dupont" wherever it appears in the chunk.
    const run = async (chunk: string) => [...chunk.matchAll(/Jean Dupont/g)].map(() => e('PER', 'Jean Dupont'))
    const spans = await detectNer(text, run, { maxChars: 300, overlap: 80 })
    const first = text.indexOf('Jean Dupont'), last = text.lastIndexOf('Jean Dupont')
    expect(spans.map(s => s.start)).toEqual([first, last])
    for (const s of spans) expect(text.slice(s.start, s.end)).toBe('Jean Dupont')
  })
})

describe('detectAll (fusion regex + manual + NER)', () => {
  const text = 'Écrire à contact@airbus.com ou à Jean Dupont (projet Apollo).'
  const at = (needle: string, category: 'PERSONNE' | 'ENTREPRISE') => {
    const start = text.indexOf(needle)
    return { start, end: start + needle.length, category, text: needle, source: 'ner' as const }
  }

  it('regex wins over an overlapping NER span', () => {
    const spans = detectAll(text, [at('airbus', 'ENTREPRISE'), at('Jean Dupont', 'PERSONNE')], [])
    expect(view(text, spans)).toEqual([['EMAIL', 'contact@airbus.com'], ['PERSONNE', 'Jean Dupont']])
  })

  it('a NER name containing a manual term is kept whole (no partial leak)', () => {
    const spans = detectAll(text, [at('Jean Dupont', 'PERSONNE')], ['Dupont'])
    expect(view(text, spans)).toEqual([['EMAIL', 'contact@airbus.com'], ['PERSONNE', 'Jean Dupont']])
  })

  it('manual terms win over NER and are added', () => {
    const spans = detectAll(text, [at('Dupont', 'PERSONNE')], ['Jean Dupont', 'Apollo'])
    expect(view(text, spans)).toEqual([['EMAIL', 'contact@airbus.com'], ['PERSO', 'Jean Dupont'], ['PERSO', 'Apollo']])
  })

  it('works with no NER at all (model not loaded yet)', () => {
    expect(view(text, detectAll(text, [], []))).toEqual([['EMAIL', 'contact@airbus.com']])
  })
})
