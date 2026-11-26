import type { Category } from '../core/types'

// Literal class strings so Tailwind can see them.
export const CATEGORY: Record<Category, { label: string; cls: string; dot: string }> = {
  PERSONNE:   { label: 'Personne',   dot: 'bg-blue-500',    cls: 'bg-blue-100 text-blue-900 ring-blue-300 dark:bg-blue-500/25 dark:text-blue-100 dark:ring-blue-400/40' },
  ENTREPRISE: { label: 'Entreprise', dot: 'bg-violet-500',  cls: 'bg-violet-100 text-violet-900 ring-violet-300 dark:bg-violet-500/25 dark:text-violet-100 dark:ring-violet-400/40' },
  LIEU:       { label: 'Lieu',       dot: 'bg-emerald-500', cls: 'bg-emerald-100 text-emerald-900 ring-emerald-300 dark:bg-emerald-500/25 dark:text-emerald-100 dark:ring-emerald-400/40' },
  EMAIL:      { label: 'Email',      dot: 'bg-amber-500',   cls: 'bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-500/25 dark:text-amber-100 dark:ring-amber-400/40' },
  TELEPHONE:  { label: 'Téléphone',  dot: 'bg-orange-500',  cls: 'bg-orange-100 text-orange-900 ring-orange-300 dark:bg-orange-500/25 dark:text-orange-100 dark:ring-orange-400/40' },
  IBAN:       { label: 'IBAN',       dot: 'bg-rose-500',    cls: 'bg-rose-100 text-rose-900 ring-rose-300 dark:bg-rose-500/25 dark:text-rose-100 dark:ring-rose-400/40' },
  SIRET:      { label: 'SIRET',      dot: 'bg-fuchsia-500', cls: 'bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-300 dark:bg-fuchsia-500/25 dark:text-fuchsia-100 dark:ring-fuchsia-400/40' },
  SIREN:      { label: 'SIREN',      dot: 'bg-pink-500',    cls: 'bg-pink-100 text-pink-900 ring-pink-300 dark:bg-pink-500/25 dark:text-pink-100 dark:ring-pink-400/40' },
  MONTANT:    { label: 'Montant',    dot: 'bg-teal-500',    cls: 'bg-teal-100 text-teal-900 ring-teal-300 dark:bg-teal-500/25 dark:text-teal-100 dark:ring-teal-400/40' },
  URL:        { label: 'URL',        dot: 'bg-sky-500',     cls: 'bg-sky-100 text-sky-900 ring-sky-300 dark:bg-sky-500/25 dark:text-sky-100 dark:ring-sky-400/40' },
  BIC:        { label: 'BIC',        dot: 'bg-red-500',     cls: 'bg-red-100 text-red-900 ring-red-300 dark:bg-red-500/25 dark:text-red-100 dark:ring-red-400/40' },
  NIR:        { label: 'N° sécu',    dot: 'bg-yellow-500',  cls: 'bg-yellow-100 text-yellow-900 ring-yellow-300 dark:bg-yellow-500/25 dark:text-yellow-100 dark:ring-yellow-400/40' },
  NAISSANCE:  { label: 'Date de naissance', dot: 'bg-indigo-500', cls: 'bg-indigo-100 text-indigo-900 ring-indigo-300 dark:bg-indigo-500/25 dark:text-indigo-100 dark:ring-indigo-400/40' },
  REFERENCE:  { label: 'Référence',  dot: 'bg-stone-500',   cls: 'bg-stone-200 text-stone-900 ring-stone-400 dark:bg-stone-500/30 dark:text-stone-100 dark:ring-stone-400/40' },
  ADRESSE:    { label: 'Adresse',    dot: 'bg-lime-500',    cls: 'bg-lime-100 text-lime-900 ring-lime-300 dark:bg-lime-500/25 dark:text-lime-100 dark:ring-lime-400/40' },
  IP:         { label: 'Adresse IP', dot: 'bg-cyan-500',    cls: 'bg-cyan-100 text-cyan-900 ring-cyan-300 dark:bg-cyan-500/25 dark:text-cyan-100 dark:ring-cyan-400/40' },
  PERSO:      { label: 'Mot perso',  dot: 'bg-slate-500',   cls: 'bg-slate-200 text-slate-900 ring-slate-400 dark:bg-slate-500/30 dark:text-slate-100 dark:ring-slate-400/40' },
}

/** "[PERSONNE_3]" -> "PERSONNE" if it is a known category. */
export const tagCategory = (tag: string): Category | undefined => {
  const c = tag.slice(1, tag.lastIndexOf('_')) as Category
  return c in CATEGORY ? c : undefined
}
