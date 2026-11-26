import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readTextFile } from '../src/core/importFile'
import { anonymize, createVault, deanonymize } from '../src/core/mapping'
import { detectAll } from '../src/core/ner'
import { nodeNer } from './nodeNer'

/**
 * End-to-end check on realistic fictitious contracts, with the real NER model (`npm run eval`).
 * Each contract has a `<name>.expect.json`:
 * - mask: strings that must not survive anonymization (leak check)
 * - keep: strings that must stay readable (over-anonymization check)
 * - companies: company names that must be detected whole, as ENTREPRISE
 * - otherCompanies: real third-party companies that may also be masked (bank, insurer…)
 * - tolerated: known harmless over-detections, listed so they stay visible
 * - knownMisses: known leaks we cannot catch yet (third-party name with no legal form…): the test fails
 *   if they leak no more, so the list stays true
 */
interface Expect { mask: string[]; keep: string[]; companies: string[]; otherCompanies?: string[]; tolerated?: string[]; knownMisses?: string[] }

const DIR = 'eval/contracts'
const flat = (s: string) => s.replace(/\s+/g, ' ')

describe('contracts (real model)', () => {
  for (const file of readdirSync(DIR).filter(f => /\.(txt|docx|pdf)$/.test(f))) {
    it(file, async () => {
      const exp: Expect = JSON.parse(readFileSync(`${DIR}/${file.replace(/\.\w+$/, '.expect.json')}`, 'utf8'))
      const text = await readTextFile(new File([readFileSync(`${DIR}/${file}`)], file))
      const spans = detectAll(text, await nodeNer(text), [])
      const vault = createVault()
      const anon = anonymize(text, spans, vault)
      const companies = [...new Set(spans.filter(s => s.category === 'ENTREPRISE').map(s => s.text))]
      const allowed = [...exp.companies, ...(exp.otherCompanies ?? []), ...(exp.tolerated ?? [])]

      expect({
        leaks: [...exp.mask, ...(exp.knownMisses ?? [])].filter(m => flat(anon).includes(flat(m))),
        overMasked: exp.keep.filter(k => !flat(anon).includes(flat(k))),
        missingCompanies: exp.companies.filter(c => !companies.includes(c)),
        unexpectedCompanies: companies.filter(c => !allowed.includes(c)),
        roundTrip: deanonymize(anon, vault) === text,
      }).toEqual({ leaks: exp.knownMisses ?? [], overMasked: [], missingCompanies: [], unexpectedCompanies: [], roundTrip: true })
    })
  }
})
