const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(appTsxPath, 'utf8');

function extractBlock(code, startMarker) {
    const startIndex = code.indexOf(startMarker);
    if (startIndex === -1) return { block: '', newCode: code };

    let openBraces = 0;
    let i = startIndex;
    let foundFirstBrace = false;

    // Fast-forward to the first opening brace after the start marker
    while (i < code.length) {
        if (code[i] === '{') {
            openBraces++;
            foundFirstBrace = true;
            i++;
            break;
        }
        i++;
    }

    while (i < code.length && openBraces > 0) {
        if (code[i] === '{') openBraces++;
        if (code[i] === '}') openBraces--;
        i++;
    }

    // Now i is right after the matching closing brace.
    // However, it's usually followed by `, [deps]);\n`
    while (i < code.length) {
        if (code.startsWith(');', i)) {
            i += 2;
            break;
        }
        i++;
    }
    
    // consume trailing newline
    if (code[i] === '\n') i++;
    if (code[i] === '\r' && code[i+1] === '\n') i += 2;

    const block = code.substring(startIndex, i);
    const newCode = code.substring(0, startIndex) + code.substring(i);
    
    return { block, newCode };
}

const handlers = [
    "const handleClearAll = useCallback(",
    "const handleGenerateReport = useCallback(",
    "const handleReorganize = useCallback(",
    "const handleUpdateSpecialShiftEmployee = useCallback(",
    "const handleTransferToSpecialShift = useCallback(",
    "const handleTransferSupportToSpecialShift = useCallback(",
    "const handleTransferFromSpecialShift = useCallback(",
    "const handleUpdateAnnotationLeft = useCallback(",
    "const handleUpdateAnnotationRight = useCallback(",
    "const handleUpdateSupportRole = useCallback(",
    "const handleUpdateSupportName = useCallback(",
    "const handleUpdateSupportMatricula = useCallback(",
    "const handleDeleteSupport = useCallback(",
    "const handleMoveSupport = useCallback(",
    "const handleMove = useCallback(",
    "const handleUpdateEmployeeField = useCallback(",
    "const handleDelete = useCallback(",
    "const handleMarkEmployeeAbsent = useCallback(",
    "const handleMarkSupportAbsent = useCallback("
];

let extractedBlocks = [];
for (const h of handlers) {
    const res = extractBlock(code, h);
    if (res.block) {
        extractedBlocks.push(res.block);
        code = res.newCode;
    } else {
        console.log("NOT FOUND: ", h);
    }
}

// Generate useBoardMutations.ts
const hookCode = `import { useCallback } from "react";
import type { Department, SupportRole, SpecialShift, Employee } from "../types";

export interface UseBoardMutationsProps {
  departmentsData: Department[];
  setDepartmentsData: React.Dispatch<React.SetStateAction<Department[]>>;
  supportRolesData: SupportRole[][];
  setSupportRolesData: React.Dispatch<React.SetStateAction<SupportRole[][]>>;
  specialShiftData: SpecialShift[];
  setSpecialShiftData: React.Dispatch<React.SetStateAction<SpecialShift[]>>;
  annotationsLeft: string;
  setAnnotationsLeft: React.Dispatch<React.SetStateAction<string>>;
  annotationsRight: string;
  setAnnotationsRight: React.Dispatch<React.SetStateAction<string>>;
  logMovement: (
    empName: string,
    fromStr: string,
    toStr: string,
    line?: string,
    matricula?: string
  ) => void;
  selectedTurma: string | null;
  showToastMessage: (message: string, type?: "success" | "error" | "info") => void;
  reportContent: string;
  setReportContent: React.Dispatch<React.SetStateAction<string>>;
  setReportStats: React.Dispatch<React.SetStateAction<any>>;
  setIsReportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useBoardMutations({
  departmentsData,
  setDepartmentsData,
  supportRolesData,
  setSupportRolesData,
  specialShiftData,
  setSpecialShiftData,
  annotationsLeft,
  setAnnotationsLeft,
  annotationsRight,
  setAnnotationsRight,
  logMovement,
  selectedTurma,
  showToastMessage,
  reportContent,
  setReportContent,
  setReportStats,
  setIsReportModalOpen
}: UseBoardMutationsProps) {



${extractedBlocks.join('\n\n')}

  return {
    handleClearAll,
    handleGenerateReport,
    handleReorganize,
    handleUpdateSpecialShiftEmployee,
    handleTransferToSpecialShift,
    handleTransferSupportToSpecialShift,
    handleTransferFromSpecialShift,
    handleUpdateAnnotationLeft,
    handleUpdateAnnotationRight,
    handleUpdateSupportRole,
    handleUpdateSupportName,
    handleUpdateSupportMatricula,
    handleDeleteSupport,
    handleMoveSupport,
    handleMove,
    handleUpdateEmployeeField,
    handleDelete,
    handleMarkEmployeeAbsent,
    handleMarkSupportAbsent
  };
}
`;

fs.writeFileSync(path.join(__dirname, 'src', 'hooks', 'useBoardMutations.ts'), hookCode, 'utf8');

// Insert the hook call in App.tsx
// Find where to insert it, right after useBoardPanZoom
const insertMarker = "} = useBoardPanZoom(isAdmin, activePage, selectedTurma);";
const insertIndex = code.indexOf(insertMarker) + insertMarker.length;

const hookCall = `

  const {
    handleClearAll,
    handleGenerateReport,
    handleReorganize,
    handleUpdateSpecialShiftEmployee,
    handleTransferToSpecialShift,
    handleTransferSupportToSpecialShift,
    handleTransferFromSpecialShift,
    handleUpdateAnnotationLeft,
    handleUpdateAnnotationRight,
    handleUpdateSupportRole,
    handleUpdateSupportName,
    handleUpdateSupportMatricula,
    handleDeleteSupport,
    handleMoveSupport,
    handleMove,
    handleUpdateEmployeeField,
    handleDelete,
    handleMarkEmployeeAbsent,
    handleMarkSupportAbsent
  } = useBoardMutations({
    departmentsData,
    setDepartmentsData,
    supportRolesData,
    setSupportRolesData,
    specialShiftData,
    setSpecialShiftData,
    annotationsLeft,
    setAnnotationsLeft,
    annotationsRight,
    setAnnotationsRight,
    logMovement,
    selectedTurma,
    showToastMessage,
    reportContent,
    setReportContent,
    setReportStats,
    setIsReportModalOpen
  });`;

code = code.substring(0, insertIndex) + hookCall + code.substring(insertIndex);

// Add import
const importMarker = 'import { useBoardPanZoom } from "./hooks/useBoardPanZoom";';
code = code.replace(importMarker, importMarker + '\nimport { useBoardMutations } from "./hooks/useBoardMutations";');

fs.writeFileSync(appTsxPath, code, 'utf8');
console.log("Phase 5 extracted successfully!");
