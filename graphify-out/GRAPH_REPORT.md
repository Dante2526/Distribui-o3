# Graph Report - C:\Users\nayla\.antigravity\Distribui-o2 (2026-07-14)

## Corpus Check

- cluster-only mode — file stats not available

## Summary

- 348 nodes · 679 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `d342c938`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- HistoryModal.tsx
- types.ts
- App.tsx
- RowPortalsContext.tsx
- dependencies
- devDependencies
- ModalsContainer.tsx
- compilerOptions
- package.json
- ErrorBoundary
- RadialMenu.tsx
- ThemeSelectionScreen.tsx
- CustomDatePicker.tsx
- limpar.js

## God Nodes (most connected - your core abstractions)

1. `TurmaType` - 15 edges
2. `Department` - 15 edges
3. `compilerOptions` - 15 edges
4. `HistoryModal()` - 14 edges
5. `AppContent()` - 13 edges
6. `Employee` - 13 edges
7. `useViewportStyles()` - 11 edges
8. `firestoreService` - 11 edges
9. `SupportRole` - 11 edges
10. `ActiveEdit` - 10 edges

## Surprising Connections (you probably didn't know these)

- `generateDailyReportPDF()` --references--> `jspdf` [EXTRACTED]
  src/utils/pdfGenerator.ts → package.json
- `exportToZip()` --references--> `jszip` [EXTRACTED]
  src/utils/exportService.ts → package.json
- `AppContent()` --references--> `react` [EXTRACTED]
  src/App.tsx → package.json
- `HistoryModal()` --references--> `react` [EXTRACTED]
  src/components/modals/HistoryModal.tsx → package.json
- `ReportModal()` --references--> `react` [EXTRACTED]
  src/components/modals/ReportModal.tsx → package.json

## Import Cycles

- None detected.

## Communities (17 total, 1 thin omitted)

### Community 0 - "HistoryModal.tsx"

Cohesion: 0.07
Nodes (28): jspdf, jspdf, ExportDropdownProps, HistoryModal(), STATUS_CONFIG, STATUS_DOT_COLORS, DocIcon(), DownloadIcon() (+20 more)

### Community 1 - "types.ts"

Cohesion: 0.12
Nodes (29): AnnotationItemRow, AnnotationsBoard, AuditLogModalProps, ImportEmployeeModalProps, TurmaSelectionScreen(), TurmaSelectionScreenProps, UseBoardMutationsProps, UseDragAndDropProps (+21 more)

### Community 2 - "App.tsx"

Cohesion: 0.10
Nodes (22): AppContent(), EMPTY_OBJECT, ExchangeIcon(), HelpIcon(), Footer(), AdminModal(), Sidebar, SidebarProps (+14 more)

### Community 3 - "RowPortalsContext.tsx"

Cohesion: 0.10
Nodes (30): DepartmentCard, DeptIcon(), DeptIconProps, BORDER_LEFT_MAP, EmployeeRow, SWAP_HOVER_MAP, PortalMenu(), SpecialShiftSlot (+22 more)

### Community 4 - "dependencies"

Cohesion: 0.05
Nodes (37): @dnd-kit/core, @dnd-kit/modifiers, @dnd-kit/sortable, @dnd-kit/utilities, dotenv, express, firebase, @google/genai (+29 more)

### Community 5 - "devDependencies"

Cohesion: 0.06
Nodes (32): autoprefixer, husky, jsdom, lint-staged, vite, devDependencies, autoprefixer, husky (+24 more)

### Community 6 - "ModalsContainer.tsx"

Cohesion: 0.12
Nodes (16): ModalProps, AddAdminModal(), AddUserModal(), AdminPasswordModal(), AuditLogModal(), dateTimeFormatter, timeFormatter, ConfirmBiometricModal (+8 more)

### Community 7 - "compilerOptions"

Cohesion: 0.11
Nodes (18): DOM, DOM.Iterable, ES2022, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules (+10 more)

### Community 8 - "package.json"

Cohesion: 0.14
Nodes (13): lint-staged, *.{ts,tsx,js,jsx,css,md,html,json}, name, private, scripts, build, clean, dev (+5 more)

### Community 9 - "ErrorBoundary"

Cohesion: 0.22
Nodes (4): ErrorBoundary, ErrorBoundaryBase, ErrorBoundaryProps, ErrorBoundaryState

### Community 10 - "RadialMenu.tsx"

Cohesion: 0.25
Nodes (3): menuItems, RadialMenu, RadialMenuProps

### Community 12 - "CustomDatePicker.tsx"

Cohesion: 0.33
Nodes (4): CustomDatePickerProps, DayData, DAYS_OF_WEEK, MONTHS

### Community 13 - "limpar.js"

Cohesion: 0.50
Nodes (4): ANCHOR_DATES, isDiaDeTrabalho(), onRequest(), TODO: Adicionar turmas A, B e C quando suas datas-âncora forem definidas.

## Knowledge Gaps

- **95 isolated node(s):** `ANCHOR_DATES`, `name`, `private`, `version`, `type` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`, `HistoryModal.tsx`, `devDependencies`?**
  _High betweenness centrality (0.339) - this node is a cross-community bridge._
- **Why does `react` connect `dependencies` to `HistoryModal.tsx`, `App.tsx`, `ModalsContainer.tsx`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **What connects `ANCHOR_DATES`, `name`, `private` to the rest of the system?**
  _95 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `HistoryModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06966618287373004 - nodes in this community are weakly interconnected._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11627906976744186 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09878048780487805 - nodes in this community are weakly interconnected._
