export const ACCEPTED = '.txt,.md,.docx'

/** Reads a local file as plain text, entirely in the browser. .docx is converted with mammoth (lazy-loaded). */
export async function readTextFile(file: File): Promise<string> {
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (ext === '.txt' || ext === '.md') return file.text()
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
