# Graph Report - Privacy Shield  (2026-11-26)

## Corpus Check
- 33 files · ~13,904 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 273 nodes · 504 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.8)
- Token cost: 296,700 input · 0 output

## Graph Freshness
- Built from commit: `558e0cff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App & Entity UI
- Dev Dependencies
- GitHub Pages Workflow
- ner.ts
- Privacy Shield
- ner.worker.ts
- compilerOptions
- steps
- types.ts
- index.html (Vite entry page)
- useNer.ts

## God Nodes (most connected - your core abstractions)
1. `App()` - 18 edges
2. `detectAll()` - 17 edges
3. `Span` - 13 edges
4. `compilerOptions` - 13 edges
5. `vitest` - 10 edges
6. `detectNer()` - 9 edges
7. `Privacy Shield` - 9 edges
8. `readTextFile()` - 8 edges
9. `detectRegex()` - 8 edges
10. `Category` - 8 edges

## Surprising Connections (you probably didn't know these)
- `npm run eval (real NER contract evaluation)` --references--> `detectAll()`  [INFERRED]
  CLAUDE.md → src/core/ner.ts
- `readTextFile()` --implements--> `File Import (.txt/.md/.docx/.pdf, text layer only)`  [EXTRACTED]
  src/core/importFile.ts → CLAUDE.md
- `NER Noise Filtering and Mention Propagation` --rationale_for--> `detectAll()`  [EXTRACTED]
  CLAUDE.md → src/core/ner.ts
- `nodeNer()` --calls--> `detectNer()`  [EXTRACTED]
  eval/nodeNer.ts → src/core/ner.ts
- `App()` --calls--> `detectAll()`  [EXTRACTED]
  src/App.tsx → src/core/ner.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Offline Self-hosted Model Stack** — scripts_fetch_model, src_workers_modelid, src_workers_ner_worker, claude_transformers_js, claude_bert_multilingual_ner_model [EXTRACTED 1.00]
- **UI to NER Worker Flow** — src_app, src_usener, src_workers_nerclient, src_workers_ner_worker [INFERRED 0.75]
- **Detection Pipeline (regex + chunked NER + span fusion)** — src_core_regex, src_core_chunk, src_core_ner_detectner, src_core_ner_locateentities, src_core_ner_detectall, src_core_spans [INFERRED 0.85]
- **NER runtime chain: App -> useNer -> nerClient -> worker** — claude_app_tsx, claude_use_ner_hook, claude_ner_client, claude_ner_worker [INFERRED 0.85]
- **Offline model hosting** — claude_local_only_privacy_principle, claude_self_hosted_model, claude_onnx_wasm_pinning, claude_bert_multilingual_ner_model [INFERRED 0.85]

## Communities (11 total, 1 thin omitted)

### Community 0 - "App & Entity UI"
Cohesion: 0.07
Nodes (27): CITY, COMPANY, CUR_AFTER, detectRegex(), FIGURE, FORMS, IBAN_LABEL, IBAN_LENGTH (+19 more)

### Community 1 - "Dev Dependencies"
Cohesion: 0.07
Nodes (35): dependencies, mammoth@^1.13.0, onnxruntime-web@1.31.0-dev.20260914-8d85527a0, react-dom@^19.3.1, devDependencies, tailwindcss@^4.3.5, @tailwindcss/vite@^4.3.5, @types/react@^19.3.3 (+27 more)

### Community 2 - "GitHub Pages Workflow"
Cohesion: 0.10
Nodes (27): File Import (.txt/.md/.docx/.pdf, text layer only), Expect, pdfjs-dist@^6.5.438, pdfjs-dist, vitest, App(), Tab, EntityPanel() (+19 more)

### Community 3 - "ner.ts"
Cohesion: 0.12
Nodes (21): Chunk, chunkText(), Range, splitWords(), cells(), companyCores(), definedTerms(), detectAll() (+13 more)

### Community 4 - "Privacy Shield"
Cohesion: 0.07
Nodes (24): App.tsx (state, Anonymiser/Désanonymiser tabs, purge), BERT 512-token limit, Xenova/bert-base-multilingual-cased-ner-hrl (q8), chunk.ts sentence/paragraph chunking with overlap, src/core pure engine (no DOM), GitHub Pages Deploy Pipeline, fnm-managed Node in PowerShell, GitHub Pages deploy workflow (deploy.yml) (+16 more)

### Community 5 - "ner.worker.ts"
Cohesion: 0.17
Nodes (12): Transformers.js, Ner, nodeNer(), @huggingface/transformers@^4.3.2, @huggingface/transformers, MODEL_ID, ctx, load() (+4 more)

### Community 6 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noUnusedLocals (+6 more)

### Community 7 - "steps"
Cohesion: 0.07
Nodes (26): concurrency, cancel-in-progress, group, environment, runs-on, steps, name, url (+18 more)

### Community 8 - "types.ts"
Cohesion: 0.18
Nodes (14): lucide-react@^1.80.0, react@^19.3.1, lucide-react, react, CATEGORY, tagCategory(), Props, TaggedText() (+6 more)

### Community 11 - "useNer.ts"
Cohesion: 0.33
Nodes (8): Header(), Props, StatusBadge(), EMPTY, NerProgress, NerStatus, useNer(), createNerClient()

## Knowledge Gaps
- **11 isolated node(s):** `GitHub Pages Deploy Pipeline`, `Transformers.js`, `File Import (.txt/.md/.docx/.pdf, text layer only)`, `index.html (Vite entry page)`, `#root mount div` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 111 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `GitHub Pages Workflow` to `App & Entity UI`, `Dev Dependencies`, `ner.ts`, `types.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `detectAll()` (e.g. with `npm run eval (real NER contract evaluation)` and `cells()`) actually correct?**
  _`detectAll()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GitHub Pages Deploy Pipeline`, `Transformers.js`, `File Import (.txt/.md/.docx/.pdf, text layer only)` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App & Entity UI` be split into smaller, more focused modules?**
  _Cohesion score 0.0677361853832442 - nodes in this community are weakly interconnected._
- **Why does `Privacy Shield` connect `Privacy Shield` to `App & Entity UI`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07207207207207207 - nodes in this community are weakly interconnected._
- **Why does `Self-hosted Pinned Model Files` connect `Privacy Shield` to `ner.worker.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._