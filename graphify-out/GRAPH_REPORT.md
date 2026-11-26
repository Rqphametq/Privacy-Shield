# Graph Report - Privacy Shield  (2026-11-26)

## Corpus Check
- Corpus is ~8,996 words - fits in a single context window. You may not need a graph.

## Summary
- 227 nodes · 384 edges · 12 communities (9 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.82)
- Token cost: 51,329 input · 0 output

## Community Hubs (Navigation)
- App & Entity UI
- Dev Dependencies
- GitHub Pages Workflow
- Runtime Deps & File Import
- Project Docs & Architecture
- Regex & Vault Mapping
- Header, useNer & NER Worker
- Chunking & NER Fusion
- TypeScript Config
- Model Fetch Script
- Docx Test Fixture
- HTML Entry

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 13 edges
2. `Span` - 12 edges
3. `vitest` - 9 edges
4. `detectRegex()` - 8 edges
5. `scripts` - 7 edges
6. `react` - 7 edges
7. `detectAll()` - 6 edges
8. `spanKey()` - 6 edges
9. `lucide-react` - 6 edges
10. `readTextFile()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `detectAll()` --calls--> `detectRegex()`  [EXTRACTED]
  src/core/ner.ts → src/core/regex.ts
- `detectAll()` --calls--> `findTerms()`  [EXTRACTED]
  src/core/ner.ts → src/core/regex.ts
- `found()` --calls--> `detectRegex()`  [EXTRACTED]
  src/core/regex.test.ts → src/core/regex.ts
- `Props` --references--> `EntityRow`  [EXTRACTED]
  src/components/EntityPanel.tsx → src/core/mapping.ts
- `Props` --references--> `NerProgress`  [EXTRACTED]
  src/components/Header.tsx → src/useNer.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Detection pipeline: chunk -> NER + regex -> span merge** — claude_chunking, claude_ner_core, claude_regex_detectors, claude_span_merge_priority [INFERRED 0.85]
- **NER runtime chain: App -> useNer -> nerClient -> worker** — claude_app_tsx, claude_use_ner_hook, claude_ner_client, claude_ner_worker [INFERRED 0.85]
- **Offline model hosting** — claude_local_only_privacy_principle, claude_self_hosted_model, claude_onnx_wasm_pinning, claude_bert_multilingual_ner_model [INFERRED 0.85]

## Communities (12 total, 3 thin omitted)

### Community 0 - "App & Entity UI"
Cohesion: 0.15
Nodes (21): lucide-react, Tab, CATEGORY, tagCategory(), EntityPanel(), Props, Card(), CopyButton() (+13 more)

### Community 1 - "Dev Dependencies"
Cohesion: 0.10
Nodes (26): devDependencies, tailwindcss@^4.3.5, @tailwindcss/vite@^4.3.5, @types/react@^19.3.3, @types/react-dom@^19.3.0, typescript@^7.0.2, vite@^8.3.8, @vitejs/plugin-react@^6.3.0 (+18 more)

### Community 2 - "GitHub Pages Workflow"
Cohesion: 0.07
Nodes (26): concurrency, cancel-in-progress, group, environment, runs-on, steps, name, url (+18 more)

### Community 3 - "Runtime Deps & File Import"
Cohesion: 0.10
Nodes (20): dependencies, @huggingface/transformers@^4.3.2, lucide-react@^1.80.0, mammoth@^1.13.0, onnxruntime-web@1.31.0-dev.20260914-8d85527a0, pdfjs-dist@^6.5.438, react@^19.3.1, react-dom@^19.3.1 (+12 more)

### Community 4 - "Project Docs & Architecture"
Cohesion: 0.10
Nodes (19): App.tsx (state, Anonymiser/Désanonymiser tabs, purge), BERT 512-token limit, Xenova/bert-base-multilingual-cased-ner-hrl (q8), chunk.ts sentence/paragraph chunking with overlap, src/core pure engine (no DOM), fnm-managed Node (PowerShell prefix), GitHub Pages deploy workflow (deploy.yml), importFile.ts readTextFile (.txt/.md/.docx/.pdf) (+11 more)

### Community 5 - "Regex & Vault Mapping"
Cohesion: 0.13
Nodes (16): vitest@^5.1.2, vitest, CUR_AFTER, detectRegex(), findTerms(), ibanValid(), luhn(), NOT_AFTER_REF (+8 more)

### Community 6 - "Header, useNer & NER Worker"
Cohesion: 0.15
Nodes (18): @huggingface/transformers, Header(), ModelProgress(), Props, StatusBadge(), Span, EMPTY, NerProgress (+10 more)

### Community 7 - "Chunking & NER Fusion"
Cohesion: 0.18
Nodes (10): Chunk, chunkText(), Range, splitWords(), detectNer(), esc(), isWordChar(), LABELS (+2 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.13
Nodes (14): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noUnusedLocals (+6 more)

## Knowledge Gaps
- **11 isolated node(s):** `Claire Fontaine (fictitious contract party, claire@nexora.example)`, `sample.docx converted (contract fixture)`, `index.html (Vite entry page)`, `#root mount div`, `React + TS + Vite + Tailwind v4 + Vitest` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 85 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Regex & Vault Mapping` to `App & Entity UI`, `Dev Dependencies`, `Runtime Deps & File Import`, `Chunking & NER Fusion`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **What connects `Claire Fontaine (fictitious contract party, claire@nexora.example)`, `sample.docx converted (contract fixture)`, `index.html (Vite entry page)` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Runtime Deps & File Import` to `App & Entity UI`, `Dev Dependencies`, `Header, useNer & NER Worker`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `GitHub Pages Workflow` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Runtime Deps & File Import` be split into smaller, more focused modules?**
  _Cohesion score 0.09538461538461539 - nodes in this community are weakly interconnected._
- **Should `Project Docs & Architecture` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._