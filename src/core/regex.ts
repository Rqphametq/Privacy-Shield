import type { Category, Span } from './types'

const NUM = String.raw`\d{1,3}(?:[   .,']\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?`
const CUR_AFTER = String.raw`\s?(?:k€|M€|€|EUR\b|euros?\b|\$|USD\b|£|GBP\b|CHF\b)`
// "article 3 500 €": the number right after a reference word is not part of the amount.
const NOT_AFTER_REF = String.raw`(?<!\b(?:articles?|art\.|n°|no\.|alinéas?|al\.|clauses?|sections?|chapitres?|pages?|p\.|points?|annexes?)\s*)`

interface Rule {
  category: Category
  re: RegExp
  /** `before`: the text preceding the match, to accept a value announced by its label. */
  valid?: (match: string, before: string) => boolean
}

const digits = (s: string) => s.replace(/\D/g, '')

/** Luhn checksum, used by SIREN/SIRET. */
export function luhn(num: string): boolean {
  let sum = 0
  for (let i = 0; i < num.length; i++) {
    let d = Number(num[num.length - 1 - i])
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return num.length > 0 && sum % 10 === 0
}

/** ISO 13616 mod-97 check. */
export function ibanValid(raw: string): boolean {
  const s = raw.replace(/\s/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false
  const moved = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55))
  let rem = 0
  for (const ch of moved) rem = (rem * 10 + Number(ch)) % 97
  return rem === 1
}

// A label right before the value ("SIREN 842 117 396", "IBAN : FR76…") is enough evidence: fictitious or
// mistyped numbers that fail their checksum must still be masked.
const labelled = (label: string) => new RegExp(String.raw`\b(?:${label})\b[^\d\n]{0,70}$`, 'i')
const SIREN_LABEL = labelled('SIRE[NT]|RCS|registre du commerce')
const IBAN_LABEL = labelled('IBAN')
// An IBAN-shaped value with its country's exact length is an IBAN even if mistyped (checksum fails).
const IBAN_LENGTH: Record<string, number> = { FR: 27, MC: 27, IT: 27, BE: 16, DE: 22, ES: 24, CH: 21, LU: 20, GB: 22, NL: 18, PT: 25, AT: 20, IE: 22 }
const ibanShaped = (m: string) => IBAN_LENGTH[m.slice(0, 2)] === m.replace(/\s/g, '').length

const NIR_LABEL = labelled('s[ée]curit[ée] sociale|NIR|NNI')

/** French social security number (NIR): 13 digits (Corsica 2A/2B) + key = 97 − (number mod 97). */
export function nirValid(raw: string): boolean {
  const s = raw.replace(/[\s.]/g, '').toUpperCase().replace(/^(.{5})2A/, '$119').replace(/^(.{5})2B/, '$118')
  if (!/^\d{15}$/.test(s)) return false
  let rem = 0
  for (const ch of s.slice(0, 13)) rem = (rem * 10 + Number(ch)) % 97
  return 97 - rem === Number(s.slice(13))
}

const W = String.raw`\p{Lu}[\p{L}\d'’&-]*` // capitalised or upper-case word
const PART = String.raw`(?:de|du|des|la|le|les|aux?|sur|sous|en|et|[dl]['’])`
// One or two spaces, same line only: a line break or a column gap ends a name or an address.
const S = String.raw`[ \t]{1,2}`
// Postcode (01000–98999) then city, optional Cedex.
const CITY = String.raw`(?:0[1-9]|[1-8]\d|9[0-8])\d{3}${S}(?!Cedex|CEDEX)${W}(?:(?:${S}|-)(?:${PART}(?:${S}|-)?)?(?!Cedex|CEDEX)${W})*(?:${S}(?:Cedex|CEDEX)(?:${S}\d{1,2})?)?`
const STREET_TYPES = ['rue', 'avenue', 'av\\.', 'boulevard', 'bd', 'place', 'allée', 'impasse', 'chemin', 'route', 'quai', 'cours',
  'square', 'passage', 'voie', 'esplanade', 'promenade', 'rond-point', 'faubourg', 'lieu-dit', 'résidence', 'parvis', 'sentier', 'cité', 'hameau']
  .map(t => `[${t[0]}${t[0].toUpperCase()}]${t.slice(1)}`).join('|')
