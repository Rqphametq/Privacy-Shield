import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import type { EntityRow } from '../core/mapping'
import { CATEGORY } from './categories'

interface Props {
  rows: EntityRow[]
  disabled: Set<string>
  tagOf: (key: string) => string | undefined
  onToggle: (key: string) => void
  terms: string[]
  onAddTerm: (term: string) => void
  onRemoveTerm: (term: string) => void
}

export function EntityPanel({ rows, disabled, tagOf, onToggle, terms, onAddTerm, onRemoveTerm }: Props) {
  const [draft, setDraft] = useState('')
  const masked = rows.filter(r => !disabled.has(r.key)).length

  return (
    <aside className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <h2 className="text-sm font-semibold">Entités détectées</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{masked} / {rows.length} masquées · décochez les faux positifs</p>
      </div>

      <form
        className="flex gap-2 border-b border-slate-200 p-3 dark:border-slate-800"
        onSubmit={e => { e.preventDefault(); if (draft.trim()) onAddTerm(draft.trim()); setDraft('') }}
      >
        <label className="sr-only" htmlFor="term">Mot à masquer</label>
        <input
          id="term"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Ajouter un mot à masquer…"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700"
        />
        <button type="submit" aria-label="Ajouter" className="rounded-lg bg-slate-800 px-2.5 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
          <Plus className="size-4" />
        </button>
      </form>

      {terms.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 p-3 dark:border-slate-800">
          {terms.map(t => (
            <span key={t} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ${CATEGORY.PERSO.cls}`}>
              {t}
              <button type="button" onClick={() => onRemoveTerm(t)} aria-label={`Retirer ${t}`}><X className="size-3" /></button>
            </span>
          ))}
        </div>
      )}

      <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-auto dark:divide-slate-800">
        {rows.length === 0 && <li className="p-4 text-sm text-slate-500 dark:text-slate-400">Aucune entité pour l'instant.</li>}
        {rows.map(r => {
          const on = !disabled.has(r.key)
          return (
            <li key={r.key}>
              <label className="flex cursor-pointer items-center gap-2.5 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <input type="checkbox" checked={on} onChange={() => onToggle(r.key)} className="size-4 accent-emerald-600" />
                <span className={`size-2.5 shrink-0 rounded-full ${CATEGORY[r.category].dot}`} aria-hidden />
                <span className={`min-w-0 flex-1 truncate ${on ? '' : 'text-slate-400 line-through'}`} title={r.text}>{r.text}</span>
                {r.count > 1 && <span className="text-xs text-slate-400">×{r.count}</span>}
                <span className="shrink-0 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {on ? tagOf(r.key) ?? CATEGORY[r.category].label : CATEGORY[r.category].label}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
