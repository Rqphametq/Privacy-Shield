import { useCallback, useEffect, useRef, useState } from 'react'
import type { Span } from './core/types'
import { createNerClient } from './workers/nerClient'

export type NerStatus = 'loading' | 'ready' | 'error'
export interface NerProgress { pct: number; files: Record<string, { loaded: number; total: number }> }

const EMPTY: Span[] = []

/** Owns the NER worker: model load with progress, debounced detection on `text`. */
export function useNer(text: string) {
  const [status, setStatus] = useState<NerStatus>('loading')
  const [progress, setProgress] = useState<NerProgress | null>(null)
  const [result, setResult] = useState<{ text: string; spans: Span[] }>({ text: '', spans: EMPTY })
  const [error, setError] = useState('')
  const client = useRef<ReturnType<typeof createNerClient> | null>(null)

  const load = useCallback(() => {
    setStatus('loading')
    client.current?.load().then(() => setStatus('ready'), (e: unknown) => {
      console.error('[Privacy Shield] model load failed:', e)
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    })
  }, [])

  useEffect(() => {
    const c = createNerClient(info => {
      if (info.status === 'progress_total') setProgress({ pct: info.progress, files: info.files })
    })
    client.current = c
    load()
    return () => c.terminate()
  }, [load])

  useEffect(() => {
    if (status !== 'ready' || !text.trim()) return
    const t = setTimeout(() => {
      client.current?.detect(text).then(spans => setResult({ text, spans }), () => setResult({ text, spans: EMPTY }))
    }, 400)
    return () => clearTimeout(t)
  }, [text, status])

  // Spans computed for an older version of the text have stale offsets: never show them.
  const fresh = result.text === text
  return {
    status,
    error,
    progress,
    retry: load,
    spans: fresh ? result.spans : EMPTY,
    analyzing: status === 'ready' && !!text.trim() && !fresh,
  }
}
