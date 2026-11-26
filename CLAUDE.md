# Privacy Shield

100 % local, browser-only RGPD anonymizer (React + TS + Vite + Tailwind v4 + Vitest). No backend, no network calls with user data.

## Graphify workflow (mandatory)
- **Read via Graphify first**: to understand architecture, find dependencies or locate a function, query the graph (`graphify query "<question>"`, or read `graphify-out/GRAPH_REPORT.md` / `graphify-out/graph.json`) before scanning files. Only read a full source file when you are about to modify it.
- **Keep it current**: at the end of every phase, and after any major file add/move/refactor, update the graph (`/graphify . --update`).

## Strict TDD (Red → Green), mandatory
For any new business logic or bug fix: first write the Vitest test(s) that express the expected behavior, run `npm test` and confirm they **fail** (Red), then write the minimum code that makes them pass (Green). Never write the implementation before seeing the test fail.

## Commands
Node is managed by fnm and is not on PATH by default. In PowerShell, prefix with:
`fnm env --shell powershell | Out-String | Invoke-Expression; fnm use default`

- `npm run dev`: dev server
- `npm test`: Vitest (core engine unit tests)
- `npm run build`: typecheck (`tsc --noEmit`) + Vite build
- `npm run preview`: serve the build
- Deploy: push to `main` → `.github/workflows/deploy.yml` (test + build with `--base=/<repo>/`) → GitHub Pages.

## Layout
- `src/core/`: pure engine, no DOM. `regex.ts` (detectors + user terms), `spans.ts` (overlap merge: manual > regex > ner, then longer), `mapping.ts` (Vault: anonymize/deanonymize, RAM only).
- `src/core/chunk.ts`: sentence/paragraph chunking with overlap, exact offsets (BERT 512-token limit).
- `src/core/ner.ts`: `locateEntities` (re-finds char offsets, the pipeline gives none), `detectNer` (chunked run, model injected), `detectAll` (final fusion).
- `src/workers/ner.worker.ts`: Transformers.js `Xenova/bert-base-multilingual-cased-ner-hrl` (q8), progress forwarded. `nerClient.ts`: promise API for the UI.
- `src/App.tsx`: state + 2 tabs (Anonymiser / Désanonymiser), purge. `src/useNer.ts`: worker lifecycle, progress, debounced detection (stale results dropped).
- `src/components/`: `Header` (status badge, model progress, theme, purge), `Text` (HighlightedText, TaggedText, CopyButton, Card), `EntityPanel`, `categories.ts` (colors/labels).
- `src/sample.ts`: fictitious demo contract (covered by a test).
- `src/core/importFile.ts`: `readTextFile` for .txt/.md/.docx (mammoth, lazy-loaded; test fixture in `src/core/__fixtures__/`).
- ONNX runtime wasm is served from our build (`wasmPaths` in the worker); `onnxruntime-web` is pinned to the exact version Transformers.js uses — bump both together.
