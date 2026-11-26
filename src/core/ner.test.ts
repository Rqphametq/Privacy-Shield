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
    expect(view(text, spans)).toEqual([['EMAIL', 'contact@airbus.com'], ['PERSONNE', 'Jean Dupont'], ['PROJET', 'Apollo']])
  })

  it('a NER name containing a manual term is kept whole (no partial leak)', () => {
    const spans = detectAll(text, [at('Jean Dupont', 'PERSONNE')], ['Dupont'])
    expect(view(text, spans)).toEqual([['EMAIL', 'contact@airbus.com'], ['PERSONNE', 'Jean Dupont'], ['PROJET', 'Apollo']])
  })

  it('manual terms win over NER and are added', () => {
    const spans = detectAll(text, [at('Dupont', 'PERSONNE')], ['Jean Dupont', 'Apollo'])
    expect(view(text, spans)).toEqual([['EMAIL', 'contact@airbus.com'], ['PERSO', 'Jean Dupont'], ['PERSO', 'Apollo']])
  })

  it('works with no NER at all (model not loaded yet)', () => {
    expect(view(text, detectAll(text, [], []))).toEqual([['EMAIL', 'contact@airbus.com'], ['PROJET', 'Apollo']])
  })
})

describe('detectAll drops NER words that are not personal data', () => {
  const ner = (text: string, words: [string, 'PERSONNE' | 'ENTREPRISE' | 'LIEU'][]) => {
    let from = 0
    return words.map(([w, category]) => {
      const start = text.indexOf(w, from); from = start + w.length
      return { start, end: start + w.length, category, text: w, source: 'ner' as const }
    })
  }

  it('contract roles, legal forms, institutions and courts', () => {
    const text = 'Le Prestataire et le Client (SAS, RCS, TVA) : règlement (UE), Union européenne, Tribunal de commerce de Lyon, Cour d’appel de Paris. Signé par Claire Fontaine pour Nexora.'
    const spans = detectAll(text, ner(text, [
      ['Prestataire', 'ENTREPRISE'], ['Client', 'ENTREPRISE'], ['SAS', 'ENTREPRISE'], ['RCS', 'ENTREPRISE'],
      ['TVA', 'ENTREPRISE'], ['UE', 'ENTREPRISE'], ['Union européenne', 'ENTREPRISE'],
      ['Tribunal de commerce de Lyon', 'ENTREPRISE'], ['Cour d’appel de Paris', 'ENTREPRISE'],
      ['Claire Fontaine', 'PERSONNE'], ['Nexora', 'ENTREPRISE'],
    ]), [])
    expect(view(text, spans)).toEqual([['PERSONNE', 'Claire Fontaine'], ['ENTREPRISE', 'Nexora']])
  })

  it('terms the contract itself defines in quotes (« le Bailleur », la « Plateforme ») are not entities', () => {
    const text = 'Mme Durand, ci-après « le Bailleur », loue la plateforme « BellecourTrack » (la « Plateforme »). Le Bailleur et la Plateforme.'
    const spans = detectAll(text, ner(text, [
      ['Durand', 'PERSONNE'], ['Bailleur', 'ENTREPRISE'], ['BellecourTrack', 'ENTREPRISE'], ['Plateforme', 'ENTREPRISE'],
      ['Bailleur', 'ENTREPRISE'], ['Plateforme', 'ENTREPRISE'],
    ]), [])
    expect(view(text, spans)).toEqual([['PERSONNE', 'Durand'], ['ENTREPRISE', 'BellecourTrack']])
  })
})

