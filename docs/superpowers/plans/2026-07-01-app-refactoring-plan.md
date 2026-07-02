# Refatoração do App.tsx Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extrair estados de dados, lógica de Drag and Drop e modais do `App.tsx` para Custom Hooks e componentes dedicados.

**Architecture:** Mover a lógica de estado global para `src/hooks/useDashboardData.ts`, a lógica de drag and drop para `src/hooks/useDragAndDrop.ts` e a montagem de modais para `src/components/modals/ModalsContainer.tsx`.

**Tech Stack:** React, TypeScript, Firebase, Dnd-Kit.

## Global Constraints

- Manter o comportamento original de Drag and Drop inalterado.
- Garantir que não haja quebras de sincronização com o Firestore.
- Preservar as tipagens e interfaces existentes de `Employee`.

---

### Task 1: Criar o hook useDashboardData

**Files:**
- Create: `src/hooks/useDashboardData.ts`
- Modify: N/A

**Interfaces:**
- Consumes: Firestore imports and standard initial constants.
- Produces: `useDashboardData()` Hook retornando `departmentsData`, `specialShiftData`, `supportRolesData`, functions como `setDepartmentsData`, `fetchLogs`, etc.

- [ ] **Step 1: Write the minimal implementation**

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { onSnapshot, collection, doc } from 'firebase/firestore';
import { dbRegistros } from '../lib/firebase';
import { Employee } from '../types';

export function useDashboardData() {
  const [departmentsData, setDepartmentsData] = useState<any[]>([]);
  const [specialShiftData, setSpecialShiftData] = useState<Employee[]>([]);
  const [supportRolesData, setSupportRolesData] = useState<Employee[][]>([[], [], []]);
  
  const healEmployee = (emp: any): Employee => ({
    id: emp.id || crypto.randomUUID(),
    name: emp.name || 'Desconhecido',
    role: emp.role || '',
    department: emp.department || '',
    line: emp.line || '',
    machine: emp.machine || '',
    turma: emp.turma || ''
  });

  return { 
    departmentsData, setDepartmentsData, 
    specialShiftData, setSpecialShiftData, 
    supportRolesData, setSupportRolesData,
    healEmployee
  };
}
```

- [ ] **Step 2: Check compiler rules (no tests for UI logic now)**
Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDashboardData.ts
git commit -m "refactor: create useDashboardData hook shell"
```

---

### Task 2: Criar o hook useDragAndDrop

**Files:**
- Create: `src/hooks/useDragAndDrop.ts`
- Modify: N/A

**Interfaces:**
- Consumes: `DragStartEvent`, `DragOverEvent`, `DragEndEvent` from `@dnd-kit/core`.
- Produces: `useDragAndDrop` returning `handleDragStart`, `handleDragOver`, `handleDragEnd`.

- [ ] **Step 1: Write the hook shell**

```typescript
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';

export function useDragAndDrop(deps: any) {
  const handleDragStart = (event: DragStartEvent) => {
    // Logic goes here
  };
  const handleDragOver = (event: DragOverEvent) => {
    // Logic goes here
  };
  const handleDragEnd = (event: DragEndEvent) => {
    // Logic goes here
  };

  return { handleDragStart, handleDragOver, handleDragEnd };
}
```

- [ ] **Step 2: Check compiler**
Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDragAndDrop.ts
git commit -m "refactor: create useDragAndDrop hook shell"
```

---

### Task 3: Criar ModalsContainer

**Files:**
- Create: `src/components/modals/ModalsContainer.tsx`

**Interfaces:**
- Consumes: `AdminModal`, `ReportModal`, etc.
- Produces: Um componente unificado que agrupa todos os renders de Modals baseados em estado.

- [ ] **Step 1: Write the container component**

```typescript
import React from 'react';
import { AdminModal } from './AdminModal';
import { ReportModal } from './ReportModal';
// ... other imports

export function ModalsContainer(props: any) {
  return (
    <>
      <AdminModal isOpen={props.isAdminModalOpen} {...props.adminProps} />
      <ReportModal isOpen={props.isReportModalOpen} {...props.reportProps} />
      {/* ... outros modais */}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/ModalsContainer.tsx
git commit -m "refactor: create ModalsContainer"
```

---

### Task 4: Integrar hooks no App.tsx e Limpar

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useDashboardData`, `useDragAndDrop`, `ModalsContainer`.

- [ ] **Step 1: Migrate states and logics**
Substituir centenas de linhas de `useState` locais pelas chamadas:
```typescript
const { departmentsData, setDepartmentsData } = useDashboardData();
const { handleDragStart, handleDragOver, handleDragEnd } = useDragAndDrop({ departmentsData, setDepartmentsData });
```
Mover a lista de modais do fim do JSX para:
```tsx
<ModalsContainer {...modalProps} />
```

- [ ] **Step 2: Verify application compilation**
Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/App.tsx
git commit -m "refactor: integrate hooks and clear App.tsx"
```
