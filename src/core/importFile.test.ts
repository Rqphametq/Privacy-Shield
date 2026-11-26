import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readTextFile } from './importFile'

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
    await expect(readTextFile(new File(['%PDF'], 'scan.pdf'))).rejects.toThrow(/non pris en charge/)
  })

  it('reports a corrupt .docx instead of returning garbage', async () => {
    await expect(readTextFile(new File(['pas un zip'], 'faux.docx'))).rejects.toThrow(/Word/)
  })
})
