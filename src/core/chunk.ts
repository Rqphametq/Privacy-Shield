export interface Chunk {
  text: string
  offset: number // index of text[0] in the original
}

type Range = [start: number, end: number]

/** Split [start, end) into whitespace-bounded pieces of at most `size` chars (a longer single word is cut). */
function splitWords(text: string, start: number, end: number, size: number, out: Range[]) {
  let from = start
  for (const m of text.slice(start, end).matchAll(/\S+\s*/g)) {
    let wStart = start + m.index!
    const wEnd = wStart + m[0].length
    if (wEnd - from > size && wStart > from) { out.push([from, wStart]); from = wStart }
    while (wEnd - wStart > size) { out.push([wStart, wStart + size]); wStart += size; from = wStart }
  }
  if (from < end) out.push([from, end])
}

/**
 * Cut `text` into chunks of at most `maxChars`, on sentence/paragraph boundaries,
 * each chunk repeating up to `overlap` chars of trailing pieces from the previous one.
 * Sentences longer than `maxChars` are split on whitespace into pieces <= `overlap`,
 * so an entity cut by one chunk boundary is whole in the next chunk.
 */
export function chunkText(text: string, maxChars = 1000, overlap = 200): Chunk[] {
  if (overlap >= maxChars) throw new Error('chunkText: overlap must be < maxChars')
  const pieces: Range[] = []
  let start = 0
  const push = (end: number) => {
    if (end <= start) return
    if (end - start <= maxChars) pieces.push([start, end])
    else splitWords(text, start, end, overlap, pieces)
    start = end
  }
  for (const m of text.matchAll(/[.!?…]+\s+|\n+/g)) push(m.index! + m[0].length)
  push(text.length)

  const chunks: Chunk[] = []
  let i = 0
  while (i < pieces.length) {
    const from = pieces[i][0]
    let j = i
    while (j + 1 < pieces.length && pieces[j + 1][1] - from <= maxChars) j++
    chunks.push({ text: text.slice(from, pieces[j][1]), offset: from })
    if (j === pieces.length - 1) break
    let k = j + 1
    while (k - 1 > i && pieces[j][1] - pieces[k - 1][0] <= overlap) k--
    i = k
  }
  return chunks
}
