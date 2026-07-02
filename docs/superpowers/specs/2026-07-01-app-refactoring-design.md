# Design Spec: Refatoração do App.tsx

**Data:** 2026-07-01
**Tópico:** Desmembramento do God Object (App.tsx)

## 1. Objetivo
Reduzir a complexidade e o tamanho do arquivo principal `App.tsx` (atualmente com +3000 linhas), aplicando os princípios de *Single Responsibility* e *Separation of Concerns*. Isso facilitará manutenções futuras, melhorará o uso de tokens por agentes de IA e reduzirá riscos de regressão no código.

## 2. Arquitetura Proposta

### 2.1 Separação de Estados (Dados e Lógica de Negócio)
Será criado um ou mais Custom Hooks dedicados a encapsular as lógicas de leitura/escrita e estados pesados que atualmente residem no escopo visual do `App.tsx`:
- **`useDashboardData.ts`**: Ficará responsável por `departmentsData`, `specialShiftData`, `supportRolesData`, `annotationsLeft/Right`, incluindo a conexão com o Firebase (listeners `onSnapshot`).

### 2.2 Lógica de Interação (Drag and Drop)
A lógica complexa de manipulação dos eventos de arraste será encapsulada:
- **`useDragAndDrop.ts`**: Ficará responsável por inicializar os sensores de ponteiro, funções como `handleDragStart`, `handleDragOver` e `handleDragEnd`, devolvendo apenas as funções disparadoras para o JSX visual.

### 2.3 Camada Visual (Modais)
- O `App.tsx` possui dezenas de `Modals` acoplados ao seu retorno de renderização.
- Será criado um **`ModalsContainer.tsx`** na pasta de componentes que receberá as flags booleanas (`isOpen`, etc) e as callbacks como Props.
- O `App.tsx` ficará limpo, renderizando apenas o Navbar/Header, o contexto `DndContext` encapsulando as listas (Colunas de Departamentos) e `<ModalsContainer />`.

## 3. Critérios de Sucesso
- `App.tsx` deverá ter seu tamanho reduzido de forma drástica (idealmente abaixo de 500-800 linhas).
- Não poderá haver perda de estado durante o Drag and Drop (o comportamento original deve permanecer idêntico).
- Sincronização com o Firebase não poderá sofrer regressões (leituras duplicadas ou loop infinito).

## 4. Plano de Transição (Próximos Passos)
Após a aprovação desta Spec Document, a skill `writing-plans` será acionada para formalizar a sequência exata de commits e extrações seguras a serem executadas.
