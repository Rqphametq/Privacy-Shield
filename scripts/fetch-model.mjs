// Downloads the NER model into public/models/ so the app serves it from its own origin
// (no runtime request to Hugging Face: no third-party CORS issues, nothing blocked by firewalls).
// Pinned to one commit and checked by SHA-256; files already present and valid are skipped.
import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const MODEL = 'Xenova/bert-base-multilingual-cased-ner-hrl'
const REVISION = '263e82c06569c8c2ac46238a7ae5107598934234'
const FILES = {
  'config.json': '7aa891abae067f95a40f5e2005b3de44824a083f256802934a993d301ec25076',
  'tokenizer.json': 'bf1b59b7b11c95f194f51708d918eea378e09d05f84c0e1656dc5180e8117088',
  'tokenizer_config.json': 'e6f3b96db926a37d4039995fbf5ad17de158dfb8f6343d607e4dbaad18d75f5a',
  'onnx/model_quantized.onnx': '5b65139844be260b624a2a13782b01d122e613d64ce16ed0ba4d82e0b816f1a9',
}
const OUT = join(import.meta.dirname, '..', 'public', 'models', MODEL)

const sha256 = async path => {
  const h = createHash('sha256')
  await pipeline(createReadStream(path), h)
  return h.digest('hex')
}

for (const [file, expected] of Object.entries(FILES)) {
  const dest = join(OUT, file)
  if (existsSync(dest) && (await sha256(dest)) === expected) continue
  mkdirSync(dirname(dest), { recursive: true })
  const url = `https://huggingface.co/${MODEL}/resolve/${REVISION}/${file}`
  console.log(`fetch-model: downloading ${file}…`)
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`fetch-model: ${url} -> HTTP ${res.status}`)
  const tmp = `${dest}.part`
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp))
  const got = await sha256(tmp)
  if (got !== expected) {
    rmSync(tmp)
    throw new Error(`fetch-model: checksum mismatch for ${file} (got ${got})`)
  }
  renameSync(tmp, dest)
}
console.log(`fetch-model: ${MODEL}@${REVISION.slice(0, 7)} ready in public/models/`)