describe('eval findings on real model output', () => {
  it('a "##" sub-word entity continues the previous one ("Ch" + "##loé Lambert")', () => {
    const text = 'Mme Chloé Lambert, IBAN'
    expect(locateEntities([
      { entity_group: 'PER', score: 1, word: 'Ch' },
      { entity_group: 'PER', score: 0.9, word: '##loé Lambert' },
    ], text, 0).map(s => s.text)).toEqual(['Chloé Lambert'])
  })

  it('NER spans are cut at column gaps and line breaks; lowercase words, titles and roles are dropped', () => {
    const text = 'Pour l’Employeur, Karim Benali                Le Salarié, M. Lucas, le site de la centrale, le RIB, le Freelance'
    const at = (w: string, category: 'PERSONNE' | 'ENTREPRISE') => {
      const start = text.indexOf(w)
      return { start, end: start + w.length, category, text: w, source: 'ner' as const }
    }
    const spans = detectAll(text, [
      at('Karim Benali                Le Salarié', 'PERSONNE'), at('M.', 'PERSONNE'), at('Lucas', 'PERSONNE'),
      at('centrale', 'ENTREPRISE'), at('RIB', 'ENTREPRISE'), at('Freelance', 'ENTREPRISE'),
    ], [])
    expect(view(text, spans)).toEqual([['PERSONNE', 'Karim Benali'], ['PERSONNE', 'Lucas']])
  })

  it('registries, arbitration chambers and EU bodies are not entities', () => {
    const text = 'RCS Bordeaux, Chambre arbitrale internationale de Paris, Parlement européen, Conseil, Espace économique européen.'
    const words = ['RCS Bordeaux', 'Chambre arbitrale internationale de Paris', 'Parlement européen', 'Conseil', 'Espace économique européen']
    const spans = detectAll(text, words.map(w => {
      const start = text.indexOf(w)
      return { start, end: start + w.length, category: 'ENTREPRISE' as const, text: w, source: 'ner' as const }
    }), [])
    expect(spans).toEqual([])
  })
})

describe('blind eval findings', () => {
  const span = (text: string, w: string, category: 'PERSONNE' | 'ENTREPRISE' | 'LIEU', from = 0) => {
    const start = text.indexOf(w, from)
    return { start, end: start + w.length, category, text: w, source: 'ner' as const }
  }

  it('a name found once is masked at every mention, case-sensitively and as a whole word', () => {
    const text = 'Je soussigné, Thibault Garnier-Lemoine, à Tours. Signature :\nThibault Garnier-Lemoine\nles tours du château, Toursaint'
    const spans = detectAll(text, [span(text, 'Thibault Garnier-Lemoine', 'PERSONNE'), span(text, 'Tours', 'LIEU')], [])
    expect(view(text, spans)).toEqual([['PERSONNE', 'Thibault Garnier-Lemoine'], ['LIEU', 'Tours'], ['PERSONNE', 'Thibault Garnier-Lemoine']])
  })

  it('buyers/sellers (plural too), town halls and prefectures are not entities', () => {
    const text = "l'Acquéreur et les Vendeurs, mariés à la mairie de Rennes, déclarée en préfecture des Bouches-du-Rhône"
    const spans = detectAll(text, [span(text, 'Acquéreur', 'ENTREPRISE'), span(text, 'Vendeurs', 'ENTREPRISE'),
      span(text, 'mairie de Rennes', 'ENTREPRISE'), span(text, 'préfecture des Bouches-du-Rhône', 'ENTREPRISE')], [])
    expect(spans).toEqual([])
  })
})

describe('internal documents (Doc1–Doc5)', () => {
  const ner = (text: string, words: [string, 'PERSONNE' | 'ENTREPRISE' | 'LIEU'][]) => {
    let from = 0
    return words.map(([w, category]) => {
      const start = text.indexOf(w, from); from = start + w.length
      return { start, end: start + w.length, category, text: w, source: 'ner' as const }
    })
  }

  it('a name found in normal case is also masked when written in capitals', () => {
    const text = 'CABINET ARVELLE & ASSOCIÉS\nRapport du cabinet Arvelle & Associés.'
    const spans = detectAll(text, ner(text, [['Arvelle', 'ENTREPRISE']]), [])
    expect(view(text, spans)).toEqual([['ENTREPRISE', 'ARVELLE'], ['ENTREPRISE', 'Arvelle']])
  })

  it('job titles, governance bodies, report headings and finance terms are not entities', () => {
    const text = 'la Directrice, la Direction générale, le Comité de direction, le CSE. SOMMAIRE EBITDA BESOIN I. RAPPEL DES FAITS'
    const spans = detectAll(text, ner(text, [['Directrice', 'ENTREPRISE'], ['Direction générale', 'ENTREPRISE'],
      ['Comité de direction', 'ENTREPRISE'], ['CSE.', 'PERSONNE'], ['SOMMAIRE', 'ENTREPRISE'], ['EBITDA', 'ENTREPRISE'],
      ['BESOIN', 'ENTREPRISE'], ['I. RAPPEL DES FAITS', 'ENTREPRISE']]), [])
    expect(spans).toEqual([])
  })
})
