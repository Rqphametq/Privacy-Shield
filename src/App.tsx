import { FileText, FileUp, Pencil, ScanSearch, Undo2, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ACCEPTED, readTextFile } from './core/importFile'
import { anonymize, createVault, deanonymize, findTags, groupEntities, spanKey } from './core/mapping'
import { detectAll } from './core/ner'
import { EntityPanel } from './components/EntityPanel'
import { Header, ModelProgress } from './components/Header'
import { Card, CopyButton, HighlightedText, TaggedText } from './components/Text'
import { SAMPLE_CONTRACT } from './sample'
import { useNer } from './useNer'

type Tab = 'anon' | 'deanon'

const textareaCls =
  'h-full min-h-[50vh] w-full resize-none bg-transparent font-[inherit] leading-7 outline-none placeholder:text-slate-400'

export default function App() {
  const [dark, setDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  const [tab, setTab] = useState<Tab>('anon')
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(true)
  const [terms, setTerms] = useState<string[]>([])
  const [disabled, setDisabled] = useState<Set<string>>(() => new Set())
  const [llm, setLlm] = useState('')
  const [vault, setVault] = useState(createVault)
  const [importError, setImportError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const ner = useNer(text)

  const importFile = async (file: File | undefined) => {
    if (!file) return
    setImportError('')
    try { setText(await readTextFile(file)); setEditing(false) } catch (e) { setImportError(e instanceof Error ? e.message : String(e)) }
  }

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const spans = useMemo(() => detectAll(text, ner.spans, terms), [text, ner.spans, terms])
  const active = useMemo(() => spans.filter(s => !disabled.has(spanKey(s))), [spans, disabled])
  // The session vault only grows: a value keeps its tag even if toggled off and on again.
  const anonymized = useMemo(() => anonymize(text, active, vault), [text, active, vault])
  const rows = useMemo(() => groupEntities(spans), [spans])
  const restored = useMemo(() => deanonymize(llm, vault), [llm, vault])
  const tags = useMemo(() => findTags(llm, vault), [llm, vault])

  const toggle = (key: string) =>
    setDisabled(prev => { const next = new Set(prev); if (!next.delete(key)) next.add(key); return next })

  const purge = () => {
    if (!confirm('Purger la session ? Le texte, les entités et la table de correspondance seront effacés de la mémoire. Les réponses LLM déjà anonymisées ne pourront plus être réinjectées.')) return
    setText(''); setEditing(true); setImportError(''); setTerms([]); setDisabled(new Set()); setLlm(''); setVault(createVault())
  }

  const tabCls = (t: Tab) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t
      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <Header status={ner.status} error={ner.error} progress={ner.progress} onRetry={ner.retry} dark={dark} onToggleDark={() => setDark(d => !d)} onPurge={purge} />
      {ner.status === 'loading' && <ModelProgress progress={ner.progress} />}

      <main className="mx-auto max-w-[1600px] px-4 py-4">
        <div role="tablist" className="mb-4 inline-flex gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-900">
          <button role="tab" aria-selected={tab === 'anon'} className={tabCls('anon')} onClick={() => setTab('anon')}>
            <ScanSearch className="size-4" aria-hidden /> 1. Anonymiser
          </button>
          <button role="tab" aria-selected={tab === 'deanon'} className={tabCls('deanon')} onClick={() => setTab('deanon')}>
            <Undo2 className="size-4" aria-hidden /> 2. Désanonymiser
          </button>
        </div>

        {tab === 'anon' ? (
          <div className="grid gap-4 lg:h-[calc(100vh-12.5rem)] lg:grid-cols-[1fr_1fr_320px]">
            <Card
              title="Texte original"
              actions={<>
                {ner.analyzing && <span className="text-xs text-slate-500">Analyse IA…</span>}
                <button
                  type="button"
                  onClick={() => { setText(SAMPLE_CONTRACT); setEditing(false); setImportError('') }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <FileText className="size-4" aria-hidden /> Tester avec un contrat exemple
                </button>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <FileUp className="size-4" aria-hidden /> Importer (.txt, .md, .docx)
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept={ACCEPTED}
                  hidden
                  onChange={e => { void importFile(e.target.files?.[0]); e.target.value = '' }}
                />
                {text && (
                  <button
                    type="button"
                    onClick={() => setEditing(e => !e)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    {editing ? <><WandSparkles className="size-4" aria-hidden /> Voir les détections</> : <><Pencil className="size-4" aria-hidden /> Modifier</>}
                  </button>
                )}
              </>}
            >
              {importError && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{importError}</p>}
              {editing ? (
                <textarea
                  aria-label="Texte original à anonymiser"
                  className={textareaCls}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Collez ici un contrat, un email client, un dossier RH… Rien ne quitte votre navigateur."
                />
              ) : (
                <HighlightedText text={text} spans={spans} disabled={disabled} onToggle={toggle} />
              )}
            </Card>

            <Card title="Version anonymisée" actions={<CopyButton text={text ? anonymized : ''} label="Copier pour le LLM" />}>
              {text ? <TaggedText text={anonymized} /> : <p className="text-slate-400">Le texte anonymisé apparaîtra ici.</p>}
            </Card>

            <EntityPanel
              rows={rows}
              disabled={disabled}
              tagOf={key => vault.byValue.get(key)}
              onToggle={toggle}
              terms={terms}
              onAddTerm={t => setTerms(ts => (ts.includes(t) ? ts : [...ts, t]))}
              onRemoveTerm={t => setTerms(ts => ts.filter(x => x !== t))}
            />
          </div>
        ) : (
          <div className="grid gap-4 lg:h-[calc(100vh-12.5rem)] lg:grid-cols-2">
            <Card title="Réponse du LLM (avec balises)">
              <textarea
                aria-label="Réponse du LLM contenant les balises"
                className={textareaCls}
                value={llm}
                onChange={e => setLlm(e.target.value)}
                placeholder="Collez ici la réponse de ChatGPT, Claude ou Gemini contenant [PERSONNE_1], [ENTREPRISE_1]…"
              />
            </Card>
            <Card
              title="Texte réinjecté"
              actions={<>
                {llm && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {tags.known} balise{tags.known > 1 ? 's' : ''} réinjectée{tags.known > 1 ? 's' : ''}
                    {tags.unknown.length > 0 && <span className="text-amber-600 dark:text-amber-400"> · inconnues : {[...new Set(tags.unknown)].join(', ')}</span>}
                  </span>
                )}
                <CopyButton text={llm ? restored : ''} />
              </>}
            >
              {vault.byTag.size === 0 ? (
                <p className="text-slate-400">Anonymisez d'abord un texte dans l'onglet 1 : la table de correspondance est vide.</p>
              ) : (
                <div className="whitespace-pre-wrap break-words leading-7">{restored}</div>
              )}
            </Card>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-400">
          Traitement 100 % local dans votre navigateur · table de correspondance en mémoire vive uniquement · aucune donnée transmise
        </p>
      </main>
    </div>
  )
}
