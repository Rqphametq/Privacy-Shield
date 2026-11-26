/// <reference lib="webworker" />
import { env, pipeline, type ProgressInfo } from '@huggingface/transformers'
import ortMjs from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url'
import ortWasm from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url'
import { detectNer, type NerEntity } from '../core/ner'
import { MODEL_ID } from './modelId'
import type { Span } from '../core/types'

export type WorkerRequest = { id: number; type: 'load' } | { id: number; type: 'detect'; text: string }
export type WorkerResponse =
  | { type: 'progress'; info: ProgressInfo }
  | { type: 'result'; id: number; spans?: Span[] }
  | { type: 'error'; id: number; message: string }

// Model files are served by our own site (public/models/, filled by scripts/fetch-model.mjs), then kept
// in the browser cache. No request to any third party; user text never leaves this worker.
env.allowRemoteModels = false
env.allowLocalModels = true
env.localModelPath = `${import.meta.env.BASE_URL}models/`
// Serve the ONNX runtime from our own build instead of Transformers.js' default jsDelivr CDN.
// shortcut: asyncify build only; Safari < 26 without WebGPU needs the plain build, add it if Safari support matters.
env.backends.onnx.wasm!.wasmPaths = { mjs: ortMjs, wasm: ortWasm }

const ctx = self as unknown as DedicatedWorkerGlobalScope
const send = (msg: WorkerResponse) => ctx.postMessage(msg)

type Ner = (text: string, opts: { aggregation_strategy: 'simple' }) => Promise<unknown>
let model: Promise<Ner> | undefined
const load = () =>
  (model ??= pipeline('token-classification', MODEL_ID, {
    dtype: 'q8',
    progress_callback: info => send({ type: 'progress', info }),
  }) as unknown as Promise<Ner>)

ctx.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  try {
    const ner = await load()
    if (data.type === 'load') return send({ type: 'result', id: data.id })
    const spans = await detectNer(data.text, async chunk => (await ner(chunk, { aggregation_strategy: 'simple' })) as NerEntity[])
    send({ type: 'result', id: data.id, spans })
  } catch (err) {
    model = undefined // allow a retry (e.g. network failure during first download)
    send({ type: 'error', id: data.id, message: err instanceof Error ? err.message : String(err) })
  }
}
