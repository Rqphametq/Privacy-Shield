# Graph Report - Privacy Shield  (2026-11-25)

## Corpus Check
- 15 files · ~7,270 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 173 nodes · 334 edges · 8 communities
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.81)
- Token cost: 50,243 input · 0 output

## Community Hubs (Navigation)
- Dependencies
- App & Entity UI
- Project Docs & Architecture
- Regex & Vault Mapping
- Chunking & NER Fusion
- TypeScript Config
- NER Web Worker
- Header & useNer Hook

## God Nodes (most connected - your core abstractions)
1. `App()` - 16 edges
2. `compilerOptions` - 13 edges
3. `Span` - 12 edges
4. `vitest` - 8 edges
5. `detectRegex()` - 7 edges
6. `react` - 7 edges
7. `spanKey()` - 7 edges
8. `detectAll()` - 6 edges
9. `lucide-react` - 6 edges
10. `detectNer()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `found()` --calls--> `detectRegex()`  [EXTRACTED]
  src/core/regex.test.ts → src/core/regex.ts
- `index.html (Vite entry page)` --conceptually_related_to--> `React + TS + Vite + Tailwind v4 + Vitest Stack`  [INFERRED]
  index.html → CLAUDE.md
- `#root mount div` --conceptually_related_to--> `UI Components (Header, Text, EntityPanel, categories.ts)`  [INFERRED]
  index.html → CLAUDE.md
- `App()` --calls--> `Header()`  [EXTRACTED]
  src/App.tsx → src/components/Header.tsx
- `detectAll()` --calls--> `detectRegex()`  [EXTRACTED]
  src/core/ner.ts → src/core/regex.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Entity Detection Pipeline (regex + NER + merge)** — claude_regex_detectors, claude_chunking, claude_detectner, claude_locateentities, claude_span_overlap_merge, claude_detectall [INFERRED 0.85]
- **UI-to-Worker NER Chain** — claude_app_tsx, claude_usener, claude_nerclient, claude_ner_worker, claude_bert_multilingual_ner_model [INFERRED 0.85]

## Communities (8 total, 0 thin omitted)

### Community 0 - "Dependencies"
Cohesion: 0.08
Nodes (33): dependencies, lucide-react@^1.80.0, onnxruntime-web@1.31.0-dev.20260914-8d85527a0, react@^19.3.1, react-dom@^19.3.1, devDependencies, tailwindcss@^4.3.5, @tailwindcss/vite@^4.3.5 (+25 more)

### Community 1 - "App & Entity UI"
Cohesion: 0.15
Nodes (23): react, App(), Tab, CATEGORY, tagCategory(), EntityPanel(), Props, ModelProgress() (+15 more)

### Community 2 - "Project Docs & Architecture"
Cohesion: 0.10
Nodes (20): App.tsx (state, Anonymiser/Désanonymiser tabs, purge), Xenova/bert-base-multilingual-cased-ner-hrl (q8), src/core Pure Engine (no DOM), detectAll (final fusion), detectNer, fnm-Managed Node (not on PATH), locateEntities, ner.worker.ts (Transformers.js NER Web Worker) (+12 more)

### Community 3 - "Regex & Vault Mapping"
Cohesion: 0.15
Nodes (17): vitest, detectAll(), CUR_AFTER, detectRegex(), findTerms(), ibanValid(), luhn(), NOT_AFTER_REF (+9 more)

### Community 4 - "Chunking & NER Fusion"
Cohesion: 0.18
Nodes (10): Chunk, chunkText(), Range, splitWords(), detectNer(), esc(), isWordChar(), LABELS (+2 more)

### Community 5 - "TypeScript Config"
Cohesion: 0.13
Nodes (14): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noUnusedLocals (+6 more)

### Community 6 - "NER Web Worker"
Cohesion: 0.23
Nodes (10): @huggingface/transformers@^4.3.2, @huggingface/transformers, ctx, load(), MODEL_ID, Ner, send(), WorkerRequest (+2 more)

### Community 7 - "Header & useNer Hook"
Cohesion: 0.43
Nodes (6): Header(), Props, StatusBadge(), EMPTY, NerProgress, NerStatus

## Knowledge Gaps
- **4 isolated node(s):** `RGPD Anonymization`, `fnm-Managed Node (not on PATH)`, `locateEntities`, `sample.ts Fictitious Demo Contract`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 49 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Regex & Vault Mapping` to `Dependencies`, `App & Entity UI`, `Chunking & NER Fusion`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **What connects `RGPD Anonymization`, `fnm-Managed Node (not on PATH)`, `locateEntities` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0773109243697479 - nodes in this community are weakly interconnected._
- **Why does `react` connect `App & Entity UI` to `Dependencies`, `Header & useNer Hook`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `Project Docs & Architecture` be split into smaller, more focused modules?**
  _Cohesion score 0.09538461538461539 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Dependencies` to `App & Entity UI`, `Header & useNer Hook`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `Regex & Vault Mapping` be split into smaller, more focused modules?**
  _Cohesion score 0.1476923076923077 - nodes in this community are weakly interconnected._