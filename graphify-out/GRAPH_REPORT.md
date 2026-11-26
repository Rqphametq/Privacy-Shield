# Graph Report - Privacy Shield  (2026-11-26)

## Corpus Check
- Corpus is ~7,770 words - fits in a single context window. You may not need a graph.

## Summary
- 201 nodes · 347 edges · 12 communities (11 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.79)
- Token cost: 49,046 input · 0 output

## Community Hubs (Navigation)
- App & Entity UI
- GitHub Pages Workflow
- Dev Dependencies
- Regex & Vault Mapping
- Chunking & NER Fusion
- Runtime Deps & File Import
- TypeScript Config
- Project Docs & Architecture
- NER Web Worker
- Header & useNer Hook
- Import & Demo Contract
- HTML Entry

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 13 edges
2. `Span` - 12 edges
3. `vitest` - 9 edges
4. `detectRegex()` - 7 edges
5. `react` - 7 edges
6. `spanKey()` - 6 edges
7. `detectAll()` - 6 edges
8. `lucide-react` - 6 edges
9. `findTerms()` - 5 edges
10. `mergeSpans()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `sample.docx converted (contract fixture)` --semantically_similar_to--> `Fictitious demo contract (src/sample.ts)`  [INFERRED] [semantically similar]
  graphify-out/converted/sample_78d01f17.md → CLAUDE.md
- `sample.docx converted (contract fixture)` --conceptually_related_to--> `readTextFile import (.txt/.md/.docx via lazy-loaded mammoth)`  [INFERRED]
  graphify-out/converted/sample_78d01f17.md → CLAUDE.md
- `detectAll()` --calls--> `detectRegex()`  [EXTRACTED]
  src/core/ner.ts → src/core/regex.ts
- `detectAll()` --calls--> `findTerms()`  [EXTRACTED]
  src/core/ner.ts → src/core/regex.ts
- `found()` --calls--> `detectRegex()`  [EXTRACTED]
  src/core/regex.test.ts → src/core/regex.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **NER detection pipeline (chunk -> BERT -> relocate offsets -> merge)** — claude_chunking_with_overlap, claude_bert_multilingual_ner, claude_ner_offset_relocation, claude_span_merge_priority [EXTRACTED 1.00]

## Communities (12 total, 1 thin omitted)

### Community 0 - "App & Entity UI"
Cohesion: 0.14
Nodes (23): lucide-react@^1.80.0, react@^19.3.1, lucide-react, react, Tab, CATEGORY, tagCategory(), EntityPanel() (+15 more)

### Community 1 - "GitHub Pages Workflow"
Cohesion: 0.07
Nodes (26): concurrency, cancel-in-progress, group, environment, runs-on, steps, name, url (+18 more)

### Community 2 - "Dev Dependencies"
Cohesion: 0.10
Nodes (25): devDependencies, tailwindcss@^4.3.5, @tailwindcss/vite@^4.3.5, @types/react@^19.3.3, @types/react-dom@^19.3.0, typescript@^7.0.2, vite@^8.3.8, @vitejs/plugin-react@^6.3.0 (+17 more)

### Community 3 - "Regex & Vault Mapping"
Cohesion: 0.15
Nodes (17): vitest, CUR_AFTER, detectRegex(), findTerms(), ibanValid(), luhn(), NOT_AFTER_REF, NUM (+9 more)

### Community 4 - "Chunking & NER Fusion"
Cohesion: 0.18
Nodes (10): Chunk, chunkText(), Range, splitWords(), detectNer(), esc(), isWordChar(), LABELS (+2 more)

### Community 5 - "Runtime Deps & File Import"
Cohesion: 0.14
Nodes (10): dependencies, mammoth@^1.13.0, onnxruntime-web@1.31.0-dev.20260914-8d85527a0, react-dom@^19.3.1, mammoth, onnxruntime-web, react-dom, App() (+2 more)

### Community 6 - "TypeScript Config"
Cohesion: 0.13
Nodes (14): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noUnusedLocals (+6 more)

### Community 7 - "Project Docs & Architecture"
Cohesion: 0.17
Nodes (5): Xenova/bert-base-multilingual-cased-ner-hrl (q8, Transformers.js), fnm-managed Node (not on PATH), GitHub Pages deploy via deploy.yml, Privacy Shield (project), Vault (anonymize/deanonymize mapping, RAM only)

### Community 8 - "NER Web Worker"
Cohesion: 0.23
Nodes (10): @huggingface/transformers@^4.3.2, @huggingface/transformers, ctx, load(), MODEL_ID, Ner, send(), WorkerRequest (+2 more)

### Community 9 - "Header & useNer Hook"
Cohesion: 0.31
Nodes (8): Header(), ModelProgress(), Props, StatusBadge(), EMPTY, NerProgress, NerStatus, useNer()

### Community 10 - "Import & Demo Contract"
Cohesion: 0.50
Nodes (4): readTextFile import (.txt/.md/.docx via lazy-loaded mammoth), Fictitious demo contract (src/sample.ts), Claire Fontaine (fictitious contract party, claire@nexora.example), sample.docx converted (contract fixture)

## Knowledge Gaps
- **6 isolated node(s):** `index.html (Vite entry page)`, `#root mount div`, `fnm-managed Node (not on PATH)`, `readTextFile import (.txt/.md/.docx via lazy-loaded mammoth)`, `Fictitious demo contract (src/sample.ts)` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 74 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Regex & Vault Mapping` to `App & Entity UI`, `Dev Dependencies`, `Chunking & NER Fusion`, `Runtime Deps & File Import`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **What connects `index.html (Vite entry page)`, `#root mount div`, `fnm-managed Node (not on PATH)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App & Entity UI` be split into smaller, more focused modules?**
  _Cohesion score 0.14193548387096774 - nodes in this community are weakly interconnected._
- **Why does `react` connect `App & Entity UI` to `Header & useNer Hook`, `Dev Dependencies`, `Runtime Deps & File Import`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `GitHub Pages Workflow` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `App & Entity UI` to `Header & useNer Hook`, `Dev Dependencies`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09971509971509972 - nodes in this community are weakly interconnected._