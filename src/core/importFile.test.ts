import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readTextFile } from './importFile'
import { detectRegex } from './regex'

// The first dynamic import of mammoth can take >5s on a cold cache (CI): allow more than Vitest's default.
describe('readTextFile', { timeout: 30_000 }, () => {
  it('reads .txt and .md as UTF-8 text', async () => {
    expect(await readTextFile(new File(['Bonjour Clément'], 'note.txt'))).toBe('Bonjour Clément')
    expect(await readTextFile(new File(['# Titre\n- point'], 'README.MD'))).toBe('# Titre\n- point')
  })

  it('extracts raw text from .docx, one paragraph per line', async () => {
    const buf = readFileSync(new URL('./__fixtures__/sample.docx', import.meta.url))
    const text = await readTextFile(new File([buf], 'contrat.docx'))
    expect(text.trim()).toBe('Contrat entre Claire Fontaine\n\nEmail : claire@nexora.example')
  })

  it('rejects unsupported formats', async () => {
    await expect(readTextFile(new File(['abc'], 'photo.png'))).rejects.toThrow(/non pris en charge/)
  })

  describe('.pdf (text layer)', () => {
    const pdf = (name: string) => new File([readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url))], name)

    it('extracts all text in reading order, with accents, pages separated by a blank line', async () => {
      const text = await readTextFile(pdf('text.pdf'))
      // Short single-line paragraphs may be joined with a space (no line reaches the margin to tell
      // a wrap from a break): harmless, unlike splitting an entity. Only order and content are pinned.
      expect(text.replace(/\s+/g, ' ')).toBe(
        'Contrat de prestation Entre Nexora Conseil SAS, représentée par Claire Fontaine, ' +
          'Email : claire.fontaine@nexora.example — Tél. : 06 39 98 12 34 ' +
          'Article 2 – Prix : 48 500,00 € HT, payable sur l’IBAN FR76 3000 6000 0112 3456 7890 189.',
      )
      expect(text).toMatch(/12 34\n\nArticle 2/)
    })

    it('keeps entities intact so the regex engine still finds them', async () => {
      const found = detectRegex(await readTextFile(pdf('text.pdf'))).map(s => `${s.category}:${s.text}`)
      expect(found).toEqual(expect.arrayContaining([
        'EMAIL:claire.fontaine@nexora.example',
        'TELEPHONE:06 39 98 12 34',
        'IBAN:FR76 3000 6000 0112 3456 7890 189',
        'MONTANT:48 500,00 €',
      ]))
    })

    // In wrapped.pdf the layout breaks lines inside "FR76 3000⏎6000 …" and "+33⏎1 99 00 45 67", the 2nd
    // paragraph is ragged (left-aligned), and the address block uses real line breaks.
    it('rejoins soft-wrapped lines into paragraphs but keeps real line and paragraph breaks', async () => {
      expect(await readTextFile(pdf('wrapped.pdf'))).toBe(
        'Le prestataire désigne comme interlocutrice principale Mme Claire Fontaine, joignable au 06 39 98 12 34, et ' +
          'les paiements seront effectués sur le compte FR76 3000 6000 0112 3456 7890 189 ouvert au nom de la société.\n\n' +
          'Le client désigne M. Thomas Bernard, joignable au +33 1 99 00 45 67 ou par courriel à ' +
          'thomas.bernard@batiplus.example pour toute question.\n\n' +
          'Nexora Conseil SAS\n12 rue de la République\n69002 Lyon\n\n' +
          'Fait à Lyon.',
      )
    })

    it('detects entities that the PDF layout split across two lines', async () => {
      const found = detectRegex(await readTextFile(pdf('wrapped.pdf'))).map(s => `${s.category}:${s.text}`)
      expect(found).toEqual(expect.arrayContaining([
        'IBAN:FR76 3000 6000 0112 3456 7890 189',
        'TELEPHONE:+33 1 99 00 45 67',
        'EMAIL:thomas.bernard@batiplus.example',
      ]))
    })

    it('a line ending with a hyphen continues without a space ("END-CHO-⏎2027-03", "sous-⏎traité")', async () => {
      const text = await readTextFile(pdf('hyphen-wrap.pdf'))
      expect(text).toContain('Réf. END-CHO-2027-03 –')
      expect(text).toContain('ni sous-traité sans')
    })

    it('explains that a scanned PDF (no text layer) cannot be read', async () => {
      await expect(readTextFile(pdf('scan.pdf'))).rejects.toThrow(/aucun texte/)
    })

    it('reports a corrupt PDF', async () => {
      await expect(readTextFile(new File(['%PDF-1.7 pas vraiment'], 'faux.pdf'))).rejects.toThrow(/PDF/)
    })
  })

  it('reports a corrupt .docx instead of returning garbage', async () => {
    await expect(readTextFile(new File(['pas un zip'], 'faux.docx'))).rejects.toThrow(/Word/)
  })
})
