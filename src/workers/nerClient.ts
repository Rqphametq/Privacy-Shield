import type { ProgressInfo } from '@huggingface/transformers'
import type { Span } from '../core/types'
import type { WorkerRequest, WorkerResponse } from './ner.worker'

/** Main-thread handle on the NER worker: promise-based load/detect, progress via callback. */
export function createNerClient(onProgress: (info: ProgressInfo) => void) {
  const worker = new Worker(new URL('./ner.worker.ts', import.meta.url), { type: 'module' })
  const pending = new Map<number, { resolve: (spans: Span[]) => void; reject: (e: Error) => void }>()
  let nextId = 0

  worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
    if (data.type === 'progress') return onProgress(data.info)
    const p = pending.get(data.id)
    pending.delete(data.id)
    if (data.type === 'error') p?.reject(new Error(data.message))
    else p?.resolve(data.spans ?? [])
  }

  const call = (req: { type: 'load' } | { type: 'detect'; text: string }) =>
    new Promise<Span[]>((resolve, reject) => {
      const id = nextId++
      pending.set(id, { resolve, reject })
      worker.postMessage({ ...req, id } satisfies WorkerRequest)
    })

  return {
    load: () => call({ type: 'load' }).then(() => undefined),
    detect: (text: string) => call({ type: 'detect', text }),
    terminate: () => worker.terminate(),
  }
}
