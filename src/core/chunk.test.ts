import { describe, expect, it } from 'vitest'
import { chunkText, type Chunk } from './chunk'

/** Every chunk is an exact slice of the original, within budget, and together they cover the text. */
function checkInvariants(text: string, chunks: Chunk[], max: number) {
  let covered = 0
  for (const c of chunks) {
    expect(c.text.length).toBeLessThanOrEqual(max)
    expect(text.slice(c.offset, c.offset + c.text.length)).toBe(c.text)
    expect(c.offset).toBeLessThanOrEqual(covered) // no gap
    covered = Math.max(covered, c.offset + c.text.length)
  }
  expect(covered).toBe(text.length)
}

const sentence = (i: number) => `Phrase numéro ${i} du contrat, signée par la partie concernée. `

describe('chunkText', () => {
  it('short text is a single chunk at offset 0', () => {
    expect(chunkText('Bonjour Jean.', 100, 20)).toEqual([{ text: 'Bonjour Jean.', offset: 0 }])
  })

  it('empty text gives no chunk', () => {
    expect(chunkText('', 100, 20)).toEqual([])
  })

  it('cuts on sentence boundaries, with overlap', () => {
    const text = Array.from({ length: 30 }, (_, i) => sentence(i)).join('')
    const chunks = chunkText(text, 300, 80)
    expect(chunks.length).toBeGreaterThan(1)
    checkInvariants(text, chunks, 300)
    for (let i = 1; i < chunks.length; i++) {
      const prevEnd = chunks[i - 1].offset + chunks[i - 1].text.length
      expect(chunks[i].offset).toBeLessThan(prevEnd) // overlap
      expect(chunks[i - 1].text.trimEnd().endsWith('.')).toBe(true) // ends on a sentence
    }
  })

  it('also cuts on newlines (paragraphs)', () => {
    const text = 'Objet : contrat de prestation\nEntre les soussignés\n' + 'x'.repeat(40)
    const chunks = chunkText(text, 60, 25)
    checkInvariants(text, chunks, 60)
    expect(chunks[0].text.endsWith('\n')).toBe(true)
  })

  it('hard-splits a sentence longer than the budget, never cutting a word', () => {
    const words = Array.from({ length: 200 }, (_, i) => `mot${i}`)
    const text = words.join(' ')
    const chunks = chunkText(text, 120, 40)
    checkInvariants(text, chunks, 120)
    for (const c of chunks) {
      const end = c.offset + c.text.length
      expect(c.offset === 0 || text[c.offset - 1] === ' ').toBe(true)
      expect(end === text.length || text[end - 1] === ' ').toBe(true)
    }
  })

  it('an entity sitting on a boundary is whole in at least one chunk', () => {
    const filler = Array.from({ length: 60 }, (_, i) => `clause${i}`).join(' ')
    const text = `${filler} Jean-Baptiste Dupont ${filler}`
    const at = text.indexOf('Jean-Baptiste Dupont')
    for (const max of [100, 150, 230, 400]) {
      const chunks = chunkText(text, max, 60)
      expect(chunks.some(c => c.offset <= at && at + 20 <= c.offset + c.text.length)).toBe(true)
    }
  })

  it('rejects overlap >= max', () => {
    expect(() => chunkText('abc', 10, 10)).toThrow()
  })
})
