import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { spanKey } from '../core/mapping'
import type { Span } from '../core/types'
import { CATEGORY, tagCategory } from './categories'

/** Original text with clickable, colored entities. Disabled ones are shown struck through. */
export function HighlightedText({ text, spans, disabled, onToggle }: {
  text: string
  spans: Span[]
  disabled: Set<string>
  onToggle: (key: string) => void
}) {
  const parts: React.ReactNode[] = []
  let cursor = 0
  for (const s of spans) {
    if (s.start > cursor) parts.push(text.slice(cursor, s.start))
    const key = spanKey(s)
    const off = disabled.has(key)
    parts.push(
      <button
        key={s.start}
        type="button"
        onClick={() => onToggle(key)}
        aria-pressed={!off}
        title={`${CATEGORY[s.category].label} (${s.source}) — cliquer pour ${off ? 'masquer' : 'ne pas masquer'}`}
        className={`rounded px-0.5 ring-1 ${off ? 'bg-transparent text-inherit line-through decoration-slate-400 ring-slate-300 dark:ring-slate-600' : CATEGORY[s.category].cls}`}
      >
        {text.slice(s.start, s.end)}
      </button>,
    )
    cursor = s.end
  }
  parts.push(text.slice(cursor))
  return <div className="whitespace-pre-wrap break-words leading-7">{parts}</div>
}

/** Text with [CATEGORY_N] tags rendered as colored pills. */
export function TaggedText({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-wrap break-words leading-7">
      {text.split(/(\[[A-Z]+_\d+\])/).map((part, i) => {
        const cat = i % 2 ? tagCategory(part) : undefined
        return cat ? (
          <span key={i} className={`rounded px-1 font-mono text-[0.85em] ring-1 ${CATEGORY[cat].cls}`}>{part}</span>
        ) : (
          part
        )
      })}
    </div>
  )
}

export function CopyButton({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      disabled={!text}
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? 'Copié' : label}
    </button>
  )
}

export function Card({ title, actions, children }: { title: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <h2 className="text-sm font-semibold">{title}</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4 text-sm">{children}</div>
    </section>
  )
}
