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
    const chars = [...ent.word.replace(/##/g, '').replace(/\s+/g, '')]
    if (!category || chars.length === 0) continue
    // The 'simple' aggregation can split a word: "Ch" + "##loé Lambert" is one entity, so search from the previous one.
    const prev = ent.word.startsWith('##') ? out.at(-1) : undefined
    const re = new RegExp(chars.map(esc).join('\\s*'), 'gu')
    re.lastIndex = prev ? prev.start - offset : cursor
    const m = re.exec(chunk)
    if (!m) continue
    let start = m.index, end = start + m[0].length
    while (isWordChar(chunk[start - 1])) start--
    while (isWordChar(chunk[end])) end++
    if (prev && start + offset <= prev.end) {
      prev.end = Math.max(prev.end, end + offset)
      prev.text = chunk.slice(prev.start - offset, prev.end - offset)
    } else out.push({ start: start + offset, end: end + offset, category, text: chunk.slice(start, end), source: 'ner' })
    cursor = Math.max(cursor, end)
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

const norm = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’]/g, "'").replace(/^(?:l'|(?:le|la|les|une?|des)\s+)/, '').replace(/[.,;:]+$/, '').trim()

// Words the model often tags as ORG/LOC/PER that identify nobody: contract roles, legal forms, institutions.
const NOT_PERSONAL = new Set([
  'prestataire', 'client', 'clients', 'partie', 'parties', 'contrat', 'fournisseur', 'acheteur', 'vendeur', 'bailleur',
  'preneur', 'locataire', 'employeur', 'salarie', 'mandant', 'mandataire', 'cedant', 'cessionnaire', 'licencie',
  'concedant', 'sous-traitant', 'societe', 'beneficiaire', 'souscripteur', 'assureur', 'assure', 'emprunteur', 'preteur',
  'utilisateur', 'editeur', 'distributeur', 'franchiseur', 'franchise', 'titulaire', 'donneur d\'ordre', 'annexe',
  'freelance', 'responsable de traitement', 'acquereur', 'notaire', 'office notarial',
  'sas', 'sasu', 'sarl', 'sa', 'eurl', 'sci', 'snc', 'scop', 'gie', 'selarl',
  'rcs', 'tva', 'ue', 'union europeenne', 'rgpd', 'cnil', 'insee', 'urssaf', 'siren', 'siret', 'iban', 'bic', 'rib', 'ht', 'ttc',
  'code civil', 'code de commerce', 'code du travail', 'cgi', 'journal officiel',
  'parlement europeen', 'conseil', 'commission europeenne', 'espace economique europeen', 'espace',
  'm', 'm.', 'mme', 'mlle', 'mr', 'dr', 'me', 'le', 'la', 'les', 'de', 'du', 'des', 'et',
  // job titles and governance bodies (internal notes, board minutes)
  'directeur', 'directrice', 'direction', 'direction generale', 'directeur general', 'directrice generale', 'president',
  'presidente', 'pdg', 'drh', 'daf', 'dsi', 'gerant', 'gerante', 'associe', 'associee', 'administrateur', 'administratrice',
  'secretaire', 'comite de direction', 'codir', 'comex', 'cse', 'comite social et economique', 'conseil d\'administration',
  // report headings and finance terms
  'sommaire', 'synthese', 'conclusions', 'rubrique', 'objet', 'total', 'reclassement', 'suppression', 'effectif', 'ebitda', 'ebit', 'bfr', 'capex', 'opex', 'besoin',
])
// "I. RAPPEL DES FAITS", "2) Objet": numbered headings.
const HEADING = /^(?:[ivxlc]+|\d+)[.)]\s/
// Courts, arbitration chambers, trade registries ("RCS Bordeaux").
const INSTITUTION = /^(?:tribunal|cour|chambre|conseil de prud'?hommes|conseil d'etat|rcs|mairie|prefecture)\b/

/** Split a NER span at line breaks and column gaps (2+ spaces): "Karim Benali        Le Salarié" is two cells. */
const cells = (s: Span): Span[] =>
  [...s.text.matchAll(/\S+(?:[ \t]\S+)*/g)].map(m => ({ ...s, start: s.start + m.index!, end: s.start + m.index! + m[0].length, text: m[0] }))

/** Terms the document defines for itself: ci-après « le Prestataire », (la « Plateforme »). */
function definedTerms(text: string): Set<string> {
  const out = new Set<string>()
  for (const m of text.matchAll(/(?:\b(?:le|la|les|une?|des)\s*|\bl['’]\s*)«\s*([^»]{1,60}?)\s*»|«\s*((?:le|la|les|une?|des)\s+[^»]{1,60}?|l['’][^»]{1,60}?)\s*»/giu)) {
    out.add(norm(m[1] ?? m[2]))
  }
  return out
}

/** Final detection: manual terms > regex > NER, overlaps resolved by mergeSpans. NER noise is dropped first. */
export function detectAll(text: string, nerSpans: Span[], terms: string[]): Span[] {
  const defined = definedTerms(text)
  const ner = nerSpans.flatMap(cells).filter(s => {
    const n = norm(s.text)
    const noise = (w: string) => NOT_PERSONAL.has(w) || defined.has(w)
    // A name always has a capital letter: "la centrale", "le site" are common nouns.
    return /\p{Lu}/u.test(s.text) && !noise(n) && !noise(n.replace(/s$/, '')) && !INSTITUTION.test(n) && !HEADING.test(n)
  })
  return mergeSpans([...findTerms(text, terms), ...detectRegex(text), ...ner, ...otherMentions(text, ner)])
}

/** The model can miss a later mention of a name it found once (signature block, other context): mask them all. */
function otherMentions(text: string, ner: Span[]): Span[] {
  const known = new Map<string, Span['category']>()
  for (const s of ner) if (s.text.length > 2 && !known.has(s.text)) known.set(s.text, s.category)
  const out: Span[] = []
  for (const [value, category] of known) {
    // Case-sensitive, whole word: "Tours" (the city) must not hit "les tours". The all-caps form is the same
    // name in a letterhead or a title ("Arvelle" → "CABINET ARVELLE").
    const forms = [...new Set([value, value.toUpperCase()])].map(esc).join('|')
    for (const m of text.matchAll(new RegExp(`(?<![\\p{L}\\p{N}])(?:${forms})(?![\\p{L}\\p{N}])`, 'gu'))) {
      out.push({ start: m.index!, end: m.index! + m[0].length, category, text: m[0], source: 'ner' })
    }
  }
  return out
}
