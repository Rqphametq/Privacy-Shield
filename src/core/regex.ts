import type { Category, Span } from './types'

const NUM = String.raw`\d{1,3}(?:[   .,']\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?`
const CUR_AFTER = String.raw`\s?(?:k€|M€|€|EUR\b|euros?\b|\$|USD\b|£|GBP\b|CHF\b)`
// "article 3 500 €": the number right after a reference word is not part of the amount.
const NOT_AFTER_REF = String.raw`(?<!\b(?:articles?|art\.|n°|no\.|alinéas?|al\.|clauses?|sections?|chapitres?|pages?|p\.|points?|annexes?)\s*)`

interface Rule {
  category: Category
  re: RegExp
  valid?: (match: string) => boolean
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

const RULES: Rule[] = [
  { category: 'EMAIL', re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}/gi },
  { category: 'URL', re: /\b(?:https?:\/\/|www\.)[^\s<>"'()[\]]+/gi },
  { category: 'IBAN', re: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,3})?\b/g, valid: ibanValid },
  { category: 'SIRET', re: /\b\d{3} ?\d{3} ?\d{3} ?\d{5}\b/g, valid: m => luhn(digits(m)) },
  { category: 'SIREN', re: /\b\d{3} ?\d{3} ?\d{3}\b/g, valid: m => luhn(digits(m)) },
  // FR: 0X XX XX XX XX, +33 X XX XX XX XX, 0033..., +33 (0)X...
  { category: 'TELEPHONE', re: /(?<![\w+])(?:(?:\+|00)33[ .-]?(?:\(0\)[ .-]?)?|0)[1-9](?:[ .-]?\d{2}){4}(?!\d)/g },
  // International: +CC then 6–14 more digits in groups.
  { category: 'TELEPHONE', re: /(?<![\w+])\+\d{1,3}(?:[ .-]?\(?\d{1,4}\)?){2,5}(?!\d)/g, valid: m => digits(m).length >= 8 && digits(m).length <= 15 },
  { category: 'MONTANT', re: new RegExp(String.raw`(?:[€$£]\s?(?:${NUM}))|(?<![\d.,])${NOT_AFTER_REF}(?:${NUM})${CUR_AFTER}`, 'gi') },
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
      const value = text.slice(start, end)
      if (valid && !valid(value)) continue
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
