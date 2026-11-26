import { AlertTriangle, Loader2, Moon, ShieldCheck, Sun, Trash2 } from 'lucide-react'
import type { NerProgress, NerStatus } from '../useNer'

interface Props {
  status: NerStatus
  error: string
  progress: NerProgress | null
  onRetry: () => void
  dark: boolean
  onToggleDark: () => void
  onPurge: () => void
}

export function Header({ status, error, progress, onRetry, dark, onToggleDark, onPurge }: Props) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-7 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold leading-tight">Privacy Shield</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Anonymisation RGPD 100 % locale</p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <StatusBadge status={status} error={error} progress={progress} onRetry={onRetry} />
          <button
            type="button"
            onClick={onToggleDark}
            aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          <button
            type="button"
            onClick={onPurge}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
          >
            <Trash2 className="size-4" aria-hidden /> Purger la session
          </button>
        </div>
      </div>
    </header>
  )
}

function StatusBadge({ status, error, progress, onRetry }: Pick<Props, 'status' | 'error' | 'progress' | 'onRetry'>) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1'
  if (status === 'ready')
    return (
      <span
        role="status"
        title="Le modèle a été téléchargé une seule fois depuis Hugging Face puis mis en cache. Vos textes ne quittent jamais ce navigateur."
        className={`${base} bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800`}
      >
        <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
        Modèle chargé en local — 0 octet envoyé sur le réseau
      </span>
    )
  if (status === 'error')
    return (
      <span role="status" title={error} className={`${base} max-w-full flex-wrap bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800`}>
        <AlertTriangle className="size-3.5" aria-hidden /> Modèle IA indisponible — détection regex seule
        <button type="button" onClick={onRetry} className="ml-1 underline">Réessayer</button>
        {error && <span className="w-full break-all font-mono text-[11px] font-normal opacity-80">Cause : {error}</span>}
      </span>
    )
  return (
    <span role="status" className={`${base} bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800`}>
      <Loader2 className="size-3.5 animate-spin" aria-hidden />
      {progress ? `Téléchargement du modèle local… ${Math.round(progress.pct)} %` : 'Initialisation du modèle local…'}
    </span>
  )
}

/** Detailed first-download progress, per file. */
export function ModelProgress({ progress }: { progress: NerProgress | null }) {
  const files = Object.entries(progress?.files ?? {})
  return (
    <div className="mx-auto mt-4 max-w-[1600px] px-4">
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm dark:border-sky-900 dark:bg-sky-950/50">
        <p className="font-medium text-sky-900 dark:text-sky-100">
          Premier lancement : téléchargement du modèle NER multilingue (une seule fois, ensuite en cache navigateur).
          La détection regex fonctionne déjà.
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-sky-200 dark:bg-sky-900" role="progressbar" aria-valuenow={Math.round(progress?.pct ?? 0)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-sky-600 transition-all" style={{ width: `${progress?.pct ?? 0}%` }} />
        </div>
        {files.length > 0 && (
          <ul className="mt-2 space-y-0.5 font-mono text-xs text-sky-800 dark:text-sky-200">
            {files.map(([name, f]) => (
              <li key={name}>
                {name} — {f.total ? Math.round((f.loaded / f.total) * 100) : 0} % ({(f.loaded / 1e6).toFixed(1)} / {(f.total / 1e6).toFixed(1)} Mo)
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
