import { env, pipeline } from '@huggingface/transformers'
import { detectNer, type NerEntity } from '../src/core/ner'
import { MODEL_ID } from '../src/workers/modelId'

// Same self-hosted files and quantization as the browser worker, run with onnxruntime-node.
env.allowRemoteModels = false
env.localModelPath = 'public/models/'

type Ner = (text: string, opts: { aggregation_strategy: 'simple' }) => Promise<unknown>
let model: Promise<Ner> | undefined

export async function nodeNer(text: string) {
  const ner = await (model ??= pipeline('token-classification', MODEL_ID, { dtype: 'q8' }) as unknown as Promise<Ner>)
  return detectNer(text, async chunk => (await ner(chunk, { aggregation_strategy: 'simple' })) as NerEntity[])
}