// "18 rue de la Barre, CS 20722, 69002 Lyon": number (bis/ter), street type, a name with at least one
// capitalised word or number, optional postal box and postcode + city.
const STREET = String.raw`(?<![\p{L}\d.,])\d{1,4}(?:${S}?(?:bis|ter|quater))?,?${S}(?:${STREET_TYPES})(?:${S}${PART})*(?:${S})?(?:${W}|\d+)(?:${S}(?:${PART}(?:${S})?)*(?:${W}|\d+))*(?:,?${S}(?:CS|BP|TSA)${S}\d{1,6})?(?:,?${S}${CITY})?`

// Company names next to their legal form: "NOVALIS DIGITAL SOLUTIONS SAS", "SARL Dupont & Fils".
const FORMS = 'SASU|SAS|SARL|EURL|SA|SCI|SNC|SCS|SCA|SCOP|SELARL|SELAS|SCP|GIE|SEM|GmbH|GMBH|Ltd|LTD|Limited|LIMITED|LLC|LLP|Inc|INC|PLC|AG|BV|NV|SpA|SRL'
const NOT_FIRST = String.raw`(?!(?:Entre|Et|Ou|Le|La|Les|Par|Pour|Avec|Chez|Dont|Société|Ci|À|For|By)(?![\p{L}\d]))`
const NAME_TAIL = String.raw`(?:${S}(?:(?:de|du|des|et)${S})?(?:${W}|&|\d+))`
const COMPANY = String.raw`(?<![\p{L}\d'’&-])(?:${NOT_FIRST}${W}${NAME_TAIL}{0,5}${S}(?:${FORMS})|(?:${FORMS})${NAME_TAIL}{1,6})(?![\p{L}\d])`
const MONTH = 'janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre'

