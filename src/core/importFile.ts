export const ACCEPTED = '.txt,.md,.docx,.pdf'

/** Reads a local file as plain text, entirely in the browser. .docx (mammoth) and .pdf (PDF.js) are lazy-loaded. */
export async function readTextFile(file: File): Promise<string> {
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (ext === '.txt' || ext === '.md') return file.text()
  if (ext === '.pdf') return readPdf(file)
  if (ext !== '.docx') throw new Error(`Format non pris en charge : ${file.name}. Formats acceptés : ${ACCEPTED}`)

  const { default: mammoth } = await import('mammoth')
  const data = await file.arrayBuffer()
  try {
    // Mammoth's browser build reads `arrayBuffer`, its Node build (tests) reads `buffer`.
    const { value } = await mammoth.extractRawText({ arrayBuffer: data, buffer: data } as { arrayBuffer: ArrayBuffer })
    return value
  } catch {
    throw new Error(`Impossible de lire ${file.name} : fichier Word (.docx) invalide ou corrompu.`)
  }
}

// shortcut: text layer only, no OCR; scanned PDFs are rejected with a message. Add tesseract.js if scans matter.
// Legacy build: polyfills recent JS (e.g. Math.sumPrecise) that the modern build needs and Node/older Chrome lack.
async function readPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  if (typeof document !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default
  }
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  const pages: string[] = []
  try {
    const doc = await task.promise
    for (let i = 1; i <= doc.numPages; i++) {
      const { items } = await (await doc.getPage(i)).getTextContent()
      pages.push(pageText(items.filter(it => 'str' in it)))
    }
  } catch (e) {
    const locked = e instanceof Error && e.name === 'PasswordException'
    throw new Error(`Impossible de lire ${file.name} : ${locked ? 'PDF protégé par mot de passe' : 'fichier PDF invalide ou corrompu'}.`)
  } finally {
    await task.destroy()
  }
  const text = pages.filter(p => p.trim()).join('\n\n')
  if (!text.trim()) throw new Error(`${file.name} ne contient aucun texte (PDF scanné ?). Seuls les PDF avec texte sélectionnable sont pris en charge.`)
  return text
}

interface PdfItem { str: string; hasEOL: boolean; width: number; height: number; transform: number[] }
interface Line { text: string; x: number; y: number; right: number }

/**
 * Rebuilds a page's text from positioned PDF items. Layout wraps are not content: a line that runs to the
 * right margin continues on the next one (joined with a space), so entities split by the wrap
 * ("FR76 3000⏎6000 …") stay whole. A line that stops early is a real line break; a larger vertical gap
 * is a paragraph break.
 */
// shortcut: single-column reading order and no de-hyphenation ("con-⏎trat"); add if multi-column PDFs show up.
function pageText(items: PdfItem[]): string {
  const lines: Line[] = []
  let eol = true
  for (const it of items) {
    const [, , , , x, y] = it.transform
    const cur = lines.at(-1)
    if (it.str) {
      if (!cur || eol || Math.abs(y - cur.y) > Math.max(it.height, 1) / 2) lines.push({ text: it.str, x, y, right: x + it.width })
      else { cur.text += it.str; cur.right = Math.max(cur.right, x + it.width) }
    }
    eol = it.hasEOL || (eol && !it.str)
  }
  if (!lines.length) return ''

  const gaps = lines.slice(1).map((l, i) => lines[i].y - l.y).filter(g => g > 0).sort((a, b) => a - b)
  const lineGap = gaps[Math.floor(gaps.length / 2)] ?? 0
  const margin = Math.max(...lines.map(l => l.right))

  let out = lines[0].text.trimEnd()
  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i - 1], line = lines[i]
    const gap = prev.y - line.y
    const charW = (line.right - line.x) / Math.max(line.text.length, 1)
    const firstWord = line.text.trimStart().split(/\s/)[0]
    // Did the next line's first word fit at the end of this one? Then the break was intentional.
    const fits = margin - prev.right > (firstWord.length + 1) * charW
    out += gap <= 0 || gap > lineGap * 1.5 ? '\n\n' : fits ? '\n' : ' '
    out += line.text.trim()
  }
  return out
}
