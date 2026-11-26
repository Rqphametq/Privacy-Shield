import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import type { EntityRow } from '../core/mapping'
import type { Category } from '../core/types'
import { CATEGORY } from './categories'

interface Props {
  rows: EntityRow[]
  disabled: Set<string>
  offCategories: Set<Category>
  onToggleCategory: (c: Category) => void
  tagOf: (key: string) => string | undefined
  onToggle: (key: string) => void
  terms: string[]
  onAddTerm: (term: string) => void
  onRemoveTerm: (term: string) => void
}

export function EntityPanel({ rows, disabled, offCategories, onToggleCategory, tagOf, onToggle, terms, onAddTerm, onRemoveTerm }: Props) {
  const [draft, setDraft] = useState('')
  const isOn = (r: EntityRow) => !disabled.has(r.key) && !offCategories.has(r.category)
  const masked = rows.filter(isOn).length
  // Categories present in the text, in order of first appearance, with their number of distinct values.
  const categories = [...rows.reduce((m, r) => m.set(r.category, (m.get(r.category) ?? 0) + 1), new Map<Category, number>())]

  return (
    <aside className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <h2 className="text-sm font-semibold">Entités détectées</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{masked} / {rows.length} masquées · décochez les faux positifs ou une catégorie entière</p>
      </div>

      {categories.length > 0 && (
        <fieldset className="flex flex-wrap gap-1.5 border-b border-slate-200 p-3 dark:border-slate-800">
          <legend className="sr-only">Catégories à masquer</legend>
          {categories.map(([c, n]) => {
            const on = !offCategories.has(c)
            return (
              <label key={c} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ring-1 ${on ? CATEGORY[c].cls : 'text-slate-400 ring-slate-300 line-through dark:ring-slate-700'}`}>
                <input type="checkbox" checked={on} onChange={() => onToggleCategory(c)} className="size-3 accent-emerald-600" />
                {CATEGORY[c].label} ({n})
              </label>
            )
          })}
        </fieldset>
      )}

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
          const on = isOn(r)
          const catOff = offCategories.has(r.category)
          return (
            <li key={r.key}>
              <label className="flex cursor-pointer items-center gap-2.5 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <input type="checkbox" checked={on} disabled={catOff} onChange={() => onToggle(r.key)} className="size-4 accent-emerald-600 disabled:opacity-40"
                  title={catOff ? `Catégorie « ${CATEGORY[r.category].label} » décochée` : undefined} />
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