const RULES: Rule[] = [
  { category: 'EMAIL', re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}/gi },
  { category: 'URL', re: /\b(?:https?:\/\/|www\.)[^\s<>"'()[\]]+/gi },
  { category: 'IBAN', re: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,3})?\b/g, valid: (m, before) => ibanValid(m) || ibanShaped(m) || IBAN_LABEL.test(before) },
  { category: 'BIC', re: /(?<=\b(?:BIC|SWIFT)(?:\s*\/\s*SWIFT)?\s*(?:[:：]\s*)?)[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g },
  { category: 'SIRET', re: /\b\d{3} ?\d{3} ?\d{3} ?\d{5}\b/g, valid: (m, before) => luhn(digits(m)) || SIREN_LABEL.test(before) },
  { category: 'SIREN', re: /\b\d{3} ?\d{3} ?\d{3}\b/g, valid: (m, before) => luhn(digits(m)) || SIREN_LABEL.test(before) },
  { category: 'ADRESSE', re: new RegExp(STREET, 'gu') },
  { category: 'ADRESSE', re: new RegExp(String.raw`(?<!\d[ .,]?)(?<![\p{L}\d])${CITY}`, 'gu') },
  { category: 'ADRESSE', re: new RegExp(String.raw`(?<![\p{L}\d])(?:Parc|Zone|ZAC|ZA|ZI|Technop[ôo]le|Résidence|Lotissement|Domaine)(?:${S}(?:d['’]activités?|d['’]affaires|industrielle|artisanale|commerciale))?(?:${S}${PART})*(?:${S})?${W}(?:${S}(?:${PART}(?:${S})?)*${W})*`, 'gu') },
  { category: 'ADRESSE', re: /\b[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}\b/g }, // UK postcode
  { category: 'ENTREPRISE', re: new RegExp(COMPANY, 'gu') },
  { category: 'NIR', re: /\b[12][ .]?\d{2}[ .]?(?:0[1-9]|1[0-2]|[2-9]\d)[ .]?(?:\d{2}|2[AB])[ .]?\d{3}[ .]?\d{3}[ .]?\d{2}\b/g, valid: (m, before) => nirValid(m) || NIR_LABEL.test(before) },
  { category: 'NAISSANCE', re: new RegExp(String.raw`(?<=\bn[ée]e?\s+le\s+)(?:\d{1,2}(?:er)?\s+(?:${MONTH})\s+\d{4}|\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})`, 'giu') },
  // FR: 0X XX XX XX XX, +33 X XX XX XX XX, 0033..., +33 (0)X...
  { category: 'TELEPHONE', re: /(?<![\w+])(?:(?:\+|00)33[ .-]?(?:\(0\)[ .-]?)?|0)[1-9](?:[ .-]?\d{2}){4}(?!\d)/g },
  // International: +CC then 6–14 more digits in groups.
  { category: 'TELEPHONE', re: /(?<![\w+])\+\d{1,3}(?:[ .-]?\(?\d{1,4}\)?){2,5}(?!\d)/g, valid: m => digits(m).length >= 8 && digits(m).length <= 15 },
  { category: 'MONTANT', re: new RegExp(String.raw`(?:[€$£]\s?(?:${NUM}))|(?<![\d.,])${NOT_AFTER_REF}(?:${NUM})${CUR_AFTER}`, 'gi') },
  // Contract, policy or file numbers announced by their label: "contrat n° 77-4521-B", "Réf. NDS-GBL-2026-117".
  { category: 'REFERENCE', re: /(?<=(?:\b[nN]°|\b[nN]o\.|\b[nN]um[ée]ro|\b[Rr][ée]f\.|\b[Rr][ée]f[ée]rence|\b[Cc]ompany number|\b[Rr]egistration number)\s*:?\s*)(?!(?:SIRE[NT]|RCS|TVA|IBAN|NIR)\b)[A-Z0-9](?:[A-Z0-9/-]*[A-Z0-9])?(?: [A-Z0-9-]*\d[A-Z0-9-]*)*/g,
    // Spaced digit groups belong to it ("CPI 3301 2019 000 041 207"); "lot n° 2" is too short to identify anyone.
    valid: m => /\d/.test(m) && m.replace(/\s/g, '').length >= 4 },
  // Project codenames are confidential: "Projet « COLIBRI »", "PROJET COLIBRI", "Opération Atlas".
  { category: 'PROJET', re: /(?<=(?:\b[Pp]rojet|\bPROJET|\b[Oo]pération|\bOPÉRATION|\b[Nn]om de code|\b[Cc]ode name)\s+(?:«\s*)?)\p{Lu}[\p{L}\d-]*/gu },
  { category: 'REFERENCE', re: /\bsection [A-Z]{1,2} (?:n°|numéro|no\.?) ?\d+/g }, // cadastral parcel
  { category: 'IP', re: /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g },
]

function trimTrailingPunct(text: string, start: number, end: number): number {
  while (end > start && /[.,;:!?]/.test(text[end - 1])) end--
  return end
}

/** Deterministic detectors. Overlaps are left to mergeSpans. */
export function detectRegex(text: string): Span[] {
  const out: Span[] = []
  for (const { category, re, valid } of RULES) {
    for (const m of text.matchAll(re)) {
      const start = m.index!
      let end = start + m[0].length
      if (category === 'URL' || category === 'EMAIL') end = trimTrailingPunct(text, start, end)
      // "(…, +33 6 21 45 87 30)": the closing parenthesis belongs to the sentence, not the number.
      if (category === 'TELEPHONE' && text[end - 1] === ')' && !text.slice(start, end).includes('(')) end--
      const value = text.slice(start, end)
      if (valid && !valid(value, text.slice(Math.max(0, start - 90), start))) continue
      out.push({ start, end, category, text: value, source: 'regex' })
    }
  }
  return out
}

/** Every case-insensitive, whole-word occurrence of user-supplied terms. */
export function findTerms(text: string, terms: string[]): Span[] {
  const out: Span[] = []
  for (const term of terms.map(t => t.trim()).filter(Boolean)) {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    for (const m of text.matchAll(new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, 'giu'))) {
      out.push({ start: m.index!, end: m.index! + m[0].length, category: 'PERSO', text: m[0], source: 'manual' })
    }
  }
  return out
}
