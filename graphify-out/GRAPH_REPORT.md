# Graph Report - Privacy Shield  (2026-11-26)

## Corpus Check
- Corpus is ~8,113 words - fits in a single context window. You may not need a graph.

## Summary
- 219 nodes · 373 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.82)
- Token cost: 51,331 input · 0 output

## Community Hubs (Navigation)
- App & Entity UI
- Runtime Dependencies
- GitHub Pages Workflow
- NER Fusion & Header
- Project Docs & Architecture
- Regex & Vault Mapping
- File Import & Model Fetch
- TypeScript Config
- NER Web Worker
- Chunking
- npm Scripts
- Docx Test Fixture
- HTML Entry

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 13 edges
2. `Span` - 12 edges
3. `vitest` - 9 edges
4. `detectRegex()` - 7 edges
5. `scripts` - 7 edges
6. `react` - 7 edges
7. `spanKey()` - 6 edges
8. `detectAll()` - 6 edges
9. `lucide-react` - 6 edges
10. `findTerms()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `HighlightedText()` --calls--> `spanKey()`  [EXTRACTED]
  src/components/Text.tsx → src/core/mapping.ts
- `found()` --calls--> `detectRegex()`  [EXTRACTED]
  src/core/regex.test.ts → src/core/regex.ts
- `detectNer()` --calls--> `chunkText()`  [EXTRACTED]
  src/core/ner.ts → src/core/chunk.ts
- `Props` --references--> `EntityRow`  [EXTRACTED]
  src/components/EntityPanel.tsx → src/core/mapping.ts
- `TaggedText()` --calls--> `tagCategory()`  [EXTRACTED]
  src/components/Text.tsx → src/components/categories.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Detection Fusion Flow (regex + NER + merge)** — claude_regex_detectors, claude_ner_pipeline, claude_chunking_with_overlap, claude_span_overlap_merge [INFERRED 0.85]
- **Offline In-Browser NER Runtime** — claude_ner_worker, claude_bert_multilingual_ner_model, claude_self_hosted_model, claude_onnx_wasm_pinning [INFERRED 0.85]

## Communities (13 total, 2 thin omitted)

### Community 0 - "App & Entity UI"
Cohesion: 0.13
Nodes (22): lucide-react, react, App(), Tab, CATEGORY, tagCategory(), EntityPanel(), Props (+14 more)

### Community 1 - "Runtime Dependencies"
Cohesion: 0.10
Nodes (26): dependencies, lucide-react@^1.80.0, onnxruntime-web@1.31.0-dev.20260914-8d85527a0, react@^19.3.1, react-dom@^19.3.1, devDependencies, tailwindcss@^4.3.5, @tailwindcss/vite@^4.3.5 (+18 more)

### Community 2 - "GitHub Pages Workflow"
Cohesion: 0.07
Nodes (26): concurrency, cancel-in-progress, group, environment, runs-on, steps, name, url (+18 more)

### Community 3 - "NER Fusion & Header"
Cohesion: 0.13
Nodes (19): detectAll(), detectNer(), esc(), isWordChar(), LABELS, locateEntities(), NerEntity, CUR_AFTER (+11 more)

### Community 4 - "Project Docs & Architecture"
Cohesion: 0.11
Nodes (18): App (Anonymiser / Désanonymiser tabs, purge), Xenova/bert-base-multilingual-cased-ner-hrl (q8), Sentence/Paragraph Chunking with Overlap (chunk.ts), Pure Core Engine (src/core, no DOM), readTextFile (.txt/.md/.docx via lazy mammoth), fnm-managed Node (not on PATH), GitHub Pages Deploy (deploy.yml), nerClient Promise API (+10 more)

### Community 5 - "Regex & Vault Mapping"
Cohesion: 0.19
Nodes (13): vitest@^5.1.2, vitest, anonymize(), createVault(), deanonymize(), findTags(), groupEntities(), spanKey() (+5 more)

### Community 6 - "File Import & Model Fetch"
Cohesion: 0.14
Nodes (6): mammoth@^1.13.0, mammoth, FILES, OUT, ACCEPTED, readTextFile()

### Community 7 - "TypeScript Config"
Cohesion: 0.13
Nodes (14): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noUnusedLocals (+6 more)

### Community 8 - "NER Web Worker"
Cohesion: 0.23
Nodes (10): @huggingface/transformers@^4.3.2, @huggingface/transformers, ctx, load(), MODEL_ID, Ner, send(), WorkerRequest (+2 more)

### Community 9 - "Chunking"
Cohesion: 0.36
Nodes (4): Chunk, chunkText(), Range, splitWords()

### Community 10 - "npm Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, prebuild, predev, preview, test

## Knowledge Gaps
- **10 isolated node(s):** `Claire Fontaine (fictitious contract party, claire@nexora.example)`, `sample.docx converted (contract fixture)`, `index.html (Vite entry page)`, `#root mount div`, `React + TS + Vite + Tailwind v4 + Vitest` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 81 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Regex & Vault Mapping` to `Runtime Dependencies`, `NER Fusion & Header`, `Chunking`, `File Import & Model Fetch`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **What connects `Claire Fontaine (fictitious contract party, claire@nexora.example)`, `sample.docx converted (contract fixture)`, `index.html (Vite entry page)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App & Entity UI` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `scripts` connect `npm Scripts` to `Runtime Dependencies`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10052910052910052 - nodes in this community are weakly interconnected._
- **Why does `react` connect `App & Entity UI` to `Runtime Dependencies`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `GitHub Pages Workflow` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._